"use client";
import React, { useState } from "react";
import { OrderFormModal } from "./OrderFormModal";
import { useOrderForm } from "./useOrderForm";
import { generateInvoicePDF, getOrderSummaryText } from "./invoiceUtils";
import { SOCIETIES } from "./constants";

export default function Dashboard() {
  const orderForm = useOrderForm();
  const {
    showModal,
    setShowModal,
    orderList,
    filterDeliveryDate,
    setFilterDeliveryDate,
    filterSocityName,
    setFilterSocityName,
    filteredOrders,
    dashboardStats,
  } = orderForm;
  const [discountFilter, setDiscountFilter] = useState<string>("");

  // --- KPI Analytics ---
  // Calculate KPIs from filteredOrders
  // Apply discount filter to filteredOrders
  const filteredByDiscount = filteredOrders.filter((order: any) => {
    if (discountFilter === "applied") return (order.discount || 0) > 0;
    if (discountFilter === "not-applied") return (order.discount || 0) === 0;
    return true;
  });
  const totalOrders = dashboardStats.totalOrders;
  const totalAmountWithoutDiscount = filteredByDiscount.reduce(
    (sum: number, order: any) => sum + (order.totalAmount || 0),
    0
  );
  const totalAmountWithDiscount = filteredByDiscount.reduce(
    (sum: number, order: any) => sum + (order.finalAmount || 0),
    0
  );
  // Aggregate items ordered from filteredOrders
  const itemMap: Record<
    string,
    { quantity: number; unit: string; amount: number }
  > = {};
  filteredByDiscount.forEach((order: any) => {
    order.items.forEach((item: any) => {
      const key = item.name + "-" + (item.unit || "GM");
      if (!itemMap[key]) {
        itemMap[key] = { quantity: 0, unit: item.unit || "GM", amount: 0 };
      }
      itemMap[key].quantity += Number(item.quantity);
      itemMap[key].amount += Number(item.price);
    });
  });
  const orderedItems = Object.entries(itemMap);

  // --- Group items by name, quantity, and unit, count packages ---
  const itemPackageCount: Record<
    string,
    { name: string; quantity: number; unit: string; count: number }
  > = {};
  filteredByDiscount.forEach((order: any) => {
    order.items.forEach((item: any) => {
      const key = `${item.name}-${item.quantity}-${item.unit || "GM"}`;
      if (!itemPackageCount[key]) {
        itemPackageCount[key] = {
          name: item.name,
          quantity: Number(item.quantity),
          unit: item.unit || "GM",
          count: 0,
        };
      }
      itemPackageCount[key].count += 1;
    });
  });
  const groupedPackages = Object.values(itemPackageCount);

  // Group flat numbers by socity name and sort flats ascending
  const flatsBySocity: Record<string, string[]> = {};
  filteredByDiscount.forEach((order: any) => {
    if (!flatsBySocity[order.socityName]) {
      flatsBySocity[order.socityName] = [];
    }
    if (
      order.flatNumber &&
      !flatsBySocity[order.socityName].includes(order.flatNumber)
    ) {
      flatsBySocity[order.socityName].push(order.flatNumber);
    }
  });
  // Sort flats for each socity, ignoring spaces and dashes in flat number
  Object.keys(flatsBySocity).forEach((socity) => {
    flatsBySocity[socity].sort((a, b) => {
      const normalize = (str: string) =>
        str.replace(/[\s-]/g, "").toUpperCase();
      return normalize(a).localeCompare(normalize(b), undefined, {
        numeric: true,
        sensitivity: "base",
      });
    });
  });

  return (
    <div className="p-8">
      <h1 className="text-2xl font-bold mb-4">Order Dashboard</h1>
      {/* Filter Controls */}
      <div className="flex flex-wrap gap-4 mb-6 items-center">
        <div>
          <label className="block text-sm font-semibold mb-1">
            Delivery Date
          </label>
          <input
            type="date"
            className="border rounded px-3 py-2"
            value={filterDeliveryDate || ""}
            onChange={(e) => setFilterDeliveryDate(e.target.value)}
          />
        </div>
        <div>
          <label className="block text-sm font-semibold mb-1">
            Socity Name
          </label>
          <select
            className="border rounded px-3 py-2"
            value={filterSocityName || ""}
            onChange={(e) => setFilterSocityName(e.target.value)}
          >
            <option value="">All</option>
            {SOCIETIES.map((soc: string) => (
              <option key={soc} value={soc}>
                {soc}
              </option>
            ))}
          </select>
        </div>
        <div>
          <label className="block text-sm font-semibold mb-1">Discount Filter</label>
          <select
            className="border rounded px-3 py-2"
            value={discountFilter}
            onChange={(e) => setDiscountFilter(e.target.value)}
          >
            <option value="">All</option>
            <option value="applied">Discount Applied</option>
            <option value="not-applied">No Discount</option>
          </select>
        </div>
      </div>
      {/* Flats Grouped by Socity Name */}
      <div className="mb-6 bg-gray-50 p-4 rounded shadow">
        <div className="text-lg font-semibold mb-2">Flats by Socity Name</div>
        <div className="grid grid-cols-4 gap-4">
          {Object.entries(flatsBySocity).map(([socity, flats]) => (
            <div key={socity} className="bg-white rounded shadow p-3">
              <div className="font-bold text-blue-700 mb-2">{socity}</div>
              <ul className="list-disc ml-5">
                {flats.map((flat) => {
                  // Calculate final payment amount for this flat in this socity
                  const flatOrders = filteredByDiscount.filter(
                    (order: any) =>
                      order.socityName === socity && order.flatNumber === flat
                  );
                  const totalFinalAmount = flatOrders.reduce(
                    (sum: number, order: any) => sum + (order.finalAmount || 0),
                    0
                  );
                  return (
                    <li key={flat}>
                      {flat}{" "}
                      <span className="text-green-700 font-semibold">
                        ₹{totalFinalAmount}
                      </span>
                    </li>
                  );
                })}
              </ul>
            </div>
          ))}
        </div>
      </div>
      {/* KPI Analytics Section */}
      <div className="mb-6 grid grid-cols-4 gap-4">
        <div className="bg-blue-50 p-4 rounded shadow">
          <div className="text-lg font-semibold">Total Orders</div>
          <div className="text-2xl font-bold text-blue-700">{totalOrders}</div>
        </div>
        <div className="bg-green-50 p-4 rounded shadow">
          <div className="text-lg font-semibold">
            Total Amount (No Discount)
          </div>
          <div className="text-2xl font-bold text-green-700">
            ₹{totalAmountWithoutDiscount}
          </div>
        </div>
        <div className="bg-purple-50 p-4 rounded shadow">
          <div className="text-lg font-semibold">
            Total Amount (With Discount)
          </div>
          <div className="text-2xl font-bold text-purple-700">
            ₹{totalAmountWithDiscount}
          </div>
        </div>
        <div className="bg-yellow-50 p-4 rounded shadow">
          <div className="text-lg font-semibold mb-2">Items Ordered</div>
          <ul className="space-y-1 text-sm">
            {orderedItems.map(([key, val]) => (
              <li key={key}>
                <span className="font-semibold">{key.split("-")[0]}</span> -
                <span>
                  {" "}
                  {val.quantity} {val.unit}
                </span>{" "}
                -<span> ₹{val.amount}</span>
              </li>
            ))}
          </ul>
        </div>
      </div>
      {/* Items Grouped by Quantity & Unit (Package Count) */}
      <div className="mb-6 bg-gray-50 p-4 rounded shadow">
        <div className="text-lg font-semibold mb-2">
          Items Grouped by Quantity & Unit
        </div>
        <ul className="space-y-1 text-sm">
          {groupedPackages.map((pkg) => (
            <li key={`${pkg.name}-${pkg.quantity}-${pkg.unit}`}>
              <span className="font-semibold">{pkg.name}</span>{" "}
              <span>
                {pkg.quantity} {pkg.unit}
              </span>{" "}
              -{" "}
              <span className="text-blue-700 font-bold">
                {pkg.count} package{pkg.count > 1 ? "s" : ""}
              </span>
            </li>
          ))}
        </ul>
      </div>
      <div className="mb-6 flex items-center justify-between">
        <div>
          <span className="text-lg font-semibold">Total Orders: </span>
          <span className="text-xl text-blue-600 font-bold">
            {orderList.length}
          </span>
        </div>
        <button
          className="bg-blue-600 text-white px-4 py-2 rounded shadow hover:bg-blue-700"
          onClick={() => setShowModal(true)}
        >
          + Create Order
        </button>
      </div>
      <div className="overflow-x-auto">
        <table className="min-w-full bg-white border border-gray-200 rounded-lg shadow">
          <thead className="bg-gray-100">
            <tr>
              <th className="px-4 py-2 text-left">Customer Number</th>
              <th className="px-4 py-2 text-left">Flat Number</th>
              <th className="px-4 py-2 text-left">Socity Name</th>
              <th className="px-4 py-2 text-left">Items</th>
              <th className="px-4 py-2 text-left">Delivery Date</th>
              <th className="px-4 py-2 text-left">Actions</th>
            </tr>
          </thead>
          <tbody>
            {filteredByDiscount.map((order: any, idx: number) => (
              <tr key={idx} className="border-t">
                <td className="px-4 py-2">{order.customerNumber}</td>
                <td className="px-4 py-2">{order.flatNumber}</td>
                <td className="px-4 py-2">{order.socityName}</td>
                <td className="px-4 py-2">
                  <span className="block mb-2 font-semibold">
                    Status:{" "}
                    <span
                      className={
                        order.status === "Delivered"
                          ? "text-green-600"
                          : "text-yellow-600"
                      }
                    >
                      {order.status}
                    </span>
                  </span>
                  <span className="block mb-2">
                    Discount: ₹{order.discount || 0}
                  </span>
                  <span className="block mb-2">
                    Total Amount: ₹{order.totalAmount || 0}
                  </span>
                  <span className="block mb-2 font-bold">
                    Final Amount: ₹
                    {order.finalAmount === 0 ? "Free" : order.finalAmount}
                  </span>
                  <ul className="space-y-2">
                    {order.items.map((item: any, i: number) => (
                      <li key={i} className="bg-gray-50 p-2 rounded">
                        <div className="grid grid-cols-4 gap-2">
                          <span className="font-semibold">{item.name}</span>
                          <span>Qty: {item.quantity}</span>
                          <span>Unit: {item.unit}</span>
                          <span>Price: ₹{item.price}</span>
                        </div>
                      </li>
                    ))}
                  </ul>
                </td>
                <td className="px-4 py-2">
                  {order.deliveryDate
                    ? new Date(order.deliveryDate).toLocaleDateString()
                    : "-"}
                </td>
                <td className="px-4 py-2">
                  <button
                    className="bg-red-500 text-white px-2 py-1 rounded mr-2 hover:bg-red-600"
                    onClick={() => orderForm.deleteOrder(order._id)}
                  >
                    Delete
                  </button>
                  <button
                    className="bg-yellow-500 text-white px-2 py-1 rounded hover:bg-yellow-600"
                    onClick={() => orderForm.startEditOrder(order)}
                  >
                    Edit
                  </button>
                  <button
                    className="bg-blue-500 text-white px-2 py-1 rounded ml-2 hover:bg-blue-600"
                    onClick={() => generateInvoicePDF(order)}
                  >
                    Download Invoice
                  </button>
                  <button
                    className="bg-green-500 text-white px-2 py-1 rounded ml-2 hover:bg-green-600"
                    onClick={() => {
                      const summary = getOrderSummaryText(order);
                      navigator.clipboard.writeText(summary);
                    }}
                  >
                    Copy Summary
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <OrderFormModal {...orderForm} />
    </div>
  );
}
