import Menu from "../models/menuModel.js";

let menuCache = null;
let lastCacheTime = 0;
const CACHE_TTL = 60 * 60 * 1000;

const RICE_BOWL_MENU = [
  {
    name: "छोले राईस (Chhole Rice)",
    category: "Rice Bowls",
    price: 60,
    tag: "Bestseller",
    time: "5 mins",
    rating: 4.9,
    image:
      "https://images.unsplash.com/photo-1546833999-b9f581a1996d?w=800&auto=format&fit=crop&q=80"
  },
  {
    name: "राजमा राईस (Rajma Rice)",
    category: "Rice Bowls",
    price: 60,
    tag: "Popular",
    time: "5 mins",
    rating: 4.7,
    image:
      "https://images.unsplash.com/photo-1589301760014-d929f3979dbc?w=800&auto=format&fit=crop&q=80"
  },
  {
    name: "दाल राईस (Dal Rice)",
    category: "Rice Bowls",
    price: 60,
    tag: "Classic",
    time: "5 mins",
    rating: 4.6,
    image:
      "https://images.unsplash.com/photo-1626777552726-4a6b54c97e46?w=800&auto=format&fit=crop&q=80"
  },
  {
    name: "वांगी भात (Vangi Bhat)",
    category: "Kolhapuri Special",
    price: 70,
    tag: "Must Try",
    time: "8 mins",
    rating: 4.9,
    image:
      "https://images.unsplash.com/photo-1633945274405-b6c8069047b0?w=800&auto=format&fit=crop&q=80"
  },
  {
    name: "व्हेज पुलाव (Veg Pulao)",
    category: "Special Rice",
    price: 70,
    tag: "Popular",
    time: "8 mins",
    rating: 4.5,
    image:
      "https://images.unsplash.com/photo-1596797038530-2c107229654b?w=800&auto=format&fit=crop&q=80"
  },
  {
    name: "छोले पराठा (Chhole Paratha)",
    category: "Parathas",
    price: 70,
    tag: "Hot",
    time: "10 mins",
    rating: 4.8,
    image:
      "https://images.unsplash.com/photo-1528735602780-2552fd46c7af?w=800&auto=format&fit=crop&q=80"
  },
  {
    name: "कॉम्बो थाळी (Combo Thali)",
    category: "Special Thali",
    price: 110,
    tag: "Chef Special",
    time: "12 mins",
    rating: 5.0,
    image:
      "https://images.unsplash.com/photo-1610192244261-3f33de3f55e4?w=800&auto=format&fit=crop&q=80"
  },
  {
    name: "सोलकढी (Solkadhi)",
    category: "Beverages",
    price: 15,
    tag: "Kolhapuri Refreshment",
    time: "2 mins",
    rating: 4.8,
    image:
      "https://images.unsplash.com/photo-1513558161293-cdaf765ed2fd?w=800&auto=format&fit=crop&q=80"
  },
  {
    name: "कोकम सरबत (Kokam Sarbat)",
    category: "Beverages",
    price: 15,
    tag: "Chilled",
    time: "2 mins",
    rating: 4.6,
    image:
      "https://images.unsplash.com/photo-1546173159-315724a31696?w=800&auto=format&fit=crop&q=80"
  }
];

export const getMenuItems = async (req, res) => {
  try {
    const now = Date.now();

    if (menuCache && now - lastCacheTime < CACHE_TTL) {
      return res.status(200).json({ success: true, cached: true, data: menuCache });
    }

    let items = await Menu.find().lean();
    const needsReseed = !items?.length || items.some((item) => !item.image);

    if (needsReseed) {
      await Menu.deleteMany({});
      const inserted = await Menu.insertMany(RICE_BOWL_MENU);
      items = inserted.map((doc) => (doc.toObject ? doc.toObject() : doc));
    }

    menuCache = items;
    lastCacheTime = now;

    return res.status(200).json({ success: true, cached: false, data: items });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

export const invalidateMenuCache = () => {
  menuCache = null;
  lastCacheTime = 0;
};
