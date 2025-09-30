import React from "react";
import Login from "./Login";
import Register from "./Register";
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
    <div className="min-h-screen flex flex-col items-center justify-center bg-gradient-to-br from-blue-900 via-purple-900 to-black relative overflow-hidden">
      {/* Animated background shapes */}
      <div className="absolute top-0 left-0 w-full h-full pointer-events-none z-0">
        <div className="absolute w-96 h-96 bg-blue-500 opacity-30 rounded-full blur-3xl animate-pulse" style={{ top: '-6rem', left: '-6rem' }}></div>
        <div className="absolute w-80 h-80 bg-purple-500 opacity-30 rounded-full blur-3xl animate-pulse" style={{ bottom: '-4rem', right: '-4rem' }}></div>
      </div>

      <div className="z-10 w-full max-w-md mx-auto py-6 px-6 rounded-xl shadow-2xl bg-white/10 backdrop-blur-lg border border-white/20 flex items-center justify-center">
        <div className="relative w-full flex items-center justify-center">
          {/* Both forms are always rendered, but only one is visible and on top */}
          <div ref={registerRef} className={`flex items-center justify-center w-full h-full ${show === "register" ? "z-20" : "z-10"}`} style={{ display: show === "register" || prevShow === "register" ? 'flex' : 'none' }}>
            <div className="w-full max-w-md p-2">
              <Register onSignin={() => setShow("login")} />
            </div>
          </div>
          <div ref={loginRef} className={`flex items-center justify-center w-full h-full ${show === "login" ? "z-20" : "z-10"}`} style={{ display: show === "login" || prevShow === "login" ? 'flex' : 'none' }}>
            <div className="w-full max-w-md p-2">
              <Login onSignup={() => setShow("register")} />
            </div>
          </div>
          {!show && (
            <div className="flex flex-col items-center justify-center h-full text-white opacity-80 animate-fade-in">
              <h2 className="text-lg font-semibold mb-2">Welcome!</h2>
              <p className="mb-3 text-sm">Choose an option to get started.</p>
              <div className="flex gap-2">
                <button
                  onClick={() => setShow("login")}
                  className="px-4 py-2 rounded-md font-medium text-base bg-blue-600 text-white shadow hover:bg-blue-700 transition-all duration-200"
                >
                  Login
                </button>
                <button
                  onClick={() => setShow("register")}
                  className="px-4 py-2 rounded-md font-medium text-base bg-purple-600 text-white shadow hover:bg-purple-700 transition-all duration-200"
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
