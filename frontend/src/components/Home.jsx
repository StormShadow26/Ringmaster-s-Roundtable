import React from "react";
import { useNavigate } from "react-router";

const Home = () => {
  const navigate = useNavigate();

  const handleGetStarted = () => {
    navigate("/authmodal");
  };

  return (
    <div style={{ minHeight: "100vh", display: "flex", flexDirection: "column" }}>
      {/* Navbar */}
      <nav style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "18px 40px", background: "#222", color: "#fff" }}>
        <div style={{ fontWeight: "bold", fontSize: 24 }}>Ringmaster's Roundtable</div>
        <div>
          <button
            onClick={handleGetStarted}
            style={{ padding: "10px 32px", fontSize: 16, borderRadius: 6, border: "none", background: "#007bff", color: "#fff", cursor: "pointer" }}
          >
            Get Started
          </button>
        </div>
      </nav>

      {/* Main Content */}
      <div style={{ flex: 1, display: "flex", flexDirection: "column", justifyContent: "center", alignItems: "center" }}>
        <h2>Welcome to Ringmaster's Roundtable</h2>
        <p style={{ maxWidth: 600, fontSize: 18, color: "#444" }}>
          The ultimate platform for collaborative discussions, knowledge sharing, and connecting with like-minded individuals. Join us to experience engaging conversations and insightful exchanges.
        </p>
      </div>

      {/* Footer */}
      <footer style={{ background: "#222", color: "#fff", padding: "18px 40px", textAlign: "center" }}>
        <div>© 2025 Ringmaster's Roundtable. All rights reserved.</div>
        <div style={{ marginTop: 8, fontSize: 15 }}>
          Contact: info@ringmastersroundtable.com | Follow us on social media
        </div>
      </footer>
    </div>
  );
};

export default Home;
