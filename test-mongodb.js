// Test MongoDB connection
require('dotenv').config({ path: '.env.local' });
const { MongoClient } = require('mongodb');

async function testConnection() {
  const uri = process.env.MONGODB_URI;
  const dbName = process.env.DB_NAME || 'order_management';
  
  if (!uri) {
    console.error('❌ MONGODB_URI environment variable is not defined');
    process.exit(1);
  }
  
  let client;
  
  try {
    console.log('Testing MongoDB connection...');
    console.log('URI:', uri.replace(/\/\/.*:.*@/, '//***:***@')); // Hide credentials in log
    
    client = new MongoClient(uri);
    await client.connect();
    console.log('✅ MongoDB connection successful!');
    
    const db = client.db(dbName);
    console.log('Database name:', db.databaseName);
    
    // Test a simple operation
    const collections = await db.listCollections().toArray();
    console.log('Available collections:', collections.map(c => c.name));
    
    // Test connectivity
    await db.admin().ping();
    console.log('✅ Database ping successful!');
    
  } catch (error) {
    console.error('❌ MongoDB connection failed:', error.message);
    process.exit(1);
  } finally {
    if (client) {
      await client.close();
      console.log('Connection closed');
    }
    process.exit(0);
  }
}

testConnection();
