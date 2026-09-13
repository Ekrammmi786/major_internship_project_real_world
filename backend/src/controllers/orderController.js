import Order from "../models/orderModel.js";

export const createOrder = async (req, res) => {
  try {
    const { tableNumber, items, totalAmount } = req.body;

    if (!tableNumber || !items || items.length === 0) {
      return res.status(400).json({ success: false, message: "Table number and items are required" });
    }

    const newOrder = new Order({
      tableNumber,
      items,
      totalAmount,
      status: "Pending",
      paymentStatus: "Pending"
    });

    await newOrder.save();
    res.status(201).json({ success: true, data: newOrder });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const getOrders = async (req, res) => {
  try {
    const orders = await Order.find().sort({ createdAt: -1 });
    res.status(200).json({ success: true, data: orders });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const updateOrderStatus = async (req, res) => {
  try {
    const { id } = req.params;
    const { status } = req.body;

    const order = await Order.findByIdAndUpdate(
      id,
      { status },
      { new: true }
    );

    if (!order) {
      return res.status(404).json({ success: false, message: "Order not found" });
    }

    res.status(200).json({ success: true, data: order });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const settlePayment = async (req, res) => {
  try {
    const { id } = req.params;
    const { paymentMethod, gstRate = 0.05 } = req.body;

    const order = await Order.findById(id);
    if (!order) {
      return res.status(404).json({ success: false, message: "Order not found" });
    }

    const subTotal = order.totalAmount;
    const gstAmount = Math.round(subTotal * gstRate);
    const grandTotal = subTotal + gstAmount;

    order.paymentStatus = "Paid";
    order.paymentMethod = paymentMethod || "Cash";
    order.gstAmount = gstAmount;
    order.grandTotal = grandTotal;
    order.paidAt = new Date();

    await order.save();
    res.status(200).json({ success: true, data: order });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const deleteOrder = async (req, res) => {
  try {
    const { id } = req.params;
    const order = await Order.findByIdAndDelete(id);

    if (!order) {
      return res.status(404).json({ success: false, message: "Order not found" });
    }

    res.status(200).json({ success: true, message: "Order deleted successfully" });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};