import { NextRequest, NextResponse } from "next/server";
import { WalletService } from "@/lib/walletService";
import { connectDB } from "@/lib/db";
import { getCustomersCollection } from "@/lib/models";
import { ObjectId } from "mongodb";

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const customerId = searchParams.get("customerId");
    const mobileNumber = searchParams.get("mobileNumber");

    if (!customerId && !mobileNumber) {
      return NextResponse.json(
        { success: false, error: "customerId or mobileNumber is required" },
        { status: 400 }
      );
    }

    await connectDB();
    const customersCollection = getCustomersCollection();

    // Find customer
    let customer;
    if (customerId) {
      customer = await customersCollection.findOne({
        _id: new ObjectId(customerId),
      });
    } else {
      customer = await customersCollection.findOne({
        mobileNumber: mobileNumber,
      });
    }

    if (!customer) {
      return NextResponse.json(
        { success: false, error: "Customer not found" },
        { status: 404 }
      );
    }

    // ✅ Get transactions from separate collection
    const transactions = await WalletService.getCustomerTransactions(
      customer._id.toString()
    );

    return NextResponse.json({
      success: true,
      data: {
        balance: customer.walletBalance || 0,
        transactions: transactions,
      },
    });
  } catch (error) {
    console.error("Wallet API error:", error);
    return NextResponse.json(
      { success: false, error: "Internal server error" },
      { status: 500 }
    );
  }
}
