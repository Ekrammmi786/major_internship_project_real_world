import express from "express";
import Order from "../models/orderModel.js";

const router = express.Router();

router.get("/", async (req, res) => {
  try {
    const orders = await Order.find().sort({ createdAt: -1 });
    return res.status(200).json({ success: true, data: orders });
  } catch (err) {
    return res.status(500).json({ success: false, message: err.message });
  }
});

router.post("/", async (req, res) => {
  try {
    const { tableNumber, items, totalAmount } = req.body;

    const existingOrder = await Order.findOne({
      tableNumber: Number(tableNumber),
      status: { $in: ["Pending", "Preparing", "Served"] }
    });

    if (existingOrder) {
      existingOrder.items.push(...items);
      existingOrder.totalAmount += Number(totalAmount);
      const updatedOrder = await existingOrder.save();

      const io = req.app.get("io");
      if (io) io.emit("order_updated", updatedOrder);

      return res.status(200).json({
        success: true,
        message: "Items added to running table bill",
        data: updatedOrder
      });
    }

    const newOrder = new Order(req.body);
    const savedOrder = await newOrder.save();

    const io = req.app.get("io");
    if (io) io.emit("order_updated", savedOrder);

    return res.status(201).json({ success: true, data: savedOrder });
  } catch (err) {
    return res.status(400).json({ success: false, message: err.message });
  }
});

router.patch("/:id", async (req, res) => {
  try {
    const { status, paymentMethod } = req.body;
    const updateFields = { status };
    if (paymentMethod) updateFields.paymentMethod = paymentMethod;

    const updatedOrder = await Order.findByIdAndUpdate(
      req.params.id,
      updateFields,
      { new: true }
    );

    if (!updatedOrder) {
      return res.status(404).json({ success: false, message: "Order not found" });
    }

    const io = req.app.get("io");
    if (io) io.emit("order_updated", updatedOrder);

    return res.status(200).json({ success: true, data: updatedOrder });
  } catch (err) {
    return res.status(400).json({ success: false, message: err.message });
  }
});

router.delete("/:id", async (req, res) => {
  try {
    const deletedOrder = await Order.findByIdAndDelete(req.params.id);

    if (!deletedOrder) {
      return res.status(404).json({ success: false, message: "Order not found" });
    }

    const io = req.app.get("io");
    if (io) io.emit("order_updated", deletedOrder);

    return res.status(200).json({ success: true, message: "Order deleted" });
  } catch (err) {
    return res.status(500).json({ success: false, message: err.message });
  }
});

export default router;