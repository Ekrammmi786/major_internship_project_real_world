import React, { useState, useEffect } from "react";
import { io } from "socket.io-client";
import { 
  Receipt, Printer, CheckCircle2, BellRing, Download, Lock, X 
} from "lucide-react";

const BACKEND_URL = import.meta.env.VITE_BACKEND_URL || "https://rice-bowl-ordering-app.onrender.com";

const socket = io(BACKEND_URL, {
  transports: ["websocket", "polling"],
  withCredentials: true
});

const CustomerCheckout = ({ tableNumber, tableOrders, onClose, onNewOrderClick }) => {
  const [billRequested, setBillRequested] = useState(false);
  const [isPaid, setIsPaid] = useState(false);

  // 1. Filter active unpaid orders for current session
  const unpaidOrders = (tableOrders || []).filter((o) =>
    ["Pending", "Preparing", "Ready", "Served"].includes(o.status)
  );

  // Check if current session is paid
  useEffect(() => {
    const checkStatus = () => {
      const hasUnpaid = (tableOrders || []).some((o) =>
        ["Pending", "Preparing", "Ready", "Served"].includes(o.status)
      );
      const hasPaid = (tableOrders || []).some((o) => o.status === "Paid");
      
      if (!hasUnpaid && hasPaid) {
        setIsPaid(true);
      } else {
        setIsPaid(false);
      }
    };
    checkStatus();
  }, [tableOrders]);

  // Determine current session items (Excluding previous old paid sessions)
  let currentSessionOrders = [];
  if (unpaidOrders.length > 0) {
    currentSessionOrders = unpaidOrders;
  } else if (isPaid) {
    const paidOrders = (tableOrders || []).filter((o) => o.status === "Paid");
    if (paidOrders.length > 0) {
      const latestTime = new Date(paidOrders[0].updatedAt || paidOrders[0].createdAt).getTime();
      currentSessionOrders = paidOrders.filter((o) => {
        const t = new Date(o.updatedAt || o.createdAt).getTime();
        return Math.abs(latestTime - t) < 15 * 60 * 1000; // 15 min window
      });
    }
  }

  const activeItems = currentSessionOrders
    .filter((o) => o.status !== "Cancelled")
    .flatMap((o) => o.items || [])
    .filter((i) => i.status !== "Cancelled");

  const subtotal = activeItems.reduce((sum, item) => sum + item.price * item.quantity, 0);
  const cgst = Number((subtotal * 0.025).toFixed(2));
  const sgst = Number((subtotal * 0.025).toFixed(2));
  const grandTotal = Math.round(subtotal + cgst + sgst);

  // 🔔 Notify Cashier
  const handleRequestBill = () => {
    socket.emit("request_bill", { tableNumber, totalAmount: grandTotal });
    setBillRequested(true);
    alert(`Table #${tableNumber} cashier ko bill request bhej di gayi hai!`);
  };

  // 🖨️ Download / Print Bill Receipt (PDF / Thermal)
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
            <p style="margin:2px 0; font-size:11px;">Authentic Bowl Dining</p>
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
            <p>Please visit again!</p>
          </div>
        </body>
      </html>
    `);
    printWindow.document.close();
    printWindow.focus();
    setTimeout(() => printWindow.print(), 250);
  };

  // 🟢 1. THANK YOU SCREEN (Triggered when Admin Settle payment)
  if (isPaid) {
    return (
      <div style={{ padding: "24px 18px", textAlign: "center", backgroundColor: "#ffffff", borderRadius: "20px", boxShadow: "0 10px 30px rgba(0,0,0,0.15)", maxWidth: "400px", margin: "0 auto", position: "relative" }}>
        {onClose && (
          <button onClick={onClose} style={{ position: "absolute", top: "14px", right: "14px", border: "none", backgroundColor: "#f5f5f4", borderRadius: "50%", padding: "6px", cursor: "pointer" }}>
            <X size={16} color="#44403c" />
          </button>
        )}
        
        <CheckCircle2 size={56} color="#16a34a" style={{ margin: "0 auto 10px auto" }} />
        <h2 style={{ fontSize: "20px", fontWeight: "900", color: "#1c1917", margin: "0 0 4px 0" }}>Payment Completed!</h2>
        <p style={{ fontSize: "13px", color: "#78716c", margin: "0 0 16px 0" }}>
          Thank you for dining at <strong>The Rice Bowl</strong>! Table #{tableNumber} bill is settled.
        </p>

        <button
          onClick={handleDownloadReceipt}
          style={{ width: "100%", padding: "12px", backgroundColor: "#2563eb", color: "#fff", border: "none", borderRadius: "10px", fontWeight: "800", fontSize: "12px", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", gap: "8px", marginBottom: "8px" }}
        >
          <Download size={16} /> Download Final Receipt (PDF)
        </button>

        <button
          onClick={onNewOrderClick}
          style={{ width: "100%", padding: "12px", backgroundColor: "#16a34a", color: "#fff", border: "none", borderRadius: "10px", fontWeight: "800", fontSize: "12px", cursor: "pointer" }}
        >
          🔄 Start New Dining Session
        </button>
      </div>
    );
  }

  // 🔴 2. ACTIVE UNPAID BILL VIEW
  return (
    <div style={{ backgroundColor: "#ffffff", borderRadius: "18px", border: "1px solid #f5e6d3", padding: "16px", maxWidth: "420px", margin: "0 auto", boxShadow: "0 4px 20px rgba(0,0,0,0.08)", position: "relative" }}>
      
      {onClose && (
        <button onClick={onClose} style={{ position: "absolute", top: "14px", right: "14px", border: "none", backgroundColor: "#f5f5f4", borderRadius: "50%", padding: "6px", cursor: "pointer" }}>
          <X size={16} color="#44403c" />
        </button>
      )}

      {/* Header & Status */}
      <div style={{ textAlign: "center", marginBottom: "12px", borderBottom: "1px solid #faf6f0", paddingBottom: "10px" }}>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: "6px", marginBottom: "4px" }}>
          <Receipt size={20} color="#dc2626" />
          <h3 style={{ margin: 0, fontSize: "16px", fontWeight: "900", color: "#1c1917" }}>Table #{tableNumber} Bill</h3>
        </div>
        
        <span style={{ fontSize: "10px", fontWeight: "800", backgroundColor: "#fee2e2", color: "#dc2626", border: "1px solid #fca5a5", padding: "3px 10px", borderRadius: "12px" }}>
          🔴 STATUS: UNPAID (Payment Pending)
        </span>
      </div>

      {/* Itemized Breakdown */}
      <div style={{ maxHeight: "170px", overflowY: "auto", marginBottom: "12px", paddingRight: "4px" }}>
        {activeItems.length === 0 ? (
          <p style={{ fontSize: "12px", color: "#78716c", textAlign: "center", padding: "10px" }}>No active dishes ordered yet.</p>
        ) : (
          activeItems.map((item, idx) => (
            <div key={idx} style={{ display: "flex", justifyContent: "space-between", fontSize: "12px", padding: "4px 0", borderBottom: "1px dashed #f5e6d3", color: "#334155" }}>
              <span>{item.name} <strong style={{ color: "#dc2626" }}>x{item.quantity}</strong></span>
              <span style={{ fontWeight: "700" }}>₹{item.price * item.quantity}</span>
            </div>
          ))
        )}
      </div>

      {/* Totals */}
      <div style={{ backgroundColor: "#faf6f0", padding: "10px", borderRadius: "10px", marginBottom: "14px", border: "1px solid #f5e6d3" }}>
        <div style={{ display: "flex", justifyContent: "space-between", fontSize: "11px", color: "#78716c", marginBottom: "3px" }}>
          <span>Subtotal</span>
          <span>₹{subtotal}</span>
        </div>
        <div style={{ display: "flex", justifyContent: "space-between", fontSize: "11px", color: "#78716c", marginBottom: "4px" }}>
          <span>GST (5%)</span>
          <span>₹{(cgst + sgst).toFixed(2)}</span>
        </div>
        <div style={{ display: "flex", justifyContent: "space-between", fontSize: "14px", fontWeight: "900", color: "#dc2626", borderTop: "1px dashed #d6d3d1", paddingTop: "6px" }}>
          <span>Total Payable</span>
          <span>₹{grandTotal}</span>
        </div>
      </div>

      {/* Actions */}
      <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
        
        {/* Request Bill Button */}
        <button
          onClick={handleRequestBill}
          disabled={billRequested}
          style={{ width: "100%", padding: "11px", backgroundColor: billRequested ? "#16a34a" : "#dc2626", color: "#ffffff", border: "none", borderRadius: "8px", fontWeight: "900", fontSize: "12px", cursor: billRequested ? "default" : "pointer", display: "flex", alignItems: "center", justifyContent: "center", gap: "6px" }}
        >
          <BellRing size={15} /> {billRequested ? "Cashier Notified ✅" : "Request Bill Payment from Counter"}
        </button>

        {/* Locked Download Button */}
        <button
          disabled
          style={{ width: "100%", padding: "10px", backgroundColor: "#f5f5f4", color: "#a8a29e", border: "1px solid #e7e5e4", borderRadius: "8px", fontWeight: "700", fontSize: "11px", cursor: "not-allowed", display: "flex", alignItems: "center", justifyContent: "center", gap: "6px" }}
        >
          <Lock size={14} /> Download Invoice (Locked until Paid)
        </button>
      </div>
    </div>
  );
};

export default CustomerCheckout;