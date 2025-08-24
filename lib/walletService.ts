import { connectDB } from "./db";
import {
  getCustomersCollection,
  getWalletTransactionsCollection,
} from "./models";
import { ObjectId } from "mongodb";

export interface WalletTransactionItem {
  name: string;
  quantity: number;
  unit: string;
  price: number;
  amount: number;
}

export interface WalletResult {
  success: boolean;
  walletUsed: boolean;
  transactionId?: string;
  balanceBefore?: number;
  balanceAfter?: number;
  amountProcessed?: number;
  finalAmountAfterWallet?: number; // Add this to track the final amount customer needs to pay
  message: string;
}

export class WalletService {
  /**
   * Process wallet payment for order creation or editing
   */
  static async processOrderPayment(
    customerNumber: string,
    order: any,
    isEdit = false,
    previousAmount = 0
  ): Promise<WalletResult> {
    try {
      await connectDB();
      const customersCollection = getCustomersCollection();
      const walletTransactionsCollection = getWalletTransactionsCollection();

      // Find customer by mobile number
      const customer = await customersCollection.findOne({
        mobileNumber: customerNumber,
      });

      if (!customer) {
        return {
          success: false,
          walletUsed: false,
          message: "Customer not found",
        };
      }

      const orderAmount = order.finalAmount || 0;
      let adjustmentAmount = orderAmount;
      let transactionType: "credit" | "debit" = "debit";
      let description = `Order payment - Order #${order._id || "New"}`;

      // Handle order edit adjustments
      if (isEdit && previousAmount > 0) {
        adjustmentAmount = orderAmount - previousAmount;

        if (adjustmentAmount === 0) {
          return {
            success: true,
            walletUsed: false,
            message: "No wallet adjustment needed - amounts are equal",
          };
        }

        transactionType = adjustmentAmount > 0 ? "debit" : "credit";
        adjustmentAmount = Math.abs(adjustmentAmount);
        description =
          adjustmentAmount > 0 && transactionType === "debit"
            ? `Order adjustment (additional charge) - Order #${order._id}`
            : `Order adjustment (refund) - Order #${order._id}`;
      }

      const currentBalance = customer.walletBalance || 0;

      // Check if customer has sufficient balance for debit transactions
      if (transactionType === "debit" && currentBalance < adjustmentAmount) {
        return {
          success: false,
          walletUsed: false,
          message: `Insufficient wallet balance. Available: ₹${currentBalance}, Required: ₹${adjustmentAmount}`,
        };
      }

      // Calculate new balance
      const newBalance =
        transactionType === "debit"
          ? currentBalance - adjustmentAmount
          : currentBalance + adjustmentAmount;

      // Create transaction record with item details
      const itemDetails: WalletTransactionItem[] = (order.items || []).map(
        (item: any) => ({
          name: item.name,
          quantity: item.quantity,
          unit: item.unit,
          price: item.price,
          amount: (item.quantity || 0) * (item.price || 0),
        })
      );

      const transactionId = new ObjectId();
      const transaction = {
        _id: transactionId,
        customerId: customer._id,
        orderId: order._id ? new ObjectId(order._id) : undefined,
        type: transactionType,
        amount: adjustmentAmount,
        note: description,
        balanceAfter: newBalance,
        createdAt: new Date(),
        metadata: {
          originalAmount: isEdit ? previousAmount : orderAmount,
          adjustmentReason: isEdit ? "Order modification" : "New order",
          editHistory: isEdit ? true : false,
          itemDetails: itemDetails,
        },
      };

      // ✅ Insert transaction into separate collection
      await walletTransactionsCollection.insertOne(transaction);

      // ✅ Update only the wallet balance in customer document
      await customersCollection.updateOne(
        { mobileNumber: customerNumber },
        {
          $set: {
            walletBalance: newBalance,
            updatedAt: new Date(),
          },
        }
      );

      return {
        success: true,
        walletUsed: true,
        transactionId: transactionId.toString(),
        balanceBefore: currentBalance,
        balanceAfter: newBalance,
        amountProcessed: adjustmentAmount,
        message: `₹${adjustmentAmount} ${
          transactionType === "debit" ? "deducted from" : "added to"
        } wallet. New balance: ₹${newBalance}`,
      };
    } catch (error) {
      console.error("Wallet processing error:", error);
      return {
        success: false,
        walletUsed: false,
        message: "Error processing wallet transaction",
      };
    }
  }

