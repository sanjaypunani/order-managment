// Enhanced OrderFormModal with multiple customer search options
import React, { useState } from "react";
import { Modal, Button, Alert } from "../../../components/ui";
import { useCustomerSearch, useOrderForm } from "../../../hooks";
import { Customer } from "../../../types";
import { EnhancedCustomerSearchSection } from "./EnhancedCustomerSearchSection";
import { CustomerInfoSection } from "./CustomerInfoSection";
import { OrderItemsSection } from "./OrderItemsSection";

interface Product {
  name: string;
  price: number;
  unit: string;
  quantity: number;
}

interface EnhancedOrderFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  products?: Product[];
  productsLoading?: boolean;
  productsError?: string | null;
  onOrderCreated?: () => void;
}

export const EnhancedOrderFormModal: React.FC<EnhancedOrderFormModalProps> = ({
  isOpen,
  onClose,
  products = [],
  productsLoading = false,
  productsError = null,
  onOrderCreated,
}) => {
  const customerSearch = useCustomerSearch();
  const orderForm = useOrderForm();
  const [searchQuery, setSearchQuery] = useState("");

  const handleCustomerSelect = (customer: Customer) => {
    orderForm.populateFromCustomer(customer);
    // Update search query to show selected customer info
    setSearchQuery(
      `${customer.customerName || "Unnamed"} - ${customer.mobileNumber}`
    );
  };

  const handleSearchQueryChange = (value: string) => {
    setSearchQuery(value);
    // Update the appropriate form field based on search type
    orderForm.updateField("customerNumber", value);
    if (!value) {
      customerSearch.clearSelection();
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    try {
      await orderForm.submitOrder();
      customerSearch.clearSelection();
      setSearchQuery("");
      onOrderCreated?.();
      onClose();
    } catch {
      // Error is handled in the hook
    }
  };

  const handleClose = () => {
    orderForm.resetForm();
    customerSearch.clearSelection();
    setSearchQuery("");
    onClose();
  };

  const total = orderForm.calculateTotal();
  const discount =
    typeof orderForm.form.discount === "string"
      ? parseFloat(orderForm.form.discount) || 0
      : orderForm.form.discount;
  const finalTotal = total - discount;

  return (
    <Modal
      isOpen={isOpen}
      onClose={handleClose}
      title="Create Order"
      size="2xl"
    >
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
        <div className="mt-6 p-4 border rounded-lg bg-gray-50">
          <h3 className="font-semibold mb-2">Order Summary</h3>
          <div className="flex justify-between text-sm">
            <span>Subtotal:</span>
            <span>₹{total.toFixed(2)}</span>
          </div>
          <div className="flex justify-between text-sm">
            <span>Discount:</span>
            <span>₹{discount.toFixed(2)}</span>
          </div>
          <div className="flex justify-between font-semibold text-lg border-t pt-2">
            <span>Total:</span>
            <span>₹{finalTotal.toFixed(2)}</span>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex justify-end space-x-3 mt-6">
          <Button
            type="button"
            variant="secondary"
            onClick={handleClose}
            disabled={orderForm.isSubmitting}
          >
            Cancel
          </Button>
          <Button
            type="submit"
            disabled={orderForm.isSubmitting || !orderForm.form.customerNumber}
          >
            {orderForm.isSubmitting ? "Creating..." : "Create Order"}
          </Button>
        </div>
      </form>
    </Modal>
  );
};
