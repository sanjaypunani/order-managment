import React from "react";

export function InvoiceHtml({ order }: { order: any }) {
  return (
    <div
      style={{
        fontFamily: "Arial, sans-serif",
        maxWidth: 600,
        margin: "auto",
        background: "#fff",
        borderRadius: 12,
        boxShadow: "0 2px 12px #e3e3e3",
        padding: 32,
      }}
    >
      <h1 style={{ color: "#1E88E5", marginBottom: 0 }}>Shree Hari Mart</h1>
      <h2 style={{ marginTop: 4, color: "#333" }}>Order Invoice</h2>
      <div style={{ marginBottom: 16 }}>
        <p style={{ margin: 0 }}>
          Order ID: <b>{order._id || "N/A"}</b>
        </p>
        <p style={{ margin: 0 }}>
          Customer Number: <b>{order.customerNumber}</b>
        </p>
        <p style={{ margin: 0 }}>
          Flat Number: <b>{order.flatNumber}</b>
        </p>
        <p style={{ margin: 0 }}>
          Society: <b>{order.socityName}</b>
        </p>
      </div>
      <table
        style={{
          width: "100%",
          borderCollapse: "collapse",
          marginTop: 20,
          fontSize: 15,
        }}
      >
        <thead style={{ backgroundColor: "#1976D2", color: "white" }}>
          <tr>
            <th style={{ padding: 8, borderRadius: 4 }}>#</th>
            <th style={{ padding: 8, borderRadius: 4 }}>Item</th>
            <th style={{ padding: 8, borderRadius: 4 }}>Quantity</th>
            <th style={{ padding: 8, borderRadius: 4 }}>Unit</th>
            <th style={{ padding: 8, borderRadius: 4 }}>Price (RS)</th>
          </tr>
        </thead>
        <tbody>
          {order.items.map((item: any, idx: number) => (
            <tr
              key={idx}
              style={{ background: idx % 2 === 0 ? "#F5F8FF" : "#fff" }}
            >
              <td style={{ padding: 8 }}>{idx + 1}</td>
              <td style={{ padding: 8 }}>{item.name}</td>
              <td style={{ padding: 8 }}>{item.quantity}</td>
              <td style={{ padding: 8 }}>{item.unit}</td>
              <td style={{ padding: 8 }}>{item.price} RS</td>
            </tr>
          ))}
        </tbody>
      </table>
      <div style={{ marginTop: 24 }}>
        <p style={{ color: "#1E88E5", fontWeight: "bold", fontSize: 17 }}>
          Total Amount: {order.totalAmount || 0} RS
        </p>
        <p style={{ color: "#D32F2F", fontWeight: "bold", fontSize: 17 }}>
          Discount: {order.discount || 0} RS
        </p>
        <p style={{ color: "#388E3C", fontWeight: "bold", fontSize: 17 }}>
          Final Amount:{" "}
          {order.finalAmount === 0 ? "Free" : order.finalAmount + " RS"}
        </p>
      </div>
    </div>
  );
}
