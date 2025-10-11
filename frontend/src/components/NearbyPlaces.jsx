import React, { useState, useEffect } from "react";
import axios from "axios";

const API_BASE = "http://localhost:5000/api/places";

// --- Haversine distance in km ---
function getDistanceKm(lat1, lon1, lat2, lon2) {
  const R = 6371;
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLon = ((lon2 - lon1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLon / 2) ** 2;
  return R * (2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a)));
}

  // // --- Helper to convert Google Drive link to direct image link (Re-added for safety) ---
  // function getDirectImageUrl(url) {
  //   if (!url) return "";
  //   if (url.includes("drive.google.com")) {
  //     const match = url.match(/\/d\/(.*?)\//);
  //     if (match && match[1]) {
  //       return `https://drive.google.com/uc?export=view&id=${match[1]}`;
  //     }
  //   }
  //   return url;
  // }

export default function NearbyPlaces() {
  const [userLocation, setUserLocation] = useState(null);
  const [places, setPlaces] = useState([]);
  const [nearby, setNearby] = useState([]);
  const [selected, setSelected] = useState(null);

  // --- Get user's current location ---
  useEffect(() => {
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setUserLocation({
          lat: pos.coords.latitude,
          lon: pos.coords.longitude,
        });
      },
      (err) => {
        console.error("Location error:", err);
        // Fallback to a default location (you can change this to your city)
        const fallbackLocation = { lat: 28.6139, lon: 77.2090 }; // Delhi, India
        setUserLocation(fallbackLocation);
      },
      { enableHighAccuracy: true, timeout: 10000, maximumAge: 600000 }
    );
  }, []);

  // --- Fetch places from backend ---
  useEffect(() => {
    const fetchPlaces = async () => {
      try {
        const res = await axios.get(`${API_BASE}/all`);
        
        // Handle different response structures
        let placesData = [];
        if (Array.isArray(res.data)) {
          placesData = res.data;
        } else if (res.data && Array.isArray(res.data.places)) {
          placesData = res.data.places;
        } else if (res.data && res.data.data && Array.isArray(res.data.data)) {
          placesData = res.data.data;
        } else {
          placesData = [];
        }
        
        setPlaces(placesData);
      } catch (err) {
        console.error("Failed to fetch places:", err);
      }
    };
    fetchPlaces();
  }, []);

  // --- Filter nearby and convert photo link ---
  useEffect(() => {
    if (!userLocation || places.length === 0) return;

    const filtered = places
      .map((p) => ({
        ...p,
        photo: p.photo, 
        distance: getDistanceKm(
          userLocation.lat,
          userLocation.lon,
          p.lat,
          p.lon
        ),
      }))
      .filter((p) => p.distance <= 5) // Reset back to 5km
      .sort((a, b) => a.distance - b.distance);

    setNearby(filtered);
  }, [userLocation, places]);

  return (
    // Base container with powerful gradient and minimum height
    <div className="p-8 md:p-12 bg-gradient-to-br from-orange-50 via-white to-gray-50 min-h-screen font-sans">
      
      {/* Dynamic Main Heading */}
      <h2 className="text-5xl font-extrabold mb-10 text-transparent bg-clip-text bg-gradient-to-r from-orange-700 to-amber-600 drop-shadow-xl tracking-tight animate-pulse-slow">
        ✨ Nearby Gastronomic Wonders
      </h2>

      {/* Loading/Empty State Messages */}
      {!userLocation && (
        <p className="text-gray-500 text-xl flex items-center">
            <span className="animate-spin mr-3 text-orange-500">⚙️</span>
            Locating the perfect bite...
        </p>
      )}

      {userLocation && nearby.length === 0 && (
        <div className="p-6 bg-orange-100/50 border-l-4 border-orange-500 rounded-lg text-gray-700 text-xl shadow-inner">
            <p className="font-semibold">No nearby feasts found 😭</p>
            <p className="text-base">Perhaps step out for a few more steps?</p>
        </div>
      )}

      {/* Restaurant Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-8">
        {nearby.map((place, index) => (
          <div
            key={place._id}
            onClick={() => setSelected(place)}
            // Enhanced Card Styling: 3D effect, hover animation, and smooth transitions
            className="cursor-pointer bg-white rounded-3xl overflow-hidden shadow-2xl hover:shadow-orange-400/50 transform hover:scale-[1.03] transition-all duration-300 border border-orange-200/60 perspective-1000 animate-fade-in"
            style={{ animationDelay: `${index * 0.1}s` }}
          >
            {/* Image Container with subtle overlay */}
            <div className="relative">
              <img
                src={place.photo} 
                alt={place.name}
                className="w-full h-64 object-cover transition duration-500 hover:opacity-90"
                onError={(e) => { e.target.onerror = null; e.target.src = "https://via.placeholder.com/600x400?text=Image+Unavailable" }}
              />
              <div className="absolute inset-0 bg-black/10 transition-all duration-300 group-hover:bg-black/0"></div>
            </div>
            
            {/* Card Content */}
            <div className="p-5">
              <h3 className="text-2xl font-bold mb-1 text-gray-900 truncate">
                {place.name}
              </h3>
              {/* Rating Pill */}
              <p className="text-sm font-extrabold text-white inline-block px-3 py-1 rounded-full bg-yellow-500 shadow-md mb-2">
                🌟 {place.rating?.toFixed(1) ?? "N/A"}
              </p>
              {/* Distance Label */}
              <p className="text-orange-600 font-semibold text-lg flex items-center mt-2">
                <span className="mr-2 text-2xl">🏃</span>
                {place.distance.toFixed(2)} km <span className="text-gray-400 text-sm ml-1 font-normal">away</span>
              </p>
            </div>
          </div>
        ))}
      </div>

      {/* --- GAANDFAAD Detail Modal --- */}
      {selected && (
        <div className="fixed inset-0 bg-black/75 backdrop-blur-lg flex items-center justify-center z-50 transition-opacity duration-300 animate-zoom-in">
          <div className="bg-white rounded-3xl w-11/12 max-w-3xl shadow-[0_35px_60px_-15px_rgba(255,140,0,0.5)] overflow-hidden relative transform transition-transform duration-300">
            
            {/* Close Button */}
            <button
              onClick={() => setSelected(null)}
              className="absolute top-4 right-5 text-4xl font-extrabold text-white bg-black/30 hover:bg-black/50 rounded-full w-10 h-10 flex items-center justify-center transition z-10"
            >
              ×
            </button>
            
            {/* Modal Image */}
            <img
              src={selected.photo}
              alt={selected.name}
              className="w-full h-80 object-cover"
              onError={(e) => { e.target.onerror = null; e.target.src = "https://via.placeholder.com/900x500?text=Image+Unavailable" }}
            />
            
            {/* Modal Content */}
            <div className="p-8">
              <h2 className="text-4xl font-extrabold mb-2 text-transparent bg-clip-text bg-gradient-to-r from-orange-600 to-red-500">
                {selected.name}
              </h2>
              
              {/* Rating and Distance */}
              <div className="flex justify-between items-center mb-4 border-b pb-4 border-orange-100">
                <p className="text-3xl font-extrabold text-yellow-500 flex items-center">
                  <span className="mr-2">🏆</span> {selected.rating?.toFixed(1) ?? "N/A"}
                </p>
                <p className="text-xl text-gray-600 font-medium">
                  Distance: <span className="text-orange-600 font-extrabold">{selected.distance.toFixed(2)} km</span>
                </p>
              </div>

              {/* Description */}
              <p className="text-gray-700 text-lg mb-6 leading-relaxed">
                {selected.description}
              </p>
              
              {/* Google Maps Button (Highly stylized) */}
              <a
                href={`https://www.google.com/maps/dir/${userLocation?.lat},${userLocation?.lon}/${selected.lat},${selected.lon}`}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center justify-center w-full bg-gradient-to-r from-orange-600 to-red-500 text-white text-xl font-bold px-8 py-3 rounded-xl shadow-2xl shadow-orange-500/50 hover:shadow-orange-600/70 hover:scale-[1.02] transition-all duration-300 transform"
              >
                Navigate to Heaven →
              </a>
            </div>
          </div>
        </div>
      )}

      
    </div>
  );
}