"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import type {
  Product,
  ProductCategory,
  ProductFilterParams,
} from "@/lib/types/product";
import AddProductModal from "./components/AddProductModal";
import EditProductModal from "./components/EditProductModal";
import BulkActions from "./components/BulkActions";
import ImportExport from "./components/ImportExport";
import {
  DataTable,
  TableColumn,
  TableAction,
  StatusBadge,
  CurrencyCell,
} from "../components/DataTable";

interface ProductsResponse {
  success: boolean;
  products: Product[];
  total: number;
  page: number;
  totalPages: number;
}

export default function ProductsPage() {
  const [products, setProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<ProductCategory[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAddModal, setShowAddModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [selectedProducts, setSelectedProducts] = useState<string[]>([]);
  const [filters, setFilters] = useState<ProductFilterParams>({
    page: 1,
    limit: 20,
  });
  const [total, setTotal] = useState(0);
  const [totalPages, setTotalPages] = useState(0);

  // Fetch products
  const fetchProducts = async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams();

      Object.entries(filters).forEach(([key, value]) => {
        if (value !== undefined && value !== null && value !== "") {
          params.set(key, value.toString());
        }
      });

      const response = await fetch(`/api/products?${params.toString()}`);
      const data: ProductsResponse = await response.json();

      if (data.success) {
        setProducts(data.products);
        setTotal(data.total);
        setTotalPages(data.totalPages);
      }
    } catch (error) {
      console.error("Failed to fetch products:", error);
    } finally {
      setLoading(false);
    }
  };

  // Fetch categories
  const fetchCategories = async () => {
    try {
      const response = await fetch("/api/products/categories");
      const data = await response.json();

      if (data.success) {
        setCategories(data.categories);
      }
    } catch (error) {
      console.error("Failed to fetch categories:", error);
    }
  };

  useEffect(() => {
    fetchProducts();
    fetchCategories();
  }, []);

  useEffect(() => {
    fetchProducts();
  }, [filters]);

  const handleFilterChange = (key: keyof ProductFilterParams, value: any) => {
    setFilters((prev) => ({
      ...prev,
      [key]: value,
      page: key !== "page" ? 1 : value, // Reset to page 1 when changing filters
    }));
  };

  const toggleProductStatus = async (productId: string, isActive: boolean) => {
    try {
      const response = await fetch("/api/products", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ productId, isActive: !isActive }),
      });

      if (response.ok) {
        fetchProducts();
      }
    } catch (error) {
      console.error("Failed to update product:", error);
    }
  };

  const handleEditProduct = (product: Product) => {
    setEditingProduct(product);
    setShowEditModal(true);
  };

  const handleCloseModals = () => {
    setShowAddModal(false);
    setShowEditModal(false);
    setEditingProduct(null);
  };

  const handleSelectProduct = (productId: string) => {
    setSelectedProducts((prev) =>
      prev.includes(productId)
        ? prev.filter((id) => id !== productId)
        : [...prev, productId]
    );
  };

  const handleSelectAll = () => {
    if (selectedProducts.length === products.length) {
      setSelectedProducts([]);
    } else {
      setSelectedProducts(products.map((p) => p._id!));
    }
  };

  const handleBulkUpdate = async (action: string, value?: any) => {
    try {
      const response = await fetch("/api/products/bulk", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          productIds: selectedProducts,
          action,
          value,
        }),
      });

      const result = await response.json();

      if (result.success) {
        fetchProducts();
        setSelectedProducts([]);
        alert(result.message || "Products updated successfully");
      } else {
        alert(result.error || "Failed to update products");
      }
    } catch (error) {
      console.error("Failed to bulk update:", error);
      alert("Failed to update products");
    }
  };

  // Define table columns for products
  const productColumns: TableColumn[] = [
    {
      key: "name",
      label: "Product",
      render: (_, product) => (
        <div>
          <div className="text-sm font-medium text-gray-900">
            {product.name}
          </div>
          <div className="text-sm text-gray-500">{product.nameEnglish}</div>
        </div>
      ),
    },
    {
      key: "price",
      label: "Price",
      render: (price) => <CurrencyCell amount={price} />,
    },
    {
      key: "unit",
      label: "Unit",
    },
    {
      key: "category",
      label: "Category",
    },
    {
      key: "isActive",
      label: "Status",
      render: (isActive) => (
        <StatusBadge
          status={isActive ? "Active" : "Inactive"}
          variant={isActive ? "success" : "danger"}
        />
      ),
    },
  ];

  // Define table actions for products
  const productActions: TableAction[] = [
    {
      label: "Toggle Status",
      variant: "secondary",
      onClick: (product: any) =>
        toggleProductStatus(product._id!, product.isActive),
    },
    {
      label: "Edit",
      variant: "primary",
      onClick: (product: any) => handleEditProduct(product),
    },
  ];

  return (
    <div className="container mx-auto p-6">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold">Product Management</h1>
        <div className="flex space-x-3">
          <Link
            href="/products/categories"
            className="bg-gray-500 text-white px-4 py-2 rounded hover:bg-gray-600"
          >
            Manage Categories
          </Link>
          <button
            onClick={() => setShowAddModal(true)}
            className="bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600"
          >
            Add New Product
          </button>
        </div>
      </div>

      {/* Inventory Warnings */}
      {products.filter((p) => (p.stockQuantity || 0) < 100).length > 0 && (
        <div className="mb-6 p-4 bg-orange-50 border border-orange-200 rounded-lg">
          <h3 className="text-lg font-semibold text-orange-800 mb-2">
            ⚠️ Low Stock Alerts
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-2">
            {products
              .filter((p) => (p.stockQuantity || 0) < 100)
              .slice(0, 6)
              .map((product) => (
                <div
                  key={product._id}
                  className="flex justify-between items-center bg-white p-2 rounded border"
                >
                  <span className="font-medium text-sm">{product.name}</span>
                  <span
                    className={`text-sm font-bold ${
                      (product.stockQuantity || 0) < 50
                        ? "text-red-600"
                        : "text-orange-600"
                    }`}
                  >
                    {product.stockQuantity || 0} {product.unit}
                  </span>
                </div>
              ))}
          </div>
          {products.filter((p) => (p.stockQuantity || 0) < 100).length > 6 && (
            <p className="text-sm text-orange-700 mt-2">
              And{" "}
              {products.filter((p) => (p.stockQuantity || 0) < 100).length - 6}{" "}
              more products with low stock...
            </p>
          )}
        </div>
      )}

      {/* Import/Export Section */}
      <div className="bg-white p-4 rounded-lg shadow mb-6">
        <h2 className="text-lg font-semibold mb-4">Import/Export</h2>
        <ImportExport onImportComplete={fetchProducts} />
      </div>

      {/* Filters */}
      <div className="bg-white p-4 rounded-lg shadow mb-6">
        <h2 className="text-lg font-semibold mb-4">Filters</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {/* Search */}
          <div>
            <label className="block text-sm font-medium mb-1">Search</label>
            <input
              type="text"
              placeholder="Search products..."
              className="w-full p-2 border rounded"
              value={filters.search || ""}
              onChange={(e) => handleFilterChange("search", e.target.value)}
            />
          </div>

          {/* Category */}
          <div>
            <label className="block text-sm font-medium mb-1">Category</label>
            <select
              className="w-full p-2 border rounded"
              value={filters.category || ""}
              onChange={(e) => handleFilterChange("category", e.target.value)}
            >
              <option value="">All Categories</option>
              {categories.map((category) => (
                <option key={category._id} value={category.name}>
                  {category.nameEnglish}
                </option>
              ))}
            </select>
          </div>

          {/* Status */}
          <div>
            <label className="block text-sm font-medium mb-1">Status</label>
            <select
              className="w-full p-2 border rounded"
              value={filters.isActive?.toString() || ""}
              onChange={(e) =>
                handleFilterChange(
                  "isActive",
                  e.target.value === "" ? undefined : e.target.value === "true"
                )
              }
            >
              <option value="">All</option>
              <option value="true">Active</option>
              <option value="false">Inactive</option>
            </select>
          </div>

          {/* Unit */}
          <div>
            <label className="block text-sm font-medium mb-1">Unit</label>
            <select
              className="w-full p-2 border rounded"
              value={filters.unit || ""}
              onChange={(e) => handleFilterChange("unit", e.target.value)}
            >
              <option value="">All Units</option>
              <option value="KG">Kilogram</option>
              <option value="GM">Gram</option>
              <option value="PCS">Pieces</option>
            </select>
          </div>
        </div>
      </div>

      {/* Bulk Actions */}
      <BulkActions
        selectedProducts={selectedProducts}
        onBulkUpdate={handleBulkUpdate}
        onClearSelection={() => setSelectedProducts([])}
      />

      {/* Products Table */}
      <DataTable
        data={products}
        columns={productColumns}
        actions={productActions}
        loading={loading}
        title={`Products (${total} total)`}
        emptyMessage="No products found"
        selectable={true}
        selectedItems={selectedProducts}
        onSelectionChange={setSelectedProducts}
        getRowId={(product) => product._id!}
      />

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="bg-white rounded-lg shadow mt-4">
          <div className="px-6 py-3 border-t flex items-center justify-between">
            <div className="text-sm text-gray-700">
              Showing page {filters.page} of {totalPages}
            </div>
            <div className="flex space-x-2">
              <button
                disabled={filters.page === 1}
                onClick={() => handleFilterChange("page", filters.page! - 1)}
                className="px-3 py-1 border rounded disabled:opacity-50"
              >
                Previous
              </button>
              <button
                disabled={filters.page === totalPages}
                onClick={() => handleFilterChange("page", filters.page! + 1)}
                className="px-3 py-1 border rounded disabled:opacity-50"
              >
                Next
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modals */}
      <AddProductModal
        isOpen={showAddModal}
        onClose={handleCloseModals}
        onProductAdded={fetchProducts}
      />

      <EditProductModal
        isOpen={showEditModal}
        product={editingProduct}
        onClose={handleCloseModals}
        onProductUpdated={fetchProducts}
      />
    </div>
  );
}
