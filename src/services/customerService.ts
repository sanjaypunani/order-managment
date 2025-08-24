// Customer service for API operations
import { apiClient } from "./apiClient";
import {
  Customer,
  CustomerFilters,
  CreateCustomerDto,
  UpdateCustomerDto,
} from "../types";
import { API_ENDPOINTS } from "../constants";

export class CustomerService {
  async searchByMobile(mobileNumber: string): Promise<Customer[]> {
    try {
      const response = await apiClient.get<Customer[]>(
        API_ENDPOINTS.CUSTOMERS,
        {
          mobileNumber,
        }
      );
      return response.data || [];
    } catch (error) {
      console.error("Error searching customers by mobile:", error);
      return [];
    }
  }

  async searchByFlat(flatNumber: string): Promise<Customer[]> {
    try {
      const response = await apiClient.get<Customer[]>(
        API_ENDPOINTS.CUSTOMERS,
        {
          flatNumber,
        }
      );
      return response.data || [];
    } catch (error) {
      console.error("Error searching customers by flat:", error);
      return [];
    }
  }

  async getCustomers(filters?: CustomerFilters): Promise<Customer[]> {
    try {
      // Filter out undefined values to match apiClient expectations
      const cleanFilters = filters
        ? (Object.fromEntries(
            Object.entries(filters).filter(([, value]) => value !== undefined)
          ) as Record<string, string>)
        : undefined;

      const response = await apiClient.get<Customer[]>(
        API_ENDPOINTS.CUSTOMERS,
        cleanFilters
      );
      return response.data || [];
    } catch (error) {
      console.error("Error fetching customers:", error);
      return [];
    }
  }

  async createCustomer(customer: CreateCustomerDto): Promise<Customer> {
    const response = await apiClient.post<Customer>(
      API_ENDPOINTS.CUSTOMERS,
      customer
    );
    if (!response.success) {
      throw new Error(response.message || "Failed to create customer");
    }
    return response.data!;
  }

  async updateCustomer(customer: UpdateCustomerDto): Promise<Customer> {
    const response = await apiClient.put<Customer>(
      `${API_ENDPOINTS.CUSTOMERS}/${customer.id}`,
      customer
    );
    if (!response.success) {
      throw new Error(response.message || "Failed to update customer");
    }
    return response.data!;
  }

  async deleteCustomer(id: string): Promise<void> {
    const response = await apiClient.delete(`${API_ENDPOINTS.CUSTOMERS}/${id}`);
    if (!response.success) {
      throw new Error(response.message || "Failed to delete customer");
    }
  }

  async searchByName(customerName: string): Promise<Customer[]> {
    try {
      const response = await apiClient.get<Customer[]>(
        API_ENDPOINTS.CUSTOMERS,
        {
          customerName,
        }
      );
      return response.data || [];
    } catch (error) {
      console.error("Error searching customers by name:", error);
      return [];
    }
  }
}

export const customerService = new CustomerService();
