"use client";
import React, { useState, useEffect, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useCustomerSearch, useWalletBalance } from "../../../src/hooks";
import { useOrderForm } from "../../../src/hooks/useOrderForm";
import { useProducts } from "../../dashboard/useProducts";
import { Customer } from "../../../src/types";
import { EnhancedCustomerSearchSection } from "../../../src/features/orders/components/EnhancedCustomerSearchSection";
import { CustomerInfoSection } from "../../../src/features/orders/components/CustomerInfoSection";
import { OrderItemsSection } from "../../../src/features/orders/components/OrderItemsSection";
import Breadcrumb from "../../components/Breadcrumb";
import VegetableGrid from "../../components/VegetableGrid";
import OrderItemsList from "../../components/OrderItemsList";

function CreateEditOrderContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const editOrderId = searchParams.get("edit");
  const aiOrderParam = searchParams.get("aiOrder");

  const customerSearch = useCustomerSearch();
  const orderForm = useOrderForm();
  const [searchQuery, setSearchQuery] = useState("");
  const [aiOrderData, setAiOrderData] = useState<any>(null);
  const [showAiOrderInfo, setShowAiOrderInfo] = useState(false);
  const [aiOrderLoaded, setAIOrderLoaded] = useState(false);

  // Fetch products
  const {
    items: products,
    loading: productsLoading,
    error: productsError,
  } = useProducts();

  // Wallet balance management
  const walletBalance = useWalletBalance(
    customerSearch.selectedCustomer?.mobileNumber
  );

  // Check if we're in edit mode
  const isEditMode = Boolean(editOrderId);

  // Load order data when in edit mode
  useEffect(() => {
    const loadOrderForEdit = async () => {
      if (editOrderId) {
        try {
          const orderData = await orderForm.loadOrderForEdit(editOrderId);

          // Set customer search data if customer exists
          if (orderData.customerNumber) {
            try {
              const customerResponse = await fetch(
                `/api/customers?mobileNumber=${orderData.customerNumber}`
              );
              const customerData = await customerResponse.json();

              if (
                customerData.success &&
                customerData.data &&
                customerData.data.length > 0
              ) {
                const customer = customerData.data[0];
                customerSearch.selectCustomer(customer);
                setSearchQuery(
                  `${
                    customer.customerName || orderData.customerName || "Unnamed"
                  } - ${customer.mobileNumber}`
                );
              } else {
                // Fallback to order data
                setSearchQuery(
                  `${orderData.customerName || "Unnamed"} - ${
                    orderData.customerNumber
                  }`
                );
              }
            } catch (error) {
              console.error("Failed to load customer data:", error);
              setSearchQuery(
                `${orderData.customerName || "Unnamed"} - ${
                  orderData.customerNumber
                }`
              );
            }
          }
        } catch (error) {
          console.error("Failed to load order:", error);
        }
      }
    };

    loadOrderForEdit();
  }, [editOrderId]);

  // Load AI order data when aiOrder parameter is present
  useEffect(() => {
    const loadAiOrderData = async () => {
      if (aiOrderParam) {
        try {
          const decodedAiOrder = JSON.parse(decodeURIComponent(aiOrderParam));
          console.log("decodedAiOrder", decodedAiOrder);
          // Validate AI order structure
          if (!decodedAiOrder || typeof decodedAiOrder !== "object") {
            throw new Error("Invalid AI order data structure");
          }

          setAiOrderData(decodedAiOrder);
          setShowAiOrderInfo(true);

          // Prefill the form with AI order data
          // Set customer information with validation
          if (decodedAiOrder.customer_phone) {
            orderForm.updateField(
              "customerNumber",
              decodedAiOrder.customer_phone
            );
          }

          if (decodedAiOrder.customer_id) {
            orderForm.updateField("customerName", decodedAiOrder.customer_id);
            setSearchQuery(
              `${decodedAiOrder.customer_id} - ${
                decodedAiOrder.customer_phone || ""
              }`
            );
          } else if (decodedAiOrder.customer_phone) {
            setSearchQuery(`Customer - ${decodedAiOrder.customer_phone}`);
          }

          // Clear existing items and populate with AI order items
          if (
            decodedAiOrder.items &&
            Array.isArray(decodedAiOrder.items) &&
            decodedAiOrder.items.length > 0
          ) {
            // First, reset the form items to have one empty item
            while (orderForm.form.items.length > 1) {
              orderForm.removeItem(orderForm.form.items.length - 1);
            }

            // Populate items from AI order with validation
            decodedAiOrder.items.forEach((aiItem: any, index: number) => {
              const mainProduct = products.find(
                (product: any) => product?._id === aiItem.product_id
              );
              console.log("mainProduct", mainProduct);
              if (mainProduct) {
                handleAddToOrder(mainProduct, aiItem.quantity, aiItem.unit);
                // orderForm.addNewItem(mainProduct, aiItem.quantity, aiItem.unit);
              }
            });
          }

          // Try to find and select the customer
          if (decodedAiOrder.customer_phone) {
            const cleanPhone = decodedAiOrder.customer_phone
              .toString()
              .replace(/^\+91/, "")
              .replace(/^91/, "");
            if (cleanPhone.length >= 10) {
              try {
                await customerSearch.searchByMobile(cleanPhone);
              } catch (error) {
                console.log(
                  "Customer not found, but form is prefilled with AI data"
                );
              }
            }
          }
        } catch (error) {
          console.error("Failed to parse AI order data:", error);
          // Show user-friendly error
          orderForm.setError(
            "Failed to load AI order data. Please try again or create the order manually."
          );
          setShowAiOrderInfo(false);
        }
      }
    };
    if (products.length && !aiOrderLoaded) {
      setAIOrderLoaded(true);
      loadAiOrderData();
    }
    console.log("products", products);
  }, [aiOrderParam, products, aiOrderLoaded, setAIOrderLoaded]);

  const handleCustomerSelect = (customer: Customer) => {
    customerSearch.selectCustomer(customer);
    orderForm.populateFromCustomer(customer);
    setSearchQuery(
      `${customer.customerName || "Unnamed"} - ${customer.mobileNumber}`
    );
  };

  const handleSearchQueryChange = (value: string) => {
    setSearchQuery(value);
    orderForm.updateField("customerNumber", value);
    if (!value) {
      customerSearch.clearSelection();
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    try {
      let result;

      if (isEditMode && orderForm.originalOrder) {
        // Handle edit mode
        result = await orderForm.updateOrder(
          editOrderId!,
          orderForm.originalOrder as unknown as Record<string, unknown>
        );

        // Show wallet update feedback
        if (result.walletUpdate) {
          const update = result.walletUpdate;
          let message = `Order updated successfully!\n\n`;

          if (update.walletAmountChanged) {
            message += `💰 WALLET TRANSACTION UPDATED:\n`;
            message += `Previous amount: ₹${update.previousWalletAmount.toFixed(
              2
            )}\n`;
            message += `New amount: ₹${update.newWalletAmount.toFixed(2)}\n`;
            message += `Your wallet balance: ₹${update.currentWalletBalance.toFixed(
              2
            )}`;
          } else {
            message += `No wallet changes required.`;
          }

          alert(message);
        } else {
          alert("Order updated successfully!");
        }
      } else {
        // Handle create mode
        result = await orderForm.submitOrder();
        const finalTotal = orderForm.finalAmount;

        // Show wallet feedback if wallet was used
        if (result.wallet) {
          if (result.wallet.walletUsed) {
            const finalAmountToPay =
              result.wallet.finalAmountAfterWallet ?? finalTotal;
            let message = `Order created successfully!\n${result.wallet.message}`;

            if (finalAmountToPay === 0) {
              message += `\n\n✅ ORDER FULLY PAID FROM WALLET\nAmount to pay: ₹0`;
            } else {
              message += `\n\nRemaining amount to pay: ₹${finalAmountToPay.toFixed(
                2
              )}`;
            }

            alert(message);
          } else if (
            !result.wallet.success &&
            result.wallet.message.includes("Insufficient")
          ) {
            alert(
              `Order created but wallet couldn't process payment:\n${
                result.wallet.message
              }\n\nFull amount to pay: ₹${finalTotal.toFixed(2)}`
            );
          }
        } else {
          alert(
            `Order created successfully!\nAmount to pay: ₹${finalTotal.toFixed(
              2
            )}`
          );
        }
      }

      if (aiOrderData && aiOrderData._id) {
        // If the order was created from an AI order, mark it as accepted
        await fetch(`/api/ai-orders/${aiOrderData._id}`, {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ verification_status: "verified" }),
        });
      }

      // Navigate back to orders page
      router.push("/orders");
    } catch {
      // Error is handled in the hook
    }
  };

  const handleCancel = () => {
    orderForm.resetForm();
    customerSearch.clearSelection();
    router.push("/orders");
  };

  const handleAddToOrder = (
    product: any,
    customQuantity?: number,
    customUnit?: string
  ) => {
    // console.log("comme to adding product", product);
    const quantity = customQuantity || product.quantity || 1;
    const unit = (customUnit || product.unit).toLocaleUpperCase();

    // Calculate price based on unit conversion
    let price = product.price;
    if (product.unit !== unit) {
      if (product.unit.toLocaleUpperCase() === "GM" && unit === "KG") {
        // Convert from GM to KG: multiply quantity by 1000 to get GM equivalent
        price = (product.price / product.quantity) * (quantity * 1000);
      } else if (product.unit.toLocaleUpperCase() === "KG" && unit === "GM") {
        // Convert from KG to GM: divide quantity by 1000 to get KG equivalent
        price = (product.price / (product.quantity * 1000)) * quantity;
      } else {
        // Same unit or no conversion needed
        price = (product.price / product.quantity) * quantity;
      }
    } else {
      // Same unit - calculate proportional price
      price = (product.price / product.quantity) * quantity;
    }

    price = Math.round(price); // Round to nearest rupee
    console.log("final price of product");

    // Check if product already exists in the order (only check items with names)
    const existingItemIndex = orderForm.form.items.findIndex(
      (item) => item.name && item.name === product.name
    );

    if (existingItemIndex !== -1) {
      // Product already exists, update the existing item
      const existingItem = orderForm.form.items[existingItemIndex];
      const newQuantity = (existingItem.quantity || 0) + quantity;
      const newPrice = Math.round((price / quantity) * newQuantity);

      orderForm.updateItem(existingItemIndex, "quantity", newQuantity);
      orderForm.updateItem(existingItemIndex, "price", newPrice);
      orderForm.updateItem(existingItemIndex, "unit", unit);
    } else {
      orderForm.addNewItem({
        name: product.name,
        unit,
        quantity,
        price,
      });
      // Product doesn't exist, find an empty slot or add new item
      const emptyItemIndex = orderForm.form.items.findIndex(
        (item) => !item.name || item.name === ""
      );

      // if (emptyItemIndex !== -1) {
      //   console.log("filling empty slot", product.name);
      //   // Fill the empty slot
      //   orderForm.updateItem(emptyItemIndex, "name", product.name);
      //   orderForm.updateItem(emptyItemIndex, "unit", unit);
      //   orderForm.updateItem(emptyItemIndex, "quantity", quantity);
      //   orderForm.updateItem(emptyItemIndex, "price", price);
      // } else {
      //   console.log("call add new items", product.name);
      //   orderForm.addNewItem({
      //     name: product.name,
      //     unit,
      //     quantity,
      //     price,
      //   });
      // }
    }
  };

  // Add this new function to handle updates from VegetableGrid
  const handleUpdateFromGrid = (
    productName: string,
    newQuantity: number,
    newUnit: string,
    originalProduct: any
  ) => {
    // Find the existing item in the order
    const existingItemIndex = orderForm.form.items.findIndex(
      (item) => item.name && item.name === productName
    );

    if (existingItemIndex !== -1) {
      // Calculate new price based on unit conversion
      let price = originalProduct.price;
      if (originalProduct.unit !== newUnit) {
        if (originalProduct.unit === "GM" && newUnit === "KG") {
          price =
            (originalProduct.price / originalProduct.quantity) *
            (newQuantity * 1000);
        } else if (originalProduct.unit === "KG" && newUnit === "GM") {
          price =
            (originalProduct.price / (originalProduct.quantity * 1000)) *
            newQuantity;
        } else {
          price =
            (originalProduct.price / originalProduct.quantity) * newQuantity;
        }
      } else {
        price =
          (originalProduct.price / originalProduct.quantity) * newQuantity;
      }

      price = Math.round(price);

      // Update the existing item
      orderForm.updateItem(existingItemIndex, "quantity", newQuantity);
      orderForm.updateItem(existingItemIndex, "unit", newUnit);
      orderForm.updateItem(existingItemIndex, "price", price);
    }
  };

  // Use the memoized values from the hook for real-time updates
  const total = orderForm.total;
  const finalTotal = orderForm.finalAmount;
  const discount =
    typeof orderForm.form.discount === "string"
      ? parseFloat(orderForm.form.discount) || 0
      : orderForm.form.discount;

  if (orderForm.isLoadingOrder) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="bg-white p-8 rounded-lg shadow-md flex items-center space-x-4">
          <div className="animate-spin h-8 w-8 border-4 border-blue-600 border-t-transparent rounded-full"></div>
          <span className="text-gray-600">Loading order data...</span>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-7xl mx-auto">
        {/* Breadcrumb */}
        <Breadcrumb
          items={[
            { label: "Dashboard", href: "/dashboard" },
            { label: "Orders", href: "/orders" },
            { label: isEditMode ? "Edit Order" : "Create Order" },
          ]}
        />

        {/* Header */}
        <div className="mb-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">
                {isEditMode ? "Edit Order" : "Create New Order"}
              </h1>
              <p className="text-gray-600 mt-1">
                {isEditMode
                  ? "Update the order details below"
                  : "Fill in the customer information and select vegetables"}
              </p>
            </div>
            <div className="flex space-x-2">
              <button
                type="button"
                onClick={handleCancel}
                className="px-6 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleSubmit}
                disabled={
                  orderForm.isSubmitting || orderForm.form.items.length === 0
                }
                className="px-6 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                {orderForm.isSubmitting
                  ? isEditMode
                    ? "Updating..."
                    : "Creating..."
                  : isEditMode
                  ? "Update Order"
                  : "Save Order"}
              </button>
            </div>
          </div>
        </div>

        {/* Error Alert */}
        {orderForm.error && (
          <div className="mb-6 p-4 bg-red-50 border border-red-200 text-red-700 rounded-lg">
            {orderForm.error}
          </div>
        )}

        {/* AI Order Information Section */}
        {showAiOrderInfo && aiOrderData && (
          <div className="mb-8 bg-gradient-to-r from-purple-50 to-blue-50 rounded-lg shadow-sm p-6 border border-purple-200">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center space-x-2">
                <span className="text-2xl">🤖</span>
                <h2 className="text-xl font-semibold text-gray-900">
                  AI Order Information
                </h2>
              </div>
              <button
                type="button"
                onClick={() => setShowAiOrderInfo(false)}
                className="text-gray-400 hover:text-gray-600 text-sm"
              >
                ✕ Hide
              </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* AI Confidence and Status */}
              <div className="space-y-4">
                <div>
                  <h3 className="text-sm font-medium text-gray-700 mb-2">
                    AI Analysis
                  </h3>
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-gray-600">
                        Confidence Level:
                      </span>
                      <div className="flex items-center space-x-2">
                        <div className="w-24 h-2 bg-gray-200 rounded-full">
                          <div
                            className={`h-2 rounded-full ${
                              (aiOrderData.ai_confidence || 0) >= 0.8
                                ? "bg-green-500"
                                : (aiOrderData.ai_confidence || 0) >= 0.6
                                ? "bg-yellow-500"
                                : "bg-red-500"
                            }`}
                            style={{
                              width: `${
                                (aiOrderData.ai_confidence || 0) * 100
                              }%`,
                            }}
                          ></div>
                        </div>
                        <span className="text-sm font-medium">
                          {Math.round((aiOrderData.ai_confidence || 0) * 100)}%
                        </span>
                      </div>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-gray-600">Status:</span>
                      <span
                        className={`px-2 py-1 text-xs font-medium rounded-full ${
                          aiOrderData.verification_status === "verified"
                            ? "bg-green-100 text-green-800"
                            : aiOrderData.verification_status === "pending"
                            ? "bg-yellow-100 text-yellow-800"
                            : aiOrderData.verification_status ===
                              "needs_clarification"
                            ? "bg-orange-100 text-orange-800"
                            : "bg-red-100 text-red-800"
                        }`}
                      >
                        {(aiOrderData.verification_status || "unknown")
                          .replace("_", " ")
                          .toUpperCase()}
                      </span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-gray-600">
                        Estimated Total:
                      </span>
                      <span className="text-sm font-medium">
                        ₹{(aiOrderData.estimated_total || 0).toFixed(2)}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Notes */}
                {aiOrderData.notes && (
                  <div>
                    <h3 className="text-sm font-medium text-gray-700 mb-2">
                      📝 AI Notes
                    </h3>
                    <div className="bg-white p-3 rounded border text-sm text-gray-600">
                      {aiOrderData.notes}
                    </div>
                  </div>
                )}
              </div>

              {/* Unrecognized Products and Customer Messages */}
              <div className="space-y-4">
                {/* Unrecognized Products */}
                {aiOrderData.unrecognized_products &&
                  aiOrderData.unrecognized_products.length > 0 && (
                    <div>
                      <h3 className="text-sm font-medium text-gray-700 mb-2">
                        ⚠️ Unrecognized Products
                      </h3>
                      <div className="bg-yellow-50 border border-yellow-200 p-3 rounded">
                        <ul className="space-y-1">
                          {aiOrderData.unrecognized_products.map(
                            (product: string, index: number) => (
                              <li
                                key={index}
                                className="text-sm text-yellow-800 flex items-center space-x-2"
                              >
                                <span className="w-2 h-2 bg-yellow-400 rounded-full"></span>
                                <span>{product}</span>
                              </li>
                            )
                          )}
                        </ul>
                        <p className="text-xs text-yellow-700 mt-2">
                          These products were mentioned but couldn't be matched
                          to your inventory.
                        </p>
                      </div>
                    </div>
                  )}

                {/* Customer Messages */}
                {aiOrderData.customer_messages &&
                  aiOrderData.customer_messages.length > 0 && (
                    <div>
                      <h3 className="text-sm font-medium text-gray-700 mb-2">
                        💬 Customer Messages (
                        {aiOrderData.customer_messages.length})
                      </h3>
                      <div className="bg-blue-50 border border-blue-200 p-3 rounded max-h-32 overflow-y-auto">
                        <div className="space-y-2">
                          {aiOrderData.customer_messages
                            .slice(0, 3)
                            .map((message: any, index: number) => (
                              <div key={index} className="text-sm">
                                <div className="flex items-center justify-between">
                                  <span
                                    className={`px-2 py-1 text-xs rounded ${
                                      message.message_type === "order"
                                        ? "bg-green-100 text-green-700"
                                        : message.message_type ===
                                          "clarification"
                                        ? "bg-orange-100 text-orange-700"
                                        : "bg-gray-100 text-gray-700"
                                    }`}
                                  >
                                    {message.message_type}
                                  </span>
                                  <span className="text-xs text-gray-500">
                                    {new Date(
                                      message.timestamp
                                    ).toLocaleTimeString()}
                                  </span>
                                </div>
                                <p className="text-blue-800 mt-1">
                                  {message.message_text}
                                </p>
                              </div>
                            ))}
                          {aiOrderData.customer_messages.length > 3 && (
                            <p className="text-xs text-blue-600 italic">
                              ...and {aiOrderData.customer_messages.length - 3}{" "}
                              more messages
                            </p>
                          )}
                        </div>
                      </div>
                    </div>
                  )}
              </div>
            </div>

            {/* Order Timeline */}
            <div className="mt-4 pt-4 border-t border-purple-200">
              <div className="flex items-center justify-between text-xs text-gray-500">
                <span>
                  📅 Order Date:{" "}
                  {aiOrderData.order_date
                    ? new Date(aiOrderData.order_date).toLocaleDateString()
                    : "N/A"}
                </span>
                <span>
                  🔄 Last Updated:{" "}
                  {aiOrderData.last_updated
                    ? new Date(aiOrderData.last_updated).toLocaleString()
                    : "N/A"}
                </span>
              </div>
            </div>
          </div>
        )}

        <form onSubmit={handleSubmit}>
          <div className="grid grid-cols-1 lg:grid-cols-5 gap-8">
            {/* Left Column - Customer Information (2/5 width) */}
            <div className="lg:col-span-2 bg-white rounded-lg shadow-sm p-6">
              <h2 className="text-xl font-semibold text-gray-900 mb-4">
                Customer Information
              </h2>

              <div className="space-y-6">
                <EnhancedCustomerSearchSection
                  customerSearch={customerSearch}
                  searchQuery={searchQuery}
                  onSearchQueryChange={handleSearchQueryChange}
                  onCustomerSelect={handleCustomerSelect}
                  disabled={orderForm.isSubmitting}
                />

                <CustomerInfoSection
                  form={orderForm.form}
                  selectedCustomer={customerSearch.selectedCustomer}
                  onFieldChange={orderForm.updateField}
                  disabled={orderForm.isSubmitting}
                />

                {/* Wallet Balance Information */}
                {customerSearch.selectedCustomer && (
                  <div className="border-t pt-6">
                    <h3 className="text-lg font-semibold text-gray-800 mb-3">
                      💰 Wallet Information
                    </h3>
                    {walletBalance.loading ? (
                      <div className="flex items-center space-x-2 p-3 bg-gray-50 rounded">
                        <div className="animate-spin h-4 w-4 border-2 border-blue-600 border-t-transparent rounded-full"></div>
                        <span className="text-sm text-gray-600">
                          Loading wallet balance...
                        </span>
                      </div>
                    ) : walletBalance.error ? (
                      <div className="p-3 bg-red-50 border border-red-200 text-red-700 rounded text-sm">
                        Error loading wallet: {walletBalance.error}
                      </div>
                    ) : (
                      <div className="p-4 bg-blue-50 border border-blue-200 rounded">
                        <div className="flex justify-between items-center mb-2">
                          <span className="text-sm font-medium text-gray-700">
                            Current Balance:
                          </span>
                          <span className="text-lg font-bold text-blue-600">
                            ₹{(walletBalance.balance || 0).toLocaleString()}
                          </span>
                        </div>

                        {finalTotal > 0 && (
                          <div className="mt-3 p-3 bg-white rounded border">
                            <div className="text-sm text-gray-600 mb-2">
                              Order Payment Analysis:
                            </div>
                            {(walletBalance.balance || 0) >= finalTotal ? (
                              <div className="text-green-600 font-medium text-sm">
                                ✅ Sufficient balance (₹
                                {(
                                  (walletBalance.balance || 0) - finalTotal
                                ).toFixed(2)}{" "}
                                remaining)
                              </div>
                            ) : (
                              <div className="text-orange-600 text-sm">
                                {(walletBalance.balance || 0) > 0
                                  ? `Insufficient balance (₹${(
                                      finalTotal - (walletBalance.balance || 0)
                                    ).toFixed(2)} short)`
                                  : "No wallet balance available"}
                                <div className="text-xs text-orange-600 mt-1">
                                  Order will be processed but wallet payment may
                                  not cover full amount
                                </div>
                              </div>
                            )}
                          </div>
                        )}

                        <button
                          type="button"
                          onClick={walletBalance.refreshBalance}
                          className="text-blue-600 hover:text-blue-800 text-sm underline mt-2"
                        >
                          🔄 Refresh Balance
                        </button>
                      </div>
                    )}
                  </div>
                )}
              </div>
            </div>

            {/* Right Column - Order Items (3/5 width) */}
            <div className="lg:col-span-3 bg-white rounded-lg shadow-sm p-6">
              <div className="flex justify-between items-center mb-4">
                <h2 className="text-xl font-semibold text-gray-900">
                  Select Vegetables
                </h2>
                <div className="flex items-center space-x-2">
                  <span className="text-sm text-gray-500">
                    {orderForm.form.items.filter((item) => item.name).length}{" "}
                    items
                  </span>
                </div>
              </div>

              {/* Added Items List */}
              <div className="mb-6">
                <OrderItemsList
                  items={orderForm.form.items}
                  onUpdateItem={orderForm.updateItem}
                  onRemoveItem={orderForm.removeItem}
                  disabled={orderForm.isSubmitting}
                />
              </div>

              {/* Vegetable Grid */}
              <VegetableGrid
                products={products}
                productsLoading={productsLoading}
                productsError={productsError}
                onAddToOrder={handleAddToOrder}
                onUpdateFromGrid={handleUpdateFromGrid}
                addedItems={orderForm.form.items}
                disabled={orderForm.isSubmitting}
              />
            </div>
          </div>

          {/* Order Summary - Bottom */}
          <div className="mt-8 bg-white rounded-lg shadow-sm p-6">
            <h2 className="text-xl font-semibold text-gray-900 mb-4">
              Order Summary
            </h2>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {/* Added Items */}
              <div className="md:col-span-2">
                <h3 className="text-sm font-medium text-gray-700 mb-3">
                  Added Items (
                  {orderForm.form.items.filter((item) => item.name).length}{" "}
                  items)
                </h3>
                <div className="space-y-2 max-h-40 overflow-y-auto">
                  {orderForm.form.items
                    .filter((item) => item.name)
                    .map((item, index) => (
                      <div
                        key={index}
                        className="flex justify-between items-center py-2 px-3 bg-gray-50 rounded text-sm"
                      >
                        <div className="flex-1">
                          <span className="font-medium">{item.name}</span>
                          <span className="text-gray-500 ml-2">
                            {item.quantity} {item.unit}
                          </span>
                        </div>
                        <span className="font-medium">
                          ₹
                          {typeof item.price === "string"
                            ? parseFloat(item.price) || 0
                            : item.price}
                        </span>
                      </div>
                    ))}
                </div>
              </div>

              {/* Price Summary */}
              <div className="bg-gray-50 p-4 rounded-lg">
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span>Subtotal:</span>
                    <span>₹{total.toLocaleString()}</span>
                  </div>
                  {discount > 0 && (
                    <div className="flex justify-between text-green-600">
                      <span>Discount:</span>
                      <span>-₹{discount.toLocaleString()}</span>
                    </div>
                  )}
                  <div className="border-t pt-2 flex justify-between font-bold text-lg">
                    <span>Total:</span>
                    <span className="text-green-600">
                      ₹{finalTotal.toLocaleString()}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
}

export default function CreateEditOrderPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen bg-gray-50 flex items-center justify-center">
          <div className="bg-white p-8 rounded-lg shadow-md flex items-center space-x-4">
            <div className="animate-spin h-8 w-8 border-4 border-blue-600 border-t-transparent rounded-full"></div>
            <span className="text-gray-600">Loading...</span>
          </div>
        </div>
      }
    >
      <CreateEditOrderContent />
    </Suspense>
  );
}
