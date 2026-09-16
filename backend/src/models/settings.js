import mongoose from "mongoose";

const settingSchema = new mongoose.Schema({
  isRestaurantOpen: { type: Boolean, default: true },
  disabledTables: { type: [Number], default: [] }
});

export default mongoose.model("Setting", settingSchema);