import React, { useState, useEffect } from "react";
import { io } from "socket.io-client";
import { Receipt, Printer, CheckCircle2, BellRing, Utensils, Download } from "lucide-react";

const BACKEND_URL = import.meta.env.VITE_BACKEND_URL || "https://rice-bowl-ordering-app.onrender.com";
const socket = io(BACKEND_URL);

const CustomerCheckout = ({ tableNumber, tableOrders, onNewOrderClick }) => {
  const [billRequested, setBillRequested] = useState(false);
  const [isPaid, setIsPaid] = useState(false);

  // Filter out cancelled items for calculation
  const activeItems = tableOrders.flatMap(o => o.items || []).filter(i => i.status !== "Cancelled");
  
  const subtotal = activeItems.reduce((sum, item) => sum + item.price * item.quantity, 0);
  const cgst = Number((subtotal * 0.025).toFixed(2));
  const sgst = Number((subtotal * 0.025).toFixed(2));
  const grandTotal = Math.round(subtotal + cgst + sgst);

  // 🔄 Real-time check if Admin has marked order as "Paid"
  useEffect(() => {
    const checkPaymentStatus = () => {
      const hasPaid = tableOrders.some(o => o.status === "Paid");
      if (hasPaid) {
        setIsPaid(true);
      }
    };

    checkPaymentStatus();

    socket.on("order_updated", () => {
      checkPaymentStatus();
    });

    return () => socket.off("order_updated");
  }, [tableOrders]);

  // 🔔 Notify Cashier for Bill Request
  const handleRequestBill = () => {
    socket.emit("request_bill", { tableNumber, totalAmount: grandTotal });
    setBillRequested(true);
    alert(`Bill request sent for Table #${tableNumber}! Cashier is processing your bill.`);
  };

  // 🖨️ Download / Print Bill Receipt (PDF / Thermal Format)
  const handleDownloadReceipt = () => {
    const printWindow = window.open("", "_blank");
    printWindow.document.write(`
      <html>
        <head>
          <title>Bill Receipt - Table ${tableNumber}</title>
          <style>
            body { font-family: 'Courier New', monospace; width: 280px; margin: 0 auto; padding: 10px; color: #000; }
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
            <p style="margin:2px 0; font-size:11px;">Table #${tableNumber} | Date: ${new Date().toLocaleDateString()} ${new Date().toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}</p>
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

  // 🟢 1. THANK YOU SCREEN (Triggered automatically when Admin Settle payment)
  if (isPaid) {
    return (
      <div style={{ padding: "30px 20px", textAlign: "center", backgroundColor: "#ffffff", borderRadius: "20px", boxShadow: "0 10px 30px rgba(0,0,0,0.1)", maxWidth: "400px", margin: "20px auto" }}>
        <CheckCircle2 size={64} color="#16a34a" style={{ marginBottom: "12px" }} />
        <h2 style={{ fontSize: "22px", fontWeight: "900", color: "#1c1917", margin: "0 0 6px 0" }}>Payment Completed!</h2>
        <p style={{ fontSize: "14px", color: "#78716c", margin: "0 0 20px 0" }}>
          Thank you for dining at <strong>The Rice Bowl</strong>! Your payment for Table #{tableNumber} has been settled.
        </p>

        <button
          onClick={handleDownloadReceipt}
          style={{ width: "100%", padding: "12px", backgroundColor: "#2563eb", color: "#fff", border: "none", borderRadius: "10px", fontWeight: "800", fontSize: "13px", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", gap: "8px", marginBottom: "10px" }}
        >
          <Download size={16} /> Download Final Receipt (PDF)
        </button>

        <button
          onClick={onNewOrderClick}
          style={{ width: "100%", padding: "12px", backgroundColor: "#f59e0b", color: "#000", border: "none", borderRadius: "10px", fontWeight: "800", fontSize: "13px", cursor: "pointer" }}
        >
          🔄 Start New Dining Session
        </button>
      </div>
    );
  }

  // 🟡 2. ACTIVE RUNNING BILL & CHECKOUT VIEW
  return (
    <div style={{ backgroundColor: "#ffffff", borderRadius: "18px", border: "1px solid #f5e6d3", padding: "16px", maxWidth: "420px", margin: "0 auto", boxShadow: "0 4px 20px rgba(0,0,0,0.06)" }}>
      
      {/* Header */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", borderBottom: "1px solid #faf6f0", paddingBottom: "10px", marginBottom: "12px" }}>
        <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
          <Receipt size={20} color="#dc2626" />
          <h3 style={{ margin: 0, fontSize: "16px", fontWeight: "900", color: "#1c1917" }}>Table #{tableNumber} Running Bill</h3>
        </div>
        <span style={{ fontSize: "11px", fontWeight: "800", backgroundColor: "#fef3c7", color: "#d97706", padding: "3px 8px", borderRadius: "6px" }}>
          Active Session
        </span>
      </div>

      {/* Itemized Breakdown */}
      <div style={{ maxHeight: "180px", overflowY: "auto", marginBottom: "12px", paddingRight: "4px" }}>
        {activeItems.length === 0 ? (
          <p style={{ fontSize: "12px", color: "#78716c", textAlign: "center" }}>No active dishes ordered yet.</p>
        ) : (
          activeItems.map((item, idx) => (
            <div key={idx} style={{ display: "flex", justifyContent: "space-between", fontSize: "13px", padding: "4px 0", borderBottom: "1px dashed #f5e6d3", color: "#334155" }}>
              <span>{item.name} <strong style={{ color: "#dc2626" }}>x{item.quantity}</strong></span>
              <span style={{ fontWeight: "700" }}>₹{item.price * item.quantity}</span>
            </div>
          ))
        )}
      </div>

      {/* Accounting Totals */}
      <div style={{ backgroundColor: "#faf6f0", padding: "10px", borderRadius: "10px", marginBottom: "14px", border: "1px solid #f5e6d3" }}>
        <div style={{ display: "flex", justifyContent: "space-between", fontSize: "12px", color: "#78716c", marginBottom: "4px" }}>
          <span>Subtotal</span>
          <span>₹{subtotal}</span>
        </div>
        <div style={{ display: "flex", justifyContent: "space-between", fontSize: "12px", color: "#78716c", marginBottom: "4px" }}>
          <span>Taxes (5% GST)</span>
          <span>₹{(cgst + sgst).toFixed(2)}</span>
        </div>
        <div style={{ display: "flex", justifyContent: "space-between", fontSize: "15px", fontWeight: "900", color: "#dc2626", borderTop: "1px dashed #d6d3d1", paddingTop: "6px", marginTop: "4px" }}>
          <span>Total Payable</span>
          <span>₹{grandTotal}</span>
        </div>
      </div>

      {/* Action Buttons */}
      <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
        
        {/* 🖨️ Download / Print Bill Button */}
        <button
          onClick={handleDownloadReceipt}
          style={{ width: "100%", padding: "10px", backgroundColor: "#292524", color: "#ffffff", border: "none", borderRadius: "8px", fontWeight: "800", fontSize: "12px", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", gap: "6px" }}
        >
          <Printer size={15} /> Download / Print Bill Receipt
        </button>

        {/* 🔔 Request Final Bill Notification */}
        <button
          onClick={handleRequestBill}
          disabled={billRequested}
          style={{ width: "100%", padding: "11px", backgroundColor: billRequested ? "#16a34a" : "#dc2626", color: "#ffffff", border: "none", borderRadius: "8px", fontWeight: "900", fontSize: "12px", cursor: billRequested ? "default" : "pointer", display: "flex", alignItems: "center", justifyContent: "center", gap: "6px" }}
        >
          <BellRing size={15} /> {billRequested ? "Bill Requested (Cashier Notified) ✅" : "Request Final Bill from Counter"}
        </button>
      </div>
    </div>
  );
};

export default CustomerCheckout;