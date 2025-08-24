import { NextRequest, NextResponse } from "next/server";
import { connectDB } from "@/lib/db";
import {
  getOrdersCollection,
  getOrderItemsCollection,
  getCustomersCollection,
} from "@/lib/models";
import { WalletService } from "@/lib/walletService";
import { ObjectId } from "mongodb";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  await connectDB();
  try {
    const { id: orderId } = await params;

    if (!orderId || !ObjectId.isValid(orderId)) {
      return NextResponse.json(
        { success: false, error: "Invalid order ID" },
        { status: 400 }
      );
    }

    const ordersCol = getOrdersCollection();
    const orderItemsCol = getOrderItemsCollection();
    const customersCol = getCustomersCollection();

    // Get the order
    const order = await ordersCol.findOne({ _id: new ObjectId(orderId) });

    if (!order) {
      return NextResponse.json(
        { success: false, error: "Order not found" },
        { status: 404 }
      );
    }

    // Get order items
    order.items = await orderItemsCol
      .find({ orderId: new ObjectId(orderId) })
      .toArray();

    // Populate customer data if customerId exists
    if (order.customerId) {
      const customer = await customersCol.findOne({ _id: order.customerId });
      if (customer) {
        order.customer = customer;
      }
    }

    // ✅ Get wallet transaction details for this order
    const walletTransactions = await WalletService.getOrderTransactions(
      orderId
    );

    // ✅ Calculate wallet information
    if (walletTransactions.length > 0) {
      order.walletUsed = true;

      // Calculate total wallet amount used for this order
      const debitTransactions = walletTransactions.filter(
        (tx) => tx.type === "debit"
      );
      const creditTransactions = walletTransactions.filter(
        (tx) => tx.type === "credit"
      );

      const totalDebit = debitTransactions.reduce(
        (sum, tx) => sum + tx.amount,
        0
      );
      const totalCredit = creditTransactions.reduce(
        (sum, tx) => sum + tx.amount,
        0
      );

      order.walletAmount = totalDebit - totalCredit; // Net amount deducted from wallet

      // Get the most recent transaction for balance info
      const latestTransaction = walletTransactions[0]; // Already sorted by createdAt desc
      if (latestTransaction) {
        order.walletBalanceAfter = latestTransaction.balanceAfter;
        order.walletTransactionId = latestTransaction._id.toString();
      }

      // Add transaction details for reference
      order.walletTransactions = walletTransactions;
    } else {
      order.walletUsed = false;
      order.walletAmount = 0;
      order.walletTransactions = [];
    }

    // ✅ Get current wallet balance for the customer
    if (order.customerNumber) {
      try {
        const currentBalance = await WalletService.getWalletBalance(
          order.customerNumber
        );
        order.currentWalletBalance = currentBalance;
      } catch (error) {
        console.error("Error fetching current wallet balance:", error);
        order.currentWalletBalance = 0;
      }
    }

    return NextResponse.json({
      success: true,
      order: order,
    });
  } catch (error) {
    const errorMsg = error instanceof Error ? error.message : String(error);
    console.error("Error fetching order:", errorMsg);
    return NextResponse.json(
      { success: false, error: errorMsg },
      { status: 500 }
    );
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  await connectDB();
  try {
    const { id: orderId } = await params;
    const orderData = await request.json();

    if (!orderId || !ObjectId.isValid(orderId)) {
      return NextResponse.json(
        { success: false, error: "Invalid order ID" },
        { status: 400 }
      );
    }

    const ordersCol = getOrdersCollection();
    const orderItemsCol = getOrderItemsCollection();

    // Get original order with wallet transaction info
    const originalOrder = await ordersCol.findOne({
      _id: new ObjectId(orderId),
    });

    if (!originalOrder) {
      return NextResponse.json(
        { success: false, error: "Order not found" },
        { status: 404 }
      );
    }

    // Get existing wallet transactions for this order
    const existingWalletTransactions = await WalletService.getOrderTransactions(
      orderId
    );

    // Calculate wallet amounts
    const previousWalletAmount = existingWalletTransactions.reduce(
      (sum, tx) => (tx.type === "debit" ? sum + tx.amount : sum - tx.amount),
      0
    );

    const newWalletAmount = Math.min(
      orderData.finalAmount,
      (await WalletService.getWalletBalance(orderData.customerNumber)) || 0
    );

    const walletDifference = newWalletAmount - previousWalletAmount;

    // Update the order
    const updatedOrder = await ordersCol.updateOne(
      { _id: new ObjectId(orderId) },
      {
        $set: {
          customerName: orderData.customerName,
          customerNumber: orderData.customerNumber,
          flatNumber: orderData.flatNumber,
          socityName: orderData.socityName,
          status: orderData.status || "Pending",
          discount: orderData.discount,
          totalAmount: orderData.totalAmount,
          finalAmount: orderData.finalAmount,
          deliveryDate: orderData.deliveryDate,
          walletUsed: newWalletAmount > 0,
          walletAmount: newWalletAmount,
          updatedAt: new Date(),
        },
      }
    );

    // Update order items
    // First, delete existing items
    await orderItemsCol.deleteMany({ orderId: new ObjectId(orderId) });

    // Then insert new items
    if (orderData.items && orderData.items.length > 0) {
      const itemsToInsert = orderData.items.map((item: any) => ({
        orderId: new ObjectId(orderId),
        name: item.name,
        quantity: item.quantity,
        unit: item.unit,
        price: item.price,
      }));
      await orderItemsCol.insertMany(itemsToInsert);
    }

    let walletUpdateResult = null;

    // Handle wallet transaction update if needed
    if (walletDifference !== 0) {
      try {
        if (existingWalletTransactions.length > 0) {
          // Reverse the original transaction
          const reverseResult = await WalletService.reverseOrderTransaction(
            orderId,
            "Order updated - reversing original payment"
          );

          if (reverseResult.success && newWalletAmount > 0) {
            // Create new transaction with updated amount
            const newTransactionResult =
              await WalletService.processOrderPayment(
                orderData.customerNumber,
                {
                  _id: orderId,
                  finalAmount: newWalletAmount,
                  items: orderData.items,
                }
              );

            if (!newTransactionResult.success) {
              console.error(
                "Failed to create new wallet transaction:",
                newTransactionResult.message
              );
            }
          }
        } else if (newWalletAmount > 0) {
          // Create new wallet transaction
          const newTransactionResult = await WalletService.processOrderPayment(
            orderData.customerNumber,
            {
              _id: orderId,
              finalAmount: newWalletAmount,
              items: orderData.items,
            }
          );

          if (!newTransactionResult.success) {
            console.error(
              "Failed to create wallet transaction:",
              newTransactionResult.message
            );
          }
        }

        // Get updated wallet balance
        const currentWalletBalance = await WalletService.getWalletBalance(
          orderData.customerNumber
        );

        walletUpdateResult = {
          walletAmountChanged: true,
          previousWalletAmount,
          newWalletAmount,
          currentWalletBalance,
          difference: walletDifference,
        };
      } catch (walletError) {
        console.error("Wallet update error:", walletError);
        // Continue with order update even if wallet fails
        walletUpdateResult = {
          walletAmountChanged: false,
          error: "Failed to update wallet transaction",
        };
      }
    } else {
      walletUpdateResult = { walletAmountChanged: false };
    }

    return NextResponse.json({
      success: true,
      order: {
        _id: orderId,
        ...orderData,
        updatedAt: new Date(),
      },
      walletUpdate: walletUpdateResult,
    });
  } catch (error) {
    const errorMsg = error instanceof Error ? error.message : String(error);
    console.error("Error updating order:", errorMsg);
    return NextResponse.json(
      { success: false, error: errorMsg },
      { status: 500 }
    );
  }
}
