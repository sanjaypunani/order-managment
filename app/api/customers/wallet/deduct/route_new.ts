import { NextRequest, NextResponse } from "next/server";
import { WalletService } from "@/lib/walletService";

export async function POST(request: NextRequest) {
  try {
    const { customerId, amount, note } = await request.json();

    if (!customerId || !amount || amount <= 0) {
      return NextResponse.json(
        { success: false, error: "Invalid customerId or amount" },
        { status: 400 }
      );
    }

    const result = await WalletService.deductFunds(
      customerId,
      parseFloat(amount),
      note || "Funds deducted"
    );

    if (result.success) {
      return NextResponse.json({
        success: true,
        message: result.message,
        newBalance: result.balanceAfter,
        transactionId: result.transactionId,
      });
    } else {
      return NextResponse.json(
        { success: false, error: result.message },
        { status: 400 }
      );
    }
  } catch (error) {
    console.error("Deduct funds error:", error);
    return NextResponse.json(
      { success: false, error: "Internal server error" },
      { status: 500 }
    );
  }
}
