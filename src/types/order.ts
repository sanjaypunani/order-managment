// Type definitions for Order-related entities
import { Customer } from "./customer";

export interface OrderItem {
  id?: string;
  name: string;
  quantity: number;
  unit: string;
  price: number;
  productId?: string;
}

export interface Order {
  _id?: string;
  customerId?: string; // New normalized field
  customer?: Customer; // Populated customer data
  // Keep backwards compatibility fields during transition
  customerNumber?: string;
  customerName?: string;
  flatNumber?: string;
  socityName?: string; // Note: keeping typo for backward compatibility
  status: "Pending" | "Delivered";
  discount: number;
  deliveryDate: string;
  items: OrderItem[];
  finalAmount?: number;
  createdAt?: string;
  updatedAt?: string;
}

export interface CreateOrderDto {
  customerId?: string; // New normalized field
  // Keep backwards compatibility fields during transition
  customerNumber?: string;
  customerName?: string;
  flatNumber?: string;
  socityName?: string;
  status: "Pending" | "Delivered";
  discount: number;
  deliveryDate: string;
  items: OrderItem[];
}

export interface UpdateOrderDto extends Partial<CreateOrderDto> {
  id: string;
}

export interface OrderFilters {
  deliveryDate?: string;
  societyName?: string;
  status?: string;
  discountFilter?: "applied" | "not-applied" | "";
}

export interface OrderFormState {
  customerId?: string; // New normalized field
  customerNumber: string;
  customerName: string;
  flatNumber: string;
  socityName: string;
  status: "Pending" | "Delivered";
  discount: string | number;
  deliveryDate: string;
  items: OrderItem[];
}
