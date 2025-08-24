// Simple test to verify wallet integration is working
// This script creates a test customer and tests the wallet functionality

const { MongoClient } = require("mongodb");

const MONGODB_URI =
  process.env.MONGODB_URI ||
  "mongodb+srv://sanjay:sanjay123@shreehari.tkxlq.mongodb.net/orders?retryWrites=true&w=majority&appName=ShreeHari";

async function testWalletFunctionality() {
  const client = new MongoClient(MONGODB_URI);

  try {
    await client.connect();
    console.log("✅ Connected to MongoDB");

    const db = client.db();
    const customersCollection = db.collection("customers");

    // Create a test customer with wallet balance
    const testCustomer = {
      customerName: "Test Customer",
      mobileNumber: "9999000111",
      flatNumber: "A-101",
      societyName: "Test Society",
      countryCode: "+91",
      walletBalance: 1500.0,
      walletTransactions: [],
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    // Remove existing test customer if any
    await customersCollection.deleteMany({ mobileNumber: "9999000111" });

    // Insert new test customer
    const result = await customersCollection.insertOne(testCustomer);
    console.log(`✅ Test customer created with ID: ${result.insertedId}`);
    console.log(`   Mobile: ${testCustomer.mobileNumber}`);
    console.log(`   Wallet Balance: ₹${testCustomer.walletBalance}`);

    // Verify the customer was created correctly
    const retrievedCustomer = await customersCollection.findOne({
      mobileNumber: "9999000111",
    });
    if (retrievedCustomer) {
      console.log("✅ Customer verification successful");
      console.log(`   Retrieved balance: ₹${retrievedCustomer.walletBalance}`);
    } else {
      console.log("❌ Customer verification failed");
    }

    console.log("\n🎯 Test Instructions:");
    console.log("1. Open the application at http://localhost:3004");
    console.log("2. Go to Dashboard");
    console.log('3. Click "Add New Order"');
    console.log("4. Enter mobile number: 9999000111");
    console.log("5. Select the test customer");
    console.log("6. Observe wallet balance display (should show ₹1500.00)");
    console.log("7. Add some order items");
    console.log("8. Create the order and verify wallet deduction");
    console.log("9. Check wallet history from orders page");
  } catch (error) {
    console.error("❌ Test setup failed:", error);
  } finally {
    await client.close();
  }
}

testWalletFunctionality();
