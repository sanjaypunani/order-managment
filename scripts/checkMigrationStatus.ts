import { MongoClient } from "mongodb";
import * as dotenv from "dotenv";

// Load environment variables from .env.local
dotenv.config({ path: ".env.local" });

const uri = process.env.MONGODB_URI;
const dbName = process.env.DB_NAME || "order_management";

if (!uri) {
  throw new Error(
    "Please define the MONGODB_URI environment variable inside .env.local"
  );
}

async function checkMigrationStatus() {
  let client: MongoClient;

  try {
    console.log("🔍 Checking migration status...");

    // Connect to MongoDB
    client = new MongoClient(uri!);
    await client.connect();
    console.log("✅ Connected to MongoDB");

    const db = client.db(dbName);
    const ordersCollection = db.collection("orders");
    const customersCollection = db.collection("customers");

    // Check orders
    const totalOrders = await ordersCollection.countDocuments({});
    const ordersWithCustomerId = await ordersCollection.countDocuments({
      customerId: { $exists: true, $ne: null },
    });
    const ordersWithoutCustomerId = await ordersCollection.countDocuments({
      customerId: { $exists: false },
    });

    // Check customers
    const totalCustomers = await customersCollection.countDocuments({});

    console.log("\n📊 Migration Status:");
    console.log(`   Total Orders: ${totalOrders}`);
    console.log(`   Orders with Customer ID: ${ordersWithCustomerId}`);
    console.log(`   Orders without Customer ID: ${ordersWithoutCustomerId}`);
    console.log(`   Total Customers: ${totalCustomers}`);

    // Show orders without customer IDs
    if (ordersWithoutCustomerId > 0) {
      console.log("\n⚠️  Orders without Customer ID:");
      const problematicOrders = await ordersCollection
        .find({
          customerId: { $exists: false },
        })
        .limit(10)
        .toArray();

      problematicOrders.forEach((order, index) => {
        console.log(
          `   ${index + 1}. Order ${order._id}: "${order.customerNumber}" - ${
            order.customerName || "No name"
          }`
        );
      });
    }

    const migrationComplete = ordersWithoutCustomerId === 0;
    console.log(
      `\n${migrationComplete ? "✅" : "⚠️ "} Migration ${
        migrationComplete ? "COMPLETE" : "INCOMPLETE"
      }`
    );

    return migrationComplete;
  } catch (error) {
    console.error("💥 Error checking migration status:", error);
    return false;
  } finally {
    if (client!) {
      await client.close();
      console.log("🔌 Disconnected from MongoDB");
    }
  }
}

// Run the check
if (require.main === module) {
  checkMigrationStatus()
    .then((complete) => {
      console.log(
        `🏁 Status check completed - Migration ${
          complete ? "Complete" : "Incomplete"
        }`
      );
      process.exit(0);
    })
    .catch((error) => {
      console.error("💥 Status check failed:", error);
      process.exit(1);
    });
}

export { checkMigrationStatus };
