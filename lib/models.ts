import { getDB } from "./db";

export function getOrdersCollection() {
  return getDB().collection("orders");
}

export function getOrderItemsCollection() {
  return getDB().collection("order_items");
}
