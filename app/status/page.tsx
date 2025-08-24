"use client";

import { useState, useEffect } from "react";
import Link from "next/link";

interface SystemStatus {
  productsCount: number;
  categoriesCount: number;
  ordersCount: number;
  customersCount: number;
  lowStockCount: number;
  migrationComplete: boolean;
}

export default function SystemStatusPage() {
  const [status, setStatus] = useState<SystemStatus | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchSystemStatus();
  }, []);

  const fetchSystemStatus = async () => {
    try {
      const [
        productsResponse,
        categoriesResponse,
        ordersResponse,
        customersResponse,
      ] = await Promise.all([
        fetch("/api/products?limit=1"),
        fetch("/api/products/categories"),
        fetch("/api/orders"),
        fetch("/api/customers"),
      ]);

      const [productsData, categoriesData, ordersData, customersData] =
        await Promise.all([
          productsResponse.json(),
          categoriesResponse.json(),
          ordersResponse.json(),
          customersResponse.json(),
        ]);

      // Get all products to check low stock
      const allProductsResponse = await fetch("/api/products?limit=1000");
      const allProductsData = await allProductsResponse.json();
      const lowStockCount =
        allProductsData.products?.filter(
          (p: any) => (p.stockQuantity || 0) < 100
        ).length || 0;

      setStatus({
        productsCount: productsData.total || 0,
        categoriesCount: categoriesData.categories?.length || 0,
        ordersCount: ordersData.orders?.length || 0,
        customersCount: customersData.data?.length || 0,
        lowStockCount,
        migrationComplete: (productsData.total || 0) > 0,
      });
    } catch (error) {
      console.error("Error fetching system status:", error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="container mx-auto p-6">
        <div className="flex items-center justify-center min-h-64">
          <div className="text-lg">Loading system status...</div>
        </div>
      </div>
    );
  }

  if (!status) {
    return (
      <div className="container mx-auto p-6">
        <div className="text-center text-red-600">
          Failed to load system status
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-6">
      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-2">System Status Dashboard</h1>
        <p className="text-gray-600">
          Overview of Shree Hari Mart Order Management System
        </p>
      </div>

      {/* Migration Status */}
      <div
        className={`mb-8 p-6 rounded-lg border-2 ${
          status.migrationComplete
            ? "bg-green-50 border-green-200"
            : "bg-yellow-50 border-yellow-200"
        }`}
      >
        <div className="flex items-center mb-4">
          <span className="text-2xl mr-3">
            {status.migrationComplete ? "✅" : "⚠️"}
          </span>
          <h2 className="text-xl font-semibold">Product Migration Status</h2>
        </div>
        <p
          className={`text-lg ${
            status.migrationComplete ? "text-green-800" : "text-yellow-800"
          }`}
        >
          {status.migrationComplete
            ? "Products have been successfully migrated from static constants to database!"
            : "Product migration is pending. Please run the migration script."}
        </p>
        {!status.migrationComplete && (
          <div className="mt-4 p-4 bg-white rounded border">
            <h3 className="font-semibold mb-2">To complete migration:</h3>
            <code className="bg-gray-100 p-2 rounded block">
              npx tsx scripts/migrateProducts.ts
            </code>
          </div>
        )}
      </div>

      {/* System Overview */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <div className="bg-blue-50 p-6 rounded-lg border border-blue-200">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-lg font-semibold text-blue-800">Products</h3>
              <p className="text-3xl font-bold text-blue-600">
                {status.productsCount}
              </p>
            </div>
            <div className="text-blue-400 text-3xl">📦</div>
          </div>
          <Link
            href="/products"
            className="text-blue-600 hover:underline text-sm"
          >
            Manage Products →
          </Link>
        </div>

        <div className="bg-purple-50 p-6 rounded-lg border border-purple-200">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-lg font-semibold text-purple-800">
                Categories
              </h3>
              <p className="text-3xl font-bold text-purple-600">
                {status.categoriesCount}
              </p>
            </div>
            <div className="text-purple-400 text-3xl">🏷️</div>
          </div>
          <Link
            href="/products/categories"
            className="text-purple-600 hover:underline text-sm"
          >
            Manage Categories →
          </Link>
        </div>

        <div className="bg-green-50 p-6 rounded-lg border border-green-200">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-lg font-semibold text-green-800">Orders</h3>
              <p className="text-3xl font-bold text-green-600">
                {status.ordersCount}
              </p>
            </div>
            <div className="text-green-400 text-3xl">📋</div>
          </div>
          <Link
            href="/orders"
            className="text-green-600 hover:underline text-sm"
          >
            View Orders →
          </Link>
        </div>

        <div className="bg-yellow-50 p-6 rounded-lg border border-yellow-200">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-lg font-semibold text-yellow-800">
                Customers
              </h3>
              <p className="text-3xl font-bold text-yellow-600">
                {status.customersCount}
              </p>
            </div>
            <div className="text-yellow-400 text-3xl">👥</div>
          </div>
          <Link
            href="/customers"
            className="text-yellow-600 hover:underline text-sm"
          >
            Manage Customers →
          </Link>
        </div>
      </div>

      {/* Alerts */}
      {status.lowStockCount > 0 && (
        <div className="bg-orange-50 p-6 rounded-lg border border-orange-200 mb-8">
          <div className="flex items-center mb-4">
            <span className="text-orange-400 text-2xl mr-3">⚠️</span>
            <h2 className="text-xl font-semibold text-orange-800">
              Inventory Alerts
            </h2>
          </div>
          <p className="text-orange-800 mb-4">
            <span className="font-bold text-2xl">{status.lowStockCount}</span>{" "}
            products have low stock levels (below 100 units)
          </p>
          <Link
            href="/products"
            className="bg-orange-500 text-white px-4 py-2 rounded hover:bg-orange-600 inline-block"
          >
            Review Low Stock Items
          </Link>
        </div>
      )}

      {/* Features Overview */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <div className="bg-white p-6 rounded-lg border">
          <h3 className="text-xl font-semibold mb-4">
            ✨ Product Management Features
          </h3>
          <ul className="space-y-2 text-gray-700">
            <li>✅ Dynamic product catalog with database storage</li>
            <li>✅ Category management system</li>
            <li>✅ Bulk operations (update, delete, import/export)</li>
            <li>✅ Price history tracking</li>
            <li>✅ Stock quantity management</li>
            <li>✅ Product availability controls</li>
            <li>✅ CSV import/export functionality</li>
            <li>✅ Advanced filtering and search</li>
          </ul>
        </div>

        <div className="bg-white p-6 rounded-lg border">
          <h3 className="text-xl font-semibold mb-4">
            📊 Analytics & Insights
          </h3>
          <ul className="space-y-2 text-gray-700">
            <li>✅ Product popularity tracking</li>
            <li>✅ Revenue analytics by product</li>
            <li>✅ Low-performing product identification</li>
            <li>✅ Order frequency analysis</li>
            <li>✅ Inventory level monitoring</li>
            <li>✅ Real-time dashboard updates</li>
            <li>✅ Historical data preservation</li>
            <li>✅ Customer order patterns</li>
          </ul>
        </div>
      </div>

      {/* Quick Actions */}
      <div className="mt-8 bg-gray-50 p-6 rounded-lg border">
        <h3 className="text-xl font-semibold mb-4">🚀 Quick Actions</h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Link
            href="/dashboard"
            className="bg-blue-500 text-white p-4 rounded text-center hover:bg-blue-600 transition-colors"
          >
            <div className="text-2xl mb-2">📊</div>
            <div className="font-semibold">View Analytics</div>
          </Link>
          <Link
            href="/products"
            className="bg-green-500 text-white p-4 rounded text-center hover:bg-green-600 transition-colors"
          >
            <div className="text-2xl mb-2">📦</div>
            <div className="font-semibold">Manage Products</div>
          </Link>
          <Link
            href="/orders"
            className="bg-purple-500 text-white p-4 rounded text-center hover:bg-purple-600 transition-colors"
          >
            <div className="text-2xl mb-2">📋</div>
            <div className="font-semibold">Process Orders</div>
          </Link>
        </div>
      </div>
    </div>
  );
}
