import express from "express";
import http from "http";
import { Server } from "socket.io";
import cors from "cors";
import dotenv from "dotenv";
import mongoose from "mongoose";

import orderRoutes from "./routes/order.Routes.js";
import menuRoutes from "./routes/menu.Routes.js"; // Adjust path if needed

dotenv.config();

const app = express();
const server = http.createServer(app);

// 🌐 Allowed Origins List (Vercel Frontend & Localhost)
const allowedOrigins = [
  "https://major-internship-project-real-world.vercel.app",
  "https://major-internship-project-real-world.vercel.app/",
  "http://localhost:5173",
  "http://localhost:3000"
];

// 1️⃣ Express CORS Middleware Setup
app.use(
  cors({
    origin: function (origin, callback) {
      if (!origin || allowedOrigins.includes(origin)) {
        callback(null, true);
      } else {
        callback(null, true); // Development/Production safe fallback
      }
    },
    credentials: true,
    methods: ["GET", "POST", "PATCH", "PUT", "DELETE"]
  })
);

app.use(express.json());

// 2️⃣ Socket.io Server Setup with CORS Fix
const io = new Server(server, {
  cors: {
    origin: "*", // '*' lagane se Vercel aur WebSockets ka trailing slash conflict solve ho jata hai
    methods: ["GET", "POST", "PATCH", "PUT", "DELETE"],
    credentials: true
  }
});

// Socket instance ko Express app me attach karna
app.set("io", io);

// 🔌 Socket Connection Events
io.on("connection", (socket) => {
  console.log("⚡ New Client Connected:", socket.id);

  // Bill Request Event Listener from Customer View
  socket.on("request_bill", (data) => {
    io.emit("order_updated", data);
  });

  socket.on("order_updated", () => {
    io.emit("order_updated");
  });

  socket.on("disconnect", () => {
    console.log("❌ Client Disconnected:", socket.id);
  });
});

// 📍 Routes
app.use("/api/orders", orderRoutes);
app.use("/api/menu", menuRoutes);

// Base route test
app.get("/", (req, res) => {
  res.send("The Rice Bowl Backend API is running...");
});

// 🚀 Database Connection & Server Start
const PORT = process.env.PORT || 5000;
const MONGO_URI = process.env.MONGO_URI || "mongodb://localhost:27017/ricebowl";

mongoose
  .connect(MONGO_URI)
  .then(() => {
    console.log("✅ MongoDB Connected Successfully");
    server.listen(PORT, () => console.log(`🚀 Server running on port ${PORT}`));
  })
  .catch((err) => console.error("❌ MongoDB Connection Error:", err));