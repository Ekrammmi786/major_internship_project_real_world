import React from "react";
import { BrowserRouter as Router, Routes, Route, NavLink } from "react-router-dom";
import "./index.css"; // 👈 CSS file yahan import karein

import CustomerView from "./views/CustomerView";
import KitchenView from "./views/KitchenView";
import AdminView from "./views/AdminView";
import ProtectedRoute from "./components/ProtectRoute";

function App() {
  return (
    <Router>
      {/* Animated Foody Background Blobs */}
      <div className="foody-bg-animation">
        <div className="blob blob-1"></div>
        <div className="blob blob-2"></div>
        <div className="blob blob-3"></div>
      </div>

      {/* 📱 Mobile-First Sticky Header */}
      <header style={{
        position: "sticky",
        top: 0,
        zIndex: 50,
        backgroundColor: "rgba(255, 255, 255, 0.9)",
        backdropFilter: "blur(8px)",
        borderBottom: "1px solid #f5e6d3",
        boxShadow: "0 2px 10px rgba(0,0,0,0.03)"
      }}>
        <div style={{
          maxWidth: "1280px",
          margin: "0 auto",
          padding: "12px 16px",
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          flexWrap: "wrap",
          gap: "10px"
        }}>
          {/* Brand Logo */}
          <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
            <span style={{ fontSize: "24px" }}>🍚</span>
            <h1 style={{ fontSize: "20px", fontWeight: "700", color: "#dc2626", letterSpacing: "-0.5px" }}>
              The Rice Bowl
            </h1>
          </div>

          {/* Navigation Links */}
          <nav style={{ display: "flex", gap: "8px" }}>
            <NavLink 
              to="/" 
              style={({ isActive }) => ({
                padding: "8px 14px",
                borderRadius: "20px",
                textDecoration: "none",
                fontSize: "14px",
                fontWeight: "600",
                color: isActive ? "#ffffff" : "#44403c",
                backgroundColor: isActive ? "#dc2626" : "#f5f5f4",
                transition: "all 0.2s ease"
              })}
            >
              Menu
            </NavLink>
            <NavLink 
              to="/kitchen" 
              style={({ isActive }) => ({
                padding: "8px 14px",
                borderRadius: "20px",
                textDecoration: "none",
                fontSize: "14px",
                fontWeight: "600",
                color: isActive ? "#ffffff" : "#44403c",
                backgroundColor: isActive ? "#dc2626" : "#f5f5f4",
                transition: "all 0.2s ease"
              })}
            >
              Kitchen 👨‍🍳
            </NavLink>
            <NavLink 
              to="/admin" 
              style={({ isActive }) => ({
                padding: "8px 14px",
                borderRadius: "20px",
                textDecoration: "none",
                fontSize: "14px",
                fontWeight: "600",
                color: isActive ? "#ffffff" : "#44403c",
                backgroundColor: isActive ? "#dc2626" : "#f5f5f4",
                transition: "all 0.2s ease"
              })}
            >
              Admin 📊
            </NavLink>
          </nav>
        </div>
      </header>

      {/* Main Container */}
      <main className="app-container">
        <Routes>
          <Route path="/" element={<CustomerView />} />
          <Route 
            path="/kitchen" 
            element={<ProtectedRoute requiredPin="1234"><KitchenView /></ProtectedRoute>} 
          />
          <Route 
            path="/admin" 
            element={<ProtectedRoute requiredPin="9999"><AdminView /></ProtectedRoute>} 
          />
        </Routes>
      </main>
    </Router>
  );
}

export default App;