  /**
   * Check customer wallet balance
   */
  static async getWalletBalance(customerNumber: string): Promise<number> {
    try {
      await connectDB();
      const customersCollection = getCustomersCollection();

      const customer = await customersCollection.findOne({
        mobileNumber: customerNumber,
      });

      return customer?.walletBalance || 0;
    } catch (error) {
      console.error("Error fetching wallet balance:", error);
      return 0;
    }
  }

  /**
   * Get customer wallet transactions
   */
  static async getCustomerTransactions(customerId: string) {
    try {
      await connectDB();
      const walletTransactionsCollection = getWalletTransactionsCollection();

      const transactions = await walletTransactionsCollection
        .find({ customerId: new ObjectId(customerId) })
        .sort({ createdAt: -1 })
        .toArray();

      return transactions;
    } catch (error) {
      console.error("Error fetching customer transactions:", error);
      return [];
    }
  }

  /**
   * Get customer wallet transactions for a specific order
   */
  static async getOrderTransactions(orderId: string) {
    try {
      await connectDB();
      const walletTransactionsCollection = getWalletTransactionsCollection();

      const transactions = await walletTransactionsCollection
        .find({ orderId: new ObjectId(orderId) })
        .sort({ createdAt: -1 })
        .toArray();

      return transactions;
    } catch (error) {
      console.error("Error fetching order transactions:", error);
      return [];
    }
  }

  /**
   * Reverse a wallet transaction (for order cancellations)
   */
  static async reverseOrderTransaction(orderId: string, reason: string) {
    try {
      await connectDB();
      const walletTransactionsCollection = getWalletTransactionsCollection();
      const customersCollection = getCustomersCollection();

      // Find transactions for this order
      const orderTransactions = await walletTransactionsCollection
        .find({ orderId: new ObjectId(orderId) })
        .toArray();

      if (!orderTransactions || orderTransactions.length === 0) {
        return {
          success: false,
          message: "No wallet transactions found for this order",
        };
      }

      // Process reversal for each transaction
      for (const originalTx of orderTransactions) {
        const customer = await customersCollection.findOne({
          _id: originalTx.customerId,
        });

        if (!customer) continue;

        const currentBalance = customer.walletBalance || 0;
        const reverseAmount = originalTx.amount;
        const reverseType = originalTx.type === "debit" ? "credit" : "debit";
        const newBalance =
          reverseType === "credit"
            ? currentBalance + reverseAmount
            : currentBalance - reverseAmount;

        const reverseTransactionId = new ObjectId();
        const reverseTransaction = {
          _id: reverseTransactionId,
          customerId: originalTx.customerId,
          orderId: new ObjectId(orderId),
          type: reverseType,
          amount: reverseAmount,
          note: `Reversal: ${reason} (Original: ${originalTx.note})`,
          balanceAfter: newBalance,
          createdAt: new Date(),
          metadata: {
            originalTransactionId: originalTx._id,
            reversalReason: reason,
            isReversal: true,
            itemDetails: originalTx.metadata?.itemDetails || [],
          },
        };

        // Insert reverse transaction and update balance
        await walletTransactionsCollection.insertOne(reverseTransaction);
        await customersCollection.updateOne(
          { _id: originalTx.customerId },
          {
            $set: {
              walletBalance: newBalance,
              updatedAt: new Date(),
            },
          }
        );
      }

      return {
        success: true,
        message: `Successfully reversed ${orderTransactions.length} wallet transactions for order ${orderId}`,
      };
    } catch (error) {
      console.error("Error reversing wallet transactions:", error);
      return {
        success: false,
        message: "Error reversing wallet transactions",
      };
    }
  }

