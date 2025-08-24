import { MongoClient, ObjectId } from "mongodb";
import * as dotenv from "dotenv";
import * as fs from "fs";
import * as path from "path";

// Load environment variables from .env.local
dotenv.config({ path: ".env.local" });

const uri = process.env.MONGODB_URI;
const dbName = process.env.DB_NAME || "order_management";

if (!uri) {
  throw new Error(
    "Please define the MONGODB_URI environment variable inside .env.local"
  );
}

/**
 * Clean up denormalized customer fields from orders collection
 * Run this ONLY after verifying that the migration was successful and your app works with customer IDs
 */
async function cleanupDenormalizedFields() {
  let client: MongoClient;

  try {
    console.log(
      "🧹 Starting cleanup of denormalized customer fields from orders..."
    );
    console.log(
      "⚠️  WARNING: This will permanently remove customer fields from orders!"
    );
    console.log(
      "   Make sure your application is using customer IDs and working correctly."
    );

    // Add a confirmation prompt in production
    console.log("\n🔍 Pre-cleanup verification...");

    // Connect to MongoDB
    client = new MongoClient(uri!);
    await client.connect();
    console.log("✅ Connected to MongoDB");

    const db = client.db(dbName);
    const ordersCollection = db.collection("orders");

    // Verify all orders have customer IDs
    const totalOrders = await ordersCollection.countDocuments({});
    const ordersWithCustomerId = await ordersCollection.countDocuments({
      customerId: { $exists: true, $ne: null },
    });

    console.log(`📊 Orders Analysis:`);
    console.log(`   Total Orders: ${totalOrders}`);
    console.log(`   Orders with Customer ID: ${ordersWithCustomerId}`);
    console.log(
      `   Orders missing Customer ID: ${totalOrders - ordersWithCustomerId}`
    );

    if (ordersWithCustomerId !== totalOrders) {
      console.error("❌ Not all orders have customer IDs. Cleanup aborted!");
      console.log(
        "   Please run the migration script first or check for data issues."
      );
      return false;
    }

    // Create a final backup before cleanup
    console.log("\n📦 Creating pre-cleanup backup...");
    const backupDir = path.join(process.cwd(), "backups");
    if (!fs.existsSync(backupDir)) {
      fs.mkdirSync(backupDir, { recursive: true });
    }

    const timestamp = new Date().toISOString().replace(/[:.]/g, "-");
    const backupFile = path.join(
      backupDir,
      `pre-cleanup-backup-${timestamp}.json`
    );

    const orders = await ordersCollection.find({}).toArray();
    const backupData = {
      timestamp: new Date().toISOString(),
      purpose:
        "Pre-cleanup backup before removing denormalized customer fields",
      orders: orders,
      stats: {
        totalOrders: orders.length,
      },
    };

    fs.writeFileSync(backupFile, JSON.stringify(backupData, null, 2));
    console.log(`✅ Pre-cleanup backup created: ${backupFile}`);

    // Show sample of what will be removed
    console.log("\n📋 Sample fields that will be removed:");
    const sampleOrder = await ordersCollection.findOne({});
    if (sampleOrder) {
      const fieldsToRemove = [
        "customerNumber",
        "customerName",
        "flatNumber",
        "socityName",
      ];
      fieldsToRemove.forEach((field) => {
        if (sampleOrder[field] !== undefined) {
          console.log(`   ${field}: "${sampleOrder[field]}"`);
        }
      });
    }

    // Perform the cleanup
    console.log("\n🧹 Removing denormalized customer fields...");
    const updateResult = await ordersCollection.updateMany(
      {}, // Update all documents
      {
        $unset: {
          customerNumber: "",
          customerName: "",
          flatNumber: "",
          socityName: "",
        },
        $set: {
          updatedAt: new Date(),
        },
      }
    );

    console.log(`✅ Cleanup completed!`);
    console.log(`   Orders updated: ${updateResult.modifiedCount}`);
    console.log(`   Backup file: ${backupFile}`);

    // Verify cleanup
    console.log("\n🔍 Post-cleanup verification...");
    const ordersWithOldFields = await ordersCollection.countDocuments({
      $or: [
        { customerNumber: { $exists: true } },
        { customerName: { $exists: true } },
        { flatNumber: { $exists: true } },
        { socityName: { $exists: true } },
      ],
    });

    if (ordersWithOldFields === 0) {
      console.log("✅ All denormalized customer fields successfully removed!");
    } else {
      console.warn(
        `⚠️  ${ordersWithOldFields} orders still have denormalized fields.`
      );
    }

    return true;
  } catch (error) {
    console.error("💥 Cleanup failed:", error);
    return false;
  } finally {
    if (client!) {
      await client.close();
      console.log("🔌 Disconnected from MongoDB");
    }
  }
}

