import { connectDB } from "@/lib/db";
import { ObjectId } from "mongodb";
import { NextRequest, NextResponse } from "next/server";

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const db = await connectDB();
    const aiOrdersCollection = db.collection("aiorders");

    const { id: aiOrderId } = await params;
    const body = await request.json();

    // Validate ObjectId
    if (!ObjectId.isValid(aiOrderId)) {
      return NextResponse.json(
        { success: false, error: "Invalid customer ID" },
        { status: 400 }
      );
    }

    // Update customer
    const result = await aiOrdersCollection.updateOne(
      { _id: new ObjectId(aiOrderId) },
      {
        $set: {
          ...body,
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
      message: "Customer updated successfully",
    });
  } catch (error) {
    console.error("Error updating customer:", error);
    return NextResponse.json(
      { success: false, error: "Internal server error" },
      { status: 500 }
    );
  }
}
