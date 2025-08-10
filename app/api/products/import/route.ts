export const runtime = "nodejs";

import { NextRequest, NextResponse } from "next/server";
import { connectDB } from "@/lib/db";
import { getProductsCollection } from "@/lib/models";
import type { Product } from "@/lib/types/product";

export async function POST(req: NextRequest) {
  await connectDB();

  try {
    const body = await req.json();
    const { products } = body;

    if (!products || !Array.isArray(products)) {
      return NextResponse.json(
        { success: false, error: "Products array is required" },
        { status: 400 }
      );
    }

    const productsCol = getProductsCollection();
    const results = {
      imported: 0,
      updated: 0,
      errors: [] as string[],
    };

    for (let i = 0; i < products.length; i++) {
      const productData = products[i];

      try {
        // Validate required fields
        if (
          !productData.name ||
          !productData.price ||
          !productData.unit ||
          !productData.quantity
        ) {
          results.errors.push(
            `Row ${
              i + 1
            }: Missing required fields (name, price, unit, quantity)`
          );
          continue;
        }

        // Parse Gujarati and English names
        const nameGujarati =
          productData.nameGujarati ||
          (productData.name.includes("(")
            ? productData.name.split("(")[0].trim()
            : productData.name);
        const nameEnglish =
          productData.nameEnglish ||
          (productData.name.includes("(") && productData.name.includes(")")
            ? productData.name.split("(")[1].replace(")", "").trim()
            : productData.name);

        const product: Omit<Product, "_id"> = {
          name: productData.name,
          nameGujarati,
          nameEnglish,
          price: Number(productData.price),
          unit: productData.unit,
          quantity: Number(productData.quantity),
          category: productData.category || "vegetables",
          isActive:
            productData.isActive !== undefined
              ? Boolean(productData.isActive)
              : true,
          isAvailable:
            productData.isAvailable !== undefined
              ? Boolean(productData.isAvailable)
              : true,
          stockQuantity: productData.stockQuantity
            ? Number(productData.stockQuantity)
            : undefined,
          sortOrder: productData.sortOrder ? Number(productData.sortOrder) : 0,
          createdAt: new Date(),
          updatedAt: new Date(),
        };

        // Check if product exists
        const existingProduct = await productsCol.findOne({
          name: product.name,
        });

        if (existingProduct) {
          // Update existing product
          await productsCol.updateOne(
            { name: product.name },
            { $set: { ...product, createdAt: existingProduct.createdAt } }
          );
          results.updated++;
        } else {
          // Insert new product
          await productsCol.insertOne(product);
          results.imported++;
        }
      } catch (error) {
        results.errors.push(
          `Row ${i + 1}: ${
            error instanceof Error ? error.message : "Unknown error"
          }`
        );
      }
    }

    return NextResponse.json({
      success: true,
      results,
      message: `Import completed: ${results.imported} new products, ${results.updated} updated products`,
    });
  } catch (error) {
    const errorMsg = error instanceof Error ? error.message : String(error);
    console.error("Import error:", errorMsg);
    return NextResponse.json(
      { success: false, error: "Failed to import products" },
      { status: 500 }
    );
  }
}

export async function GET() {
  await connectDB();

  try {
    const productsCol = getProductsCollection();

    const products = await productsCol
      .find({})
      .sort({ sortOrder: 1, createdAt: -1 })
      .toArray();

    // Convert to CSV format
    const csvHeaders = [
      "name",
      "nameGujarati",
      "nameEnglish",
      "price",
      "unit",
      "quantity",
      "category",
      "isActive",
      "isAvailable",
      "stockQuantity",
      "sortOrder",
    ].join(",");

    const csvRows = products.map((product) =>
      [
        `"${product.name}"`,
        `"${product.nameGujarati}"`,
        `"${product.nameEnglish}"`,
        product.price,
        product.unit,
        product.quantity,
        `"${product.category}"`,
        product.isActive,
        product.isAvailable,
        product.stockQuantity || "",
        product.sortOrder || 0,
      ].join(",")
    );

    const csvContent = [csvHeaders, ...csvRows].join("\n");

    return new NextResponse(csvContent, {
      headers: {
        "Content-Type": "text/csv",
        "Content-Disposition": `attachment; filename="products-export-${
          new Date().toISOString().split("T")[0]
        }.csv"`,
      },
    });
  } catch (error) {
    const errorMsg = error instanceof Error ? error.message : String(error);
    console.error("Export error:", errorMsg);
    return NextResponse.json(
      { success: false, error: "Failed to export products" },
      { status: 500 }
    );
  }
}
