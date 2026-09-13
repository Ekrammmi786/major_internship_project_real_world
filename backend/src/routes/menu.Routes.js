import express from "express";
import Menu from "../models/menuModel.js";

const router = express.Router();

router.get("/", async (req, res) => {
  try {
    const items = await Menu.find({});
    return res.status(200).json({ success: true, data: items });
  } catch (err) {
    return res.status(500).json({ success: false, message: err.message });
  }
});

router.post("/", async (req, res) => {
  try {
    const newItem = new Menu(req.body);
    const saved = await newItem.save();
    return res.status(201).json({ success: true, data: saved });
  } catch (err) {
    return res.status(400).json({ success: false, message: err.message });
  }
});

router.put("/:id", async (req, res) => {
  try {
    const updated = await Menu.findByIdAndUpdate(req.params.id, req.body, { new: true });
    return res.status(200).json({ success: true, data: updated });
  } catch (err) {
    return res.status(400).json({ success: false, message: err.message });
  }
});

router.delete("/:id", async (req, res) => {
  try {
    await Menu.findByIdAndDelete(req.params.id);
    return res.status(200).json({ success: true, message: "Item deleted" });
  } catch (err) {
    return res.status(500).json({ success: false, message: err.message });
  }
});

export default router;