import React from "react";
import { X, Printer } from "lucide-react";

const PrintReceipt = ({ order, onClose }) => {
  if (!order) return null;

  const targetId = order._id || order.id || "";
  const displayTableNo = order.tableNumber || order.table || order.tableNo || "N/A";
  const activeItems = order.items?.filter((i) => i.status !== "Cancelled") || [];
  
  const subtotal = activeItems.reduce((sum, item) => sum + item.price * item.quantity, 0);
  const cgst = Number((subtotal * 0.025).toFixed(2));
  const sgst = Number((subtotal * 0.025).toFixed(2));
  const grandTotal = Math.round(subtotal + cgst + sgst);

  const handlePrint = () => {
    const printWindow = window.open("", "_blank");
    printWindow.document.write(`
      <html>
        <head>
          <title>Invoice - TRB-${targetId.slice(-6).toUpperCase()}</title>
          <style>
            @page {
              size: 80mm auto;
              margin: 0mm;
            }
            body {
              font-family: 'Courier New', Courier, monospace;
              width: 72mm;
              margin: 0 auto;
              padding: 6mm 2mm;
              color: #000000;
              background: #ffffff;
              font-size: 11px;
              line-height: 1.3;
            }
            .center { text-align: center; }
            .bold { font-weight: bold; }
            .dash { border-bottom: 1px dashed #000; margin: 6px 0; }
            .double-dash { border-bottom: 2px solid #000; margin: 6px 0; }
            .flex { display: flex; justify-content: space-between; margin: 3px 0; }
            .title { font-size: 15px; font-weight: bold; letter-spacing: 1px; }
            @media print {
              html, body {
                width: 80mm;
                margin: 0;
                padding: 4mm;
              }
            }
          </style>
        </head>
        <body>
          <div class="center">
            <div class="title">THE RICE BOWL</div>
            <div>Authentic Gourmet Bowls</div>
            <div style="font-size: 10px; margin-top:2px;">GSTIN: 27AAAAA0000A1Z5</div>
            <div class="dash"></div>
            <div>Table #${displayTableNo} | Tax Invoice</div>
            <div>Invoice No: TRB-${targetId.slice(-6).toUpperCase()}</div>
            <div>Date: ${new Date(order.createdAt || Date.now()).toLocaleDateString()} ${new Date(order.createdAt || Date.now()).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</div>
          </div>

          <div class="dash"></div>

          <div class="flex bold">
            <span>Item Name</span>
            <span>Qty x Price</span>
          </div>

          <div class="dash"></div>

          ${activeItems.map(item => `
            <div class="flex">
              <span>${item.name}</span>
              <span>${item.quantity} x ₹${item.price} = ₹${item.price * item.quantity}</span>
            </div>
          `).join("")}

          <div class="dash"></div>

          <div class="flex"><span>Subtotal</span><span>₹${subtotal}</span></div>
          <div class="flex"><span>CGST (2.5%)</span><span>₹${cgst}</span></div>
          <div class="flex"><span>SGST (2.5%)</span><span>₹${sgst}</span></div>

          <div class="double-dash"></div>

          <div class="flex bold" style="font-size: 13px;">
            <span>GRAND TOTAL</span>
            <span>₹${grandTotal}</span>
          </div>

          <div class="double-dash"></div>

          <div class="center" style="margin-top: 10px; font-size: 10px;">
            <div>Payment Method: ${order.paymentMethod?.toUpperCase() || "CASH"}</div>
            <div style="margin-top: 4px;">Thank you for dining with us! 🙏</div>
            <div>Please Come Again!</div>
          </div>
        </body>
      </html>
    `);
    printWindow.document.close();
    printWindow.focus();
    setTimeout(() => printWindow.print(), 250);
  };

  return (
    <div style={{ position: "fixed", inset: 0, backgroundColor: "rgba(0,0,0,0.75)", zIndex: 1000, display: "flex", justifyContent: "center", alignItems: "center", padding: "16px" }}>
      <div style={{ backgroundColor: "#ffffff", borderRadius: "16px", width: "100%", maxWidth: "340px", padding: "20px", position: "relative", boxShadow: "0 10px 30px rgba(0,0,0,0.3)" }}>
        <button onClick={onClose} style={{ position: "absolute", top: "12px", right: "12px", border: "none", backgroundColor: "#f5f5f4", borderRadius: "50%", padding: "6px", cursor: "pointer" }}>
          <X size={18} color="#44403c" />
        </button>

        <div style={{ textAlign: "center", marginBottom: "12px" }}>
          <h3 style={{ margin: "0 0 4px 0", fontSize: "16px", fontWeight: "900", color: "#1c1917" }}>THE RICE BOWL POS</h3>
          <span style={{ fontSize: "11px", color: "#78716c" }}>Table #{displayTableNo} • Thermal Bill Preview</span>
        </div>

        <div style={{ borderTop: "1px dashed #d6d3d1", borderBottom: "1px dashed #d6d3d1", padding: "10px 0", marginBottom: "12px", maxHeight: "200px", overflowY: "auto" }}>
          {activeItems.map((item, idx) => (
            <div key={idx} style={{ display: "flex", justifyContent: "space-between", fontSize: "12px", padding: "3px 0", color: "#334155" }}>
              <span>{item.name} x{item.quantity}</span>
              <span style={{ fontWeight: "700" }}>₹{item.price * item.quantity}</span>
            </div>
          ))}
        </div>

        <div style={{ backgroundColor: "#faf6f0", padding: "10px", borderRadius: "8px", marginBottom: "14px" }}>
          <div style={{ display: "flex", justifyContent: "space-between", fontSize: "11px", color: "#78716c" }}>
            <span>Subtotal</span>
            <span>₹{subtotal}</span>
          </div>
          <div style={{ display: "flex", justifyContent: "space-between", fontSize: "11px", color: "#78716c" }}>
            <span>GST (5%)</span>
            <span>₹{(cgst + sgst).toFixed(2)}</span>
          </div>
          <div style={{ display: "flex", justifyContent: "space-between", fontSize: "14px", fontWeight: "900", color: "#dc2626", borderTop: "1px dashed #d6d3d1", paddingTop: "4px", marginTop: "4px" }}>
            <span>Grand Total</span>
            <span>₹{grandTotal}</span>
          </div>
        </div>

        <button onClick={handlePrint} style={{ width: "100%", padding: "10px", backgroundColor: "#dc2626", color: "#ffffff", border: "none", borderRadius: "8px", fontWeight: "800", fontSize: "12px", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", gap: "6px" }}>
          <Printer size={16} /> Print 80mm Thermal Receipt
        </button>
      </div>
    </div>
  );
};

export default PrintReceipt;