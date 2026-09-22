import express from "express";
import http from "http";
import { Server } from "socket.io";
import mongoose from "mongoose";
import cors from "cors";
import dotenv from "dotenv";
import dns from "dns";
dns.setServers([
  "1.1.1.1",
  "8.8.8.8"
])
dotenv.config();

const app = express();
const server = http.createServer(app);

app.use(cors({ origin: "*", credentials: true }));
app.use(express.json());

// MongoDB Connection
const MONGO_URI = process.env.MONGO_URI || "mongodb://127.0.0.1:27017/ricebowl_pos";
mongoose.connect(MONGO_URI)
  .then(() => console.log("MongoDB Connected Successfully"))
  .catch((err) => console.error("MongoDB Connection Error:", err));

// Schemas & Models
const orderSchema = new mongoose.Schema({
  tableNumber: Number,
  items: [
    {
      name: String,
      price: Number,
      quantity: Number,
      instructions: { type: String, default: "" },
      status: { type: String, default: "Active" }
    }
  ],
  orderNote: { type: String, default: "" },
  totalAmount: Number,
  status: { type: String, default: "Pending" },
  paymentMethod: { type: String, default: "" },
  discountAmount: { type: Number, default: 0 },
  createdAt: { type: Date, default: Date.now }
}, { timestamps: true });

const menuSchema = new mongoose.Schema({
  name: String,
  category: String,
  price: Number,
  image: String,
  isAvailable: { type: Boolean, default: true }
});

const settingsSchema = new mongoose.Schema({
  isRestaurantOpen: { type: Boolean, default: true },
  disabledTables: { type: [Number], default: [] }
});

const Order = mongoose.model("Order", orderSchema);
const MenuItem = mongoose.model("MenuItem", menuSchema);
const Settings = mongoose.model("Settings", settingsSchema);

// Socket.io Real-Time Handler
const io = new Server(server, {
  cors: { origin: "*", methods: ["GET", "POST", "PATCH", "PUT", "DELETE"] }
});

io.on("connection", (socket) => {
  console.log("⚡ Client connected:", socket.id);

  // 🔔 BROADCAST SERVICE REQUESTS (WATER, WAITER, CLEAN TABLE, DELAY COMPLAINT)
  socket.on("customer_complaint", (data) => {
    console.log("📩 Service Request Received:", data);
    io.emit("service_alert", data);
    io.emit("admin_alert", data);
    io.emit("kitchen_alert", data);
  });

  // 🧾 BILL REQUEST
  socket.on("request_bill", (data) => {
    const billData = {
      tableNumber: data.tableNumber,
      message: `🧾 Table #${data.tableNumber} requested Bill Payment! Total: ₹${data.totalAmount}`
    };
    io.emit("admin_alert", billData);
    io.emit("kitchen_alert", billData);
    io.emit("service_alert", billData);
  });

  socket.on("order_updated", () => {
    io.emit("order_updated");
  });

  socket.on("menu_updated", () => {
    io.emit("menu_updated");
  });

  socket.on("settings_updated", () => {
    io.emit("settings_updated");
  });

  socket.on("session_reset", (data) => {
    io.emit("session_reset", data);
  });

  socket.on("disconnect", () => {
    console.log("Client disconnected:", socket.id);
  });
});

// REST API Endpoints

app.get("/api/menu", async (req, res) => {
  try {
    const items = await MenuItem.find();
    res.json({ success: true, data: items });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

app.post("/api/menu", async (req, res) => {
  try {
    const newItem = new MenuItem(req.body);
    await newItem.save();
    res.json({ success: true, data: newItem });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

app.put("/api/menu/:id", async (req, res) => {
  try {
    const updated = await MenuItem.findByIdAndUpdate(req.params.id, req.body, { new: true });
    res.json({ success: true, data: updated });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

app.delete("/api/menu/:id", async (req, res) => {
  try {
    await MenuItem.findByIdAndDelete(req.params.id);
    res.json({ success: true, message: "Dish deleted" });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

app.get("/api/orders", async (req, res) => {
  try {
    const orders = await Order.find().sort({ createdAt: -1 });
    res.json({ success: true, data: orders });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

app.post("/api/orders", async (req, res) => {
  try {
    const newOrder = new Order(req.body);
    await newOrder.save();
    res.json({ success: true, data: newOrder });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

app.patch("/api/orders/:id", async (req, res) => {
  try {
    const updated = await Order.findByIdAndUpdate(req.params.id, req.body, { new: true });
    res.json({ success: true, data: updated });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// ❌ CANCEL SINGLE ITEM IN AN ORDER
app.patch("/api/orders/:id/cancel-item", async (req, res) => {
  try {
    const { itemIndex } = req.body;
    const order = await Order.findById(req.params.id);
    if (!order) return res.status(404).json({ success: false, message: "Order not found" });

    if (order.items && order.items[itemIndex]) {
      order.items[itemIndex].status = "Cancelled";
      const activeItems = order.items.filter((i) => i.status !== "Cancelled");
      order.totalAmount = activeItems.reduce((sum, i) => sum + i.price * i.quantity, 0);

      if (activeItems.length === 0) {
        order.status = "Cancelled";
      }

      await order.save();
    }
    res.json({ success: true, data: order });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

app.patch("/api/orders/:id/pay", async (req, res) => {
  try {
    const { paymentMethod, discountAmount } = req.body;
    const order = await Order.findById(req.params.id);
    if (!order) return res.status(404).json({ success: false, message: "Order not found" });

    order.status = "Paid";
    order.paymentMethod = paymentMethod;
    if (discountAmount) order.discountAmount = discountAmount;

    await order.save();
    res.json({ success: true, data: order });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

app.get("/api/settings", async (req, res) => {
  try {
    let settings = await Settings.findOne();
    if (!settings) {
      settings = new Settings({ isRestaurantOpen: true, disabledTables: [] });
      await settings.save();
    }
    res.json({ success: true, data: settings });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

app.put("/api/settings", async (req, res) => {
  try {
    let settings = await Settings.findOne();
    if (!settings) {
      settings = new Settings(req.body);
    } else {
      settings.isRestaurantOpen = req.body.isRestaurantOpen;
      settings.disabledTables = req.body.disabledTables;
    }
    await settings.save();
    res.json({ success: true, data: settings });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

const PORT = process.env.PORT || 5000;
server.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});