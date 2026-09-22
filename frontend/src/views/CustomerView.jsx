import React, { useState, useEffect } from "react";
import { useSearchParams } from "react-router-dom";
import { io } from "socket.io-client";
import { motion, AnimatePresence } from "framer-motion";
import { 
  ChevronUp, Utensils, Sparkles, Flame, 
  BellRing, Download, X, Lock, AlertTriangle, ShieldAlert, RefreshCw, 
  Clock, ChefHat, Droplets, UserCheck, Sparkle
} from "lucide-react";
import Background3D from "../components/Background3D";

const BACKEND_URL = import.meta.env.VITE_BACKEND_URL || "http://localhost:5000";
const CANCEL_WINDOW_SECONDS = 60; // 60 Seconds Cancellation Window

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

// ⏱️ LIVE CANCELLATION COUNTDOWN TIMER COMPONENT
const OrderCancelTimer = ({ createdAt, status, onCancel }) => {
  const [timeLeft, setTimeLeft] = useState(0);

  useEffect(() => {
    const calculateTimeLeft = () => {
      const createdTime = new Date(createdAt || Date.now()).getTime();
      const now = new Date().getTime();
      const diffInSec = Math.floor((createdTime + CANCEL_WINDOW_SECONDS * 1000 - now) / 1000);
      return diffInSec > 0 ? diffInSec : 0;
    };

    setTimeLeft(calculateTimeLeft());
    const interval = setInterval(() => {
      const remaining = calculateTimeLeft();
      setTimeLeft(remaining);
      if (remaining <= 0) clearInterval(interval);
    }, 1000);

    return () => clearInterval(interval);
  }, [createdAt]);

  const canCancel = status === "Pending" && timeLeft > 0;

  if (!canCancel) {
    return (
      <span style={{ fontSize: "10px", color: "#a8a29e", fontWeight: "700", display: "flex", alignItems: "center", gap: "3px" }}>
        <Lock size={12} /> {status === "Preparing" ? "Cooking Started" : "Cancel Expired"}
      </span>
    );
  }

  return (
    <button
      onClick={onCancel}
      style={{
        backgroundColor: "#fee2e2",
        color: "#dc2626",
        border: "1px solid #fca5a5",
        borderRadius: "6px",
        padding: "4px 8px",
        fontSize: "11px",
        fontWeight: "800",
        cursor: "pointer",
        display: "flex",
        alignItems: "center",
        gap: "4px"
      }}
    >
      <Clock size={12} /> Cancel Round ({timeLeft}s)
    </button>
  );
};

