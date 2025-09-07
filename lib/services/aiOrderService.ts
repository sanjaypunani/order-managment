import { AIOrder, AIOrderResponse, AIOrderFilters } from "../types/aiOrder";

export class AIOrderService {
  private static baseUrl = "/api/ai-orders";

  static async getAIOrders(
    filters: AIOrderFilters = {}
  ): Promise<AIOrderResponse> {
    const queryParams = new URLSearchParams();

    Object.entries(filters).forEach(([key, value]) => {
      if (value !== undefined && value !== null && value !== "") {
        queryParams.append(key, value.toString());
      }
    });

    const url = `${this.baseUrl}${
      queryParams.toString() ? `?${queryParams}` : ""
    }`;

    const response = await fetch(url);

    if (!response.ok) {
      throw new Error(`Failed to fetch AI orders: ${response.statusText}`);
    }

    return response.json();
  }

  static async getAIOrderById(id: string): Promise<AIOrder> {
    const response = await fetch(`${this.baseUrl}/${id}`);

    if (!response.ok) {
      throw new Error(`Failed to fetch AI order: ${response.statusText}`);
    }

    return response.json();
  }
}
