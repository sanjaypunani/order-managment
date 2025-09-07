export const runtime = "nodejs";

import { NextRequest, NextResponse } from "next/server";
import { connectDB } from "@/lib/db";
import {
  getOrdersCollection,
  getOrderItemsCollection,
  getCustomersCollection,
} from "@/lib/models";
import { ObjectId } from "mongodb";
import { WalletService, WalletResult } from "@/lib/walletService";

export async function POST(req: NextRequest) {
  await connectDB();
  try {
    const body = await req.json();
    const {
      customerId, // Now using customer ID instead of individual fields
      customerNumber, // Keep for backwards compatibility during transition
      flatNumber, // Keep for backwards compatibility during transition
      socityName, // Keep for backwards compatibility during transition
      customerName, // Keep for backwards compatibility during transition
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

    // If customerId is not provided, try to find customer by mobile number (backwards compatibility)
    let finalCustomerId = customerId;
    if (!finalCustomerId && customerNumber) {
      const customersCol = getCustomersCollection();
      // Parse customer number to get mobile number
      let mobileNumber = customerNumber;
      if (customerNumber.startsWith("+91")) {
        mobileNumber = customerNumber.substring(3);
      } else if (
        customerNumber.startsWith("91") &&
        customerNumber.length > 10
      ) {
        mobileNumber = customerNumber.substring(2);
      }

      const customer = await customersCol.findOne({ mobileNumber });
      if (customer) {
        finalCustomerId = customer._id;
      } else {
        const result = await customersCol.insertOne({
          countryCode: "+91",
          mobileNumber,
          flatNumber,
          societyName: socityName,
          customerName: customerName || "",
          address: "",
          walletBalance: 0,
          walletTransactions: [],
          monthlyPaymentEnabled: false,
          createdAt: new Date(),
          updatedAt: new Date(),
        });
        finalCustomerId = result.insertedId;
      }
    }

    if (!finalCustomerId) {
      throw new Error("Customer ID is required");
    }

    // Insert order first
    const ordersCol = getOrdersCollection();
    const orderResult = await ordersCol.insertOne({
      customerId: new ObjectId(finalCustomerId),
      // Keep backwards compatibility fields for now
      customerNumber,
      flatNumber,
      socityName,
      customerName,
      status,
      discount,
      totalAmount,
      finalAmount,
      deliveryDate,
      delivery_day,
      order_month,
      order_year,
      week_of_month,
      walletUsed: false, // Default to false, will be updated if wallet is used
      walletAmount: 0,
      walletTransactionId: null,
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

    // Process wallet payment if customer has balance
    let walletResult: WalletResult = {
      success: false,
      walletUsed: false,
      message: "No wallet processing attempted",
    };

    try {
      const walletBalance = await WalletService.getWalletBalance(
        customerNumber
      );

      if (walletBalance > 0) {
        const orderWithId = { ...body, _id: orderId };
        walletResult = await WalletService.processOrderPayment(
          customerNumber,
          orderWithId,
          false // isEdit = false for new orders
        );

        // Update order with wallet information if wallet was used
        if (walletResult.walletUsed) {
          // Calculate the remaining amount customer needs to pay
          const walletAmountUsed = walletResult.amountProcessed || 0;
          const adjustedFinalAmount = Math.max(
            0,
            finalAmount - walletAmountUsed
          );

          await ordersCol.updateOne(
            { _id: orderId },
            {
              $set: {
                walletUsed: true,
                walletAmount: walletAmountUsed,
                walletTransactionId: walletResult.transactionId,
                walletBalanceAfter: walletResult.balanceAfter,
                finalAmount: adjustedFinalAmount, // Update final amount to reflect wallet payment
              },
            }
          );

          // Update wallet result to include the final amount customer needs to pay
          walletResult.finalAmountAfterWallet = adjustedFinalAmount;
        }
      }
    } catch (walletError) {
      console.error("Wallet processing error:", walletError);
      // Continue with order creation even if wallet processing fails
    }

    return NextResponse.json({
      success: true,
      orderId,
      wallet: walletResult,
    });
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
    const customersCol = getCustomersCollection();

    const orders = await ordersCol.find({}).sort({ _id: -1 }).toArray();

    // Attach items and customer data to each order
    for (const order of orders) {
      order.items = await orderItemsCol.find({ orderId: order._id }).toArray();

      // Populate customer data if customerId exists
      if (order.customerId) {
        const customer = await customersCol.findOne({ _id: order.customerId });
        if (customer) {
          order.customer = customer;
        }
      }
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
      customerId, // Now using customer ID instead of individual fields
      customerNumber, // Keep for backwards compatibility during transition
      flatNumber, // Keep for backwards compatibility during transition
      socityName, // Keep for backwards compatibility during transition
      customerName, // Keep for backwards compatibility during transition
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

    // If customerId is not provided, try to find customer by mobile number (backwards compatibility)
    let finalCustomerId = customerId;
    if (!finalCustomerId && customerNumber) {
      const customersCol = getCustomersCollection();
      // Parse customer number to get mobile number
      let mobileNumber = customerNumber;
      if (customerNumber.startsWith("+91")) {
        mobileNumber = customerNumber.substring(3);
      } else if (
        customerNumber.startsWith("91") &&
        customerNumber.length > 10
      ) {
        mobileNumber = customerNumber.substring(2);
      }

      const customer = await customersCol.findOne({ mobileNumber });
      if (customer) {
        finalCustomerId = customer._id;
      }
    }

    const ordersCol = getOrdersCollection();
    const orderItemsCol = getOrderItemsCollection();

    // Get the existing order to compare amounts
    const existingOrder = await ordersCol.findOne({
      _id: new ObjectId(orderId),
    });
    const previousAmount = existingOrder?.finalAmount || 0;

    // Update order
    const updateFields: any = {
      status,
      discount,
      totalAmount,
      finalAmount,
      deliveryDate,
      delivery_day,
      order_month,
      order_year,
      week_of_month,
      // Keep backwards compatibility fields
      customerNumber,
      flatNumber,
      socityName,
      customerName,
    };

    // Add customerId if available
    if (finalCustomerId) {
      updateFields.customerId = new ObjectId(finalCustomerId);
    }

    await ordersCol.updateOne(
      { _id: new ObjectId(orderId) },
      { $set: updateFields }
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

    // Process wallet adjustment for edit
    let walletResult: WalletResult = {
      success: false,
      walletUsed: false,
      message: "No wallet processing attempted",
    };

    try {
      const walletBalance = await WalletService.getWalletBalance(
        customerNumber
      );

      // Only process wallet if customer has balance OR if this is a refund (decrease in amount)
      if (walletBalance > 0 || finalAmount < previousAmount) {
        const orderWithItems = { ...body, _id: orderId, items };
        walletResult = await WalletService.processOrderPayment(
          customerNumber,
          orderWithItems,
          true, // isEdit = true
          previousAmount
        );

        // Update order with wallet adjustment information
        if (walletResult.walletUsed) {
          const updateFields: any = {};
          const walletAmountUsed = walletResult.amountProcessed || 0;

          if (finalAmount > previousAmount) {
            // Additional charge - deduction from wallet
            updateFields.walletUsed = true;
            updateFields.lastWalletAdjustment = {
              amount: walletAmountUsed,
              type: "debit",
              transactionId: walletResult.transactionId,
              adjustmentDate: new Date().toISOString(),
              balanceAfter: walletResult.balanceAfter,
            };
            // For additional charges, reduce final amount by wallet deduction
            const adjustedFinalAmount = Math.max(
              0,
              finalAmount - walletAmountUsed
            );
            updateFields.finalAmount = adjustedFinalAmount;
            walletResult.finalAmountAfterWallet = adjustedFinalAmount;
          } else if (finalAmount < previousAmount) {
            // Refund to wallet
            updateFields.lastWalletAdjustment = {
              amount: walletAmountUsed,
              type: "credit",
              transactionId: walletResult.transactionId,
              adjustmentDate: new Date().toISOString(),
              balanceAfter: walletResult.balanceAfter,
            };
            // For refunds, the final amount remains as calculated since money was refunded to wallet
            updateFields.finalAmount = finalAmount;
            walletResult.finalAmountAfterWallet = finalAmount;
          }

          await ordersCol.updateOne(
            { _id: new ObjectId(orderId) },
            { $set: updateFields }
          );
        }
      }
    } catch (walletError) {
      console.error("Wallet adjustment error:", walletError);
      // Continue with order update even if wallet processing fails
    }

    return NextResponse.json({
      success: true,
      wallet: walletResult,
    });
  } catch (error) {
    const errorMsg = error instanceof Error ? error.message : String(error);
    return NextResponse.json(
      { success: false, error: errorMsg },
      { status: 500 }
    );
  }
}
