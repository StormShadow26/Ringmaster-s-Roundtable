import React, { useEffect, useState, useRef } from "react";
import { MapContainer, TileLayer, Marker, Popup, Circle, Polyline, useMap } from "react-leaflet";
import { MapPin, Loader2, Heart, Star, Navigation, Compass, Sparkles, Trophy, Filter, Zap, Camera, Coffee, Mountain, Waves, Users, TrendingUp, X, Search, ChevronRight, Award, Clock, DollarSign, Route, Calendar, Download, Share2, Plus, Trash2, GripVertical, Check, Car, Bus, Train, Plane } from "lucide-react";
import { motion, AnimatePresence, Reorder } from "framer-motion";
import "leaflet/dist/leaflet.css";

const OTP_API_KEY = import.meta.env.VITE_OPENTRIPMAP_API_KEY;
const UNSPLASH_ACCESS_KEY = import.meta.env.VITE_UNSPLASH_ACCESS_KEY;

// Map controller component
function MapController({ center, zoom }) {
  const map = useMap();
  useEffect(() => {
    if (center) {
      map.setView(center, zoom, { animate: true, duration: 1 });
    }
  }, [center, zoom, map]);
  return null;
}

export default function Explore() {
  const [coords, setCoords] = useState({ lat: null, lon: null });
  const [places, setPlaces] = useState([]);
  const [loading, setLoading] = useState(false);
  const [category, setCategory] = useState("natural");
  const [radius, setRadius] = useState(10000);
  const [wishlist, setWishlist] = useState([]);
  const [selectedPlace, setSelectedPlace] = useState(null);
  const [viewMode, setViewMode] = useState("grid");
  const [sortBy, setSortBy] = useState("relevance");
  const [showFilters, setShowFilters] = useState(false);
  const [discoveryMode, setDiscoveryMode] = useState(false);
  const [achievements, setAchievements] = useState([]);
  const [exploredCount, setExploredCount] = useState(0);
  const [searchQuery, setSearchQuery] = useState("");
  const [showRoutePlanner, setShowRoutePlanner] = useState(false);
  const [routeStops, setRouteStops] = useState([]);
  const [optimizedRoute, setOptimizedRoute] = useState(null);
  const [routeName, setRouteName] = useState("");
  const [savedRoutes, setSavedRoutes] = useState([]);
  const [transportMode, setTransportMode] = useState("car");
  const [showItinerary, setShowItinerary] = useState(false);
  const mapRef = useRef();

  const categories = [
    { label: "Nature", value: "natural", icon: Mountain, color: "from-green-500 to-emerald-600", emoji: "🌿" },
    { label: "Adventure", value: "sport", icon: Zap, color: "from-orange-500 to-red-600", emoji: "⚡" },
    { label: "Food & Drinks", value: "foods", icon: Coffee, color: "from-yellow-500 to-orange-600", emoji: "🍴" },
    { label: "Culture", value: "cultural", icon: Award, color: "from-purple-500 to-pink-600", emoji: "🏛️" },
    { label: "Beaches", value: "beaches", icon: Waves, color: "from-blue-500 to-cyan-600", emoji: "🏖️" },
    { label: "Hidden Gems", value: "other", icon: Sparkles, color: "from-indigo-500 to-purple-600", emoji: "💎" },
  ];

  const transportModes = [
    { value: "car", icon: Car, label: "Car", speed: 60 },
    { value: "bus", icon: Bus, label: "Bus", speed: 40 },
    { value: "train", icon: Train, label: "Train", speed: 80 },
    { value: "plane", icon: Plane, label: "Plane", speed: 500 },
  ];

  const trending = [
    { name: "Goa, India", lat: 15.496, lon: 73.8278, img: "https://images.unsplash.com/photo-1507525428034-b723cf961d3e?auto=format&fit=crop&w=800&q=60", tag: "Beach Paradise", visitors: "2.4M" },
    { name: "Rishikesh, India", lat: 30.0869, lon: 78.2676, img: "https://images.unsplash.com/photo-1570934382095-d59af8e5c7a5?auto=format&fit=crop&w=800&q=60", tag: "Yoga Capital", visitors: "1.8M" },
    { name: "Manali, India", lat: 32.2396, lon: 77.1887, img: "https://images.unsplash.com/photo-1600671118900-45e4b69b10b0?auto=format&fit=crop&w=800&q=60", tag: "Mountain Escape", visitors: "2.1M" },
    { name: "Paris, France", lat: 48.8566, lon: 2.3522, img: "https://images.unsplash.com/photo-1502602898657-3e91760cbb34?auto=format&fit=crop&w=800&q=60", tag: "City of Love", visitors: "15M" },
    { name: "Tokyo, Japan", lat: 35.6895, lon: 139.6917, img: "https://images.unsplash.com/photo-1540959733332-eab4deabeeaf?auto=format&fit=crop&w=800&q=60", tag: "Tech & Tradition", visitors: "12M" },
    { name: "Bali, Indonesia", lat: -8.3405, lon: 115.092, img: "https://images.unsplash.com/photo-1537996194471-e657df975ab4?auto=format&fit=crop&w=800&q=60", tag: "Island Dreams", visitors: "6.2M" },
  ];

  const fetchFromOTP = async (lat, lon, kinds, radius) => {
    const url = `https://api.opentripmap.com/0.1/en/places/radius?radius=${radius}&lon=${lon}&lat=${lat}&kinds=${kinds}&rate=2&format=json&limit=50&apikey=${OTP_API_KEY}`;
    const res = await fetch(url);
    return await res.json();
  };

  const fetchDetailsOTP = async (xid) => {
    const url = `https://api.opentripmap.com/0.1/en/places/xid/${xid}?apikey=${OTP_API_KEY}`;
    const res = await fetch(url);
    return await res.json();
  };

  const fetchImageUnsplash = async (keyword) => {
    try {
      const url = `https://api.unsplash.com/photos/random?query=${encodeURIComponent(keyword)}&client_id=${UNSPLASH_ACCESS_KEY}`;
      const res = await fetch(url);
      const obj = await res.json();
      return obj.urls?.small || null;
    } catch {
      return null;
    }
  };

  const fetchPlacesCombined = async (lat, lon, cat, rad) => {
    setLoading(true);
    try {
      const kinds = cat === "foods" ? "restaurants,cafes,fast_food,foods" : cat === "sport" ? "sport,activity" : cat;
      const otpList = await fetchFromOTP(lat, lon, kinds, rad);
      const unified = [];

      for (let item of otpList.slice(0, 30)) {
        const detail = await fetchDetailsOTP(item.xid);
        const img = detail.preview?.source || (await fetchImageUnsplash(detail.name || kinds)) || "https://source.unsplash.com/400x300/?travel";
        unified.push({
          id: item.xid,
          name: detail.name || "Unnamed Place",
          lat: item.point.lat,
          lon: item.point.lon,
          image: img,
          rating: (Math.random() * 2 + 3).toFixed(1),
          reviews: Math.floor(Math.random() * 500 + 50),
          distance: calculateDistance(lat, lon, item.point.lat, item.point.lon),
          price: ["$", "$$", "$$$"][Math.floor(Math.random() * 3)],
          tags: generateTags(cat),
          duration: Math.floor(Math.random() * 3 + 1),
        });
      }

      setPlaces(unified);
    } catch (err) {
      console.error("Error fetching:", err);
    } finally {
      setLoading(false);
    }
  };

  const calculateDistance = (lat1, lon1, lat2, lon2) => {
    const R = 6371;
    const dLat = (lat2 - lat1) * Math.PI / 180;
    const dLon = (lon2 - lon1) * Math.PI / 180;
    const a = Math.sin(dLat/2) * Math.sin(dLat/2) + Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) * Math.sin(dLon/2) * Math.sin(dLon/2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
    return (R * c).toFixed(1);
  };

  const generateTags = (cat) => {
    const tagMap = {
      natural: ["Scenic", "Peaceful", "Instagram-worthy"],
      sport: ["Thrilling", "Active", "Adventurous"],
      foods: ["Delicious", "Local", "Must-try"],
      cultural: ["Historic", "Artistic", "Educational"],
      beaches: ["Relaxing", "Sunny", "Water Sports"],
      other: ["Unique", "Off-beaten", "Discover"],
    };
    return tagMap[cat] || ["Interesting"];
  };

  // Route Planning Functions
  const optimizeRoute = (stops) => {
    if (stops.length < 2) return stops;
    
    // Simple greedy nearest neighbor algorithm
    const optimized = [stops[0]];
    const remaining = [...stops.slice(1)];
    
    while (remaining.length > 0) {
      const current = optimized[optimized.length - 1];
      let nearest = 0;
      let minDist = Infinity;
      
      remaining.forEach((stop, idx) => {
        const dist = calculateDistance(current.lat, current.lon, stop.lat, stop.lon);
        if (dist < minDist) {
          minDist = dist;
          nearest = idx;
        }
      });
      
      optimized.push(remaining[nearest]);
      remaining.splice(nearest, 1);
    }
    
    return optimized;
  };

  const calculateRouteStats = (stops) => {
    let totalDistance = 0;
    let totalDuration = 0;
    
    for (let i = 0; i < stops.length - 1; i++) {
      const dist = parseFloat(calculateDistance(stops[i].lat, stops[i].lon, stops[i+1].lat, stops[i+1].lon));
      totalDistance += dist;
    }
    
    const speed = transportModes.find(m => m.value === transportMode)?.speed || 60;
    const travelTime = (totalDistance / speed) * 60; // in minutes
    
    stops.forEach(stop => {
      totalDuration += stop.duration * 60; // convert hours to minutes
    });
    
    totalDuration += travelTime;
    
    return {
      distance: totalDistance.toFixed(1),
      duration: Math.round(totalDuration),
      travelTime: Math.round(travelTime),
      visitTime: Math.round(totalDuration - travelTime),
    };
  };

  const addToRoute = (place) => {
    if (!routeStops.find(s => s.id === place.id)) {
      setRouteStops([...routeStops, { ...place, order: routeStops.length + 1 }]);
    }
  };

  const removeFromRoute = (placeId) => {
    setRouteStops(routeStops.filter(s => s.id !== placeId));
  };

  const optimizeCurrentRoute = () => {
    const optimized = optimizeRoute(routeStops);
    setOptimizedRoute(optimized);
    setRouteStops(optimized);
  };

  const saveRoute = () => {
    if (routeStops.length < 2 || !routeName) return;
    
    const newRoute = {
      id: Date.now(),
      name: routeName,
      stops: routeStops,
      stats: calculateRouteStats(routeStops),
      transport: transportMode,
      created: new Date().toLocaleDateString(),
    };
    
    setSavedRoutes([...savedRoutes, newRoute]);
    setRouteName("");
    alert("🎉 Route saved successfully!");
  };

  const loadRoute = (route) => {
    setRouteStops(route.stops);
    setTransportMode(route.transport);
    setShowRoutePlanner(true);
  };

  const exportItinerary = () => {
    const stats = calculateRouteStats(routeStops);
    let itinerary = `🗺️ ${routeName || 'My Trip'} Itinerary\n\n`;
    itinerary += `📊 Trip Stats:\n`;
    itinerary += `   Distance: ${stats.distance} km\n`;
    itinerary += `   Total Duration: ${Math.floor(stats.duration/60)}h ${stats.duration%60}m\n`;
    itinerary += `   Travel Time: ${Math.floor(stats.travelTime/60)}h ${stats.travelTime%60}m\n`;
    itinerary += `   Visit Time: ${Math.floor(stats.visitTime/60)}h ${stats.visitTime%60}m\n\n`;
    itinerary += `📍 Stops:\n`;
    
    routeStops.forEach((stop, idx) => {
      itinerary += `\n${idx + 1}. ${stop.name}\n`;
      itinerary += `   ⭐ Rating: ${stop.rating}/5\n`;
      itinerary += `   💰 Price: ${stop.price}\n`;
      itinerary += `   ⏱️ Suggested Duration: ${stop.duration}h\n`;
      if (idx < routeStops.length - 1) {
        const dist = calculateDistance(stop.lat, stop.lon, routeStops[idx+1].lat, routeStops[idx+1].lon);
        itinerary += `   ➡️ ${dist} km to next stop\n`;
      }
    });
    
    const blob = new Blob([itinerary], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${routeName || 'itinerary'}.txt`;
    a.click();
  };

  useEffect(() => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        ({ coords }) => {
          const { latitude, longitude } = coords;
          setCoords({ lat: latitude, lon: longitude });
          fetchPlacesCombined(latitude, longitude, category, radius);
        },
        () => {
          const fallback = { lat: 28.6139, lon: 77.209 };
          setCoords(fallback);
          fetchPlacesCombined(fallback.lat, fallback.lon, category, radius);
        }
      );
    }
  }, []);

  const toggleWishlist = (place) => {
    const updated = wishlist.find((p) => p.id === place.id)
      ? wishlist.filter((p) => p.id !== place.id)
      : [...wishlist, place];
    setWishlist(updated);
  };

  const handleTrendingClick = (lat, lon, name) => {
    setCoords({ lat, lon });
    fetchPlacesCombined(lat, lon, category, radius);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const handleRandomDiscovery = () => {
    setDiscoveryMode(true);
    const randomPlace = places[Math.floor(Math.random() * places.length)];
    if (randomPlace) {
      setSelectedPlace(randomPlace);
      setExploredCount(prev => prev + 1);
      setTimeout(() => setDiscoveryMode(false), 2000);
    }
  };

  const sortedPlaces = [...places].sort((a, b) => {
    if (sortBy === "rating") return b.rating - a.rating;
    if (sortBy === "distance") return a.distance - b.distance;
    return 0;
  });

  const filteredPlaces = sortedPlaces.filter(p => 
    p.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const routeCoordinates = routeStops.map(stop => [stop.lat, stop.lon]);

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-orange-50 to-purple-50">
      {/* Hero Header */}
      <div className="relative overflow-hidden bg-gradient-to-r from-orange-600 via-pink-600 to-purple-600 text-white">
        <div className="absolute inset-0 bg-black/10"></div>
        <motion.div 
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="relative z-10 px-8 py-12"
        >
          <div className="max-w-7xl mx-auto">
            <div className="flex items-center justify-between mb-6">
              <div>
                <h1 className="text-5xl font-black mb-2 flex items-center gap-3">
                  <Compass className="w-12 h-12 animate-spin-slow" />
                  Explore the World
                </h1>
                <p className="text-xl text-white/90">Discover amazing places around you</p>
              </div>
              <div className="flex gap-4">
                <motion.div 
                  whileHover={{ scale: 1.05 }}
                  className="bg-white/20 backdrop-blur-lg rounded-2xl px-6 py-4 text-center"
                >
                  <div className="text-3xl font-bold">{exploredCount}</div>
                  <div className="text-sm">Explored</div>
                </motion.div>
                <motion.div 
                  whileHover={{ scale: 1.05 }}
                  className="bg-white/20 backdrop-blur-lg rounded-2xl px-6 py-4 text-center"
                >
                  <div className="text-3xl font-bold">{savedRoutes.length}</div>
                  <div className="text-sm">Routes</div>
                </motion.div>
              </div>
            </div>

            {/* Search Bar */}
            <div className="relative max-w-2xl">
              <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
              <input
                type="text"
                placeholder="Search destinations, activities, cuisines..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-12 pr-4 py-4 rounded-2xl text-gray-800 text-lg focus:outline-none focus:ring-4 focus:ring-white/50 shadow-2xl"
              />
            </div>
          </div>
        </motion.div>
        
        {/* Decorative elements */}
        <div className="absolute top-0 right-0 w-96 h-96 bg-white/10 rounded-full blur-3xl"></div>
        <div className="absolute bottom-0 left-0 w-96 h-96 bg-purple-500/20 rounded-full blur-3xl"></div>
      </div>

      {/* Category Pills */}
      <div className="sticky top-0 z-40 bg-white/80 backdrop-blur-xl border-b border-gray-200 shadow-lg">
        <div className="max-w-7xl mx-auto px-8 py-4">
          <div className="flex items-center gap-3 overflow-x-auto pb-2 scrollbar-hide">
            {categories.map((c) => {
              const Icon = c.icon;
              return (
                <motion.button
                  key={c.value}
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={() => {
                    setCategory(c.value);
                    fetchPlacesCombined(coords.lat, coords.lon, c.value, radius);
                  }}
                  className={`flex items-center gap-2 px-6 py-3 rounded-full font-bold transition-all whitespace-nowrap shadow-md ${
                    category === c.value
                      ? `bg-gradient-to-r ${c.color} text-white shadow-xl scale-105`
                      : "bg-white hover:bg-gray-50 text-gray-700 border border-gray-200"
                  }`}
                >
                  <span className="text-xl">{c.emoji}</span>
                  {c.label}
                </motion.button>
              );
            })}
            
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={handleRandomDiscovery}
              className="flex items-center gap-2 px-6 py-3 rounded-full font-bold bg-gradient-to-r from-yellow-400 to-orange-500 text-white shadow-xl"
            >
              <Sparkles className="w-5 h-5" />
              Surprise Me!
            </motion.button>

            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={() => setShowRoutePlanner(!showRoutePlanner)}
              className="flex items-center gap-2 px-6 py-3 rounded-full font-bold bg-gradient-to-r from-blue-500 to-indigo-600 text-white shadow-xl ml-auto"
            >
              <Route className="w-5 h-5" />
              Plan Route ({routeStops.length})
            </motion.button>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-8 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Map Section */}
          <div className="lg:col-span-2">
            <motion.div 
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              className="bg-white rounded-3xl shadow-2xl overflow-hidden mb-8"
            >
              <div className="h-[500px] relative">
                {coords.lat ? (
                  <MapContainer
                    center={[coords.lat, coords.lon]}
                    zoom={12}
                    scrollWheelZoom={true}
                    className="h-full w-full"
                    ref={mapRef}
                  >
                    <TileLayer
                      url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                      attribution="© OpenStreetMap"
                    />
                    <Circle
                      center={[coords.lat, coords.lon]}
                      radius={radius}
                      pathOptions={{ color: '#f97316', fillColor: '#f97316', fillOpacity: 0.1 }}
                    />
                    {filteredPlaces.map((p) => (
                      <Marker key={p.id} position={[p.lat, p.lon]}>
                        <Popup>
                          <div className="text-center">
                            <img src={p.image} alt={p.name} className="w-32 h-20 object-cover rounded mb-2" />
                            <strong>{p.name}</strong>
                            <div className="flex items-center justify-center gap-1 mt-1">
                              <Star className="w-3 h-3 fill-yellow-400 text-yellow-400" />
                              <span className="text-sm">{p.rating}</span>
                            </div>
                          </div>
                        </Popup>
                      </Marker>
                    ))}
                    {routeStops.length > 0 && (
                      <>
                        <Polyline 
                          positions={routeCoordinates} 
                          color="#3b82f6" 
                          weight={4}
                          dashArray="10, 10"
                        />
                        {routeStops.map((stop, idx) => (
                          <Marker key={`route-${stop.id}`} position={[stop.lat, stop.lon]}>
                            <Popup>
                              <div className="text-center">
                                <div className="bg-blue-600 text-white rounded-full w-6 h-6 flex items-center justify-center mx-auto mb-2 font-bold">
                                  {idx + 1}
                                </div>
                                <strong>{stop.name}</strong>
                              </div>
                            </Popup>
                          </Marker>
                        ))}
                      </>
                    )}
                    <MapController center={coords.lat && coords.lon ? [coords.lat, coords.lon] : null} zoom={12} />
                  </MapContainer>
                ) : (
                  <div className="flex justify-center items-center h-full">
                    <Loader2 className="animate-spin w-12 h-12 text-orange-600" />
                  </div>
                )}
                
                {/* Map Controls */}
                <div className="absolute top-4 right-4 bg-white rounded-xl shadow-lg p-2 space-y-2">
                  <select
                    className="px-3 py-2 rounded-lg text-sm font-medium border-2 border-gray-200 focus:border-orange-500 focus:outline-none"
                    onChange={(e) => {
                      const newRadius = e.target.value * 1000;
                      setRadius(newRadius);
                      fetchPlacesCombined(coords.lat, coords.lon, category, newRadius);
                    }}
                  >
                    <option value="5">5 km</option>
                    <option value="10">10 km</option>
                    <option value="25">25 km</option>
                    <option value="50">50 km</option>
                  </select>
                </div>

                {/* Route Stats Overlay */}
                {routeStops.length > 1 && (
                  <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="absolute bottom-4 left-4 right-4 bg-white/95 backdrop-blur-lg rounded-2xl p-4 shadow-2xl"
                  >
                    <div className="flex items-center justify-between">
                      <div>
                        <div className="text-sm text-gray-600 mb-1">Route Preview</div>
                        <div className="flex gap-4">
                          <div className="flex items-center gap-2">
                            <Navigation className="w-4 h-4 text-blue-600" />
                            <span className="font-bold">{calculateRouteStats(routeStops).distance} km</span>
                          </div>
                          <div className="flex items-center gap-2">
                            <Clock className="w-4 h-4 text-purple-600" />
                            <span className="font-bold">{Math.floor(calculateRouteStats(routeStops).duration/60)}h {calculateRouteStats(routeStops).duration%60}m</span>
                          </div>
                        </div>
                      </div>
                      <button
                        onClick={() => setShowItinerary(true)}
                        className="px-4 py-2 bg-gradient-to-r from-blue-500 to-indigo-600 text-white rounded-xl font-bold hover:shadow-lg transition-all"
                      >
                        View Details
                      </button>
                    </div>
                  </motion.div>
                )}
              </div>
            </motion.div>

            {/* Places Grid */}
            <div className="flex items-center justify-between mb-6">
              <div>
                <h2 className="text-3xl font-black text-gray-900">
                  {filteredPlaces.length} Places Found
                </h2>
                <p className="text-gray-600">Explore amazing spots near you</p>
              </div>
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value)}
                className="px-4 py-2 rounded-xl border-2 border-gray-200 font-medium focus:border-orange-500 focus:outline-none"
              >
                <option value="relevance">Most Relevant</option>
                <option value="rating">Highest Rated</option>
                <option value="distance">Nearest First</option>
              </select>
            </div>

            {loading ? (
              <div className="flex flex-col items-center justify-center py-20">
                <Loader2 className="animate-spin w-16 h-16 text-orange-600 mb-4" />
                <p className="text-xl font-semibold text-gray-700">Discovering amazing places...</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                <AnimatePresence>
                  {filteredPlaces.map((p, i) => (
                    <motion.div
                      key={p.id}
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, scale: 0.9 }}
                      transition={{ delay: i * 0.05 }}
                      whileHover={{ y: -8 }}
                      onClick={() => setSelectedPlace(p)}
                      className="relative rounded-2xl overflow-hidden shadow-lg hover:shadow-2xl bg-white cursor-pointer group"
                    >
                      <div className="relative h-56 overflow-hidden">
                        <img
                          src={p.image}
                          alt={p.name}
                          className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
                          onError={(e) => (e.target.src = "https://source.unsplash.com/400x300/?travel")}
                        />
                        <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent"></div>
                        
                        {/* Tags */}
                        <div className="absolute top-3 left-3 flex gap-2">
                          {p.tags.slice(0, 2).map((tag, idx) => (
                            <span key={idx} className="px-3 py-1 bg-white/90 backdrop-blur-sm rounded-full text-xs font-bold text-gray-800">
                              {tag}
                            </span>
                          ))}
                        </div>
                      </div>

                      <div className="p-5">
                        <h3 className="font-bold text-xl text-gray-900 mb-2 line-clamp-1 group-hover:text-orange-600 transition-colors">
                          {p.name}
                        </h3>
                        
                        <div className="flex items-center gap-4 mb-3 text-sm">
                          <div className="flex items-center gap-1">
                            <Star className="w-4 h-4 fill-yellow-400 text-yellow-400" />
                            <span className="font-bold">{p.rating}</span>
                            <span className="text-gray-500">({p.reviews})</span>
                          </div>
                          <div className="flex items-center gap-1 text-gray-600">
                            <Navigation className="w-4 h-4" />
                            <span>{p.distance} km</span>
                          </div>
                          <div className="font-bold text-green-600">{p.price}</div>
                        </div>

                        <div className="flex gap-2">
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              window.open(`https://www.google.com/maps?q=${p.lat},${p.lon}`, "_blank");
                            }}
                            className="flex-1 flex items-center justify-center gap-2 text-orange-600 font-semibold hover:bg-orange-50 py-2 rounded-lg transition-all"
                          >
                            <MapPin className="w-4 h-4" />
                            Directions
                          </button>
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              addToRoute(p);
                            }}
                            className={`px-4 py-2 rounded-lg font-semibold transition-all ${
                              routeStops.find(s => s.id === p.id)
                                ? "bg-blue-100 text-blue-600"
                                : "bg-gray-100 text-gray-600 hover:bg-blue-50 hover:text-blue-600"
                            }`}
                          >
                            <Plus className="w-4 h-4" />
                          </button>
                        </div>
                      </div>

                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          toggleWishlist(p);
                        }}
                        className="absolute top-3 right-3 p-2 bg-white/90 backdrop-blur-sm rounded-full shadow-lg hover:scale-110 transition-transform"
                      >
                        <Heart
                          fill={wishlist.some((w) => w.id === p.id) ? "#ef4444" : "none"}
                          className={`w-5 h-5 ${wishlist.some((w) => w.id === p.id) ? "text-red-500" : "text-gray-600"}`}
                        />
                      </button>
                    </motion.div>
                  ))}
                </AnimatePresence>
              </div>
            )}
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Wishlist */}
            <motion.div 
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              className="bg-gradient-to-br from-pink-500 to-rose-600 rounded-3xl p-6 text-white shadow-2xl"
            >
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-2xl font-bold flex items-center gap-2">
                  <Heart className="w-6 h-6 fill-white" />
                  My Wishlist
                </h3>
                <div className="bg-white/20 backdrop-blur-sm rounded-full px-3 py-1 text-sm font-bold">
                  {wishlist.length}
                </div>
              </div>
              {wishlist.length === 0 ? (
                <p className="text-white/80">Start adding places to your wishlist!</p>
              ) : (
                <div className="space-y-3 max-h-64 overflow-y-auto">
                  {wishlist.slice(0, 5).map((place) => (
                    <div key={place.id} className="flex items-center gap-3 bg-white/10 backdrop-blur-sm rounded-xl p-3">
                      <img src={place.image} alt={place.name} className="w-12 h-12 rounded-lg object-cover" />
                      <div className="flex-1 min-w-0">
                        <p className="font-semibold truncate">{place.name}</p>
                        <p className="text-xs text-white/70">{place.distance} km away</p>
                      </div>
                      <button
                        onClick={() => addToRoute(place)}
                        className="p-1 bg-white/20 hover:bg-white/30 rounded-lg transition-all"
                      >
                        <Plus className="w-4 h-4" />
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </motion.div>

            {/* Saved Routes */}
            <motion.div 
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.05 }}
              className="bg-white rounded-3xl p-6 shadow-xl"
            >
              <h3 className="text-2xl font-bold text-gray-900 mb-4 flex items-center gap-2">
                <Route className="w-6 h-6 text-blue-600" />
                Saved Routes
              </h3>
              {savedRoutes.length === 0 ? (
                <p className="text-gray-500">No saved routes yet. Plan your first route!</p>
              ) : (
                <div className="space-y-3 max-h-64 overflow-y-auto">
                  {savedRoutes.map((route) => (
                    <div key={route.id} className="p-4 bg-gray-50 rounded-xl hover:bg-gray-100 cursor-pointer transition-all" onClick={() => loadRoute(route)}>
                      <div className="flex items-start justify-between mb-2">
                        <div>
                          <p className="font-bold text-gray-900">{route.name}</p>
                          <p className="text-xs text-gray-500">{route.created}</p>
                        </div>
                        <div className="text-right">
                          <p className="text-sm font-bold text-blue-600">{route.stops.length} stops</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-3 text-xs text-gray-600">
                        <span>📍 {route.stats.distance} km</span>
                        <span>⏱️ {Math.floor(route.stats.duration/60)}h {route.stats.duration%60}m</span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </motion.div>

            {/* Trending Destinations */}
            <motion.div 
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.1 }}
              className="bg-white rounded-3xl p-6 shadow-xl"
            >
              <h3 className="text-2xl font-bold text-gray-900 mb-4 flex items-center gap-2">
                <TrendingUp className="w-6 h-6 text-orange-600" />
                Trending Now
              </h3>
              <div className="space-y-3">
                {trending.slice(0, 4).map((t, i) => (
                  <motion.div
                    key={t.name}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: i * 0.1 }}
                    onClick={() => handleTrendingClick(t.lat, t.lon, t.name)}
                    className="flex items-center gap-3 p-3 rounded-xl hover:bg-gray-50 cursor-pointer group transition-all"
                  >
                    <img src={t.img} alt={t.name} className="w-16 h-16 rounded-xl object-cover" />
                    <div className="flex-1">
                      <p className="font-bold text-gray-900 group-hover:text-orange-600 transition-colors">{t.name}</p>
                      <p className="text-xs text-gray-500">{t.tag}</p>
                      <div className="flex items-center gap-1 text-xs text-gray-400 mt-1">
                        <Users className="w-3 h-3" />
                        <span>{t.visitors} visitors/year</span>
                      </div>
                    </div>
                    <ChevronRight className="w-5 h-5 text-gray-400 group-hover:text-orange-600 group-hover:translate-x-1 transition-all" />
                  </motion.div>
                ))}
              </div>
            </motion.div>
          </div>
        </div>
      </div>

      {/* Route Planner Modal */}
      <AnimatePresence>
        {showRoutePlanner && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4"
            onClick={() => setShowRoutePlanner(false)}
          >
            <motion.div
              initial={{ scale: 0.9, y: 20 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.9, y: 20 }}
              onClick={(e) => e.stopPropagation()}
              className="bg-white rounded-3xl max-w-4xl w-full max-h-[90vh] overflow-hidden shadow-2xl"
            >
              <div className="bg-gradient-to-r from-blue-600 to-indigo-600 text-white p-6">
                <div className="flex items-center justify-between mb-4">
                  <h2 className="text-3xl font-black flex items-center gap-3">
                    <Route className="w-8 h-8" />
                    Route Planner
                  </h2>
                  <button
                    onClick={() => setShowRoutePlanner(false)}
                    className="p-2 hover:bg-white/20 rounded-full transition-all"
                  >
                    <X className="w-6 h-6" />
                  </button>
                </div>
                
                {/* Transport Mode Selector */}
                <div className="flex gap-3">
                  {transportModes.map((mode) => {
                    const Icon = mode.icon;
                    return (
                      <button
                        key={mode.value}
                        onClick={() => setTransportMode(mode.value)}
                        className={`flex items-center gap-2 px-4 py-2 rounded-xl font-semibold transition-all ${
                          transportMode === mode.value
                            ? "bg-white text-blue-600"
                            : "bg-white/20 hover:bg-white/30"
                        }`}
                      >
                        <Icon className="w-4 h-4" />
                        {mode.label}
                      </button>
                    );
                  })}
                </div>
              </div>

              <div className="p-6 max-h-[calc(90vh-200px)] overflow-y-auto">
                {routeStops.length === 0 ? (
                  <div className="text-center py-12">
                    <Route className="w-16 h-16 mx-auto mb-4 text-gray-300" />
                    <p className="text-xl font-semibold text-gray-600 mb-2">No stops added yet</p>
                    <p className="text-gray-500">Click the + button on any place to add it to your route</p>
                  </div>
                ) : (
                  <>
                    {/* Route Stats */}
                    {routeStops.length > 1 && (
                      <div className="grid grid-cols-4 gap-4 mb-6">
                        <div className="bg-gradient-to-br from-blue-500 to-indigo-600 text-white p-4 rounded-xl text-center">
                          <Navigation className="w-6 h-6 mx-auto mb-2" />
                          <div className="text-2xl font-bold">{calculateRouteStats(routeStops).distance} km</div>
                          <div className="text-xs opacity-80">Total Distance</div>
                        </div>
                        <div className="bg-gradient-to-br from-purple-500 to-pink-600 text-white p-4 rounded-xl text-center">
                          <Clock className="w-6 h-6 mx-auto mb-2" />
                          <div className="text-2xl font-bold">{Math.floor(calculateRouteStats(routeStops).duration/60)}h {calculateRouteStats(routeStops).duration%60}m</div>
                          <div className="text-xs opacity-80">Total Time</div>
                        </div>
                        <div className="bg-gradient-to-br from-orange-500 to-red-600 text-white p-4 rounded-xl text-center">
                          <Car className="w-6 h-6 mx-auto mb-2" />
                          <div className="text-2xl font-bold">{Math.floor(calculateRouteStats(routeStops).travelTime/60)}h {calculateRouteStats(routeStops).travelTime%60}m</div>
                          <div className="text-xs opacity-80">Travel Time</div>
                        </div>
                        <div className="bg-gradient-to-br from-green-500 to-emerald-600 text-white p-4 rounded-xl text-center">
                          <MapPin className="w-6 h-6 mx-auto mb-2" />
                          <div className="text-2xl font-bold">{routeStops.length}</div>
                          <div className="text-xs opacity-80">Stops</div>
                        </div>
                      </div>
                    )}

                    {/* Route Stops - Draggable */}
                    <div className="mb-6">
                      <h3 className="text-lg font-bold text-gray-900 mb-3">Your Route</h3>
                      <Reorder.Group axis="y" values={routeStops} onReorder={setRouteStops} className="space-y-3">
                        {routeStops.map((stop, idx) => (
                          <Reorder.Item key={stop.id} value={stop}>
                            <motion.div
                              className="flex items-center gap-4 p-4 bg-gray-50 rounded-xl hover:bg-gray-100 cursor-move"
                            >
                              <GripVertical className="w-5 h-5 text-gray-400" />
                              <div className="bg-blue-600 text-white rounded-full w-8 h-8 flex items-center justify-center font-bold flex-shrink-0">
                                {idx + 1}
                              </div>
                              <img src={stop.image} alt={stop.name} className="w-16 h-16 rounded-lg object-cover" />
                              <div className="flex-1">
                                <p className="font-bold text-gray-900">{stop.name}</p>
                                <div className="flex items-center gap-3 text-xs text-gray-600 mt-1">
                                  <span className="flex items-center gap-1">
                                    <Star className="w-3 h-3 fill-yellow-400 text-yellow-400" />
                                    {stop.rating}
                                  </span>
                                  <span>⏱️ {stop.duration}h visit</span>
                                  <span>{stop.price}</span>
                                </div>
                              </div>
                              {idx < routeStops.length - 1 && (
                                <div className="text-sm text-gray-500">
                                  ↓ {calculateDistance(stop.lat, stop.lon, routeStops[idx+1].lat, routeStops[idx+1].lon)} km
                                </div>
                              )}
                              <button
                                onClick={() => removeFromRoute(stop.id)}
                                className="p-2 hover:bg-red-100 rounded-lg text-red-600 transition-all"
                              >
                                <Trash2 className="w-4 h-4" />
                              </button>
                            </motion.div>
                          </Reorder.Item>
                        ))}
                      </Reorder.Group>
                    </div>

                    {/* Action Buttons */}
                    <div className="flex gap-3">
                      <button
                        onClick={optimizeCurrentRoute}
                        className="flex-1 py-3 px-6 bg-gradient-to-r from-purple-500 to-pink-600 text-white rounded-xl font-bold hover:shadow-lg transition-all flex items-center justify-center gap-2"
                      >
                        <Zap className="w-5 h-5" />
                        Optimize Route
                      </button>
                      <button
                        onClick={exportItinerary}
                        className="flex-1 py-3 px-6 bg-gradient-to-r from-green-500 to-emerald-600 text-white rounded-xl font-bold hover:shadow-lg transition-all flex items-center justify-center gap-2"
                      >
                        <Download className="w-5 h-5" />
                        Export Itinerary
                      </button>
                    </div>

                    {/* Save Route */}
                    <div className="mt-4 p-4 bg-blue-50 rounded-xl">
                      <label className="block text-sm font-semibold text-gray-700 mb-2">Save this route</label>
                      <div className="flex gap-3">
                        <input
                          type="text"
                          placeholder="Enter route name (e.g., Weekend Getaway)"
                          value={routeName}
                          onChange={(e) => setRouteName(e.target.value)}
                          className="flex-1 px-4 py-2 border-2 border-blue-200 rounded-xl focus:border-blue-500 focus:outline-none"
                        />
                        <button
                          onClick={saveRoute}
                          disabled={routeStops.length < 2 || !routeName}
                          className="px-6 py-2 bg-blue-600 text-white rounded-xl font-bold hover:bg-blue-700 transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                        >
                          <Check className="w-5 h-5" />
                          Save
                        </button>
                      </div>
                    </div>
                  </>
                )}
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Place Detail Modal */}
      <AnimatePresence>
        {selectedPlace && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setSelectedPlace(null)}
            className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4"
          >
            <motion.div
              initial={{ scale: 0.9, y: 20 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.9, y: 20 }}
              onClick={(e) => e.stopPropagation()}
              className="bg-white rounded-3xl max-w-2xl w-full max-h-[90vh] overflow-y-auto shadow-2xl"
            >
              <div className="relative h-72">
                <img src={selectedPlace.image} alt={selectedPlace.name} className="w-full h-full object-cover" />
                <button
                  onClick={() => setSelectedPlace(null)}
                  className="absolute top-4 right-4 p-2 bg-white rounded-full shadow-lg hover:bg-gray-100 transition-colors"
                >
                  <X className="w-6 h-6" />
                </button>
                <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/80 to-transparent p-6">
                  <h2 className="text-3xl font-bold text-white mb-2">{selectedPlace.name}</h2>
                  <div className="flex items-center gap-4 text-white">
                    <div className="flex items-center gap-1">
                      <Star className="w-5 h-5 fill-yellow-400 text-yellow-400" />
                      <span className="font-bold">{selectedPlace.rating}</span>
                      <span className="text-white/80">({selectedPlace.reviews} reviews)</span>
                    </div>
                    <div className="flex items-center gap-1">
                      <Navigation className="w-5 h-5" />
                      <span>{selectedPlace.distance} km</span>
                    </div>
                  </div>
                </div>
              </div>

              <div className="p-6 space-y-4">
                <div className="flex flex-wrap gap-2">
                  {selectedPlace.tags.map((tag, idx) => (
                    <span key={idx} className="px-4 py-2 bg-orange-100 text-orange-700 rounded-full text-sm font-semibold">
                      {tag}
                    </span>
                  ))}
                </div>

                <div className="grid grid-cols-3 gap-4">
                  <div className="text-center p-4 bg-gray-50 rounded-xl">
                    <DollarSign className="w-6 h-6 mx-auto mb-2 text-green-600" />
                    <div className="font-bold text-lg">{selectedPlace.price}</div>
                    <div className="text-xs text-gray-500">Price Range</div>
                  </div>
                  <div className="text-center p-4 bg-gray-50 rounded-xl">
                    <Clock className="w-6 h-6 mx-auto mb-2 text-blue-600" />
                    <div className="font-bold text-lg">{selectedPlace.duration}h</div>
                    <div className="text-xs text-gray-500">Visit Duration</div>
                  </div>
                  <div className="text-center p-4 bg-gray-50 rounded-xl">
                    <Users className="w-6 h-6 mx-auto mb-2 text-purple-600" />
                    <div className="font-bold text-lg">{selectedPlace.reviews}+</div>
                    <div className="text-xs text-gray-500">Visitors</div>
                  </div>
                </div>

                <div className="flex gap-3">
                  <button
                    onClick={() => {
                      toggleWishlist(selectedPlace);
                    }}
                    className="flex-1 py-3 px-6 bg-gradient-to-r from-pink-500 to-rose-600 text-white rounded-xl font-bold hover:shadow-lg transition-all flex items-center justify-center gap-2"
                  >
                    <Heart className={`w-5 h-5 ${wishlist.some(w => w.id === selectedPlace.id) ? 'fill-white' : ''}`} />
                    {wishlist.some(w => w.id === selectedPlace.id) ? 'Saved' : 'Save'}
                  </button>
                  <button
                    onClick={() => {
                      addToRoute(selectedPlace);
                      setSelectedPlace(null);
                    }}
                    className="flex-1 py-3 px-6 bg-gradient-to-r from-blue-500 to-indigo-600 text-white rounded-xl font-bold hover:shadow-lg transition-all flex items-center justify-center gap-2"
                  >
                    <Plus className="w-5 h-5" />
                    Add to Route
                  </button>
                  <button
                    onClick={() => window.open(`https://www.google.com/maps?q=${selectedPlace.lat},${selectedPlace.lon}`, "_blank")}
                    className="flex-1 py-3 px-6 bg-gradient-to-r from-orange-500 to-red-600 text-white rounded-xl font-bold hover:shadow-lg transition-all flex items-center justify-center gap-2"
                  >
                    <Navigation className="w-5 h-5" />
                    Directions
                  </button>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Discovery Mode Animation */}
      <AnimatePresence>
        {discoveryMode && (
          <motion.div
            initial={{ opacity: 0, scale: 0.5 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.5 }}
            className="fixed inset-0 z-50 flex items-center justify-center pointer-events-none"
          >
            <div className="bg-gradient-to-r from-yellow-400 via-orange-500 to-pink-500 text-white px-12 py-8 rounded-3xl shadow-2xl text-center">
              <Sparkles className="w-16 h-16 mx-auto mb-4 animate-spin" />
              <h2 className="text-3xl font-black">Discovering...</h2>
              <p className="text-xl mt-2">Finding something amazing for you!</p>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <style>{`
        @keyframes spin-slow {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }
        .animate-spin-slow {
          animation: spin-slow 3s linear infinite;
        }
        .scrollbar-hide::-webkit-scrollbar {
          display: none;
        }
        .scrollbar-hide {
          -ms-overflow-style: none;
          scrollbar-width: none;
        }
      `}</style>
    </div>
  );
}