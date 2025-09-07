// Order service for API operations
import { apiClient } from "./apiClient";
import { Order, OrderFilters, CreateOrderDto, UpdateOrderDto } from "../types";
import { WalletResult } from "../types/common";
import { API_ENDPOINTS } from "../constants";

export interface OrderResponse {
  order: Order;
  wallet?: WalletResult;
  walletUpdate?: {
    walletAmountChanged: boolean;
    previousWalletAmount: number;
    newWalletAmount: number;
    currentWalletBalance: number;
    difference: number;
  };
}

export class OrderService {
  async getOrders(filters?: OrderFilters): Promise<Order[]> {
    try {
      const params = filters
        ? Object.fromEntries(
            Object.entries(filters).map(([key, value]) => [key, String(value)])
          )
        : undefined;

      const response = await apiClient.get<Order[]>(
        API_ENDPOINTS.ORDERS,
        params
      );
      return response.data || [];
    } catch (error) {
      console.error("Error fetching orders:", error);
      return [];
    }
  }

  async getOrderById(id: string): Promise<Order | null> {
    try {
      const response = await apiClient.get<Order>(
        `${API_ENDPOINTS.ORDERS}/${id}`
      );
      return response.data || null;
    } catch (error) {
      console.error("Error fetching order:", error);
      return null;
    }
  }

  async createOrder(order: CreateOrderDto): Promise<OrderResponse> {
    const orderData = {
      ...order,
      items: order.items.map((item) => ({
        ...item,
        price:
          typeof item.price === "string"
            ? parseFloat(item.price) || 0
            : item.price,
        quantity:
          typeof item.quantity === "string"
            ? parseFloat(item.quantity) || 0
            : item.quantity,
      })),
    };
    console.log("Creating order with data:", orderData);
    const response = await apiClient.post<Order>(
      API_ENDPOINTS.ORDERS,
      orderData
    );
    if (!response.success) {
      throw new Error(response.message || "Failed to create order");
    }

    // Return both order data and wallet information
    return {
      order: response.data!,
      wallet: response.wallet, // Wallet result from API
    };
  }

  async updateOrder(order: UpdateOrderDto): Promise<OrderResponse> {
    const orderData = {
      ...order,
      items: order.items?.map((item) => ({
        ...item,
        price:
          typeof item.price === "string"
            ? parseFloat(item.price) || 0
            : item.price,
        quantity:
          typeof item.quantity === "string"
            ? parseFloat(item.quantity) || 0
            : item.quantity,
      })),
    };

    const response = await apiClient.put<Order>(
      API_ENDPOINTS.ORDERS,
      orderData
    );
    if (!response.success) {
      throw new Error(response.message || "Failed to update order");
    }

    // Return both order data and wallet information
    return {
      order: response.data!,
      wallet: response.wallet, // Wallet result from API
    };
  }

  async deleteOrder(id: string): Promise<void> {
    const response = await apiClient.delete(`${API_ENDPOINTS.ORDERS}/${id}`);
    if (!response.success) {
      throw new Error(response.message || "Failed to delete order");
    }
  }

  async calculateOrderTotal(
    items: Array<{ price: number; quantity: number }>
  ): Promise<number> {
    return items.reduce((total, item) => total + item.price * item.quantity, 0);
  }
}

export const orderService = new OrderService();
