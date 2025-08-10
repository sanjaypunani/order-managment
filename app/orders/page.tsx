"use client";
import React, { useState } from "react";
import { OrderFormModal } from "../dashboard/OrderFormModal";
import { useOrderForm } from "../dashboard/useOrderForm";
import {
  generateInvoicePDF,
  getOrderSummaryText,
} from "../dashboard/invoiceUtils";
import { SOCIETIES } from "../dashboard/constants";

export default function Orders() {
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
  } = orderForm;
  const [discountFilter, setDiscountFilter] = useState<string>("");

  // Apply discount filter to filteredOrders
  const filteredByDiscount = filteredOrders.filter((order: any) => {
    if (discountFilter === "applied") return (order.discount || 0) > 0;
    if (discountFilter === "not-applied") return (order.discount || 0) === 0;
    return true;
  });

  return (
    <div>
      <h1 className="text-2xl font-bold mb-4">Order Management</h1>

      {/* Filter Controls */}
      <div className="flex flex-wrap gap-4 lg:gap-6 xl:gap-8 mb-6 items-center">
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
            Society Name
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
          <label className="block text-sm font-semibold mb-1">
            Discount Filter
          </label>
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

      {/* Order Summary */}
      <div className="mb-6 flex items-center justify-between">
        <div>
          <span className="text-lg font-semibold">Total Orders: </span>
          <span className="text-xl text-blue-600 font-bold">
            {orderList.length}
          </span>
          <span className="ml-4 text-lg font-semibold">Filtered Orders: </span>
          <span className="text-xl text-green-600 font-bold">
            {filteredByDiscount.length}
          </span>
        </div>
        <button
          className="bg-blue-600 text-white px-4 py-2 rounded shadow hover:bg-blue-700"
          onClick={() => setShowModal(true)}
        >
          + Create Order
        </button>
      </div>

      {/* Orders Table */}
      <div className="overflow-x-auto">
        <table className="min-w-full bg-white border border-gray-200 rounded-lg shadow">
          <thead className="bg-gray-100">
            <tr>
              <th className="px-4 py-2 lg:px-6 lg:py-3 xl:px-8 xl:py-4 text-left">
                Customer Name
              </th>
              <th className="px-4 py-2 lg:px-6 lg:py-3 xl:px-8 xl:py-4 text-left">
                Customer Number
              </th>
              <th className="px-4 py-2 lg:px-6 lg:py-3 xl:px-8 xl:py-4 text-left">
                Flat Number
              </th>
              <th className="px-4 py-2 lg:px-6 lg:py-3 xl:px-8 xl:py-4 text-left">
                Society Name
              </th>
              <th className="px-4 py-2 lg:px-6 lg:py-3 xl:px-8 xl:py-4 text-left">
                Items
              </th>
              <th className="px-4 py-2 lg:px-6 lg:py-3 xl:px-8 xl:py-4 text-left">
                Delivery Date
              </th>
              <th className="px-4 py-2 lg:px-6 lg:py-3 xl:px-8 xl:py-4 text-left">
                Actions
              </th>
            </tr>
          </thead>
          <tbody>
            {filteredByDiscount.map((order: any, idx: number) => (
              <tr key={idx} className="border-t hover:bg-gray-50">
                <td className="px-4 py-2 lg:px-6 lg:py-3 xl:px-8 xl:py-4 font-medium">
                  {order.customerName || "Unnamed"}
                </td>
                <td className="px-4 py-2 lg:px-6 lg:py-3 xl:px-8 xl:py-4">
                  {order.customerNumber}
                </td>
                <td className="px-4 py-2 lg:px-6 lg:py-3 xl:px-8 xl:py-4">
                  {order.flatNumber}
                </td>
                <td className="px-4 py-2 lg:px-6 lg:py-3 xl:px-8 xl:py-4">
                  {order.socityName}
                </td>
                <td className="px-4 py-2 lg:px-6 lg:py-3 xl:px-8 xl:py-4">
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
                <td className="px-4 py-2 lg:px-6 lg:py-3 xl:px-8 xl:py-4">
                  {order.deliveryDate
                    ? new Date(order.deliveryDate).toLocaleDateString()
                    : "-"}
                </td>
                <td className="px-4 py-2 lg:px-6 lg:py-3 xl:px-8 xl:py-4">
                  <div className="flex flex-col space-y-1">
                    <button
                      className="bg-red-500 text-white px-2 py-1 rounded text-xs hover:bg-red-600"
                      onClick={() => orderForm.deleteOrder(order._id)}
                    >
                      Delete
                    </button>
                    <button
                      className="bg-yellow-500 text-white px-2 py-1 rounded text-xs hover:bg-yellow-600"
                      onClick={() => orderForm.startEditOrder(order)}
                    >
                      Edit
                    </button>
                    <button
                      className="bg-blue-500 text-white px-2 py-1 rounded text-xs hover:bg-blue-600"
                      onClick={() => generateInvoicePDF(order)}
                    >
                      Invoice
                    </button>
                    <button
                      className="bg-green-500 text-white px-2 py-1 rounded text-xs hover:bg-green-600"
                      onClick={() => {
                        const summary = getOrderSummaryText(order);
                        navigator.clipboard.writeText(summary);
                      }}
                    >
                      Copy
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Order Form Modal */}
      <OrderFormModal {...orderForm} />
    </div>
  );
}
