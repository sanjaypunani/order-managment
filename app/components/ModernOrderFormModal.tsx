// Modern OrderFormModal that integrates with existing app structure
"use client";
import React, { useState, useEffect } from "react";
import { Modal, Button, Alert } from "../../src/components/ui";
import { useCustomerSearch, useWalletBalance } from "../../src/hooks";
import { useOrderForm } from "../../src/hooks/useOrderForm";
import { useProducts } from "../dashboard/useProducts";
import { EnhancedCustomerSearchSection } from "../../src/features/orders/components/EnhancedCustomerSearchSection";
import { CustomerInfoSection } from "../../src/features/orders/components/CustomerInfoSection";
import { OrderItemsSection } from "../../src/features/orders/components/OrderItemsSection";
import { Customer } from "../../src/types";

interface ModernOrderFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  onOrderCreated?: () => void;
  editOrderId?: string | null;
}

export const ModernOrderFormModal: React.FC<ModernOrderFormModalProps> = ({
  isOpen,
  onClose,
  onOrderCreated,
  editOrderId = null,
}) => {
  const customerSearch = useCustomerSearch();
  const orderForm = useOrderForm();
  const [searchQuery, setSearchQuery] = useState("");
  const [originalOrder, setOriginalOrder] = useState(null);
  const [isLoadingOrder, setIsLoadingOrder] = useState(false);

  // Fetch products when modal opens
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
      if (editOrderId && isOpen) {
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
  }, [editOrderId, isOpen]);

  const handleCustomerSelect = (customer: Customer) => {
    // Use the populateFromCustomer method from the modern hook
    orderForm.populateFromCustomer(customer);
    // Update search query to show selected customer info
    setSearchQuery(
      `${customer.customerName || "Unnamed"} - ${customer.mobileNumber}`
    );
  };

  const handleSearchQueryChange = (value: string) => {
    setSearchQuery(value);
    // Update the customer number field
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
        // Handle create mode (existing logic)
        result = await orderForm.submitOrder();

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
          // No wallet processing attempted
          alert(
            `Order created successfully!\nAmount to pay: ₹${finalTotal.toFixed(
              2
            )}`
          );
        }
      }

      customerSearch.clearSelection();
      setSearchQuery("");
      onOrderCreated?.();
      onClose();
    } catch {
      // Error is handled in the hook
    }
  };

  const handleClose = () => {
    // Reset the form using the resetForm method
    orderForm.resetForm();
    customerSearch.clearSelection();
    setSearchQuery("");
    onClose();
  };

  // Use the memoized values from the hook for real-time updates
  const total = orderForm.total;
  const finalTotal = orderForm.finalAmount;
  const discount =
    typeof orderForm.form.discount === "string"
      ? parseFloat(orderForm.form.discount) || 0
      : orderForm.form.discount;

  return (
    <Modal
      isOpen={isOpen}
      onClose={handleClose}
      title={isEditMode ? "Edit Order" : "Create Order"}
      size="2xl"
    >
      {orderForm.isLoadingOrder ? (
        <div className="p-6 flex items-center justify-center">
          <div className="animate-spin h-8 w-8 border-4 border-blue-600 border-t-transparent rounded-full"></div>
          <span className="ml-3 text-gray-600">Loading order data...</span>
        </div>
      ) : (
        <form onSubmit={handleSubmit} className="p-6">
          {orderForm.error && (
            <Alert variant="error" className="mb-4">
              {orderForm.error}
            </Alert>
          )}

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Left Column - Customer Information */}
            <div className="space-y-4">
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
                <div className="border-t pt-4">
                  <h4 className="text-md font-semibold text-gray-800 mb-3">
                    💰 Wallet Information
                  </h4>
                  {walletBalance.loading ? (
                    <div className="flex items-center space-x-2 p-3 bg-gray-50 rounded">
                      <div className="animate-spin h-4 w-4 border-2 border-blue-600 border-t-transparent rounded-full"></div>
                      <span className="text-gray-600">
                        Loading wallet balance...
                      </span>
                    </div>
                  ) : walletBalance.error ? (
                    <div className="p-3 bg-red-50 border border-red-200 rounded">
                      <span className="text-red-600">
                        ❌ {walletBalance.error}
                      </span>
                    </div>
                  ) : (
                    <div className="space-y-2">
                      <div className="p-3 bg-blue-50 border border-blue-200 rounded">
                        <div className="flex justify-between items-center">
                          <span className="text-gray-700">
                            Current Balance:
                          </span>
                          <span
                            className={`font-bold text-lg ${
                              walletBalance.balance && walletBalance.balance > 0
                                ? "text-green-600"
                                : "text-red-600"
                            }`}
                          >
                            ₹{walletBalance.balance?.toFixed(2) || "0.00"}
                          </span>
                        </div>
                      </div>

                      {/* Order total vs wallet balance comparison */}
                      {finalTotal > 0 && (
                        <div
                          className={`p-3 rounded border ${
                            walletBalance.balance &&
                            walletBalance.balance >= finalTotal
                              ? "bg-green-50 border-green-200"
                              : "bg-orange-50 border-orange-200"
                          }`}
                        >
                          <div className="space-y-1 text-sm">
                            <div className="flex justify-between">
                              <span>Order Total:</span>
                              <span className="font-semibold">
                                ₹{finalTotal.toFixed(2)}
                              </span>
                            </div>
                            {walletBalance.balance &&
                            walletBalance.balance >= finalTotal ? (
                              <div className="text-green-700">
                                ✅ Sufficient wallet balance
                                <div className="text-xs text-green-600">
                                  Remaining after order: ₹
                                  {(walletBalance.balance - finalTotal).toFixed(
                                    2
                                  )}
                                </div>
                              </div>
                            ) : (
                              <div className="text-orange-700">
                                ⚠️{" "}
                                {walletBalance.balance &&
                                walletBalance.balance > 0
                                  ? `Insufficient balance (₹${(
                                      finalTotal - (walletBalance.balance || 0)
                                    ).toFixed(2)} short)`
                                  : "No wallet balance available"}
                                <div className="text-xs text-orange-600">
                                  Order will be processed but wallet payment may
                                  not cover full amount
                                </div>
                              </div>
                            )}
                          </div>
                        </div>
                      )}

                      <button
                        type="button"
                        onClick={walletBalance.refreshBalance}
                        className="text-blue-600 hover:text-blue-800 text-sm underline"
                      >
                        🔄 Refresh Balance
                      </button>
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* Right Column - Order Items */}
            <div className="space-y-4">
              <OrderItemsSection
                form={orderForm.form}
                products={products}
                productsLoading={productsLoading}
                productsError={productsError}
                onItemChange={orderForm.updateItem}
                onAddItem={orderForm.addItem}
                onRemoveItem={orderForm.removeItem}
                disabled={orderForm.isSubmitting}
              />
            </div>
          </div>

          {/* Order Summary */}
          <div className="mt-6 p-4 bg-gray-50 rounded-lg">
            <h4 className="font-semibold mb-2">Order Summary</h4>
            <div className="space-y-1 text-sm">
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
              <div className="flex justify-between font-semibold border-t pt-1">
                <span>Total:</span>
                <span>₹{finalTotal.toLocaleString()}</span>
              </div>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex justify-end space-x-2 mt-6">
            <Button
              type="button"
              variant="outline"
              onClick={handleClose}
              disabled={orderForm.isSubmitting}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              variant="primary"
              isLoading={orderForm.isSubmitting}
              disabled={
                orderForm.isSubmitting || orderForm.form.items.length === 0
              }
            >
              {isEditMode ? "Update Order" : "Create Order"}
            </Button>
          </div>
        </form>
      )}
    </Modal>
  );
};

export default ModernOrderFormModal;
