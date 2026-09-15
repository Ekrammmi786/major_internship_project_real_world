import mongoose from "mongoose";

const orderSchema = new mongoose.Schema(
  {
    tableNumber: { type: String, required: true },
    items: [
      {
        name: String,
        price: Number,
        quantity: Number,
        status: { type: String, default: "Active" } // Active or Cancelled
      }
    ],
    totalAmount: { type: Number, required: true },
    status: { 
      type: String, 
      enum: ["Pending", "Preparing", "Ready", "Served", "Paid", "Cancelled"], 
      default: "Pending" 
    },
    // 🆕 Production Accounting Fields
    invoiceNumber: { type: String, default: null }, // e.g. TRB/2026-27/0001
    paymentMethod: { type: String, default: "Cash" }, // Cash, UPI, Split
    paymentBreakdown: {
      cashAmount: { type: Number, default: 0 },
      upiAmount: { type: Number, default: 0 }
    },
    discount: {
      type: { type: String, enum: ["FLAT", "PERCENT"], default: "FLAT" },
      amount: { type: Number, default: 0 }
    }
  },
  { timestamps: true }
);

export default mongoose.model("Order", orderSchema);