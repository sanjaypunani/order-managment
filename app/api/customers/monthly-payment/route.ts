export const runtime = "nodejs";

import { NextRequest, NextResponse } from "next/server";
import { connectDB } from "@/lib/db";
import { getCustomersCollection } from "@/lib/models";
import { ObjectId } from "mongodb";

export async function PATCH(request: NextRequest) {
  await connectDB();
  try {
    const { customerId, monthlyPaymentEnabled } = await request.json();

    if (!customerId) {
      return NextResponse.json(
        { success: false, error: "Customer ID is required" },
        { status: 400 }
      );
    }

    const customersCol = getCustomersCollection();

    const result = await customersCol.updateOne(
      { _id: new ObjectId(customerId) },
      {
        $set: {
          monthlyPaymentEnabled: monthlyPaymentEnabled,
          updatedAt: new Date().toISOString(),
        },
      }
    );

    if (result.matchedCount === 0) {
      return NextResponse.json(
        { success: false, error: "Customer not found" },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      message: `Monthly payment ${
        monthlyPaymentEnabled ? "enabled" : "disabled"
      } successfully`,
    });
  } catch (error) {
    console.error("Error updating monthly payment:", error);
    return NextResponse.json(
      { success: false, error: "Failed to update monthly payment status" },
      { status: 500 }
    );
  }
}
