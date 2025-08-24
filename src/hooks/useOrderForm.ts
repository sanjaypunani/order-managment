// Custom hook for order form management
import { useState, useCallback, useMemo } from "react";
import { OrderFormState, OrderItem, Customer, Order } from "../types";
import { orderService, OrderResponse } from "../services";
import { WalletResult } from "../types/common";

const initialFormState: OrderFormState = {
  customerId: "", // Add customerId field for normalized structure
  customerNumber: "",
  customerName: "",
  flatNumber: "",
  socityName: "",
  status: "Pending",
  discount: "",
  deliveryDate: "",
  items: [{ name: "", quantity: 1, unit: "GM", price: 0 }],
};

export interface UseOrderFormReturn {
  form: OrderFormState;
  isSubmitting: boolean;
  error: string | null;
  walletResult: WalletResult | null;
  updateField: (field: keyof OrderFormState, value: string | number) => void;
  updateItem: (
    index: number,
    field: keyof OrderItem,
    value: string | number
  ) => void;
  addItem: () => void;
  addNewItem: (item: OrderItem) => void;
  removeItem: (index: number) => void;
  populateFromCustomer: (customer: Customer) => void;
  resetForm: () => void;
  submitOrder: () => Promise<OrderResponse>;
  updateOrder: (
    orderId: string,
    originalOrder: Record<string, unknown>
  ) => Promise<OrderResponse>;
  loadOrderForEdit: (orderId: string) => Promise<Order>;
  setError: (error: string | null) => void;
  calculateTotal: () => number;
  calculateFinalAmount: () => number;
  total: number;
  totalAmount: number;
  finalAmount: number;
  originalOrder: Order | null;
  isLoadingOrder: boolean;
}

