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

    const result = await WalletService.addFunds(
      customerId,
      parseFloat(amount),
      note || "Funds added"
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
    console.error("Add funds error:", error);
    return NextResponse.json(
      { success: false, error: "Internal server error" },
      { status: 500 }
    );
  }
}
