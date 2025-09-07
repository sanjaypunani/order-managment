export const runtime = "nodejs";

import { NextRequest, NextResponse } from "next/server";
import { connectDB } from "@/lib/db";
import { getCustomersCollection } from "@/lib/models";
import { ObjectId } from "mongodb";

export async function POST(req: NextRequest) {
  await connectDB();
  try {
    const body = await req.json();
    const {
      countryCode,
      mobileNumber,
      flatNumber,
      societyName,
      customerName,
      address,
      monthlyPaymentEnabled,
    } = body;

    const customersCol = getCustomersCollection();

    // Check if customer already exists (check by mobile number only, since country code is separate)
    const existingCustomer = await customersCol.findOne({ mobileNumber });
    if (existingCustomer) {
      return NextResponse.json(
        {
          success: false,
          error: "Customer with this mobile number already exists",
        },
        { status: 400 }
      );
    }

    const result = await customersCol.insertOne({
      countryCode: countryCode || "+91",
      mobileNumber,
      flatNumber,
      societyName,
      customerName: customerName || "",
      address: address || "",
      walletBalance: 0,
      walletTransactions: [],
      monthlyPaymentEnabled: monthlyPaymentEnabled || false,
      createdAt: new Date(),
      updatedAt: new Date(),
    });

    return NextResponse.json({
      success: true,
      data: {
        _id: result.insertedId,
        countryCode: countryCode || "+91",
        mobileNumber,
        flatNumber,
        societyName,
        customerName: customerName || "",
        address: address || "",
        walletBalance: 0,
        walletTransactions: [],
        createdAt: new Date(),
        updatedAt: new Date(),
      },
    });
  } catch (error) {
    const errorMsg = error instanceof Error ? error.message : String(error);
    return NextResponse.json(
      { success: false, error: errorMsg },
      { status: 500 }
    );
  }
}

export async function GET(req: NextRequest) {
  await connectDB();
  try {
    const { searchParams } = new URL(req.url);
    const mobileNumber = searchParams.get("mobileNumber");
    const flatNumber = searchParams.get("flatNumber");
    const customerName = searchParams.get("customerName");

    const customersCol = getCustomersCollection();

    if (mobileNumber) {
      // Search by mobile number - try exact match first, then partial match
      let customer = await customersCol.findOne({ mobileNumber });

      // If exact match found, return single customer
      if (customer) {
        return NextResponse.json({
          success: true,
          data: [customer],
        });
      }

      // If no exact match found, try partial match (starts with the input)
      if (mobileNumber.length >= 1) {
        const customers = await customersCol
          .find({
            mobileNumber: { $regex: `^${mobileNumber}`, $options: "i" },
          })
          .limit(10)
          .toArray(); // Limit to 10 results for performance

        return NextResponse.json({
          success: true,
          data: customers,
        });
      }

      return NextResponse.json({
        success: true,
        data: [],
      });
    }

    if (flatNumber) {
      // Search by flat number - partial match
      const customers = await customersCol
        .find({
          flatNumber: { $regex: flatNumber, $options: "i" },
        })
        .limit(10)
        .toArray();
      return NextResponse.json({
        success: true,
        data: customers,
      });
    }

    if (customerName) {
      // Search by customer name - partial match
      const customers = await customersCol
        .find({
          customerName: { $regex: customerName, $options: "i" },
        })
        .limit(10)
        .toArray();
      return NextResponse.json({
        success: true,
        data: customers,
      });
    }

    // Get all customers
    const customers = await customersCol
      .find({})
      .sort({ createdAt: -1 })
      .toArray();
    return NextResponse.json({
      success: true,
      data: customers,
    });
  } catch (error) {
    const errorMsg = error instanceof Error ? error.message : String(error);
    return NextResponse.json(
      { success: false, error: errorMsg },
      { status: 500 }
    );
  }
}

export async function PUT(req: NextRequest) {
  await connectDB();
  try {
    const body = await req.json();
    const {
      customerId,
      countryCode,
      mobileNumber,
      flatNumber,
      societyName,
      customerName,
      address,
      monthlyPaymentEnabled,
    } = body;

    if (!customerId) throw new Error("customerId is required");

    const customersCol = getCustomersCollection();

    const result = await customersCol.updateOne(
      { _id: new ObjectId(customerId) },
      {
        $set: {
          countryCode: countryCode || "+91",
          mobileNumber,
          flatNumber,
          societyName,
          customerName,
          address,
          monthlyPaymentEnabled: monthlyPaymentEnabled || false,
          updatedAt: new Date(),
        },
      }
    );

    return NextResponse.json({ success: true });
  } catch (error) {
    const errorMsg = error instanceof Error ? error.message : String(error);
    return NextResponse.json(
      { success: false, error: errorMsg },
      { status: 500 }
    );
  }
}

export async function DELETE(req: NextRequest) {
  await connectDB();
  try {
    const { customerId } = await req.json();
    if (!customerId) throw new Error("customerId is required");

    const customersCol = getCustomersCollection();
    await customersCol.deleteOne({ _id: new ObjectId(customerId) });

    return NextResponse.json({ success: true });
  } catch (error) {
    const errorMsg = error instanceof Error ? error.message : String(error);
    return NextResponse.json(
      { success: false, error: errorMsg },
      { status: 500 }
    );
  }
}