  /**
   * Add funds to customer wallet
   */
  static async addFunds(
    customerId: string,
    amount: number,
    note: string
  ): Promise<WalletResult> {
    try {
      await connectDB();
      const customersCollection = getCustomersCollection();
      const walletTransactionsCollection = getWalletTransactionsCollection();

      const customer = await customersCollection.findOne({
        _id: new ObjectId(customerId),
      });

      if (!customer) {
        return {
          success: false,
          walletUsed: false,
          message: "Customer not found",
        };
      }

      const currentBalance = customer.walletBalance || 0;
      const newBalance = currentBalance + amount;

      const transactionId = new ObjectId();
      const transaction = {
        _id: transactionId,
        customerId: new ObjectId(customerId),
        type: "credit" as const,
        amount,
        note,
        balanceAfter: newBalance,
        createdAt: new Date(),
        metadata: {
          adjustmentReason: "Manual credit",
        },
      };

      // Insert transaction and update balance
      await walletTransactionsCollection.insertOne(transaction);
      await customersCollection.updateOne(
        { _id: new ObjectId(customerId) },
        {
          $set: {
            walletBalance: newBalance,
            updatedAt: new Date(),
          },
        }
      );

      return {
        success: true,
        walletUsed: true,
        transactionId: transactionId.toString(),
        balanceBefore: currentBalance,
        balanceAfter: newBalance,
        amountProcessed: amount,
        message: `₹${amount} added to wallet. New balance: ₹${newBalance}`,
      };
    } catch (error) {
      console.error("Error adding funds:", error);
      return {
        success: false,
        walletUsed: false,
        message: "Error adding funds to wallet",
      };
    }
  }

  /**
   * Deduct funds from customer wallet
   */
  static async deductFunds(
    customerId: string,
    amount: number,
    note: string
  ): Promise<WalletResult> {
    try {
      await connectDB();
      const customersCollection = getCustomersCollection();
      const walletTransactionsCollection = getWalletTransactionsCollection();

      const customer = await customersCollection.findOne({
        _id: new ObjectId(customerId),
      });

      if (!customer) {
        return {
          success: false,
          walletUsed: false,
          message: "Customer not found",
        };
      }

      const currentBalance = customer.walletBalance || 0;

      if (currentBalance < amount) {
        return {
          success: false,
          walletUsed: false,
          message: `Insufficient balance. Available: ₹${currentBalance}, Required: ₹${amount}`,
        };
      }

      const newBalance = currentBalance - amount;

      const transactionId = new ObjectId();
      const transaction = {
        _id: transactionId,
        customerId: new ObjectId(customerId),
        type: "debit" as const,
        amount,
        note,
        balanceAfter: newBalance,
        createdAt: new Date(),
        metadata: {
          adjustmentReason: "Manual debit",
        },
      };

      // Insert transaction and update balance
      await walletTransactionsCollection.insertOne(transaction);
      await customersCollection.updateOne(
        { _id: new ObjectId(customerId) },
        {
          $set: {
            walletBalance: newBalance,
            updatedAt: new Date(),
          },
        }
      );

      return {
        success: true,
        walletUsed: true,
        transactionId: transactionId.toString(),
        balanceBefore: currentBalance,
        balanceAfter: newBalance,
        amountProcessed: amount,
        message: `₹${amount} deducted from wallet. New balance: ₹${newBalance}`,
      };
    } catch (error) {
      console.error("Error deducting funds:", error);
      return {
        success: false,
        walletUsed: false,
        message: "Error deducting funds from wallet",
      };
    }
  }
}
