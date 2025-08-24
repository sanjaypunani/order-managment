// Refactored OrderFormModal using the new component architecture
import React from "react";
import { Modal, Button, Alert } from "../../../components/ui";
import { useCustomerSearch, useOrderForm } from "../../../hooks";
import { Customer } from "../../../types";
import { CustomerSearchSection } from "./CustomerSearchSection";
import { CustomerInfoSection } from "./CustomerInfoSection";
import { OrderItemsSection } from "./OrderItemsSection";

interface Product {
  name: string;
  price: number;
  unit: string;
  quantity: number;
}

interface OrderFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  products?: Product[];
  productsLoading?: boolean;
  productsError?: string | null;
  onOrderCreated?: () => void;
}

export const OrderFormModal: React.FC<OrderFormModalProps> = ({
  isOpen,
  onClose,
  products = [],
  productsLoading = false,
  productsError = null,
  onOrderCreated,
}) => {
  const customerSearch = useCustomerSearch();
  const orderForm = useOrderForm();

  const handleCustomerSelect = (customer: Customer) => {
    orderForm.populateFromCustomer(customer);
  };

  const handleMobileNumberChange = (value: string) => {
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
      onOrderCreated?.();
      onClose();
    } catch {
      // Error is handled in the hook
    }
  };

  const handleClose = () => {
    orderForm.resetForm();
    customerSearch.clearSelection();
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
            <CustomerSearchSection
              customerSearch={customerSearch}
              mobileNumber={orderForm.form.customerNumber}
              onMobileNumberChange={handleMobileNumberChange}
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
            Create Order
          </Button>
        </div>
      </form>
    </Modal>
  );
};
