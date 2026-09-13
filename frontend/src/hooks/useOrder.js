import { useState, useEffect, useCallback } from "react";

const API_BASE_URL = "http://localhost:5000/api";

export function useOrders(activeTab) {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(false);

  const fetchOrders = useCallback(async () => {
    try {
      const res = await fetch(`${API_BASE_URL}/orders`);
      const data = await res.json();
      if (data.success) setOrders(data.data);
    } catch (err) {
      console.error("Fetch orders error:", err);
    }
  }, []);

  const updateStatus = async (id, status) => {
    await fetch(`${API_BASE_URL}/orders/${id}/status`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status })
    });
    fetchOrders();
  };

  const deleteOrder = async (id) => {
    await fetch(`${API_BASE_URL}/orders/${id}`, { method: "DELETE" });
    fetchOrders();
  };

  // Real-Time Auto Polling (Kitchen Tab active hone par har 4 sec me refresh)
  useEffect(() => {
    if (activeTab === "kitchen") {
      fetchOrders();
      const interval = setInterval(fetchOrders, 4000);
      return () => clearInterval(interval);
    }
  }, [activeTab, fetchOrders]);

  return { orders, loading, fetchOrders, updateStatus, deleteOrder };
}