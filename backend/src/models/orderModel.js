import mongoose from "mongoose";

const orderSchema = new mongoose.Schema(
  {
    tableNumber: { type: Number, required: true },
    items: [
      {
        name: { type: String, required: true },
        price: { type: Number, required: true },
        quantity: { type: Number, required: true, default: 1 }
      }
    ],
    totalAmount: { type: Number, required: true },
    status: {
      type: String,
      enum: ["Pending", "Preparing", "Served", "Paid"],
      default: "Pending"
    }
  },
  { timestamps: true }
);

const Order = mongoose.models.Order || mongoose.model("Order", orderSchema);
export default Order;