"use client";
import React, { useState, useEffect } from "react";
import { useRouter, useParams } from "next/navigation";
import { DateCell } from "../../components/DataTable";

interface Customer {
  _id: string;
  countryCode: string;
  mobileNumber: string;
  flatNumber: string;
  societyName: string;
  customerName: string;
  address: string;
  walletBalance: number;
  createdAt: string;
  updatedAt: string;
}

interface WalletTransaction {
  _id: string;
  date: string;
  type: "credit" | "debit";
  amount: number;
  note: string;
  balanceAfter: number;
  orderId?: string;
}

interface OrderStats {
  totalOrders: number;
  totalAmount: number;
  pendingOrders: number;
  deliveredOrders: number;
}

export default function CustomerDetails() {
  const router = useRouter();
  const params = useParams();
  const customerId = params.id as string;

  // State
  const [customer, setCustomer] = useState<Customer | null>(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<"info" | "orders" | "wallet">(
    "info"
  );

  // Orders
  const [customerOrders, setCustomerOrders] = useState<any[]>([]);
  const [orderStats, setOrderStats] = useState<OrderStats | null>(null);
  const [loadingOrders, setLoadingOrders] = useState(false);

  // Wallet
  const [walletTransactions, setWalletTransactions] = useState<
    WalletTransaction[]
  >([]);
  const [loadingWallet, setLoadingWallet] = useState(false);
  const [showWalletModal, setShowWalletModal] = useState(false);
  const [walletAction, setWalletAction] = useState<"add" | "deduct">("add");
  const [walletForm, setWalletForm] = useState({ amount: "", note: "" });

  // Fetch customer details
  const fetchCustomer = async () => {
    try {
      setLoading(true);
      const response = await fetch(`/api/customers/${customerId}`);
      const data = await response.json();
      if (data.success) {
        setCustomer(data.data);
      } else {
        alert("Customer not found");
        router.push("/customers");
      }
    } catch (error) {
      console.error("Error fetching customer:", error);
      alert("Error fetching customer details");
    } finally {
      setLoading(false);
    }
  };

  // Fetch customer orders
  const fetchCustomerOrders = async () => {
    if (!customer) return;
    try {
      setLoadingOrders(true);
      const response = await fetch(
        `/api/customers/orders?mobileNumber=${customer.mobileNumber}`
      );
      const data = await response.json();
      if (data.success) {
        setCustomerOrders(data.orders || []);
        setOrderStats(data.statistics);
      }
    } catch (error) {
      console.error("Error fetching customer orders:", error);
    } finally {
      setLoadingOrders(false);
    }
  };

  // Fetch wallet transactions
  const fetchWalletTransactions = async () => {
    try {
      setLoadingWallet(true);
      const response = await fetch(
        `/api/customers/wallet?customerId=${customerId}`
      );
      const data = await response.json();
      if (data.success) {
        setWalletTransactions(data.data.transactions || []);
      }
    } catch (error) {
      console.error("Error fetching wallet transactions:", error);
    } finally {
      setLoadingWallet(false);
    }
  };

  // Handle wallet transaction
  const handleWalletTransaction = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!walletForm.amount || parseFloat(walletForm.amount) <= 0) {
      alert("Please enter a valid amount");
      return;
    }

    try {
      const endpoint =
        walletAction === "add"
          ? "/api/customers/wallet/add"
          : "/api/customers/wallet/deduct";
      const response = await fetch(endpoint, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          customerId,
          amount: parseFloat(walletForm.amount),
          note: walletForm.note,
        }),
      });

      const data = await response.json();
      if (data.success) {
        setShowWalletModal(false);
        setWalletForm({ amount: "", note: "" });
        // Refresh customer and wallet data
        fetchCustomer();
        fetchWalletTransactions();
        alert(
          `Successfully ${walletAction === "add" ? "added" : "deducted"} ₹${
            walletForm.amount
          }`
        );
      } else {
        alert(data.error || "Error processing wallet transaction");
      }
    } catch (error) {
      console.error("Error processing wallet transaction:", error);
      alert("Error processing wallet transaction");
    }
  };

  useEffect(() => {
    fetchCustomer();
  }, [customerId]);

  useEffect(() => {
    if (customer && activeTab === "orders") {
      fetchCustomerOrders();
    } else if (activeTab === "wallet") {
      fetchWalletTransactions();
    }
  }, [customer, activeTab]);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-64">
        <div className="text-lg">Loading customer details...</div>
      </div>
    );
  }

  if (!customer) {
    return (
      <div className="flex items-center justify-center min-h-64">
        <div className="text-lg">Customer not found</div>
      </div>
    );
  }

  return (
    <div className="p-6">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <button
            onClick={() => router.push("/customers")}
            className="text-blue-600 hover:text-blue-800 mb-2"
          >
            ← Back to Customers
          </button>
          <h1 className="text-2xl font-bold">
            {customer.customerName || "Unnamed Customer"}
          </h1>
          <p className="text-gray-600">
            {customer.countryCode}
            {customer.mobileNumber} • {customer.flatNumber},{" "}
            {customer.societyName}
          </p>
        </div>
        <div className="text-right">
          <div className="text-sm text-gray-500">Wallet Balance</div>
          <div className="text-2xl font-bold text-green-600">
            ₹{customer.walletBalance || 0}
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="border-b border-gray-200 mb-6">
        <nav className="-mb-px flex space-x-8">
          {[
            { key: "info", label: "Basic Info" },
            { key: "orders", label: "Order History" },
            { key: "wallet", label: "Wallet & Transactions" },
          ].map((tab) => (
            <button
              key={tab.key}
              onClick={() => setActiveTab(tab.key as any)}
              className={`py-2 px-1 border-b-2 font-medium text-sm ${
                activeTab === tab.key
                  ? "border-blue-500 text-blue-600"
                  : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
              }`}
            >
              {tab.label}
            </button>
          ))}
        </nav>
      </div>

      {/* Tab Content */}
      {activeTab === "info" && (
        <div className="bg-white rounded-lg shadow p-6">
          <h2 className="text-xl font-semibold mb-4">Customer Information</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Full Name
              </label>
              <div className="text-lg">
                {customer.customerName || "Not provided"}
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Mobile Number
              </label>
              <div className="text-lg">
                {customer.countryCode}
                {customer.mobileNumber}
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Flat Number
              </label>
              <div className="text-lg">{customer.flatNumber}</div>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Society
              </label>
              <div className="text-lg">{customer.societyName}</div>
            </div>
            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Address
              </label>
              <div className="text-lg">
                {customer.address || "Not provided"}
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Customer Since
              </label>
              <div className="text-lg">
                <DateCell date={customer.createdAt} />
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Last Updated
              </label>
              <div className="text-lg">
                <DateCell date={customer.updatedAt} />
              </div>
            </div>
          </div>
        </div>
      )}

      {activeTab === "orders" && (
        <div className="space-y-6">
          {/* Order Statistics */}
          {orderStats && (
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <div className="bg-blue-50 p-4 rounded-lg">
                <div className="text-sm font-medium text-blue-800">
                  Total Orders
                </div>
                <div className="text-2xl font-bold text-blue-900">
                  {orderStats.totalOrders}
                </div>
              </div>
              <div className="bg-green-50 p-4 rounded-lg">
                <div className="text-sm font-medium text-green-800">
                  Total Spent
                </div>
                <div className="text-2xl font-bold text-green-900">
                  ₹{orderStats.totalAmount}
                </div>
              </div>
              <div className="bg-yellow-50 p-4 rounded-lg">
                <div className="text-sm font-medium text-yellow-800">
                  Pending Orders
                </div>
                <div className="text-2xl font-bold text-yellow-900">
                  {orderStats.pendingOrders}
                </div>
              </div>
              <div className="bg-purple-50 p-4 rounded-lg">
                <div className="text-sm font-medium text-purple-800">
                  Delivered Orders
                </div>
                <div className="text-2xl font-bold text-purple-900">
                  {orderStats.deliveredOrders}
                </div>
              </div>
            </div>
          )}

          {/* Orders Table */}
          <div className="bg-white rounded-lg shadow overflow-hidden">
            <div className="px-6 py-4 border-b border-gray-200">
              <h2 className="text-xl font-semibold">Order History</h2>
            </div>
            {loadingOrders ? (
              <div className="p-6 text-center">Loading orders...</div>
            ) : customerOrders.length === 0 ? (
              <div className="p-6 text-center text-gray-500">
                No orders found
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Order Date
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Delivery Date
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Status
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Items
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Total Amount
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Final Amount
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {customerOrders.map((order: any, idx: number) => (
                      <tr key={idx} className="hover:bg-gray-50">
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                          {order.createdAt
                            ? new Date(order.createdAt).toLocaleDateString()
                            : "N/A"}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                          {order.deliveryDate
                            ? new Date(order.deliveryDate).toLocaleDateString()
                            : "-"}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span
                            className={`px-2 py-1 rounded-full text-xs font-medium ${
                              order.status === "Delivered"
                                ? "bg-green-100 text-green-800"
                                : "bg-yellow-100 text-yellow-800"
                            }`}
                          >
                            {order.status}
                          </span>
                        </td>
                        <td className="px-6 py-4 text-sm text-gray-900">
                          <div className="max-w-xs">
                            {order.items
                              .slice(0, 2)
                              .map((item: any, i: number) => (
                                <div key={i} className="text-xs">
                                  {item.name} ({item.quantity} {item.unit})
                                </div>
                              ))}
                            {order.items.length > 2 && (
                              <div className="text-xs text-gray-500">
                                +{order.items.length - 2} more
                              </div>
                            )}
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                          ₹{order.totalAmount || 0}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                          ₹
                          {order.finalAmount === 0 ? "Free" : order.finalAmount}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      )}

      {activeTab === "wallet" && (
        <div className="space-y-6">
          {/* Wallet Overview */}
          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-semibold">Wallet Management</h2>
              <div className="space-x-2">
                <button
                  onClick={() => {
                    setWalletAction("add");
                    setShowWalletModal(true);
                  }}
                  className="bg-green-600 text-white px-4 py-2 rounded hover:bg-green-700"
                >
                  Add Funds
                </button>
                <button
                  onClick={() => {
                    setWalletAction("deduct");
                    setShowWalletModal(true);
                  }}
                  className="bg-red-600 text-white px-4 py-2 rounded hover:bg-red-700"
                >
                  Deduct Funds
                </button>
              </div>
            </div>
            <div className="bg-gradient-to-r from-blue-500 to-purple-600 text-white p-6 rounded-lg">
              <div className="text-sm opacity-90">Current Balance</div>
              <div className="text-3xl font-bold">
                ₹{customer.walletBalance || 0}
              </div>
            </div>
          </div>

          {/* Transaction History */}
          <div className="bg-white rounded-lg shadow overflow-hidden">
            <div className="px-6 py-4 border-b border-gray-200">
              <h2 className="text-xl font-semibold">Transaction History</h2>
            </div>
            {loadingWallet ? (
              <div className="p-6 text-center">Loading transactions...</div>
            ) : walletTransactions.length === 0 ? (
              <div className="p-6 text-center text-gray-500">
                No transactions found
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Date
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Type
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Amount
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Note
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Balance After
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {walletTransactions.map((transaction) => (
                      <tr key={transaction._id} className="hover:bg-gray-50">
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                          {new Date(transaction.date).toLocaleDateString()}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span
                            className={`px-2 py-1 rounded-full text-xs font-medium ${
                              transaction.type === "credit"
                                ? "bg-green-100 text-green-800"
                                : "bg-red-100 text-red-800"
                            }`}
                          >
                            {transaction.type === "credit" ? "Credit" : "Debit"}
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                          <span
                            className={
                              transaction.type === "credit"
                                ? "text-green-600"
                                : "text-red-600"
                            }
                          >
                            {transaction.type === "credit" ? "+" : "-"}₹
                            {transaction.amount}
                          </span>
                        </td>
                        <td className="px-6 py-4 text-sm text-gray-900">
                          {transaction.note || "-"}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                          ₹{transaction.balanceAfter}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Wallet Transaction Modal */}
      {showWalletModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg shadow-lg p-6 w-full max-w-md">
            <h2 className="text-xl font-bold mb-4">
              {walletAction === "add" ? "Add Funds" : "Deduct Funds"}
            </h2>
            <form onSubmit={handleWalletTransaction}>
              <div className="mb-4">
                <label className="block font-semibold mb-2">Amount (₹)</label>
                <input
                  type="number"
                  step="0.01"
                  min="0.01"
                  value={walletForm.amount}
                  onChange={(e) =>
                    setWalletForm({ ...walletForm, amount: e.target.value })
                  }
                  className="border rounded px-3 py-2 w-full"
                  placeholder="Enter amount"
                  required
                />
              </div>
              <div className="mb-4">
                <label className="block font-semibold mb-2">
                  Note (Optional)
                </label>
                <textarea
                  value={walletForm.note}
                  onChange={(e) =>
                    setWalletForm({ ...walletForm, note: e.target.value })
                  }
                  className="border rounded px-3 py-2 w-full"
                  placeholder="Enter note for this transaction"
                  rows={3}
                />
              </div>
              <div className="flex justify-end space-x-2">
                <button
                  type="button"
                  onClick={() => {
                    setShowWalletModal(false);
                    setWalletForm({ amount: "", note: "" });
                  }}
                  className="px-4 py-2 rounded bg-gray-300 hover:bg-gray-400"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className={`px-4 py-2 rounded text-white ${
                    walletAction === "add"
                      ? "bg-green-600 hover:bg-green-700"
                      : "bg-red-600 hover:bg-red-700"
                  }`}
                >
                  {walletAction === "add" ? "Add Funds" : "Deduct Funds"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
