import React, { useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router"; // Use actual navigation hook
import a1 from "./a1.png"

const Home = () => {
  const [isVisible, setIsVisible] = useState({});
  const observerRef = useRef(null);
  
  const navigate = useNavigate(); // Initialize the hook

  const handleGetStarted = () => {
    navigate("/authmodal"); // Actual navigation
  };

  useEffect(() => {
    observerRef.current = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            setIsVisible((prev) => ({ ...prev, [entry.target.id]: true }));
          }
        });
      },
      { threshold: 0.1 }
    );

    document.querySelectorAll('[data-animate]').forEach((el) => {
      if (observerRef.current) observerRef.current.observe(el);
    });

    return () => {
      if (observerRef.current) observerRef.current.disconnect();
    };
  }, []);

  const features = [
    {
      icon: "🌤️",
      title: "Real-time Weather Intelligence",
      description: "Get real-time, hyper-local weather forecasts powered by the Sky Gazer agent to ensure your plans are never disrupted.",
      color: "linear-gradient(135deg, #FF4500 0%, #FF6347 100%)",
      image: "https://images.unsplash.com/photo-1592210454359-9043f067919b?w=400&h=300&fit=crop" // Original URL
    },
    {
      icon: "🗺️",
      title: "AI-Powered Smart Routes",
      description: "The Trailblazer finds optimal, traffic-aware travel routes with precise distance and time calculations for peak efficiency.",
      color: "linear-gradient(135deg, #FF6347 0%, #FFA07A 100%)",
      image: "https://images.unsplash.com/photo-1524661135-423995f22d0b?w=400&h=300&fit=crop" // Original URL
    },
    {
      icon: "🎭",
      title: "Curated Event Discovery",
      description: "Discover networking events, industry conferences, and local professional gatherings relevant to your destination and interests.",
      color: "linear-gradient(135deg, #FF8C00 0%, #FF4500 100%)",
      image: "https://images.unsplash.com/photo-1492684223066-81342ee5ff30?w=400&h=300&fit=crop" // Original URL
    },
    {
      icon: "💰",
      title: "Dynamic Budget Optimizer",
      description: "The Quartermaster provides AI-powered, itemized cost breakdowns and intelligent money-saving suggestions for business travel.",
      color: "linear-gradient(135deg, #FFD700 0%, #FF8C00 100%)",
      image: "https://images.unsplash.com/photo-1579621970563-ebec7560ff3e?w=400&h=300&fit=crop" // Original URL
    },
    {
      icon: "📅",
      title: "Calendar Integration Sync",
      description: "Seamlessly sync your detailed itinerary with Google or Outlook Calendar to keep your professional schedule perfectly aligned.",
      color: "linear-gradient(135deg, #FF4500 0%, #FF6347 100%)",
      image: "https://images.unsplash.com/photo-1506784983877-45594efa4cbe?w=400&h=300&fit=crop" // Original URL
    },
    {
      icon: "⚖️",
      title: "Destination Comparator Matrix",
      description: "Compare multiple destinations based on key business metrics: costs, logistics, connectivity, and relevant events.",
      color: "linear-gradient(135deg, #FF6347 0%, #FF8C00 100%)",
      image: "https://images.unsplash.com/photo-1488646953014-85cb44e25828?w=400&h=300&fit=crop" // Original URL
    }
  ];

  const agents = [
    { name: "Sky Gazer", role: "Weather Logistics", icon: "☀️", color: "#FF4500" },
    { name: "Trailblazer", role: "Route Optimization", icon: "🧭", color: "#FF6347" },
    { name: "Quartermaster", role: "Financial Control", icon: "📊", color: "#FF8C00" }
  ];

  const neonOrange = "#FF4500";
  const lightOrange = "#FF6347";
  const deepOrange = "#CC3700";
  const gradientPrimary = `linear-gradient(135deg, ${neonOrange} 0%, ${lightOrange} 100%)`;
  const heroBackground = `linear-gradient(135deg, #ffffff 0%, #fefefe 50%, #fff7f2 100%)`;

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Poppins:wght@300;400;600;700;800&family=Roboto+Slab:wght@700;900&display=swap');
        
        * {
          margin: 0;
          padding: 0;
          box-sizing: border-box;
        }
        
        body {
          font-family: 'Poppins', sans-serif;
          overflow-x: hidden;
        }
        
        @keyframes fadeInUp {
          from { opacity: 0; transform: translateY(30px); }
          to { opacity: 1; transform: translateY(0); }
        }
        
        @keyframes fadeInScale {
          from { opacity: 0; transform: scale(0.95); }
          to { opacity: 1; transform: scale(1); }
        }
        
        @keyframes float {
          0%, 100% { transform: translateY(0px); }
          50% { transform: translateY(-10px); }
        }
        
        @keyframes pulse {
          0%, 100% { transform: scale(1); }
          50% { transform: scale(1.03); }
        }
        
        @keyframes shimmer {
          0% { background-position: -1000px 0; }
          100% { background-position: 1000px 0; }
        }
        
        .animate-fade-up {
          animation: fadeInUp 0.7s ease-out forwards;
        }
        
        .animate-fade-scale {
          animation: fadeInScale 0.7s ease-out forwards;
        }
        
        .float {
          animation: float 4s ease-in-out infinite;
        }
        
        .pulse-btn {
          animation: pulse 1.5s ease-in-out infinite;
        }
        
        .shimmer {
          background: linear-gradient(90deg, transparent, rgba(255,255,255,0.4), transparent);
          background-size: 1000px 100%;
          animation: shimmer 3s infinite;
        }
        
        .gradient-text {
          background: linear-gradient(135deg, ${deepOrange} 0%, ${neonOrange} 50%, ${lightOrange} 100%);
          -webkit-background-clip: text;
          -webkit-text-fill-color: transparent;
          background-clip: text;
        }
        
        .card-hover {
          transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
        }
        
        .card-hover:hover {
          transform: translateY(-8px) scale(1.01);
          /* Neon orange glow effect */
          box-shadow: 0 10px 40px rgba(255, 69, 0, 0.6), 0 0 15px rgba(255, 69, 0, 0.2); 
        }
        
        .blob {
          border-radius: 40% 60% 70% 30% / 40% 50% 60% 50%;
          animation: float 6s ease-in-out infinite;
        }
        
        .nav-blur {
          backdrop-filter: blur(12px);
          background: rgba(255, 255, 255, 0.95);
        }
        
        /* CSS for 3-column feature grid */
        .features-grid {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(300px, 1fr)); /* Default to 300px min width */
          gap: 30px;
        }

        /* Enforce 3 columns for desktop/larger screens */
        @media (min-width: 1200px) {
          .features-grid {
            grid-template-columns: repeat(3, 1fr);
          }
        }

      `}</style>

      <div style={{ minHeight: "100vh", background: heroBackground, position: "relative", overflow: "hidden" }}>
        
        {/* Animated Background Blobs - Toned Down for Professional Look */}
        <div className="blob" style={{ position: "absolute", top: "10%", left: "5%", width: "250px", height: "250px", background: `radial-gradient(circle, ${lightOrange}33 0%, transparent 70%)`, zIndex: 0, opacity: 0.5 }} />
        <div className="blob" style={{ position: "absolute", top: "50%", right: "10%", width: "350px", height: "350px", background: `radial-gradient(circle, ${neonOrange}22 0%, transparent 70%)`, zIndex: 0, animationDelay: "2s", opacity: 0.4 }} />
        <div className="blob" style={{ position: "absolute", bottom: "5%", left: "20%", width: "300px", height: "300px", background: `radial-gradient(circle, ${deepOrange}22 0%, transparent 70%)`, zIndex: 0, animationDelay: "4s", opacity: 0.6 }} />

        {/* Navbar */}
        <nav className="nav-blur" style={{ position: "fixed", top: 0, left: 0, right: 0, zIndex: 1000, borderBottom: `1px solid ${lightOrange}22`, boxShadow: "0 2px 10px rgba(0, 0, 0, 0.05)" }}>
          {/* Note: Navbar div has vertical padding of 15px (15px top + 15px bottom) */}
          <div style={{ maxWidth: "1400px", height: "100px", margin: "0 auto", padding: "0px, 0px",display: 'flex', justifyContent: "space-between", alignItems: "center" }}>
            
            {/* Logo/Text Replacement in Navbar - Image container set to full height */}
            <div style={{ display: "flex", alignItems: "center", height: '240px' }}> {/* Adjusted container height */}
              <img 
                src={a1} 
                alt="Project Ascend Logo" 
                style={{ height: '100%', width: 'auto', objectFit: 'contain', filter: 'drop-shadow(0 2px 4px rgba(255, 69, 0, 0.5))' }} 
              />
            </div>
            
            <button
              onClick={handleGetStarted}
              style={{ padding: "12px 30px", fontSize: "15px", fontWeight: 700, borderRadius: "5px", border: "none", background: gradientPrimary, color: "#fff", cursor: "pointer", boxShadow: `0 5px 15px ${neonOrange}88`, transition: "all 0.3s ease" }}
              onMouseEnter={(e) => {
                e.target.style.transform = "translateY(-1px)";
                e.target.style.boxShadow = `0 8px 20px ${neonOrange}aa`;
              }}
              onMouseLeave={(e) => {
                e.target.style.transform = "translateY(0)";
                e.target.style.boxShadow = `0 5px 15px ${neonOrange}88`;
              }}
            >
              Get Started
            </button>
          </div>
        </nav>

        {/* Hero Section */}
        <section style={{ position: "relative", zIndex: 1, paddingTop: "120px", paddingBottom: "60px", textAlign: "center", maxWidth: "1400px", margin: "0 auto", padding: "120px 40px 60px" }}>
          <div className="animate-fade-up" style={{ marginBottom: "20px" }}>
            <h1 className="gradient-text" style={{ fontFamily: "'Roboto Slab', serif", fontSize: "clamp(3rem, 8vw, 5.5rem)", fontWeight: 900, lineHeight: 1.1, marginBottom: "20px" }}>
              AI-Orchestrated<br />Business Travel
            </h1>
            <p style={{ fontSize: "clamp(1.1rem, 2.5vw, 1.6rem)", color: "#444", maxWidth: "800px", margin: "0 auto 40px", fontWeight: 400, lineHeight: 1.6 }}>
              Where expert agents unite to craft the perfect, efficient, and cost-optimized journey for the modern professional.
            </p>
          </div>

          {/* Hero Image */}
          <div className="animate-fade-scale" style={{ marginBottom: "50px", position: "relative" }}>
            <img 
              src="https://images.unsplash.com/photo-1488646953014-85cb44e25828?w=1200&h=600&fit=crop" // Original Hero Image
              alt="Professional Travel Planning"
              style={{ width: "100%", maxWidth: "1000px", height: "450px", objectFit: "cover", borderRadius: "20px", boxShadow: `0 20px 50px ${neonOrange}33`, margin: "0 auto", display: "block" }}
            />
            <div style={{ position: "absolute", top: "20px", right: "calc(50% - 480px)", background: `rgba(255, 255, 255, 0.95)`, padding: "15px 25px", borderRadius: "15px", boxShadow: "0 10px 30px rgba(0,0,0,0.1)", borderLeft: `5px solid ${neonOrange}` }}>
              <div style={{ fontSize: "30px", marginBottom: "5px" }}>⚡</div>
              <div style={{ fontSize: "13px", fontWeight: 700, color: neonOrange }}>Optimized Logistics</div>
            </div>
          </div>

          {/* Agent Cards */}
          <div style={{ display: "flex", justifyContent: "center", gap: "25px", flexWrap: "wrap", marginBottom: "40px" }}>
            {agents.map((agent, idx) => (
              <div 
                key={idx} 
                className="float card-hover"
                style={{ 
                  background: "white", 
                  padding: "25px 35px", 
                  borderRadius: "15px", 
                  boxShadow: "0 8px 25px rgba(0, 0, 0, 0.08)",
                  border: `2px solid ${agent.color}`,
                  animationDelay: `${idx * 0.15}s`,
                  minWidth: "200px"
                }}
              >
                <div style={{ fontSize: "40px", marginBottom: "10px" }}>{agent.icon}</div>
                <div style={{ fontSize: "18px", fontWeight: 700, color: "#222", marginBottom: "3px" }}>{agent.name}</div>
                <div style={{ fontSize: "13px", color: "#666" }}>{agent.role}</div>
              </div>
            ))}
          </div>

          <button
            onClick={handleGetStarted}
            className="pulse-btn"
            style={{ padding: "18px 45px", fontSize: "18px", fontWeight: 700, borderRadius: "5px", border: "none", background: gradientPrimary, color: "#fff", cursor: "pointer", boxShadow: `0 10px 30px ${neonOrange}88`, display: "inline-flex", alignItems: "center", gap: "10px" }}
          >
            Create Your Itinerary
            <span style={{ fontSize: "22px" }}>✅</span>
          </button>
        </section>

        {/* --- */}

        {/* Stats Section */}
        <section style={{ background: gradientPrimary, padding: "60px 40px", position: "relative", zIndex: 1, boxShadow: `0 0 20px ${neonOrange}33` }}>
          <div style={{ maxWidth: "1400px", margin: "0 auto", display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))", gap: "30px", textAlign: "center" }}>
            {[
              { num: "500+", label: "Successful Missions" },
              { num: "100K+", label: "Hours Saved" },
              { num: "99.5%", label: "Accuracy Rate" },
              { num: "24/7", label: "Global Support" }
            ].map((stat, idx) => (
              <div key={idx}>
                <div style={{ fontSize: "50px", fontWeight: 900, color: "white", marginBottom: "5px", fontFamily: "'Roboto Slab', serif" }}>{stat.num}</div>
                <div style={{ fontSize: "18px", color: "rgba(255,255,255,0.9)", fontWeight: 300 }}>{stat.label}</div>
              </div>
            ))}
          </div>
        </section>

        {/* --- */}

        {/* Features Section - 3 COLUMNS */}
        <section style={{ padding: "80px 40px", position: "relative", zIndex: 1 }}>
          <div style={{ maxWidth: "1400px", margin: "0 auto" }}>
            <h2 className="gradient-text" style={{ fontFamily: "'Roboto Slab', serif", fontSize: "clamp(2rem, 5vw, 4rem)", fontWeight: 900, textAlign: "center", marginBottom: "15px" }}>
              The Power of Specialized AI
            </h2>
            <p style={{ textAlign: "center", fontSize: "18px", color: "#666", marginBottom: "60px", maxWidth: "700px", margin: "0 auto 60px" }}>
              Our multi-agent platform orchestrates specialized AI scouts to cover every aspect of your professional journey.
            </p>

            <div className="features-grid"> {/* Uses the 3-column CSS class */}
              {features.map((feature, idx) => (
                <div
                  key={idx}
                  id={`feature-${idx}`}
                  data-animate
                  className={`card-hover ${isVisible[`feature-${idx}`] ? 'animate-fade-up' : ''}`}
                  style={{ 
                    background: "white",
                    borderRadius: "15px",
                    overflow: "hidden",
                    boxShadow: "0 8px 30px rgba(0, 0, 0, 0.08)",
                    border: `1px solid #eee`,
                    opacity: isVisible[`feature-${idx}`] ? 1 : 0,
                    animationDelay: `${idx * 0.1}s`
                  }}
                >
                  <div style={{ height: "180px", overflow: "hidden", position: "relative" }}>
                    <img 
                      src={feature.image} 
                      alt={feature.title}
                      style={{ width: "100%", height: "100%", objectFit: "cover" }}
                    />
                    <div style={{ position: "absolute", top: "20px", left: "20px", background: "white", width: "50px", height: "50px", borderRadius: "10px", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "28px", boxShadow: `0 4px 15px ${neonOrange}44`, borderBottom: `3px solid ${neonOrange}` }}>
                      {feature.icon}
                    </div>
                  </div>
                  <div style={{ padding: "25px" }}>
                    <h3 style={{ fontSize: "20px", fontWeight: 700, marginBottom: "10px", color: "#333" }}>
                      {feature.title}
                    </h3>
                    <p style={{ fontSize: "15px", color: "#666", lineHeight: 1.6 }}>
                      {feature.description}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* --- */}

        {/* How It Works - ADDED card-hover CLASS */}
        <section style={{ padding: "80px 40px", background: "#fef8f5", position: "relative", zIndex: 1 }}>
          <div style={{ maxWidth: "1400px", margin: "0 auto" }}>
            <h2 className="gradient-text" style={{ fontFamily: "'Roboto Slab', serif", fontSize: "clamp(2rem, 5vw, 4rem)", fontWeight: 900, textAlign: "center", marginBottom: "15px" }}>
              Three Steps to Efficiency
            </h2>
            <p style={{ textAlign: "center", fontSize: "18px", color: "#666", marginBottom: "60px" }}>
              A streamlined process designed for speed and precision
            </p>

            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))", gap: "40px" }}>
              {[
                { num: "1", title: "Input Mission Details", desc: "Define your destination, dates, and core travel objectives.", img: "https://images.unsplash.com/photo-1569949381669-ecf31ae8e613?w=400&h=300&fit=crop" }, // Original URL
                { num: "2", title: "AI Agents Collaborate", desc: "Our multi-agent system processes your needs, optimizing logistics and cost.", img: "https://images.unsplash.com/photo-1551836022-d5d88e9218df?w=400&h=300&fit=crop" }, // Original URL
                { num: "3", title: "Launch Your Travel", desc: "Receive your final, complete, and synchronized itinerary.", img: "https://images.unsplash.com/photo-1436491865332-7a61a109cc05?w=400&h=300&fit=crop" } // Original URL
              ].map((step, idx) => (
                <div key={idx} className="card-hover" style={{ textAlign: "center" }}> {/* Added card-hover here */}
                  <div style={{ position: "relative", marginBottom: "20px" }}>
                    <img 
                      src={step.img} 
                      alt={step.title}
                      style={{ width: "100%", height: "220px", objectFit: "cover", borderRadius: "15px", boxShadow: `0 10px 30px ${neonOrange}22` }}
                    />
                    <div style={{ position: "absolute", top: "-15px", left: "50%", transform: "translateX(-50%)", width: "60px", height: "60px", background: gradientPrimary, borderRadius: "50%", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "28px", fontWeight: 800, color: "white", boxShadow: `0 5px 20px ${neonOrange}88`, fontFamily: "'Roboto Slab', serif" }}>
                      {step.num}
                    </div>
                  </div>
                  <h3 style={{ fontSize: "22px", fontWeight: 700, marginBottom: "10px", color: "#333" }}>{step.title}</h3>
                  <p style={{ fontSize: "15px", color: "#666", lineHeight: 1.6 }}>{step.desc}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* --- */}

        {/* CTA Section */}
        <section style={{ padding: "80px 40px", position: "relative", zIndex: 1 }}>
          <div style={{ maxWidth: "1000px", margin: "0 auto", background: gradientPrimary, borderRadius: "20px", padding: "60px 40px", textAlign: "center", boxShadow: `0 20px 50px ${neonOrange}44`, position: "relative", overflow: "hidden" }}>
            <div className="shimmer" style={{ position: "absolute", top: 0, left: 0, right: 0, bottom: 0, pointerEvents: "none" }} />
            <h2 style={{ fontSize: "clamp(1.8rem, 4vw, 3rem)", fontWeight: 900, color: "white", marginBottom: "20px", fontFamily: "'Roboto Slab', serif", position: "relative", zIndex: 1 }}>
              Ready for Smarter Business Travel?
            </h2>
            <p style={{ fontSize: "18px", color: "rgba(255,255,255,0.95)", marginBottom: "30px", position: "relative", zIndex: 1 }}>
              Elevate your logistics. Optimize your spending. Maximize your time.
            </p>
            <button
              onClick={handleGetStarted}
              style={{ padding: "15px 45px", fontSize: "18px", fontWeight: 700, borderRadius: "5px", border: `2px solid white`, background: "white", color: deepOrange, cursor: "pointer", boxShadow: "0 10px 30px rgba(0,0,0,0.2)", position: "relative", zIndex: 1, transition: "all 0.3s ease" }}
              onMouseEnter={(e) => {
                e.target.style.transform = "scale(1.03)";
                e.target.style.boxShadow = "0 15px 40px rgba(0,0,0,0.3)";
              }}
              onMouseLeave={(e) => {
                e.target.style.transform = "scale(1)";
                e.target.style.boxShadow = "0 10px 30px rgba(0,0,0,0.2)";
              }}
            >
              Secure Your First Itinerary 🚀
            </button>
          </div>
        </section>

        {/* --- */}

        {/* Footer */}
        <footer style={{ background: "#222", color: "white", padding: "40px 40px 30px", position: "relative", zIndex: 1 }}>
          <div style={{ maxWidth: "1400px", margin: "0 auto", textAlign: "center" }}>
            
            {/* Logo/Text Replacement in Footer */}
            <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: "10px", marginBottom: "20px" }}>
              <img 
                src={a1} 
                alt="Project Ascend Logo" 
                style={{ height: '60px', width: 'auto', filter: 'drop-shadow(0 2px 4px rgba(255, 69, 0, 0.5)) invert(1)' }} 
              />
            </div>
            
            <div style={{ fontSize: "14px", color: "#999", marginBottom: "10px" }}>
              © 2025 The Ringmaster's Roundtable. All rights reserved.
            </div>
            <div style={{ fontSize: "13px", color: "#777" }}>
              Precision-driven AI solutions for modern travel.
            </div>
          </div>
        </footer>
      </div>
    </>
  );
};

export default Home;