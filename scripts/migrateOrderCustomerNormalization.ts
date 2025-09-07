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

interface CustomerData {
  customerName: string;
  customerNumber: string;
  flatNumber: string;
  socityName: string;
  countryCode: string;
  mobileNumber: string;
}

interface OrderBackup {
  _id: ObjectId;
  customerNumber: string;
  customerName: string;
  flatNumber: string;
  socityName: string;
  [key: string]: any;
}

/**
 * Create a backup of the current database state
 */
async function createDatabaseBackup(client: MongoClient) {
  console.log("📦 Creating database backup...");

  try {
    const db = client.db(dbName);
    const ordersCollection = db.collection("orders");
    const customersCollection = db.collection("customers");

    // Create backup directory
    const backupDir = path.join(process.cwd(), "backups");
    if (!fs.existsSync(backupDir)) {
      fs.mkdirSync(backupDir, { recursive: true });
    }

    const timestamp = new Date().toISOString().replace(/[:.]/g, "-");
    const backupFile = path.join(backupDir, `db-backup-${timestamp}.json`);

    // Get all orders and customers
    const orders = await ordersCollection.find({}).toArray();
    const customers = await customersCollection.find({}).toArray();

    const backupData = {
      timestamp: new Date().toISOString(),
      orders: orders,
      customers: customers,
      stats: {
        totalOrders: orders.length,
        totalCustomers: customers.length,
      },
    };

    // Write backup to file
    fs.writeFileSync(backupFile, JSON.stringify(backupData, null, 2));

    console.log(`✅ Database backup created: ${backupFile}`);
    console.log(
      `📊 Backup contains ${orders.length} orders and ${customers.length} customers`
    );

    return backupFile;
  } catch (error) {
    console.error("❌ Error creating backup:", error);
    throw error;
  }
}

/**
 * Parse and clean customer number to separate country code and mobile number
 */
function parseCustomerNumber(customerNumber: string): {
  countryCode: string;
  mobileNumber: string;
} {
  if (!customerNumber) {
    return { countryCode: "+91", mobileNumber: "" };
  }

  // Remove all spaces and trim
  let cleanNumber = customerNumber.replace(/\s+/g, "").trim();

  // Default values
  let countryCode = "+91";
  let mobileNumber = cleanNumber;

  // Handle various formats
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
  } else if (/^\d{8,12}$/.test(cleanNumber)) {
    // Handle numbers between 8-12 digits
    if (cleanNumber.length === 11 && cleanNumber.startsWith("91")) {
      countryCode = "+91";
      mobileNumber = cleanNumber.substring(2);
    } else if (cleanNumber.length === 12 && cleanNumber.startsWith("091")) {
      countryCode = "+91";
      mobileNumber = cleanNumber.substring(3);
    } else {
      mobileNumber = cleanNumber;
    }
  }

  // For names or invalid formats, return empty mobile number
  if (!/^\d{10}$/.test(mobileNumber)) {
    console.warn(
      `⚠️  Invalid/non-numeric customer number: ${customerNumber} -> ${mobileNumber}`
    );
    return { countryCode: "+91", mobileNumber: "" };
  }

  return { countryCode, mobileNumber };
}

/**
 * Extract unique customers from orders
 */
async function extractUniqueCustomers(
  client: MongoClient
): Promise<Map<string, CustomerData>> {
  console.log("👥 Extracting unique customers from orders...");

  const db = client.db(dbName);
  const ordersCollection = db.collection("orders");

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

  console.log(
    `📦 Processing ${orders.length} orders for customer extraction...`
  );

  const uniqueCustomers = new Map<string, CustomerData>();

  orders.forEach((order: any) => {
    const fullNumber = order.customerNumber;

    if (fullNumber && typeof fullNumber === "string") {
      const { countryCode, mobileNumber } = parseCustomerNumber(fullNumber);

      // Only process if we got a valid mobile number
      if (
        mobileNumber &&
        mobileNumber.length === 10 &&
        /^\d+$/.test(mobileNumber)
      ) {
        if (!uniqueCustomers.has(mobileNumber)) {
          uniqueCustomers.set(mobileNumber, {
            customerName: order.customerName || "Unnamed Customer",
            customerNumber: fullNumber,
            countryCode: countryCode,
            mobileNumber: mobileNumber,
            flatNumber: order.flatNumber || "",
            socityName: order.socityName || "",
          });
        }
      }
    }
  });

  console.log(`✅ Found ${uniqueCustomers.size} unique customers`);
  return uniqueCustomers;
}

