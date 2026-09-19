import React, { Suspense, useRef, useState, useEffect } from "react";
import { motion, useScroll, useTransform, AnimatePresence } from "framer-motion";
import { ChevronDown, Sparkles, Flame, Star, Zap } from "lucide-react";

// Lazy load Spline to avoid blocking render
const Spline = React.lazy(() => import("@splinetool/react-spline"));

// Particle floating effect
const FloatingParticle = ({ delay, x, y, size, color }) => (
  <motion.div
    className="absolute rounded-full pointer-events-none"
    style={{ left: `${x}%`, top: `${y}%`, width: size, height: size, background: color }}
    animate={{
      y: [0, -30, 0],
      x: [0, 10, -10, 0],
      opacity: [0.3, 0.8, 0.3],
      scale: [1, 1.2, 1],
    }}
    transition={{ duration: 4 + delay, repeat: Infinity, delay, ease: "easeInOut" }}
  />
);

// Animated badge
const Badge = ({ children, delay = 0 }) => (
  <motion.div
    initial={{ opacity: 0, y: -20, scale: 0.8 }}
    animate={{ opacity: 1, y: 0, scale: 1 }}
    transition={{ delay, type: "spring", stiffness: 200 }}
    className="hero-badge"
  >
    {children}
  </motion.div>
);

// Typewriter effect
const TypeWriter = ({ texts }) => {
  const [index, setIndex] = useState(0);
  const [displayed, setDisplayed] = useState("");
  const [charIdx, setCharIdx] = useState(0);
  const [deleting, setDeleting] = useState(false);

  useEffect(() => {
    const current = texts[index];
    if (!deleting && charIdx < current.length) {
      const t = setTimeout(() => {
        setDisplayed(current.slice(0, charIdx + 1));
        setCharIdx((c) => c + 1);
      }, 60);
      return () => clearTimeout(t);
    } else if (!deleting && charIdx === current.length) {
      const t = setTimeout(() => setDeleting(true), 1800);
      return () => clearTimeout(t);
    } else if (deleting && charIdx > 0) {
      const t = setTimeout(() => {
        setDisplayed(current.slice(0, charIdx - 1));
        setCharIdx((c) => c - 1);
      }, 35);
      return () => clearTimeout(t);
    } else if (deleting && charIdx === 0) {
      setDeleting(false);
      setIndex((i) => (i + 1) % texts.length);
    }
  }, [charIdx, deleting, index, texts]);

  return (
    <span className="typewriter-text">
      {displayed}
      <span className="typewriter-cursor">|</span>
    </span>
  );
};

