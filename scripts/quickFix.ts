import { MongoClient, ObjectId } from "mongodb";
import * as dotenv from "dotenv";

dotenv.config({ path: ".env.local" });

const uri = process.env.MONGODB_URI;
const dbName = process.env.DB_NAME || "order_management";

async function quickFix() {
  const client = new MongoClient(uri!);

  try {
    await client.connect();
    console.log("Connected to MongoDB");

    const db = client.db(dbName);
    const ordersCollection = db.collection("orders");
    const customersCollection = db.collection("customers");

    // Find the problematic order
    const order = await ordersCollection.findOne({
      customerNumber: "Umang Patel",
    });

    if (order) {
      console.log("Found order with Umang Patel");

      // Create customer for Umang Patel
      const customer = await customersCollection.insertOne({
        customerName: "Umang Patel",
        countryCode: "+91",
        mobileNumber: "9739057990", // Use a number from the order data if available
        flatNumber: order.flatNumber || "",
        societyName: order.socityName || "",
        address: `${order.flatNumber || ""}, ${order.socityName || ""}`,
        walletBalance: 0,
        createdAt: new Date(),
        updatedAt: new Date(),
      });

      console.log("Created customer for Umang Patel");

      // Update the order
      await ordersCollection.updateOne(
        { _id: order._id },
        { $set: { customerId: customer.insertedId, updatedAt: new Date() } }
      );

      console.log("Updated order with customer ID");
    }

    // Check final status
    const remaining = await ordersCollection.countDocuments({
      customerId: { $exists: false },
    });
    console.log(`Orders without customer ID: ${remaining}`);
  } catch (error) {
    console.error("Error:", error);
  } finally {
    await client.close();
  }
}

quickFix();
