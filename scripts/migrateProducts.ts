import { MongoClient } from "mongodb";
import { ITEMS } from "../app/dashboard/constants";
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

// Helper function to parse Gujarati and English names
function parseProductName(name: string) {
  const parts = name.split("(");
  const gujaratiName = parts[0].trim();
  const englishName = parts[1]
    ? parts[1].replace(")", "").trim()
    : gujaratiName;

  return {
    nameGujarati: gujaratiName,
    nameEnglish: englishName,
  };
}

// Categorize products based on name patterns
function categorizeProduct(name: string): string {
  const lowerName = name.toLowerCase();

  if (lowerName.includes("bhaji") || lowerName.includes("leaves")) {
    return "leafy-vegetables";
  }
  if (
    lowerName.includes("gourd") ||
    lowerName.includes("દુધી") ||
    lowerName.includes("તુરીયા")
  ) {
    return "gourds";
  }
  if (lowerName.includes("corn") || lowerName.includes("મકાઈ")) {
    return "grains";
  }
  if (lowerName.includes("peanut") || lowerName.includes("મગફળી")) {
    return "nuts-seeds";
  }
  if (lowerName.includes("potato") || lowerName.includes("બટાટા")) {
    return "root-vegetables";
  }
  if (lowerName.includes("ginger") || lowerName.includes("અદુ")) {
    return "spices-herbs";
  }
  if (lowerName.includes("lemon") || lowerName.includes("લીંબૂ")) {
    return "citrus";
  }

  return "vegetables"; // Default category
}

async function migrateItemsToProducts() {
  let client: MongoClient;

  try {
    console.log("🚀 Starting migration of items to products...");

    // Connect to MongoDB
    client = new MongoClient(uri!);
    await client.connect();
    const db = client.db(dbName);

    const productsCollection = db.collection("products");
    const categoriesCollection = db.collection("product_categories");

    // First, create default categories
    const defaultCategories = [
      {
        name: "Vegetables",
        nameGujarati: "શાકભાજી",
        nameEnglish: "Vegetables",
        sortOrder: 1,
      },
      {
        name: "Leafy Vegetables",
        nameGujarati: "લીલા શાકભાજી",
        nameEnglish: "Leafy Vegetables",
        sortOrder: 2,
      },
      {
        name: "Gourds",
        nameGujarati: "લાઉકા",
        nameEnglish: "Gourds",
        sortOrder: 3,
      },
      {
        name: "Root Vegetables",
        nameGujarati: "મૂળિયાં",
        nameEnglish: "Root Vegetables",
        sortOrder: 4,
      },
      {
        name: "Grains",
        nameGujarati: "અનાજ",
        nameEnglish: "Grains",
        sortOrder: 5,
      },
      {
        name: "Nuts & Seeds",
        nameGujarati: "બદામ અને બીજ",
        nameEnglish: "Nuts & Seeds",
        sortOrder: 6,
      },
      {
        name: "Spices & Herbs",
        nameGujarati: "મસાલા અને જડીબુટ્ટી",
        nameEnglish: "Spices & Herbs",
        sortOrder: 7,
      },
      {
        name: "Citrus",
        nameGujarati: "લીંબુ જાતિ",
        nameEnglish: "Citrus",
        sortOrder: 8,
      },
    ];

    // Insert categories (ignore duplicates)
    for (const category of defaultCategories) {
      try {
        await categoriesCollection.insertOne({
          ...category,
          isActive: true,
          createdAt: new Date(),
          updatedAt: new Date(),
        });
        console.log(`✅ Created category: ${category.name}`);
      } catch (error: any) {
        if (error.code !== 11000) {
          // Ignore duplicate key error
          console.log(`⚠️ Category ${category.name} might already exist`);
        }
      }
    }

    console.log(`📦 Found ${ITEMS.length} items to migrate`);

    // Clear existing products if any
    await productsCollection.deleteMany({});
    console.log("🗑️ Cleared existing products");

    // Convert items to products
    const products = ITEMS.map((item, index) => {
      const { nameGujarati, nameEnglish } = parseProductName(item.name);
      const category = categorizeProduct(item.name);

      return {
        name: item.name,
        nameGujarati,
        nameEnglish,
        price: item.price,
        unit: item.unit,
        quantity: item.quantity,
        category,
        isActive: true,
        isAvailable: item.price > 0, // Items with 0 price are considered unavailable
        stockQuantity: item.quantity * 10, // Set initial stock as 10x the default quantity
        sortOrder: index + 1,
        createdAt: new Date(),
        updatedAt: new Date(),
      };
    });

    // Insert products
    const result = await productsCollection.insertMany(products);
    console.log(`✅ Successfully migrated ${result.insertedCount} products`);

    // Log sample products
    const sampleProducts = await productsCollection.find({}).limit(5).toArray();
    console.log("\n📋 Sample migrated products:");
    sampleProducts.forEach((product, index) => {
      console.log(
        `${index + 1}. ${product.name} - ₹${product.price}/${product.unit} (${
          product.category
        })`
      );
    });

    // Show category distribution
    const categoryStats = await productsCollection
      .aggregate([
        { $group: { _id: "$category", count: { $sum: 1 } } },
        { $sort: { count: -1 } },
      ])
      .toArray();

    console.log("\n📊 Products by category:");
    categoryStats.forEach((stat) => {
      console.log(`${stat._id}: ${stat.count} products`);
    });

    console.log("\n🎉 Migration completed successfully!");
  } catch (error) {
    console.error("💥 Migration failed:", error);
    throw error;
  } finally {
    if (client!) {
      await client.close();
      console.log("🔌 Database connection closed");
    }
  }
}

// Run the migration
if (require.main === module) {
  migrateItemsToProducts()
    .then(() => {
      console.log("🏁 Migration script completed successfully");
      process.exit(0);
    })
    .catch((error) => {
      console.error("💥 Migration script failed:", error);
      process.exit(1);
    });
}

export { migrateItemsToProducts };
