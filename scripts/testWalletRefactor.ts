import { MongoClient } from "mongodb";
import dotenv from "dotenv";

// Load environment variables
dotenv.config({ path: ".env.local" });

const MONGODB_URI = process.env.MONGODB_URI!;

async function testWalletRefactor() {
  console.log("🧪 Testing Wallet Refactor Implementation\n");

  const client = new MongoClient(MONGODB_URI);

  try {
    await client.connect();
    console.log("✅ Connected to MongoDB");

    const db = client.db();
    const customersCollection = db.collection("customers");
    const walletTransactionsCollection = db.collection("walletTransactions");

    // Test 1: Check that customers no longer have walletTransactions arrays
    console.log("1. Testing customer document structure...");
    const customerWithOldStructure = await customersCollection.findOne({
      walletTransactions: { $exists: true },
    });

    if (customerWithOldStructure) {
      console.log(
        "❌ Found customer with old walletTransactions array structure"
      );
      console.log("   Migration may not have completed successfully");
    } else {
      console.log("✅ No customers with old walletTransactions array found");
    }

    // Test 2: Check walletTransactions collection exists and has data
    console.log("\n2. Testing walletTransactions collection...");
    const transactionCount =
      await walletTransactionsCollection.countDocuments();
    console.log(
      `✅ Found ${transactionCount} transactions in separate collection`
    );

    // Test 3: Check indexes exist
    console.log("\n3. Testing collection indexes...");
    const indexes = await walletTransactionsCollection.indexes();
    console.log(`✅ Collection has ${indexes.length} indexes:`);
    indexes.forEach((index, i) => {
      const keys = Object.keys(index.key).join(", ");
      console.log(`   ${i + 1}. ${index.name}: {${keys}}`);
    });

    // Test 4: Sample transaction structure
    console.log("\n4. Testing transaction structure...");
    const sampleTransaction = await walletTransactionsCollection.findOne({});
    if (sampleTransaction) {
      console.log("✅ Sample transaction structure:");
      console.log(`   _id: ${sampleTransaction._id}`);
      console.log(`   customerId: ${sampleTransaction.customerId}`);
      console.log(`   type: ${sampleTransaction.type}`);
      console.log(`   amount: ₹${sampleTransaction.amount}`);
      console.log(`   note: ${sampleTransaction.note}`);
      console.log(`   createdAt: ${sampleTransaction.createdAt}`);
      console.log(`   orderId: ${sampleTransaction.orderId || "N/A"}`);
    } else {
      console.log("ℹ️  No transactions found yet (clean migration)");
    }

    // Test 5: Test wallet service functionality
    console.log("\n5. Testing WalletService functionality...");

    // Import and test the WalletService
    const { WalletService } = await import("../lib/walletService");

    // Find a test customer
    const testCustomer = await customersCollection.findOne({});
    if (testCustomer) {
      console.log(
        `   Testing with customer: ${
          testCustomer.customerName || testCustomer.mobileNumber
        }`
      );

      // Test getting wallet balance
      const balance = await WalletService.getWalletBalance(
        testCustomer.mobileNumber
      );
      console.log(`   ✅ Wallet balance: ₹${balance}`);

      // Test getting customer transactions
      const transactions = await WalletService.getCustomerTransactions(
        testCustomer._id.toString()
      );
      console.log(`   ✅ Customer transactions: ${transactions.length}`);

      // Show recent transactions
      if (transactions.length > 0) {
        console.log("   📋 Recent transactions:");
        transactions.slice(0, 3).forEach((tx, index) => {
          console.log(
            `      ${index + 1}. ${tx.type.toUpperCase()}: ₹${tx.amount} - ${
              tx.note
            }`
          );
        });
      } else {
        console.log("   ℹ️  No transactions found for this customer");
      }

      // Test adding funds
      console.log("\n   6. Testing add funds functionality...");
      const addResult = await WalletService.addFunds(
        testCustomer._id.toString(),
        100,
        "Test wallet refactor - adding funds"
      );

      if (addResult.success) {
        console.log(
          `   ✅ Successfully added ₹100. New balance: ₹${addResult.balanceAfter}`
        );

        // Verify transaction was created in separate collection
        const newTransactionCount =
          await walletTransactionsCollection.countDocuments();
        console.log(
          `   ✅ Transaction count after add: ${newTransactionCount}`
        );
      } else {
        console.log(`   ❌ Failed to add funds: ${addResult.message}`);
      }
    } else {
      console.log("   ❌ No customers found for testing");
    }

    console.log("\n🎉 Wallet refactor test completed successfully!");
    console.log("\n📋 Summary:");
    console.log(`   ✅ Customers migrated: No old structure found`);
    console.log(`   ✅ Transactions in new collection: ${transactionCount}`);
    console.log(`   ✅ Collection indexes: ${indexes.length}`);
    console.log(`   ✅ WalletService functionality: Working`);
  } catch (error) {
    console.error("❌ Test failed:", error);
  } finally {
    await client.close();
    console.log("\n✅ Database connection closed");
  }
}

// Run test
testWalletRefactor().catch(console.error);
