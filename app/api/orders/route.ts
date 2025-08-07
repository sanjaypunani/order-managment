export const runtime = "nodejs";

import { NextRequest, NextResponse } from "next/server";
import { connectDB } from "@/lib/db";
import { getOrdersCollection, getOrderItemsCollection } from "@/lib/models";
import { ObjectId } from "mongodb";

export async function POST(req: NextRequest) {
  await connectDB();
  try {
    const body = await req.json();
    const {
      customerNumber,
      flatNumber,
      socityName,
      status,
      discount,
      totalAmount,
      finalAmount,
      items,
      deliveryDate,
      delivery_day,
      order_month,
      order_year,
      week_of_month,
    } = body;

    // Insert order
    const ordersCol = getOrdersCollection();
    const orderResult = await ordersCol.insertOne({
      customerNumber,
      flatNumber,
      socityName,
      status,
      discount,
      totalAmount,
      finalAmount,
      deliveryDate,
      delivery_day,
      order_month,
      order_year,
      week_of_month,
    });
    const orderId = orderResult.insertedId;

    // Insert items
    const orderItemsCol = getOrderItemsCollection();
    for (const item of items) {
      await orderItemsCol.insertOne({
        orderId,
        name: item.name,
        quantity: item.quantity,
        unit: item.unit,
        price: item.price,
      });
    }

    return NextResponse.json({ success: true, orderId });
  } catch (error) {
    const errorMsg = error instanceof Error ? error.message : String(error);
    return NextResponse.json(
      { success: false, error: errorMsg },
      { status: 500 }
    );
  }
}

export async function GET() {
  await connectDB();
  try {
    const ordersCol = getOrdersCollection();
    const orderItemsCol = getOrderItemsCollection();
    const orders = await ordersCol.find({}).sort({ _id: -1 }).toArray();
    // Attach items to each order
    for (const order of orders) {
      order.items = await orderItemsCol.find({ orderId: order._id }).toArray();
    }
    return NextResponse.json({ success: true, orders });
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
    const { orderId } = await req.json();
    if (!orderId) throw new Error("orderId is required");
    const ordersCol = getOrdersCollection();
    const orderItemsCol = getOrderItemsCollection();
    await ordersCol.deleteOne({ _id: new ObjectId(orderId) });
    await orderItemsCol.deleteMany({ orderId: new ObjectId(orderId) });
    return NextResponse.json({ success: true });
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
      orderId,
      customerNumber,
      flatNumber,
      socityName,
      status,
      discount,
      totalAmount,
      finalAmount,
      items,
      deliveryDate,
      delivery_day,
      order_month,
      order_year,
      week_of_month,
    } = body;
    if (!orderId) throw new Error("orderId is required");
    const ordersCol = getOrdersCollection();
    const orderItemsCol = getOrderItemsCollection();
    await ordersCol.updateOne(
      { _id: new ObjectId(orderId) },
      {
        $set: {
          customerNumber,
          flatNumber,
          socityName,
          status,
          discount,
          totalAmount,
          finalAmount,
          deliveryDate,
          delivery_day,
          order_month,
          order_year,
          week_of_month,
        },
      }
    );
    // Remove old items and insert new ones
    await orderItemsCol.deleteMany({ orderId: new ObjectId(orderId) });
    for (const item of items) {
      await orderItemsCol.insertOne({
        orderId: new ObjectId(orderId),
        name: item.name,
        quantity: item.quantity,
        unit: item.unit,
        price: item.price,
      });
    }
    return NextResponse.json({ success: true });
  } catch (error) {
    const errorMsg = error instanceof Error ? error.message : String(error);
    return NextResponse.json(
      { success: false, error: errorMsg },
      { status: 500 }
    );
  }
}
