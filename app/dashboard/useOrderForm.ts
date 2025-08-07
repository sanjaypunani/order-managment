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

  useEffect(() => {
    async function fetchOrders() {
      setLoading(true);
      try {
        const res = await fetch("/api/orders");
        const data = await res.json();
        if (data.success) {
          setOrderList(
            data.orders.map((order: any) => ({
              customerNumber: order.customerNumber,
              flatNumber: order.flatNumber,
              socityName: order.socityName,
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
    }
    fetchOrders();
  }, []);

  const handleChange = (
    e: ChangeEvent<HTMLInputElement | HTMLSelectElement>
  ) => {
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
  const filteredOrders: any[] = orderList.filter((order) => {
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
  };
}
