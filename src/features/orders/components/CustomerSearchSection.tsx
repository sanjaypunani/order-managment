// Customer search and selection component
import React, { useState, memo, useCallback } from "react";
import { Input, Alert, LoadingSpinner } from "../../../components/ui";
import { Customer } from "../../../types";
import { UseCustomerSearchReturn } from "../../../hooks";

interface CustomerSearchSectionProps {
  customerSearch: UseCustomerSearchReturn;
  mobileNumber: string;
  onMobileNumberChange: (value: string) => void;
  onCustomerSelect: (customer: Customer) => void;
  disabled?: boolean;
}

export const CustomerSearchSection = memo<CustomerSearchSectionProps>(
  function CustomerSearchSection(props) {
    const {
      customerSearch,
      mobileNumber,
      onMobileNumberChange,
      onCustomerSelect,
      disabled = false,
    } = props;
    const [selectedIndex, setSelectedIndex] = useState(0);
    const {
      searchResults,
      selectedCustomer,
      isLoading,
      error,
      searchByMobile,
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
      onMobileNumberChange("");
    }, [clearSelection, onMobileNumberChange]);

    React.useEffect(() => {
      if (mobileNumber && mobileNumber.length > 0 && !selectedCustomer) {
        const timeoutId = setTimeout(() => {
          searchByMobile(mobileNumber);
        }, 500);
        return () => clearTimeout(timeoutId);
      }
    }, [mobileNumber, selectedCustomer, searchByMobile]);

    return (
      <div>
        <Input
          label="Customer Mobile Number"
          value={mobileNumber}
          onChange={(e) => onMobileNumberChange(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder="Enter mobile number (live search)"
          disabled={disabled}
          rightIcon={isLoading ? <LoadingSpinner size="sm" /> : undefined}
          required
        />

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

        {/* Customer selected */}
        {selectedCustomer && (
          <Alert variant="success" className="mt-2">
            <div className="flex justify-between items-center">
              <p>
                ✅ Customer selected:{" "}
                {selectedCustomer.customerName || "Unnamed"} |
                {selectedCustomer.flatNumber}, {selectedCustomer.societyName}
              </p>
              <button
                type="button"
                onClick={handleClearSelection}
                className="text-red-600 hover:text-red-800 text-sm ml-2"
              >
                Clear
              </button>
            </div>
          </Alert>
        )}

        {/* Multiple customers found */}
        {searchResults.length > 1 && (
          <Alert variant="info" className="mt-2">
            <p className="font-semibold mb-2">
              {searchResults.length} customers found. Please select one:
            </p>
            <div className="space-y-1 max-h-32 overflow-y-auto">
              {searchResults.map((customer, index) => (
                <div
                  key={customer._id}
                  className={`p-2 rounded cursor-pointer hover:bg-blue-100 transition-colors ${
                    selectedCustomer?._id === customer._id
                      ? "bg-blue-200 border border-blue-400"
                      : index === selectedIndex
                      ? "bg-blue-100 border border-blue-300"
                      : "bg-white border"
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

        {/* No customers found */}
        {mobileNumber &&
          mobileNumber.length > 0 &&
          !isLoading &&
          searchResults.length === 0 &&
          !selectedCustomer && (
            <Alert variant="info" className="mt-2">
              ℹ️ No customers found with this number. A new customer will be
              created with this information.
            </Alert>
          )}

        {/* Loading state */}
        {mobileNumber && mobileNumber.length > 0 && isLoading && (
          <Alert variant="warning" className="mt-2">
            🔍 Searching for customers...
          </Alert>
        )}

        {/* Error state */}
        {error && (
          <Alert variant="error" className="mt-2">
            {error}
          </Alert>
        )}
      </div>
    );
  }
);
