export const runtime = "nodejs";

import { NextRequest, NextResponse } from "next/server";
import { connectDB } from "@/lib/db";
import {
  getCustomersCollection,
  getOrdersCollection,
  getOrderItemsCollection,
} from "@/lib/models";
import { ObjectId } from "mongodb";

export async function GET(req: NextRequest) {
  await connectDB();
  try {
    const { searchParams } = new URL(req.url);
    const customerId = searchParams.get("customerId");
    const mobileNumber = searchParams.get("mobileNumber");

    if (!customerId && !mobileNumber) {
      return NextResponse.json(
        { success: false, error: "customerId or mobileNumber is required" },
        { status: 400 }
      );
    }

    const ordersCol = getOrdersCollection();
    const orderItemsCol = getOrderItemsCollection();

    let query: any = {};
    if (customerId) {
      const customersCol = getCustomersCollection();
      const customer = await customersCol.findOne({
        _id: new ObjectId(customerId),
      });
      if (!customer) {
        return NextResponse.json(
          { success: false, error: "Customer not found" },
          { status: 404 }
        );
      }
      query.customerNumber = customer.mobileNumber;
    } else if (mobileNumber) {
      query.customerNumber = mobileNumber;
    }

    const orders = await ordersCol.find(query).sort({ _id: -1 }).toArray();

    // Attach items to each order
    for (const order of orders) {
      order.items = await orderItemsCol.find({ orderId: order._id }).toArray();
    }

    // Calculate order statistics
    const totalOrders = orders.length;
    const totalAmount = orders.reduce(
      (sum, order) => sum + (order.finalAmount || 0),
      0
    );
    const pendingOrders = orders.filter(
      (order) => order.status === "Pending"
    ).length;
    const deliveredOrders = orders.filter(
      (order) => order.status === "Delivered"
    ).length;

    return NextResponse.json({
      success: true,
      orders,
      statistics: {
        totalOrders,
        totalAmount,
        pendingOrders,
        deliveredOrders,
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
