export const runtime = "nodejs";

import { NextRequest, NextResponse } from "next/server";
import { connectDB } from "@/lib/db";
import {
  getProductsCollection,
  getProductCategoriesCollection,
  getPriceHistoryCollection,
} from "@/lib/models";
import { ObjectId } from "mongodb";
import type { Product, ProductFilterParams } from "@/lib/types/product";
import type { PriceHistory } from "@/lib/types/priceHistory";

export async function GET(req: NextRequest) {
  await connectDB();

  try {
    const { searchParams } = new URL(req.url);
    const filters: ProductFilterParams = {
      search: searchParams.get("search") || undefined,
      category: searchParams.get("category") || undefined,
      isActive: searchParams.get("isActive")
        ? searchParams.get("isActive") === "true"
        : undefined,
      isAvailable: searchParams.get("isAvailable")
        ? searchParams.get("isAvailable") === "true"
        : undefined,
      minPrice: searchParams.get("minPrice")
        ? Number(searchParams.get("minPrice"))
        : undefined,
      maxPrice: searchParams.get("maxPrice")
        ? Number(searchParams.get("maxPrice"))
        : undefined,
      unit: searchParams.get("unit") || undefined,
      page: Number(searchParams.get("page")) || 1,
      limit: Number(searchParams.get("limit")) || 20,
    };

    const productsCol = getProductsCollection();

    // Build MongoDB query
    const mongoQuery: any = {};

    if (filters.search) {
      mongoQuery.$or = [
        { name: { $regex: filters.search, $options: "i" } },
        { nameGujarati: { $regex: filters.search, $options: "i" } },
        { nameEnglish: { $regex: filters.search, $options: "i" } },
      ];
    }

    if (filters.category) {
      mongoQuery.category = filters.category;
    }

    if (filters.isActive !== undefined) {
      mongoQuery.isActive = filters.isActive;
    }

    if (filters.isAvailable !== undefined) {
      mongoQuery.isAvailable = filters.isAvailable;
    }

    if (filters.minPrice !== undefined || filters.maxPrice !== undefined) {
      mongoQuery.price = {};
      if (filters.minPrice !== undefined)
        mongoQuery.price.$gte = filters.minPrice;
      if (filters.maxPrice !== undefined)
        mongoQuery.price.$lte = filters.maxPrice;
    }

    if (filters.unit) {
      mongoQuery.unit = filters.unit;
    }

    // Get total count for pagination
    const total = await productsCol.countDocuments(mongoQuery);
    const totalPages = Math.ceil(total / filters.limit!);

    // Get products with pagination
    const products = await productsCol
      .find(mongoQuery)
      .sort({ sortOrder: 1, createdAt: -1 })
      .skip((filters.page! - 1) * filters.limit!)
      .limit(filters.limit!)
      .toArray();

    return NextResponse.json({
      success: true,
      products,
      total,
      page: filters.page,
      totalPages,
    });
  } catch (error) {
    const errorMsg = error instanceof Error ? error.message : String(error);
    console.error("Products GET error:", errorMsg);
    return NextResponse.json(
      { success: false, error: "Failed to fetch products" },
      { status: 500 }
    );
  }
}

export async function POST(req: NextRequest) {
  await connectDB();

  try {
    const body = await req.json();
    const {
      name,
      nameGujarati,
      nameEnglish,
      price,
      unit,
      quantity,
      category,
      isActive = true,
      isAvailable = true,
      stockQuantity,
      sortOrder,
    } = body;

    // Validation
    if (!name || !price || !unit || !quantity || !category) {
      return NextResponse.json(
        { success: false, error: "Missing required fields" },
        { status: 400 }
      );
    }

    const productsCol = getProductsCollection();

    // Check if product with same name already exists
    const existingProduct = await productsCol.findOne({ name });
    if (existingProduct) {
      return NextResponse.json(
        { success: false, error: "Product with this name already exists" },
        { status: 400 }
      );
    }

    const newProduct: Omit<Product, "_id"> = {
      name,
      nameGujarati: nameGujarati || name.split("(")[0].trim(),
      nameEnglish:
        nameEnglish ||
        (name.includes("(")
          ? name.split("(")[1]?.replace(")", "").trim()
          : name),
      price: Number(price),
      unit,
      quantity: Number(quantity),
      category,
      isActive,
      isAvailable,
      stockQuantity: stockQuantity ? Number(stockQuantity) : undefined,
      sortOrder: sortOrder || 0,
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    const result = await productsCol.insertOne(newProduct);

    return NextResponse.json({
      success: true,
      productId: result.insertedId,
    });
  } catch (error) {
    const errorMsg = error instanceof Error ? error.message : String(error);
    console.error("Products POST error:", errorMsg);
    return NextResponse.json(
      { success: false, error: "Failed to create product" },
      { status: 500 }
    );
  }
}

export async function PUT(req: NextRequest) {
  await connectDB();

  try {
    const body = await req.json();
    const { productId, ...updateData } = body;

    if (!productId) {
      return NextResponse.json(
        { success: false, error: "Product ID is required" },
        { status: 400 }
      );
    }

    const productsCol = getProductsCollection();
    const priceHistoryCol = getPriceHistoryCollection();

    // Get current product for price history tracking
    const currentProduct = await productsCol.findOne({
      _id: new ObjectId(productId),
    });

    // Convert price and quantity to numbers if provided
    if (updateData.price !== undefined) {
      updateData.price = Number(updateData.price);

      // Track price history if price changed
      if (currentProduct && currentProduct.price !== updateData.price) {
        const priceHistoryEntry: Omit<PriceHistory, "_id"> = {
          productId: productId,
          productName: currentProduct.name,
          oldPrice: currentProduct.price,
          newPrice: updateData.price,
          changeReason: updateData.changeReason || "Manual update",
          effectiveDate: new Date(),
          createdAt: new Date(),
        };

        await priceHistoryCol.insertOne(priceHistoryEntry);
      }
    }

    if (updateData.quantity !== undefined) {
      updateData.quantity = Number(updateData.quantity);
    }
    if (updateData.stockQuantity !== undefined) {
      updateData.stockQuantity = Number(updateData.stockQuantity);
    }

    // Remove changeReason from updateData as it's not part of product schema
    delete updateData.changeReason;

    updateData.updatedAt = new Date();

    await productsCol.updateOne(
      { _id: new ObjectId(productId) },
      { $set: updateData }
    );

    return NextResponse.json({ success: true });
  } catch (error) {
    const errorMsg = error instanceof Error ? error.message : String(error);
    console.error("Products PUT error:", errorMsg);
    return NextResponse.json(
      { success: false, error: "Failed to update product" },
      { status: 500 }
    );
  }
}

export async function DELETE(req: NextRequest) {
  await connectDB();

  try {
    const { productId } = await req.json();

    if (!productId) {
      return NextResponse.json(
        { success: false, error: "Product ID is required" },
        { status: 400 }
      );
    }

    const productsCol = getProductsCollection();

    // Soft delete - just set isActive to false
    await productsCol.updateOne(
      { _id: new ObjectId(productId) },
      {
        $set: {
          isActive: false,
          updatedAt: new Date(),
        },
      }
    );

    return NextResponse.json({ success: true });
  } catch (error) {
    const errorMsg = error instanceof Error ? error.message : String(error);
    console.error("Products DELETE error:", errorMsg);
    return NextResponse.json(
      { success: false, error: "Failed to delete product" },
      { status: 500 }
    );
  }
}
