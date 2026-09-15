import React, { useState, useEffect } from "react";
import { io } from "socket.io-client";
import PrintReceipt from "../components/PrintReceipt";
import { exportOrdersToCSV } from "../utils/exportToExcel";

const CLOUD_NAME = "mno0e0mz"; 
const UPLOAD_PRESET = "order_app";

const BACKEND_URL = import.meta.env.VITE_BACKEND_URL || "https://rice-bowl-ordering-app.onrender.com";
const socket = io(BACKEND_URL);

const AdminView = () => {
  const [activeTab, setActiveTab] = useState("billing"); 
  const [menuItems, setMenuItems] = useState([]);
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [editingItem, setEditingItem] = useState(null);
  const [selectedPrintOrder, setSelectedPrintOrder] = useState(null);
  const [confirmPaymentModal, setConfirmPaymentModal] = useState(null);

  const [formData, setFormData] = useState({
    name: "", category: "Rice Bowls", price: "", image: "", isAvailable: true
  });

  const fetchData = async () => {
    try {
      const [menuRes, ordersRes] = await Promise.all([
        fetch(`${BACKEND_URL}/api/menu`),
        fetch(`${BACKEND_URL}/api/orders`)
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

  // ☁️ Cloudinary Image Upload
  const handleImageUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    setUploading(true);

    const data = new FormData();
    data.append("file", file);
    data.append("upload_preset", UPLOAD_PRESET);

    try {
      const res = await fetch(`https://api.cloudinary.com/v1_1/${CLOUD_NAME}/image/upload`, {
        method: "POST",
        body: data
      });
      const fileData = await res.json();
      if (fileData.secure_url) {
        setFormData((prev) => ({ ...prev, image: fileData.secure_url }));
      }
    } catch (err) {
      console.error("Cloudinary Upload Error:", err);
    } finally {
      setUploading(false);
    }
  };

  // ➕ Add or Update Dish
  const handleSubmitDish = async (e) => {
    e.preventDefault();
    if (!formData.name || !formData.price) return;

    const url = editingItem 
      ? `${BACKEND_URL}/api/menu/${editingItem._id}` 
      : `${BACKEND_URL}/api/menu`;
    const method = editingItem ? "PUT" : "POST";

    try {
      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData)
      });
      if (res.ok) {
        setFormData({ name: "", category: "Rice Bowls", price: "", image: "", isAvailable: true });
        setEditingItem(null);
        fetchData();
        socket.emit("menu_updated");
      }
    } catch (err) {
      console.error("Dish submit error:", err);
    }
  };

  // 🗑️ Delete Dish
  const handleDeleteDish = async (id) => {
    if (!window.confirm("Is dish ko menu se delete karna chahte ho?")) return;
    try {
      const res = await fetch(`${BACKEND_URL}/api/menu/${id}`, { method: "DELETE" });
      if (res.ok) {
        fetchData();
        socket.emit("menu_updated");
      }
    } catch (err) {
      console.error("Delete error:", err);
    }
  };

  // ✏️ Edit Dish Initiate
  const handleEditClick = (item) => {
    setEditingItem(item);
    setFormData({
      name: item.name,
      category: item.category || "Rice Bowls",
      price: item.price,
      image: item.image || "",
      isAvailable: item.isAvailable
    });
  };

  const toggleStock = async (item) => {
    try {
      const res = await fetch(`${BACKEND_URL}/api/menu/${item._id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...item, isAvailable: !item.isAvailable })
      });
      if (res.ok) {
        fetchData();
        socket.emit("menu_updated");
      }
    } catch (err) {
      console.error("Stock toggle error:", err);
    }
  };

  const executePaymentSettle = async () => {
    if (!confirmPaymentModal) return;
    const { orderId, paymentMethod } = confirmPaymentModal;

    try {
      const res = await fetch(`${BACKEND_URL}/api/orders/${orderId}`, {
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
      
      {/* Accounting Metrics */}
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
          <button onClick={() => setActiveTab("menu")} style={{ padding: "8px 14px", borderRadius: "8px", border: "none", fontWeight: "700", cursor: "pointer", backgroundColor: activeTab === "menu" ? "#dc2626" : "#e7e5e4", color: activeTab === "menu" ? "#fff" : "#44403c", fontSize: "12px" }}>
            📜 Menu & Dish Management ({menuItems.length})
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

      {/* TAB 2: Ledger Reports */}
      {activeTab === "accounting" && (
        <div style={{ backgroundColor: "#ffffff", padding: "16px", borderRadius: "12px", border: "1px solid #e7e5e4", overflowX: "auto" }}>
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
                    📄 No Settled/Paid Invoices found.
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
          </table>
        </div>
      )}

      {/* TAB 3: Complete Menu, Image Upload, Edit & Delete Management */}
      {activeTab === "menu" && (
        <div style={{ backgroundColor: "#ffffff", padding: "16px", borderRadius: "12px", border: "1px solid #e7e5e4" }}>
          <h4 style={{ margin: "0 0 14px 0", fontSize: "14px", fontWeight: "800", color: "#1c1917" }}>
            {editingItem ? "✏️ Edit Dish Item" : "➕ Add New Dish Item"}
          </h4>

          {/* Add / Edit Form */}
          <form onSubmit={handleSubmitDish} style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))", gap: "10px", marginBottom: "20px", backgroundColor: "#faf6f0", padding: "14px", borderRadius: "8px", border: "1px solid #f5e6d3" }}>
            <div>
              <label style={{ fontSize: "10px", fontWeight: "700", color: "#78716c" }}>DISH NAME</label>
              <input
                type="text"
                placeholder="e.g. Paneer Tikka Rice Bowl"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                style={{ width: "100%", padding: "8px", borderRadius: "6px", border: "1px solid #d6d3d1", fontSize: "12px", marginTop: "4px" }}
                required
              />
            </div>

            <div>
              <label style={{ fontSize: "10px", fontWeight: "700", color: "#78716c" }}>PRICE (₹)</label>
              <input
                type="number"
                placeholder="220"
                value={formData.price}
                onChange={(e) => setFormData({ ...formData, price: e.target.value })}
                style={{ width: "100%", padding: "8px", borderRadius: "6px", border: "1px solid #d6d3d1", fontSize: "12px", marginTop: "4px" }}
                required
              />
            </div>

            <div>
              <label style={{ fontSize: "10px", fontWeight: "700", color: "#78716c" }}>CATEGORY</label>
              <select
                value={formData.category}
                onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                style={{ width: "100%", padding: "8px", borderRadius: "6px", border: "1px solid #d6d3d1", fontSize: "12px", marginTop: "4px" }}
              >
                <option value="Rice Bowls">Rice Bowls</option>
                <option value="Starters">Starters</option>
                <option value="Beverages">Beverages</option>
                <option value="Desserts">Desserts</option>
              </select>
            </div>

            <div>
              <label style={{ fontSize: "10px", fontWeight: "700", color: "#78716c" }}>DISH IMAGE (CLOUDINARY)</label>
              <input
                type="file"
                accept="image/*"
                onChange={handleImageUpload}
                style={{ width: "100%", padding: "5px", fontSize: "11px", marginTop: "4px" }}
              />
              {uploading && <span style={{ fontSize: "10px", color: "#0284c7" }}>Uploading to Cloudinary...</span>}
              {formData.image && <span style={{ fontSize: "10px", color: "#16a34a", display: "block" }}>✓ Image Uploaded</span>}
            </div>

            <div style={{ gridColumn: "1/-1", display: "flex", gap: "10px", marginTop: "6px" }}>
              <button type="submit" style={{ padding: "8px 20px", backgroundColor: editingItem ? "#0284c7" : "#16a34a", color: "#fff", border: "none", borderRadius: "6px", fontWeight: "700", fontSize: "12px", cursor: "pointer" }}>
                {editingItem ? "Update Dish" : "+ Add Dish"}
              </button>
              {editingItem && (
                <button type="button" onClick={() => { setEditingItem(null); setFormData({ name: "", category: "Rice Bowls", price: "", image: "", isAvailable: true }); }} style={{ padding: "8px 16px", backgroundColor: "#78716c", color: "#fff", border: "none", borderRadius: "6px", fontWeight: "700", fontSize: "12px", cursor: "pointer" }}>
                  Cancel Edit
                </button>
              )}
            </div>
          </form>

          {/* Menu Items List with Image, Edit, Delete */}
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(300px, 1fr))", gap: "12px" }}>
            {menuItems.map((item) => (
              <div key={item._id} style={{ display: "flex", gap: "12px", alignItems: "center", padding: "10px", backgroundColor: "#fff", borderRadius: "10px", border: "1px solid #e7e5e4" }}>
                <img
                  src={item.image || "https://via.placeholder.com/60"}
                  alt={item.name}
                  style={{ width: "60px", height: "60px", borderRadius: "8px", objectFit: "cover", backgroundColor: "#f5e6d3" }}
                />
                <div style={{ flexGrow: 1 }}>
                  <strong style={{ display: "block", fontSize: "13px", color: "#1c1917" }}>{item.name}</strong>
                  <span style={{ fontSize: "12px", color: "#15803d", fontWeight: "800" }}>₹{item.price}</span>
                  <span style={{ fontSize: "10px", color: "#78716c", marginLeft: "6px" }}>({item.category})</span>
                  
                  <div style={{ display: "flex", gap: "6px", marginTop: "6px" }}>
                    <button
                      onClick={() => toggleStock(item)}
                      style={{
                        padding: "3px 8px",
                        borderRadius: "12px",
                        border: "none",
                        fontWeight: "700",
                        fontSize: "10px",
                        cursor: "pointer",
                        backgroundColor: item.isAvailable ? "#dcfce7" : "#fee2e2",
                        color: item.isAvailable ? "#15803d" : "#dc2626"
                      }}
                    >
                      {item.isAvailable ? "In Stock" : "Out of Stock"}
                    </button>

                    <button onClick={() => handleEditClick(item)} style={{ padding: "3px 8px", backgroundColor: "#e0f2fe", color: "#0369a1", border: "none", borderRadius: "12px", fontSize: "10px", fontWeight: "700", cursor: "pointer" }}>
                      ✏️ Edit
                    </button>

                    <button onClick={() => handleDeleteDish(item._id)} style={{ padding: "3px 8px", backgroundColor: "#fee2e2", color: "#dc2626", border: "none", borderRadius: "12px", fontSize: "10px", fontWeight: "700", cursor: "pointer" }}>
                      🗑️ Delete
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
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