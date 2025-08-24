"use client";
import React from "react";

// Base interfaces for type safety
export interface TableColumn<T = any> {
  key: string;
  label: string;
  render?: (value: any, row: T, index: number) => React.ReactNode;
  sortable?: boolean;
  className?: string;
  headerClassName?: string;
}

export interface TableAction<T = any> {
  label: string;
  onClick: (row: T) => void;
  className?: string;
  variant?: "primary" | "secondary" | "danger" | "success";
  disabled?: (row: T) => boolean;
  isLoading?: (row: T) => boolean;
  loadingText?: string;
}

export interface DataTableProps<T = any> {
  data: T[];
  columns: TableColumn<T>[];
  actions?: TableAction<T>[];
  loading?: boolean;
  emptyMessage?: string;
  onRowClick?: (row: T) => void;
  selectable?: boolean;
  selectedItems?: string[];
  onSelectionChange?: (selectedIds: string[]) => void;
  getRowId?: (row: T) => string;
  className?: string;
  title?: string;
  showHeader?: boolean;
}

// Action button variants
const actionVariants = {
  primary:
    "bg-blue-500 text-white px-2 py-1 rounded text-xs hover:bg-blue-600 transition-colors",
  secondary:
    "bg-gray-500 text-white px-2 py-1 rounded text-xs hover:bg-gray-600 transition-colors",
  danger:
    "bg-red-500 text-white px-2 py-1 rounded text-xs hover:bg-red-600 transition-colors",
  success:
    "bg-green-500 text-white px-2 py-1 rounded text-xs hover:bg-green-600 transition-colors",
};

