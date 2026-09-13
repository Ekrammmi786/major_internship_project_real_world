import React, { useState, useEffect } from "react";
import { io } from "socket.io-client";
import PrintReceipt from "../components/PrintReceipt";
import { exportOrdersToCSV } from "../utils/exportToExcel";

const CLOUD_NAME = "mno0e0mz"; 
const UPLOAD_PRESET = "order_app";
const socket = io("http://localhost:5000");

const AdminView = () => {
  const [activeTab, setActiveTab] = useState("billing"); 
  const [menuItems, setMenuItems] = useState([]);
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedPrintOrder, setSelectedPrintOrder] = useState(null);
  const [confirmPaymentModal, setConfirmPaymentModal] = useState(null);

  const [formData, setFormData] = useState({
    name: "", category: "Rice Bowls", price: "", image: "", isAvailable: true
  });

  const fetchData = async () => {
    try {
      const [menuRes, ordersRes] = await Promise.all([
        fetch("http://localhost:5000/api/menu"),
        fetch("http://localhost:5000/api/orders")
      ]);
      const menuData = await menuRes.json();
      const ordersData = await ordersRes.json();

      setMenuItems(menuData.success && Array.isArray(menuData.data) ? menuData.data : Array.isArray(menuData) ? menuData : []);
      setOrders(ordersData.success && Array.isArray(ordersData.data) ? ordersData.data : Array.isArray(ordersData) ? ordersData : []);
    } catch (err) {
      console.error("Data Fetch Error:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
    socket.on("order_updated", fetchData);
    socket.on("menu_updated", fetchData);
    return () => {
      socket.off("order_updated");
      socket.off("menu_updated");
    };
  }, []);

  const executePaymentSettle = async () => {
    if (!confirmPaymentModal) return;
    const { orderId, paymentMethod } = confirmPaymentModal;

    try {
      const res = await fetch(`http://localhost:5000/api/orders/${orderId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: "Paid", paymentMethod })
      });
      if (res.ok) {
        setConfirmPaymentModal(null);
        fetchData();
      }
    } catch (err) {
      console.error("Payment error:", err);
    }
  };

  const toggleStock = async (item) => {
    try {
      const res = await fetch(`http://localhost:5000/api/menu/${item._id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...item, isAvailable: !item.isAvailable })
      });
      if (res.ok) fetchData();
    } catch (err) {
      console.error("Stock toggle error:", err);
    }
  };

  const getOrderTotal = (o) => {
    if (o.totalAmount && o.totalAmount > 0) return o.totalAmount;
    return o.items?.reduce((sum, item) => sum + item.price * item.quantity, 0) || 0;
  };

  const paidOrders = orders.filter((o) => o.status === "Paid");
  const grossRevenue = paidOrders.reduce((sum, o) => sum + getOrderTotal(o), 0);
  const totalTaxCollected = Number((grossRevenue * 0.05).toFixed(2));
  const netSales = Number((grossRevenue - totalTaxCollected).toFixed(2));

  const cashSales = paidOrders
    .filter((o) => o.paymentMethod && o.paymentMethod.toLowerCase() === "cash")
    .reduce((sum, o) => sum + getOrderTotal(o), 0);

  const upiSales = paidOrders
    .filter((o) => o.paymentMethod && (o.paymentMethod.toLowerCase() === "upi" || o.paymentMethod.toLowerCase() === "qr"))
    .reduce((sum, o) => sum + getOrderTotal(o), 0);

  const activeUnpaidOrders = orders.filter((o) => o.status !== "Paid");

  if (loading) return <div style={{ padding: "20px", color: "#1c1917" }}>Loading Admin POS...</div>;

  return (
    <div style={{ padding: "12px", maxWidth: "1100px", margin: "0 auto", fontFamily: "sans-serif" }}>
      
      {/* 📊 Accounting Metrics */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(170px, 1fr))", gap: "10px", marginBottom: "16px" }}>
        <div style={{ backgroundColor: "#ffffff", padding: "12px", borderRadius: "12px", border: "1px solid #f5e6d3" }}>
          <span style={{ fontSize: "10px", color: "#78716c", fontWeight: "700" }}>TOTAL PAID REVENUE</span>
          <h3 style={{ margin: "2px 0 0 0", fontSize: "18px", color: "#16a34a", fontWeight: "800" }}>₹{grossRevenue}</h3>
        </div>
        <div style={{ backgroundColor: "#ffffff", padding: "12px", borderRadius: "12px", border: "1px solid #f5e6d3" }}>
          <span style={{ fontSize: "10px", color: "#78716c", fontWeight: "700" }}>NET SALES (EXCL. GST)</span>
          <h3 style={{ margin: "2px 0 0 0", fontSize: "18px", color: "#1c1917", fontWeight: "800" }}>₹{netSales}</h3>
        </div>
        <div style={{ backgroundColor: "#ffffff", padding: "12px", borderRadius: "12px", border: "1px solid #f5e6d3" }}>
          <span style={{ fontSize: "10px", color: "#78716c", fontWeight: "700" }}>💵 CASH COLLECTED</span>
          <h3 style={{ margin: "2px 0 0 0", fontSize: "18px", color: "#15803d", fontWeight: "800" }}>₹{cashSales}</h3>
        </div>
        <div style={{ backgroundColor: "#ffffff", padding: "12px", borderRadius: "12px", border: "1px solid #f5e6d3" }}>
          <span style={{ fontSize: "10px", color: "#78716c", fontWeight: "700" }}>📱 UPI / QR COLLECTED</span>
          <h3 style={{ margin: "2px 0 0 0", fontSize: "18px", color: "#0284c7", fontWeight: "800" }}>₹{upiSales}</h3>
        </div>
      </div>

      {/* Tabs */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "16px", flexWrap: "wrap", gap: "10px" }}>
        <div style={{ display: "flex", gap: "8px" }}>
          <button onClick={() => setActiveTab("billing")} style={{ padding: "8px 14px", borderRadius: "8px", border: "none", fontWeight: "700", cursor: "pointer", backgroundColor: activeTab === "billing" ? "#dc2626" : "#e7e5e4", color: activeTab === "billing" ? "#fff" : "#44403c", fontSize: "12px" }}>
            💳 Table Billing & Settlement
          </button>
          <button onClick={() => setActiveTab("accounting")} style={{ padding: "8px 14px", borderRadius: "8px", border: "none", fontWeight: "700", cursor: "pointer", backgroundColor: activeTab === "accounting" ? "#dc2626" : "#e7e5e4", color: activeTab === "accounting" ? "#fff" : "#44403c", fontSize: "12px" }}>
            📑 Ledger Reports ({paidOrders.length})
          </button>
        </div>

        <button onClick={() => exportOrdersToCSV(orders)} style={{ padding: "8px 14px", backgroundColor: "#15803d", color: "#fff", border: "none", borderRadius: "8px", fontWeight: "700", cursor: "pointer", fontSize: "12px" }}>
          📊 Download Excel Report (.csv)
        </button>
      </div>

      {/* TAB 1: Billing & Table Settlement */}
      {activeTab === "billing" && (
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(250px, 1fr))", gap: "12px" }}>
          {activeUnpaidOrders.length === 0 ? (
            <div style={{ padding: "20px", backgroundColor: "#fff", borderRadius: "10px", gridColumn: "1/-1", textAlign: "center", color: "#78716c", fontWeight: "600" }}>
              ✅ All tables cleared! No pending open bills.
            </div>
          ) : (
            activeUnpaidOrders.map((order) => {
              const total = getOrderTotal(order);
              return (
                <div key={order._id} style={{ backgroundColor: "#fff", padding: "12px", borderRadius: "12px", border: "1px solid #f5e6d3", display: "flex", flexDirection: "column" }}>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "8px", backgroundColor: "#faf6f0", padding: "6px 10px", borderRadius: "8px", border: "1px solid #f5e6d3" }}>
                    <span style={{ fontSize: "18px", fontWeight: "900", color: "#dc2626" }}>TABLE #{order.tableNumber}</span>
                    <span style={{ fontSize: "10px", fontWeight: "800", color: "#d97706", backgroundColor: "#fef3c7", padding: "2px 6px", borderRadius: "4px" }}>{order.status}</span>
                  </div>

                  <ul style={{ paddingLeft: "16px", fontSize: "12px", margin: "0 0 10px 0", color: "#334155", flexGrow: 1 }}>
                    {order.items?.map((item, idx) => (
                      <li key={idx}><strong>{item.name}</strong> × {item.quantity} (₹{item.price * item.quantity})</li>
                    ))}
                  </ul>

                  <div style={{ fontSize: "15px", fontWeight: "800", color: "#dc2626", marginBottom: "10px", borderTop: "1px dashed #e7e5e4", paddingTop: "6px", display: "flex", justifyContent: "space-between" }}>
                    <span>Total Bill:</span>
                    <span>₹{total}</span>
                  </div>

                  <div style={{ display: "flex", gap: "6px", marginBottom: "6px" }}>
                    <button onClick={() => setConfirmPaymentModal({ orderId: order._id, tableNumber: order.tableNumber, amount: total, paymentMethod: "Cash" })} style={{ flex: 1, padding: "6px", backgroundColor: "#16a34a", color: "#fff", border: "none", borderRadius: "6px", fontWeight: "700", fontSize: "11px", cursor: "pointer" }}>
                      💵 Cash
                    </button>
                    <button onClick={() => setConfirmPaymentModal({ orderId: order._id, tableNumber: order.tableNumber, amount: total, paymentMethod: "UPI" })} style={{ flex: 1, padding: "6px", backgroundColor: "#0284c7", color: "#fff", border: "none", borderRadius: "6px", fontWeight: "700", fontSize: "11px", cursor: "pointer" }}>
                      📱 UPI / QR
                    </button>
                  </div>

                  <button onClick={() => setSelectedPrintOrder(order)} style={{ width: "100%", padding: "5px", backgroundColor: "#44403c", color: "#fff", border: "none", borderRadius: "6px", fontWeight: "700", fontSize: "11px", cursor: "pointer" }}>
                    🖨️ Preview / Print Bill
                  </button>
                </div>
              );
            })
          )}
        </div>
      )}

      {/* TAB 2: Redesigned High-Contrast Audit Ledger */}
      {activeTab === "accounting" && (
        <div style={{ backgroundColor: "#ffffff", padding: "16px", borderRadius: "12px", border: "1px solid #e7e5e4", boxShadow: "0 2px 10px rgba(0,0,0,0.03)", overflowX: "auto" }}>
          <h4 style={{ margin: "0 0 14px 0", fontSize: "14px", fontWeight: "800", color: "#1c1917" }}>
            🧾 Audit Ledger (Settled Tax Invoices)
          </h4>

          <table style={{ width: "100%", borderCollapse: "collapse", fontSize: "12px" }}>
            <thead>
              <tr style={{ backgroundColor: "#1c1917", color: "#ffffff", textAlign: "left" }}>
                <th style={{ padding: "10px 8px" }}>Invoice ID</th>
                <th style={{ padding: "10px 8px" }}>Date & Time</th>
                <th style={{ padding: "10px 8px" }}>Table</th>
                <th style={{ padding: "10px 8px" }}>Items Ordered</th>
                <th style={{ padding: "10px 8px" }}>Gross (₹)</th>
                <th style={{ padding: "10px 8px" }}>CGST (2.5%)</th>
                <th style={{ padding: "10px 8px" }}>SGST (2.5%)</th>
                <th style={{ padding: "10px 8px" }}>Payment</th>
                <th style={{ padding: "10px 8px", textAlign: "center" }}>Action</th>
              </tr>
            </thead>
            <tbody>
              {paidOrders.length === 0 ? (
                <tr>
                  <td colSpan="9" style={{ textAlign: "center", padding: "30px", color: "#78716c", fontWeight: "700", backgroundColor: "#faf6f0" }}>
                    📄 Koi Settled/Paid Invoice nahi mila. Table Settlement se Bill Pay karne par record yahan show hoga.
                  </td>
                </tr>
              ) : (
                paidOrders.map((order) => {
                  const total = getOrderTotal(order);
                  const cgst = (total * 0.025).toFixed(2);
                  const sgst = (total * 0.025).toFixed(2);
                  const itemsSummary = order.items?.map((i) => `${i.name} (x${i.quantity})`).join(", ");

                  return (
                    <tr key={order._id} style={{ borderBottom: "1px solid #f0edf6" }}>
                      <td style={{ padding: "10px 8px", fontWeight: "800", color: "#dc2626" }}>
                        TRB-{order._id?.slice(-6).toUpperCase()}
                      </td>
                      <td style={{ padding: "10px 8px", color: "#44403c" }}>
                        {new Date(order.createdAt || Date.now()).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </td>
                      <td style={{ padding: "10px 8px", fontWeight: "800" }}>#{order.tableNumber}</td>
                      <td style={{ padding: "10px 8px", maxWidth: "200px", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis", color: "#57534e" }}>
                        {itemsSummary}
                      </td>
                      <td style={{ padding: "10px 8px", fontWeight: "800", color: "#16a34a" }}>₹{total}</td>
                      <td style={{ padding: "10px 8px", color: "#78716c" }}>₹{cgst}</td>
                      <td style={{ padding: "10px 8px", color: "#78716c" }}>₹{sgst}</td>
                      <td style={{ padding: "10px 8px" }}>
                        <span style={{
                          padding: "3px 8px",
                          borderRadius: "4px",
                          fontWeight: "800",
                          fontSize: "10px",
                          backgroundColor: order.paymentMethod?.toLowerCase() === "cash" ? "#dcfce7" : "#e0f2fe",
                          color: order.paymentMethod?.toLowerCase() === "cash" ? "#15803d" : "#0369a1"
                        }}>
                          {order.paymentMethod?.toUpperCase() || "CASH"}
                        </span>
                      </td>
                      <td style={{ padding: "10px 8px", textAlign: "center" }}>
                        <button onClick={() => setSelectedPrintOrder(order)} style={{ padding: "4px 8px", backgroundColor: "#dc2626", color: "#fff", border: "none", borderRadius: "4px", fontSize: "10px", fontWeight: "700", cursor: "pointer" }}>
                          Print Bill
                        </button>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
            {paidOrders.length > 0 && (
              <tfoot>
                <tr style={{ backgroundColor: "#faf6f0", fontWeight: "800", borderTop: "2px solid #1c1917" }}>
                  <td colSpan="4" style={{ padding: "10px 8px", textAlign: "right" }}>TOTAL SUMMARY:</td>
                  <td style={{ padding: "10px 8px", color: "#16a34a", fontSize: "13px" }}>₹{grossRevenue}</td>
                  <td style={{ padding: "10px 8px", color: "#dc2626" }}>₹{(totalTaxCollected / 2).toFixed(2)}</td>
                  <td style={{ padding: "10px 8px", color: "#dc2626" }}>₹{(totalTaxCollected / 2).toFixed(2)}</td>
                  <td colSpan="2"></td>
                </tr>
              </tfoot>
            )}
          </table>
        </div>
      )}

      {/* Confirmation Modal */}
      {confirmPaymentModal && (
        <div style={{ position: "fixed", top: 0, left: 0, width: "100vw", height: "100vh", backgroundColor: "rgba(0,0,0,0.5)", display: "flex", justifyContent: "center", alignItems: "center", zIndex: 1000 }}>
          <div style={{ backgroundColor: "#fff", padding: "20px", borderRadius: "12px", width: "320px", textAlign: "center" }}>
            <h3 style={{ margin: "0 0 8px 0" }}>Confirm Payment</h3>
            <p style={{ fontSize: "13px", color: "#78716c", margin: "0 0 14px 0" }}>
              Settle bill of <strong>₹{confirmPaymentModal.amount}</strong> for <strong>Table #{confirmPaymentModal.tableNumber}</strong> via <strong>{confirmPaymentModal.paymentMethod}</strong>?
            </p>
            <div style={{ display: "flex", gap: "10px" }}>
              <button onClick={executePaymentSettle} style={{ flex: 1, padding: "10px", backgroundColor: "#16a34a", color: "#fff", border: "none", borderRadius: "6px", fontWeight: "800", cursor: "pointer" }}>
                Confirm & Clear
              </button>
              <button onClick={() => setConfirmPaymentModal(null)} style={{ flex: 1, padding: "10px", backgroundColor: "#78716c", color: "#fff", border: "none", borderRadius: "6px", fontWeight: "700", cursor: "pointer" }}>
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Thermal Bill Modal */}
      {selectedPrintOrder && (
        <PrintReceipt order={selectedPrintOrder} onClose={() => setSelectedPrintOrder(null)} />
      )}
    </div>
  );
};

export default AdminView;