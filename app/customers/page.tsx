"use client";
import React, { useState, useEffect } from "react";
import { SOCIETIES } from "../dashboard/constants";
import {
  DataTable,
  TableColumn,
  TableAction,
  DateCell,
} from "../components/DataTable";

interface Customer {
  _id: string;
  countryCode: string;
  mobileNumber: string;
  flatNumber: string;
  societyName: string;
  customerName: string;
  address: string;
  walletBalance?: number;
  createdAt: string;
  updatedAt: string;
}

export default function Customers() {
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editingCustomer, setEditingCustomer] = useState<Customer | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [showOrderHistory, setShowOrderHistory] = useState(false);
  const [selectedCustomer, setSelectedCustomer] = useState<Customer | null>(
    null
  );
  const [customerOrders, setCustomerOrders] = useState<any[]>([]);
  const [orderStats, setOrderStats] = useState<any>(null);
  const [loadingOrders, setLoadingOrders] = useState(false);
  const [form, setForm] = useState({
    countryCode: "+91",
    mobileNumber: "",
    flatNumber: "",
    societyName: "",
    customerName: "",
    address: "",
  });

  // Fetch customers
  const fetchCustomers = async () => {
    try {
      setLoading(true);
      const response = await fetch("/api/customers");
      const data = await response.json();
      if (data.success) {
        setCustomers(data.data || []);
      }
    } catch (error) {
      console.error("Error fetching customers:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCustomers();
  }, []);

  // Handle form changes
  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>
  ) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  // Handle form submit
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const url = "/api/customers";
      const method = editingCustomer ? "PUT" : "POST";
      const body = editingCustomer
        ? { customerId: editingCustomer._id, ...form }
        : form;

      const response = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });

      const data = await response.json();
      if (data.success) {
        setShowModal(false);
        setEditingCustomer(null);
        setForm({
          countryCode: "+91",
          mobileNumber: "",
          flatNumber: "",
          societyName: "",
          customerName: "",
          address: "",
        });
        fetchCustomers();
      } else {
        alert(data.error || "Error saving customer");
      }
    } catch (error) {
      console.error("Error saving customer:", error);
      alert("Error saving customer");
    }
  };

  // Handle edit
  const handleEdit = (customer: Customer) => {
    setEditingCustomer(customer);
    setForm({
      countryCode: customer.countryCode || "+91",
      mobileNumber: customer.mobileNumber,
      flatNumber: customer.flatNumber,
      societyName: customer.societyName,
      customerName: customer.customerName,
      address: customer.address,
    });
    setShowModal(true);
  };

  // Handle delete
  const handleDelete = async (customerId: string) => {
    if (!confirm("Are you sure you want to delete this customer?")) return;

    try {
      const response = await fetch("/api/customers", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ customerId }),
      });

      const data = await response.json();
      if (data.success) {
        fetchCustomers();
      } else {
        alert("Error deleting customer");
      }
    } catch (error) {
      console.error("Error deleting customer:", error);
      alert("Error deleting customer");
    }
  };

  // Fetch customer order history
  const fetchCustomerOrders = async (customer: Customer) => {
    try {
      setLoadingOrders(true);
      const response = await fetch(
        `/api/customers/orders?mobileNumber=${customer.mobileNumber}`
      );
      const data = await response.json();
      if (data.success) {
        setCustomerOrders(data.orders || []);
        setOrderStats(data.statistics);
        setSelectedCustomer(customer);
        setShowOrderHistory(true);
      }
    } catch (error) {
      console.error("Error fetching customer orders:", error);
    } finally {
      setLoadingOrders(false);
    }
  };

  // Filter customers based on search
  const filteredCustomers = customers.filter(
    (customer) =>
      customer.customerName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      customer.mobileNumber.includes(searchQuery) ||
      customer.flatNumber.toLowerCase().includes(searchQuery.toLowerCase()) ||
      customer.societyName.toLowerCase().includes(searchQuery.toLowerCase())
  );

  // Define table columns for customers
  const customerColumns: TableColumn[] = [
    {
      key: "customerName",
      label: "Customer Name",
      render: (value) => (
        <div className="font-medium">{value || "Unnamed"}</div>
      ),
    },
    {
      key: "mobile",
      label: "Mobile Number",
      render: (_, customer) => (
        <div>
          {customer.countryCode || "+91"}
          {customer.mobileNumber}
        </div>
      ),
    },
    {
      key: "flatNumber",
      label: "Flat Number",
    },
    {
      key: "societyName",
      label: "Society",
    },
    {
      key: "walletBalance",
      label: "Wallet Balance",
      render: (value) => (
        <div className="font-medium text-green-600">₹{value || 0}</div>
      ),
    },
    {
      key: "address",
      label: "Address",
      className: "text-sm text-gray-600",
    },
    {
      key: "createdAt",
      label: "Created Date",
      render: (date) => <DateCell date={date} />,
    },
  ];

  // Define table actions for customers
  const customerActions: TableAction[] = [
    {
      label: "View Details",
      variant: "primary",
      onClick: (customer) =>
        window.open(`/customers/${customer._id}`, "_blank"),
    },
    {
      label: "Edit",
      variant: "secondary",
      onClick: (customer) => handleEdit(customer),
    },
    {
      label: "Orders",
      variant: "success",
      onClick: (customer) => fetchCustomerOrders(customer),
      disabled: () => loadingOrders,
    },
    {
      label: "Delete",
      variant: "danger",
      onClick: (customer) => handleDelete(customer._id),
    },
  ];

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-64">
        <div className="text-lg">Loading customers...</div>
      </div>
    );
  }

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">Customer Management</h1>
        <button
          onClick={() => {
            setEditingCustomer(null);
            setForm({
              countryCode: "+91",
              mobileNumber: "",
              flatNumber: "",
              societyName: "",
              customerName: "",
              address: "",
            });
            setShowModal(true);
          }}
          className="bg-blue-600 text-white px-4 py-2 rounded shadow hover:bg-blue-700"
        >
          + Add Customer
        </button>
      </div>

      {/* Search Bar */}
      <div className="mb-6">
        <input
          type="text"
          placeholder="Search customers by name, mobile, flat number, or society..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="border rounded px-4 py-2 w-full max-w-md lg:max-w-lg xl:max-w-xl"
        />
      </div>

      {/* Customer Stats */}
      <div className="mb-6 grid grid-cols-1 md:grid-cols-4 gap-4 lg:gap-6 xl:gap-8">
        <div className="bg-blue-50 p-4 lg:p-6 xl:p-8 rounded shadow">
          <div className="text-lg lg:text-xl font-semibold">
            Total Customers
          </div>
          <div className="text-2xl lg:text-3xl xl:text-4xl font-bold text-blue-700">
            {customers.length}
          </div>
        </div>
        <div className="bg-green-50 p-4 lg:p-6 xl:p-8 rounded shadow">
          <div className="text-lg lg:text-xl font-semibold">
            Filtered Results
          </div>
          <div className="text-2xl lg:text-3xl xl:text-4xl font-bold text-green-700">
            {filteredCustomers.length}
          </div>
        </div>
        <div className="bg-purple-50 p-4 lg:p-6 xl:p-8 rounded shadow">
          <div className="text-lg lg:text-xl font-semibold">Societies</div>
          <div className="text-2xl lg:text-3xl xl:text-4xl font-bold text-purple-700">
            {new Set(customers.map((c) => c.societyName)).size}
          </div>
        </div>
        <div className="bg-yellow-50 p-4 lg:p-6 xl:p-8 rounded shadow">
          <div className="text-lg lg:text-xl font-semibold">
            Total Wallet Balance
          </div>
          <div className="text-2xl lg:text-3xl xl:text-4xl font-bold text-yellow-700">
            ₹{customers.reduce((sum, c) => sum + (c.walletBalance || 0), 0)}
          </div>
        </div>
      </div>

      {/* Customers Table */}
      <DataTable
        data={filteredCustomers}
        columns={customerColumns}
        actions={customerActions}
        loading={loading}
        title={`Customers (${filteredCustomers.length} total)`}
        emptyMessage={
          searchQuery
            ? "No customers found matching your search."
            : "No customers found."
        }
        getRowId={(customer) => customer._id}
      />

      {/* Customer Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black bg-opacity-30 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg shadow-lg p-6 w-full max-w-md lg:max-w-lg xl:max-w-xl">
            <h2 className="text-xl font-bold mb-4">
              {editingCustomer ? "Edit Customer" : "Add Customer"}
            </h2>
            <form onSubmit={handleSubmit}>
              <div className="mb-3">
                <label className="block font-semibold mb-1">
                  Customer Name
                </label>
                <input
                  name="customerName"
                  value={form.customerName}
                  onChange={handleChange}
                  required
                  className="border rounded px-3 py-2 w-full"
                  placeholder="Enter customer name"
                />
              </div>
              <div className="mb-3">
                <label className="block font-semibold mb-1">
                  Country Code & Mobile Number
                </label>
                <div className="flex gap-2">
                  <select
                    name="countryCode"
                    value={form.countryCode}
                    onChange={handleChange}
                    required
                    className="border rounded px-3 py-2"
                  >
                    <option value="+91">+91 (India)</option>
                    <option value="+1">+1 (US/Canada)</option>
                    <option value="+44">+44 (UK)</option>
                  </select>
                  <input
                    name="mobileNumber"
                    value={form.mobileNumber}
                    onChange={handleChange}
                    required
                    className="border rounded px-3 py-2 flex-1"
                    placeholder="Enter 10-digit mobile number"
                    pattern="[0-9]{10}"
                    maxLength={10}
                  />
                </div>
              </div>
              <div className="mb-3">
                <label className="block font-semibold mb-1">Flat Number</label>
                <input
                  name="flatNumber"
                  value={form.flatNumber}
                  onChange={handleChange}
                  required
                  className="border rounded px-3 py-2 w-full"
                  placeholder="Enter flat number"
                />
              </div>
              <div className="mb-3">
                <label className="block font-semibold mb-1">Society Name</label>
                <select
                  name="societyName"
                  value={form.societyName}
                  onChange={handleChange}
                  required
                  className="border rounded px-3 py-2 w-full"
                >
                  <option value="">Select Society</option>
                  {SOCIETIES.map((society) => (
                    <option key={society} value={society}>
                      {society}
                    </option>
                  ))}
                </select>
              </div>
              <div className="mb-3">
                <label className="block font-semibold mb-1">Address</label>
                <input
                  name="address"
                  value={form.address}
                  onChange={handleChange}
                  className="border rounded px-3 py-2 w-full"
                  placeholder="Enter full address (optional)"
                />
              </div>
              <div className="flex justify-end space-x-2 mt-4">
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="px-4 py-2 rounded bg-gray-300 hover:bg-gray-400"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 rounded bg-blue-600 text-white hover:bg-blue-700"
                >
                  {editingCustomer ? "Update" : "Create"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Order History Modal */}
      {showOrderHistory && selectedCustomer && (
        <div className="fixed inset-0 bg-black bg-opacity-30 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg shadow-lg p-6 w-full max-w-4xl xl:max-w-6xl 2xl:max-w-7xl max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-bold">
                Order History - {selectedCustomer.customerName || "Unnamed"}
              </h2>
              <button
                onClick={() => setShowOrderHistory(false)}
                className="text-gray-500 hover:text-gray-700"
              >
                ✕
              </button>
            </div>

            {/* Customer Info */}
            <div className="mb-4 p-4 bg-gray-50 rounded">
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div>
                  <span className="font-semibold">Mobile:</span>{" "}
                  {selectedCustomer.countryCode || "+91"}
                  {selectedCustomer.mobileNumber}
                </div>
                <div>
                  <span className="font-semibold">Flat:</span>{" "}
                  {selectedCustomer.flatNumber}
                </div>
                <div>
                  <span className="font-semibold">Society:</span>{" "}
                  {selectedCustomer.societyName}
                </div>
                <div>
                  <span className="font-semibold">Address:</span>{" "}
                  {selectedCustomer.address}
                </div>
              </div>
            </div>

            {/* Order Statistics */}
            {orderStats && (
              <div className="mb-6 grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="bg-blue-50 p-3 rounded">
                  <div className="text-sm font-medium">Total Orders</div>
                  <div className="text-xl font-bold text-blue-700">
                    {orderStats.totalOrders}
                  </div>
                </div>
                <div className="bg-green-50 p-3 rounded">
                  <div className="text-sm font-medium">Total Amount</div>
                  <div className="text-xl font-bold text-green-700">
                    ₹{orderStats.totalAmount}
                  </div>
                </div>
                <div className="bg-yellow-50 p-3 rounded">
                  <div className="text-sm font-medium">Pending</div>
                  <div className="text-xl font-bold text-yellow-700">
                    {orderStats.pendingOrders}
                  </div>
                </div>
                <div className="bg-purple-50 p-3 rounded">
                  <div className="text-sm font-medium">Delivered</div>
                  <div className="text-xl font-bold text-purple-700">
                    {orderStats.deliveredOrders}
                  </div>
                </div>
              </div>
            )}

            {/* Orders Table */}
            <div className="overflow-x-auto">
              <table className="min-w-full bg-white border border-gray-200 rounded-lg">
                <thead className="bg-gray-100">
                  <tr>
                    <th className="px-3 py-2 text-left text-sm">Order Date</th>
                    <th className="px-3 py-2 text-left text-sm">
                      Delivery Date
                    </th>
                    <th className="px-3 py-2 text-left text-sm">Status</th>
                    <th className="px-3 py-2 text-left text-sm">Items</th>
                    <th className="px-3 py-2 text-left text-sm">Total</th>
                    <th className="px-3 py-2 text-left text-sm">
                      Final Amount
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {customerOrders.map((order: any, idx: number) => (
                    <tr key={idx} className="border-t hover:bg-gray-50">
                      <td className="px-3 py-2 text-sm">
                        {order.createdAt
                          ? new Date(order.createdAt).toLocaleDateString()
                          : "N/A"}
                      </td>
                      <td className="px-3 py-2 text-sm">
                        {order.deliveryDate
                          ? new Date(order.deliveryDate).toLocaleDateString()
                          : "-"}
                      </td>
                      <td className="px-3 py-2 text-sm">
                        <span
                          className={`px-2 py-1 rounded text-xs ${
                            order.status === "Delivered"
                              ? "bg-green-100 text-green-800"
                              : "bg-yellow-100 text-yellow-800"
                          }`}
                        >
                          {order.status}
                        </span>
                      </td>
                      <td className="px-3 py-2 text-sm">
                        <div className="max-w-xs">
                          {order.items
                            .slice(0, 3)
                            .map((item: any, i: number) => (
                              <div key={i} className="text-xs">
                                {item.name} ({item.quantity} {item.unit})
                              </div>
                            ))}
                          {order.items.length > 3 && (
                            <div className="text-xs text-gray-500">
                              +{order.items.length - 3} more items
                            </div>
                          )}
                        </div>
                      </td>
                      <td className="px-3 py-2 text-sm">
                        ₹{order.totalAmount || 0}
                      </td>
                      <td className="px-3 py-2 text-sm font-semibold">
                        ₹{order.finalAmount === 0 ? "Free" : order.finalAmount}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {customerOrders.length === 0 && (
              <div className="text-center py-8 text-gray-500">
                No orders found for this customer.
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
