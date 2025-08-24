import { getDB } from "./db";

export function getOrdersCollection() {
  return getDB().collection("orders");
}

export function getOrderItemsCollection() {
  return getDB().collection("order_items");
}

export function getCustomersCollection() {
  return getDB().collection("customers");
}

export function getProductsCollection() {
  return getDB().collection("products");
}

export function getProductCategoriesCollection() {
  return getDB().collection("product_categories");
}

export function getPriceHistoryCollection() {
  return getDB().collection("price_history");
}

// ✅ New collection for wallet transactions
export function getWalletTransactionsCollection() {
  return getDB().collection("walletTransactions");
}
