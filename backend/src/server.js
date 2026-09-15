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

// 🌐 Dynamic Origin Reflection Fix (Reflects exact origin string back to browser)
const corsOptions = {
  origin: (origin, callback) => {
    // Postman, curl ya mobile app requests ke liye bina origin allow karein
    if (!origin) return callback(null, true);
    // Browser origin string ko as-is return karein (Boolean `true` mat pass karein)
    return callback(null, origin);
  },
  credentials: true,
  methods: ["GET", "POST", "PATCH", "PUT", "DELETE", "OPTIONS"],
  allowedHeaders: ["Content-Type", "Authorization"]
};

// Apply CORS to Express
app.use(cors(corsOptions));
app.options("*", cors(corsOptions)); // Handle Preflight OPTIONS requests
app.use(express.json());

// 🔌 Socket.io Setup with CORS Fix
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

// Socket Event Listeners
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

// Routes
app.use("/api/orders", orderRoutes);
app.use("/api/menu", menuRoutes);

app.get("/", (req, res) => {
  res.send("The Rice Bowl POS Backend API is live...");
});

// Server Connection
const PORT = process.env.PORT || 5000;
const MONGO_URI = process.env.MONGO_URI || "mongodb://localhost:27017/ricebowl";

mongoose
  .connect(MONGO_URI)
  .then(() => {
    console.log("✅ MongoDB Connected Successfully");
    server.listen(PORT, () => console.log(`🚀 Server running on port ${PORT}`));
  })
  .catch((err) => console.error("❌ MongoDB Connection Error:", err));