/**
 * Create or update customers in the customers collection
 */
async function createCustomers(
  client: MongoClient,
  customers: Map<string, CustomerData>
): Promise<Map<string, ObjectId>> {
  console.log("👤 Creating/updating customers...");

  const db = client.db(dbName);
  const customersCollection = db.collection("customers");

  const customerIdMap = new Map<string, ObjectId>();
  let createdCount = 0;
  let updatedCount = 0;

  for (const [mobileNumber, customerData] of customers) {
    try {
      // Check if customer already exists
      const existingCustomer = await customersCollection.findOne({
        mobileNumber: mobileNumber,
      });

      if (existingCustomer) {
        // Update existing customer with any missing/updated information
        await customersCollection.updateOne(
          { mobileNumber: mobileNumber },
          {
            $set: {
              customerName: customerData.customerName,
              countryCode: customerData.countryCode,
              flatNumber: customerData.flatNumber,
              societyName: customerData.socityName,
              updatedAt: new Date(),
            },
          }
        );

        customerIdMap.set(customerData.customerNumber, existingCustomer._id);
        console.log(
          `🔄 Updated customer: ${customerData.customerName} (${customerData.countryCode}${customerData.mobileNumber})`
        );
        updatedCount++;
      } else {
        // Create new customer
        const newCustomer = {
          customerName: customerData.customerName,
          countryCode: customerData.countryCode,
          mobileNumber: customerData.mobileNumber,
          flatNumber: customerData.flatNumber,
          societyName: customerData.socityName,
          address: `${customerData.flatNumber}, ${customerData.socityName}`,
          walletBalance: 0, // Initialize wallet balance
          createdAt: new Date(),
          updatedAt: new Date(),
        };

        const result = await customersCollection.insertOne(newCustomer);
        customerIdMap.set(customerData.customerNumber, result.insertedId);
        console.log(
          `✅ Created customer: ${customerData.customerName} (${customerData.countryCode}${customerData.mobileNumber})`
        );
        createdCount++;
      }
    } catch (error) {
      console.error(
        `❌ Error processing customer ${customerData.customerName}:`,
        error
      );
    }
  }

  console.log(
    `✅ Customer processing completed: ${createdCount} created, ${updatedCount} updated`
  );
  return customerIdMap;
}

/**
 * Update orders to use customer IDs instead of storing customer details directly
 */
async function updateOrders(
  client: MongoClient,
  customerIdMap: Map<string, ObjectId>
) {
  console.log("📝 Updating orders with customer IDs...");

  const db = client.db(dbName);
  const ordersCollection = db.collection("orders");

  // Get all orders
  const orders = await ordersCollection.find({}).toArray();
  console.log(
    `📦 Processing ${orders.length} orders for customer ID updates...`
  );

  let updatedCount = 0;
  let skippedCount = 0;

  for (const order of orders) {
    try {
      // Try to find customer ID by parsing the customer number
      const { mobileNumber } = parseCustomerNumber(order.customerNumber);
      let customerId = null;

      if (mobileNumber) {
        // Look for customer by mobile number in our map
        customerId = customerIdMap.get(mobileNumber);

        // If not found in map, try to find directly in database
        if (!customerId) {
          const customersCollection = db.collection("customers");
          const customer = await customersCollection.findOne({
            mobileNumber: mobileNumber,
          });
          if (customer) {
            customerId = customer._id;
            customerIdMap.set(mobileNumber, customerId); // Cache for future use
          }
        }
      }

      if (customerId) {
        // Update order with customer ID and remove denormalized customer fields
        await ordersCollection.updateOne(
          { _id: order._id },
          {
            $set: {
              customerId: customerId,
              updatedAt: new Date(),
            },
            // Keep the old fields for now as backup, we'll remove them in a later step
            // $unset: {
            //   customerNumber: "",
            //   customerName: "",
            //   flatNumber: "",
            //   socityName: "",
            // },
          }
        );

        updatedCount++;
        if (updatedCount % 100 === 0) {
          console.log(`   Processed ${updatedCount} orders...`);
        }
      } else {
        console.warn(
          `⚠️  No customer found for order ${order._id} with customerNumber: ${order.customerNumber}`
        );
        skippedCount++;
      }
    } catch (error) {
      console.error(`❌ Error updating order ${order._id}:`, error);
      skippedCount++;
    }
  }

  console.log(
    `✅ Order updates completed: ${updatedCount} updated, ${skippedCount} skipped`
  );
}

