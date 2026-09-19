import express from "express";
import http from "http";
import { Server } from "socket.io";
import cors from "cors";
import dotenv from "dotenv";
import mongoose from "mongoose";
import dns from "dns";
import orderRoutes from "./routes/order.Routes.js";
import menuRoutes from "./routes/menu.Routes.js";
import settingRoutes from "./routes/settings.routes.js";

dns.setServers([
  "1.1.1.1",
  "8.8.8.8"
]);
dotenv.config();

const app = express();
const server = http.createServer(app);

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
app.use(express.json());

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

  // 🚨 Delay Complaint Socket Event
  socket.on("customer_complaint", (data) => {
    io.emit("admin_alert", data);
  });

  // 🔄 Session Reset Broadcast Event
  socket.on("session_reset", (data) => {
    io.emit("session_reset", data);
  });

  socket.on("disconnect", () => {
    console.log("❌ Client Disconnected:", socket.id);
  });
});

app.use("/api/orders", orderRoutes);
app.use("/api/menu", menuRoutes);
app.use("/api/settings", settingRoutes);

app.get("/", (req, res) => {
  res.send("The Rice Bowl POS Backend API is live...");
});

const PORT = process.env.PORT || 5000;
const MONGO_URI = process.env.MONGO_URI || "mongodb://localhost:27017/ricebowl";

mongoose
  .connect(MONGO_URI)
  .then(() => {
    console.log("✅ MongoDB Connected Successfully");
    server.listen(PORT, () => console.log(`🚀 Server running on port ${PORT}`));
  })
  .catch((err) => console.error("❌ MongoDB Connection Error:", err));