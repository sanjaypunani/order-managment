import { MongoClient, Db } from "mongodb";

const uri = process.env.MONGODB_URI;
const dbName = process.env.DB_NAME || "order_management";

if (!uri) {
  throw new Error("Please define the MONGODB_URI environment variable inside .env.local");
}

let client: MongoClient;
let db: Db;

export async function connectDB(): Promise<Db> {
  if (!client) {
    if (!uri) {
      throw new Error("MONGODB_URI environment variable is not defined");
    }
    
    try {
      client = new MongoClient(uri);
      await client.connect();
      db = client.db(dbName);
      console.log("MongoDB connected successfully");
    } catch (error) {
      console.error("MongoDB connection error:", error);
      throw new Error("Failed to connect to MongoDB");
    }
  }
  return db;
}

export function getDB(): Db {
  if (!db) {
    throw new Error("Database not connected. Call connectDB() first.");
  }
  return db;
}
