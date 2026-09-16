import express from "express";
import http from "http";
import { Server } from "socket.io";
import cors from "cors";
import dotenv from "dotenv";
import mongoose from "mongoose";

import orderRoutes from "./routes/order.Routes.js";
import menuRoutes from "./routes/menu.Routes.js";
import settingRoutes from "./routes/settings.routes.js";

dotenv.config();

const app = express();
const server = http.createServer(app);

// 🌐 Dynamic CORS Origin Fix
const corsOptions = {
  origin: (origin, callback) => {
    if (!origin) return callback(null, true);
    return callback(null, origin);
  },
  credentials: true,
  methods: ["GET", "POST", "PATCH", "PUT", "DELETE", "OPTIONS"],
  allowedHeaders: ["Content-Type", "Authorization"]
};

app.use(cors(corsOptions));
app.options("*", cors(corsOptions));
app.use(express.json());

// 🔌 Socket.io Setup
const io = new Server(server, {
  cors: {
    origin: (origin, callback) => {
      if (!origin) return callback(null, true);
      return callback(null, origin);
    },
    methods: ["GET", "POST", "PATCH", "PUT", "DELETE", "OPTIONS"],
    credentials: true
  },
  transports: ["websocket", "polling"]
});

app.set("io", io);

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

  socket.on("settings_updated", () => {
    io.emit("settings_updated");
  });

  socket.on("disconnect", () => {
    console.log("❌ Client Disconnected:", socket.id);
  });
});

// 📍 Routes Setup
app.use("/api/orders", orderRoutes);
app.use("/api/menu", menuRoutes);
app.use("/api/settings", settingRoutes);

app.get("/", (req, res) => {
  res.send("The Rice Bowl POS Backend API is live...");
});

// 🚀 Start Server
const PORT = process.env.PORT || 5000;
const MONGO_URI = process.env.MONGO_URI || "mongodb://localhost:27017/ricebowl";

mongoose
  .connect(MONGO_URI)
  .then(() => {
    console.log("✅ MongoDB Connected Successfully");
    server.listen(PORT, () => console.log(`🚀 Server running on port ${PORT}`));
  })
  .catch((err) => console.error("❌ MongoDB Connection Error:", err));