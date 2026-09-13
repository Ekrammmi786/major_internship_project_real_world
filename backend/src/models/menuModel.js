import mongoose from "mongoose";

const menuSchema = new mongoose.Schema(
  {
    name: { type: String, required: true },
    category: { type: String, required: true },
    price: { type: Number, required: true },
    tag: { type: String, default: "Popular" },
    time: { type: String, default: "10 mins" },
    image: { type: String, default: "" },
    rating: { type: Number, default: 4.8, min: 0, max: 5 }
  },
  { timestamps: true }
);

const Menu = mongoose.models.Menu || mongoose.model("Menu", menuSchema);
export default Menu;