import { useState, useEffect, ChangeEvent, FormEvent } from "react";

export function useOrderForm() {
  const [showModal, setShowModal] = useState(false);
  const [orderList, setOrderList] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [editOrderId, setEditOrderId] = useState<string | null>(null);
  const [form, setForm] = useState({
    customerNumber: "",
    flatNumber: "",
    socityName: "",
    customerName: "",
    status: "Pending",
    discount: "",
    deliveryDate: "",
    items: [
      {
        name: "",
        quantity: "",
        unit: "KG",
        price: "",
      },
    ],
  });
  const [filterDeliveryDate, setFilterDeliveryDate] = useState<string>("");
  const [filterSocityName, setFilterSocityName] = useState<string>("");
  const [customerSearchLoading, setCustomerSearchLoading] = useState(false);
  const [searchedCustomer, setSearchedCustomer] = useState<any>(null);
  const [searchedCustomers, setSearchedCustomers] = useState<any[]>([]);

  useEffect(() => {
    async function fetchOrders() {
      setLoading(true);
      try {
        const res = await fetch("/api/orders");
        const data = await res.json();
        if (data.success && Array.isArray(data.orders)) {
          setOrderList(
            data.orders.map((order: any) => ({
              customerNumber: order.customerNumber,
              flatNumber: order.flatNumber,
              socityName: order.socityName,
              customerName: order.customerName || "",
              status: order.status,
              discount: order.discount,
              totalAmount: order.totalAmount,
              finalAmount: order.finalAmount,
              items: order.items || order.OrderItems || order.order_items || [],
              deliveryDate: order.deliveryDate,
              delivery_day: order.delivery_day,
              order_month: order.order_month,
              order_year: order.order_year,
              week_of_month: order.week_of_month,
              _id: order._id,
            }))
          );
        }
      } catch (err) {
        console.error("Error fetching orders:", err);
        setOrderList([]); // Set to empty array on error
      }
      setLoading(false);
    }
    fetchOrders();
  }, []);

  const handleChange = (
    e: ChangeEvent<HTMLInputElement | HTMLSelectElement>
  ) => {
    // Clear searched customer when mobile number is manually changed
    if (e.target.name === "customerNumber") {
      setSearchedCustomer(null);
      setSearchedCustomers([]);
    }
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleItemChange = (
    idx: number,
    e: ChangeEvent<HTMLInputElement | HTMLSelectElement>
  ) => {
    const items = [...form.items];
    const name = e.target.name as keyof (typeof items)[0];
    items[idx][name] = e.target.value;
    setForm({ ...form, items });
  };

  const addItem = () => {
    setForm({
      ...form,
      items: [
        ...form.items,
        {
          name: "",
          quantity: "",
          unit: "KG",
          price: "",
        },
      ],
    });
  };

  const deleteOrder = async (orderId: string) => {
    setLoading(true);
    await fetch("/api/orders", {
      method: "DELETE",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ orderId }),
    });
    const res = await fetch("/api/orders");
    const data = await res.json();
    if (data.success) {
      setOrderList(
        data.orders.map((order: any) => ({
          customerNumber: order.customerNumber,
          flatNumber: order.flatNumber,
          socityName: order.socityName,
          customerName: order.customerName || "",
          status: order.status,
          discount: order.discount,
          totalAmount: order.totalAmount,
          finalAmount: order.finalAmount,
          items: order.OrderItems || order.order_items || [],
          _id: order._id,
        }))
      );
    }
    setLoading(false);
  };

  const startEditOrder = (order: any) => {
    setForm({
      customerNumber: order.customerNumber,
      flatNumber: order.flatNumber,
      socityName: order.socityName,
      customerName: order.customerName || "",
      status: order.status,
      discount: order.discount,
      deliveryDate: order.deliveryDate,
      items:
        order.items && order.items.length > 0
          ? order.items.map((item: any) => ({
              name: item.name,
              quantity: item.quantity,
              unit: item.unit || "KG",
              price: item.price,
            }))
          : [],
    });
    setShowModal(true);
    setEditOrderId(order._id);
  };

  const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    // Calculate delivery fields
    const deliveryDate = form.deliveryDate ? new Date(form.deliveryDate) : null;
    let delivery_day = "";
    let order_month = "";
    let order_year = "";
    let week_of_month = 0;
    if (deliveryDate) {
      const days = [
        "Sunday",
        "Monday",
        "Tuesday",
        "Wednesday",
        "Thursday",
        "Friday",
        "Saturday",
      ];
      delivery_day = days[deliveryDate.getDay()];
      order_month = deliveryDate.toLocaleString("default", { month: "long" });
      order_year = deliveryDate.getFullYear().toString();
      const firstDay = new Date(
        deliveryDate.getFullYear(),
        deliveryDate.getMonth(),
        1
      );
      const date = deliveryDate.getDate();
      week_of_month = Math.ceil((date + firstDay.getDay()) / 7);
    }
    const items = form.items.map((item) => ({
      name: item.name,
      quantity: Number(item.quantity),
      unit: item.unit,
      price: Number(item.price),
    }));
    const totalAmount = items.reduce((sum, item) => sum + item.price, 0);
    const discount = Number(form.discount) || 0;
    const finalAmount = totalAmount - discount < 0 ? 0 : totalAmount - discount;
    const orderPayload = {
      customerNumber: form.customerNumber,
      flatNumber: form.flatNumber,
      socityName: form.socityName,
      customerName: form.customerName,
      status: form.status,
      discount,
      totalAmount,
      finalAmount,
      items,
      deliveryDate: form.deliveryDate,
      delivery_day,
      order_month,
      order_year,
      week_of_month,
    };

    // For new orders, check if customer exists and create if needed
    if (!editOrderId) {
      const customerExists = await fetch(
        `/api/customers?mobileNumber=${form.customerNumber}`
      );
      const customerData = await customerExists.json();

      if (!customerData.success || !customerData.customer) {
        // Customer doesn't exist, create one
        await createCustomerFromOrder(orderPayload);
      }
    }

    if (editOrderId) {
      await fetch("/api/orders", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ orderId: editOrderId, ...orderPayload }),
      });
    } else {
      await fetch("/api/orders", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(orderPayload),
      });
    }
    setShowModal(false);
    setForm({
      customerNumber: "",
      flatNumber: "",
      socityName: "",
      customerName: "",
      status: "Pending",
      discount: "",
      deliveryDate: "",
      items: [
        {
          name: "",
          quantity: "",
          unit: "KG",
          price: "",
        },
      ],
    });
    setEditOrderId(null);
    setLoading(true);
    // Always refresh table data from API after add/edit
    try {
      const res = await fetch("/api/orders");
      const data = await res.json();
      if (data.success) {
        setOrderList(
          data.orders.map((order: any) => ({
            customerNumber: order.customerNumber,
            flatNumber: order.flatNumber,
            socityName: order.socityName,
            customerName: order.customerName || "",
            status: order.status,
            discount: order.discount,
            totalAmount: order.totalAmount,
            finalAmount: order.finalAmount,
            items: order.items || order.OrderItems || order.order_items || [],
            deliveryDate: order.deliveryDate,
            delivery_day: order.delivery_day,
            order_month: order.order_month,
            order_year: order.order_year,
            week_of_month: order.week_of_month,
            _id: order._id,
          }))
        );
      }
    } catch (err) {}
    setLoading(false);
  };

  // Filtered order list based on filters
  const filteredOrders: any[] = (orderList || []).filter((order) => {
    const matchDate = filterDeliveryDate
      ? order.deliveryDate === filterDeliveryDate
      : true;
    const matchSocity = filterSocityName
      ? order.socityName === filterSocityName
      : true;
    return matchDate && matchSocity;
  });

  // Dashboard stats based on filtered orders
  const dashboardStats: {
    totalOrders: number;
    totalSales: number;
    totalDiscount: number;
    pendingOrders: number;
    deliveredOrders: number;
  } = {
    totalOrders: filteredOrders.length,
    totalSales: filteredOrders.reduce(
      (sum: number, order: any) => sum + (order.finalAmount || 0),
      0
    ),
    totalDiscount: filteredOrders.reduce(
      (sum: number, order: any) => sum + (order.discount || 0),
      0
    ),
    pendingOrders: filteredOrders.filter(
      (order: any) => order.status === "Pending"
    ).length,
    deliveredOrders: filteredOrders.filter(
      (order: any) => order.status === "Delivered"
    ).length,
  };

  // Customer search functions
  const searchCustomerByMobile = async (mobileNumber: string) => {
    if (!mobileNumber) return;
    setCustomerSearchLoading(true);
    try {
      // Extract just the mobile number part, removing country code if present
      let cleanNumber = mobileNumber;
      if (mobileNumber.startsWith("+91")) {
        cleanNumber = mobileNumber.substring(3);
      } else if (mobileNumber.startsWith("91") && mobileNumber.length > 10) {
        cleanNumber = mobileNumber.substring(2);
      }

      const response = await fetch(
        `/api/customers?mobileNumber=${cleanNumber}`
      );
      const data = await response.json();
      if (data.success && data.customers && data.customers.length > 0) {
        setSearchedCustomers(data.customers);
        // Don't auto-select the first customer, wait for user to explicitly select
        if (data.customers.length === 1) {
          setSearchedCustomer(data.customers[0]); // For UI feedback only
        } else {
          setSearchedCustomer(null); // Don't auto-select when multiple customers
        }
        // Don't auto-populate form fields here to avoid infinite loop
        // The OrderFormModal will handle this in its useEffect
      } else {
        setSearchedCustomer(null);
        setSearchedCustomers([]);
      }
    } catch (error) {
      console.error("Error searching customer:", error);
      setSearchedCustomer(null);
      setSearchedCustomers([]);
    } finally {
      setCustomerSearchLoading(false);
    }
  };

  const searchCustomerByFlat = async (flatNumber: string) => {
    if (!flatNumber) return;
    setCustomerSearchLoading(true);
    try {
      const response = await fetch(`/api/customers?flatNumber=${flatNumber}`);
      const data = await response.json();
      if (data.success && data.customers && data.customers.length > 0) {
        const customer = data.customers[0]; // Take first match
        setSearchedCustomer(customer);
        // Don't auto-populate form fields here to avoid infinite loop
        // The OrderFormModal will handle this in its useEffect
      } else {
        setSearchedCustomer(null);
      }
    } catch (error) {
      console.error("Error searching customer:", error);
      setSearchedCustomer(null);
    } finally {
      setCustomerSearchLoading(false);
    }
  };

  const createCustomerFromOrder = async (orderData: any) => {
    try {
      // Parse the customer number to separate country code and mobile number
      const fullNumber = orderData.customerNumber;
      let countryCode = "+91";
      let mobileNumber = fullNumber;

      if (fullNumber.startsWith("+91")) {
        countryCode = "+91";
        mobileNumber = fullNumber.substring(3);
      } else if (fullNumber.startsWith("91") && fullNumber.length > 10) {
        countryCode = "+91";
        mobileNumber = fullNumber.substring(2);
      }

      const customerData = {
        countryCode: countryCode,
        mobileNumber: mobileNumber,
        flatNumber: orderData.flatNumber,
        societyName: orderData.socityName,
        customerName: orderData.customerName || "",
        address: `${orderData.flatNumber}, ${orderData.socityName}`,
      };

      const response = await fetch("/api/customers", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(customerData),
      });

      const data = await response.json();
      return data.success;
    } catch (error) {
      console.error("Error creating customer:", error);
      return false;
    }
  };

  const clearSearchedCustomer = () => {
    setSearchedCustomer(null);
    setSearchedCustomers([]);
  };

  const selectCustomerFromSearch = (customer: any) => {
    setSearchedCustomer(customer);
    setSearchedCustomers([customer]); // Keep only the selected customer in the list

    // Update the form with the selected customer's mobile number
    setForm((prevForm) => ({
      ...prevForm,
      customerNumber: `${customer.countryCode || "+91"}${
        customer.mobileNumber
      }`,
      customerName: customer.customerName || prevForm.customerName,
      flatNumber: customer.flatNumber || prevForm.flatNumber,
      socityName: customer.societyName || prevForm.socityName,
    }));
  };

  return {
    showModal,
    setShowModal,
    orderList,
    setOrderList,
    loading,
    setLoading,
    form,
    setForm,
    handleChange,
    handleItemChange,
    addItem,
    handleSubmit,
    deleteOrder,
    startEditOrder,
    editOrderId,
    setEditOrderId,
    filterDeliveryDate,
    setFilterDeliveryDate,
    filterSocityName,
    setFilterSocityName,
    filteredOrders,
    dashboardStats,
    customerSearchLoading,
    searchedCustomer,
    searchedCustomers,
    searchCustomerByMobile,
    searchCustomerByFlat,
    createCustomerFromOrder,
    clearSearchedCustomer,
    selectCustomerFromSearch,
  };
}
