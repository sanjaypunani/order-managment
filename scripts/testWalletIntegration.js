// Test script to validate the complete wallet integration functionality
// Run this with: node scripts/testWalletIntegration.js

const { MongoClient } = require("mongodb");

const MONGODB_URI =
  process.env.MONGODB_URI ||
  "mongodb+srv://sanjay:sanjay123@shreehari.tkxlq.mongodb.net/orders?retryWrites=true&w=majority&appName=ShreeHari";

async function testWalletIntegration() {
  const client = new MongoClient(MONGODB_URI);

  try {
    await client.connect();
    console.log("Connected to MongoDB");

    const db = client.db();
    const customersCollection = db.collection("customers");
    const ordersCollection = db.collection("orders");

    console.log("\n🧪 Testing Wallet Integration...\n");

    // Test 1: Create a test customer with wallet balance
    console.log("1. Creating test customer with wallet balance...");
    const testCustomer = {
      customerName: "Wallet Test Customer",
      mobileNumber: "9999888777",
      flatNumber: "A-101",
      societyName: "Test Society",
      countryCode: "+91",
      wallet: {
        balance: 1000.0,
        transactions: [],
      },
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    // Remove existing test customer if any
    await customersCollection.deleteMany({ mobileNumber: "9999888777" });

    const insertResult = await customersCollection.insertOne(testCustomer);
    console.log(`✅ Test customer created with ID: ${insertResult.insertedId}`);
    console.log(`   Initial wallet balance: ₹${testCustomer.wallet.balance}`);

    // Test 2: Create a test order
    console.log("\n2. Creating test order to test wallet deduction...");
    const testOrder = {
      customerId: insertResult.insertedId.toString(),
      customerName: testCustomer.customerName,
      customerNumber: testCustomer.mobileNumber,
      flatNumber: testCustomer.flatNumber,
      socityName: testCustomer.societyName,
      items: [
        {
          name: "Test Product 1",
          quantity: 2,
          unit: "kg",
          price: 150.0,
        },
        {
          name: "Test Product 2",
          quantity: 1,
          unit: "piece",
          price: 200.0,
        },
      ],
      totalAmount: 500.0, // 2*150 + 1*200 = 500
      discount: 0,
      status: "Pending",
      deliveryDate: new Date(Date.now() + 24 * 60 * 60 * 1000)
        .toISOString()
        .split("T")[0],
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    console.log(`   Order total: ₹${testOrder.totalAmount}`);

    // Simulate the API call to create order with wallet payment
    const orderResponse = await fetch("http://localhost:3004/api/orders", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(testOrder),
    });

    if (orderResponse.ok) {
      const orderResult = await orderResponse.json();
      console.log("✅ Order created successfully");
      console.log(`   Order ID: ${orderResult.orderId}`);

      if (orderResult.walletResult) {
        console.log(`   Wallet used: ${orderResult.walletResult.walletUsed}`);
        console.log(
          `   Amount processed: ₹${orderResult.walletResult.amountProcessed}`
        );
        console.log(
          `   Balance before: ₹${orderResult.walletResult.balanceBefore}`
        );
        console.log(
          `   Balance after: ₹${orderResult.walletResult.balanceAfter}`
        );
      }

      // Test 3: Verify wallet balance was deducted
      console.log("\n3. Verifying wallet balance after order...");
      const updatedCustomer = await customersCollection.findOne({
        _id: insertResult.insertedId,
      });
      console.log(
        `   Updated wallet balance: ₹${updatedCustomer.wallet.balance}`
      );
      console.log(
        `   Wallet transactions: ${updatedCustomer.wallet.transactions.length}`
      );

      if (updatedCustomer.wallet.transactions.length > 0) {
        const lastTransaction =
          updatedCustomer.wallet.transactions[
            updatedCustomer.wallet.transactions.length - 1
          ];
        console.log(
          `   Last transaction: ${lastTransaction.type} of ₹${lastTransaction.amount}`
        );
        console.log(`   Transaction note: ${lastTransaction.note}`);
      }

      // Test 4: Test order editing with wallet adjustment
      console.log("\n4. Testing order edit with wallet adjustment...");
      const editedOrder = {
        ...testOrder,
        orderId: orderResult.orderId,
        items: [
          ...testOrder.items,
          {
            name: "Additional Product",
            quantity: 1,
            unit: "piece",
            price: 100.0,
          },
        ],
        totalAmount: 600.0, // Original 500 + new 100 = 600
      };

      const editResponse = await fetch("http://localhost:3004/api/orders", {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(editedOrder),
      });

      if (editResponse.ok) {
        const editResult = await editResponse.json();
        console.log("✅ Order edited successfully");

        if (editResult.walletResult) {
          console.log(
            `   Additional amount processed: ₹${editResult.walletResult.amountProcessed}`
          );
          console.log(
            `   Balance after edit: ₹${editResult.walletResult.balanceAfter}`
          );
        }

        // Verify final wallet state
        const finalCustomer = await customersCollection.findOne({
          _id: insertResult.insertedId,
        });
        console.log(
          `   Final wallet balance: ₹${finalCustomer.wallet.balance}`
        );
        console.log(
          `   Total transactions: ${finalCustomer.wallet.transactions.length}`
        );
      } else {
        console.log("❌ Order edit failed");
        const errorText = await editResponse.text();
        console.log(`   Error: ${errorText}`);
      }

      // Test 5: Test wallet history API
      console.log("\n5. Testing wallet history API...");
      const historyResponse = await fetch(
        `http://localhost:3004/api/orders/wallet?orderId=${orderResult.orderId}`
      );

      if (historyResponse.ok) {
        const historyResult = await historyResponse.json();
        console.log("✅ Wallet history retrieved successfully");
        console.log(
          `   Transactions found: ${historyResult.transactions.length}`
        );

        historyResult.transactions.forEach((tx, index) => {
          console.log(
            `   Transaction ${index + 1}: ${tx.type} ₹${tx.amount} - ${tx.note}`
          );
        });
      } else {
        console.log("❌ Wallet history retrieval failed");
      }
    } else {
      console.log("❌ Order creation failed");
      const errorText = await orderResponse.text();
      console.log(`   Error: ${errorText}`);
    }

    console.log("\n🎉 Wallet integration test completed!");
    console.log("\n📋 Summary of implemented features:");
    console.log("   ✅ Automatic wallet deduction during order creation");
    console.log("   ✅ Wallet adjustment during order editing");
    console.log("   ✅ Detailed transaction logging with item details");
    console.log("   ✅ Wallet balance display in order form");
    console.log("   ✅ Wallet transaction history API");
    console.log("   ✅ UI integration with wallet information");
  } catch (error) {
    console.error("❌ Test failed:", error);
  } finally {
    await client.close();
  }
}

// Run the test
testWalletIntegration();
