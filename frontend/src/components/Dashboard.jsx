import React, { useEffect, useState, useMemo } from "react";
import { useSelector, useDispatch } from "react-redux";
import { logout } from "../authSlice";
import { useNavigate } from "react-router-dom";
import { MapPin, MessageCircle, Plane, GitCompare, Compass,Camera,Bus, Calendar, Settings, LogOut, ChevronRight, Star, TrendingUp, Users, Globe,Sparkles,Book } from "lucide-react";

// ---------------- Helper: decode Google Profile Picture ----------------
function getGoogleProfilePic(user, token) {
  if (user && user.googleId && token) {
    try {
      const base64Url = token.split(".")[1];
      const base64 = base64Url.replace(/-/g, "+").replace(/_/g, "/");
      const jsonPayload = decodeURIComponent(
        atob(base64)
          .split("")
          .map((c) => "%" + ("00" + c.charCodeAt(0).toString(16)).slice(-2))
          .join("")
      );
      const payload = JSON.parse(jsonPayload);
      if (payload.picture) return payload.picture;
    } catch (e) {}
  }
  return null;
}

// ---------------- Helper: Haversine formula ----------------
function getDistance(lat1, lon1, lat2, lon2) {
  const R = 6371;
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLon = ((lon2 - lon1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLon / 2) ** 2;
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return +(R * c).toFixed(2);
}

// ---------------- Component ----------------
export default function Dashboard() {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const user = useSelector((state) => state.auth.user);
  const token = useSelector((state) => state.auth.token);

  const [location, setLocation] = useState(null);
  const [images, setImages] = useState([]);
  const [loading, setLoading] = useState(true);
  const [carouselIndex, setCarouselIndex] = useState(0);
  const [selectedLocation, setSelectedLocation] = useState(null);
  const [activeNav, setActiveNav] = useState("Home");
  const [cityInput, setCityInput] = useState("");

  // popular locations (persisted in localStorage)
  const [popularLocations, setPopularLocations] = useState(() => {
    const stored = localStorage.getItem("popularLocations");
    if (stored) return JSON.parse(stored);
    const defaults = [
      "New York","Paris","Tokyo","London","Sydney",
      "Rome","Dubai","Bangkok","Barcelona","Singapore",
      "Los Angeles","Istanbul","Moscow","Delhi","Hong Kong"
    ];
    localStorage.setItem("popularLocations", JSON.stringify(defaults));
    return defaults;
  });

  const profilePic = useMemo(() => {
    if (!user) return null;
    let pic = getGoogleProfilePic(user, token);
    if (!pic && user?.email) {
      pic = `https://api.dicebear.com/7.x/identicon/svg?seed=${encodeURIComponent(user.email)}`;
    }
    return pic;
  }, [user, token]);

  const handleLogout = () => {
    dispatch(logout());
    navigate("/");
  };

  const CARD_WIDTH = 260;
  const CARD_GAP = 16;

  // ---------------- Fetch Nearby Places ----------------
  const fetchNearbyPlaces = async (lat, lon) => {
    const API_KEY = "5ae2e3f221c38a28845f05b60fde1e3425197994a9a3eb8f96ccff2c"; // <-- Replace with your own OpenTripMap API key
    try {
      setLoading(true);
      const radiusUrl = `https://api.opentripmap.com/0.1/en/places/radius?radius=70000&lon=${lon}&lat=${lat}&rate=2&format=json&apikey=${API_KEY}`;
      const res = await fetch(radiusUrl);
      const data = await res.json();

      console.log("🔍 OpenTripMap response:", data);

      // ✅ OpenTripMap returns an array directly
      const list = Array.isArray(data) ? data : (data.features || []);
      if (!list.length) throw new Error("No nearby places found.");

      const detailed = await Promise.all(
        list.slice(0, 20).map(async (item) => {
          try {
            const detailRes = await fetch(
              `https://api.opentripmap.com/0.1/en/places/xid/${item.xid}?apikey=${API_KEY}`
            );
            const detail = await detailRes.json();
            const point = item.point || detail.point;
            const distance = point ? getDistance(lat, lon, point.lat, point.lon) : null;

            return {
              name: item.name || detail.name || "Unknown",
              preview:
                detail?.preview?.source ||
                `https://source.unsplash.com/800x600/?${encodeURIComponent(item.name || "travel")}`,
              distance,
            };
          } catch {
            return {
              name: item.name || "Unknown",
              preview: `https://source.unsplash.com/800x600/?${encodeURIComponent(item.name || "travel")}`,
              distance: null,
            };
          }
        })
      );

      setImages(detailed);
      setLocation((prev) => ({ ...prev, city: selectedLocation || "Nearby" }));
      setCarouselIndex(0);
    } catch (err) {
      console.error("Error fetching places:", err);
      setImages([
        { name: "Beach", preview: "https://source.unsplash.com/800x600/?beach", distance: null },
        { name: "Mountain", preview: "https://source.unsplash.com/800x600/?mountain", distance: null },
        { name: "City", preview: "https://source.unsplash.com/800x600/?city", distance: null },
      ]);
    } finally {
      setLoading(false);
    }
  };

  // ---------------- Handle City Search ----------------
  const handleLocationClick = async (loc) => {
    if (!loc) return;
    setSelectedLocation(loc);
    setLoading(true);
    try {
      const geoRes = await fetch(`https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(loc)}`);
      const geoData = await geoRes.json();
      if (geoData.length) {
        const { lat, lon } = geoData[0];
        setPopularLocations((prev) => {
          const normalized = prev.filter((p) => p.toLowerCase() !== loc.toLowerCase());
          const next = [loc, ...normalized].slice(0, 15);
          localStorage.setItem("popularLocations", JSON.stringify(next));
          return next;
        });
        fetchNearbyPlaces(parseFloat(lat), parseFloat(lon));
      } else {
        alert("Could not find coordinates for that city.");
        setLoading(false);
      }
    } catch (err) {
      console.error(err);
      setLoading(false);
    }
  };

  const handleAddCity = () => {
    const city = cityInput.trim();
    if (!city) return;
    setCityInput("");
    handleLocationClick(city);
  };

  // ---------------- Initial Geolocation ----------------
  useEffect(() => {
    let mounted = true;

    if (!navigator.geolocation) {
      console.warn("Geolocation not supported");
      setImages([
        { name: "Beach", preview: "https://source.unsplash.com/800x600/?beach", distance: null },
        { name: "Mountain", preview: "https://source.unsplash.com/800x600/?mountain", distance: null },
        { name: "City", preview: "https://source.unsplash.com/800x600/?city", distance: null },
      ]);
      setLoading(false);
      setLocation({ city: "Your area" });
      return;
    }

    navigator.geolocation.getCurrentPosition(
      ({ coords }) => {
        if (!mounted) return;
        const { latitude, longitude } = coords;
        console.log("📍 Geolocation:", latitude, longitude);
        setLocation({ lat: latitude, lon: longitude, city: "Nearby" });
        fetchNearbyPlaces(latitude, longitude);
      },
      (err) => {
        console.error("Geolocation error:", err);
        setImages([
          { name: "Beach", preview: "https://source.unsplash.com/800x600/?beach", distance: null },
          { name: "Mountain", preview: "https://source.unsplash.com/800x600/?mountain", distance: null },
          { name: "City", preview: "https://source.unsplash.com/800x600/?city", distance: null },
        ]);
        setLoading(false);
        setLocation({ city: "Your area" });
      }
    );

    return () => (mounted = false);
  }, []);

  // ---------------- Auto Carousel ----------------
  useEffect(() => {
    if (!images.length) return;
    const interval = setInterval(() => {
      setCarouselIndex((prev) => (images.length ? (prev + 1) % images.length : 0));
    }, 5000);
    return () => clearInterval(interval);
  }, [images]);

  // ---------------- Loading Screen ----------------
  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-screen bg-white">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-orange-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-xl font-semibold text-gray-700">Loading your adventure...</p>
        </div>
      </div>
    );
  }

  // ---------------- Main UI ----------------
  return (
    <div className="min-h-screen bg-white flex">
      {/* Sidebar */}
      <aside className="w-72 bg-gradient-to-b from-orange-50 to-orange-100 border-r border-orange-200 flex flex-col h-screen sticky top-0">
        <div className="p-6 border-b border-orange-200">
          <div className="flex items-center gap-4">
            <div className="relative">
              <img src={profilePic} alt="avatar" className="w-16 h-16 rounded-2xl border-3 border-orange-500 shadow-lg" />
              <div className="absolute -bottom-1 -right-1 w-5 h-5 bg-green-500 rounded-full border-2 border-white"></div>
            </div>
            <div>
              <h3 className="text-lg font-bold text-gray-900">{user?.name || user?.email?.split("@")[0]}</h3>
              <div className="flex items-center gap-1 text-sm text-gray-600">
                <MapPin className="w-3 h-3" />
                <span>{location?.city || "Your area"}</span>
              </div>
            </div>
          </div>
        </div>

        <nav className="flex-1 p-4 space-y-2">
          {[
            { name: "Home", icon: Sparkles },
            { name: "Explore", icon: MapPin },
            { name: "Trips", icon: Plane },
            { name: "Quiz", icon: TrendingUp },
            { name: "Create", icon: Camera },
          ].map((item) => (
            <button
              key={item.name}
              onClick={() => setActiveNav(item.name)}
              className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-300 ${
                activeNav === item.name
                  ? "bg-orange-500 text-white shadow-lg shadow-orange-500/30"
                  : "text-gray-700 hover:bg-white hover:shadow-md"
              }`}
            >
              <item.icon className={`w-5 h-5 ${activeNav === item.name ? "text-white" : "text-orange-500"}`} />
              <span className="font-semibold flex-1 text-left">{item.name}</span>
              <ChevronRight
                className={`w-4 h-4 transition-transform ${activeNav === item.name ? "translate-x-1" : ""}`}
              />
            </button>
          ))}
        </nav>

        <div className="p-4 border-t border-orange-200">
          <button
            onClick={handleLogout}
            className="w-full flex items-center gap-3 px-4 py-3 rounded-xl bg-red-50 text-red-600 hover:bg-red-100 transition-all duration-300 font-semibold"
          >
            <LogOut className="w-5 h-5" />
            <span>Logout</span>
          </button>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 overflow-y-auto">
        <div className="max-w-7xl mx-auto px-8 py-10 space-y-12">
          {/* Header */}
          <div className="space-y-2">
            <h1 className="text-4xl font-bold text-gray-900">
              Ready for your next adventure, {user?.name?.split(" ")[0] || "Explorer"}?
            </h1>
            <p className="text-lg text-gray-600">
              The world is waiting - let's discover something extraordinary today
            </p>
          </div>

          {/* Trending Locations */}
          <section className="space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-xl font-bold text-gray-900">Trending Destinations</h2>
              <button className="text-orange-500 font-semibold hover:text-orange-600 flex items-center gap-1 text-sm">
                View all <ChevronRight className="w-4 h-4" />
              </button>
            </div>

            <div className="flex gap-3 items-center">
              <input
                value={cityInput}
                onChange={(e) => setCityInput(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && handleAddCity()}
                placeholder="Type a city (e.g. Jaipur) and press Enter"
                className="flex-1 px-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-orange-300"
              />
              <button
                onClick={handleAddCity}
                className="px-4 py-2 rounded-lg bg-orange-500 text-white font-semibold hover:bg-orange-600"
              >
                Search
              </button>
            </div>

            <div className="flex flex-wrap gap-2">
              {popularLocations.map((loc, idx) => (
                <button
                  key={idx}
                  className="bg-gradient-to-r from-orange-400 to-orange-500 text-white font-medium px-4 py-2 text-sm rounded-full shadow-md hover:scale-105 transition-all"
                  onClick={() => handleLocationClick(loc)}
                >
                  {loc}
                </button>
              ))}
            </div>
          </section>

          {/* Carousel */}
          <section className="space-y-5">
            <h2 className="text-2xl font-bold text-gray-900">Nearby Places to Explore</h2>
            <div className="relative overflow-hidden rounded-2xl shadow-2xl bg-gray-100">
              <div
                className="flex items-stretch transition-transform duration-700 ease-in-out p-4"
                style={{ transform: `translateX(-${carouselIndex * (CARD_WIDTH + CARD_GAP)}px)` }}
              >
                {images.map(({ preview, name, distance }, i) => (
                  <div key={i} style={{ flex: `0 0 ${CARD_WIDTH}px`, marginRight: `${CARD_GAP}px` }}>
                    <div className="relative rounded-xl overflow-hidden shadow-lg h-80 group cursor-pointer">
                      <img
                        src={preview}
                        alt={name}
                        className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
                      />
                      <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/30 to-transparent"></div>
                      <div className="absolute bottom-0 left-0 right-0 p-4 text-white">
                        <h3 className="font-bold text-lg mb-1 truncate">{name}</h3>
                        {distance && (
                          <div className="flex items-center gap-1 text-sm">
                            <MapPin className="w-4 h-4" />
                            <span>{distance} km away</span>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              {/* Dots */}
              <div className="absolute bottom-4 left-1/2 transform -translate-x-1/2 flex gap-2">
                {images.map((_, idx) => (
                  <button
                    key={idx}
                    onClick={() => setCarouselIndex(idx)}
                    className={`w-2 h-2 rounded-full transition-all duration-300 ${
                      carouselIndex === idx ? "bg-white w-8" : "bg-white/50 hover:bg-white/75"
                    }`}
                  />
                ))}
              </div>
            </div>
          </section>

          {/* Action Cards */}
          <section className="space-y-5">
            <h2 className="text-2xl font-bold text-gray-900">Get Started</h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {[
                {
                  icon: Sparkles,
                  title: "Travel Quiz",
                  desc: "Tell us your preferences and we'll craft personalized trips just for you.",
                  btn: "Start Quiz",
                  color: "from-purple-400 to-purple-600",
                  route: "/quiz",
                },
                {
                  icon: Plane,
                  title: "Create Trip",
                  desc: "Build, save and share your custom trip plans with friends and family.",
                  btn: "Create Trip",
                  color: "from-orange-400 to-orange-600",
                  route: "/chat",
                },
                {
                  icon: Bus,
                  title: "Transport",
                  desc: "Find flights, trains, and buses between any two cities with real-time prices.",
                  btn: "Find Transport",
                  color: "from-green-400 to-green-600",
                  route: "/transport",
                },
                {
                  icon: Camera,
                  title: "Explore More",
                  desc: "Discover curated guides, hidden gems and authentic local experiences.",
                  btn: "Explore Now",
                  color: "from-blue-400 to-blue-600",
                  route: "/explore",
                },
                 {
                  icon: Book,
                  title: "Compare Destinations",
                  desc: "Compare Itinerary of any two destinations and choose most budget friendly. ",
                  btn: "Compare Itinerary",
                  color: "from-yellow-400 to-yellow-600",
                  route: "/compare",
                },
              ].map((card, idx) => (
                <div
                  key={idx}
                  className="bg-white rounded-2xl p-6 shadow-lg hover:shadow-2xl transition-all border border-gray-100"
                >
                  <div className="flex flex-col h-full justify-between">
                    <div>
                      <div
                        className={`w-14 h-14 rounded-xl bg-gradient-to-r ${card.color} flex items-center justify-center mb-4 shadow-lg`}
                      >
                        <card.icon className="w-7 h-7 text-white" />
                      </div>
                      <h3 className="text-xl font-bold text-gray-900 mb-2">{card.title}</h3>
                      <p className="text-gray-600 mb-6">{card.desc}</p>
                    </div>
                    <button
                      onClick={() => navigate(card.route)}
                      className={`w-full py-3 rounded-xl bg-gradient-to-r ${card.color} text-white font-semibold hover:opacity-90 transition-all`}
                    >
                      {card.btn}
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </section>
        </div>
      </main>
    </div>
  );
}
