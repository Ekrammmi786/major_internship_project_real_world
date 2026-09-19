import React, { useState, useEffect } from "react";
import { useSearchParams } from "react-router-dom";
import { io } from "socket.io-client";
import { motion, AnimatePresence } from "framer-motion";
import { 
  ChevronUp, Utensils, Sparkles, Flame, 
  BellRing, Download, X, Lock, AlertTriangle 
} from "lucide-react";
import Background3D from "../components/Background3D";

const BACKEND_URL = import.meta.env.VITE_BACKEND_URL || "https://rice-bowl-ordering-app.onrender.com";

const socket = io(BACKEND_URL, {
  transports: ["websocket", "polling"],
  withCredentials: true
});

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

// 🏁 BILL SUMMARY MODAL
const EndMealModal = ({ tableNumber, tableOrders, sessionOrderIds, onClose, onResetSession }) => {
  const [billRequested, setBillRequested] = useState(false);

  const unpaidOrders = (tableOrders || []).filter((o) =>
    ["Pending", "Preparing", "Ready", "Served"].includes(o.status)
  );

  const paidSessionOrders = (tableOrders || []).filter((o) =>
    o.status === "Paid" && sessionOrderIds.includes(o._id || o.id)
  );

  const isPaid = unpaidOrders.length === 0 && paidSessionOrders.length > 0;
  const currentSessionOrders = unpaidOrders.length > 0 ? unpaidOrders : paidSessionOrders;

  const activeItems = currentSessionOrders
    .filter((o) => o.status !== "Cancelled")
    .flatMap((o) => o.items || [])
    .filter((i) => i.status !== "Cancelled");

  const subtotal = activeItems.reduce((sum, item) => sum + item.price * item.quantity, 0);
  const cgst = Number((subtotal * 0.025).toFixed(2));
  const sgst = Number((subtotal * 0.025).toFixed(2));
  const grandTotal = Math.round(subtotal + cgst + sgst);

  const handleRequestBill = () => {
    socket.emit("request_bill", { tableNumber, totalAmount: grandTotal });
    setBillRequested(true);
    alert(`Table #${tableNumber} cashier ko notification bhej di gayi hai!`);
  };

  const handleDownloadReceipt = () => {
    if (!isPaid) return;

    const printWindow = window.open("", "_blank");
    printWindow.document.write(`
      <html>
        <head>
          <title>Tax Invoice - Table ${tableNumber}</title>
          <style>
            body { font-family: 'Courier New', monospace; width: 280px; margin: 0 auto; padding: 12px; color: #000; }
            .center { text-align: center; }
            .dash { border-bottom: 1px dashed #000; margin: 8px 0; }
            .flex { display: flex; justify-content: space-between; font-size: 12px; margin: 4px 0; }
            .total { font-weight: bold; font-size: 14px; margin-top: 6px; }
            @media print { body { width: 100%; } }
          </style>
        </head>
        <body>
          <div class="center">
            <h2 style="margin:0;">THE RICE BOWL</h2>
            <p style="margin:2px 0; font-size:11px;">Authentic Gourmet Bowls</p>
            <p style="margin:2px 0; font-size:11px;">Table #${tableNumber} | Date: ${new Date().toLocaleDateString()} ${new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</p>
          </div>
          <div class="dash"></div>
          ${activeItems.map(item => `
            <div class="flex">
              <span>${item.name} x${item.quantity}</span>
              <span>₹${item.price * item.quantity}</span>
            </div>
          `).join("")}
          <div class="dash"></div>
          <div class="flex"><span>Subtotal</span><span>₹${subtotal}</span></div>
          <div class="flex"><span>CGST (2.5%)</span><span>₹${cgst}</span></div>
          <div class="flex"><span>SGST (2.5%)</span><span>₹${sgst}</span></div>
          <div class="dash"></div>
          <div class="flex total"><span>Grand Total</span><span>₹${grandTotal}</span></div>
          <div class="dash"></div>
          <div class="center" style="font-size:11px; margin-top:12px;">
            <p>Thank you for dining with us! 🙏</p>
          </div>
        </body>
      </html>
    `);
    printWindow.document.close();
    printWindow.focus();
    setTimeout(() => printWindow.print(), 250);
  };

  return (
    <div style={{ position: "fixed", inset: 0, backgroundColor: "rgba(0,0,0,0.8)", zIndex: 1000, display: "flex", justifyContent: "center", alignItems: "center", padding: "16px", backdropFilter: "blur(6px)" }}>
      <div style={{ backgroundColor: "#ffffff", borderRadius: "20px", width: "100%", maxWidth: "400px", padding: "20px", position: "relative", boxShadow: "0 10px 30px rgba(0,0,0,0.3)" }}>
        
        <button onClick={onClose} style={{ position: "absolute", top: "16px", right: "16px", border: "none", backgroundColor: "#f5f5f4", borderRadius: "50%", padding: "6px", cursor: "pointer" }}>
          <X size={18} color="#44403c" />
        </button>

        <div style={{ textAlign: "center", marginBottom: "14px" }}>
          <h3 style={{ margin: "0 0 6px 0", fontSize: "18px", fontWeight: "900", color: "#1c1917" }}>
            🧾 Table #{tableNumber} Bill Summary
          </h3>
          
          <div style={{
            display: "inline-block", padding: "4px 14px", borderRadius: "20px", fontSize: "11px", fontWeight: "800",
            backgroundColor: isPaid ? "#dcfce7" : "#fee2e2",
            color: isPaid ? "#15803d" : "#dc2626",
            border: isPaid ? "1px solid #86efac" : "1px solid #fca5a5"
          }}>
            {isPaid ? "🟢 STATUS: PAID" : "🔴 STATUS: UNPAID (Payment Pending)"}
          </div>
        </div>

        <div style={{ maxHeight: "180px", overflowY: "auto", marginBottom: "12px", borderTop: "1px dashed #f5e6d3", paddingTop: "8px" }}>
          {activeItems.length === 0 ? (
            <p style={{ fontSize: "12px", color: "#78716c", textAlign: "center", padding: "10px" }}>No active dishes ordered.</p>
          ) : (
            activeItems.map((item, idx) => (
              <div key={idx} style={{ display: "flex", justifyContent: "space-between", fontSize: "12px", padding: "4px 0", borderBottom: "1px dashed #faf6f0", color: "#334155" }}>
                <span>{item.name} <strong style={{ color: "#dc2626" }}>x{item.quantity}</strong></span>
                <span style={{ fontWeight: "700" }}>₹{item.price * item.quantity}</span>
              </div>
            ))
          )}
        </div>

        <div style={{ backgroundColor: "#faf6f0", padding: "12px", borderRadius: "10px", marginBottom: "16px", border: "1px solid #f5e6d3" }}>
          <div style={{ display: "flex", justifyContent: "space-between", fontSize: "11px", color: "#78716c", marginBottom: "2px" }}>
            <span>Subtotal</span>
            <span>₹{subtotal}</span>
          </div>
          <div style={{ display: "flex", justifyContent: "space-between", fontSize: "11px", color: "#78716c", marginBottom: "4px" }}>
            <span>GST (5%)</span>
            <span>₹{(cgst + sgst).toFixed(2)}</span>
          </div>
          <div style={{ display: "flex", justifyContent: "space-between", fontSize: "15px", fontWeight: "900", color: "#dc2626", borderTop: "1px dashed #d6d3d1", paddingTop: "6px" }}>
            <span>Total Payable</span>
            <span>₹{grandTotal}</span>
          </div>
        </div>

        {!isPaid ? (
          <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
            <button onClick={handleRequestBill} disabled={billRequested} style={{ width: "100%", padding: "12px", backgroundColor: billRequested ? "#16a34a" : "#dc2626", color: "#fff", border: "none", borderRadius: "8px", fontWeight: "900", fontSize: "12px", cursor: billRequested ? "default" : "pointer", display: "flex", alignItems: "center", justifyContent: "center", gap: "6px" }}>
              <BellRing size={16} /> {billRequested ? "Cashier Notified ✅" : "Request Bill Payment from Cashier"}
            </button>

            <button disabled style={{ width: "100%", padding: "10px", backgroundColor: "#f5f5f4", color: "#a8a29e", border: "1px solid #e7e5e4", borderRadius: "8px", fontWeight: "700", fontSize: "11px", cursor: "not-allowed", display: "flex", alignItems: "center", justifyContent: "center", gap: "6px" }}>
              <Lock size={14} /> Download Invoice (Locked until Paid)
            </button>
          </div>
        ) : (
          <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
            <button onClick={handleDownloadReceipt} style={{ width: "100%", padding: "12px", backgroundColor: "#2563eb", color: "#fff", border: "none", borderRadius: "8px", fontWeight: "900", fontSize: "12px", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", gap: "6px" }}>
              <Download size={16} /> Download Final Tax Invoice (PDF)
            </button>

            <button onClick={onResetSession} style={{ width: "100%", padding: "12px", backgroundColor: "#16a34a", color: "#fff", border: "none", borderRadius: "8px", fontWeight: "800", fontSize: "12px", cursor: "pointer" }}>
              🔄 Clear & Start New Dining Session
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

// 📱 MAIN CUSTOMER VIEW
const CustomerView = () => {
  const [searchParams] = useSearchParams();
  const urlTable = searchParams.get("table") || "1";

  const [hasSwipedUp, setHasSwipedUp] = useState(false);
  const [menuItems, setMenuItems] = useState([]);
  const [selectedCategory, setSelectedCategory] = useState("All");
  const [searchQuery, setSearchQuery] = useState("");
  const [tableNumber, setTableNumber] = useState(urlTable);
  const [cart, setCart] = useState([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  
  const [tableOrders, setTableOrders] = useState([]);
  const [showEndMealModal, setShowEndMealModal] = useState(false);
  const [settings, setSettings] = useState({ isRestaurantOpen: true, disabledTables: [] });

  const [sessionOrderIds, setSessionOrderIds] = useState(() => {
    try {
      const saved = sessionStorage.getItem(`session_orders_${urlTable}`);
      return saved ? JSON.parse(saved) : [];
    } catch (e) {
      return [];
    }
  });

  useEffect(() => {
    try {
      const saved = sessionStorage.getItem(`session_orders_${tableNumber}`);
      setSessionOrderIds(saved ? JSON.parse(saved) : []);
    } catch (e) {
      setSessionOrderIds([]);
    }
  }, [tableNumber]);

  const fetchSettings = async () => {
    try {
      const res = await fetch(`${BACKEND_URL}/api/settings`);
      const data = await res.json();
      if (data.success) setSettings(data.data);
    } catch (err) {}
  };

  const fetchMenu = async () => {
    try {
      const res = await fetch(`${BACKEND_URL}/api/menu`);
      const data = await res.json();
      const list = data.success && Array.isArray(data.data) ? data.data : Array.isArray(data) ? data : [];
      setMenuItems(list);
    } catch (err) {
      console.error("Error fetching menu:", err);
    } finally {
      setLoading(false);
    }
  };

  const fetchTableOrders = async () => {
    try {
      const res = await fetch(`${BACKEND_URL}/api/orders`);
      const data = await res.json();
      const allOrders = data.success && Array.isArray(data.data) ? data.data : Array.isArray(data) ? data : [];
      const filtered = allOrders.filter(
        (o) => String(o.tableNumber) === String(tableNumber) && o.status !== "Cancelled"
      );
      setTableOrders(filtered);
    } catch (err) {
      console.error("Error fetching table orders:", err);
    }
  };

  useEffect(() => {
    fetchSettings();
    fetchMenu();
    fetchTableOrders();

    // 🔄 AUTOMATIC SESSION RESET LISTENER (Admin Settle Payment)
    const handleSessionReset = (data) => {
      if (String(data.tableNumber) === String(tableNumber)) {
        sessionStorage.removeItem(`session_orders_${tableNumber}`);
        setSessionOrderIds([]);
        setCart([]);
        setTableOrders([]);
        setShowEndMealModal(false);
      }
    };

    socket.on("menu_updated", fetchMenu);
    socket.on("order_updated", fetchTableOrders);
    socket.on("settings_updated", fetchSettings);
    socket.on("session_reset", handleSessionReset);

    return () => {
      socket.off("menu_updated", fetchMenu);
      socket.off("order_updated", fetchTableOrders);
      socket.off("settings_updated", fetchSettings);
      socket.off("session_reset", handleSessionReset);
    };
  }, [tableNumber]);

  const handleDelayComplaint = () => {
    socket.emit("customer_complaint", {
      tableNumber,
      message: `Table #${tableNumber} customer is reporting a delay! Food not served yet.`
    });
    alert("🚨 Complaint sent directly to Admin & Kitchen Manager!");
  };

  if (loading) return <div style={{ padding: "20px", textAlign: "center", color: "#1c1917", fontWeight: "600" }}>Loading Menu...</div>;

  if (!settings.isRestaurantOpen) {
    return (
      <div style={{ padding: "60px 20px", textAlign: "center", backgroundColor: "#090807", color: "#fff", minHeight: "100vh", display: "flex", flexDirection: "column", justifyContent: "center", alignItems: "center" }}>
        <h1 style={{ fontSize: "36px", color: "#ef4444", fontWeight: "900", margin: "0 0 10px 0" }}>🛑 RESTAURANT CLOSED TODAY</h1>
        <p style={{ color: "#d6d3d1", fontSize: "14px", maxWidth: "350px" }}>
          We are currently on a holiday! We will be back soon to serve you freshly prepared gourmet bowls.
        </p>
      </div>
    );
  }

  if (settings.disabledTables?.includes(Number(tableNumber))) {
    return (
      <div style={{ padding: "60px 20px", textAlign: "center", backgroundColor: "#faf6f0", minHeight: "100vh", display: "flex", flexDirection: "column", justifyContent: "center", alignItems: "center" }}>
        <h2 style={{ fontSize: "24px", color: "#dc2626", fontWeight: "900", margin: "0 0 10px 0" }}>⚠️ Table #{tableNumber} Out of Service</h2>
        <p style={{ color: "#78716c", fontSize: "13px", maxWidth: "350px" }}>
          This table is currently unavailable due to maintenance. Please scan the QR code on a vacant table.
        </p>
      </div>
    );
  }

  const activeUnpaidOrders = tableOrders.filter((o) =>
    ["Pending", "Preparing", "Ready", "Served"].includes(o.status)
  );

  const paidSessionOrders = tableOrders.filter((o) =>
    o.status === "Paid" && sessionOrderIds.includes(o._id || o.id)
  );

  const showFloatingButton = activeUnpaidOrders.length > 0 || paidSessionOrders.length > 0;
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
      const res = await fetch(`${BACKEND_URL}/api/orders`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(orderPayload)
      });
      const data = await res.json();

      if (res.ok && data.success) {
        const createdId = data.data?._id || data.data?.id;
        if (createdId) {
          const updatedSessionIds = [...sessionOrderIds, createdId];
          setSessionOrderIds(updatedSessionIds);
          sessionStorage.setItem(`session_orders_${tableNumber}`, JSON.stringify(updatedSessionIds));
        }
        setCart([]);
        socket.emit("order_updated");
        fetchTableOrders();
        alert("Order placed successfully! Kitchen is preparing your food. 👨‍🍳");
      }
    } catch (err) {
      console.error("Order submit error:", err);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div style={{ position: "relative", minHeight: "100vh" }}>
      <Background3D />

      {/* SPLASH SCREEN */}
      <AnimatePresence>
        {!hasSwipedUp && (
          <motion.div
            initial={{ opacity: 1 }}
            exit={{ y: "-100vh", opacity: 0, scale: 0.95 }}
            transition={{ duration: 0.8, ease: [0.76, 0, 0.24, 1] }}
            style={{
              position: "fixed", top: 0, left: 0, width: "100vw", height: "100vh", backgroundColor: "#090807", zIndex: 100,
              display: "flex", flexDirection: "column", justifyContent: "space-between", alignItems: "center",
              paddingTop: "52px", paddingBottom: "24px", paddingLeft: "20px", paddingRight: "20px", boxSizing: "border-box"
            }}
          >
            <div style={{ position: "absolute", top: "20%", left: "50%", transform: "translate(-50%, -50%)", width: "320px", height: "320px", background: "radial-gradient(circle, rgba(245, 158, 11, 0.25) 0%, rgba(220, 38, 38, 0.15) 50%, transparent 70%)", borderRadius: "50%", filter: "blur(60px)", pointerEvents: "none" }} />

            <motion.div animate={{ y: [0, -12, 0] }} transition={{ repeat: Infinity, duration: 4 }} style={{ position: "absolute", top: "14%", left: "6%", backgroundColor: "rgba(28, 25, 23, 0.85)", border: "1px solid rgba(245, 158, 11, 0.3)", backdropFilter: "blur(12px)", padding: "6px 12px", borderRadius: "20px", color: "#fef08a", fontSize: "11px", fontWeight: "800" }}>
              🌶️ Extra Spicy Punjabi
            </motion.div>

            <motion.div animate={{ y: [0, 14, 0] }} transition={{ repeat: Infinity, duration: 4.5, delay: 0.5 }} style={{ position: "absolute", top: "18%", right: "6%", backgroundColor: "rgba(28, 25, 23, 0.85)", border: "1px solid rgba(34, 197, 94, 0.3)", backdropFilter: "blur(12px)", padding: "6px 12px", borderRadius: "20px", color: "#86efac", fontSize: "11px", fontWeight: "800" }}>
              🥦 100% Fresh Ingredients
            </motion.div>

            <motion.div initial={{ y: -20, opacity: 0 }} animate={{ y: 0, opacity: 1 }} style={{ zIndex: 20, display: "flex", alignItems: "center", gap: "8px", backgroundColor: "rgba(28, 25, 23, 0.9)", border: "1px solid rgba(245, 158, 11, 0.4)", padding: "6px 16px", borderRadius: "24px", color: "#f59e0b", fontSize: "11px", fontWeight: "800" }}>
              <Sparkles size={14} />
              <span>TABLE #{tableNumber} • LIVE DIGITAL MENU</span>
            </motion.div>

            <div style={{ textAlign: "center", margin: "auto 0", zIndex: 20 }}>
              <div style={{ width: "110px", height: "110px", margin: "0 auto 20px auto", borderRadius: "30px", background: "linear-gradient(135deg, rgba(245, 158, 11, 0.9), rgba(220, 38, 38, 0.9))", padding: "3px" }}>
                <div style={{ width: "100%", height: "100%", backgroundColor: "#141210", borderRadius: "27px", display: "flex", alignItems: "center", justifyContent: "center" }}>
                  <Utensils size={48} color="#f59e0b" />
                </div>
              </div>
              <h1 style={{ fontSize: "38px", fontWeight: "900", margin: 0, background: "linear-gradient(to right, #ffffff, #fef08a, #f59e0b, #ef4444)", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent" }}>
                THE RICE BOWL
              </h1>
              <p style={{ color: "#d6d3d1", fontSize: "13px", marginTop: "10px", fontWeight: "700" }}>
                <Flame size={16} color="#ef4444" /> Craving Something Gourmet?
              </p>
            </div>

            <motion.div onClick={() => setHasSwipedUp(true)} style={{ cursor: "pointer", display: "flex", flexDirection: "column", alignItems: "center", gap: "12px", marginBottom: "10px", zIndex: 30 }}>
              <motion.div animate={{ y: [0, -10, 0] }} transition={{ repeat: Infinity, duration: 1.6 }} style={{ padding: "12px", backgroundColor: "rgba(245, 158, 11, 0.2)", border: "1px solid rgba(245, 158, 11, 0.5)", borderRadius: "50%", color: "#f59e0b" }}>
                <ChevronUp size={28} />
              </motion.div>
              <div style={{ backgroundColor: "#1c1917", border: "1px solid rgba(245, 158, 11, 0.3)", padding: "12px 24px", borderRadius: "25px", fontSize: "12px", fontWeight: "900", color: "#f5f5f4", letterSpacing: "1.5px" }}>
                SWIPE UP TO EXPLORE MENU 🍲
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* MAIN CONTENT */}
      <div style={{ display: "flex", flexDirection: "column", gap: "10px", padding: "10px", maxWidth: "1100px", margin: "0 auto", paddingBottom: showFloatingButton ? "130px" : "80px" }}>
        
        {/* Header Bar */}
        <div style={{ backgroundColor: "rgba(255, 255, 255, 0.92)", backdropFilter: "blur(10px)", padding: "12px", borderRadius: "14px", border: "1px solid #f5e6d3" }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: "6px", marginBottom: "8px" }}>
            <div>
              <span style={{ fontSize: "10px", fontWeight: "800", color: "#dc2626" }}>THE RICE BOWL</span>
              <h2 style={{ fontSize: "14px", fontWeight: "800", color: "#1c1917", margin: 0 }}>Gourmet Menu 🔥</h2>
            </div>

            <div style={{ display: "flex", alignItems: "center", gap: "4px", backgroundColor: "#faf6f0", padding: "4px 8px", borderRadius: "8px", border: "1px solid #f5e6d3" }}>
              <label style={{ fontSize: "11px", fontWeight: "700", color: "#44403c" }}>Table:</label>
              <select value={tableNumber} onChange={(e) => setTableNumber(e.target.value)} style={{ padding: "2px 4px", borderRadius: "4px", fontWeight: "800", fontSize: "12px", border: "1px solid #e7e5e4", backgroundColor: "#fff" }}>
                {[1, 2, 3, 4, 5, 6, 7, 8].map((n) => (
                  <option key={n} value={n}>#{n}</option>
                ))}
              </select>
            </div>
          </div>

          <input type="text" placeholder="🔍 Search delicious dishes..." value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} style={{ width: "100%", padding: "8px 10px", borderRadius: "8px", border: "1px solid #e7e5e4", fontSize: "12px", backgroundColor: "#faf6f0", marginBottom: "8px", boxSizing: "border-box" }} />

          <div style={{ display: "flex", gap: "6px", overflowX: "auto" }}>
            {categories.map((cat) => (
              <button key={cat} onClick={() => { playAddSound(); setSelectedCategory(cat); }} style={{ padding: "5px 12px", borderRadius: "16px", border: "none", fontSize: "11px", fontWeight: "700", whiteSpace: "nowrap", cursor: "pointer", backgroundColor: selectedCategory === cat ? "#dc2626" : "#f5f5f4", color: selectedCategory === cat ? "#ffffff" : "#44403c" }}>
                {cat}
              </button>
            ))}
          </div>
        </div>

        {/* 🚨 DELAYED SERVICE COMPLAINT BANNER */}
        {activeUnpaidOrders.some((o) => o.status !== "Served") && (
          <div style={{ backgroundColor: "#fff7ed", border: "1px solid #fdba74", padding: "10px 14px", borderRadius: "10px", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
              <AlertTriangle size={16} color="#ea580c" />
              <span style={{ fontSize: "12px", color: "#c2410c", fontWeight: "800" }}>Waiting too long for your food?</span>
            </div>
            <button onClick={handleDelayComplaint} style={{ padding: "6px 12px", backgroundColor: "#ea580c", color: "#fff", border: "none", borderRadius: "6px", fontWeight: "800", fontSize: "11px", cursor: "pointer" }}>
              🚨 Alert Admin
            </button>
          </div>
        )}

        {/* Table Occupied Banner */}
        <div style={{
          backgroundColor: activeUnpaidOrders.length > 0 ? "#fef2f2" : "#f0fdf4",
          border: activeUnpaidOrders.length > 0 ? "1px solid #fca5a5" : "1px solid #86efac",
          padding: "8px 12px", borderRadius: "10px", display: "flex", justifyContent: "space-between", alignItems: "center"
        }}>
          <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
            <span style={{ fontSize: "12px", fontWeight: "900", color: activeUnpaidOrders.length > 0 ? "#dc2626" : "#16a34a" }}>
              {activeUnpaidOrders.length > 0 ? "🔴 Table Occupied" : "🟢 Table Vacant"}
            </span>
            <span style={{ fontSize: "11px", color: "#78716c" }}>
              ({activeUnpaidOrders.length > 0 ? `${activeUnpaidOrders.length} Active Round(s)` : "Ready for order"})
            </span>
          </div>
          {activeUnpaidOrders.length > 0 && (
            <span style={{ fontSize: "12px", fontWeight: "800", color: "#dc2626" }}>
              Running: ₹{activeUnpaidOrders.reduce((sum, o) => sum + (o.totalAmount || 0), 0)}
            </span>
          )}
        </div>

        {/* Food Items Grid */}
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(160px, 1fr))", gap: "10px" }}>
          {filteredItems.map((item) => {
            const isOut = item.isAvailable === false;
            return (
              <div key={item._id} style={{ backgroundColor: isOut ? "#f5f5f4" : "#ffffff", borderRadius: "12px", overflow: "hidden", border: "1px solid #f5e6d3", display: "flex", flexDirection: "column", opacity: isOut ? 0.65 : 1 }}>
                <img src={item.image || "https://via.placeholder.com/150"} alt={item.name} style={{ width: "100%", height: "95px", objectFit: "cover" }} />
                <div style={{ padding: "8px", display: "flex", flexDirection: "column", flexGrow: 1 }}>
                  <h3 style={{ fontSize: "12px", fontWeight: "800", margin: "0 0 2px 0", color: "#1c1917" }}>{item.name}</h3>
                  <span style={{ fontSize: "10px", color: "#78716c", marginBottom: "6px" }}>{item.category}</span>
                  <div style={{ marginTop: "auto", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                    <span style={{ fontSize: "13px", fontWeight: "800", color: "#dc2626" }}>₹{item.price}</span>
                    <button disabled={isOut} onClick={() => addToCart(item)} style={{ padding: "4px 10px", backgroundColor: isOut ? "#9ca3af" : "#dc2626", color: "#ffffff", border: "none", borderRadius: "6px", fontWeight: "800", fontSize: "11px", cursor: isOut ? "not-allowed" : "pointer" }}>
                      {isOut ? "Sold Out" : "+ Add"}
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        {/* Cart Bar */}
        {cart.length > 0 && (
          <div style={{ position: "sticky", bottom: "8px", backgroundColor: "#1c1917", color: "#ffffff", padding: "12px", borderRadius: "14px", zIndex: 40, boxShadow: "0 8px 25px rgba(0,0,0,0.3)" }}>
            <h4 style={{ margin: "0 0 8px 0", fontSize: "12px", fontWeight: "800" }}>🛒 Current Selection</h4>
            <div style={{ maxHeight: "80px", overflowY: "auto", marginBottom: "8px", display: "flex", flexDirection: "column", gap: "4px" }}>
              {cart.map((item) => (
                <div key={item._id} style={{ display: "flex", justifyContent: "space-between", fontSize: "11px" }}>
                  <span>{item.name}</span>
                  <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
                    <button onClick={() => updateQuantity(item._id, -1)} style={{ backgroundColor: "#44403c", color: "#fff", border: "none", width: "18px", borderRadius: "4px" }}>-</button>
                    <span>{item.quantity}</span>
                    <button onClick={() => updateQuantity(item._id, 1)} style={{ backgroundColor: "#44403c", color: "#fff", border: "none", width: "18px", borderRadius: "4px" }}>+</button>
                    <span style={{ color: "#f59e0b", fontWeight: "800" }}>₹{item.price * item.quantity}</span>
                  </div>
                </div>
              ))}
            </div>

            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", borderTop: "1px solid #44403c", paddingTop: "8px" }}>
              <div>
                <span style={{ fontSize: "10px", color: "#a8a29e" }}>Round Total</span>
                <div style={{ fontSize: "15px", fontWeight: "800", color: "#f59e0b" }}>₹{cartTotal}</div>
              </div>
              <button disabled={submitting} onClick={handlePlaceOrder} style={{ padding: "8px 16px", backgroundColor: "#dc2626", color: "#ffffff", border: "none", borderRadius: "8px", fontWeight: "800", fontSize: "12px", cursor: "pointer" }}>
                {submitting ? "Sending..." : "Send to Kitchen 🚀"}
              </button>
            </div>
          </div>
        )}

      </div>

      {/* FLOATING BUTTON */}
      {showFloatingButton && (
        <button
          onClick={() => setShowEndMealModal(true)}
          style={{
            position: "fixed", bottom: "20px", right: "20px", padding: "12px 20px",
            backgroundColor: activeUnpaidOrders.length > 0 ? "#16a34a" : "#2563eb",
            color: "#ffffff", border: "none", borderRadius: "30px", fontWeight: "900", fontSize: "12px",
            boxShadow: "0 6px 20px rgba(0, 0, 0, 0.25)", cursor: "pointer", zIndex: 90, display: "flex", alignItems: "center", gap: "8px"
          }}
        >
          <BellRing size={18} /> {activeUnpaidOrders.length > 0 ? "End Meal & Pay Bill" : "View Invoice & Receipt"}
        </button>
      )}

      {/* MODAL */}
      {showEndMealModal && (
        <EndMealModal
          tableNumber={tableNumber}
          tableOrders={tableOrders}
          sessionOrderIds={sessionOrderIds}
          onClose={() => setShowEndMealModal(false)}
          onResetSession={() => {
            setShowEndMealModal(false);
            setCart([]);
            setSessionOrderIds([]);
            sessionStorage.removeItem(`session_orders_${tableNumber}`);
            fetchTableOrders();
          }}
        />
      )}
    </div>
  );
};

export default CustomerView;