export function useOrderForm(): UseOrderFormReturn {
  const [form, setForm] = useState<OrderFormState>(initialFormState);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [walletResult, setWalletResult] = useState<WalletResult | null>(null);
  const [originalOrder, setOriginalOrder] = useState<Order | null>(null);
  const [isLoadingOrder, setIsLoadingOrder] = useState(false);

  const updateField = useCallback(
    (field: keyof OrderFormState, value: string | number) => {
      setForm((prev) => ({ ...prev, [field]: value }));
    },
    []
  );

  const updateItem = useCallback(
    (index: number, field: keyof OrderItem, value: string | number) => {
      setForm((prev) => ({
        ...prev,
        items: prev.items.map((item, i) =>
          i === index ? { ...item, [field]: value } : item
        ),
      }));
    },
    []
  );

  const addItem = useCallback(() => {
    setForm((prev) => ({
      ...prev,
      items: [...prev.items, { name: "", quantity: 1, unit: "GM", price: 0 }],
    }));
  }, []);

  const addNewItem = useCallback((item: OrderItem) => {
    setForm((prev) => ({
      ...prev,
      items: [...prev.items, item],
    }));
  }, []);

  const removeItem = useCallback((index: number) => {
    setForm((prev) => ({
      ...prev,
      items: prev.items.filter((_, i) => i !== index),
    }));
  }, []);

  const populateFromCustomer = useCallback((customer: Customer) => {
    setForm((prev) => ({
      ...prev,
      customerId: customer._id, // Set the customer ID for normalized structure
      customerNumber: customer.mobileNumber,
      customerName: customer.customerName,
      flatNumber: customer.flatNumber,
      socityName: customer.societyName,
    }));
  }, []);

  const resetForm = useCallback(() => {
    setForm(initialFormState);
    setError(null);
    setWalletResult(null);
    setOriginalOrder(null);
  }, []);

  const loadOrderForEdit = useCallback(async (orderId: string) => {
    setIsLoadingOrder(true);
    try {
      const response = await fetch(`/api/orders/${orderId}`);
      const data = await response.json();

      if (data.success) {
        setOriginalOrder(data.order);

        // Populate form with existing order data
        setForm({
          customerId: data.order.customerId || "", // Handle customer ID
          customerName:
            data.order.customer?.customerName || data.order.customerName || "",
          customerNumber:
            data.order.customer?.mobileNumber ||
            data.order.customerNumber ||
            "",
          flatNumber:
            data.order.customer?.flatNumber || data.order.flatNumber || "",
          socityName:
            data.order.customer?.societyName || data.order.socityName || "",
          status: data.order.status || "Pending",
          discount: data.order.discount || "",
          deliveryDate: data.order.deliveryDate || "",
          items: data.order.items || [
            { name: "", quantity: 1, unit: "GM", price: 0 },
          ],
        });

        return data.order;
      }
      throw new Error(data.error || "Failed to load order");
    } catch (error) {
      setError("Failed to load order data");
      throw error;
    } finally {
      setIsLoadingOrder(false);
    }
  }, []);

  const updateOrder = useCallback(
    async (
      orderId: string,
      originalOrder: Record<string, unknown>
    ): Promise<OrderResponse> => {
      setIsSubmitting(true);
      setError(null);

      try {
        // Calculate totals for API
        const items = form.items.map((item) => ({
          ...item,
          price:
            typeof item.price === "string"
              ? parseFloat(item.price) || 0
              : item.price,
          quantity:
            typeof item.quantity === "string"
              ? parseFloat(item.quantity) || 0
              : item.quantity,
        }));

        const totalAmount = items.reduce((sum, item) => sum + item.price, 0);
        const discount = Number(form.discount) || 0;
        const finalAmount =
          totalAmount - discount < 0 ? 0 : totalAmount - discount;

        const orderData = {
          ...form,
          discount,
          items,
          totalAmount,
          finalAmount,
          originalWalletAmount: originalOrder.walletAmount || 0,
        };

        const response = await fetch(`/api/orders/${orderId}`, {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(orderData),
        });

        const result = await response.json();

        if (!result.success) {
          throw new Error(result.error || "Failed to update order");
        }

        return result;
      } catch (err) {
        setError(err instanceof Error ? err.message : "Failed to update order");
        throw err;
      } finally {
        setIsSubmitting(false);
      }
    },
    [form]
  );

  const calculateTotal = useCallback(() => {
    return form.items.reduce((total, item) => {
      const price =
        typeof item.price === "string"
          ? parseFloat(item.price) || 0
          : item.price;
      return total + price;
    }, 0);
  }, [form.items]);

  const calculateFinalAmount = useCallback(() => {
    const total = calculateTotal();
    const discount =
      typeof form.discount === "string"
        ? parseFloat(form.discount) || 0
        : form.discount;
    return Math.max(0, total - discount);
  }, [calculateTotal, form.discount]);

  const submitOrder = useCallback(async (): Promise<OrderResponse> => {
    setIsSubmitting(true);
    setError(null);
    setWalletResult(null);

    try {
      // Calculate totals for API
      const items = form.items.map((item) => ({
        ...item,
        price:
          typeof item.price === "string"
            ? parseFloat(item.price) || 0
            : item.price,
        quantity:
          typeof item.quantity === "string"
            ? parseFloat(item.quantity) || 0
            : item.quantity,
      }));

      const totalAmount = items.reduce((sum, item) => sum + item.price, 0);
      const discount = Number(form.discount) || 0;
      const finalAmount =
        totalAmount - discount < 0 ? 0 : totalAmount - discount;

      const orderData = {
        ...form,
        discount,
        items,
        totalAmount,
        finalAmount, // This is the amount customer needs to pay (wallet will be adjusted server-side)
      };

      const result = await orderService.createOrder(orderData);

      // Store wallet result for UI feedback
      if (result.wallet) {
        setWalletResult(result.wallet);

        // If wallet was used and completely covered the order, inform user
        if (
          result.wallet.walletUsed &&
          result.wallet.finalAmountAfterWallet === 0
        ) {
          console.log("Order fully paid from wallet. Final amount to pay: ₹0");
        }
      }

      // Reset form on successful submission
      resetForm();

      return result;
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to create order");
      throw err;
    } finally {
      setIsSubmitting(false);
    }
  }, [form, resetForm]);

  // Memoized calculations for real-time updates
  const total = useMemo(() => {
    return form.items.reduce((total, item) => {
      const price =
        typeof item.price === "string"
          ? parseFloat(item.price) || 0
          : item.price;
      return total + price;
    }, 0);
  }, [form.items]);

  const finalAmount = useMemo(() => {
    const discount =
      typeof form.discount === "string"
        ? parseFloat(form.discount) || 0
        : form.discount;
    return Math.max(0, total - discount);
  }, [total, form.discount]);

  return {
    form,
    isSubmitting,
    error,
    walletResult,
    updateField,
    updateItem,
    addItem,
    addNewItem,
    removeItem,
    populateFromCustomer,
    resetForm,
    submitOrder,
    updateOrder,
    loadOrderForEdit,
    setError,
    calculateTotal,
    calculateFinalAmount,
    total,
    totalAmount: total, // Same as total for consistency
    finalAmount,
    originalOrder,
    isLoadingOrder,
  };
}
