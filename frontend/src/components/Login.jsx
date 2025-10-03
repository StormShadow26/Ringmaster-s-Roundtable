import React, { useState, useEffect } from "react";
import { useDispatch, useSelector } from "react-redux";
import { loginUser, googleAuth } from "../authSlice";
import { useNavigate } from "react-router";
import { GoogleOAuthProvider, GoogleLogin } from "@react-oauth/google";

const Login = ({ onSignup }) => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showReset, setShowReset] = useState(false);
  const [resetEmail, setResetEmail] = useState("");
  const dispatch = useDispatch();
  const { loading, error, user } = useSelector((state) => state.auth);
  const navigate = useNavigate();

  useEffect(() => {
    if (user) {
      navigate("/dashboard");
    }
  }, [user, navigate]);

  const handleLogin = (e) => {
    e.preventDefault();
    dispatch(loginUser(email, password));
  };


  const handleGoogleSuccess = (credentialResponse) => {
    dispatch(googleAuth(credentialResponse));
  };

  const handleGoogleError = () => {
    // Replaced alert() with console log for safe execution in Canvas environment
    console.error("Google authentication failed");
  };

  const handleResetPassword = (e) => {
    e.preventDefault();
    // TODO: Implement reset password logic
    // Replaced alert() with console log for safe execution in Canvas environment
    console.log(`Reset password link sent attempt to: ${resetEmail}`);
    setShowReset(false);
    setResetEmail("");
  };

  return (
    <GoogleOAuthProvider clientId={import.meta.env.VITE_GOOGLE_CLIENT_ID}>
      {/* Crisp White Container: max-w-lg (larger size), p-8 (more padding) */}
      <div className="login-container w-full max-w-lg mx-auto p-8 rounded-lg shadow-xl bg-white/95 border border-gray-200 font-sans">
        
        {/* Error Alert Styling */}
        {error && (
          <div className="mb-6 p-3 bg-red-100 text-red-700 rounded-md text-center border border-red-300 font-medium text-sm">
            {error}
          </div>
        )}
        
        <form onSubmit={handleLogin} className={showReset ? "hidden" : "block"}>
          <h2 className="text-3xl font-extrabold mb-8 text-gray-900 text-center uppercase tracking-wide">Sign In</h2>
          
          <div className="mb-6">
            <label className="block text-base font-medium text-gray-700 mb-2">
              Email
            </label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              // Orange focus ring and larger padding
              className="w-full px-4 py-3 rounded-md border border-gray-300 focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-orange-500 text-gray-900 bg-white text-base transition-all duration-150"
            />
          </div>
          
          <div className="mb-8">
            <label className="block text-base font-medium text-gray-700 mb-2">
              Password
            </label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              // Orange focus ring and larger padding
              className="w-full px-4 py-3 rounded-md border border-gray-300 focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-orange-500 text-gray-900 bg-white text-base transition-all duration-150"
            />
          </div>
          
          <button
            type="submit"
            // Primary Bold Orange Button Style
            className="w-full py-3.5 mb-5 rounded-md bg-orange-600 text-white font-bold text-lg shadow-lg shadow-orange-300 hover:bg-orange-700 active:scale-[0.99] transition-all duration-200 uppercase tracking-wider"
          >
            {loading ? 'Processing...' : 'Login'}
          </button>
          
          <div className="w-full flex justify-center mb-5">
            <GoogleLogin
              onSuccess={handleGoogleSuccess}
              onError={handleGoogleError}
              width="100%"
              text="continue_with"
              shape="rectangular" // Using rectangular for a crisper look
              theme="filled_black" // Darker theme for masculinity
            />
          </div>
          
          <div className="flex justify-between items-center mt-4">
            <button
              type="button"
              onClick={() => setShowReset(true)}
              // Dark Gray text, Orange hover underline
              className="bg-transparent border-none text-gray-600 hover:text-orange-600 hover:font-medium transition-all duration-200 cursor-pointer text-sm"
            >
              Forgot password?
            </button>
            <button
              type="button"
              onClick={onSignup}
              // Dark Gray text, Orange hover underline
              className="bg-transparent border-none text-gray-600 hover:text-orange-600 hover:font-medium transition-all duration-200 cursor-pointer text-sm"
            >
              Signup?
            </button>
          </div>
        </form>
        
        {/* Reset Password Form */}
        {showReset && (
          <form onSubmit={handleResetPassword}>
            <h3 className="text-2xl font-bold text-gray-800 mb-6 text-center uppercase tracking-wide">
              Reset Password
            </h3>
            <div className="mb-6">
              <label className="block text-base font-medium text-gray-700 mb-2">
                Email
              </label>
              <input
                type="email"
                value={resetEmail}
                onChange={(e) => setResetEmail(e.target.value)}
                required
                // Orange focus ring
                className="w-full px-4 py-3 rounded-md border border-gray-300 focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-orange-500 text-gray-900 bg-white text-base transition-all duration-150"
              />
            </div>
            
            <button
              type="submit"
              // Primary Bold Orange Submit Button
              className="w-full py-3.5 mb-3 rounded-md bg-orange-600 text-white font-bold text-lg shadow-lg hover:bg-orange-700 active:scale-[0.99] transition-all duration-200 uppercase tracking-wider"
            >
              Send Reset Link
            </button>
            
            <button
              type="button"
              onClick={() => setShowReset(false)}
              // Secondary Gray Button Style
              className="w-full py-3.5 rounded-md bg-gray-200 text-gray-700 font-semibold text-lg shadow-inner hover:bg-gray-300 active:scale-[0.99] transition-all duration-200 border border-gray-300"
            >
              Back to Login
            </button>
          </form>
        )}
      </div>
    </GoogleOAuthProvider>
  );
};

export default Login;
