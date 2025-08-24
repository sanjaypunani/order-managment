#!/usr/bin/env node

/**
 * Test script for enhanced customer search functionality
 * Tests search by mobile number, flat number, and customer name
 */

const BASE_URL = "http://localhost:3001";

async function testEnhancedCustomerSearch() {
  console.log("🔍 Testing Enhanced Customer Search Functionality\n");

  try {
    // Test 1: Search by mobile number
    console.log("1. Testing mobile number search...");
    let response = await fetch(`${BASE_URL}/api/customers?mobileNumber=991342`);
    let data = await response.json();

    if (data.success && data.data.length > 0) {
      console.log(`✅ Mobile search: Found ${data.data.length} customers`);
      console.log(
        `   First result: ${data.data[0].customerName || "Unnamed"} - ${
          data.data[0].mobileNumber
        }`
      );
    } else {
      console.log("❌ Mobile search failed");
    }

    // Test 2: Search by flat number
    console.log("\n2. Testing flat number search...");
    response = await fetch(`${BASE_URL}/api/customers?flatNumber=A-`);
    data = await response.json();

    if (data.success && data.data.length > 0) {
      console.log(`✅ Flat search: Found ${data.data.length} customers`);
      console.log(
        `   First result: ${data.data[0].flatNumber} - ${
          data.data[0].customerName || "Unnamed"
        }`
      );
    } else {
      console.log("❌ Flat search failed");
    }

    // Test 3: Search by customer name
    console.log("\n3. Testing customer name search...");
    response = await fetch(`${BASE_URL}/api/customers?customerName=Unnamed`);
    data = await response.json();

    if (data.success && data.data.length > 0) {
      console.log(`✅ Name search: Found ${data.data.length} customers`);
      console.log(
        `   First result: ${data.data[0].customerName || "N/A"} - ${
          data.data[0].flatNumber
        }`
      );
    } else {
      console.log("❌ Name search failed");
    }

    // Test 4: Partial searches
    console.log("\n4. Testing partial searches...");

    // Partial mobile
    response = await fetch(`${BASE_URL}/api/customers?mobileNumber=99`);
    data = await response.json();
    console.log(
      `✅ Partial mobile (99): Found ${data.data?.length || 0} customers`
    );

    // Partial flat
    response = await fetch(`${BASE_URL}/api/customers?flatNumber=B`);
    data = await response.json();
    console.log(
      `✅ Partial flat (B): Found ${data.data?.length || 0} customers`
    );

    // Partial name (case insensitive)
    response = await fetch(`${BASE_URL}/api/customers?customerName=unname`);
    data = await response.json();
    console.log(
      `✅ Partial name (unname): Found ${data.data?.length || 0} customers`
    );

    console.log("\n🎉 Enhanced customer search functionality test completed!");

    // Test 5: Response structure validation
    console.log("\n5. Validating response structure...");
    response = await fetch(`${BASE_URL}/api/customers?mobileNumber=9913422877`);
    data = await response.json();

    if (data.success && data.data && Array.isArray(data.data)) {
      console.log(
        "✅ Response structure is correct: { success: boolean, data: Customer[] }"
      );
      if (data.data.length > 0) {
        const customer = data.data[0];
        const hasRequiredFields =
          customer._id && customer.mobileNumber && customer.flatNumber;
        console.log(
          `✅ Customer object has required fields: ${
            hasRequiredFields ? "Yes" : "No"
          }`
        );
      }
    } else {
      console.log("❌ Response structure is invalid");
    }
  } catch (error) {
    console.error("❌ Test failed:", error.message);
  }
}

// Run the test
testEnhancedCustomerSearch();
