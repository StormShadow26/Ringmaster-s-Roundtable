import { useState, useEffect } from "react";
import { useDispatch, useSelector } from "react-redux";
import { registerUser, googleAuth } from "../authSlice";
import { useNavigate } from "react-router";
import { GoogleOAuthProvider, GoogleLogin } from "@react-oauth/google";

const Register = ({ onSignin }) => {
  
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const dispatch = useDispatch();
  const { loading, error, user } = useSelector((state) => state.auth);
  const navigate = useNavigate();

  useEffect(() => {
    if (user) {
      navigate("/dashboard");
    }
  }, [user, navigate]);

  const handleRegister = (e) => {
    e.preventDefault();
    if (password !== confirmPassword) {
      // Replaced alert() with console log for safe execution
      console.error("Passwords do not match");
      return;
    }
    dispatch(registerUser(email, password));
  };


  const handleGoogleSuccess = (credentialResponse) => {
    dispatch(googleAuth(credentialResponse));
  };

  const handleGoogleError = () => {
    // Replaced alert() with console log for safe execution
    console.error("Google authentication failed");
  };

  return (
    <GoogleOAuthProvider clientId={import.meta.env.VITE_GOOGLE_CLIENT_ID}>
      {/* Crisp White Container: max-w-lg (larger size), p-8 (more padding) */}
      <div className="register-container w-full max-w-lg mx-auto p-8 rounded-lg shadow-xl bg-white/95 border border-gray-200 font-sans">
        
        {/* Error Alert Styling */}
        {error && (
          <div className="mb-6 p-3 bg-red-100 text-red-700 rounded-md text-center border border-red-300 font-medium text-sm">
            {error}
          </div>
        )}
        
        <form onSubmit={handleRegister}>
          <h2 className="text-3xl font-extrabold mb-8 text-gray-900 text-center uppercase tracking-wide">Sign Up</h2>
          
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
          
          <div className="mb-6">
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
          
          <div className="mb-8">
            <label className="block text-base font-medium text-gray-700 mb-2">
              Confirm Password
            </label>
            <input
              type="password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
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
            {loading ? 'Processing...' : 'Sign Up'}
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
            <span className="text-sm text-gray-400">Already have an account?</span>
            <button
              type="button"
              onClick={onSignin}
              // Dark Gray text, Orange hover underline
              className="bg-transparent border-none text-gray-600 hover:text-orange-600 hover:font-medium transition-all duration-200 cursor-pointer text-sm"
            >
              Sign In?
            </button>
          </div>
        </form>
      </div>
    </GoogleOAuthProvider>
  );
};

export default Register;