// 🏁 BILL SUMMARY MODAL WITH 80mm THERMAL RECEIPT PRINT
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
            @page { size: 80mm auto; margin: 0mm; }
            body { font-family: 'Courier New', Courier, monospace; width: 72mm; margin: 0 auto; padding: 6mm 2mm; color: #000; background: #fff; font-size: 11px; line-height: 1.3; }
            .center { text-align: center; }
            .dash { border-bottom: 1px dashed #000; margin: 6px 0; }
            .flex { display: flex; justify-content: space-between; font-size: 11px; margin: 3px 0; }
            .total { font-weight: bold; font-size: 13px; margin-top: 6px; }
            @media print { body { width: 80mm; margin: 0; padding: 4mm; } }
          </style>
        </head>
        <body>
          <div class="center">
            <h2 style="margin:0; font-size:15px;">THE RICE BOWL</h2>
            <p style="margin:2px 0; font-size:10px;">Authentic Gourmet Bowls</p>
            <p style="margin:2px 0; font-size:10px;">Table #${tableNumber} | Tax Invoice</p>
            <p style="margin:2px 0; font-size:10px;">Date: ${new Date().toLocaleDateString()} ${new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</p>
          </div>
          <div class="dash"></div>
          ${activeItems.map(item => `
            <div class="flex">
              <span>${item.name} x${item.quantity} ${item.instructions ? `(${item.instructions})` : ''}</span>
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
          <div class="center" style="font-size:10px; margin-top:10px;">
            <p>Payment: PAID ONLINE/CASH</p>
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
              <div key={idx} style={{ borderBottom: "1px dashed #faf6f0", padding: "4px 0" }}>
                <div style={{ display: "flex", justifyContent: "space-between", fontSize: "12px", color: "#334155" }}>
                  <span>{item.name} <strong style={{ color: "#dc2626" }}>x{item.quantity}</strong></span>
                  <span style={{ fontWeight: "700" }}>₹{item.price * item.quantity}</span>
                </div>
                {item.instructions && (
                  <span style={{ fontSize: "10px", color: "#d97706", display: "block" }}>
                    ✍️ {item.instructions}
                  </span>
                )}
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
              <Lock size={14} /> Download Thermal Invoice (Locked until Paid)
            </button>
          </div>
        ) : (
          <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
            <button onClick={handleDownloadReceipt} style={{ width: "100%", padding: "12px", backgroundColor: "#2563eb", color: "#fff", border: "none", borderRadius: "8px", fontWeight: "900", fontSize: "12px", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", gap: "6px" }}>
              <Download size={16} /> Print 80mm Thermal Invoice
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
  const [searchParams, setSearchParams] = useSearchParams();
  const urlTable = searchParams.get("table") || "1";

  const [hasSwipedUp, setHasSwipedUp] = useState(false);
  const [menuItems, setMenuItems] = useState([]);
  const [selectedCategory, setSelectedCategory] = useState("All");
  const [searchQuery, setSearchQuery] = useState("");
  const [tableNumber, setTableNumber] = useState(urlTable);
  const [cart, setCart] = useState([]);
  const [orderNote, setOrderNote] = useState("");
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  
  const [tableOrders, setTableOrders] = useState([]);
  const [showEndMealModal, setShowEndMealModal] = useState(false);
  const [showTableSelectModal, setShowTableSelectModal] = useState(false);
  const [isTableLocked, setIsTableLocked] = useState(false);
  const [allActiveOrders, setAllActiveOrders] = useState([]);
  const [showActiveOrdersDrawer, setShowActiveOrdersDrawer] = useState(true);
  
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

  const fetchTableOrders = async (overrideSessionIds = null) => {
    try {
      const res = await fetch(`${BACKEND_URL}/api/orders`);
      const data = await res.json();
      const allOrders = data.success && Array.isArray(data.data) ? data.data : Array.isArray(data) ? data : [];
      
      setAllActiveOrders(allOrders);

      const activeUnpaidOrders = allOrders.filter(
        (o) => String(o.tableNumber) === String(tableNumber) && 
               ["Pending", "Preparing", "Ready", "Served"].includes(o.status)
      );

      if (activeUnpaidOrders.length > 0) {
        let currentSessionIds = overrideSessionIds;
        if (!currentSessionIds) {
          try {
            const saved = sessionStorage.getItem(`session_orders_${tableNumber}`);
            currentSessionIds = saved ? JSON.parse(saved) : [];
          } catch (e) {
            currentSessionIds = [];
          }
        }

        const hasMatchingSession = activeUnpaidOrders.some((o) =>
          currentSessionIds.includes(o._id || o.id)
        );

        if (!hasMatchingSession) {
          setIsTableLocked(true);
          setTableOrders([]);
          return;
        }
      }

      setIsTableLocked(false);
      setTableOrders(activeUnpaidOrders);

      if (activeUnpaidOrders.length === 0) {
        sessionStorage.removeItem(`session_orders_${tableNumber}`);
        setSessionOrderIds([]);
      }
    } catch (err) {
      console.error("Error fetching table orders:", err);
    }
  };

  useEffect(() => {
    fetchSettings();
    fetchMenu();
    fetchTableOrders();

    const handleOrderChange = () => {
      fetchTableOrders();
    };

    const handleSessionReset = (data) => {
      if (String(data.tableNumber) === String(tableNumber)) {
        sessionStorage.removeItem(`session_orders_${tableNumber}`);
        setSessionOrderIds([]);
        setCart([]);
        setTableOrders([]);
        setShowEndMealModal(false);
        setIsTableLocked(false);
      }
    };

    socket.on("menu_updated", fetchMenu);
    socket.on("order_updated", handleOrderChange);
    socket.on("settings_updated", fetchSettings);
    socket.on("session_reset", handleSessionReset);

    return () => {
      socket.off("menu_updated", fetchMenu);
      socket.off("order_updated", handleOrderChange);
      socket.off("settings_updated", fetchSettings);
      socket.off("session_reset", handleSessionReset);
    };
  }, [tableNumber]);

  const handleDelayComplaint = () => {
    socket.emit("customer_complaint", {
      tableNumber,
      message: `🚨 Table #${tableNumber} customer is reporting a delay! Food not served yet.`
    });
    alert("🚨 Complaint sent directly to Admin & Kitchen Manager!");
  };

  const handleQuickServiceRequest = (type) => {
    socket.emit("customer_complaint", {
      tableNumber,
      message: `Table #${tableNumber} Service Request: ${type}`
    });
    alert(`✅ Request sent for: ${type}! Staff will assist you shortly.`);
  };

  // ❌ CANCEL ENTIRE ORDER ROUND
  const handleCancelOrder = async (orderId) => {
    if (!window.confirm("Kya aap sach me is poore round ko cancel karna chahte ho?")) return;
    try {
      const res = await fetch(`${BACKEND_URL}/api/orders/${orderId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: "Cancelled" })
      });
      if (res.ok) {
        socket.emit("order_updated");
        await fetchTableOrders();
        alert("❌ Order Round Cancelled Successfully!");
      }
    } catch (err) {
      console.error("Cancel order error:", err);
    }
  };

  // ❌ CANCEL A SINGLE DISH/ITEM IN AN ORDER
  const handleCancelSingleItem = async (orderId, itemIndex) => {
    if (!window.confirm("Kya aap is specific dish ko cancel karna chahte ho?")) return;
    try {
      const res = await fetch(`${BACKEND_URL}/api/orders/${orderId}/cancel-item`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ itemIndex })
      });
      if (res.ok) {
        socket.emit("order_updated");
        await fetchTableOrders();
        alert("❌ Dish Cancelled!");
      }
    } catch (err) {
      console.error("Single item cancel error:", err);
    }
  };

  const handleSelectTable = (newTable) => {
    setTableNumber(String(newTable));
    setSearchParams({ table: String(newTable) });
    setShowTableSelectModal(false);
    setIsTableLocked(false);
  };

  const addToCart = (item) => {
    if (item.isAvailable === false) return;
    playAddSound();
    setCart((prevCart) => {
      const existing = prevCart.find((i) => i._id === item._id);
      if (existing) {
        return prevCart.map((i) => (i._id === item._id ? { ...i, quantity: i.quantity + 1 } : i));
      }
      return [...prevCart, { ...item, quantity: 1, instructions: "" }];
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

  const updateItemInstructions = (id, text) => {
    setCart((prevCart) =>
      prevCart.map((item) => (item._id === id ? { ...item, instructions: text } : item))
    );
  };

  const cartTotal = cart.reduce((sum, item) => sum + item.price * item.quantity, 0);

  const handlePlaceOrder = async () => {
    if (cart.length === 0 || submitting) return;
    setSubmitting(true);
    playAddSound();

    const orderPayload = {
      tableNumber: Number(tableNumber),
      items: cart.map((i) => ({ 
        name: i.name, 
        price: i.price, 
        quantity: i.quantity,
        instructions: i.instructions || ""
      })),
      orderNote: orderNote || "",
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
        let updatedSessionIds = [...sessionOrderIds];
        if (createdId) {
          updatedSessionIds = [...sessionOrderIds, createdId];
          setSessionOrderIds(updatedSessionIds);
          sessionStorage.setItem(`session_orders_${tableNumber}`, JSON.stringify(updatedSessionIds));
        }
        setCart([]);
        setOrderNote("");
        
        socket.emit("order_updated");
        await fetchTableOrders(updatedSessionIds); 

        alert("Order placed with custom instructions! Kitchen is preparing your food. 👨‍🍳");
      }
    } catch (err) {
      console.error("Order submit error:", err);
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) return <div style={{ padding: "20px", textAlign: "center", color: "#ffffff", fontWeight: "600" }}>Loading Menu...</div>;

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
        <p style={{ color: "#78716c", fontSize: "13px", maxWidth: "350px", marginBottom: "16px" }}>
          This table is currently unavailable due to maintenance. Please select a vacant table below.
        </p>
        <button onClick={() => setShowTableSelectModal(true)} style={{ padding: "10px 20px", backgroundColor: "#dc2626", color: "#fff", border: "none", borderRadius: "8px", fontWeight: "800", cursor: "pointer" }}>
          🪑 Select Another Table
        </button>
      </div>
    );
  }

  // 🔒 LOCKED SCREEN VIEW WITH MODAL DIRECTLY RENDERED INSIDE
  if (isTableLocked) {
    return (
      <div style={{ padding: "40px 20px", textAlign: "center", backgroundColor: "#090807", color: "#ffffff", minHeight: "100vh", display: "flex", flexDirection: "column", justifyContent: "center", alignItems: "center" }}>
        <div style={{ backgroundColor: "rgba(220, 38, 38, 0.15)", border: "1px solid rgba(220, 38, 38, 0.4)", padding: "20px", borderRadius: "20px", maxWidth: "380px" }}>
          <ShieldAlert size={54} color="#ef4444" style={{ marginBottom: "12px" }} />
          <h2 style={{ fontSize: "22px", fontWeight: "900", color: "#ef4444", margin: "0 0 8px 0" }}>
            🔒 Table #{tableNumber} Currently Occupied
          </h2>
          <p style={{ fontSize: "13px", color: "#d6d3d1", lineHeight: "1.5", margin: "0 0 20px 0" }}>
            Is table par abhi doosre guests baithe hain aur unka order chal raha hai.
          </p>

          <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
            <button 
              onClick={() => setShowTableSelectModal(true)} 
              style={{ width: "100%", padding: "12px", backgroundColor: "#dc2626", color: "#fff", border: "none", borderRadius: "10px", fontWeight: "800", fontSize: "13px", cursor: "pointer" }}
            >
              🪑 Select Your Correct Table
            </button>
            <button 
              onClick={() => fetchTableOrders()} 
              style={{ width: "100%", padding: "10px", backgroundColor: "#27272a", color: "#a1a1aa", border: "1px solid #3f3f46", borderRadius: "10px", fontWeight: "700", fontSize: "12px", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", gap: "6px" }}
            >
              <RefreshCw size={14} /> Refresh Table Status
            </button>
          </div>
        </div>

        {/* 🪑 TABLE SELECTOR MODAL (WHEN LOCKED) */}
        {showTableSelectModal && (
          <div style={{ position: "fixed", inset: 0, backgroundColor: "rgba(0,0,0,0.85)", zIndex: 200, display: "flex", justifyContent: "center", alignItems: "center", padding: "16px" }}>
            <div style={{ backgroundColor: "#ffffff", borderRadius: "16px", width: "100%", maxWidth: "360px", padding: "20px", boxShadow: "0 10px 30px rgba(0,0,0,0.3)" }}>
              <h3 style={{ margin: "0 0 12px 0", color: "#1c1917", fontSize: "16px", fontWeight: "800" }}>🪑 Select Your Vacant Table</h3>
              <div style={{ display: "grid", gridTemplateColumns: "repeat(2, 1fr)", gap: "10px", marginBottom: "16px" }}>
                {[1, 2, 3, 4, 5, 6, 7, 8].map((num) => {
                  const isOcc = allActiveOrders.some((o) => String(o.tableNumber) === String(num) && ["Pending", "Preparing", "Ready", "Served"].includes(o.status));
                  return (
                    <button
                      key={num}
                      onClick={() => handleSelectTable(num)}
                      style={{
                        padding: "12px", borderRadius: "10px", border: "none", fontWeight: "800", fontSize: "12px", cursor: "pointer",
                        backgroundColor: isOcc ? "#fee2e2" : "#dcfce7",
                        color: isOcc ? "#dc2626" : "#15803d",
                        border: isOcc ? "1px solid #fca5a5" : "1px solid #86efac"
                      }}
                    >
                      Table #{num} {isOcc ? "(Occupied)" : "🟢 Vacant"}
                    </button>
                  );
                })}
              </div>
              <button onClick={() => setShowTableSelectModal(false)} style={{ width: "100%", padding: "8px", backgroundColor: "#f5f5f4", color: "#44403c", border: "none", borderRadius: "8px", fontWeight: "700", fontSize: "12px", cursor: "pointer" }}>
                Cancel
              </button>
            </div>
          </div>
        )}
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

  return (
    <div style={{ position: "relative", minHeight: "100vh", zIndex: 1 }}>
      <Background3D />

      {/* SPLASH SCREEN OVERLAY */}
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

      {/* MAIN MENU CONTENT */}
      <div style={{ display: "flex", flexDirection: "column", gap: "10px", padding: "12px 10px", maxWidth: "1100px", margin: "0 auto", paddingBottom: showFloatingButton ? "130px" : "80px" }}>
        
        {/* Header Bar */}
        <div style={{ backgroundColor: "rgba(255, 255, 255, 0.95)", backdropFilter: "blur(10px)", padding: "12px", borderRadius: "14px", border: "1px solid #f5e6d3", boxShadow: "0 4px 15px rgba(0,0,0,0.15)" }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: "6px", marginBottom: "8px" }}>
            <div>
              <span style={{ fontSize: "10px", fontWeight: "800", color: "#dc2626" }}>THE RICE BOWL</span>
              <h2 style={{ fontSize: "15px", fontWeight: "900", color: "#1c1917", margin: 0 }}>Gourmet Menu 🔥</h2>
            </div>

            <button onClick={() => setShowTableSelectModal(true)} style={{ display: "flex", alignItems: "center", gap: "4px", backgroundColor: "#faf6f0", padding: "6px 10px", borderRadius: "8px", border: "1px solid #f5e6d3", fontWeight: "800", fontSize: "12px", color: "#dc2626", cursor: "pointer" }}>
              🪑 Table #{tableNumber} (Change)
            </button>
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

        {/* 🔔 QUICK TABLE ASSISTANCE BAR */}
        <div style={{ backgroundColor: "#ffffff", border: "1px solid #f5e6d3", padding: "8px 12px", borderRadius: "12px", display: "flex", gap: "8px", overflowX: "auto", boxShadow: "0 2px 8px rgba(0,0,0,0.05)" }}>
          <span style={{ fontSize: "11px", fontWeight: "800", color: "#78716c", alignSelf: "center", whiteSpace: "nowrap" }}>Quick Service:</span>
          <button onClick={() => handleQuickServiceRequest("Water Bottles Needed 💧")} style={{ padding: "5px 10px", backgroundColor: "#e0f2fe", color: "#0284c7", border: "none", borderRadius: "16px", fontSize: "11px", fontWeight: "800", cursor: "pointer", whiteSpace: "nowrap", display: "flex", alignItems: "center", gap: "4px" }}>
            <Droplets size={13} /> Water 💧
          </button>
          <button onClick={() => handleQuickServiceRequest("Call Waiter 🔔")} style={{ padding: "5px 10px", backgroundColor: "#fef3c7", color: "#d97706", border: "none", borderRadius: "16px", fontSize: "11px", fontWeight: "800", cursor: "pointer", whiteSpace: "nowrap", display: "flex", alignItems: "center", gap: "4px" }}>
            <UserCheck size={13} /> Call Waiter 🔔
          </button>
          <button onClick={() => handleQuickServiceRequest("Clean Table 🧹")} style={{ padding: "5px 10px", backgroundColor: "#f3e8ff", color: "#7e22ce", border: "none", borderRadius: "16px", fontSize: "11px", fontWeight: "800", cursor: "pointer", whiteSpace: "nowrap", display: "flex", alignItems: "center", gap: "4px" }}>
            <Sparkle size={13} /> Clean Table 🧹
          </button>
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

        {/* 📊 LIVE ORDER STATUS & CANCELLATION TRACKER CARD */}
        {activeUnpaidOrders.length > 0 && (
          <div style={{ backgroundColor: "#ffffff", border: "1px solid #fca5a5", borderRadius: "14px", padding: "12px", boxShadow: "0 4px 15px rgba(220, 38, 38, 0.08)" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "10px" }}>
              <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
                <ChefHat size={18} color="#dc2626" />
                <h3 style={{ margin: 0, fontSize: "13px", fontWeight: "900", color: "#1c1917" }}>Active Dining Orders ({activeUnpaidOrders.length} Round)</h3>
              </div>
              <button onClick={() => setShowActiveOrdersDrawer(!showActiveOrdersDrawer)} style={{ backgroundColor: "#faf6f0", border: "1px solid #f5e6d3", borderRadius: "6px", padding: "4px 8px", fontSize: "11px", fontWeight: "800", color: "#dc2626", cursor: "pointer" }}>
                {showActiveOrdersDrawer ? "Hide Details 🔼" : "View Live Status 🔽"}
              </button>
            </div>

            <div style={{ display: "flex", justifyContent: "space-between", fontSize: "11px", fontWeight: "800", color: "#334155", backgroundColor: "#faf6f0", padding: "6px 10px", borderRadius: "8px" }}>
              <span>Total Active Dishes: {activeUnpaidOrders.flatMap(o => o.items || []).reduce((sum, i) => sum + i.quantity, 0)} items</span>
              <span style={{ color: "#dc2626" }}>Running Total: ₹{activeUnpaidOrders.reduce((sum, o) => sum + (o.totalAmount || 0), 0)}</span>
            </div>

            {/* Detailed Order Drawer */}
            {showActiveOrdersDrawer && (
              <div style={{ marginTop: "10px", display: "flex", flexDirection: "column", gap: "10px" }}>
                {activeUnpaidOrders.map((order, idx) => {
                  const targetId = order._id || order.id;
                  return (
                    <div key={targetId} style={{ backgroundColor: "#faf6f0", border: "1px solid #f5e6d3", borderRadius: "10px", padding: "10px" }}>
                      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "6px" }}>
                        <span style={{ fontSize: "11px", fontWeight: "900", color: "#dc2626" }}>Round #{idx + 1} ({new Date(order.createdAt || Date.now()).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })})</span>
                        
                        <OrderCancelTimer
                          createdAt={order.createdAt}
                          status={order.status}
                          onCancel={() => handleCancelOrder(targetId)}
                        />
                      </div>

                      {/* Items List with Item-wise Cancel Option */}
                      <ul style={{ paddingLeft: "0px", listStyle: "none", margin: "0 0 8px 0", fontSize: "12px", color: "#334155" }}>
                        {order.items?.map((item, itemIdx) => {
                          const isItemCancelled = item.status === "Cancelled";
                          const canCancelItem = order.status === "Pending" && !isItemCancelled;

                          return (
                            <li key={itemIdx} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "4px 0", borderBottom: "1px dashed #e7e5e4", textDecoration: isItemCancelled ? "line-through" : "none", color: isItemCancelled ? "#94a3b8" : "#334155" }}>
                              <div>
                                <strong>{item.name}</strong> × {item.quantity} (₹{item.price * item.quantity})
                                {isItemCancelled && <span style={{ color: "#dc2626", fontWeight: "800", marginLeft: "6px" }}>[CANCELLED]</span>}
                                {item.instructions && (
                                  <span style={{ fontSize: "10px", color: "#d97706", display: "block" }}>
                                    ✍️ {item.instructions}
                                  </span>
                                )}
                              </div>

                              {canCancelItem && (
                                <button
                                  onClick={() => handleCancelSingleItem(targetId, itemIdx)}
                                  style={{ backgroundColor: "#fee2e2", color: "#dc2626", border: "1px solid #fca5a5", borderRadius: "4px", padding: "2px 6px", fontSize: "10px", fontWeight: "800", cursor: "pointer" }}
                                >
                                  ❌ Cancel Dish
                                </button>
                              )}
                            </li>
                          );
                        })}
                      </ul>

                      {/* Live Status Progress */}
                      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", backgroundColor: "#fff", padding: "6px 10px", borderRadius: "6px", border: "1px solid #e7e5e4", fontSize: "10px", fontWeight: "800" }}>
                        <span style={{ color: order.status === "Pending" ? "#d97706" : "#a8a29e" }}>⏳ Pending</span>
                        <span>➔</span>
                        <span style={{ color: order.status === "Preparing" ? "#d97706" : "#a8a29e" }}>👨‍🍳 Cooking</span>
                        <span>➔</span>
                        <span style={{ color: order.status === "Ready" ? "#0284c7" : "#a8a29e" }}>🔔 Ready</span>
                        <span>➔</span>
                        <span style={{ color: order.status === "Served" ? "#16a34a" : "#a8a29e" }}>✅ Served</span>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}

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

        {/* Cart Bar with Custom Notes */}
        {cart.length > 0 && (
          <div style={{ position: "sticky", bottom: "8px", backgroundColor: "#1c1917", color: "#ffffff", padding: "12px", borderRadius: "14px", zIndex: 40, boxShadow: "0 8px 25px rgba(0,0,0,0.3)" }}>
            <h4 style={{ margin: "0 0 8px 0", fontSize: "12px", fontWeight: "800" }}>🛒 Current Selection & Customization</h4>
            
            <div style={{ maxHeight: "150px", overflowY: "auto", marginBottom: "8px", display: "flex", flexDirection: "column", gap: "8px" }}>
              {cart.map((item) => (
                <div key={item._id} style={{ backgroundColor: "#27272a", padding: "8px", borderRadius: "8px", border: "1px solid #3f3f46" }}>
                  <div style={{ display: "flex", justifyContent: "space-between", fontSize: "11px", marginBottom: "4px" }}>
                    <span style={{ fontWeight: "700" }}>{item.name}</span>
                    <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
                      <button onClick={() => updateQuantity(item._id, -1)} style={{ backgroundColor: "#44403c", color: "#fff", border: "none", width: "18px", borderRadius: "4px", cursor: "pointer" }}>-</button>
                      <span>{item.quantity}</span>
                      <button onClick={() => updateQuantity(item._id, 1)} style={{ backgroundColor: "#44403c", color: "#fff", border: "none", width: "18px", borderRadius: "4px", cursor: "pointer" }}>+</button>
                      <span style={{ color: "#f59e0b", fontWeight: "800" }}>₹{item.price * item.quantity}</span>
                    </div>
                  </div>

                  <input
                    type="text"
                    placeholder="✍️ Note: e.g. Extra spicy, less salt, no onion..."
                    value={item.instructions || ""}
                    onChange={(e) => updateItemInstructions(item._id, e.target.value)}
                    style={{
                      width: "100%",
                      padding: "4px 8px",
                      borderRadius: "4px",
                      border: "1px solid #52525b",
                      backgroundColor: "#18181b",
                      color: "#fef08a",
                      fontSize: "10px",
                      boxSizing: "border-box"
                    }}
                  />
                </div>
              ))}
            </div>

            <input
              type="text"
              placeholder="📝 Table Note: e.g. Bring extra spoons & napkins..."
              value={orderNote}
              onChange={(e) => setOrderNote(e.target.value)}
              style={{
                width: "100%",
                padding: "6px 8px",
                borderRadius: "6px",
                border: "1px solid #f59e0b",
                backgroundColor: "#18181b",
                color: "#ffffff",
                fontSize: "11px",
                marginBottom: "8px",
                boxSizing: "border-box"
              }}
            />

            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", borderTop: "1px solid #44403c", paddingTop: "8px" }}>
              <div>
                <span style={{ fontSize: "10px", color: "#a8a29e" }}>Round Total</span>
                <div style={{ fontSize: "15px", fontWeight: "800", color: "#f59e0b" }}>₹{cartTotal}</div>
              </div>
              <button disabled={submitting} onClick={handlePlaceOrder} style={{ padding: "8px 16px", backgroundColor: "#dc2626", color: "#ffffff", border: "none", borderRadius: "8px", fontWeight: "800", fontSize: "12px", cursor: "pointer" }}>
                {submitting ? "Sending..." : activeUnpaidOrders.length > 0 ? "+ Add Round Order 🚀" : "Send to Kitchen 🚀"}
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

      {/* BILL MODAL */}
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

      {/* TABLE SELECTOR MODAL */}
      {showTableSelectModal && (
        <div style={{ position: "fixed", inset: 0, backgroundColor: "rgba(0,0,0,0.85)", zIndex: 200, display: "flex", justifyContent: "center", alignItems: "center", padding: "16px" }}>
          <div style={{ backgroundColor: "#ffffff", borderRadius: "16px", width: "100%", maxWidth: "360px", padding: "20px", boxShadow: "0 10px 30px rgba(0,0,0,0.3)" }}>
            <h3 style={{ margin: "0 0 12px 0", color: "#1c1917", fontSize: "16px", fontWeight: "800" }}>🪑 Select Your Vacant Table</h3>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(2, 1fr)", gap: "10px", marginBottom: "16px" }}>
              {[1, 2, 3, 4, 5, 6, 7, 8].map((num) => {
                const isOcc = allActiveOrders.some((o) => String(o.tableNumber) === String(num) && ["Pending", "Preparing", "Ready", "Served"].includes(o.status));
                return (
                  <button
                    key={num}
                    onClick={() => handleSelectTable(num)}
                    style={{
                      padding: "12px", borderRadius: "10px", border: "none", fontWeight: "800", fontSize: "12px", cursor: "pointer",
                      backgroundColor: isOcc ? "#fee2e2" : "#dcfce7",
                      color: isOcc ? "#dc2626" : "#15803d",
                      border: isOcc ? "1px solid #fca5a5" : "1px solid #86efac"
                    }}
                  >
                    Table #{num} {isOcc ? "(Occupied)" : "🟢 Vacant"}
                  </button>
                );
              })}
            </div>
            <button onClick={() => setShowTableSelectModal(false)} style={{ width: "100%", padding: "8px", backgroundColor: "#f5f5f4", color: "#44403c", border: "none", borderRadius: "8px", fontWeight: "700", fontSize: "12px", cursor: "pointer" }}>
              Cancel
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default CustomerView;