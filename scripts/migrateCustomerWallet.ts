/**
 * Migration script to add wallet fields to existing customers
 * Run this script once to initialize wallet balance and transactions for existing customers
 */

import { MongoClient } from "mongodb";

const uri = process.env.MONGODB_URI!;

async function migrateCustomers() {
  const client = new MongoClient(uri);

  try {
    await client.connect();
    console.log("Connected to MongoDB");

    const db = client.db("order-management");
    const customersCollection = db.collection("customers");

    // Find customers without wallet fields
    const customersWithoutWallet = await customersCollection
      .find({
        $or: [
          { walletBalance: { $exists: false } },
          { walletTransactions: { $exists: false } },
        ],
      })
      .toArray();

    console.log(`Found ${customersWithoutWallet.length} customers to migrate`);

    if (customersWithoutWallet.length === 0) {
      console.log("No customers need migration");
      return;
    }

    // Update customers to add wallet fields
    const result = await customersCollection.updateMany(
      {
        $or: [
          { walletBalance: { $exists: false } },
          { walletTransactions: { $exists: false } },
        ],
      },
      {
        $set: {
          walletBalance: 0,
          walletTransactions: [],
        },
      }
    );

    console.log(
      `Migration completed. Updated ${result.modifiedCount} customers.`
    );
  } catch (error) {
    console.error("Migration failed:", error);
  } finally {
    await client.close();
    console.log("Disconnected from MongoDB");
  }
}

// Run migration if this file is executed directly
if (require.main === module) {
  migrateCustomers().catch(console.error);
}

export default migrateCustomers;
