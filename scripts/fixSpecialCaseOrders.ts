import { MongoClient, ObjectId } from "mongodb";
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

/**
 * Fix orders with non-phone number customer identifiers
 */
async function fixSpecialCaseOrders() {
  let client: MongoClient;

  try {
    console.log("🔧 Fixing special case orders...");

    // Connect to MongoDB
    client = new MongoClient(uri!);
    await client.connect();
    console.log("✅ Connected to MongoDB");

    const db = client.db(dbName);
    const ordersCollection = db.collection("orders");
    const customersCollection = db.collection("customers");

    // Find orders without customer IDs
    const ordersWithoutCustomerIds = await ordersCollection
      .find({ customerId: { $exists: false } })
      .toArray();

    console.log(
      `📦 Found ${ordersWithoutCustomerIds.length} orders without customer IDs`
    );

    for (const order of ordersWithoutCustomerIds) {
      console.log(
        `🔍 Processing order ${order._id} with customerNumber: "${order.customerNumber}"`
      );

      // For non-phone number identifiers, create a special customer
      if (order.customerNumber === "Umang Patel") {
        // Check if we already have a customer with this name
        let customer = await customersCollection.findOne({
          customerName: order.customerNumber,
        });

        if (!customer) {
          // Create a new customer record
          const newCustomer = {
            customerName: order.customerNumber,
            countryCode: "+91",
            mobileNumber: "", // Leave empty for non-phone identifiers
            flatNumber: order.flatNumber || "",
            societyName: order.socityName || "",
            address: `${order.flatNumber || ""}, ${order.socityName || ""}`
              .trim()
              .replace(/^,|,$/, ""),
            walletBalance: 0,
            specialCase: true, // Mark as special case
            originalIdentifier: order.customerNumber,
            createdAt: new Date(),
            updatedAt: new Date(),
          };

          const result = await customersCollection.insertOne(newCustomer);
          customer = { _id: result.insertedId, ...newCustomer };
          console.log(`✅ Created special customer: ${order.customerNumber}`);
        }

        // Update the order with the customer ID
        await ordersCollection.updateOne(
          { _id: order._id },
          {
            $set: {
              customerId: customer._id,
              updatedAt: new Date(),
            },
          }
        );

        console.log(`✅ Updated order ${order._id} with customer ID`);
      } else {
        console.log(`⚠️  Unhandled customer format: ${order.customerNumber}`);
      }
    }

    // Verify the fix
    const remainingOrders = await ordersCollection.countDocuments({
      customerId: { $exists: false },
    });

    console.log(`📊 Orders without customer ID after fix: ${remainingOrders}`);

    if (remainingOrders === 0) {
      console.log("🎉 All orders now have customer IDs!");
    }
  } catch (error) {
    console.error("💥 Fix failed:", error);
  } finally {
    if (client!) {
      await client.close();
      console.log("🔌 Disconnected from MongoDB");
    }
  }
}

// Run the fix
if (require.main === module) {
  fixSpecialCaseOrders()
    .then(() => {
      console.log("🏁 Fix completed successfully");
      process.exit(0);
    })
    .catch((error) => {
      console.error("💥 Fix script failed:", error);
      process.exit(1);
    });
}

export { fixSpecialCaseOrders };
