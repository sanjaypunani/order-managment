import { useState, useEffect } from "react";
import type { Product } from "@/lib/types/product";

interface ProductAnalytics {
  product: Product;
  orderCount: number;
  totalQuantityOrdered: number;
  totalRevenue: number;
  averageOrderValue: number;
  lastOrderDate?: string;
}

export function useProductAnalytics() {
  const [productAnalytics, setProductAnalytics] = useState<ProductAnalytics[]>(
    []
  );
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchProductAnalytics = async () => {
    try {
      setLoading(true);
      setError(null);

      // Fetch products and orders in parallel
      const [productsResponse, ordersResponse] = await Promise.all([
        fetch("/api/products?limit=1000"),
        fetch("/api/orders"),
      ]);

      if (!productsResponse.ok || !ordersResponse.ok) {
        throw new Error("Failed to fetch data");
      }

      const productsData = await productsResponse.json();
      const ordersData = await ordersResponse.json();

      const products = productsData.products || [];
      const orders = ordersData.orders || [];

      // Calculate analytics for each product
      const analytics: ProductAnalytics[] = products.map((product: Product) => {
        const productOrders = orders.filter((order: any) =>
          order.items.some((item: any) => item.name === product.name)
        );

        const orderCount = productOrders.length;
        let totalQuantityOrdered = 0;
        let totalRevenue = 0;

        productOrders.forEach((order: any) => {
          order.items.forEach((item: any) => {
            if (item.name === product.name) {
              totalQuantityOrdered += Number(item.quantity) || 0;
              totalRevenue += Number(item.price) || 0;
            }
          });
        });

        const averageOrderValue =
          orderCount > 0 ? totalRevenue / orderCount : 0;
        const lastOrderDate =
          productOrders.length > 0
            ? productOrders.sort(
                (a: any, b: any) =>
                  new Date(b.createdAt).getTime() -
                  new Date(a.createdAt).getTime()
              )[0].createdAt
            : undefined;

        return {
          product,
          orderCount,
          totalQuantityOrdered,
          totalRevenue,
          averageOrderValue,
          lastOrderDate,
        };
      });

      // Sort by order count (most popular first)
      analytics.sort((a, b) => b.orderCount - a.orderCount);

      setProductAnalytics(analytics);
    } catch (err) {
      console.error("Error fetching product analytics:", err);
      setError("Failed to fetch product analytics");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProductAnalytics();
  }, []);

  // Helper functions to get top products
  const getTopProductsByOrders = (limit = 10) =>
    productAnalytics.slice(0, limit);

  const getTopProductsByRevenue = (limit = 10) =>
    [...productAnalytics]
      .sort((a, b) => b.totalRevenue - a.totalRevenue)
      .slice(0, limit);

  const getTopProductsByQuantity = (limit = 10) =>
    [...productAnalytics]
      .sort((a, b) => b.totalQuantityOrdered - a.totalQuantityOrdered)
      .slice(0, limit);

  const getLowPerformingProducts = (limit = 10) =>
    [...productAnalytics]
      .sort((a, b) => a.orderCount - b.orderCount)
      .slice(0, limit);

  const getRecentlyOrderedProducts = (limit = 10) =>
    [...productAnalytics]
      .filter((p) => p.lastOrderDate)
      .sort(
        (a, b) =>
          new Date(b.lastOrderDate!).getTime() -
          new Date(a.lastOrderDate!).getTime()
      )
      .slice(0, limit);

  return {
    productAnalytics,
    loading,
    error,
    refetch: fetchProductAnalytics,
    // Helper functions
    getTopProductsByOrders,
    getTopProductsByRevenue,
    getTopProductsByQuantity,
    getLowPerformingProducts,
    getRecentlyOrderedProducts,
  };
}
