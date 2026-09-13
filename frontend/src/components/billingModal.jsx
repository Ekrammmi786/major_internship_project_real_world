import React, { useState } from "react";
import { Printer, CreditCard, QrCode, Banknote, X, CheckCircle2 } from "lucide-react";

export default function BillingModal({ order, onClose, onPaymentSuccess }) {
  const [paymentMethod, setPaymentMethod] = useState("UPI");
  const [loading, setLoading] = useState(false);

  const subTotal = order.totalAmount;
  const gstAmount = Math.round(subTotal * 0.05); // 5% GST
  const grandTotal = subTotal + gstAmount;

  const handleSettle = async () => {
    setLoading(true);
    try {
      const res = await fetch(`http://localhost:5000/api/orders/${order._id}/pay`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ paymentMethod })
      });
      const data = await res.json();
      if (data.success) {
        onPaymentSuccess();
        window.print();
      }
    } catch (err) {
      alert("Payment settlement failed.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-slate-900 border border-slate-800 rounded-3xl max-w-sm w-full p-5 space-y-4 text-slate-100 shadow-2xl print:bg-white print:text-black print:w-full print:max-w-none">
        
        {/* Header */}
        <div className="flex justify-between items-center border-b border-slate-800 pb-3 print:hidden">
          <h3 className="font-extrabold text-amber-400 text-xs tracking-wider uppercase">Receipt Settlement</h3>
          <button onClick={onClose} className="text-slate-400 hover:text-white">
            <X className="w-5 h-5"/>
          </button>
        </div>

        {/* Printable Thermal Receipt Content */}
        <div className="text-center space-y-1">
          <h2 className="font-serif font-black text-xl text-amber-400 print:text-black">THE RICE BOWL</h2>
          <p className="text-[10px] text-slate-400 print:text-gray-600">Shaniwar Peth, Kolhapur | GSTIN: 27AAAAA0000A1Z5</p>
          <div className="text-xs font-bold pt-2 flex justify-between text-slate-300 print:text-black border-t border-slate-800/60 print:border-gray-300 mt-2">
            <span>Table #{order.tableNumber}</span>
            <span>Date: {new Date().toLocaleDateString()}</span>
          </div>
        </div>

        {/* Itemized Table */}
        <div className="border-y border-slate-800 py-3 space-y-1.5 print:border-gray-300">
          {order.items.map((item, idx) => (
            <div key={idx} className="flex justify-between text-xs font-medium">
              <span>{item.name} x{item.quantity}</span>
              <span className="font-bold">₹{item.price * item.quantity}</span>
            </div>
          ))}
        </div>

        {/* Financial Breakdown */}
        <div className="space-y-1 text-xs pt-1">
          <div className="flex justify-between text-slate-400 print:text-gray-600">
            <span>Subtotal</span>
            <span>₹{subTotal}</span>
          </div>
          <div className="flex justify-between text-slate-400 print:text-gray-600">
            <span>GST (5%)</span>
            <span>₹{gstAmount}</span>
          </div>
          <div className="flex justify-between font-black text-sm text-amber-400 pt-2 border-t border-slate-800 print:text-black print:border-gray-300">
            <span>Grand Total</span>
            <span>₹{grandTotal}</span>
          </div>
        </div>

        {/* Payment Modes & Settlement (Hidden while printing) */}
        <div className="space-y-3 pt-2 print:hidden">
          <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Payment Mode</label>
          <div className="grid grid-cols-3 gap-2">
            {[
              { id: "UPI", icon: QrCode },
              { id: "Cash", icon: Banknote },
              { id: "Card", icon: CreditCard }
            ].map(({ id, icon: Icon }) => (
              <button
                key={id}
                onClick={() => setPaymentMethod(id)}
                className={`p-2.5 rounded-xl text-xs font-black flex flex-col items-center gap-1 border transition-all ${
                  paymentMethod === id
                    ? "bg-amber-500 text-slate-950 border-amber-400 shadow-md"
                    : "bg-slate-950 text-slate-400 border-slate-800 hover:border-slate-700"
                }`}
              >
                <Icon className="w-4 h-4" /> {id}
              </button>
            ))}
          </div>

          <button
            onClick={handleSettle}
            disabled={loading}
            className="w-full bg-gradient-to-r from-emerald-500 to-teal-500 text-slate-950 font-black py-3 rounded-xl shadow-lg flex items-center justify-center gap-2 active:scale-95 text-xs mt-2 disabled:opacity-50"
          >
            <Printer className="w-4 h-4" /> PAY ₹{grandTotal} & PRINT BILL
          </button>
        </div>

      </div>
    </div>
  );
}