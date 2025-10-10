import React, { useEffect, useState } from "react";
import axios from "axios";

const API_BASE = "http://localhost:5000/api/users"; // backend base URL

export default function PhotoSlideshow() {
  const [images, setImages] = useState([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [userId, setUserId] = useState(null);

  // Extract userId from JWT stored locally (without jwt-decode)
  useEffect(() => {
    const token = localStorage.getItem("jwtToken");
    if (token) {
      try {
        const base64Url = token.split(".")[1];
        const decoded = JSON.parse(atob(base64Url));
        setUserId(decoded.id);
      } catch (e) {
        console.error("Failed to decode JWT:", e);
      }
    }
  }, []);

  // Fetch user images
  useEffect(() => {
    if (!userId) return;
    const fetchImages = async () => {
      try {
        const res = await axios.get(`${API_BASE}/images/${userId}`);
        setImages(res.data);
      } catch (err) {
        console.error("Error fetching images:", err);
      }
    };
    fetchImages();
  }, [userId]);

  // Auto-slide every 4s
  useEffect(() => {
    if (images.length === 0) return;
    const interval = setInterval(() => {
      setCurrentIndex((prev) => (prev + 1) % images.length);
    }, 4000);
    return () => clearInterval(interval);
  }, [images]);

  if (images.length === 0)
    return (
      <div className="flex items-center justify-center h-72 text-gray-600 text-lg">
        No images found. Upload some memories first 🌄
      </div>
    );

  return (
    <div className="relative w-full min-h-[80vh] flex flex-col items-center justify-center bg-gradient-to-b from-orange-50 to-white overflow-hidden">
      {/* Header */}
      <h1 className="text-4xl font-bold mb-6 text-transparent bg-clip-text bg-gradient-to-r from-orange-600 to-amber-500 drop-shadow-md">
        Your Memory Lane 📸
      </h1>

      {/* Main slideshow */}
      <div className="relative w-[92%] max-w-6xl h-[520px] rounded-[2rem] shadow-[0_0_30px_rgba(255,136,0,0.5)] overflow-hidden transition-transform duration-700 hover:scale-[1.02] hover:shadow-[0_0_50px_rgba(255,120,0,0.9)]">
        {/* Blurred background */}
        <div
          className="absolute inset-0 bg-cover bg-center blur-3xl opacity-40 transition-opacity duration-1000"
          style={{
            backgroundImage: `url(${images[currentIndex]?.url})`,
          }}
        ></div>

        {/* Slide container */}
        <div
          className="absolute inset-0 flex transition-transform duration-[1500ms] ease-in-out"
          style={{
            transform: `translateX(-${currentIndex * 100}%)`,
          }}
        >
          {images.map((img) => (
            <div
              key={img.public_id}
              className="min-w-full h-full flex-shrink-0 relative"
            >
              <img
                src={img.url}
                alt="memory"
                className="w-full h-full object-cover rounded-[2rem] shadow-[0_0_25px_rgba(255,136,0,0.7)] transition-all duration-700 hover:shadow-[0_0_60px_rgba(255,120,0,1)]"
              />
            </div>
          ))}
        </div>

        {/* Caption */}
        <div className="absolute bottom-6 left-1/2 -translate-x-1/2 bg-black/50 text-white px-6 py-2 rounded-full text-lg font-semibold backdrop-blur-sm shadow-lg border border-white/20">
          {currentIndex + 1} / {images.length} — Beautiful Memories ❤️
        </div>
      </div>

      {/* Navigation dots */}
      <div className="flex space-x-2 mt-5">
        {images.map((_, index) => (
          <button
            key={index}
            onClick={() => setCurrentIndex(index)}
            className={`w-3.5 h-3.5 rounded-full transition-all duration-500 border border-orange-400 ${
              index === currentIndex
                ? "bg-orange-500 scale-125 shadow-[0_0_10px_rgba(255,120,0,0.9)]"
                : "bg-gray-300 hover:bg-orange-300"
            }`}
          ></button>
        ))}
      </div>
    </div>
  );
}
