"use client";
import React from "react";
import { useAnalytics } from "./useAnalytics";
import { SOCIETIES } from "./constants";

export default function Dashboard() {
  const analytics = useAnalytics();
  const {
    filterDeliveryDate,
    setFilterDeliveryDate,
    filterSocityName,
    setFilterSocityName,
    discountFilter,
    setDiscountFilter,
    totalOrders,
    totalAmountWithoutDiscount,
    totalAmountWithDiscount,
    orderedItems,
    groupedPackages,
    flatsBySocity,
    filteredByDiscount,
    loading,
  } = analytics;

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-64">
        <div className="text-lg">Loading analytics...</div>
      </div>
    );
  }

  return (
    <div>
      <h1 className="text-2xl font-bold mb-4">Analytics Dashboard</h1>
      
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

      {/* KPI Analytics Section */}
      <div className="mb-6 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-blue-50 p-4 rounded shadow">
          <div className="text-lg font-semibold">Total Orders</div>
          <div className="text-2xl font-bold text-blue-700">{totalOrders}</div>
        </div>
        <div className="bg-green-50 p-4 rounded shadow">
          <div className="text-lg font-semibold">
            Total Amount (No Discount)
          </div>
          <div className="text-2xl font-bold text-green-700">
            ₹{totalAmountWithoutDiscount.toLocaleString()}
          </div>
        </div>
        <div className="bg-purple-50 p-4 rounded shadow">
          <div className="text-lg font-semibold">
            Total Amount (With Discount)
          </div>
          <div className="text-2xl font-bold text-purple-700">
            ₹{totalAmountWithDiscount.toLocaleString()}
          </div>
        </div>
        <div className="bg-orange-50 p-4 rounded shadow">
          <div className="text-lg font-semibold">Total Savings</div>
          <div className="text-2xl font-bold text-orange-700">
            ₹{(totalAmountWithoutDiscount - totalAmountWithDiscount).toLocaleString()}
          </div>
        </div>
      </div>

      {/* Flats Grouped by Society Name */}
      <div className="mb-6 bg-gray-50 p-4 rounded shadow">
        <div className="text-lg font-semibold mb-2">Flats by Society Name</div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {Object.entries(flatsBySocity).map(([socity, flats]) => (
            <div key={socity} className="bg-white rounded shadow p-3">
              <div className="font-bold text-blue-700 mb-2">{socity}</div>
              <ul className="list-disc ml-5 space-y-1">
                {flats.map((flat) => {
                  // Calculate final payment amount for this flat in this society
                  const flatOrders = filteredByDiscount.filter(
                    (order: any) =>
                      order.socityName === socity && order.flatNumber === flat
                  );
                  const totalFinalAmount = flatOrders.reduce(
                    (sum: number, order: any) => sum + (order.finalAmount || 0),
                    0
                  );
                  return (
                    <li key={flat} className="text-sm">
                      {flat}{" "}
                      <span className="text-green-700 font-semibold">
                        ₹{totalFinalAmount.toLocaleString()}
                      </span>
                    </li>
                  );
                })}
              </ul>
            </div>
          ))}
        </div>
      </div>

      {/* Items Analytics */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Items Ordered */}
        <div className="bg-yellow-50 p-4 rounded shadow">
          <div className="text-lg font-semibold mb-2">Items Ordered</div>
          <div className="max-h-64 overflow-y-auto">
            <ul className="space-y-1 text-sm">
              {orderedItems.map(([key, val]) => (
                <li key={key} className="flex justify-between">
                  <span className="font-semibold">{key.split("-")[0]}</span>
                  <span>
                    {val.quantity} {val.unit} - ₹{val.amount.toLocaleString()}
                  </span>
                </li>
              ))}
            </ul>
          </div>
        </div>

        {/* Items Grouped by Quantity & Unit */}
        <div className="bg-indigo-50 p-4 rounded shadow">
          <div className="text-lg font-semibold mb-2">
            Items Grouped by Quantity & Unit
          </div>
          <div className="max-h-64 overflow-y-auto">
            <ul className="space-y-1 text-sm">
              {groupedPackages.map((pkg) => (
                <li key={`${pkg.name}-${pkg.quantity}-${pkg.unit}`} className="flex justify-between">
                  <span>
                    <span className="font-semibold">{pkg.name}</span>{" "}
                    ({pkg.quantity} {pkg.unit})
                  </span>
                  <span className="text-blue-700 font-bold">
                    {pkg.count} package{pkg.count > 1 ? "s" : ""}
                  </span>
                </li>
              ))}
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
}
