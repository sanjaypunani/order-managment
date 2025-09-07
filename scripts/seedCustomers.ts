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

async function seedCustomersFromOrders() {
  let client: MongoClient;

  try {
    console.log("🚀 Starting customer seeding from orders...");

    // Connect to MongoDB
    client = new MongoClient(uri!);
    await client.connect();
    const db = client.db(dbName);

    const ordersCollection = db.collection("orders");
    const customersCollection = db.collection("customers");

    // Get all orders with customer information
    const orders = await ordersCollection
      .find(
        {},
        {
          projection: {
            customerName: 1,
            customerNumber: 1,
            flatNumber: 1,
            socityName: 1,
            _id: 0,
          },
        }
      )
      .toArray();

    console.log(`📦 Found ${orders.length} orders to process`);

    // Create a Map to store unique customers (using mobile number as key)
    const uniqueCustomers = new Map();

    orders.forEach((order: any) => {
      const fullNumber = order.customerNumber;

      if (
        fullNumber &&
        typeof fullNumber === "string" &&
        !uniqueCustomers.has(fullNumber)
      ) {
        // Remove all spaces and non-digit characters except + at the beginning
        let cleanNumber = fullNumber.replace(/\s+/g, "").trim();

        // Separate country code and mobile number
        let countryCode = "+91";
        let mobileNumber = cleanNumber;

        // Check if the number starts with +91 or 91
        if (cleanNumber.startsWith("+91")) {
          countryCode = "+91";
          mobileNumber = cleanNumber.substring(3);
        } else if (cleanNumber.startsWith("91") && cleanNumber.length > 10) {
          countryCode = "+91";
          mobileNumber = cleanNumber.substring(2);
        } else if (cleanNumber.startsWith("0")) {
          // Remove leading 0 if present
          mobileNumber = cleanNumber.substring(1);
        } else if (/^\d{10}$/.test(cleanNumber)) {
          // Already a 10-digit number
          mobileNumber = cleanNumber;
        } else if (!/^\d/.test(cleanNumber)) {
          // Not a number (like "Umang Patel")
          console.warn(`⚠️  Skipping non-numeric value: ${fullNumber}`);
          return;
        }

        // Ensure mobile number is 10 digits
        if (mobileNumber.length === 10 && /^\d+$/.test(mobileNumber)) {
          uniqueCustomers.set(mobileNumber, {
            customerName: order.customerName || "Unnamed Customer",
            countryCode: countryCode,
            mobileNumber: mobileNumber,
            flatNumber: order.flatNumber,
            societyName: order.socityName,
            createdAt: new Date(),
            updatedAt: new Date(),
          });
        } else {
          console.warn(
            `⚠️  Invalid mobile number format after cleaning: ${fullNumber} -> ${mobileNumber}`
          );
        }
      }
    });

    console.log(`👥 Found ${uniqueCustomers.size} unique customers`);

    // Insert customers into database
    const customers = Array.from(uniqueCustomers.values());
    let processedCount = 0;
    let skippedCount = 0;

    for (const customer of customers) {
      try {
        // Check if customer already exists
        const existingCustomer = await customersCollection.findOne({
          mobileNumber: customer.mobileNumber,
        });

        if (existingCustomer) {
          // Update existing customer with any missing information
          await customersCollection.updateOne(
            { mobileNumber: customer.mobileNumber },
            {
              $set: {
                customerName: customer.customerName,
                countryCode: customer.countryCode,
                flatNumber: customer.flatNumber,
                societyName: customer.societyName,
                updatedAt: new Date(),
              },
            }
          );
          console.log(
            `🔄 Updated customer: ${customer.customerName} (${customer.countryCode}${customer.mobileNumber})`
          );
          processedCount++;
        } else {
          // Create new customer
          await customersCollection.insertOne(customer);
          console.log(
            `✅ Created customer: ${customer.customerName} (${customer.countryCode}${customer.mobileNumber})`
          );
          processedCount++;
        }
      } catch (error) {
        console.error(
          `❌ Error processing customer ${customer.countryCode}${customer.mobileNumber}:`,
          error
        );
        skippedCount++;
      }
    }

    console.log("\n🎉 Customer seeding completed!");
    console.log(`✅ Processed: ${processedCount} customers`);
    console.log(`⚠️  Skipped: ${skippedCount} customers`);
  } catch (error) {
    console.error("❌ Error seeding customers:", error);
    process.exit(1);
  } finally {
    if (client!) {
      await client.close();
    }
  }
}

// Run the seeding function
seedCustomersFromOrders()
  .then(() => {
    console.log("🏁 Script completed successfully");
    process.exit(0);
  })
  .catch((error) => {
    console.error("💥 Script failed:", error);
    process.exit(1);
  });
