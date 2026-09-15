import express from "express";
import http from "http";
import { Server } from "socket.io";
import mongoose from "mongoose";
import cors from "cors";
import dotenv from "dotenv";
import dns from "dns";
import path from "path";

import menuRoutes from "./routes/menu.Routes.js";
import orderRoutes from "./routes/order.Routes.js";
import Order from "./models/orderModel.js";

dns.setDefaultResultOrder("ipv4first");
dns.setServers(["1.1.1.1", "8.8.8.8"]);

dotenv.config();

const app = express();
const server = http.createServer(app);
const __dirname = path.resolve();

app.use(cors({
  origin: process.env.CLIENT_URL || "*",
  methods: ["GET", "POST", "PUT", "PATCH", "DELETE"],
  credentials: true
}));
app.use(express.json());

const io = new Server(server, {
  cors: {
    origin: process.env.CLIENT_URL || "*",
    methods: ["GET", "POST", "PUT", "PATCH", "DELETE"]
  }
});

app.set("io", io);

io.on("connection", (socket) => {
  console.log("⚡ Kitchen/Client Connected to WebSocket:", socket.id);

  socket.on("disconnect", () => {
    console.log("❌ Client Disconnected:", socket.id);
  });
});

const MONGO_URI = process.env.MONGO_URI || "mongodb://127.0.0.1:27017/ricebowl_pos";

mongoose
  .connect(MONGO_URI)
  .then(() => console.log("✅ MongoDB Connected Successfully"))
  .catch((err) => console.error("❌ MongoDB Connection Error:", err));

app.use("/api/menu", menuRoutes);
app.use("/api/menus", menuRoutes);
app.use("/api/orders", orderRoutes);
app.use("/api/order", orderRoutes);

app.patch("/api/orders/:id/cancel-item", async (req, res) => {
  try {
    const { itemIndex } = req.body;
    const order = await Order.findById(req.params.id);

    if (!order) return res.status(404).json({ success: false, message: "Order not found" });

    order.items[itemIndex].status = "Cancelled";

    order.totalAmount = order.items
      .filter((item) => item.status !== "Cancelled")
      .reduce((sum, item) => sum + item.price * item.quantity, 0);

    const allCancelled = order.items.every((item) => item.status === "Cancelled");
    if (allCancelled) {
      order.status = "Cancelled";
    }

    await order.save();
    
    io.emit("order_updated");

    res.json({ success: true, data: order });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

app.get("/", (req, res) => {
  res.send("THE RICE BOWL POS Backend API with WebSockets is running!");
});

if (process.env.NODE_ENV === "production") {
  app.use(express.static(path.join(__dirname, "../frontend/build")));
}

const PORT = process.env.PORT || 5000;
server.listen(PORT, () => {
  console.log(`🚀 Server & WebSockets running on port ${PORT}`);
});