import { NextRequest, NextResponse } from "next/server";
import { ObjectId } from "mongodb";
import { connectDB } from "@/lib/db";
import { getCustomersCollection } from "@/lib/models";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await connectDB();
    const customersCollection = getCustomersCollection();

    const { id: customerId } = await params;

    // Validate ObjectId
    if (!ObjectId.isValid(customerId)) {
      return NextResponse.json(
        { success: false, error: "Invalid customer ID" },
        { status: 400 }
      );
    }

    // Find customer by ID
    const customer = await customersCollection.findOne({
      _id: new ObjectId(customerId),
    });

    if (!customer) {
      return NextResponse.json(
        { success: false, error: "Customer not found" },
        { status: 404 }
      );
    }

    // Ensure wallet balance exists
    if (customer.walletBalance === undefined) {
      customer.walletBalance = 0;
    }

    return NextResponse.json({
      success: true,
      data: customer,
    });
  } catch (error) {
    console.error("Error fetching customer:", error);
    return NextResponse.json(
      { success: false, error: "Internal server error" },
      { status: 500 }
    );
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await connectDB();
    const customersCollection = getCustomersCollection();

    const { id: customerId } = await params;
    const body = await request.json();

    // Validate ObjectId
    if (!ObjectId.isValid(customerId)) {
      return NextResponse.json(
        { success: false, error: "Invalid customer ID" },
        { status: 400 }
      );
    }

    const {
      countryCode,
      mobileNumber,
      flatNumber,
      societyName,
      customerName,
      address,
    } = body;

    // Validate required fields
    if (!mobileNumber || !flatNumber || !societyName || !customerName) {
      return NextResponse.json(
        { success: false, error: "Missing required fields" },
        { status: 400 }
      );
    }

    // Update customer
    const result = await customersCollection.updateOne(
      { _id: new ObjectId(customerId) },
      {
        $set: {
          countryCode: countryCode || "+91",
          mobileNumber,
          flatNumber,
          societyName,
          customerName,
          address: address || "",
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
