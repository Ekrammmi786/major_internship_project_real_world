import React, { useRef, useState } from "react";
import { motion, useMotionValue, useSpring, useTransform } from "framer-motion";
import { Plus, Minus, ShoppingCart, Flame, Star } from "lucide-react";

// Ripple effect on button click
function useRipple() {
  const [ripples, setRipples] = useState([]);
  const addRipple = (e) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    const id = Date.now();
    setRipples((prev) => [...prev, { x, y, id }]);
    setTimeout(() => setRipples((prev) => prev.filter((r) => r.id !== id)), 600);
  };
  return { ripples, addRipple };
}

// 3D Tilt Card wrapper
function Tilt3D({ children, disabled }) {
  const ref = useRef(null);
  const x = useMotionValue(0);
  const y = useMotionValue(0);
  const rotateX = useSpring(useTransform(y, [-0.5, 0.5], [8, -8]), { stiffness: 300, damping: 30 });
  const rotateY = useSpring(useTransform(x, [-0.5, 0.5], [-8, 8]), { stiffness: 300, damping: 30 });
  const glowX = useTransform(x, [-0.5, 0.5], ["0%", "100%"]);
  const glowY = useTransform(y, [-0.5, 0.5], ["0%", "100%"]);

  const handleMouseMove = (e) => {
    if (disabled) return;
    const rect = ref.current?.getBoundingClientRect();
    if (!rect) return;
    x.set((e.clientX - rect.left) / rect.width - 0.5);
    y.set((e.clientY - rect.top) / rect.height - 0.5);
  };

  const handleMouseLeave = () => {
    x.set(0);
    y.set(0);
  };

  return (
    <motion.div
      ref={ref}
      onMouseMove={handleMouseMove}
      onMouseLeave={handleMouseLeave}
      style={{
        rotateX: disabled ? 0 : rotateX,
        rotateY: disabled ? 0 : rotateY,
        transformStyle: "preserve-3d",
        perspective: 1000,
      }}
      whileHover={disabled ? {} : { scale: 1.03, z: 20 }}
      whileTap={disabled ? {} : { scale: 0.98 }}
      transition={{ type: "spring", stiffness: 400, damping: 30 }}
      className="menu-card3d__tilt"
    >
      {/* Specular highlight — follows mouse */}
      {!disabled && (
        <motion.div
          className="menu-card3d__specular"
          style={{ backgroundImage: `radial-gradient(circle at ${glowX} ${glowY}, rgba(255,255,255,0.12) 0%, transparent 60%)` }}
        />
      )}
      {children}
    </motion.div>
  );
}

export default function MenuCard3D({ item, cartQuantity, onAdd, onDecrement }) {
  const { ripples, addRipple } = useRipple();
  const isOut = item.isAvailable === false;

  const handleAdd = (e) => {
    if (isOut) return;
    addRipple(e);
    onAdd(item);
  };

  return (
    <Tilt3D disabled={isOut}>
      <div className={`menu-card3d ${isOut ? "menu-card3d--out" : ""}`}>

        {/* === IMAGE === */}
        <div className="menu-card3d__img-wrap">
          <img
            src={item.image || `https://source.unsplash.com/300x200/?indian-food,${encodeURIComponent(item.name)}`}
            alt={item.name}
            className="menu-card3d__img"
            loading="lazy"
          />

          {/* Overlay gradient */}
          <div className="menu-card3d__img-overlay" />

          {/* Category badge */}
          <div className="menu-card3d__category-badge">
            {item.category}
          </div>

          {/* Out of stock ribbon */}
          {isOut && (
            <div className="menu-card3d__sold-ribbon">SOLD OUT</div>
          )}

          {/* Veg/Non-veg dot */}
          <div className={`menu-card3d__veg-dot ${item.isVeg ? "menu-card3d__veg-dot--veg" : "menu-card3d__veg-dot--nonveg"}`} />
        </div>

        {/* === BODY === */}
        <div className="menu-card3d__body">
          <div className="menu-card3d__name-row">
            <h3 className="menu-card3d__name">{item.name}</h3>
            {item.isPopular && (
              <motion.span
                animate={{ rotate: [0, 5, -5, 0] }}
                transition={{ repeat: Infinity, duration: 2 }}
                className="menu-card3d__popular"
              >
                <Flame size={10} /> HOT
              </motion.span>
            )}
          </div>

          {item.description && (
            <p className="menu-card3d__desc">{item.description}</p>
          )}

          {/* Rating stars */}
          <div className="menu-card3d__rating">
            {[1, 2, 3, 4, 5].map((s) => (
              <Star key={s} size={10} className={s <= 4 ? "text-amber-400 fill-amber-400" : "text-stone-600"} />
            ))}
            <span className="menu-card3d__rating-text">4.0</span>
          </div>

          {/* Price + Cart Controls */}
          <div className="menu-card3d__footer">
            <div className="menu-card3d__price-block">
              <span className="menu-card3d__price">₹{item.price}</span>
              {item.originalPrice && (
                <span className="menu-card3d__price-strike">₹{item.originalPrice}</span>
              )}
            </div>

            {/* Cart controls */}
            {cartQuantity > 0 ? (
              <div className="menu-card3d__qty-control">
                <motion.button
                  onClick={() => onDecrement(item._id, -1)}
                  whileTap={{ scale: 0.85 }}
                  className="menu-card3d__qty-btn menu-card3d__qty-btn--minus"
                >
                  <Minus size={12} />
                </motion.button>
                <motion.span
                  key={cartQuantity}
                  initial={{ scale: 1.4 }}
                  animate={{ scale: 1 }}
                  className="menu-card3d__qty-num"
                >
                  {cartQuantity}
                </motion.span>
                <motion.button
                  onClick={handleAdd}
                  whileTap={{ scale: 0.85 }}
                  className="menu-card3d__qty-btn menu-card3d__qty-btn--plus"
                >
                  <Plus size={12} />
                </motion.button>
              </div>
            ) : (
              <motion.button
                onClick={handleAdd}
                disabled={isOut}
                whileHover={!isOut ? { scale: 1.05 } : {}}
                whileTap={!isOut ? { scale: 0.92 } : {}}
                className={`menu-card3d__add-btn ${isOut ? "menu-card3d__add-btn--disabled" : ""}`}
                style={{ position: "relative", overflow: "hidden" }}
              >
                {/* Ripple effects */}
                {ripples.map((r) => (
                  <span
                    key={r.id}
                    className="menu-card3d__ripple"
                    style={{ left: r.x, top: r.y }}
                  />
                ))}
                {isOut ? (
                  "Sold Out"
                ) : (
                  <>
                    <ShoppingCart size={13} />
                    <span>Add</span>
                  </>
                )}
              </motion.button>
            )}
          </div>
        </div>
      </div>
    </Tilt3D>
  );
}
