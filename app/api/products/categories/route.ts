export const runtime = "nodejs";

import { NextRequest, NextResponse } from "next/server";
import { connectDB } from "@/lib/db";
import { getProductCategoriesCollection } from "@/lib/models";
import { ObjectId } from "mongodb";
import type { ProductCategory } from "@/lib/types/product";

export async function GET() {
  await connectDB();

  try {
    const categoriesCol = getProductCategoriesCollection();

    const categories = await categoriesCol
      .find({ isActive: true })
      .sort({ sortOrder: 1, name: 1 })
      .toArray();

    return NextResponse.json({
      success: true,
      categories,
    });
  } catch (error) {
    const errorMsg = error instanceof Error ? error.message : String(error);
    console.error("Categories GET error:", errorMsg);
    return NextResponse.json(
      { success: false, error: "Failed to fetch categories" },
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
      isActive = true,
      sortOrder = 0,
    } = body;

    if (!name) {
      return NextResponse.json(
        { success: false, error: "Category name is required" },
        { status: 400 }
      );
    }

    const categoriesCol = getProductCategoriesCollection();

    // Check if category already exists
    const existingCategory = await categoriesCol.findOne({ name });
    if (existingCategory) {
      return NextResponse.json(
        { success: false, error: "Category with this name already exists" },
        { status: 400 }
      );
    }

    const newCategory: Omit<ProductCategory, "_id"> = {
      name,
      nameGujarati: nameGujarati || name,
      nameEnglish: nameEnglish || name,
      isActive,
      sortOrder: Number(sortOrder),
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    const result = await categoriesCol.insertOne(newCategory);

    return NextResponse.json({
      success: true,
      categoryId: result.insertedId,
    });
  } catch (error) {
    const errorMsg = error instanceof Error ? error.message : String(error);
    console.error("Categories POST error:", errorMsg);
    return NextResponse.json(
      { success: false, error: "Failed to create category" },
      { status: 500 }
    );
  }
}

export async function PUT(req: NextRequest) {
  await connectDB();

  try {
    const body = await req.json();
    const { categoryId, ...updateData } = body;

    if (!categoryId) {
      return NextResponse.json(
        { success: false, error: "Category ID is required" },
        { status: 400 }
      );
    }

    const categoriesCol = getProductCategoriesCollection();

    if (updateData.sortOrder !== undefined) {
      updateData.sortOrder = Number(updateData.sortOrder);
    }

    updateData.updatedAt = new Date();

    await categoriesCol.updateOne(
      { _id: new ObjectId(categoryId) },
      { $set: updateData }
    );

    return NextResponse.json({ success: true });
  } catch (error) {
    const errorMsg = error instanceof Error ? error.message : String(error);
    console.error("Categories PUT error:", errorMsg);
    return NextResponse.json(
      { success: false, error: "Failed to update category" },
      { status: 500 }
    );
  }
}

export async function DELETE(req: NextRequest) {
  await connectDB();

  try {
    const { categoryId } = await req.json();

    if (!categoryId) {
      return NextResponse.json(
        { success: false, error: "Category ID is required" },
        { status: 400 }
      );
    }

    const categoriesCol = getProductCategoriesCollection();

    // Soft delete - set isActive to false
    await categoriesCol.updateOne(
      { _id: new ObjectId(categoryId) },
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
    console.error("Categories DELETE error:", errorMsg);
    return NextResponse.json(
      { success: false, error: "Failed to delete category" },
      { status: 500 }
    );
  }
}
