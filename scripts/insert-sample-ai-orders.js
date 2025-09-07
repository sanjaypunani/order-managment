const { MongoClient, ObjectId } = require("mongodb");
require("dotenv").config({ path: ".env.local" });

const uri = process.env.MONGODB_URI;
const dbName = process.env.DB_NAME || "order_management";

// Sample AI orders data
const sampleAIOrders = [
  {
    _id: new ObjectId(),
    customer_id: "Rajesh Kumar",
    customer_phone: "9876543210",
    order_date: new Date("2024-09-06"),
    items: [
      {
        name: "Tomatoes",
        quantity: 2,
        unit: "KG",
        product_id: null,
        estimated_price: 80,
      },
      {
        name: "Onions",
        quantity: 1,
        unit: "KG",
        product_id: null,
        estimated_price: 40,
      },
      {
        name: "Potatoes",
        quantity: 3,
        unit: "KG",
        product_id: null,
        estimated_price: 90,
      },
    ],
    estimated_total: 210,
    notes:
      "Customer mentioned they need fresh vegetables for dinner party tomorrow",
    unrecognized_products: ["exotic lettuce", "purple carrots"],
    customer_messages: [
      {
        message_text: "I need fresh vegetables for tomorrow's dinner party",
        timestamp: new Date("2024-09-06T10:30:00Z"),
        message_type: "order",
      },
      {
        message_text: "Do you have exotic lettuce and purple carrots?",
        timestamp: new Date("2024-09-06T10:32:00Z"),
        message_type: "clarification",
      },
      {
        message_text: "Please deliver by 6 PM tomorrow",
        timestamp: new Date("2024-09-06T10:35:00Z"),
        message_type: "non_order",
      },
    ],
    verification_status: "pending",
    processed_to_final_order: false,
    final_order_id: null,
    ai_confidence: 0.85,
    last_updated: new Date(),
    createdAt: new Date(),
    updatedAt: new Date(),
  },
  {
    _id: new ObjectId(),
    customer_id: "Priya Sharma",
    customer_phone: "8765432109",
    order_date: new Date("2024-09-06"),
    items: [
      {
        name: "Cauliflower",
        quantity: 1,
        unit: "PC",
        product_id: null,
        estimated_price: 50,
      },
      {
        name: "Green Beans",
        quantity: 500,
        unit: "GM",
        product_id: null,
        estimated_price: 35,
      },
    ],
    estimated_total: 85,
    notes: "Regular customer, prefers organic vegetables",
    unrecognized_products: [],
    customer_messages: [
      {
        message_text: "I need 1 gobi and some green beans",
        timestamp: new Date("2024-09-06T14:20:00Z"),
        message_type: "order",
      },
    ],
    verification_status: "verified",
    processed_to_final_order: false,
    final_order_id: null,
    ai_confidence: 0.92,
    last_updated: new Date(),
    createdAt: new Date(),
    updatedAt: new Date(),
  },
  {
    _id: new ObjectId(),
    customer_id: "Amit Patel",
    customer_phone: "7654321098",
    order_date: new Date("2024-09-05"),
    items: [
      {
        name: "Spinach",
        quantity: 250,
        unit: "GM",
        product_id: null,
        estimated_price: 25,
      },
      {
        name: "Carrots",
        quantity: 1,
        unit: "KG",
        product_id: null,
        estimated_price: 50,
      },
    ],
    estimated_total: 75,
    notes: "Customer mentioned dietary restrictions",
    unrecognized_products: ["baby corn", "snow peas"],
    customer_messages: [
      {
        message_text: "I want palak and gajar for my diet plan",
        timestamp: new Date("2024-09-05T16:45:00Z"),
        message_type: "order",
      },
      {
        message_text: "Can you get baby corn and snow peas too?",
        timestamp: new Date("2024-09-05T16:47:00Z"),
        message_type: "clarification",
      },
    ],
    verification_status: "needs_clarification",
    processed_to_final_order: false,
    final_order_id: null,
    ai_confidence: 0.75,
    last_updated: new Date(),
    createdAt: new Date(),
    updatedAt: new Date(),
  },
  {
    _id: new ObjectId(),
    customer_id: "Sneha Singh",
    customer_phone: "6543210987",
    order_date: new Date("2024-09-04"),
    items: [
      {
        name: "Brinjal",
        quantity: 500,
        unit: "GM",
        product_id: null,
        estimated_price: 30,
      },
    ],
    estimated_total: 30,
    notes: "Simple order, low confidence due to unclear audio",
    unrecognized_products: ["thai eggplant"],
    customer_messages: [
      {
        message_text: "baingan chahiye... thai wala bhi hai kya?",
        timestamp: new Date("2024-09-04T12:15:00Z"),
        message_type: "order",
      },
    ],
    verification_status: "rejected",
    processed_to_final_order: false,
    final_order_id: null,
    ai_confidence: 0.45,
    last_updated: new Date(),
    createdAt: new Date(),
    updatedAt: new Date(),
  },
];

async function insertSampleData() {
  console.log("=== AI Orders Sample Data Insertion ===");
  console.log("MongoDB URI:", uri ? "Set" : "Missing");
  console.log("Database Name:", dbName);

  if (!uri) {
    console.error("❌ MONGODB_URI environment variable is not set");
    process.exit(1);
  }

  const client = new MongoClient(uri);

  try {
    console.log("Connecting to MongoDB...");
    await client.connect();
    console.log("✅ Connected to MongoDB");

    const db = client.db(dbName);
    const aiOrdersCollection = db.collection("aiorders");

    // Check if collection already has data
    const existingCount = await aiOrdersCollection.countDocuments();
    console.log(`Existing AI orders in database: ${existingCount}`);

    // For testing purposes, let's clear existing data and insert fresh sample data
    if (existingCount > 0) {
      console.log("Clearing existing AI orders for fresh sample data...");
      await aiOrdersCollection.deleteMany({});
      console.log("✅ Cleared existing AI orders");
    }

    console.log("Inserting sample AI orders...");
    const result = await aiOrdersCollection.insertMany(sampleAIOrders);

    console.log(
      `✅ Successfully inserted ${result.insertedCount} sample AI orders`
    );
    console.log("Inserted IDs:", Object.values(result.insertedIds));

    // Verify insertion
    const verifyCount = await aiOrdersCollection.countDocuments();
    console.log(`Total AI orders in database: ${verifyCount}`);
  } catch (error) {
    console.error("❌ Error inserting sample data:", error);
  } finally {
    await client.close();
    console.log("Connection closed");
  }
}

if (require.main === module) {
  insertSampleData();
}

module.exports = { insertSampleData, sampleAIOrders };
