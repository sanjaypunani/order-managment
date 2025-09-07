// Example usage of the refactored OrderFormModal in the orders page
"use client";
import React, { useState } from "react";
import { Button } from "../../../components/ui";
import { OrderFormModal } from "../components";
import { useProducts } from "../../../../app/dashboard/useProducts"; // Fixed import path

export default function RefactoredOrdersPage() {
  const [showModal, setShowModal] = useState(false);
  const {
    items: products,
    loading: productsLoading,
    error: productsError,
  } = useProducts();

  const handleOrderCreated = () => {
    // Refresh orders list
    console.log("Order created successfully!");
  };

  return (
    <div className="p-6">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">Order Management</h1>
        <Button onClick={() => setShowModal(true)}>+ Create Order</Button>
      </div>

      {/* Orders list would go here */}
      <div className="bg-white rounded-lg shadow p-4">
        <p className="text-gray-500">Orders list will be displayed here...</p>
      </div>

      {/* Refactored Modal */}
      <OrderFormModal
        isOpen={showModal}
        onClose={() => setShowModal(false)}
        products={products}
        productsLoading={productsLoading}
        productsError={productsError}
        onOrderCreated={handleOrderCreated}
      />
    </div>
  );
}
