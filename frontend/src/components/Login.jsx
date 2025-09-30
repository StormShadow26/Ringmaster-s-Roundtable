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
    alert("Google authentication failed");
  };

  const handleResetPassword = (e) => {
    e.preventDefault();
    // TODO: Implement reset password logic
    alert(`Reset password link sent to: ${resetEmail}`);
    setShowReset(false);
    setResetEmail("");
  };

  return (
    <GoogleOAuthProvider clientId={import.meta.env.VITE_GOOGLE_CLIENT_ID}>
      <div className="login-container w-full max-w-sm mx-auto p-6 rounded-lg shadow-lg bg-white/90 border border-gray-200">
        {error && (
          <div className="mb-4 p-2 bg-red-100 text-red-700 rounded text-center border border-red-300">
            {error}
          </div>
        )}
        <form onSubmit={handleLogin} className={showReset ? "hidden" : "block"}>
          <div className="mb-5">
            <label className="block text-sm font-normal text-gray-800 mb-1">
              Email
            </label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              className="w-full px-3 py-2 rounded-md border border-blue-300 focus:outline-none focus:ring-1 focus:ring-blue-400 text-gray-900 bg-white text-sm"
            />
          </div>
          <div className="mb-5">
            <label className="block text-sm font-normal text-gray-800 mb-1">
              Password
            </label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              className="w-full px-3 py-2 rounded-md border border-blue-300 focus:outline-none focus:ring-1 focus:ring-blue-400 text-gray-900 bg-white text-sm"
            />
          </div>
          <button
            type="submit"
            className="w-full py-2 mb-3 rounded-md bg-blue-600 text-white font-medium text-base shadow hover:bg-blue-700 transition-all duration-200"
          >
            Login
          </button>
          <div className="w-full flex justify-center mb-3">
            <GoogleLogin
              onSuccess={handleGoogleSuccess}
              onError={handleGoogleError}
              width="100%"
              text="continue_with"
              shape="pill"
              theme="filled_blue"
            />
          </div>
          <div className="flex justify-between items-center mt-2">
            <button
              type="button"
              onClick={() => setShowReset(true)}
              className="bg-transparent border-none text-blue-600 hover:underline cursor-pointer text-xs"
            >
              Forgot password?
            </button>
            <button
              type="button"
              onClick={onSignup}
              className="bg-transparent border-none text-purple-600 hover:underline cursor-pointer text-xs"
            >
              Signup?
            </button>
          </div>
        </form>
        {showReset && (
          <form onSubmit={handleResetPassword}>
            <h3 className="text-base font-bold text-purple-700 mb-3 text-center">
              Reset Password
            </h3>
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Email
              </label>
              <input
                type="email"
                value={resetEmail}
                onChange={(e) => setResetEmail(e.target.value)}
                required
                className="w-full px-3 py-2 rounded-md border border-purple-300 focus:outline-none focus:ring-1 focus:ring-purple-400 text-gray-900 bg-white text-sm"
              />
            </div>
            <button
              type="submit"
              className="w-full py-2 mb-3 rounded-md bg-purple-600 text-white font-medium text-base shadow hover:bg-purple-700 transition-all duration-200"
            >
              Send Reset Link
            </button>
            <button
              type="button"
              onClick={() => setShowReset(false)}
              className="w-full py-2 rounded-md bg-gray-200 text-gray-700 font-medium text-base shadow hover:bg-gray-300 transition-all duration-200"
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
