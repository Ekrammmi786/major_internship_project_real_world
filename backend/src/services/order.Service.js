import Order from "../models/orderModel.js";

export const createOrderService = async (data) => {
  return await Order.create(data);
};

export const getAllOrdersService = async () => {
  return await Order.find().sort({ createdAt: -1 });
};

export const updateOrderStatusService = async (id, status) => {
  return await Order.findByIdAndUpdate(id, { status }, { new: true });
};

export const deleteOrderService = async (id) => {
  return await Order.findByIdAndDelete(id);
};