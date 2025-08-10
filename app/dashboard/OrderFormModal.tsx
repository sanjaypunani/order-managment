import React, { useEffect, useState } from "react";
import { SOCIETIES, UNITS } from "./constants";
import { useProducts } from "./useProducts";

export function OrderFormModal({
  showModal,
  setShowModal,
  form,
  setForm,
  handleChange,
  addItem,
  handleSubmit,
  searchCustomerByMobile,
  searchCustomerByFlat,
  customerSearchLoading,
  searchedCustomer,
  searchedCustomers,
  clearSearchedCustomer,
  selectCustomerFromSearch,
}: {
  showModal: boolean;
  setShowModal: React.Dispatch<React.SetStateAction<boolean>>;
  form: any;
  setForm: React.Dispatch<React.SetStateAction<any>>;
  handleChange: (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>
  ) => void;
  addItem: () => void;
  handleSubmit: (e: React.FormEvent<HTMLFormElement>) => Promise<void>;
  searchCustomerByMobile: (mobileNumber: string) => Promise<void>;
  searchCustomerByFlat: (flatNumber: string) => Promise<void>;
  customerSearchLoading: boolean;
  searchedCustomer: any;
  searchedCustomers: any[];
  clearSearchedCustomer?: () => void;
  selectCustomerFromSearch?: (customer: any) => void;
}) {
  // Conditional return FIRST - before any hooks are called
  if (!showModal) return null;

  // Now all hooks are called consistently when the component renders
  // Rename for clarity: products = available inventory/catalog
  const {
    products: availableProducts,
    items: productCatalog, // These are the available products to choose from
    loading: catalogLoading,
    error: catalogError,
  } = useProducts();

  const [searchTimeout, setSearchTimeout] = useState<NodeJS.Timeout | null>(
    null
  );
  const [isCustomerSelected, setIsCustomerSelected] = useState(false);
  const [lastSearchedNumber, setLastSearchedNumber] = useState("");
  const [selectedCustomerIndex, setSelectedCustomerIndex] = useState(0);

  // Auto-search when mobile number changes (live search with debounce)
  useEffect(() => {
    // Clear previous timeout
    if (searchTimeout) {
      clearTimeout(searchTimeout);
    }

    // Only search if there's some input (at least 1 digit) and it's different from last searched
    if (
      form.customerNumber &&
      form.customerNumber.trim().length > 0 &&
      form.customerNumber.trim() !== lastSearchedNumber &&
      !isCustomerSelected
    ) {
      // Extract clean mobile number for searching
      let cleanNumber = form.customerNumber.trim();
      if (cleanNumber.startsWith("+91")) {
        cleanNumber = cleanNumber.substring(3);
      } else if (cleanNumber.startsWith("91") && cleanNumber.length > 10) {
        cleanNumber = cleanNumber.substring(2);
      }

      // Set new timeout for auto-search with 500ms debounce
      const timeout = setTimeout(() => {
        searchCustomerByMobile(cleanNumber);
        setLastSearchedNumber(form.customerNumber.trim());
      }, 500); // 500ms debounce

      setSearchTimeout(timeout);
    }

    return () => {
      if (searchTimeout) {
        clearTimeout(searchTimeout);
      }
    };
  }, [form.customerNumber, lastSearchedNumber, isCustomerSelected]); // Removed searchCustomerByMobile from dependencies

  // Reset customer selection when mobile number changes
  useEffect(() => {
    if (!isCustomerSelected) return; // Only reset if customer was previously selected
    setIsCustomerSelected(false);
    setLastSearchedNumber(""); // Reset last searched number when manually changing
  }, [form.customerNumber]);

  // Modified handleChange to handle customer selection reset
  const handleFormChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>
  ) => {
    if (e.target.name === "customerNumber") {
      setIsCustomerSelected(false);
      setSelectedCustomerIndex(0); // Reset selection index
    }
    handleChange(e);
  };

  // Handle keyboard navigation for customer selection
  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (searchedCustomers && searchedCustomers.length > 1) {
      if (e.key === "ArrowDown") {
        e.preventDefault();
        setSelectedCustomerIndex((prev) =>
          prev < searchedCustomers.length - 1 ? prev + 1 : 0
        );
      } else if (e.key === "ArrowUp") {
        e.preventDefault();
        setSelectedCustomerIndex((prev) =>
          prev > 0 ? prev - 1 : searchedCustomers.length - 1
        );
      } else if (e.key === "Enter" && selectedCustomerIndex >= 0) {
        e.preventDefault();
        const selectedCustomer = searchedCustomers[selectedCustomerIndex];
        if (selectCustomerFromSearch) {
          selectCustomerFromSearch(selectedCustomer);
          setIsCustomerSelected(true); // Mark as selected when user presses Enter
        }
      }
    }
  };

  // Fix type for handleOrderItemChange (renamed for clarity)
  const handleOrderItemChange = (
    itemIndex: number,
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>
  ) => {
    const orderItems: Array<{
      name: string;
      quantity: number | string;
      unit: string;
      price: number | string;
    }> = [...form.items]; // form.items are the order line items

    const fieldName = e.target.name as keyof (typeof orderItems)[0];
    orderItems[itemIndex][fieldName] = e.target.value;

    console.log("Order item changed:", orderItems[itemIndex]);

    // Auto-fill price, quantity, and unit based on selected product from catalog
    if (
      fieldName === "name" ||
      fieldName === "unit" ||
      fieldName === "quantity"
    ) {
      // Find the product in our catalog that matches the selected item name
      const selectedProduct = productCatalog.find(
        (product: any) => product.name === orderItems[itemIndex].name
      );

      if (selectedProduct) {
        // When product name is selected, auto-fill default quantity and unit
        if (fieldName === "name") {
          orderItems[itemIndex].quantity = selectedProduct.quantity || 1;
          orderItems[itemIndex].unit = selectedProduct.unit || "GM";
        }

        let price = Number(selectedProduct.price);
        let productUnit = selectedProduct.unit;
        let productQty = Number(selectedProduct.quantity);
        let orderUnit = orderItems[itemIndex].unit || productUnit;
        let orderQty = Number(orderItems[itemIndex].quantity) || productQty;

        // Unit conversion logic
        if (productUnit === "GM" && orderUnit === "KG") {
          // Convert price per gram to per kg
          price = price * ((orderQty * 1000) / productQty);
        } else if (productUnit === "KG" && orderUnit === "GM") {
          // Convert price per kg to per gram
          price = price * (orderQty / 1000 / (productQty / 1000));
        } else if (productUnit === orderUnit) {
          price = price * (orderQty / productQty);
        }

        orderItems[itemIndex].price = price ? Math.round(price) : "";
      }
    }

    setForm({ ...form, items: orderItems });
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-30 flex items-center justify-center z-50 overflow-auto">
      <div className="bg-white rounded-lg shadow-lg p-6 w-full max-w-2xl lg:max-w-4xl xl:max-w-5xl 2xl:max-w-6xl max-h-[90vh] overflow-y-auto">
        <h2 className="text-xl font-bold mb-4">Create Order</h2>

        <form onSubmit={handleSubmit}>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Left Column - Customer Information */}
            <div className="space-y-4">
              <h3 className="text-lg font-semibold text-gray-800 border-b pb-2">
                Customer Information
              </h3>

              <div>
                <label className="block font-semibold mb-1">
                  Customer Mobile Number
                </label>
                <div className="relative">
                  <input
                    name="customerNumber"
                    value={form.customerNumber}
                    onChange={handleFormChange}
                    onKeyDown={handleKeyDown}
                    required
                    placeholder="Enter mobile number (live search)"
                    className="border rounded px-3 py-2 w-full pr-10"
                  />
                  {customerSearchLoading && (
                    <div className="absolute right-3 top-3">
                      <div className="animate-spin h-4 w-4 border-2 border-blue-600 border-t-transparent rounded-full"></div>
                    </div>
                  )}
                </div>
                {searchedCustomer &&
                  searchedCustomers &&
                  searchedCustomers.length === 1 &&
                  !isCustomerSelected && (
                    <div className="mt-2 p-2 bg-green-50 border border-green-200 rounded text-sm">
                      <p className="text-green-800 font-semibold mb-2">
                        Customer found. Click to select:
                      </p>
                      <div
                        className="p-2 rounded cursor-pointer hover:bg-green-100 bg-white border border-green-300 transition-colors"
                        onClick={() => {
                          if (selectCustomerFromSearch) {
                            selectCustomerFromSearch(searchedCustomer);
                            setIsCustomerSelected(true);
                          }
                        }}
                      >
                        <div className="flex justify-between items-center">
                          <span className="font-medium">
                            {searchedCustomer.customerName ||
                              "Unnamed Customer"}
                          </span>
                          <span className="text-green-600 text-xs">
                            {searchedCustomer.countryCode || "+91"}
                            {searchedCustomer.mobileNumber}
                          </span>
                        </div>
                        <div className="text-xs text-gray-600">
                          {searchedCustomer.flatNumber},{" "}
                          {searchedCustomer.societyName}
                        </div>
                      </div>
                    </div>
                  )}
                {searchedCustomer && isCustomerSelected && (
                  <div className="mt-2 p-2 bg-green-50 border border-green-200 rounded text-sm">
                    <div className="flex justify-between items-center">
                      <p className="text-green-800">
                        ✅ Customer selected:{" "}
                        {searchedCustomer.customerName || "Unnamed"} |
                        {searchedCustomer.flatNumber},{" "}
                        {searchedCustomer.societyName}
                      </p>
                      <button
                        type="button"
                        onClick={() => {
                          setIsCustomerSelected(false);
                          setLastSearchedNumber("");
                          setForm({
                            ...form,
                            customerNumber: "",
                            customerName: "",
                            flatNumber: "",
                            socityName: "",
                          });
                          // Clear the searched customer state in parent component
                          if (clearSearchedCustomer) {
                            clearSearchedCustomer();
                          }
                        }}
                        className="text-red-600 hover:text-red-800 text-sm"
                      >
                        Clear
                      </button>
                    </div>
                  </div>
                )}
                {searchedCustomers && searchedCustomers.length > 1 && (
                  <div className="mt-2 p-2 bg-blue-50 border border-blue-200 rounded text-sm">
                    <p className="text-blue-800 font-semibold mb-2">
                      {searchedCustomers.length} customers found. Please select
                      one:
                    </p>
                    <div className="space-y-1 max-h-32 overflow-y-auto">
                      {searchedCustomers.map((customer, index) => (
                        <div
                          key={customer._id}
                          className={`p-2 rounded cursor-pointer hover:bg-blue-100 transition-colors ${
                            searchedCustomer?._id === customer._id
                              ? "bg-blue-200 border border-blue-400"
                              : index === selectedCustomerIndex
                              ? "bg-blue-100 border border-blue-300"
                              : "bg-white border"
                          }`}
                          onClick={() => {
                            if (selectCustomerFromSearch) {
                              selectCustomerFromSearch(customer);
                              setIsCustomerSelected(true); // Mark as selected when user clicks
                            }
                          }}
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
                  </div>
                )}
                {form.customerNumber &&
                  form.customerNumber.length > 0 &&
                  !customerSearchLoading &&
                  !searchedCustomer &&
                  (!searchedCustomers || searchedCustomers.length === 0) && (
                    <div className="mt-2 p-2 bg-blue-50 border border-blue-200 rounded text-sm">
                      <p className="text-blue-800">
                        ℹ️ No customers found with this number. A new customer
                        will be created with this information.
                      </p>
                    </div>
                  )}
                {form.customerNumber &&
                  form.customerNumber.length > 0 &&
                  customerSearchLoading && (
                    <div className="mt-2 p-2 bg-yellow-50 border border-yellow-200 rounded text-sm">
                      <p className="text-yellow-800">
                        🔍 Searching for customers...
                      </p>
                    </div>
                  )}
              </div>

              <div>
                <label className="block font-semibold mb-1">
                  Customer Name
                </label>
                <input
                  name="customerName"
                  value={form.customerName}
                  onChange={handleFormChange}
                  placeholder="Customer name (optional)"
                  className="border rounded px-3 py-2 w-full"
                  disabled={isCustomerSelected && searchedCustomer}
                />
              </div>

              <div>
                <label className="block font-semibold mb-1">Flat Number</label>
                <input
                  name="flatNumber"
                  value={form.flatNumber}
                  onChange={handleFormChange}
                  required
                  className="border rounded px-3 py-2 w-full"
                  disabled={isCustomerSelected && searchedCustomer}
                />
              </div>

              <div>
                <label className="block font-semibold mb-1">Society Name</label>
                <select
                  name="socityName"
                  value={form.socityName || "The Vienza"}
                  onChange={handleFormChange}
                  required
                  className="border rounded px-3 py-2 w-full"
                  disabled={isCustomerSelected && searchedCustomer}
                >
                  <option value="">Select Society</option>
                  {SOCIETIES.map((soc: string) => (
                    <option key={soc} value={soc}>
                      {soc}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block font-semibold mb-1">Status</label>
                <select
                  name="status"
                  value={form.status}
                  onChange={handleFormChange}
                  required
                  className="border rounded px-3 py-2 w-full"
                >
                  <option value="Pending">Pending</option>
                  <option value="Delivered">Delivered</option>
                </select>
              </div>

              <div>
                <label className="block font-semibold mb-1">Discount</label>
                <input
                  name="discount"
                  value={form.discount}
                  onChange={handleFormChange}
                  placeholder="Order Discount"
                  className="border rounded px-3 py-2 w-full"
                />
              </div>

              <div>
                <label className="block font-semibold mb-1">
                  Delivery Date
                </label>
                <input
                  name="deliveryDate"
                  type="date"
                  value={form.deliveryDate || ""}
                  onChange={handleFormChange}
                  required
                  className="border rounded px-3 py-2 w-full"
                />
              </div>
            </div>

            {/* Right Column - Order Items */}
            <div className="space-y-4">
              <h3 className="text-lg font-semibold text-gray-800 border-b pb-2">
                Order Items
                {catalogLoading && (
                  <span className="ml-2 text-sm text-blue-600">
                    Loading product catalog...
                  </span>
                )}
                {catalogError && (
                  <span className="ml-2 text-sm text-red-600">
                    Error loading product catalog
                  </span>
                )}
              </h3>

              <div>
                <div className="grid grid-cols-4 gap-2 mb-2 px-2">
                  <span className="font-semibold text-sm">Product</span>
                  <span className="font-semibold text-sm">Quantity</span>
                  <span className="font-semibold text-sm">Unit</span>
                  <span className="font-semibold text-sm">Price</span>
                </div>
                {form.items.map((orderItem: any, itemIndex: number) => (
                  <div
                    key={itemIndex}
                    className="mb-2 p-2 border rounded grid grid-cols-5 gap-2 items-center"
                  >
                    <select
                      name="name"
                      value={orderItem.name}
                      onChange={(e) => handleOrderItemChange(itemIndex, e)}
                      required
                      disabled={catalogLoading}
                      className="border rounded px-2 py-1 text-sm disabled:bg-gray-100"
                    >
                      <option value="">
                        {catalogLoading
                          ? "Loading products..."
                          : "Select Product"}
                      </option>
                      {productCatalog.map(
                        (product: { name: string; price: number }) => (
                          <option key={product.name} value={product.name}>
                            {product.name}
                          </option>
                        )
                      )}
                    </select>
                    <input
                      name="quantity"
                      value={orderItem.quantity}
                      onChange={(e) => handleOrderItemChange(itemIndex, e)}
                      placeholder="Qty"
                      required
                      className="border rounded px-2 py-1 w-full text-sm"
                      type="number"
                      min="1"
                    />
                    <select
                      name="unit"
                      value={orderItem.unit || "GM"}
                      onChange={(e) => handleOrderItemChange(itemIndex, e)}
                      required
                      className="border rounded px-2 py-1 w-full text-sm"
                    >
                      {UNITS.map((unit: { value: string; label: string }) => (
                        <option key={unit.value} value={unit.value}>
                          {unit.label}
                        </option>
                      ))}
                    </select>
                    <input
                      name="price"
                      value={orderItem.price}
                      onChange={(e) => handleOrderItemChange(itemIndex, e)}
                      placeholder="Price"
                      required
                      className="border rounded px-2 py-1 w-full text-sm"
                      type="number"
                      min="0"
                      readOnly
                    />
                    <button
                      type="button"
                      className="bg-red-500 text-white px-2 py-1 rounded hover:bg-red-600 text-sm"
                      onClick={() => {
                        const updatedOrderItems = [...form.items];
                        updatedOrderItems.splice(itemIndex, 1);
                        setForm({ ...form, items: updatedOrderItems });
                      }}
                      aria-label="Remove Item"
                    >
                      ×
                    </button>
                  </div>
                ))}
                <button
                  type="button"
                  onClick={addItem}
                  className="mt-2 bg-green-500 text-white px-3 py-2 rounded hover:bg-green-600 w-full"
                >
                  + Add Item
                </button>
              </div>
            </div>
          </div>
          <div className="flex justify-end space-x-2 mt-4">
            <button
              type="button"
              onClick={() => setShowModal(false)}
              className="px-4 py-2 rounded bg-gray-300 hover:bg-gray-400"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-4 py-2 rounded bg-blue-600 text-white hover:bg-blue-700"
            >
              Create
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
