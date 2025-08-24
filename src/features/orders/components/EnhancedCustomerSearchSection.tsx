// Enhanced customer search component with multiple search options
import React, { useState, memo, useCallback } from "react";
import { Input, Alert, LoadingSpinner, Select } from "../../../components/ui";
import { Customer } from "../../../types";
import { UseCustomerSearchReturn } from "../../../hooks";

interface EnhancedCustomerSearchSectionProps {
  customerSearch: UseCustomerSearchReturn;
  searchQuery: string;
  onSearchQueryChange: (value: string) => void;
  onCustomerSelect: (customer: Customer) => void;
  disabled?: boolean;
}

type SearchType = "mobile" | "flat" | "name";

const searchTypeOptions = [
  { value: "mobile", label: "Mobile Number" },
  { value: "flat", label: "Flat Number" },
  { value: "name", label: "Customer Name" },
];

export const EnhancedCustomerSearchSection =
  memo<EnhancedCustomerSearchSectionProps>(
    function EnhancedCustomerSearchSection(props) {
      const {
        customerSearch,
        searchQuery,
        onSearchQueryChange,
        onCustomerSelect,
        disabled = false,
      } = props;

      const [searchType, setSearchType] = useState<SearchType>("mobile");
      const [selectedIndex, setSelectedIndex] = useState(0);

      const {
        searchResults,
        selectedCustomer,
        isLoading,
        error,
        search,
        selectCustomer,
        clearSelection,
      } = customerSearch;

      const handleKeyDown = useCallback(
        (e: React.KeyboardEvent<HTMLInputElement>) => {
          if (searchResults.length > 1) {
            if (e.key === "ArrowDown") {
              e.preventDefault();
              setSelectedIndex((prev) =>
                prev < searchResults.length - 1 ? prev + 1 : 0
              );
            } else if (e.key === "ArrowUp") {
              e.preventDefault();
              setSelectedIndex((prev) =>
                prev > 0 ? prev - 1 : searchResults.length - 1
              );
            } else if (e.key === "Enter" && selectedIndex >= 0) {
              e.preventDefault();
              const customer = searchResults[selectedIndex];
              selectCustomer(customer);
              onCustomerSelect(customer);
            }
          }
        },
        [searchResults.length, selectedIndex, selectCustomer, onCustomerSelect]
      );

      const handleCustomerClick = useCallback(
        (customer: Customer) => {
          selectCustomer(customer);
          onCustomerSelect(customer);
        },
        [selectCustomer, onCustomerSelect]
      );

      const handleClearSelection = useCallback(() => {
        clearSelection();
        onSearchQueryChange("");
      }, [clearSelection, onSearchQueryChange]);

      const getPlaceholder = () => {
        switch (searchType) {
          case "mobile":
            return "Enter mobile number (e.g., 9876543210)";
          case "flat":
            return "Enter flat number (e.g., A-101)";
          case "name":
            return "Enter customer name";
          default:
            return "Enter search query";
        }
      };

      const getInputLabel = () => {
        switch (searchType) {
          case "mobile":
            return "Customer Mobile Number";
          case "flat":
            return "Customer Flat Number";
          case "name":
            return "Customer Name";
          default:
            return "Search Customer";
        }
      };

      // Handle search when query or type changes
      React.useEffect(() => {
        if (searchQuery && searchQuery.trim().length > 0 && !selectedCustomer) {
          const timeoutId = setTimeout(() => {
            let cleanQuery = searchQuery.trim();

            // Clean mobile number if needed
            if (searchType === "mobile") {
              if (cleanQuery.startsWith("+91")) {
                cleanQuery = cleanQuery.substring(3);
              } else if (
                cleanQuery.startsWith("91") &&
                cleanQuery.length > 10
              ) {
                cleanQuery = cleanQuery.substring(2);
              }
            }

            search(cleanQuery, searchType);
          }, 500);
          return () => clearTimeout(timeoutId);
        }
      }, [searchQuery, searchType, selectedCustomer, search]);

      return (
        <div className="space-y-4">
          {/* Search Type Selector */}
          <Select
            label="Search By"
            value={searchType}
            onChange={(e) => {
              setSearchType(e.target.value as SearchType);
              // Clear previous search when changing type
              clearSelection();
              onSearchQueryChange("");
            }}
            disabled={disabled}
            options={searchTypeOptions}
          />

          {/* Search Input */}
          <Input
            label={getInputLabel()}
            value={searchQuery}
            onChange={(e) => onSearchQueryChange(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder={getPlaceholder()}
            disabled={disabled}
            rightIcon={isLoading ? <LoadingSpinner size="sm" /> : undefined}
            required
          />

          {/* Error Display */}
          {error && (
            <Alert variant="error" className="mt-2">
              {error}
            </Alert>
          )}

          {/* Single customer found */}
          {searchResults.length === 1 && !selectedCustomer && (
            <Alert variant="success" className="mt-2">
              <p className="font-semibold mb-2">
                Customer found. Click to select:
              </p>
              <div
                className="p-2 rounded cursor-pointer hover:bg-green-100 bg-white border border-green-300 transition-colors"
                onClick={() => handleCustomerClick(searchResults[0])}
              >
                <div className="flex justify-between items-center">
                  <span className="font-medium">
                    {searchResults[0].customerName || "Unnamed Customer"}
                  </span>
                  <span className="text-green-600 text-xs">
                    {searchResults[0].countryCode || "+91"}
                    {searchResults[0].mobileNumber}
                  </span>
                </div>
                <div className="text-xs text-gray-600">
                  {searchResults[0].flatNumber}, {searchResults[0].societyName}
                </div>
              </div>
            </Alert>
          )}

          {/* Multiple customers found */}
          {searchResults.length > 1 && !selectedCustomer && (
            <Alert variant="info" className="mt-2">
              <p className="font-semibold mb-2">
                {searchResults.length} customers found. Use ↑↓ keys or click to
                select:
              </p>
              <div className="space-y-1 max-h-48 overflow-y-auto">
                {searchResults.map((customer, index) => (
                  <div
                    key={customer._id}
                    className={`p-2 rounded cursor-pointer transition-colors ${
                      index === selectedIndex
                        ? "bg-blue-100 border border-blue-300"
                        : "bg-white border border-gray-200 hover:bg-gray-50"
                    }`}
                    onClick={() => handleCustomerClick(customer)}
                  >
                    <div className="flex justify-between items-center">
                      <span className="font-medium">
                        {customer.customerName || "Unnamed Customer"}
                      </span>
                      <span className="text-blue-600 text-xs">
                        {customer.countryCode || "+91"}
                        {customer.mobileNumber}
                      </span>
                    </div>
                    <div className="text-xs text-gray-600">
                      {customer.flatNumber}, {customer.societyName}
                    </div>
                  </div>
                ))}
              </div>
            </Alert>
          )}

          {/* Customer selected */}
          {selectedCustomer && (
            <Alert variant="success" className="mt-2">
              <div className="flex justify-between items-center">
                <p>
                  ✅ Customer selected:{" "}
                  <strong>{selectedCustomer.customerName || "Unnamed"}</strong>{" "}
                  | {selectedCustomer.flatNumber},{" "}
                  {selectedCustomer.societyName}
                </p>
                <button
                  type="button"
                  onClick={handleClearSelection}
                  className="text-sm text-green-700 hover:text-green-900 underline"
                  disabled={disabled}
                >
                  Change
                </button>
              </div>
            </Alert>
          )}

          {/* No results */}
          {searchQuery.trim() &&
            searchResults.length === 0 &&
            !isLoading &&
            !selectedCustomer && (
              <Alert variant="warning" className="mt-2">
                No customers found for &ldquo;{searchQuery}&rdquo;. The customer
                will be created when the order is saved.
              </Alert>
            )}
        </div>
      );
    }
  );