/**
 * Verify the migration by checking data consistency
 */
async function verifyMigration(client: MongoClient) {
  console.log("🔍 Verifying migration...");

  const db = client.db(dbName);
  const ordersCollection = db.collection("orders");
  const customersCollection = db.collection("customers");

  // Check orders with customer IDs
  const ordersWithCustomerId = await ordersCollection.countDocuments({
    customerId: { $exists: true },
  });
  const totalOrders = await ordersCollection.countDocuments({});

  // Check total customers
  const totalCustomers = await customersCollection.countDocuments({});

  // Check for orders without customer IDs
  const ordersWithoutCustomerId = await ordersCollection
    .find({ customerId: { $exists: false } })
    .limit(5)
    .toArray();

  console.log(`📊 Migration Verification Results:`);
  console.log(`   Total Orders: ${totalOrders}`);
  console.log(`   Orders with Customer ID: ${ordersWithCustomerId}`);
  console.log(
    `   Orders without Customer ID: ${totalOrders - ordersWithCustomerId}`
  );
  console.log(`   Total Customers: ${totalCustomers}`);

  if (ordersWithoutCustomerId.length > 0) {
    console.log(`⚠️  Orders without customer ID (sample):`);
    ordersWithoutCustomerId.forEach((order, index) => {
      console.log(
        `   ${index + 1}. Order ${order._id}: ${order.customerNumber} - ${
          order.customerName
        }`
      );
    });
  }

  const migrationSuccess = ordersWithCustomerId === totalOrders;
  console.log(
    `${migrationSuccess ? "✅" : "❌"} Migration ${
      migrationSuccess ? "SUCCESSFUL" : "INCOMPLETE"
    }`
  );

  return migrationSuccess;
}

/**
 * Main migration function
 */
async function migrateOrderCustomerNormalization() {
  let client: MongoClient;

  try {
    console.log("🚀 Starting Order-Customer Normalization Migration...");
    console.log("=".repeat(60));

    // Connect to MongoDB
    client = new MongoClient(uri!);
    await client.connect();
    console.log("✅ Connected to MongoDB");

    // Step 1: Create database backup
    const backupFile = await createDatabaseBackup(client);

    // Step 2: Extract unique customers from orders
    const uniqueCustomers = await extractUniqueCustomers(client);

    // Step 3: Create/update customers and get ID mapping
    const customerIdMap = await createCustomers(client, uniqueCustomers);

    // Step 4: Update orders with customer IDs
    await updateOrders(client, customerIdMap);

    // Step 5: Verify migration
    const migrationSuccess = await verifyMigration(client);

    console.log("=".repeat(60));
    console.log("🎉 Migration completed!");
    console.log(`📁 Backup file: ${backupFile}`);
    console.log(
      `${migrationSuccess ? "✅" : "⚠️ "} Migration ${
        migrationSuccess ? "successful" : "completed with warnings"
      }`
    );

    if (migrationSuccess) {
      console.log("\n📋 Next Steps:");
      console.log(
        "1. Test your application to ensure everything works correctly"
      );
      console.log(
        "2. Once verified, you can remove the old customer fields from orders using the cleanup script"
      );
      console.log(
        "3. Update your application code to use customer IDs instead of denormalized data"
      );
    }
  } catch (error) {
    console.error("💥 Migration failed:", error);
    process.exit(1);
  } finally {
    if (client!) {
      await client.close();
      console.log("🔌 Disconnected from MongoDB");
    }
  }
}

// Run the migration
if (require.main === module) {
  migrateOrderCustomerNormalization()
    .then(() => {
      console.log("🏁 Migration script completed successfully");
      process.exit(0);
    })
    .catch((error) => {
      console.error("💥 Migration script failed:", error);
      process.exit(1);
    });
}

export { migrateOrderCustomerNormalization };
