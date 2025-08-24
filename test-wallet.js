#!/usr/bin/env node

/**
 * Simple Node.js test script for wallet functionality
 * This script tests the wallet APIs directly
 */

const BASE_URL = "http://localhost:3001";

async function testWalletFunctionality() {
  console.log("🧪 Testing Wallet Functionality\n");

  try {
    // Test 1: Get customers
    console.log("1. Testing customers API...");
    const response = await fetch(`${BASE_URL}/api/customers`);
    const data = await response.json();

    if (data.success && data.data && data.data.length > 0) {
      console.log(`✅ Found ${data.data.length} customers`);

      // Show wallet balances
      data.data.forEach((customer, index) => {
        console.log(
          `   ${index + 1}. ${customer.customerName || "Unnamed"} - Wallet: ₹${
            customer.walletBalance || 0
          }`
        );
      });

      // Test wallet operations on first customer
      const testCustomer = data.data[0];
      console.log(
        `\n2. Testing wallet operations for: ${
          testCustomer.customerName || "Unnamed"
        }`
      );

      // Test add funds
      console.log("   Adding ₹100 to wallet...");
      const addResponse = await fetch(`${BASE_URL}/api/customers/wallet/add`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          customerId: testCustomer._id,
          amount: 100,
          note: "Test funds addition",
        }),
      });

      const addResult = await addResponse.json();
      if (addResult.success) {
        console.log(`   ✅ Added funds. New balance: ₹${addResult.newBalance}`);
      } else {
        console.log(`   ❌ Failed to add funds: ${addResult.error}`);
      }

      // Test wallet transactions
      console.log("\n3. Testing wallet transactions API...");
      const walletResponse = await fetch(
        `${BASE_URL}/api/customers/wallet?customerId=${testCustomer._id}`
      );
      const walletData = await walletResponse.json();

      if (walletData.success) {
        console.log(`   ✅ Current balance: ₹${walletData.data.balance}`);
        console.log(
          `   ✅ Transaction count: ${walletData.data.transactions.length}`
        );

        if (walletData.data.transactions.length > 0) {
          console.log("   Recent transactions:");
          walletData.data.transactions.slice(0, 3).forEach((tx, i) => {
            console.log(
              `     ${i + 1}. ${tx.type.toUpperCase()}: ₹${tx.amount} - ${
                tx.note
              }`
            );
          });
        }
      } else {
        console.log(`   ❌ Failed to get wallet data: ${walletData.error}`);
      }
    } else {
      console.log("❌ No customers found or API error");
      console.log("Response:", data);
    }

    console.log("\n🎉 Wallet functionality test completed!");
  } catch (error) {
    console.error("❌ Test failed:", error.message);
  }
}

// Run the test
testWalletFunctionality();
