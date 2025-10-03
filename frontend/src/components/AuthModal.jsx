import React from "react";
import Login from "./Login";
import Register from "./Login"; // Assuming Register is a separate component
import { gsap } from "gsap";
import { useState,useRef,useEffect } from "react";


function AuthModal() {
  const [show, setShow] = useState(null); // 'login' or 'register'
  const [prevShow, setPrevShow] = useState(null);
  const loginRef = useRef(null);
  const registerRef = useRef(null);

  useEffect(() => {
    if (show === "login" && loginRef.current) {
      gsap.fromTo(
        loginRef.current,
        { x: "100vw", opacity: 0, zIndex: 2 },
        { x: 0, opacity: 1, zIndex: 2, duration: 0.6, ease: "power3.out" }
      );
      if (registerRef.current) {
        gsap.to(registerRef.current, { x: "-100vw", opacity: 0, zIndex: 1, duration: 0.6, ease: "power3.in" });
      }
    }
    if (show === "register" && registerRef.current) {
      gsap.fromTo(
        registerRef.current,
        { x: "-100vw", opacity: 0, zIndex: 2 },
        { x: 0, opacity: 1, zIndex: 2, duration: 0.6, ease: "power3.out" }
      );
      if (loginRef.current) {
        gsap.to(loginRef.current, { x: "100vw", opacity: 0, zIndex: 1, duration: 0.6, ease: "power3.in" });
      }
    }
    setPrevShow(show);
  }, [show]);

  return (
    // Clean background with high-contrast gradient accents
    <div className="min-h-screen flex flex-col items-center justify-center bg-gradient-to-br from-white via-gray-100 to-orange-50 relative overflow-hidden font-sans text-gray-900">
      
      {/* --- Dynamic Background Elements (Maximum Density) --- */}
      <div className="absolute top-0 left-0 w-full h-full pointer-events-none z-0">
        
        {/* Large, slow-moving diagonal rectangle (Dark Contrast) */}
        <div className="absolute w-[40rem] h-20 bg-gray-900 opacity-[0.03] transform skew-y-3 -top-10 left-0 animate-slide-left-slow"></div>
        
        {/* Large, rotating square (Primary Accent Orange) */}
        <div className="absolute w-96 h-96 bg-orange-500 opacity-10 transform rotate-45 -top-20 -left-20 animate-spin-slow"></div>
        
        {/* Medium square (Secondary Accent Dark) */}
        <div className="absolute w-72 h-72 bg-gray-800 opacity-8 transform -rotate-12 bottom-0 right-0 animate-pulse-slow"></div>

        {/* Small, fast-moving horizontal line/bar (Orange) */}
        <div className="absolute w-48 h-1 bg-orange-600 opacity-50 transform rotate-12 top-1/2 left-0 animate-slide-right-fast"></div>

        {/* Floating Dark Cube (Top Right) */}
        <div className="absolute w-20 h-20 bg-gray-700 opacity-10 top-1/4 right-20 transform rotate-12 animate-float-vertical"></div>
        
        {/* Floating Orange Diamond (Bottom Left) */}
        <div className="absolute w-16 h-16 bg-orange-700 opacity-15 bottom-1/4 left-10 transform rotate-45 animate-float-horizontal"></div>

        {/* Small, fast orange line (Top 3/4) */}
        <div className="absolute w-32 h-0.5 bg-orange-800 opacity-40 top-3/4 right-1/4 transform rotate-90 animate-slide-right-fast delay-[2000ms]"></div>

        {/* NEW: Large, Slow Dark Triangle (Bottom Right) */}
        <div className="absolute w-96 h-96 bg-gray-800 opacity-[0.05] bottom-[-5rem] right-[-5rem] transform rotate-[135deg]" style={{ clipPath: 'polygon(50% 0%, 100% 100%, 0% 100%)', animation: 'float-vertical 15s ease-in-out infinite alternate' }}></div>

        {/* NEW: Blinking Small Orange Square (Center Top) */}
        <div className="absolute w-12 h-12 bg-orange-500 opacity-20 top-20 left-[40%] transform rotate-[25deg] animate-blink-fade"></div>
        
        {/* NEW: Fast-Spinning Tiny Dark Dot (Top Left) */}
        <div className="absolute w-6 h-6 bg-gray-900 opacity-10 top-10 left-1/4 rounded-full animate-rotate-fast"></div>

        {/* NEW: Floating Dark Rectangle (Center Right) */}
        <div className="absolute w-40 h-10 bg-gray-700 opacity-5 top-1/2 right-[-5rem] transform rotate-[-5deg] animate-slide-right-slow delay-[1500ms]"></div>

        {/* Vertical line grid for structural feel */}
        <div className="absolute inset-0 opacity-10">
          <div className="w-full h-full bg-[size:100px_100px] bg-[repeating-linear-gradient(to_right,theme(colors.gray.300)_1px,transparent_1px),repeating-linear-gradient(to_bottom,theme(colors.gray.300)_1px,transparent_1px)]" style={{ maskImage: 'radial-gradient(ellipse at center, transparent 30%, black)', WebkitMaskImage: 'radial-gradient(ellipse at center, transparent 30%, black)' }}></div>
        </div>
      </div>

      {/* Tailwind CSS keyframe animations (Custom animations for dynamic fill) */}
      <style>{`
        @keyframes spin-slow {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }
        @keyframes rotate-fast {
          from { transform: rotate(0deg); }
          to { transform: rotate(-360deg); }
        }
        @keyframes pulse-slow {
          0%, 100% { opacity: 0.08; transform: scale(1); }
          50% { opacity: 0.12; transform: scale(1.05) rotate(-12deg); }
        }
        @keyframes slide-left-slow {
            0% { transform: translateX(0) skew-y(3deg); }
            50% { transform: translateX(-50%) skew-y(3deg); }
            100% { transform: translateX(0) skew-y(3deg); }
        }
        @keyframes slide-right-fast {
            0% { transform: translateX(-100%) rotate(12deg); }
            100% { transform: translateX(200%) rotate(12deg); }
        }
        @keyframes slide-right-slow {
            0% { transform: translateX(-20%) rotate(-5deg); }
            100% { transform: translateX(120%) rotate(-5deg); }
        }
        @keyframes float-vertical {
            0% { transform: translateY(0) rotate(12deg); }
            50% { transform: translateY(-20px) rotate(18deg); }
            100% { transform: translateY(0) rotate(12deg); }
        }
        @keyframes float-horizontal {
            0% { transform: translateX(0) rotate(45deg); }
            50% { transform: translateX(15px) rotate(40deg); }
            100% { transform: translateX(0) rotate(45deg); }
        }
        @keyframes blink-fade {
            0%, 100% { opacity: 0.2; }
            50% { opacity: 0; }
        }

        .animate-spin-slow {
          animation: spin-slow 80s linear infinite;
        }
        .animate-rotate-fast {
          animation: rotate-fast 10s linear infinite;
        }
        .animate-pulse-slow {
          animation: pulse-slow 12s ease-in-out infinite alternate;
        }
        .animate-slide-left-slow {
            animation: slide-left-slow 50s linear infinite;
        }
        .animate-slide-right-fast {
            animation: slide-right-fast 15s linear infinite;
        }
        .animate-slide-right-slow {
            animation: slide-right-slow 40s linear infinite;
        }
        .animate-float-vertical {
            animation: float-vertical 8s ease-in-out infinite alternate;
        }
        .animate-float-horizontal {
            animation: float-horizontal 10s ease-in-out infinite alternate;
        }
        .animate-blink-fade {
            animation: blink-fade 4s ease-in-out infinite;
        }
      `}</style>

      {/* Main Modal/Card - Increased size: max-w-md -> max-w-xl and py-8 -> py-10 */}
      <div className="z-10 w-full max-w-xl mx-auto py-10 px-8 rounded-lg shadow-2xl shadow-gray-400/50 bg-white/95 backdrop-blur-sm border border-orange-200 flex items-center justify-center transition-all duration-300 hover:shadow-orange-300/80">
        {/* Added min-h-[30rem] to ensure container maintains height even when content is absolute, preventing forms from being clipped by overflow-hidden. */}
        <div className="relative w-full flex items-center justify-center overflow-hidden min-h-[30rem]">
          
          {/* Register Form Container (Removed unnecessary inner div) */}
          <div ref={registerRef} className={`absolute flex items-center justify-center w-full h-full ${show === "register" ? "z-20" : "z-10"}`} style={{ display: show === "register" || prevShow === "register" ? 'flex' : 'none' }}>
            <Register onSignin={() => setShow("login")} /> 
          </div>
          
          {/* Login Form Container (Removed unnecessary inner div) */}
          <div ref={loginRef} className={`absolute flex items-center justify-center w-full h-full ${show === "login" ? "z-20" : "z-10"}`} style={{ display: show === "login" || prevShow === "login" ? 'flex' : 'none' }}>
            <Login onSignup={() => setShow("register")} />
          </div>
          
          {/* Initial Welcome Screen (Now has more vertical space) */}
          {!show && (
            <div className="flex flex-col items-center justify-center h-full text-gray-800 opacity-95 animate-fade-in py-10">
              <h2 className="text-3xl font-extrabold mb-3 text-gray-900 tracking-wider">SECURE ACCESS</h2>
              <p className="mb-6 text-base font-medium text-gray-600">Authentication interface initialized. Choose an Option.</p>
              <div className="flex gap-4">
                
                {/* Login Button - Primary Bold Orange */}
                <button
                  onClick={() => setShow("login")}
                  className="px-7 py-3 rounded-md font-bold text-base bg-orange-600 text-white shadow-lg shadow-orange-300 hover:bg-orange-700 active:scale-98 transition-all duration-200 tracking-wider uppercase"
                >
                  Login
                </button>
                
                {/* Register Button - High-Contrast Dark Gray */}
                <button
                  onClick={() => setShow("register")}
                  className="px-7 py-3 rounded-md font-bold text-base bg-gray-800 text-white shadow-lg shadow-gray-500/50 hover:bg-gray-900 active:scale-98 transition-all duration-200 tracking-wider uppercase"
                >
                  Register
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default AuthModal;
