import React, { useState } from "react";

const ProtectedRoute = ({ children, requiredPin }) => {
  const [pin, setPin] = useState("");
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [error, setError] = useState(false);

  const handleVerify = (e) => {
    e.preventDefault();
    
    // 👈 Both inputs ko String aur Trim karke match kar rahe hain
    if (String(pin).trim() === String(requiredPin).trim()) {
      setIsAuthenticated(true);
      setError(false);
    } else {
      setError(true);
    }
  };

  if (isAuthenticated) {
    return children;
  }

  return (
    <div style={{ display: "flex", justifyContent: "center", alignItems: "center", height: "80vh", fontFamily: "sans-serif" }}>
      <form onSubmit={handleVerify} style={{ padding: "30px", border: "1px solid #cbd5e1", borderRadius: "10px", textAlign: "center", width: "300px" }}>
        <h3>🔒 Access Restricted</h3>
        <p style={{ fontSize: "14px", color: "#64748b" }}>Enter PIN to proceed</p>
        <input
          type="password"
          maxLength={4}
          value={pin}
          onChange={(e) => setPin(e.target.value)}
          placeholder="Enter PIN"
          style={{ width: "90%", padding: "10px", fontSize: "18px", textAlign: "center", marginBottom: "12px", borderRadius: "6px", border: "1px solid #94a3b8" }}
        />
        {error && <p style={{ color: "#ef4444", fontSize: "13px", marginTop: "0" }}>Incorrect PIN! Try again.</p>}
        <button type="submit" style={{ width: "100%", padding: "10px", backgroundColor: "#2563eb", color: "#fff", border: "none", borderRadius: "6px", cursor: "pointer", fontWeight: "bold" }}>
          Unlock Access
        </button>
      </form>
    </div>
  );
};

export default ProtectedRoute;