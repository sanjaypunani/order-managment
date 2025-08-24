// Testing utilities for the refactored order management system
import { Customer, OrderFormState, OrderItem } from "../types";

// Mock customer data for testing
export const mockCustomers: Customer[] = [
  {
    _id: "1",
    mobileNumber: "9876543210",
    customerName: "John Doe",
    flatNumber: "A-101",
    societyName: "The Vienza",
    countryCode: "+91",
  },
  {
    _id: "2",
    mobileNumber: "9876543211",
    customerName: "Jane Smith",
    flatNumber: "B-202",
    societyName: "Royal Gardens",
    countryCode: "+91",
  },
];

// Mock product data for testing
export const mockProducts = [
  {
    name: "Rice",
    price: 50,
    unit: "KG",
    quantity: 1,
  },
  {
    name: "Wheat Flour",
    price: 40,
    unit: "KG",
    quantity: 1,
  },
  {
    name: "Sugar",
    price: 45,
    unit: "KG",
    quantity: 1,
  },
];

// Mock order form state for testing
export const mockOrderFormState: OrderFormState = {
  customerNumber: "",
  customerName: "",
  flatNumber: "",
  socityName: "",
  status: "Pending",
  discount: "",
  deliveryDate: "",
  items: [
    {
      name: "",
      quantity: 1,
      unit: "KG",
      price: 0,
    },
  ],
};

// Mock API responses
export const mockApiResponses = {
  customerSearch: {
    success: true,
    customers: mockCustomers,
  },
  orderCreate: {
    success: true,
    orderId: "order_123",
    message: "Order created successfully",
  },
  productsList: {
    success: true,
    products: mockProducts,
  },
};

// Test performance measurement utilities
export class PerformanceTracker {
  private startTime: number = 0;
  private endTime: number = 0;

  start() {
    this.startTime = performance.now();
  }

  end() {
    this.endTime = performance.now();
    return this.endTime - this.startTime;
  }

  measure(fn: Function) {
    this.start();
    const result = fn();
    const duration = this.end();
    return { result, duration };
  }

  async measureAsync(fn: Function) {
    this.start();
    const result = await fn();
    const duration = this.end();
    return { result, duration };
  }
}

// Integration test scenarios
export const testScenarios = {
  // Scenario 1: Basic order creation
  basicOrderCreation: {
    description: "Create a basic order with one item",
    steps: [
      "Open order modal",
      "Enter customer mobile number",
      "Select customer from search results",
      "Add product to order",
      "Submit order",
    ],
    expectedDuration: 5000, // 5 seconds max
    customer: mockCustomers[0],
    items: [
      {
        name: "Rice",
        quantity: 2,
        unit: "KG",
        price: 100,
      },
    ],
  },

  // Scenario 2: Order with multiple items and discount
  complexOrderCreation: {
    description: "Create an order with multiple items and discount",
    steps: [
      "Open order modal",
      "Search for new customer",
      "Fill customer details manually",
      "Add multiple products",
      "Apply discount",
      "Submit order",
    ],
    expectedDuration: 8000, // 8 seconds max
    customer: {
      mobileNumber: "9876543299",
      customerName: "Test Customer",
      flatNumber: "C-303",
      societyName: "Green Valley",
    },
    items: [
      { name: "Rice", quantity: 3, unit: "KG", price: 150 },
      { name: "Wheat Flour", quantity: 2, unit: "KG", price: 80 },
      { name: "Sugar", quantity: 1, unit: "KG", price: 45 },
    ],
    discount: 25,
  },

  // Scenario 3: Performance stress test
  performanceStressTest: {
    description: "Test component performance with large datasets",
    customerCount: 1000,
    productCount: 500,
    searchQueries: 50,
    expectedAverageSearchTime: 100, // 100ms max per search
    expectedMemoryUsage: 50, // 50MB max
  },
};

// Validation helpers
export const validators = {
  isValidMobileNumber: (number: string): boolean => {
    return /^[6-9]\d{9}$/.test(number);
  },

  isValidOrderForm: (form: OrderFormState): boolean => {
    return !!(
      form.customerNumber &&
      form.customerName &&
      form.flatNumber &&
      form.socityName &&
      form.deliveryDate &&
      form.items.length > 0 &&
      form.items.every(
        (item) => item.name && item.quantity > 0 && item.price > 0
      )
    );
  },

  calculateOrderTotal: (items: OrderItem[]): number => {
    return items.reduce((total, item) => {
      const price =
        typeof item.price === "string" ? parseFloat(item.price) : item.price;
      const quantity =
        typeof item.quantity === "string"
          ? parseFloat(item.quantity)
          : item.quantity;
      return total + price * quantity;
    }, 0);
  },
};

// Component testing utilities
export const componentTestUtils = {
  // Simulate user typing with realistic delays
  simulateTyping: async (
    input: HTMLInputElement,
    text: string,
    delay: number = 50
  ) => {
    for (let i = 0; i < text.length; i++) {
      input.value = text.substring(0, i + 1);
      input.dispatchEvent(new Event("input", { bubbles: true }));
      await new Promise((resolve) => setTimeout(resolve, delay));
    }
  },

  // Simulate form submission
  simulateFormSubmit: (form: HTMLFormElement) => {
    form.dispatchEvent(
      new Event("submit", { bubbles: true, cancelable: true })
    );
  },

  // Wait for async operations
  waitFor: (
    condition: () => boolean,
    timeout: number = 5000
  ): Promise<void> => {
    return new Promise((resolve, reject) => {
      const startTime = Date.now();
      const check = () => {
        if (condition()) {
          resolve();
        } else if (Date.now() - startTime > timeout) {
          reject(new Error("Timeout waiting for condition"));
        } else {
          setTimeout(check, 100);
        }
      };
      check();
    });
  },
};

export default {
  mockCustomers,
  mockProducts,
  mockOrderFormState,
  mockApiResponses,
  PerformanceTracker,
  testScenarios,
  validators,
  componentTestUtils,
};
