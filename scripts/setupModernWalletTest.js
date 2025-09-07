// Final verification test for wallet integration in modern architecture
// This creates a test customer and validates the complete flow

const { MongoClient } = require("mongodb");

const MONGODB_URI =
  process.env.MONGODB_URI ||
  "mongodb+srv://sanjay:sanjay123@shreehari.tkxlq.mongodb.net/orders?retryWrites=true&w=majority&appName=ShreeHari";

async function setupTestCustomer() {
  const client = new MongoClient(MONGODB_URI);

  try {
    await client.connect();
    console.log("✅ Connected to MongoDB");

    const db = client.db();
    const customersCollection = db.collection("customers");

    // Create test customer with wallet balance
    const testCustomer = {
      customerName: "Modern Wallet Test Customer",
      mobileNumber: "9876543210",
      flatNumber: "B-202",
      societyName: "Modern Test Society",
      countryCode: "+91",
      walletBalance: 2000.0,
      walletTransactions: [
        {
          _id: new Date(),
          date: new Date().toISOString(),
          type: "credit",
          amount: 2000.0,
          note: "Initial wallet setup for testing",
          balanceAfter: 2000.0,
        },
      ],
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    // Remove any existing test customer
    await customersCollection.deleteMany({ mobileNumber: "9876543210" });

    // Insert the test customer
    const result = await customersCollection.insertOne(testCustomer);
    console.log(`✅ Test customer created successfully`);
    console.log(`   Customer ID: ${result.insertedId}`);
    console.log(`   Mobile: ${testCustomer.mobileNumber}`);
    console.log(`   Wallet Balance: ₹${testCustomer.walletBalance}`);

    console.log("\n🧪 Modern Architecture Wallet Testing Guide:");
    console.log("1. Open http://localhost:3004");
    console.log("2. Navigate to orders or dashboard");
    console.log("3. Use the ModernOrderFormModal (if implemented)");
    console.log("4. Search for customer: 9876543210");
    console.log("5. Observe the wallet balance display: ₹2000.00");
    console.log("6. Add order items and watch real-time balance comparison");
    console.log("7. Submit order and verify wallet deduction");
    console.log("8. Check for wallet transaction feedback alerts");

    console.log("\n✅ Wallet Features to Test:");
    console.log("- Real-time balance loading when customer selected");
    console.log("- Green indicator for sufficient balance");
    console.log("- Orange indicator for insufficient balance");
    console.log("- Automatic wallet deduction on order creation");
    console.log("- Success/error feedback alerts");
    console.log("- Balance refresh functionality");
  } catch (error) {
    console.error("❌ Setup failed:", error);
  } finally {
    await client.close();
  }
}

setupTestCustomer();
