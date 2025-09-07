import { MongoClient, ObjectId } from "mongodb";
import dotenv from "dotenv";

// Load environment variables
dotenv.config({ path: ".env.local" });

const MONGODB_URI = process.env.MONGODB_URI!;

async function migrateWalletTransactions() {
  const client = new MongoClient(MONGODB_URI);

  try {
    await client.connect();
    console.log("✅ Connected to MongoDB");

    const db = client.db();
    const customersCollection = db.collection("customers");
    const walletTransactionsCollection = db.collection("walletTransactions");

    // Create indexes for better performance
    await walletTransactionsCollection.createIndex({ customerId: 1 });
    await walletTransactionsCollection.createIndex({ orderId: 1 });
    await walletTransactionsCollection.createIndex({ createdAt: -1 });
    await walletTransactionsCollection.createIndex({
      customerId: 1,
      createdAt: -1,
    });

    console.log("✅ Created indexes for walletTransactions collection");

    // Find customers with walletTransactions array
    const customersWithTransactions = await customersCollection
      .find({ walletTransactions: { $exists: true, $ne: [] } })
      .toArray();

    console.log(
      `📊 Found ${customersWithTransactions.length} customers with transactions to migrate`
    );

    let totalTransactionsMigrated = 0;

    for (const customer of customersWithTransactions) {
      const transactions = customer.walletTransactions || [];

      if (transactions.length === 0) continue;

      console.log(
        `🔄 Migrating ${transactions.length} transactions for customer ${
          customer.customerName || customer.mobileNumber
        }`
      );

      // Transform and insert transactions
      const transformedTransactions = transactions.map((tx: any) => ({
        _id: tx._id || new ObjectId(),
        customerId: customer._id,
        orderId: tx.orderId ? new ObjectId(tx.orderId) : undefined,
        type: tx.type,
        amount: tx.amount,
        note: tx.note,
        balanceAfter: tx.balanceAfter,
        createdAt: tx.date ? new Date(tx.date) : new Date(),
        metadata: {
          originalAmount: tx.metadata?.originalAmount,
          adjustmentReason: tx.metadata?.adjustmentReason || "Legacy migration",
          editHistory: tx.metadata?.editHistory || false,
          itemDetails: tx.itemDetails || tx.metadata?.itemDetails || [],
          ...(tx.metadata || {}),
        },
      }));

      // Insert transactions into new collection
      if (transformedTransactions.length > 0) {
        await walletTransactionsCollection.insertMany(transformedTransactions);
        totalTransactionsMigrated += transformedTransactions.length;
      }

      // Remove walletTransactions array from customer document
      await customersCollection.updateOne(
        { _id: customer._id },
        { $unset: { walletTransactions: "" } }
      );
    }

    console.log(`✅ Migration completed!`);
    console.log(`📊 Total transactions migrated: ${totalTransactionsMigrated}`);
    console.log(`👥 Customers updated: ${customersWithTransactions.length}`);

    // Verify the migration
    const totalTransactionsInNewCollection =
      await walletTransactionsCollection.countDocuments();
    console.log(
      `🔍 Verification: ${totalTransactionsInNewCollection} transactions in new collection`
    );

    // Show sample of migrated transactions
    const sampleTransactions = await walletTransactionsCollection
      .find({})
      .limit(3)
      .toArray();
    console.log(`📋 Sample migrated transactions:`);
    sampleTransactions.forEach((tx, index) => {
      console.log(
        `   ${index + 1}. ${tx.type} ₹${tx.amount} - ${tx.note} (${
          tx.createdAt
        })`
      );
    });
  } catch (error) {
    console.error("❌ Migration failed:", error);
  } finally {
    await client.close();
    console.log("✅ Database connection closed");
  }
}

// Run migration
migrateWalletTransactions().catch(console.error);
