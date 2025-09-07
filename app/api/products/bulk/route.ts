export const runtime = "nodejs";

import { NextRequest, NextResponse } from "next/server";
import { connectDB } from "@/lib/db";
import { getProductsCollection } from "@/lib/models";
import { ObjectId } from "mongodb";

export async function PUT(req: NextRequest) {
  await connectDB();

  try {
    const body = await req.json();
    const { productIds, action, value } = body;

    if (!productIds || !Array.isArray(productIds) || productIds.length === 0) {
      return NextResponse.json(
        { success: false, error: "Product IDs are required" },
        { status: 400 }
      );
    }

    const productsCol = getProductsCollection();
    const objectIds = productIds.map((id: string) => new ObjectId(id));

    let updateData: any = {
      updatedAt: new Date(),
    };

    switch (action) {
      case "activate":
        updateData.isActive = true;
        break;

      case "deactivate":
        updateData.isActive = false;
        break;

      case "available":
        updateData.isAvailable = true;
        break;

      case "unavailable":
        updateData.isAvailable = false;
        break;

      case "category":
        if (!value) {
          return NextResponse.json(
            { success: false, error: "Category value is required" },
            { status: 400 }
          );
        }
        updateData.category = value;
        break;

      case "price":
        if (!value || typeof value !== "object") {
          return NextResponse.json(
            { success: false, error: "Price value object is required" },
            { status: 400 }
          );
        }

        const { action: priceAction, value: priceValue } = value;

        if (priceAction === "set") {
          updateData.price = Number(priceValue);
        } else if (priceAction === "increase") {
          // For increase/decrease, we need to fetch current prices and update individually
          const products = await productsCol
            .find({
              _id: { $in: objectIds },
            })
            .toArray();

          const bulkOps = products.map((product) => ({
            updateOne: {
              filter: { _id: product._id },
              update: {
                $set: {
                  price:
                    priceAction === "increase"
                      ? product.price + Number(priceValue)
                      : Math.max(0, product.price - Number(priceValue)),
                  updatedAt: new Date(),
                },
              },
            },
          }));

          await productsCol.bulkWrite(bulkOps);

          return NextResponse.json({
            success: true,
            message: `Updated ${products.length} products`,
          });
        }
        break;

      default:
        return NextResponse.json(
          { success: false, error: "Invalid action" },
          { status: 400 }
        );
    }

    // For simple updates (not price increase/decrease)
    const result = await productsCol.updateMany(
      { _id: { $in: objectIds } },
      { $set: updateData }
    );

    return NextResponse.json({
      success: true,
      message: `Updated ${result.modifiedCount} products`,
    });
  } catch (error) {
    const errorMsg = error instanceof Error ? error.message : String(error);
    console.error("Bulk update error:", errorMsg);
    return NextResponse.json(
      { success: false, error: "Failed to update products" },
      { status: 500 }
    );
  }
}
