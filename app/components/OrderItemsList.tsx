import React from "react";

interface OrderItem {
  name: string;
  quantity: number | string;
  unit: string;
  price: number | string;
}

interface OrderItemsListProps {
  items: OrderItem[];
  onUpdateItem: (
    index: number,
    field: keyof OrderItem,
    value: string | number
  ) => void;
  onRemoveItem: (index: number) => void;
  disabled?: boolean;
}

export default function OrderItemsList({
  items,
  onUpdateItem,
  onRemoveItem,
  disabled = false,
}: OrderItemsListProps) {
  const validItems = items.filter((item) => item.name);

  if (validItems.length === 0) {
    return null;
  }

  return (
    <div className="space-y-3">
      <h4 className="font-medium text-gray-900 mb-3">
        Added Items ({validItems.length})
      </h4>

      <div className="space-y-2">
        {validItems.map((item, index) => (
          <div
            key={index}
            className="flex items-center justify-between p-3 bg-gray-50 rounded-lg border"
          >
            <div className="flex-1">
              <div className="font-medium text-gray-900">{item.name}</div>
              <div className="text-sm text-gray-500">
                {typeof item.price === "string"
                  ? parseFloat(item.price) || 0
                  : item.price}{" "}
                per {item.unit}
              </div>
            </div>

            {/* Quantity Controls */}
            <div className="flex items-center space-x-2">
              <div className="flex items-center space-x-1">
                <label className="text-xs text-gray-600">Qty:</label>
                <input
                  type="number"
                  min="1"
                  value={item.quantity}
                  onChange={(e) =>
                    onUpdateItem(index, "quantity", e.target.value)
                  }
                  className="w-16 px-2 py-1 text-sm border border-gray-300 rounded focus:ring-1 focus:ring-green-500 focus:border-transparent"
                  disabled={disabled}
                />
              </div>

              <div className="flex items-center space-x-1">
                <select
                  value={item.unit}
                  onChange={(e) => onUpdateItem(index, "unit", e.target.value)}
                  className="px-2 py-1 text-sm border border-gray-300 rounded focus:ring-1 focus:ring-green-500 focus:border-transparent"
                  disabled={disabled}
                >
                  <option value="GM">Gram</option>
                  <option value="KG">Kilogram</option>
                  <option value="PCS">Pieces</option>
                </select>
              </div>

              <div className="text-sm font-medium text-green-600 min-w-[50px] text-right">
                ₹
                {typeof item.price === "string"
                  ? parseFloat(item.price) || 0
                  : item.price}
              </div>

              <button
                onClick={() => onRemoveItem(index)}
                disabled={disabled}
                className="text-red-500 hover:text-red-700 p-1 rounded-full hover:bg-red-50 disabled:opacity-50"
                aria-label="Remove item"
              >
                <svg
                  className="w-4 h-4"
                  fill="currentColor"
                  viewBox="0 0 20 20"
                >
                  <path
                    fillRule="evenodd"
                    d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z"
                    clipRule="evenodd"
                  />
                </svg>
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
