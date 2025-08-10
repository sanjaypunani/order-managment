import { useState, useEffect } from "react";
import type { Product } from "@/lib/types/product";

interface ProductsResponse {
  success: boolean;
  products: Product[];
  total: number;
}

export function useProducts() {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchProducts = async () => {
    try {
      setLoading(true);
      setError(null);

      // Fetch only active and available products for orders
      const response = await fetch(
        "/api/products?isActive=true&isAvailable=true&limit=1000"
      );
      const data: ProductsResponse = await response.json();

      if (data.success) {
        setProducts(data.products);
      } else {
        setError("Failed to fetch products");
      }
    } catch (err) {
      console.error("Error fetching products:", err);
      setError("Failed to fetch products");
      setProducts([]); // Fallback to empty array
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProducts();
  }, []);

  // Convert products to ITEMS format for backward compatibility
  const items = products.map((product) => ({
    name: product.name,
    price: product.price,
    unit: product.unit,
    quantity: product.quantity,
  }));

  return {
    products,
    items, // For backward compatibility with existing code
    loading,
    error,
    refetch: fetchProducts,
  };
}
