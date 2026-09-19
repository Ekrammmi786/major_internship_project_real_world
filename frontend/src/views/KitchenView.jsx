import React, { useState, useEffect } from "react";
import { io } from "socket.io-client";

const BACKEND_URL = import.meta.env.VITE_BACKEND_URL || "https://rice-bowl-ordering-app.onrender.com";

const socket = io(BACKEND_URL, {
  transports: ["websocket", "polling"],
  withCredentials: true
});

const KitchenView = () => {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState("Active");

  const fetchOrders = async () => {
    try {
      const res = await fetch(`${BACKEND_URL}/api/orders`);
      const data = await res.json();
      const list = data.success && Array.isArray(data.data) ? data.data : Array.isArray(data) ? data : [];
      setOrders(list);
    } catch (err) {
      console.error("Error fetching kitchen orders:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchOrders();

    socket.on("order_updated", fetchOrders);
    return () => socket.off("order_updated", fetchOrders);
  }, []);

  const updateOrderStatus = async (orderId, newStatus) => {
    try {
      let res = await fetch(`${BACKEND_URL}/api/orders/${orderId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: newStatus })
      });

      if (!res.ok) {
        res = await fetch(`${BACKEND_URL}/api/orders/${orderId}`, {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ status: newStatus })
        });
      }

      socket.emit("order_updated");
      fetchOrders();
    } catch (err) {
      console.error("Error updating status:", err);
    }
  };

  const filteredOrders = orders.filter((o) => {
    if (activeTab === "Active") return ["Pending", "Preparing", "Ready"].includes(o.status);
    if (activeTab === "Served") return o.status === "Served";
    if (activeTab === "Cancelled") return o.status === "Cancelled";
    return true;
  });

  if (loading) {
    return (
      <div style={{ backgroundColor: "#090a0f", minHeight: "100vh", padding: "20px", color: "#fff", textAlign: "center" }}>
        Loading Kitchen Display System...
      </div>
    );
  }

  return (
    <div style={{ backgroundColor: "#090a0f", minHeight: "100vh", padding: "20px", fontFamily: "sans-serif", color: "#ffffff" }}>
      
      {/* Top Header */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "20px", flexWrap: "wrap", gap: "12px" }}>
        <div>
          <h1 style={{ margin: 0, fontSize: "22px", fontWeight: "900", color: "#ef4444", display: "flex", alignItems: "center", gap: "8px" }}>
            👨‍🍳 Kitchen Display System ({orders.filter(o => ["Pending", "Preparing", "Ready"].includes(o.status)).length} Active)
          </h1>
          <span style={{ fontSize: "12px", color: "#94a3b8" }}>Real-time Kitchen Operations Queue</span>
        </div>

        <div style={{ display: "flex", gap: "8px" }}>
          {["Active", "Served", "Cancelled"].map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              style={{
                padding: "8px 16px", borderRadius: "8px", border: "none", fontWeight: "800", fontSize: "12px", cursor: "pointer",
                backgroundColor: activeTab === tab ? "#dc2626" : "#1e293b",
                color: activeTab === tab ? "#ffffff" : "#94a3b8"
              }}
            >
              {tab} Queue ({orders.filter(o => tab === "Active" ? ["Pending", "Preparing", "Ready"].includes(o.status) : o.status === tab).length})
            </button>
          ))}
        </div>
      </div>

      {/* Orders Grid */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(290px, 1fr))", gap: "16px" }}>
        {filteredOrders.length === 0 ? (
          <div style={{ padding: "40px", backgroundColor: "#1e293b", borderRadius: "14px", gridColumn: "1/-1", textAlign: "center", color: "#94a3b8", fontWeight: "700" }}>
            No orders in {activeTab} queue.
          </div>
        ) : (
          filteredOrders.map((order) => {
            const targetId = order._id || order.id;
            const displayTableNo = order.tableNumber || order.table || order.tableNo || "N/A";

            const isPending = order.status === "Pending";
            const isPreparing = order.status === "Preparing";
            const isReady = order.status === "Ready";
            const isCancelled = order.status === "Cancelled";

            return (
              <div
                key={targetId}
                style={{
                  backgroundColor: "#ffffff",
                  borderRadius: "14px",
                  overflow: "hidden",
                  boxShadow: "0 8px 20px rgba(0,0,0,0.4)",
                  display: "flex",
                  flexDirection: "column",
                  border: isCancelled ? "3px solid #ef4444" : isPreparing ? "3px solid #f59e0b" : isReady ? "3px solid #0284c7" : "1px solid #e2e8f0"
                }}
              >
                {/* 🔴 HIGH CONTRAST TABLE HEADER */}
                <div style={{
                  backgroundColor: isCancelled ? "#991b1b" : "#dc2626",
                  padding: "10px 14px",
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "center"
                }}>
                  <span style={{ fontSize: "18px", fontWeight: "900", color: "#ffffff", letterSpacing: "0.5px" }}>
                    🍽️ TABLE #{displayTableNo}
                  </span>
                  
                  <span style={{
                    fontSize: "11px",
                    fontWeight: "900",
                    padding: "4px 8px",
                    borderRadius: "6px",
                    backgroundColor: "#ffffff",
                    color: isCancelled ? "#dc2626" : isPreparing ? "#d97706" : isReady ? "#0284c7" : "#dc2626"
                  }}>
                    {order.status}
                  </span>
                </div>

                {/* Items List */}
                <div style={{ padding: "14px", flexGrow: 1, color: "#0f172a" }}>
                  <ul style={{ paddingLeft: "0px", listStyle: "none", margin: 0, fontSize: "14px", display: "flex", flexDirection: "column", gap: "8px" }}>
                    {order.items?.map((item, idx) => {
                      const isItemCancelled = item.status === "Cancelled" || isCancelled;
                      return (
                        <li 
                          key={idx} 
                          style={{ 
                            padding: "6px 8px",
                            borderRadius: "6px",
                            backgroundColor: isItemCancelled ? "#fef2f2" : "#f8fafc",
                            border: isItemCancelled ? "1px dashed #fca5a5" : "1px solid #f1f5f9",
                            textDecoration: isItemCancelled ? "line-through" : "none", 
                            color: isItemCancelled ? "#dc2626" : "#0f172a",
                            opacity: isItemCancelled ? 0.75 : 1 
                          }}
                        >
                          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                            <span style={{ fontWeight: isItemCancelled ? "600" : "700" }}>
                              {item.name} {isItemCancelled && <strong style={{ fontSize: "10px", color: "#dc2626", marginLeft: "4px" }}>[CANCELLED]</strong>}
                            </span>
                            <span style={{ fontWeight: "900", color: isItemCancelled ? "#dc2626" : "#0284c7" }}>
                              ×{item.quantity}
                            </span>
                          </div>
                        </li>
                      );
                    })}
                  </ul>
                </div>

                {/* Action Controls */}
                {!isCancelled && (
                  <div style={{ padding: "12px", backgroundColor: "#f8fafc", borderTop: "1px solid #e2e8f0" }}>
                    {isPending && (
                      <button
                        onClick={() => updateOrderStatus(targetId, "Preparing")}
                        style={{ width: "100%", padding: "10px", backgroundColor: "#0284c7", color: "#ffffff", border: "none", borderRadius: "8px", fontWeight: "900", fontSize: "13px", cursor: "pointer" }}
                      >
                        👨‍🍳 Start Cooking
                      </button>
                    )}

                    {isPreparing && (
                      <button
                        onClick={() => updateOrderStatus(targetId, "Ready")}
                        style={{ width: "100%", padding: "10px", backgroundColor: "#f59e0b", color: "#ffffff", border: "none", borderRadius: "8px", fontWeight: "900", fontSize: "13px", cursor: "pointer" }}
                      >
                        🔔 Ready to Serve
                      </button>
                    )}

                    {isReady && (
                      <button
                        onClick={() => updateOrderStatus(targetId, "Served")}
                        style={{ width: "100%", padding: "10px", backgroundColor: "#16a34a", color: "#ffffff", border: "none", borderRadius: "8px", fontWeight: "900", fontSize: "13px", cursor: "pointer" }}
                      >
                        ✅ Mark as Served
                      </button>
                    )}
                  </div>
                )}
              </div>
            );
          })
        )}
      </div>
    </div>
  );
};

export default KitchenView;