/**
 * Rollback function to restore denormalized fields from customer data
 * Use this if you need to rollback the normalization
 */
async function rollbackNormalization() {
  let client: MongoClient;

  try {
    console.log("🔄 Starting rollback of order-customer normalization...");

    // Connect to MongoDB
    client = new MongoClient(uri!);
    await client.connect();
    console.log("✅ Connected to MongoDB");

    const db = client.db(dbName);
    const ordersCollection = db.collection("orders");
    const customersCollection = db.collection("customers");

    // Get all orders with customer IDs
    const orders = await ordersCollection
      .find({ customerId: { $exists: true } })
      .toArray();
    console.log(`📦 Processing ${orders.length} orders for rollback...`);

    let updatedCount = 0;
    let errorCount = 0;

    for (const order of orders) {
      try {
        // Get customer data
        const customer = await customersCollection.findOne({
          _id: order.customerId,
        });

        if (customer) {
          // Restore denormalized fields
          await ordersCollection.updateOne(
            { _id: order._id },
            {
              $set: {
                customerNumber: `${customer.countryCode}${customer.mobileNumber}`,
                customerName: customer.customerName,
                flatNumber: customer.flatNumber,
                socityName: customer.societyName,
                updatedAt: new Date(),
              },
              $unset: {
                customerId: "",
              },
            }
          );
          updatedCount++;
        } else {
          console.warn(`⚠️  Customer not found for order ${order._id}`);
          errorCount++;
        }
      } catch (error) {
        console.error(`❌ Error processing order ${order._id}:`, error);
        errorCount++;
      }
    }

    console.log(
      `✅ Rollback completed: ${updatedCount} orders updated, ${errorCount} errors`
    );
  } catch (error) {
    console.error("💥 Rollback failed:", error);
  } finally {
    if (client!) {
      await client.close();
      console.log("🔌 Disconnected from MongoDB");
    }
  }
}

// CLI interface
if (require.main === module) {
  const command = process.argv[2];

  if (command === "cleanup") {
    cleanupDenormalizedFields()
      .then((success) => {
        console.log(
          success
            ? "🏁 Cleanup completed successfully"
            : "❌ Cleanup failed or aborted"
        );
        process.exit(success ? 0 : 1);
      })
      .catch((error) => {
        console.error("💥 Cleanup script failed:", error);
        process.exit(1);
      });
  } else if (command === "rollback") {
    rollbackNormalization()
      .then(() => {
        console.log("🏁 Rollback completed");
        process.exit(0);
      })
      .catch((error) => {
        console.error("💥 Rollback script failed:", error);
        process.exit(1);
      });
  } else {
    console.log("Usage:");
    console.log(
      "  npm run migrate:cleanup    - Remove denormalized customer fields from orders"
    );
    console.log(
      "  npm run migrate:rollback   - Restore denormalized fields (rollback normalization)"
    );
    process.exit(1);
  }
}

export { cleanupDenormalizedFields, rollbackNormalization };
