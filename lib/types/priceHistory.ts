// Price History Types
export interface PriceHistory {
  _id?: string;
  productId: string;
  productName: string;
  oldPrice: number;
  newPrice: number;
  changedBy?: string;
  changeReason?: string;
  effectiveDate: Date;
  createdAt: Date;
}

export interface PriceHistoryFilter {
  productId?: string;
  fromDate?: Date;
  toDate?: Date;
  page?: number;
  limit?: number;
}
