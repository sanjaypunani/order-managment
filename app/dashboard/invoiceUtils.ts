import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";

export function generateInvoicePDF(order: any) {
  const doc = new jsPDF();

  // Branding and improved UI
  doc.setFont("helvetica", "bold");
  doc.setTextColor(41, 128, 185); // Blue for branding
  doc.setFontSize(22);
  doc.text("Shree Hari Mart", 14, 18);
  doc.setFontSize(14);
  doc.setTextColor(60, 60, 60); // Dark gray for subtitle
  doc.text("Order Invoice", 14, 28);

  doc.setFont("helvetica", "normal");
  doc.setFontSize(12);
  doc.setTextColor(0, 0, 0);
  doc.text(`Order ID: ${order._id || "N/A"}`, 14, 38);
  doc.text(
    `Customer Number: ${order.customer?.countryCode || "+91"}${
      order.customer?.mobileNumber || order.customerNumber
    }`,
    14,
    46
  );
  doc.text(
    `Customer Name: ${
      order.customer?.customerName || order.customerName || "N/A"
    }`,
    14,
    54
  );
  doc.text(
    `Flat Number: ${order.customer?.flatNumber || order.flatNumber}`,
    14,
    62
  );
  doc.text(
    `Society: ${order.customer?.societyName || order.socityName}`,
    14,
    70
  );

  // Table for items
  const itemRows = order.items.map((item: any, idx: number) => [
    idx + 1,
    item.name,
    item.quantity,
    item.unit,
    `${item.price} RS`,
  ]);
  autoTable(doc, {
    head: [["#", "Item", "Quantity", "Unit", "Price"]],
    body: itemRows,
    startY: 78, // Adjusted for additional customer name line
    theme: "striped",
    headStyles: {
      fillColor: [41, 128, 185],
      textColor: 255,
      fontStyle: "bold",
    },
    styles: { fontSize: 11, font: "helvetica", cellPadding: 2 },
    alternateRowStyles: { fillColor: [230, 240, 255] },
    tableLineColor: [41, 128, 185],
    tableLineWidth: 0.5,
  } as any);

  // Find where to place summary section
  // @ts-ignore
  const finalY = (doc as any).lastAutoTable
    ? (doc as any).lastAutoTable.finalY + 10
    : 150;

  // Summary section
  doc.setFontSize(13);
  doc.setTextColor(41, 128, 185);
  doc.text(`Total Amount: ${order.totalAmount || 0} RS`, 14, finalY);
  doc.setTextColor(255, 87, 34); // Orange for discount
  doc.text(`Discount: ${order.discount || 0} RS`, 14, finalY + 8);
  doc.setTextColor(34, 139, 34); // Green for final amount
  doc.text(
    `Final Amount: ${
      order.finalAmount === 0 ? "Free" : order.finalAmount + " RS"
    }`,
    14,
    finalY + 16
  );

  doc.save(`Order_Invoice_${order._id || "N/A"}.pdf`);
}

export function getOrderSummaryText(order: any): string {
  console.log("get orders", order);
  let summary = `**Shree Hari Mart – Order Summary**\n\n`;

  summary += `Delivery Date: ${order.deliveryDate}\n`;
  summary += `Customer: ${
    order.customer?.customerName || order.customerName || "N/A"
  }\n`;
  summary += `Mobile: ${order.customer?.countryCode || "+91"}${
    order.customer?.mobileNumber || order.customerNumber
  }\n`;
  summary += `Society: ${order.customer?.societyName || order.socityName} ${
    order.customer?.flatNumber || order.flatNumber
      ? order.customer?.flatNumber || order.flatNumber
      : ""
  }\n\n`;
  summary += `Items:\n`;
  order.items.forEach((item: any) => {
    summary += `• ${item.name} – ${item.quantity} ${item.unit} – ${item.price} RS\n`;
  });
  summary += `\nTotal Amount: ${order.totalAmount || 0} RS\n`;

  // Add discount if applicable
  if (order.discount && order.discount > 0) {
    summary += `Discount: ${order.discount} RS\n`;
  }

  // Add wallet payment information if wallet was used
  if (order.walletUsed && order.walletAmount > 0) {
    summary += `\n💳 **WALLET PAYMENT:**\n`;
    summary += `Amount Deducted from Wallet: ${order.walletAmount} RS\n`;

    if (order.walletBalanceAfter !== undefined) {
      summary += `Wallet Balance After Payment: ${order.walletBalanceAfter} RS\n`;
    }

    const remainingAmount = order.finalAmount || 0;
    if (remainingAmount > 0) {
      summary += `Remaining Amount to Pay: ${remainingAmount} RS\n`;
    } else if (remainingAmount === 0) {
      summary += `✅ **FULLY PAID FROM WALLET**\n`;
    }
  }

  summary += `\n**FINAL AMOUNT TO PAY: ${
    order.finalAmount === 0 ? "0 RS" : order.finalAmount + " RS"
  }**\n\n`;

  // Add current wallet balance info if available
  if (order.currentWalletBalance !== undefined) {
    summary += `💰 Your current wallet balance: ${order.currentWalletBalance} RS\n\n`;
  } else if (order.walletUsed && order.walletBalanceAfter !== undefined) {
    summary += `💰 Your wallet balance after this order: ${order.walletBalanceAfter} RS\n\n`;
  }

  summary += `Thank you for your order.\n\n**Shree Hari Mart**`;
  return summary;
}
