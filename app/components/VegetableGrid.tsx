import React, { useState } from "react";

interface Product {
  name: string;
  price: number;
  unit: string;
  quantity: number;
  nameGujarati?: string;
  nameEnglish?: string;
  category?: string;
}

interface OrderItem {
  name: string;
  quantity: number | string;
  unit: string;
  price: number | string;
}

interface VegetableGridProps {
  products: Product[];
  productsLoading: boolean;
  productsError: string | null;
  onAddToOrder: (
    product: Product,
    customQuantity?: number,
    customUnit?: string
  ) => void;
  onUpdateFromGrid?: (
    productName: string,
    newQuantity: number,
    newUnit: string,
    originalProduct: Product
  ) => void;
  addedItems: OrderItem[];
  disabled?: boolean;
}

export default function VegetableGrid({
  products,
  productsLoading,
  productsError,
  onAddToOrder,
  onUpdateFromGrid,
  addedItems,
  disabled = false,
}: VegetableGridProps) {
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("All Categories");

  // Get unique categories
  const categories = [
    "All Categories",
    ...new Set(products.map((p) => p.category || "Other")),
  ];

  // Filter products
  const filteredProducts = products.filter((product) => {
    const matchesSearch =
      product.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      product.nameGujarati?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      product.nameEnglish?.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCategory =
      selectedCategory === "All Categories" ||
      product.category === selectedCategory;
    return matchesSearch && matchesCategory;
  });

  // Check if product is already added
  const isProductAdded = (productName: string) => {
    return addedItems.some((item) => item.name && item.name === productName);
  };

  // Get the current order item for a product
  const getOrderItem = (productName: string) => {
    return addedItems.find((item) => item.name && item.name === productName);
  };

  // Quick add options
  const quickAddOptions = [
    { label: "100gm", quantity: 100, unit: "GM" },
    { label: "150gm", quantity: 150, unit: "GM" },
    { label: "250gm", quantity: 250, unit: "GM" },
    { label: "500gm", quantity: 500, unit: "GM" },
    { label: "1kg", quantity: 1, unit: "KG" },
    { label: "2kg", quantity: 2, unit: "KG" },
  ];

  const handleQuickAdd = (product: Product, quantity: number, unit: string) => {
    onAddToOrder(product, quantity, unit);
  };

  const getProductImage = (productName: string) => {
    // Simple mapping for common vegetables - in production, you'd have actual images
    const imageMap: { [key: string]: string } = {
      Tomatoes: "🍅",
      Carrots: "🥕",
      Basil: "🌿",
      "Bell Peppers": "🫑",
      Broccoli: "🥦",
      Onions: "🧅",
      Potatoes: "🥔",
      Spinach: "🥬",
      Lettuce: "🥬",
      Garlic: "🧄",
    };
    return imageMap[productName] || "🥬";
  };

  if (productsLoading) {
    return (
      <div className="text-center py-8">
        <div className="animate-spin h-8 w-8 border-4 border-green-600 border-t-transparent rounded-full mx-auto mb-4"></div>
        <p className="text-gray-600">Loading vegetables...</p>
      </div>
    );
  }

  if (productsError) {
    return (
      <div className="text-center py-8">
        <p className="text-red-600 mb-4">
          Error loading vegetables: {productsError}
        </p>
        <button
          onClick={() => window.location.reload()}
          className="text-blue-600 hover:underline"
        >
          Try Again
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Search and Filter */}
      <div className="flex space-x-4 mb-4">
        <input
          type="text"
          placeholder="Search vegetables..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
        />
        <select
          value={selectedCategory}
          onChange={(e) => setSelectedCategory(e.target.value)}
          className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
        >
          {categories.map((category) => (
            <option key={category} value={category}>
              {category}
            </option>
          ))}
        </select>
      </div>

      {/* No items message */}
      {addedItems.filter((item) => item.name).length === 0 && (
        <div className="text-center py-6 bg-gray-50 rounded-lg border-2 border-dashed border-gray-300">
          <p className="text-gray-500 mb-2">No items added yet</p>
          <p className="text-sm text-gray-400">
            Click on vegetables below to add them to your order
          </p>
        </div>
      )}

      {/* Products Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {filteredProducts.map((product, index) => {
          const isAdded = isProductAdded(product.name);
          const orderItem = getOrderItem(product.name);

          return (
            <div
              key={index}
              className={`border rounded-lg p-4 transition-all ${
                isAdded
                  ? "border-green-500 bg-green-50"
                  : "border-gray-200 bg-white hover:border-green-300 hover:shadow-md"
              } ${disabled ? "opacity-50 cursor-not-allowed" : ""}`}
            >
              {/* Top Row: Image, Name, and Price */}
              <div className="flex items-center space-x-3 mb-3">
                {/* Small Vegetable Image/Icon */}
                <div className="text-2xl flex-shrink-0">
                  {getProductImage(product.name)}
                </div>

                {/* Name and Price */}
                <div className="flex-1 min-w-0">
                  <h3 className="font-semibold text-sm text-gray-900 truncate">
                    {product.name}
                  </h3>
                  <div className="flex items-center justify-between">
                    <span className="text-green-600 font-bold text-sm">
                      ₹{product.price}
                    </span>
                    <span className="text-xs text-gray-500">
                      per {product.quantity} {product.unit}
                    </span>
                  </div>
                </div>
              </div>

              {/* Quick Select Options - Only show if not added */}
              {!isAdded && !disabled && (
                <div className="space-y-2">
                  {/* Quick Add Buttons */}
                  <div className="grid grid-cols-3 gap-2">
                    {quickAddOptions.map((option, optionIndex) => (
                      <button
                        key={optionIndex}
                        type="button"
                        onClick={() =>
                          handleQuickAdd(product, option.quantity, option.unit)
                        }
                        className="text-xs border border-gray-300 text-gray-700 py-2 px-2 rounded-md hover:border-green-400 hover:text-green-600 hover:bg-green-50 transition-all duration-200 font-medium flex items-center justify-center space-x-1"
                        title={`Add ${option.label} to order`}
                      >
                        <span className="text-green-500">+</span>
                        <span>{option.label}</span>
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* Edit Controls - Show if added and onUpdateFromGrid is available */}
              {isAdded && orderItem && onUpdateFromGrid && !disabled && (
                <div className="space-y-3">
                  <div className="bg-white border border-green-200 rounded-lg p-3">
                    <div className="text-xs text-green-600 font-medium mb-2 text-center">
                      ✓ In Order - Edit Below
                    </div>

                    <div className="grid grid-cols-2 gap-2">
                      {/* Quantity Input */}
                      <div>
                        <label className="block text-xs text-gray-600 mb-1">
                          Quantity
                        </label>
                        <input
                          type="number"
                          min="0.1"
                          step="0.1"
                          value={
                            typeof orderItem.quantity === "string"
                              ? parseFloat(orderItem.quantity) || 0
                              : orderItem.quantity
                          }
                          onChange={(e) => {
                            const newQuantity = parseFloat(e.target.value) || 0;
                            if (newQuantity > 0) {
                              onUpdateFromGrid(
                                product.name,
                                newQuantity,
                                orderItem.unit,
                                product
                              );
                            }
                          }}
                          className="w-full px-2 py-1 text-xs border border-gray-300 rounded focus:ring-1 focus:ring-green-500 focus:border-green-500"
                        />
                      </div>

                      {/* Unit Select */}
                      <div>
                        <label className="block text-xs text-gray-600 mb-1">
                          Unit
                        </label>
                        <select
                          value={orderItem.unit}
                          onChange={(e) => {
                            const currentQuantity =
                              typeof orderItem.quantity === "string"
                                ? parseFloat(orderItem.quantity) || 0
                                : orderItem.quantity;
                            onUpdateFromGrid(
                              product.name,
                              currentQuantity,
                              e.target.value,
                              product
                            );
                          }}
                          className="w-full px-2 py-1 text-xs border border-gray-300 rounded focus:ring-1 focus:ring-green-500 focus:border-green-500"
                        >
                          <option value="GM">GM</option>
                          <option value="KG">KG</option>
                          <option value="PCS">PCS</option>
                        </select>
                      </div>
                    </div>

                    {/* Current Price Display */}
                    <div className="mt-2 text-center">
                      <span className="text-xs text-gray-600">Total: </span>
                      <span className="text-sm font-bold text-green-600">
                        ₹
                        {typeof orderItem.price === "string"
                          ? parseFloat(orderItem.price) || 0
                          : orderItem.price}
                      </span>
                    </div>
                  </div>
                </div>
              )}

              {/* Simple Added Indicator - Show if added but no update function */}
              {isAdded && (!onUpdateFromGrid || disabled) && (
                <div className="text-center">
                  <div className="bg-gradient-to-r from-green-500 to-green-600 text-white text-sm font-medium py-2 px-3 rounded-md shadow-sm">
                    ✓ Added to Order
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>

      {filteredProducts.length === 0 && searchTerm && (
        <div className="text-center py-6">
          <p className="text-gray-500">
            No vegetables found matching &ldquo;{searchTerm}&rdquo;
          </p>
        </div>
      )}
    </div>
  );
}
