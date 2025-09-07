// Application constants
export const SOCIETIES = [
  "The Vienza",
  "Tulshi Heights",
  "Shivalik Heights",
  "Aashiana Upvan",
  "Other",
];

export const UNITS = [
  { value: "GM", label: "Grams (GM)" },
  { value: "KG", label: "Kilograms (KG)" },
  { value: "ML", label: "Milliliters (ML)" },
  { value: "L", label: "Liters (L)" },
  { value: "PCS", label: "Pieces (PCS)" },
  { value: "PKT", label: "Packet (PKT)" },
];

export const ORDER_STATUSES = [
  { value: "Pending", label: "Pending" },
  { value: "Delivered", label: "Delivered" },
];

export const DISCOUNT_FILTERS = [
  { value: "", label: "All" },
  { value: "applied", label: "Discount Applied" },
  { value: "not-applied", label: "No Discount" },
];

export const API_ENDPOINTS = {
  ORDERS: "/api/orders",
  CUSTOMERS: "/api/customers",
  PRODUCTS: "/api/products",
  CUSTOMER_ORDERS: "/api/customers/orders",
} as const;

export const VALIDATION_RULES = {
  MOBILE_NUMBER: {
    MIN_LENGTH: 10,
    MAX_LENGTH: 10,
    PATTERN: /^[0-9]{10}$/,
  },
  CUSTOMER_NAME: {
    MIN_LENGTH: 2,
    MAX_LENGTH: 50,
  },
  FLAT_NUMBER: {
    MIN_LENGTH: 1,
    MAX_LENGTH: 10,
  },
} as const;
