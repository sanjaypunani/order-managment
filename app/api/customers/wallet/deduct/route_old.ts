import { NextRequest, NextResponse } from "next/server";
import { ObjectId } from "mongodb";
import { connectDB } from "@/lib/db";
import { getCustomersCollection } from "@/lib/models";

export async function POST(request: NextRequest) {
  try {
    await connectDB();
    const customersCollection = getCustomersCollection();

    const body = await request.json();
    const { customerId, amount, note } = body;

    // Validate input
    if (!customerId || !ObjectId.isValid(customerId)) {
      return NextResponse.json(
        { success: false, error: "Invalid customer ID" },
        { status: 400 }
      );
    }

    if (!amount || amount <= 0) {
      return NextResponse.json(
        { success: false, error: "Invalid amount" },
        { status: 400 }
      );
    }

    // Find customer
    const customer = await customersCollection.findOne({
      _id: new ObjectId(customerId),
    });

    if (!customer) {
      return NextResponse.json(
        { success: false, error: "Customer not found" },
        { status: 404 }
      );
    }

    // Calculate new balance
    const currentBalance = customer.walletBalance || 0;

    if (currentBalance < amount) {
      return NextResponse.json(
        { success: false, error: "Insufficient wallet balance" },
        { status: 400 }
      );
    }

    const newBalance = currentBalance - amount;

    // Create transaction record
    const transaction = {
      _id: new ObjectId(),
      date: new Date().toISOString(),
      type: "debit" as const,
      amount: Number(amount),
      note: note || "Funds deducted from wallet",
      balanceAfter: newBalance,
    };

    // Update customer with new balance and transaction
    await customersCollection.updateOne(
      { _id: new ObjectId(customerId) },
      {
        $set: {
          walletBalance: newBalance,
          updatedAt: new Date().toISOString(),
        },
        $push: {
          walletTransactions: transaction as any,
        },
      }
    );

    return NextResponse.json({
      success: true,
      message: "Funds deducted successfully",
      newBalance,
      transaction,
    });
  } catch (error) {
    console.error("Error deducting funds:", error);
    return NextResponse.json(
      { success: false, error: "Internal server error" },
      { status: 500 }
    );
  }
}
