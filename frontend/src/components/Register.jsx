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
      alert("Passwords do not match");
      return;
    }
    dispatch(registerUser(email, password));
  };


  const handleGoogleSuccess = (credentialResponse) => {
    dispatch(googleAuth(credentialResponse));
  };

  const handleGoogleError = () => {
    alert("Google authentication failed");
  };

  return (
    <GoogleOAuthProvider clientId={import.meta.env.VITE_GOOGLE_CLIENT_ID}>
      <div className="register-container w-full max-w-sm mx-auto p-6 rounded-lg shadow-lg bg-white/90 border border-gray-200">
        {error && (
          <div className="mb-4 p-2 bg-red-100 text-red-700 rounded text-center border border-red-300">
            {error}
          </div>
        )}
        <form onSubmit={handleRegister}>
          <div className="mb-4">
            <label className="block text-sm font-normal text-gray-800 mb-1">
              Email
            </label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              className="w-full px-3 py-2 rounded-md border border-purple-300 focus:outline-none focus:ring-1 focus:ring-purple-400 text-gray-900 bg-white text-sm"
            />
          </div>
          <div className="mb-4">
            <label className="block text-sm font-normal text-gray-800 mb-1">
              Password
            </label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              className="w-full px-3 py-2 rounded-md border border-purple-300 focus:outline-none focus:ring-1 focus:ring-purple-400 text-gray-900 bg-white text-sm"
            />
          </div>
          <div className="mb-4">
            <label className="block text-sm font-normal text-gray-800 mb-1">
              Confirm Password
            </label>
            <input
              type="password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              required
              className="w-full px-3 py-2 rounded-md border border-purple-300 focus:outline-none focus:ring-1 focus:ring-purple-400 text-gray-900 bg-white text-sm"
            />
          </div>
          <button
            type="submit"
            className="w-full py-2 mb-3 rounded-md bg-purple-600 text-white font-medium text-base shadow hover:bg-purple-700 transition-all duration-200"
          >
            Sign Up
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
          <div className="flex justify-end items-center">
            <button
              type="button"
              onClick={onSignin}
              className="bg-transparent border-none text-blue-600 hover:underline cursor-pointer text-sm"
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
