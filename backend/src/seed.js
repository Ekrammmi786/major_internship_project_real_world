import mongoose from "mongoose";
import dotenv from "dotenv";
import dns from "dns";
import Menu from "./models/menuModel.js";

// Force Node.js to use Google & Cloudflare DNS for Atlas SRV resolution
dns.setServers(["8.8.8.8", "1.1.1.1"]);

dotenv.config();

const RICE_BOWL_MENU = [
  {
    name: "छोले राईस (Chhole Rice)",
    category: "Rice Bowls",
    price: 60,
    tag: "Bestseller",
    time: "5 mins",
    image: "https://images.unsplash.com/photo-1546833999-b9f581a1996d?w=500&auto=format&fit=crop&q=80"
  },
  {
    name: "राजमा राईस (Rajma Rice)",
    category: "Rice Bowls",
    price: 60,
    tag: "Popular",
    time: "5 mins",
    image: "https://images.unsplash.com/photo-1589301760014-d929f3979dbc?w=500&auto=format&fit=crop&q=80"
  },
  {
    name: "दाल राईस (Dal Rice)",
    category: "Rice Bowls",
    price: 60,
    tag: "Classic",
    time: "5 mins",
    image: "https://images.unsplash.com/photo-1626777552726-4a6b54c97e46?w=500&auto=format&fit=crop&q=80"
  },
  {
    name: "वांगी भात (Vangi Bhat)",
    category: "Kolhapuri Special",
    price: 70,
    tag: "Must Try",
    time: "8 mins",
    image: "https://images.unsplash.com/photo-1633945274405-b6c8069047b0?w=500&auto=format&fit=crop&q=80"
  },
  {
    name: "कॉम्बो थाळी (Combo Thali)",
    category: "Special Thali",
    price: 110,
    tag: "Chef Special",
    time: "12 mins",
    image: "https://images.unsplash.com/photo-1610192244261-3f33de3f55e4?w=500&auto=format&fit=crop&q=80"
  },
  {
    name: "सोलकढी (Solkadhi)",
    category: "Beverages",
    price: 15,
    tag: "Chilled",
    time: "2 mins",
    image: "https://images.unsplash.com/photo-1513558161293-cdaf765ed2fd?w=500&auto=format&fit=crop&q=80"
  }
];

const seedDB = async () => {
  try {
    const mongoURI = process.env.MONGO_URI;
    if (!mongoURI) {
      throw new Error("MONGO_URI is missing from .env file");
    }

    await mongoose.connect(mongoURI);
    await Menu.deleteMany({});
    await Menu.insertMany(RICE_BOWL_MENU);
    console.log("Database seeded successfully with Rice Bowl Menu!");
    process.exit();
  } catch (err) {
    console.error("Seeding error:", err);
    process.exit(1);
  }
};

seedDB();