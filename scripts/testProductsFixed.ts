// Test script to verify products are properly migrated and accessible
import { connectDB } from "../lib/db";

async function testProducts() {
  try {
    console.log("🔗 Connecting to database...");
    const db = await connectDB();

    console.log("📋 Fetching products...");
    const products = await db
      .collection("products")
      .find({})
      .limit(5)
      .toArray();

    console.log(`✅ Found ${products.length} products (showing first 5):`);
    products.forEach((product: any, index: number) => {
      console.log(
        `${index + 1}. ${product.name} - ₹${product.price}/${
          product.unit
        } (Stock: ${product.stockQuantity || 0})`
      );
    });

    console.log("\n📊 Getting total product count...");
    const totalCount = await db.collection("products").countDocuments();
    console.log(`📦 Total products in database: ${totalCount}`);

    console.log("\n🏷️ Fetching categories...");
    const categories = await db
      .collection("product_categories")
      .find({})
      .toArray();
    console.log(`📂 Found ${categories.length} categories:`);
    categories.forEach((category: any, index: number) => {
      console.log(
        `${index + 1}. ${category.name} (${
          category.description || "No description"
        })`
      );
    });

    process.exit(0);
  } catch (error) {
    console.error("❌ Error testing products:", error);
    process.exit(1);
  }
}

testProducts();
