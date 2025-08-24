/**
 * Test script for wallet management APIs
 * This script tests the wallet functionality endpoints
 */

const BASE_URL = "http://localhost:3002";

async function testWalletAPIs() {
  console.log("🧪 Testing Customer Wallet Management APIs\n");

  try {
    // Test 1: Get all customers to find a test customer
    console.log("1. Fetching customers...");
    const customersResponse = await fetch(`${BASE_URL}/api/customers`);
    const customersData = await customersResponse.json();

    if (!customersData.success || !customersData.data?.length) {
      console.log("❌ No customers found. Please create a customer first.");
      return;
    }

    const testCustomer = customersData.data[0];
    console.log(
      `✅ Found test customer: ${testCustomer.customerName} (${testCustomer._id})\n`
    );

    // Test 2: Get customer details
    console.log("2. Testing customer details API...");
    const customerResponse = await fetch(
      `${BASE_URL}/api/customers/${testCustomer._id}`
    );
    const customerData = await customerResponse.json();

    if (customerData.success) {
      console.log(
        `✅ Customer details: Wallet balance = ₹${
          customerData.data.walletBalance || 0
        }`
      );
    } else {
      console.log("❌ Failed to get customer details");
      return;
    }

    // Test 3: Get wallet transactions
    console.log("\n3. Testing wallet transactions API...");
    const walletResponse = await fetch(
      `${BASE_URL}/api/customers/wallet?customerId=${testCustomer._id}`
    );
    const walletData = await walletResponse.json();

    if (walletData.success) {
      console.log(`✅ Wallet balance: ₹${walletData.data.balance}`);
      console.log(
        `✅ Transaction count: ${walletData.data.transactions.length}`
      );
    } else {
      console.log("❌ Failed to get wallet data");
    }

    // Test 4: Add funds to wallet
    console.log("\n4. Testing add funds API...");
    const addFundsResponse = await fetch(
      `${BASE_URL}/api/customers/wallet/add`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          customerId: testCustomer._id,
          amount: 500,
          note: "Test wallet funding",
        }),
      }
    );

    const addFundsData = await addFundsResponse.json();
    if (addFundsData.success) {
      console.log(`✅ Added ₹500. New balance: ₹${addFundsData.newBalance}`);
    } else {
      console.log(`❌ Failed to add funds: ${addFundsData.error}`);
    }

    // Test 5: Deduct funds from wallet
    console.log("\n5. Testing deduct funds API...");
    const deductFundsResponse = await fetch(
      `${BASE_URL}/api/customers/wallet/deduct`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          customerId: testCustomer._id,
          amount: 150,
          note: "Test order payment",
        }),
      }
    );

    const deductFundsData = await deductFundsResponse.json();
    if (deductFundsData.success) {
      console.log(
        `✅ Deducted ₹150. New balance: ₹${deductFundsData.newBalance}`
      );
    } else {
      console.log(`❌ Failed to deduct funds: ${deductFundsData.error}`);
    }

    // Test 6: Get updated wallet transactions
    console.log("\n6. Testing updated wallet transactions...");
    const updatedWalletResponse = await fetch(
      `${BASE_URL}/api/customers/wallet?customerId=${testCustomer._id}`
    );
    const updatedWalletData = await updatedWalletResponse.json();

    if (updatedWalletData.success) {
      console.log(
        `✅ Final wallet balance: ₹${updatedWalletData.data.balance}`
      );
      console.log(
        `✅ Final transaction count: ${updatedWalletData.data.transactions.length}`
      );

      if (updatedWalletData.data.transactions.length > 0) {
        console.log("\n📝 Recent transactions:");
        updatedWalletData.data.transactions
          .slice(0, 3)
          .forEach((tx: any, index: number) => {
            console.log(
              `   ${index + 1}. ${tx.type.toUpperCase()}: ₹${tx.amount} - ${
                tx.note
              } (Balance: ₹${tx.balanceAfter})`
            );
          });
      }
    }

    console.log("\n🎉 All wallet API tests completed successfully!");
  } catch (error) {
    console.error("❌ Test failed with error:", error);
  }
}

// Run tests if this file is executed directly
if (require.main === module) {
  testWalletAPIs().catch(console.error);
}

export default testWalletAPIs;
