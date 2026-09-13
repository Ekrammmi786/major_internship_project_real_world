import React from "react";

const PrintReceipt = ({ order, onClose }) => {
  if (!order) return null;

  const subtotal = order.items?.reduce((sum, item) => sum + item.price * item.quantity, 0) || 0;
  const cgst = Number((subtotal * 0.025).toFixed(2));
  const sgst = Number((subtotal * 0.025).toFixed(2));
  const grandTotal = Math.round(subtotal + cgst + sgst);

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="receipt-modal-overlay" style={{
      position: "fixed", top: 0, left: 0, width: "100vw", height: "100vh",
      backgroundColor: "rgba(0,0,0,0.6)", display: "flex", justifyContent: "center",
      alignItems: "center", zIndex: 1000
    }}>
      <style>{`
        @media print {
          body * { visibility: hidden; }
          #printable-bill, #printable-bill * { visibility: visible; }
          #printable-bill { position: absolute; left: 0; top: 0; width: 80mm; padding: 10px; font-family: monospace; }
          .no-print { display: none !important; }
        }
      `}</style>

      <div style={{ backgroundColor: "#fff", padding: "20px", borderRadius: "10px", width: "340px", maxHeight: "90vh", overflowY: "auto" }}>
        {/* Printable Bill Container */}
        <div id="printable-bill" style={{ fontFamily: "monospace", color: "#000", fontSize: "12px", lineHeight: "1.4" }}>
          <div style={{ textAlign: "center", borderBottom: "1px dashed #000", paddingBottom: "8px", marginBottom: "8px" }}>
            <h2 style={{ margin: "0 0 4px 0", fontSize: "16px", fontWeight: "bold" }}>THE RICE BOWL</h2>
            <p style={{ margin: 0, fontSize: "10px" }}>Kolhapuri & Punjabi Tadka</p>
            <p style={{ margin: 0, fontSize: "10px" }}>FSSAI Lic No: 11526999000123</p>
            <p style={{ margin: 0, fontSize: "10px", fontWeight: "bold" }}>TAX INVOICE</p>
          </div>

          <div style={{ marginBottom: "8px", fontSize: "11px" }}>
            <div><strong>Inv No:</strong> TRB-{order._id?.slice(-6).toUpperCase()}</div>
            <div><strong>Date:</strong> {new Date(order.createdAt || Date.now()).toLocaleString()}</div>
            <div><strong>Table:</strong> #{order.tableNumber} | <strong>Pay:</strong> {order.paymentMethod || "CASH/UPI"}</div>
          </div>

          <table style={{ width: "100%", borderCollapse: "collapse", marginBottom: "8px", fontSize: "11px" }}>
            <thead>
              <tr style={{ borderBottom: "1px dashed #000", textAlign: "left" }}>
                <th style={{ paddingBottom: "4px" }}>Item</th>
                <th style={{ textAlign: "center" }}>Qty</th>
                <th style={{ textAlign: "right" }}>Amt</th>
              </tr>
            </thead>
            <tbody>
              {order.items?.map((item, i) => (
                <tr key={i}>
                  <td style={{ padding: "2px 0" }}>{item.name}</td>
                  <td style={{ textAlign: "center" }}>{item.quantity}</td>
                  <td style={{ textAlign: "right" }}>₹{item.price * item.quantity}</td>
                </tr>
              ))}
            </tbody>
          </table>

          <div style={{ borderTop: "1px dashed #000", paddingTop: "6px", fontSize: "11px" }}>
            <div style={{ display: "flex", justifyContent: "space-between" }}><span>Subtotal:</span><span>₹{subtotal.toFixed(2)}</span></div>
            <div style={{ display: "flex", justifyContent: "space-between" }}><span>CGST (2.5%):</span><span>₹{cgst.toFixed(2)}</span></div>
            <div style={{ display: "flex", justifyContent: "space-between" }}><span>SGST (2.5%):</span><span>₹{sgst.toFixed(2)}</span></div>
            <div style={{ display: "flex", justifyContent: "space-between", fontSize: "14px", fontWeight: "bold", borderTop: "1px dashed #000", marginTop: "4px", paddingTop: "4px" }}>
              <span>GRAND TOTAL:</span><span>₹{grandTotal}</span>
            </div>
          </div>

          <div style={{ textAlign: "center", marginTop: "12px", borderTop: "1px dashed #000", paddingTop: "8px", fontSize: "10px" }}>
            <p style={{ margin: 0 }}>GSTIN: 27AAAAA0000A1Z5</p>
            <p style={{ margin: "2px 0 0 0", fontWeight: "bold" }}>Thank You! Visit Again 🙏</p>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="no-print" style={{ display: "flex", gap: "10px", marginTop: "16px" }}>
          <button onClick={handlePrint} style={{ flex: 1, padding: "10px", backgroundColor: "#dc2626", color: "#fff", border: "none", borderRadius: "6px", fontWeight: "bold", cursor: "pointer" }}>
            🖨️ Print Bill
          </button>
          <button onClick={onClose} style={{ flex: 1, padding: "10px", backgroundColor: "#78716c", color: "#fff", border: "none", borderRadius: "6px", fontWeight: "bold", cursor: "pointer" }}>
            Close
          </button>
        </div>
      </div>
    </div>
  );
};

export default PrintReceipt;