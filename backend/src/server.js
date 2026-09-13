import express from "express";
import http from "http";
import { Server } from "socket.io";
import mongoose from "mongoose";
import cors from "cors";
import dotenv from "dotenv";
import dns from "dns";

dns.setDefaultResultOrder("ipv4first");

dns.setServers([
  "1.1.1.1",
  "8.8.8.8"
]);

dotenv.config();

import menuRoutes from "./routes/menu.Routes.js";
import orderRoutes from "./routes/order.Routes.js";

const app = express();
const server = http.createServer(app);

const io = new Server(server, {
  cors: {
    origin: "*",
    methods: ["GET", "POST", "PATCH", "PUT", "DELETE"]
  }
});

app.set("io", io);

io.on("connection", (socket) => {
  console.log("⚡ Kitchen/Client Connected to WebSocket:", socket.id);

  socket.on("disconnect", () => {
    console.log("❌ Client Disconnected:", socket.id);
  });
});

app.use(cors());
app.use(express.json());

const MONGO_URI = process.env.MONGO_URI || "mongodb://127.0.0.1:27017/ricebowl_pos";

mongoose
  .connect(MONGO_URI)
  .then(() => console.log("✅ MongoDB Connected Successfully"))
  .catch((err) => console.error("❌ MongoDB Connection Error:", err));


app.use("/api/menu", menuRoutes);
app.use("/api/menus", menuRoutes);
app.use("/api/orders", orderRoutes);
app.use("/api/order", orderRoutes);

app.get("/", (req, res) => {
  res.send("THE RICE BOWL POS Backend API with WebSockets is running!");
});

const PORT = process.env.PORT || 5000;
server.listen(PORT, () => {
  console.log(`🚀 Server & WebSockets running on port ${PORT}`);
});