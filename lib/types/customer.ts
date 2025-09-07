import { ObjectId } from "mongodb";

export interface WalletTransaction {
  _id: ObjectId;
  customerId: ObjectId;
  orderId?: ObjectId;
  type: "credit" | "debit";
  amount: number;
  note: string;
  balanceAfter: number;
  createdAt: Date;
  metadata?: {
    originalAmount?: number;
    adjustmentReason?: string;
    editHistory?: boolean;
    originalTransactionId?: ObjectId;
    reversalReason?: string;
    isReversal?: boolean;
    itemDetails?: Array<{
      name: string;
      quantity: number;
      unit: string;
      price: number;
      amount: number;
    }>;
  };
}

export interface Customer {
  _id: ObjectId;
  countryCode: string;
  mobileNumber: string;
  flatNumber: string;
  societyName: string;
  customerName: string;
  address: string;
  walletBalance: number;
  // ✅ Removed walletTransactions array
  createdAt: Date;
  updatedAt: Date;
}
