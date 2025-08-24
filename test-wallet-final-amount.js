/**
 * Test script to verify wallet final amount calculation
 * Tests that when wallet is used for payment, the finalAmount is properly adjusted
 */

async function testWalletFinalAmountCalculation() {
  const BASE_URL = "http://localhost:3000";

  console.log("🧪 Testing Wallet Final Amount Calculation...\n");

  try {
    // Test scenario 1: Wallet fully covers order amount
    console.log("📋 Test 1: Wallet fully covers order amount");

    const fullCoverageOrder = {
      customerNumber: "9999888777",
      customerName: "Test Customer",
      flatNumber: "101",
      socityName: "Test Society",
      status: "Pending",
      discount: 0,
      totalAmount: 50,
      finalAmount: 50, // Small amount that wallet should fully cover
      items: [
        {
          name: "Test Item",
          quantity: 1,
          unit: "PC",
          price: 50,
        },
      ],
    };

    const response1 = await fetch(`${BASE_URL}/api/orders`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(fullCoverageOrder),
    });

    const result1 = await response1.json();
    console.log("Order creation result:", {
      success: result1.success,
      walletUsed: result1.wallet?.walletUsed,
      amountProcessed: result1.wallet?.amountProcessed,
      finalAmountAfterWallet: result1.wallet?.finalAmountAfterWallet,
      message: result1.wallet?.message,
    });

    if (
      result1.wallet?.walletUsed &&
      result1.wallet?.finalAmountAfterWallet === 0
    ) {
      console.log(
        "✅ Test 1 PASSED: Order fully paid from wallet, finalAmount = 0"
      );
    } else {
      console.log(
        "❌ Test 1 FAILED: Expected finalAmount = 0 when fully paid from wallet"
      );
    }

    console.log("\n" + "=".repeat(50) + "\n");

    // Test scenario 2: Wallet partially covers order amount
    console.log("📋 Test 2: Wallet partially covers order amount");

    const partialCoverageOrder = {
      customerNumber: "9999888777",
      customerName: "Test Customer",
      flatNumber: "101",
      socityName: "Test Society",
      status: "Pending",
      discount: 0,
      totalAmount: 1000,
      finalAmount: 1000, // Large amount that wallet should partially cover
      items: [
        {
          name: "Expensive Item",
          quantity: 1,
          unit: "PC",
          price: 1000,
        },
      ],
    };

    const response2 = await fetch(`${BASE_URL}/api/orders`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(partialCoverageOrder),
    });

    const result2 = await response2.json();
    console.log("Order creation result:", {
      success: result2.success,
      walletUsed: result2.wallet?.walletUsed,
      amountProcessed: result2.wallet?.amountProcessed,
      finalAmountAfterWallet: result2.wallet?.finalAmountAfterWallet,
      message: result2.wallet?.message,
    });

    if (
      result2.wallet?.walletUsed &&
      result2.wallet?.finalAmountAfterWallet > 0
    ) {
      const expectedRemaining = 1000 - (result2.wallet?.amountProcessed || 0);
      if (result2.wallet?.finalAmountAfterWallet === expectedRemaining) {
        console.log(
          "✅ Test 2 PASSED: Partial wallet payment, correct remaining amount"
        );
      } else {
        console.log("❌ Test 2 FAILED: Incorrect remaining amount calculation");
      }
    } else {
      console.log("⚠️ Test 2: Wallet was not used or insufficient balance");
    }

    console.log("\n🎉 Wallet final amount tests completed!");
  } catch (error) {
    console.error("❌ Test failed with error:", error.message);
    console.log("\n💡 Make sure:");
    console.log("1. Server is running on http://localhost:3000");
    console.log("2. Test customer (9999888777) exists with wallet balance");
    console.log("3. Database is properly connected");
  }
}

// Run the test
testWalletFinalAmountCalculation();
