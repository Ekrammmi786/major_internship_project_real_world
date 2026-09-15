import React, { useState, useEffect, useRef } from "react";

// 🔔 Loud Kitchen Alarm Chime (Web Audio API)
const playKitchenBell = () => {
  try {
    const ctx = new (window.AudioContext || window.webkitAudioContext)();
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();

    osc.type = "triangle";
    osc.frequency.setValueAtTime(880, ctx.currentTime);
    osc.frequency.setValueAtTime(1760, ctx.currentTime + 0.15);

    gain.gain.setValueAtTime(0.3, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.6);

    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.start();
    osc.stop(ctx.currentTime + 0.6);
  } catch (err) {}
};

const KitchenView = () => {
  const [orders, setOrders] = useState([]);
  const [history, setHistory] = useState([]);
  const [showHistory, setShowHistory] = useState(false);
  const [checkedItems, setCheckedItems] = useState({});
  const [loading, setLoading] = useState(true);
  const prevOrderCountRef = useRef(0);

  const fetchOrders = async () => {
    try {
      const res = await fetch("https://rice-bowl-ordering-app.onrender.com/api/orders");
      const data = await res.json();
      const rawList = data.success && Array.isArray(data.data) ? data.data : Array.isArray(data) ? data : [];
      
      const active = rawList.filter((o) => o.status !== "Paid" && o.status !== "Served");
      const past = rawList.filter((o) => o.status === "Served");

      // Naya order aane par bell bajao
      if (active.length > prevOrderCountRef.current && prevOrderCountRef.current !== 0) {
        playKitchenBell();
      }
      prevOrderCountRef.current = active.length;

      setOrders(active);
      setHistory(past);
    } catch (err) {
      console.error("Fetch Error:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchOrders();
    const interval = setInterval(fetchOrders, 4000);
    return () => clearInterval(interval);
  }, []);

  const updateStatus = async (orderId, newStatus) => {
    try {
      const res = await fetch(`http://localhost:5000/api/orders/${orderId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: newStatus }),
      });
      if (res.ok) fetchOrders();
    } catch (err) {
      console.error("Status Update Error:", err);
    }
  };

  // Item Cross-Off Toggle
  const toggleItemCheck = (orderId, itemIndex) => {
    const key = `${orderId}-${itemIndex}`;
    setCheckedItems((prev) => ({ ...prev, [key]: !prev[key] }));
  };

  // Live Elapsed Time Calculator
  const getTimerData = (createdAt) => {
    if (!createdAt) return { text: "0m", color: "#16a34a", isCritical: false };
    const elapsedSec = Math.floor((Date.now() - new Date(createdAt).getTime()) / 1000);
    const mins = Math.floor(elapsedSec / 60);
    const secs = elapsedSec % 60;
    const formatted = `${mins}m ${secs < 10 ? "0" : ""}${secs}s`;

    if (mins >= 12) return { text: formatted, color: "#dc2626", isCritical: true }; // Delayed Red
    if (mins >= 6) return { text: formatted, color: "#d97706", isCritical: false }; // Warning Amber
    return { text: formatted, color: "#16a34a", isCritical: false }; // Fresh Green
  };

  if (loading) return <div style={{ padding: "20px", color: "#78716c" }}>Loading Kitchen System...</div>;

  return (
    <div style={{ padding: "12px", fontFamily: "sans-serif" }}>
      
      {/* KDS Header & History Toggle */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "14px", flexWrap: "wrap", gap: "10px" }}>
        <div>
          <h2 style={{ color: "#dc2626", margin: 0, fontSize: "18px", fontWeight: "700" }}>
            👨‍🍳 Kitchen Display System ({orders.length} Active)
          </h2>
          <span style={{ fontSize: "11px", color: "#78716c" }}>Real-time Kitchen Operations</span>
        </div>

        <button
          onClick={() => setShowHistory(!showHistory)}
          style={{
            padding: "6px 12px",
            backgroundColor: showHistory ? "#dc2626" : "#44403c",
            color: "#fff",
            border: "none",
            borderRadius: "6px",
            fontSize: "12px",
            fontWeight: "700",
            cursor: "pointer"
          }}
        >
          {showHistory ? "⬅️ Back to Active Orders" : `📜 Order History (${history.length})`}
        </button>
      </div>

      {/* 📜 History View (Undo Accidental Clicks) */}
      {showHistory ? (
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(240px, 1fr))", gap: "10px" }}>
          {history.map((order) => (
            <div key={order._id} style={{ backgroundColor: "#ffffff", padding: "12px", borderRadius: "10px", border: "1px solid #e7e5e4" }}>
              <div style={{ display: "flex", justifyContent: "space-between" }}>
                <h4 style={{ margin: 0 }}>Table #{order.tableNumber}</h4>
                <span style={{ fontSize: "11px", color: "#16a34a", fontWeight: "700" }}>SERVED</span>
              </div>
              <ul style={{ paddingLeft: "16px", fontSize: "12px", margin: "8px 0" }}>
                {order.items?.map((item, idx) => (
                  <li key={idx}>{item.name} × {item.quantity}</li>
                ))}
              </ul>
              <button
                onClick={() => updateStatus(order._id, "Preparing")}
                style={{ width: "100%", padding: "5px", backgroundColor: "#f59e0b", color: "#fff", border: "none", borderRadius: "4px", fontSize: "11px", fontWeight: "700", cursor: "pointer" }}
              >
                ↩️ Recall to Kitchen
              </button>
            </div>
          ))}
        </div>
      ) : (
        /* 🍳 Active Orders Grid */
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(260px, 1fr))", gap: "12px" }}>
          {orders.map((order) => {
            const timer = getTimerData(order.createdAt);
            return (
              <div
                key={order._id || order.id}
                style={{
                  backgroundColor: "#ffffff",
                  borderRadius: "12px",
                  padding: "12px",
                  border: `2px solid ${timer.color}`,
                  boxShadow: timer.isCritical ? "0 0 12px rgba(220, 38, 38, 0.4)" : "0 2px 8px rgba(0,0,0,0.03)",
                  display: "flex",
                  flexDirection: "column",
                  position: "relative"
                }}
              >
                {/* Table Header & SLA Stopwatch */}
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", borderBottom: "1px solid #f5e6d3", paddingBottom: "6px", marginBottom: "8px" }}>
                  <h3 style={{ margin: 0, fontSize: "16px", fontWeight: "700" }}>Table #{order.tableNumber}</h3>
                  <span style={{ fontSize: "12px", fontWeight: "700", color: timer.color, backgroundColor: "#faf6f0", padding: "2px 6px", borderRadius: "4px" }}>
                    ⏱️ {timer.text}
                  </span>
                </div>

                {/* Item-wise Cook Checkbox */}
                <ul style={{ listStyle: "none", padding: 0, margin: "0 0 12px 0", flexGrow: 1 }}>
                  {order.items?.map((item, idx) => {
                    const isChecked = !!checkedItems[`${order._id}-${idx}`];
                    return (
                      <li
                        key={idx}
                        onClick={() => toggleItemCheck(order._id, idx)}
                        style={{
                          padding: "5px 6px",
                          borderRadius: "4px",
                          marginBottom: "4px",
                          cursor: "pointer",
                          backgroundColor: isChecked ? "#f5f5f4" : "transparent",
                          textDecoration: isChecked ? "line-through" : "none",
                          color: isChecked ? "#a8a29e" : "#1c1917",
                          fontSize: "13px",
                          display: "flex",
                          alignItems: "center",
                          gap: "8px"
                        }}
                      >
                        <input type="checkbox" checked={isChecked} readOnly style={{ cursor: "pointer" }} />
                        <span style={{ fontWeight: isChecked ? "400" : "700" }}>{item.name}</span>
                        <span style={{ marginLeft: "auto", fontWeight: "700" }}>×{item.quantity}</span>
                      </li>
                    );
                  })}
                </ul>

                {/* Status Action Buttons */}
                <div style={{ marginTop: "auto", display: "flex", gap: "6px" }}>
                  {order.status === "Pending" && (
                    <button
                      onClick={() => updateStatus(order._id || order.id, "Preparing")}
                      style={{ width: "100%", padding: "8px", backgroundColor: "#0284c7", color: "#fff", border: "none", borderRadius: "6px", fontWeight: "700", fontSize: "12px", cursor: "pointer" }}
                    >
                      Start Cooking 🍳
                    </button>
                  )}
                  {order.status === "Preparing" && (
                    <button
                      onClick={() => updateStatus(order._id || order.id, "Served")}
                      style={{ width: "100%", padding: "8px", backgroundColor: "#16a34a", color: "#fff", border: "none", borderRadius: "6px", fontWeight: "700", fontSize: "12px", cursor: "pointer" }}
                    >
                      Mark Served 🍽️
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};

export default KitchenView;