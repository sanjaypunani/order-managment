export interface AIOrderItem {
  name: string;
  quantity: number;
  unit: string;
  product_id?: string;
  estimated_price?: number;
}

export interface CustomerMessage {
  message_text: string;
  timestamp: Date;
  message_type: "order" | "non_order" | "clarification";
}

export interface AIOrder {
  _id: string;
  customer_id: string;
  customer_phone: string;
  order_date: Date;
  items: AIOrderItem[];
  estimated_total: number;
  notes?: string;
  unrecognized_products: string[];
  customer_messages: CustomerMessage[];
  verification_status:
    | "pending"
    | "verified"
    | "needs_clarification"
    | "rejected";
  processed_to_final_order: boolean;
  final_order_id?: string;
  ai_confidence: number;
  last_updated: Date;
  createdAt: Date;
  updatedAt: Date;
}

export interface AIOrderFilters {
  verification_status?: string;
  customer_id?: string;
  page?: number;
  limit?: number;
}

export interface AIOrderResponse {
  orders: AIOrder[];
  totalCount: number;
  currentPage: number;
  totalPages: number;
  hasMore: boolean;
}
