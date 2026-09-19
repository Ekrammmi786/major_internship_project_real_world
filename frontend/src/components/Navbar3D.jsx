import React, { useState, useEffect } from "react";
import { NavLink, useLocation } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { Utensils, ChefHat, BarChart3, Menu, X, Sparkles } from "lucide-react";

const navLinks = [
  { to: "/", label: "Menu", icon: Utensils, emoji: "🍲" },
  { to: "/kitchen", label: "Kitchen", icon: ChefHat, emoji: "👨‍🍳" },
  { to: "/admin", label: "Admin", icon: BarChart3, emoji: "📊" },
];

export default function Navbar3D() {
  const [scrolled, setScrolled] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [hoveredLink, setHoveredLink] = useState(null);
  const location = useLocation();

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 20);
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  // Close mobile menu on route change
  useEffect(() => {
    setMobileOpen(false);
  }, [location.pathname]);

  return (
    <>
      <motion.header
        className={`navbar3d ${scrolled ? "navbar3d--scrolled" : "navbar3d--top"}`}
        initial={{ y: -80, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
      >
        <div className="navbar3d__inner">
          {/* ===== LOGO ===== */}
          <NavLink to="/" className="navbar3d__logo" aria-label="The Rice Bowl">
            <motion.div
              className="navbar3d__logo-icon"
              whileHover={{ rotateY: 180, scale: 1.1 }}
              transition={{ duration: 0.5, type: "spring" }}
            >
              <div className="navbar3d__logo-ring">
                <Utensils size={18} className="text-amber-400" />
              </div>
            </motion.div>

            <div className="navbar3d__logo-text">
              <motion.span
                className="navbar3d__logo-name"
                whileHover={{ letterSpacing: "0.08em" }}
                transition={{ duration: 0.3 }}
              >
                The Rice Bowl
              </motion.span>
              <span className="navbar3d__logo-tag">
                <Sparkles size={9} className="inline mr-0.5" />
                Gourmet Experience
              </span>
            </div>
          </NavLink>

          {/* ===== DESKTOP NAV ===== */}
          <nav className="navbar3d__nav" role="navigation">
            {navLinks.map((link) => {
              const Icon = link.icon;
              return (
                <NavLink
                  key={link.to}
                  to={link.to}
                  className={({ isActive }) =>
                    `navbar3d__link ${isActive ? "navbar3d__link--active" : ""}`
                  }
                  onMouseEnter={() => setHoveredLink(link.to)}
                  onMouseLeave={() => setHoveredLink(null)}
                >
                  {({ isActive }) => (
                    <motion.span
                      className="navbar3d__link-inner"
                      whileHover={{ y: -2 }}
                      transition={{ type: "spring", stiffness: 400 }}
                    >
                      <motion.span
                        animate={
                          hoveredLink === link.to
                            ? { rotate: [0, -10, 10, 0], scale: [1, 1.2, 1] }
                            : {}
                        }
                        transition={{ duration: 0.4 }}
                        className="navbar3d__link-icon"
                      >
                        <Icon size={15} />
                      </motion.span>
                      {link.label}
                      {isActive && (
                        <motion.span
                          layoutId="navbar-pill"
                          className="navbar3d__active-pill"
                          transition={{ type: "spring", bounce: 0.3, duration: 0.5 }}
                        />
                      )}
                    </motion.span>
                  )}
                </NavLink>
              );
            })}
          </nav>

          {/* ===== LIVE STATUS BADGE ===== */}
          <div className="navbar3d__status hidden sm:flex">
            <span className="navbar3d__status-dot" />
            <span className="navbar3d__status-text">Kitchen Live</span>
          </div>

          {/* ===== MOBILE HAMBURGER ===== */}
          <motion.button
            className="navbar3d__hamburger sm:hidden"
            onClick={() => setMobileOpen((v) => !v)}
            whileTap={{ scale: 0.9 }}
            aria-label="Toggle menu"
          >
            <AnimatePresence mode="wait">
              {mobileOpen ? (
                <motion.span
                  key="close"
                  initial={{ rotate: -90, opacity: 0 }}
                  animate={{ rotate: 0, opacity: 1 }}
                  exit={{ rotate: 90, opacity: 0 }}
                  transition={{ duration: 0.2 }}
                >
                  <X size={20} />
                </motion.span>
              ) : (
                <motion.span
                  key="menu"
                  initial={{ rotate: 90, opacity: 0 }}
                  animate={{ rotate: 0, opacity: 1 }}
                  exit={{ rotate: -90, opacity: 0 }}
                  transition={{ duration: 0.2 }}
                >
                  <Menu size={20} />
                </motion.span>
              )}
            </AnimatePresence>
          </motion.button>
        </div>
      </motion.header>

      {/* ===== MOBILE DRAWER ===== */}
      <AnimatePresence>
        {mobileOpen && (
          <>
            {/* Backdrop */}
            <motion.div
              className="navbar3d__backdrop"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setMobileOpen(false)}
            />

            {/* Drawer */}
            <motion.div
              className="navbar3d__drawer"
              initial={{ x: "100%" }}
              animate={{ x: 0 }}
              exit={{ x: "100%" }}
              transition={{ type: "spring", damping: 25, stiffness: 300 }}
            >
              <div className="navbar3d__drawer-header">
                <span className="text-amber-400 font-black text-lg">The Rice Bowl</span>
                <button onClick={() => setMobileOpen(false)} className="navbar3d__drawer-close">
                  <X size={20} />
                </button>
              </div>

              <nav className="navbar3d__drawer-nav">
                {navLinks.map((link, i) => {
                  const Icon = link.icon;
                  return (
                    <motion.div
                      key={link.to}
                      initial={{ x: 60, opacity: 0 }}
                      animate={{ x: 0, opacity: 1 }}
                      transition={{ delay: i * 0.08 + 0.1 }}
                    >
                      <NavLink
                        to={link.to}
                        className={({ isActive }) =>
                          `navbar3d__drawer-link ${isActive ? "navbar3d__drawer-link--active" : ""}`
                        }
                      >
                        <span className="navbar3d__drawer-link-emoji">{link.emoji}</span>
                        <span className="navbar3d__drawer-link-icon"><Icon size={18} /></span>
                        <span>{link.label}</span>
                      </NavLink>
                    </motion.div>
                  );
                })}
              </nav>

              <div className="navbar3d__drawer-footer">
                <div className="flex items-center gap-2 text-emerald-400">
                  <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                  <span className="text-xs font-bold">Restaurant is OPEN</span>
                </div>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </>
  );
}
