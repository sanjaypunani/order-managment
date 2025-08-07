"use client";
import { useState, useEffect } from "react";

export function useAnalytics() {
  const [orderList, setOrderList] = useState<any[]>([]);
  const [filterDeliveryDate, setFilterDeliveryDate] = useState<string>("");
  const [filterSocityName, setFilterSocityName] = useState<string>("");
  const [discountFilter, setDiscountFilter] = useState<string>("");
  const [loading, setLoading] = useState(true);

  // Fetch orders from API
  const fetchOrders = async () => {
    try {
      setLoading(true);
      const response = await fetch("/api/orders");
      if (response.ok) {
        const data = await response.json();
        setOrderList(data);
      }
    } catch (error) {
      console.error("Error fetching orders:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchOrders();
  }, []);

  // Filter orders based on delivery date and society name
  const filteredOrders = orderList.filter((order: any) => {
    const matchesDeliveryDate = !filterDeliveryDate || 
      (order.deliveryDate && order.deliveryDate.includes(filterDeliveryDate));
    const matchesSocityName = !filterSocityName || 
      order.socityName === filterSocityName;
    return matchesDeliveryDate && matchesSocityName;
  });

  // Apply discount filter to filteredOrders
  const filteredByDiscount = filteredOrders.filter((order: any) => {
    if (discountFilter === "applied") return (order.discount || 0) > 0;
    if (discountFilter === "not-applied") return (order.discount || 0) === 0;
    return true;
  });

  // Calculate analytics data
  const totalOrders = orderList.length;
  const totalAmountWithoutDiscount = filteredByDiscount.reduce(
    (sum: number, order: any) => sum + (order.totalAmount || 0),
    0
  );
  const totalAmountWithDiscount = filteredByDiscount.reduce(
    (sum: number, order: any) => sum + (order.finalAmount || 0),
    0
  );

  // Aggregate items ordered from filteredOrders
  const itemMap: Record<
    string,
    { quantity: number; unit: string; amount: number }
  > = {};
  filteredByDiscount.forEach((order: any) => {
    order.items.forEach((item: any) => {
      const key = item.name + "-" + (item.unit || "GM");
      if (!itemMap[key]) {
        itemMap[key] = { quantity: 0, unit: item.unit || "GM", amount: 0 };
      }
      itemMap[key].quantity += Number(item.quantity);
      itemMap[key].amount += Number(item.price);
    });
  });
  const orderedItems = Object.entries(itemMap);

  // Group items by name, quantity, and unit, count packages
  const itemPackageCount: Record<
    string,
    { name: string; quantity: number; unit: string; count: number }
  > = {};
  filteredByDiscount.forEach((order: any) => {
    order.items.forEach((item: any) => {
      const key = `${item.name}-${item.quantity}-${item.unit || "GM"}`;
      if (!itemPackageCount[key]) {
        itemPackageCount[key] = {
          name: item.name,
          quantity: Number(item.quantity),
          unit: item.unit || "GM",
          count: 0,
        };
      }
      itemPackageCount[key].count += 1;
    });
  });
  const groupedPackages = Object.values(itemPackageCount);

  // Group flat numbers by society name and sort flats ascending
  const flatsBySocity: Record<string, string[]> = {};
  filteredByDiscount.forEach((order: any) => {
    if (!flatsBySocity[order.socityName]) {
      flatsBySocity[order.socityName] = [];
    }
    if (
      order.flatNumber &&
      !flatsBySocity[order.socityName].includes(order.flatNumber)
    ) {
      flatsBySocity[order.socityName].push(order.flatNumber);
    }
  });
  
  // Sort flats for each society
  Object.keys(flatsBySocity).forEach((socity) => {
    flatsBySocity[socity].sort((a, b) => {
      const normalize = (str: string) =>
        str.replace(/[\s-]/g, "").toUpperCase();
      return normalize(a).localeCompare(normalize(b), undefined, {
        numeric: true,
        sensitivity: "base",
      });
    });
  });

  return {
    orderList,
    loading,
    filterDeliveryDate,
    setFilterDeliveryDate,
    filterSocityName,
    setFilterSocityName,
    discountFilter,
    setDiscountFilter,
    filteredOrders,
    filteredByDiscount,
    totalOrders,
    totalAmountWithoutDiscount,
    totalAmountWithDiscount,
    orderedItems,
    groupedPackages,
    flatsBySocity,
    refetch: fetchOrders,
  };
}
