import express from "express";
import Order from "../models/orderModel.js";
import Counter from "../models/counterModel.js";

const router = express.Router();

const safeRound = (val) => Math.round((val + Number.EPSILON) * 100) / 100;

// 📍 1. GET All Orders
router.get("/", async (req, res) => {
  try {
    const orders = await Order.find().sort({ createdAt: -1 });
    res.json({ success: true, data: orders });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// 📍 2. CREATE New Order
router.post("/", async (req, res) => {
  try {
    const newOrder = new Order(req.body);
    await newOrder.save();
    
    const io = req.app.get("io");
    if (io) io.emit("order_updated");

    res.status(201).json({ success: true, data: newOrder });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// 📍 3. SETTLE PAYMENT & INVOICE (Must be defined BEFORE generic /:id)
router.patch("/:id/pay", async (req, res) => {
  try {
    const { paymentMethod, cashAmount, upiAmount, discountAmount } = req.body;
    const order = await Order.findById(req.params.id);
    if (!order) return res.status(404).json({ success: false, message: "Order not found" });

    // Generate Invoice Number safely
    if (!order.invoiceNumber) {
      try {
        const counter = await Counter.findOneAndUpdate(
          { id: "invoice_seq" },
          { $inc: { seq: 1 } },
          { new: true, upsert: true }
        );
        const year = new Date().getFullYear();
        order.invoiceNumber = `TRB/${year}-${year + 1}/${String(counter?.seq || 1).padStart(4, "0")}`;
      } catch (cErr) {
        order.invoiceNumber = `TRB-${Date.now().toString().slice(-6)}`;
      }
    }

    order.status = "Paid";
    order.paymentMethod = paymentMethod || "Cash";
    order.paymentBreakdown = {
      cashAmount: safeRound(Number(cashAmount) || 0),
      upiAmount: safeRound(Number(upiAmount) || 0)
    };

    if (discountAmount && Number(discountAmount) > 0) {
      order.discount = { type: "FLAT", amount: safeRound(Number(discountAmount)) };
      order.totalAmount = safeRound(Math.max(0, order.totalAmount - Number(discountAmount)));
    }

    await order.save();

    const io = req.app.get("io");
    if (io) io.emit("order_updated");

    res.json({ success: true, data: order });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// 📍 4. CANCEL Single Item
router.patch("/:id/cancel-item", async (req, res) => {
  try {
    const { itemIndex } = req.body;
    const order = await Order.findById(req.params.id);
    if (!order) return res.status(404).json({ success: false, message: "Order not found" });

    order.items[itemIndex].status = "Cancelled";
    
    order.totalAmount = safeRound(
      order.items
        .filter((item) => item.status !== "Cancelled")
        .reduce((sum, item) => sum + item.price * item.quantity, 0)
    );

    const allCancelled = order.items.every((item) => item.status === "Cancelled");
    if (allCancelled) order.status = "Cancelled";

    await order.save();

    const io = req.app.get("io");
    if (io) io.emit("order_updated");

    res.json({ success: true, data: order });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// 📍 5. UPDATE Status (Generic /:id)
router.patch("/:id", async (req, res) => {
  try {
    const order = await Order.findByIdAndUpdate(req.params.id, req.body, { new: true });
    
    const io = req.app.get("io");
    if (io) io.emit("order_updated");

    res.json({ success: true, data: order });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// 📍 6. DAILY SUMMARY
router.get("/daily-summary", async (req, res) => {
  try {
    const startOfDay = new Date();
    startOfDay.setHours(0, 0, 0, 0);

    const endOfDay = new Date();
    endOfDay.setHours(23, 59, 59, 999);

    const todayPaidOrders = await Order.find({
      status: "Paid",
      updatedAt: { $gte: startOfDay, $lte: endOfDay }
    });

    const totalRevenue = safeRound(todayPaidOrders.reduce((sum, o) => sum + o.totalAmount, 0));
    const totalCash = safeRound(todayPaidOrders.reduce((sum, o) => sum + (o.paymentBreakdown?.cashAmount || 0), 0));
    const totalUPI = safeRound(todayPaidOrders.reduce((sum, o) => sum + (o.paymentBreakdown?.upiAmount || 0), 0));

    res.json({
      success: true,
      totalOrders: todayPaidOrders.length,
      totalRevenue,
      totalCash,
      totalUPI,
      orders: todayPaidOrders
    });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

export default router;