export function DataTable<T = any>({
  data,
  columns,
  actions = [],
  loading = false,
  emptyMessage = "No data available",
  onRowClick,
  selectable = false,
  selectedItems = [],
  onSelectionChange,
  getRowId = (row: any) => row._id || row.id,
  className = "",
  title,
  showHeader = true,
}: DataTableProps<T>) {
  // Handle individual row selection
  const handleRowSelect = (rowId: string) => {
    if (!onSelectionChange) return;

    const isSelected = selectedItems.includes(rowId);
    const newSelection = isSelected
      ? selectedItems.filter((id) => id !== rowId)
      : [...selectedItems, rowId];

    onSelectionChange(newSelection);
  };

  // Handle select all
  const handleSelectAll = () => {
    if (!onSelectionChange) return;

    const allRowIds = data.map(getRowId);
    const isAllSelected =
      allRowIds.length > 0 &&
      allRowIds.every((id) => selectedItems.includes(id));

    onSelectionChange(isAllSelected ? [] : allRowIds);
  };

  // Get value from row using key path (supports nested keys like "customer.name")
  const getValue = (row: T, key: string): any => {
    return key.split(".").reduce((obj: any, k) => obj?.[k], row);
  };

  return (
    <div className={`bg-white rounded-lg shadow overflow-hidden ${className}`}>
      {/* Header */}
      {showHeader && title && (
        <div className="p-4 border-b">
          <h2 className="text-lg font-semibold">{title}</h2>
        </div>
      )}

      {/* Loading State */}
      {loading ? (
        <div className="p-8 text-center">
          <div className="animate-spin h-8 w-8 border-4 border-blue-600 border-t-transparent rounded-full mx-auto mb-4"></div>
          <p className="text-gray-600">Loading...</p>
        </div>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50">
              <tr>
                {/* Selection Column */}
                {selectable && (
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    <input
                      type="checkbox"
                      checked={
                        data.length > 0 &&
                        data.every((row) =>
                          selectedItems.includes(getRowId(row))
                        )
                      }
                      onChange={handleSelectAll}
                      className="rounded"
                    />
                  </th>
                )}

                {/* Data Columns */}
                {columns.map((column) => (
                  <th
                    key={column.key}
                    className={`px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider ${
                      column.headerClassName || ""
                    }`}
                  >
                    {column.label}
                  </th>
                ))}

                {/* Actions Column */}
                {actions.length > 0 && (
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Actions
                  </th>
                )}
              </tr>
            </thead>

            <tbody className="bg-white divide-y divide-gray-200">
              {data.length === 0 ? (
                <tr>
                  <td
                    colSpan={
                      columns.length +
                      (selectable ? 1 : 0) +
                      (actions.length > 0 ? 1 : 0)
                    }
                    className="px-4 py-8 text-center text-gray-500"
                  >
                    {emptyMessage}
                  </td>
                </tr>
              ) : (
                data.map((row, index) => {
                  const rowId = getRowId(row);
                  const isSelected = selectedItems.includes(rowId);

                  return (
                    <tr
                      key={rowId}
                      className={`hover:bg-gray-50 ${
                        onRowClick ? "cursor-pointer" : ""
                      } ${isSelected ? "bg-blue-50" : ""}`}
                      onClick={() => onRowClick?.(row)}
                    >
                      {/* Selection Cell */}
                      {selectable && (
                        <td className="px-4 py-4 whitespace-nowrap">
                          <input
                            type="checkbox"
                            checked={isSelected}
                            onChange={(e) => {
                              e.stopPropagation();
                              handleRowSelect(rowId);
                            }}
                            className="rounded"
                          />
                        </td>
                      )}

                      {/* Data Cells */}
                      {columns.map((column) => {
                        const value = getValue(row, column.key);
                        const renderedValue = column.render
                          ? column.render(value, row, index)
                          : value;

                        return (
                          <td
                            key={column.key}
                            className={`px-4 py-4 whitespace-nowrap text-sm ${
                              column.className || ""
                            }`}
                          >
                            {renderedValue}
                          </td>
                        );
                      })}

                      {/* Actions Cell */}
                      {actions.length > 0 && (
                        <td className="px-4 py-4 whitespace-nowrap text-sm font-medium">
                          <div className="flex space-x-1">
                            {actions.map((action, actionIndex) => {
                              const isDisabled =
                                action.disabled?.(row) || false;
                              const isLoading =
                                action.isLoading?.(row) || false;

                              return (
                                <button
                                  key={actionIndex}
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    if (!isDisabled && !isLoading) {
                                      action.onClick(row);
                                    }
                                  }}
                                  disabled={isDisabled || isLoading}
                                  className={`${
                                    action.className ||
                                    actionVariants[action.variant || "primary"]
                                  } ${
                                    isDisabled || isLoading
                                      ? "opacity-50 cursor-not-allowed"
                                      : ""
                                  } ${isLoading ? "relative" : ""}`}
                                >
                                  {isLoading && (
                                    <span className="inline-flex items-center">
                                      <svg
                                        className="animate-spin -ml-1 mr-1 h-3 w-3 text-white"
                                        xmlns="http://www.w3.org/2000/svg"
                                        fill="none"
                                        viewBox="0 0 24 24"
                                      >
                                        <circle
                                          className="opacity-25"
                                          cx="12"
                                          cy="12"
                                          r="10"
                                          stroke="currentColor"
                                          strokeWidth="4"
                                        ></circle>
                                        <path
                                          className="opacity-75"
                                          fill="currentColor"
                                          d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                                        ></path>
                                      </svg>
                                      {action.loadingText || "Loading..."}
                                    </span>
                                  )}
                                  {!isLoading && action.label}
                                </button>
                              );
                            })}
                          </div>
                        </td>
                      )}
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

// Additional helper components for common table patterns
export function StatusBadge({
  status,
  variant = "default",
}: {
  status: string;
  variant?: "default" | "success" | "warning" | "danger";
}) {
  const variants = {
    default: "bg-gray-100 text-gray-800",
    success: "bg-green-100 text-green-800",
    warning: "bg-yellow-100 text-yellow-800",
    danger: "bg-red-100 text-red-800",
  };

  return (
    <span
      className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${variants[variant]}`}
    >
      {status}
    </span>
  );
}

export function CurrencyCell({ amount }: { amount: number }) {
  return <span className="font-medium">₹{amount?.toLocaleString()}</span>;
}

export function DateCell({ date }: { date: string | Date }) {
  if (!date) return <span className="text-gray-400">N/A</span>;

  const dateObj = typeof date === "string" ? new Date(date) : date;
  return <span>{dateObj.toLocaleDateString()}</span>;
}
