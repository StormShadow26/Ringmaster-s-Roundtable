<<<<<<< Updated upstream

import { useState, useRef, useEffect } from "react";
import Home from "./components/Home";
import AuthModal from "./components/AuthModal";
import Dashboard from "./components/Dashboard";

import { Routes, Route } from "react-router";
import Chat from "./components/Chat";

function App() {
  return (
    <Routes>
      <Route path="/" element={<Home />} />
      <Route path="/authmodal" element={<AuthModal />} />
      <Route path="/dashboard" element={<Dashboard />} />
      <Route path="/chat" element={<Chat/>} />
    </Routes>
=======
import { useState } from "react";
import "./App.css";

function App() {
  const [city, setCity] = useState("");
  const [weather, setWeather] = useState(null);
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(false);

  const getWeather = async () => {
    if (!city.trim()) {
      setError("Please enter a city");
      return;
    }

    setLoading(true);
    setError(null);
    setWeather(null);

    try {
      const response = await fetch("http://localhost:4000/getWeather", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ city }),
      });

      if (!response.ok) throw new Error("Failed to fetch weather");

      const data = await response.json();

      if (data.error) {
        setError(data.error);
      } else {
        setWeather(data);
      }
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-gradient-to-br from-blue-50 to-purple-100 p-6">
      <h1 className="text-4xl font-bold text-gray-800 mb-6">🌦 Weather Checker</h1>

      <div className="flex gap-2 mb-6">
        <input
          type="text"
          placeholder="Enter city..."
          value={city}
          onChange={(e) => setCity(e.target.value)}
          className="border border-gray-300 rounded px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-400"
        />
        <button
          onClick={getWeather}
          disabled={loading}
          className={`px-4 py-2 rounded text-white ${
            loading
              ? "bg-gray-400 cursor-not-allowed"
              : "bg-blue-500 hover:bg-blue-600"
          }`}
        >
          {loading ? "Loading..." : "Get Weather"}
        </button>
      </div>

      {weather && (
        <div className="p-6 bg-white shadow-lg rounded-xl text-center">
          <p className="text-lg font-semibold text-gray-700">
            City:{" "}
            <span className="font-bold">
              {city.charAt(0).toUpperCase() + city.slice(1)}
            </span>
          </p>
          <p className="text-lg text-gray-600">
            Temperature: <span className="font-medium">{weather.temp}</span>
          </p>
          <p className="text-lg text-gray-600">
            Condition: <span className="font-medium">{weather.condition}</span>
          </p>
        </div>
      )}

      {error && (
        <p className="text-red-500 font-medium mt-4 bg-red-100 px-4 py-2 rounded">
          ⚠ {error}
        </p>
      )}
    </div>
>>>>>>> Stashed changes
  );
}

export default App;
