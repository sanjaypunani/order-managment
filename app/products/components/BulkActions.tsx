"use client";

import { useState } from "react";

interface BulkActionsProps {
  selectedProducts: string[];
  onBulkUpdate: (action: string, value?: any) => void;
  onClearSelection: () => void;
}

export default function BulkActions({
  selectedProducts,
  onBulkUpdate,
  onClearSelection,
}: BulkActionsProps) {
  const [showPriceUpdate, setShowPriceUpdate] = useState(false);
  const [priceAction, setPriceAction] = useState<
    "set" | "increase" | "decrease"
  >("set");
  const [priceValue, setPriceValue] = useState("");
  const [showCategoryUpdate, setShowCategoryUpdate] = useState(false);
  const [newCategory, setNewCategory] = useState("");

  if (selectedProducts.length === 0) return null;

  const handlePriceUpdate = () => {
    if (!priceValue) return;

    const value = Number(priceValue);
    onBulkUpdate("price", { action: priceAction, value });
    setShowPriceUpdate(false);
    setPriceValue("");
  };

  const handleCategoryUpdate = () => {
    if (!newCategory) return;

    onBulkUpdate("category", newCategory);
    setShowCategoryUpdate(false);
    setNewCategory("");
  };

  return (
    <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
      <div className="flex items-center justify-between flex-wrap gap-4">
        <div className="flex items-center space-x-4">
          <span className="text-sm font-medium text-blue-800">
            {selectedProducts.length} product(s) selected
          </span>

          <div className="flex space-x-2">
            <button
              onClick={() => onBulkUpdate("activate")}
              className="px-3 py-1 bg-green-500 text-white text-sm rounded hover:bg-green-600"
            >
              Activate
            </button>

            <button
              onClick={() => onBulkUpdate("deactivate")}
              className="px-3 py-1 bg-red-500 text-white text-sm rounded hover:bg-red-600"
            >
              Deactivate
            </button>

            <button
              onClick={() => onBulkUpdate("available")}
              className="px-3 py-1 bg-blue-500 text-white text-sm rounded hover:bg-blue-600"
            >
              Mark Available
            </button>

            <button
              onClick={() => onBulkUpdate("unavailable")}
              className="px-3 py-1 bg-gray-500 text-white text-sm rounded hover:bg-gray-600"
            >
              Mark Unavailable
            </button>

            <button
              onClick={() => setShowPriceUpdate(true)}
              className="px-3 py-1 bg-purple-500 text-white text-sm rounded hover:bg-purple-600"
            >
              Update Prices
            </button>

            <button
              onClick={() => setShowCategoryUpdate(true)}
              className="px-3 py-1 bg-orange-500 text-white text-sm rounded hover:bg-orange-600"
            >
              Change Category
            </button>
          </div>
        </div>

        <button
          onClick={onClearSelection}
          className="text-blue-600 hover:text-blue-800 text-sm"
        >
          Clear Selection
        </button>
      </div>

      {/* Price Update Modal */}
      {showPriceUpdate && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-96">
            <h3 className="text-lg font-semibold mb-4">Update Prices</h3>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-2">Action</label>
                <select
                  value={priceAction}
                  onChange={(e) => setPriceAction(e.target.value as any)}
                  className="w-full p-2 border rounded"
                >
                  <option value="set">Set Price</option>
                  <option value="increase">Increase by Amount</option>
                  <option value="decrease">Decrease by Amount</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium mb-2">
                  {priceAction === "set" ? "New Price (₹)" : "Amount (₹)"}
                </label>
                <input
                  type="number"
                  value={priceValue}
                  onChange={(e) => setPriceValue(e.target.value)}
                  min="0"
                  step="0.01"
                  className="w-full p-2 border rounded"
                  placeholder="0.00"
                />
              </div>
            </div>

            <div className="flex justify-end space-x-3 mt-6">
              <button
                onClick={() => setShowPriceUpdate(false)}
                className="px-4 py-2 text-gray-600 border rounded hover:bg-gray-50"
              >
                Cancel
              </button>
              <button
                onClick={handlePriceUpdate}
                className="px-4 py-2 bg-purple-500 text-white rounded hover:bg-purple-600"
              >
                Update Prices
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Category Update Modal */}
      {showCategoryUpdate && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-96">
            <h3 className="text-lg font-semibold mb-4">Change Category</h3>

            <div>
              <label className="block text-sm font-medium mb-2">
                New Category
              </label>
              <input
                type="text"
                value={newCategory}
                onChange={(e) => setNewCategory(e.target.value)}
                className="w-full p-2 border rounded"
                placeholder="Enter category name"
              />
            </div>

            <div className="flex justify-end space-x-3 mt-6">
              <button
                onClick={() => setShowCategoryUpdate(false)}
                className="px-4 py-2 text-gray-600 border rounded hover:bg-gray-50"
              >
                Cancel
              </button>
              <button
                onClick={handleCategoryUpdate}
                className="px-4 py-2 bg-orange-500 text-white rounded hover:bg-orange-600"
              >
                Update Category
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
