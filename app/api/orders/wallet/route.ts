import { NextRequest, NextResponse } from "next/server";
import { WalletService } from "@/lib/walletService";

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const orderId = searchParams.get("orderId");

    if (!orderId) {
      return NextResponse.json(
        { success: false, error: "orderId is required" },
        { status: 400 }
      );
    }

    // ✅ Get transactions from separate collection
    const transactions = await WalletService.getOrderTransactions(orderId);

    return NextResponse.json({
      success: true,
      transactions: transactions,
      count: transactions.length,
    });
  } catch (error) {
    console.error("Order wallet history error:", error);
    return NextResponse.json(
      { success: false, error: "Internal server error" },
      { status: 500 }
    );
  }
}
