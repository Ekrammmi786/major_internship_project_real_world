import React, { useState, useEffect } from "react";
import { useSearchParams } from "react-router-dom";
import { io } from "socket.io-client";
import Background3D from "../components/Background3D";

const socket = io("http://localhost:5000");

const playAddSound = () => {
  try {
    const ctx = new (window.AudioContext || window.webkitAudioContext)();
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = "sine";
    osc.frequency.setValueAtTime(523.25, ctx.currentTime);
    osc.frequency.exponentialRampToValueAtTime(880, ctx.currentTime + 0.1);
    gain.gain.setValueAtTime(0.12, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.1);
    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.start();
    osc.stop(ctx.currentTime + 0.1);
  } catch (err) {}
};

const CustomerView = () => {
  const [searchParams] = useSearchParams();
  const urlTable = searchParams.get("table") || "1";

  const [menuItems, setMenuItems] = useState([]);
  const [selectedCategory, setSelectedCategory] = useState("All");
  const [searchQuery, setSearchQuery] = useState("");
  const [tableNumber, setTableNumber] = useState(urlTable);
  const [cart, setCart] = useState([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [activeOrder, setActiveOrder] = useState(null);

  const fetchMenu = async () => {
    try {
      const res = await fetch("http://localhost:5000/api/menu");
      const data = await res.json();
      const list = data.success && Array.isArray(data.data) ? data.data : Array.isArray(data) ? data : [];
      setMenuItems(list);
    } catch (err) {
      console.error("Error fetching menu:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchMenu();

    socket.on("menu_updated", fetchMenu);
    socket.on("order_updated", (updatedOrder) => {
      if (activeOrder && (updatedOrder._id === activeOrder._id || updatedOrder.id === activeOrder.id)) {
        setActiveOrder(updatedOrder);
      }
    });

    return () => {
      socket.off("menu_updated");
      socket.off("order_updated");
    };
  }, [activeOrder]);

  const categories = ["All", ...new Set(menuItems.map((item) => item.category))];

  const filteredItems = menuItems.filter((item) => {
    const matchesCategory = selectedCategory === "All" || item.category === selectedCategory;
    const matchesSearch = item.name.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesCategory && matchesSearch;
  });

  const addToCart = (item) => {
    if (item.isAvailable === false) return;
    playAddSound();
    setCart((prevCart) => {
      const existing = prevCart.find((i) => i._id === item._id);
      if (existing) {
        return prevCart.map((i) => (i._id === item._id ? { ...i, quantity: i.quantity + 1 } : i));
      }
      return [...prevCart, { ...item, quantity: 1 }];
    });
  };

  const updateQuantity = (id, delta) => {
    playAddSound();
    setCart((prevCart) =>
      prevCart
        .map((item) => {
          if (item._id === id) {
            const newQty = item.quantity + delta;
            return newQty > 0 ? { ...item, quantity: newQty } : null;
          }
          return item;
        })
        .filter(Boolean)
    );
  };

  const cartTotal = cart.reduce((sum, item) => sum + item.price * item.quantity, 0);

  const handlePlaceOrder = async () => {
    if (cart.length === 0 || submitting) return;
    setSubmitting(true);
    playAddSound();

    const orderPayload = {
      tableNumber: Number(tableNumber),
      items: cart.map((i) => ({ name: i.name, price: i.price, quantity: i.quantity })),
      totalAmount: cartTotal,
      status: "Pending",
      createdAt: new Date().toISOString()
    };

    try {
      const res = await fetch("http://localhost:5000/api/orders", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(orderPayload)
      });
      const data = await res.json();

      if (res.ok && data.success) {
        setCart([]);
        setActiveOrder(data.data);
      }
    } catch (err) {
      console.error("Order submit error:", err);
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) return <div style={{ padding: "20px", textAlign: "center", color: "#1c1917", fontWeight: "600" }}>Loading Menu...</div>;

  return (
    <div style={{ position: "relative", minHeight: "100vh" }}>
      <Background3D />

      <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
        
        {/* Header Bar with Vibrant Contrast */}
        <div style={{ backgroundColor: "rgba(255, 255, 255, 0.92)", backdropFilter: "blur(10px)", padding: "12px", borderRadius: "14px", border: "1px solid #f5e6d3", boxShadow: "0 2px 10px rgba(0,0,0,0.04)" }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: "6px", marginBottom: "8px" }}>
            <div>
              <span style={{ fontSize: "10px", fontWeight: "800", color: "#dc2626", letterSpacing: "0.5px" }}>THE RICE BOWL • POS</span>
              <h2 style={{ fontSize: "14px", fontWeight: "800", color: "#1c1917", margin: 0 }}>Punjabi Recipes 🔥</h2>
            </div>

            <div style={{ display: "flex", alignItems: "center", gap: "4px", backgroundColor: "#faf6f0", padding: "4px 8px", borderRadius: "8px", border: "1px solid #f5e6d3" }}>
              <label style={{ fontSize: "11px", fontWeight: "700", color: "#44403c" }}>Table:</label>
              <select
                value={tableNumber}
                onChange={(e) => setTableNumber(e.target.value)}
                style={{ padding: "2px 4px", borderRadius: "4px", fontWeight: "800", fontSize: "12px", border: "1px solid #e7e5e4", color: "#1c1917", backgroundColor: "#fff" }}
              >
                {[1, 2, 3, 4, 5, 6, 7, 8].map((n) => (
                  <option key={n} value={n}>#{n}</option>
                ))}
              </select>
            </div>
          </div>

          <input
            type="text"
            placeholder="🔍 Search delicious dishes..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            style={{ width: "100%", padding: "8px 10px", borderRadius: "8px", border: "1px solid #e7e5e4", outline: "none", fontSize: "12px", color: "#1c1917", backgroundColor: "#faf6f0", marginBottom: "8px" }}
          />

          <div style={{ display: "flex", gap: "6px", overflowX: "auto", paddingBottom: "2px" }}>
            {categories.map((cat) => (
              <button
                key={cat}
                onClick={() => { playAddSound(); setSelectedCategory(cat); }}
                style={{
                  padding: "5px 12px",
                  borderRadius: "16px",
                  border: "none",
                  fontSize: "11px",
                  fontWeight: "700",
                  whiteSpace: "nowrap",
                  cursor: "pointer",
                  backgroundColor: selectedCategory === cat ? "#dc2626" : "#f5f5f4",
                  color: selectedCategory === cat ? "#ffffff" : "#44403c"
                }}
              >
                {cat}
              </button>
            ))}
          </div>
        </div>

        {/* Real-time Order Tracker */}
        {activeOrder && (
          <div style={{ backgroundColor: "#1c1917", color: "#fff", padding: "10px 14px", borderRadius: "12px", display: "flex", justifyContent: "space-between", alignItems: "center", boxShadow: "0 4px 12px rgba(0,0,0,0.15)" }}>
            <div>
              <span style={{ fontSize: "10px", color: "#a8a29e" }}>Active Session (Table #{activeOrder.tableNumber})</span>
              <div style={{ fontSize: "13px", fontWeight: "700", color: "#f59e0b" }}>
                Status: {activeOrder.status === "Pending" ? "⏳ Sent to Kitchen" : activeOrder.status === "Preparing" ? "🍳 Cooking in Progress" : "🍽️ Served at Table!"}
              </div>
            </div>
            {activeOrder.status === "Served" && (
              <button onClick={() => setActiveOrder(null)} style={{ padding: "5px 10px", backgroundColor: "#16a34a", color: "#fff", border: "none", borderRadius: "6px", fontSize: "11px", fontWeight: "700", cursor: "pointer" }}>
                Dismiss
              </button>
            )}
          </div>
        )}

        {/* Food Items Compact Grid */}
        <div className="responsive-grid">
          {filteredItems.map((item, index) => {
            const isOut = item.isAvailable === false;
            return (
              <div
                key={item._id}
                className="food-card-animated"
                style={{
                  animationDelay: `${(index % 4) * 0.3}s`,
                  backgroundColor: isOut ? "rgba(245, 245, 244, 0.9)" : "rgba(255, 255, 255, 0.95)",
                  backdropFilter: "blur(6px)",
                  borderRadius: "12px",
                  overflow: "hidden",
                  border: "1px solid #f5e6d3",
                  display: "flex",
                  flexDirection: "column",
                  opacity: isOut ? 0.65 : 1,
                  boxShadow: "0 2px 8px rgba(0,0,0,0.04)"
                }}
              >
                <img src={item.image || "https://images.unsplash.com/photo-1546833999-b9f581a1996d?w=500"} alt={item.name} style={{ width: "100%", height: "85px", objectFit: "cover" }} />
                <div style={{ padding: "8px", display: "flex", flexDirection: "column", flexGrow: 1 }}>
                  <h3 style={{ fontSize: "12px", fontWeight: "800", margin: "0 0 2px 0", color: "#1c1917", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
                    {item.name}
                  </h3>
                  <span style={{ fontSize: "10px", color: "#78716c", fontWeight: "500", marginBottom: "6px" }}>{item.category}</span>

                  <div style={{ marginTop: "auto", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                    <span style={{ fontSize: "13px", fontWeight: "800", color: "#dc2626" }}>₹{item.price}</span>
                    <button
                      disabled={isOut}
                      onClick={() => addToCart(item)}
                      style={{
                        padding: "3px 9px",
                        backgroundColor: isOut ? "#9ca3af" : "#dc2626",
                        color: "#ffffff",
                        border: "none",
                        borderRadius: "6px",
                        fontWeight: "800",
                        fontSize: "11px",
                        cursor: isOut ? "not-allowed" : "pointer"
                      }}
                    >
                      {isOut ? "Sold Out" : "+ Add"}
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        {/* Floating Cart */}
        {cart.length > 0 && (
          <div style={{ position: "sticky", bottom: "8px", backgroundColor: "#1c1917", color: "#ffffff", padding: "12px", borderRadius: "14px", zIndex: 40, boxShadow: "0 8px 25px rgba(0,0,0,0.3)" }}>
            <h4 style={{ margin: "0 0 8px 0", fontSize: "12px", fontWeight: "800" }}>🛒 Current Order (Table #{tableNumber})</h4>
            <div style={{ maxHeight: "80px", overflowY: "auto", marginBottom: "8px", display: "flex", flexDirection: "column", gap: "4px" }}>
              {cart.map((item) => (
                <div key={item._id} style={{ display: "flex", justifyContent: "space-between", fontSize: "11px", color: "#f5f5f4" }}>
                  <span style={{ whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis", maxWidth: "120px" }}>{item.name}</span>
                  <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
                    <button onClick={() => updateQuantity(item._id, -1)} style={{ backgroundColor: "#44403c", color: "#fff", border: "none", width: "18px", height: "18px", borderRadius: "4px", fontWeight: "700" }}>-</button>
                    <span style={{ fontWeight: "700" }}>{item.quantity}</span>
                    <button onClick={() => updateQuantity(item._id, 1)} style={{ backgroundColor: "#44403c", color: "#fff", border: "none", width: "18px", height: "18px", borderRadius: "4px", fontWeight: "700" }}>+</button>
                    <span style={{ fontWeight: "800", marginLeft: "4px", color: "#f59e0b" }}>₹{item.price * item.quantity}</span>
                  </div>
                </div>
              ))}
            </div>

            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", borderTop: "1px solid #44403c", paddingTop: "8px" }}>
              <div>
                <span style={{ fontSize: "10px", color: "#a8a29e" }}>Total Bill</span>
                <div style={{ fontSize: "16px", fontWeight: "800", color: "#f59e0b" }}>₹{cartTotal}</div>
              </div>
              <button
                disabled={submitting}
                onClick={handlePlaceOrder}
                style={{ padding: "8px 16px", backgroundColor: "#dc2626", color: "#ffffff", border: "none", borderRadius: "8px", fontWeight: "800", fontSize: "12px", cursor: submitting ? "not-allowed" : "pointer" }}
              >
                {submitting ? "Placing..." : "Place Order 🚀"}
              </button>
            </div>
          </div>
        )}

      </div>
    </div>
  );
};

export default CustomerView;