// Lazy-loaded OrderFormModal for performance optimization
import React, { lazy, Suspense } from "react";
import { LoadingSpinner } from "../../../components/ui";

// Lazy load the main OrderFormModal component
const OrderFormModal = lazy(() =>
  import("./OrderFormModal").then((module) => ({
    default: module.OrderFormModal,
  }))
);

interface Product {
  name: string;
  price: number;
  unit: string;
  quantity: number;
}

interface LazyOrderFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  products?: Product[];
  productsLoading?: boolean;
  productsError?: string | null;
  onOrderCreated?: () => void;
}

export const LazyOrderFormModal: React.FC<LazyOrderFormModalProps> = (
  props
) => {
  if (!props.isOpen) {
    return null; // Don't render anything if modal is closed
  }

  return (
    <Suspense
      fallback={
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-8 flex flex-col items-center">
            <LoadingSpinner size="lg" />
            <p className="mt-4 text-gray-600">Loading order form...</p>
          </div>
        </div>
      }
    >
      <OrderFormModal {...props} />
    </Suspense>
  );
};

export default LazyOrderFormModal;
