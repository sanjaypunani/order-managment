// Test script to verify order calculation logic
const testCalculations = () => {
  // Test data similar to what would be in the form
  const testItems = [
    { name: "Product 1", quantity: 2, unit: "KG", price: 50 },
    { name: "Product 2", quantity: 3, unit: "GM", price: 30 },
    { name: "Product 3", quantity: 1, unit: "KG", price: 100 },
  ];

  const discount = 25;

  // Calculate total amount (price * quantity for each item)
  const totalAmount = testItems.reduce((sum, item) => {
    return sum + item.price * item.quantity;
  }, 0);

  // Calculate final amount (total - discount, minimum 0)
  const finalAmount = totalAmount - discount < 0 ? 0 : totalAmount - discount;

  console.log("=== Order Calculation Test ===");
  console.log("Items:", testItems);
  console.log("Item calculations:");
  testItems.forEach((item, index) => {
    console.log(
      `  ${index + 1}. ${item.name}: ${item.quantity} × ₹${item.price} = ₹${
        item.quantity * item.price
      }`
    );
  });
  console.log(`Total Amount: ₹${totalAmount}`);
  console.log(`Discount: ₹${discount}`);
  console.log(`Final Amount (Customer pays): ₹${finalAmount}`);
  console.log("===============================");

  // Test edge cases
  console.log("\n=== Edge Case Tests ===");

  // Test with discount larger than total
  const largeDiscount = 300;
  const finalAmountWithLargeDiscount =
    totalAmount - largeDiscount < 0 ? 0 : totalAmount - largeDiscount;
  console.log(
    `With discount ₹${largeDiscount}: Final Amount = ₹${finalAmountWithLargeDiscount}`
  );

  // Test with string values (as they come from form inputs)
  const stringItems = [
    { name: "Product 1", quantity: "2", unit: "KG", price: "50" },
    { name: "Product 2", quantity: "3.5", unit: "GM", price: "25.5" },
  ];

  const stringTotalAmount = stringItems.reduce((sum, item) => {
    const price =
      typeof item.price === "string" ? parseFloat(item.price) || 0 : item.price;
    const quantity =
      typeof item.quantity === "string"
        ? parseFloat(item.quantity) || 0
        : item.quantity;
    return sum + price * quantity;
  }, 0);

  console.log(`String inputs test: ₹${stringTotalAmount}`);
  console.log("======================");
};

testCalculations();
