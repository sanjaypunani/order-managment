import { MongoClient } from "mongodb";

const uri = process.env.MONGODB_URI || "mongodb://localhost:27017";
const dbName = process.env.DB_NAME || "order_management";

let client: MongoClient;
let db: any;

export async function connectDB() {
  if (!client) {
    client = new MongoClient(uri);
    await client.connect();
    db = client.db(dbName);
    console.log("MongoDB connected");
  }
  return db;
}

export function getDB() {
  return db;
}
