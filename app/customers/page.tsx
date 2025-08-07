"use client";
import React from "react";

export default function Customers() {
  return (
    <div>
      <h1 className="text-2xl font-bold mb-4">Customers</h1>
      <div className="bg-white p-6 rounded-lg shadow">
        <p className="text-gray-600 mb-4">
          This section will contain customer management functionality.
        </p>
        <div className="space-y-4">
          <div className="bg-gray-50 p-4 rounded">
            <h3 className="font-semibold mb-2">Coming Soon:</h3>
            <ul className="list-disc list-inside space-y-1 text-sm text-gray-600">
              <li>Customer listing and profiles</li>
              <li>Customer order history</li>
              <li>Customer analytics</li>
              <li>Customer communication</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
}
