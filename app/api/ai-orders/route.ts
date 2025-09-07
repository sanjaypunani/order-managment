import { NextRequest, NextResponse } from "next/server";
import { connectDB } from "../../../lib/db";
import { AIOrder, AIOrderFilters } from "../../../lib/types/aiOrder";

export async function GET(request: NextRequest) {
  try {
    const db = await connectDB();
    const aiOrdersCollection = db.collection("aiorders");

    // Get query parameters for filtering
    const searchParams = request.nextUrl.searchParams;
    const verification_status = searchParams.get("verification_status");
    const customer_id = searchParams.get("customer_id");
    const page = parseInt(searchParams.get("page") || "1");
    const limit = parseInt(searchParams.get("limit") || "10");

    // Build filter object
    const filter: any = {};

    if (verification_status && verification_status !== "all") {
      filter.verification_status = verification_status;
    }

    if (customer_id) {
      filter.customer_id = customer_id;
    }

    // Calculate pagination
    const skip = (page - 1) * limit;

    // Get total count for pagination
    const totalCount = await aiOrdersCollection.countDocuments(filter);

    // Fetch orders with pagination and sorting
    const orders = await aiOrdersCollection
      .find(filter)
      .sort({ order_date: -1, last_updated: -1 })
      .skip(skip)
      .limit(limit)
      .toArray();

    // Calculate pagination info
    const totalPages = Math.ceil(totalCount / limit);
    const hasMore = page < totalPages;

    return NextResponse.json({
      orders,
      totalCount,
      currentPage: page,
      totalPages,
      hasMore,
    });
  } catch (error) {
    console.error("Error fetching AI orders:", error);
    return NextResponse.json(
      { error: "Failed to fetch AI orders" },
      { status: 500 }
    );
  }
}
