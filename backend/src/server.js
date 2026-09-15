import express from "express";
import http from "http";
import { Server } from "socket.io";
import cors from "cors";
import dotenv from "dotenv";
import mongoose from "mongoose";

import orderRoutes from "./routes/order.Routes.js";
import menuRoutes from "./routes/menu.Routes.js";

dotenv.config();

const app = express();
const server = http.createServer(app);

// 🌐 Dynamic CORS Reflection (Solves Vercel & Render origin/slash mismatch)
const corsOptions = {
  origin: (origin, callback) => callback(null, true),
  credentials: true,
  methods: ["GET", "POST", "PATCH", "PUT", "DELETE"]
};

app.use(cors(corsOptions));
app.use(express.json());

// 🔌 Socket.io Setup with CORS & Multi-Transport Fix
const io = new Server(server, {
  cors: {
    origin: (origin, callback) => callback(null, true),
    methods: ["GET", "POST", "PATCH", "PUT", "DELETE"],
    credentials: true
  },
  transports: ["websocket", "polling"]
});

app.set("io", io);

// 🔌 Socket Connection Listeners
io.on("connection", (socket) => {
  console.log("⚡ Client Connected:", socket.id);

  socket.on("request_bill", (data) => {
    io.emit("order_updated", data);
  });

  socket.on("order_updated", () => {
    io.emit("order_updated");
  });

  socket.on("menu_updated", () => {
    io.emit("menu_updated");
  });

  socket.on("disconnect", () => {
    console.log("❌ Client Disconnected:", socket.id);
  });
});

// 📍 Routes Setup
app.use("/api/orders", orderRoutes);
app.use("/api/menu", menuRoutes);

app.get("/", (req, res) => {
  res.send("The Rice Bowl POS Backend API is live...");
});

// 🚀 Database Connection & Server Listen
const PORT = process.env.PORT || 5000;
const MONGO_URI = process.env.MONGO_URI || "mongodb://localhost:27017/ricebowl";

mongoose
  .connect(MONGO_URI)
  .then(() => {
    console.log("✅ MongoDB Connected Successfully");
    server.listen(PORT, () => console.log(`🚀 Server running on port ${PORT}`));
  })
  .catch((err) => console.error("❌ MongoDB Connection Error:", err));