export default function HeroSection({ onExploreMenu, tableNumber }) {
  const containerRef = useRef(null);
  const { scrollY } = useScroll();
  const heroY = useTransform(scrollY, [0, 500], [0, -150]);
  const heroOpacity = useTransform(scrollY, [0, 300], [1, 0]);
  const [splineLoaded, setSplineLoaded] = useState(false);
  const [splineError, setSplineError] = useState(false);

  const particles = [
    { delay: 0, x: 10, y: 20, size: "8px", color: "rgba(245,158,11,0.6)" },
    { delay: 1, x: 85, y: 15, size: "6px", color: "rgba(239,68,68,0.5)" },
    { delay: 2, x: 20, y: 75, size: "10px", color: "rgba(245,158,11,0.4)" },
    { delay: 0.5, x: 90, y: 70, size: "7px", color: "rgba(239,68,68,0.6)" },
    { delay: 1.5, x: 50, y: 10, size: "5px", color: "rgba(255,255,255,0.4)" },
    { delay: 3, x: 70, y: 85, size: "9px", color: "rgba(245,158,11,0.5)" },
    { delay: 2.5, x: 30, y: 45, size: "6px", color: "rgba(239,68,68,0.3)" },
    { delay: 0.8, x: 60, y: 55, size: "8px", color: "rgba(255,255,255,0.3)" },
  ];

  return (
    <div ref={containerRef} className="hero-section">
      {/* === 3D SPLINE BACKGROUND === */}
      <div className="hero-spline-bg">
        {!splineError ? (
          <Suspense fallback={<div className="hero-3d-fallback" />}>
            <Spline
              scene="https://prod.spline.design/6Wq1Q7YE2z9Xi4Hf/scene.splinecode"
              onLoad={() => setSplineLoaded(true)}
              onError={() => setSplineError(true)}
              style={{ width: "100%", height: "100%" }}
            />
          </Suspense>
        ) : (
          /* CSS 3D Fallback — equally epic */
          <div className="hero-css-3d-bg">
            <div className="rotating-ring ring-1" />
            <div className="rotating-ring ring-2" />
            <div className="rotating-ring ring-3" />
            <div className="floating-bowl">🍲</div>
          </div>
        )}

        {/* Dark overlay gradient */}
        <div className="hero-overlay" />
      </div>

      {/* === FLOATING PARTICLES === */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        {particles.map((p, i) => (
          <FloatingParticle key={i} {...p} />
        ))}
      </div>

      {/* === HERO CONTENT === */}
      <motion.div
        style={{ y: heroY, opacity: heroOpacity }}
        className="hero-content"
      >
        {/* Top badges row */}
        <div className="hero-badges-row">
          <Badge delay={0.2}>
            <Sparkles size={12} className="text-amber-400 animate-spin" />
            <span>TABLE #{tableNumber} • LIVE DIGITAL MENU</span>
          </Badge>
          <Badge delay={0.4}>
            <Star size={12} className="text-amber-400" />
            <span>4.9 ★ RATED</span>
          </Badge>
        </div>

        {/* Main heading */}
        <motion.div
          initial={{ opacity: 0, y: 40 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3, duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
          className="hero-heading-block"
        >
          <div className="hero-eyebrow">
            <Flame size={14} className="text-rose-400" />
            <span>Freshly Prepared Gourmet Bowls</span>
          </div>

          <h1 className="hero-title">
            <span className="hero-title-main">THE</span>
            <br />
            <span className="hero-title-gradient">RICE BOWL</span>
          </h1>

          <p className="hero-subtitle">
            <TypeWriter
              texts={[
                "Authentic Indian Flavors 🌿",
                "Farm Fresh Ingredients 🥬",
                "Crafted with Love ❤️",
                "Ready in 15 Minutes ⚡",
              ]}
            />
          </p>
        </motion.div>

        {/* Stat chips */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.6 }}
          className="hero-stats-row"
        >
          {[
            { icon: "🔥", label: "Live Orders", value: "Active" },
            { icon: "⏱️", label: "Avg. Time", value: "15 min" },
            { icon: "🌿", label: "Fresh", value: "Daily" },
          ].map((stat, i) => (
            <div key={i} className="hero-stat-chip">
              <span className="hero-stat-icon">{stat.icon}</span>
              <div>
                <div className="hero-stat-value">{stat.value}</div>
                <div className="hero-stat-label">{stat.label}</div>
              </div>
            </div>
          ))}
        </motion.div>

        {/* CTA Button */}
        <motion.div
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.8, type: "spring", stiffness: 200 }}
          className="hero-cta-row"
        >
          <button
            onClick={onExploreMenu}
            className="hero-cta-btn"
          >
            <Zap size={18} />
            <span>Explore Menu</span>
          </button>
          <div className="hero-cta-hint">
            Scroll down or tap to browse
          </div>
        </motion.div>

        {/* Scroll indicator */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 1.2 }}
          onClick={onExploreMenu}
          className="hero-scroll-indicator"
        >
          <motion.div
            animate={{ y: [0, 8, 0] }}
            transition={{ repeat: Infinity, duration: 1.5, ease: "easeInOut" }}
          >
            <ChevronDown size={28} className="text-amber-400" />
          </motion.div>
        </motion.div>
      </motion.div>

      {/* Spline load indicator */}
      <AnimatePresence>
        {!splineLoaded && !splineError && (
          <motion.div
            initial={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="hero-spline-loader"
          >
            <div className="spline-loader-dot" />
            <div className="spline-loader-dot delay-100" />
            <div className="spline-loader-dot delay-200" />
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
