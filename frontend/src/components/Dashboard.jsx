import React, { useMemo } from "react";
import { useSelector, useDispatch } from "react-redux";
import { logout } from "../authSlice";
import { useNavigate } from "react-router";
import {
  MapPin,
  Calendar,
  Star,
  Map,
  Sparkles,
  Plane,
  Camera,
  Search,
  LogOut,
} from "lucide-react";

// Helper to decode Google profile picture from JWT
function getGoogleProfilePic(user) {
  if (user && user.googleId && user.jwtToken) {
    try {
      const base64Url = user.jwtToken.split(".")[1];
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

export default function Dashboard() {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const user = useSelector((state) => state.auth.user);

  // Profile pic logic (Google first, fallback Dicebear)
  const profilePic = useMemo(() => {
    if (!user) return null;
    let pic = getGoogleProfilePic(user);
    if (!pic && user.email) {
      pic = `https://api.dicebear.com/7.x/identicon/svg?seed=${encodeURIComponent(
        user.email
      )}`;
    }
    return pic;
  }, [user]);

  const handleLogout = () => {
    dispatch(logout());
    navigate("/");
  };

  // Example data (same as your Travelwise UI)
  const attractions = [
    {
      name: "Santorini Coast",
      type: "Attraction",
      image:
        "https://images.unsplash.com/photo-1507525428034-b723cf961d3e?w=400&h=300&fit=crop",
      color: "from-slate-900/60 to-slate-800/80",
    },
    {
      name: "Artisan Café",
      type: "Cafe",
      image:
        "https://images.unsplash.com/photo-1554118811-1e0d58224f24?w=400&h=300&fit=crop",
      color: "from-slate-900/60 to-slate-800/80",
    },
    {
      name: "Grand Resort",
      type: "Hotel",
      image:
        "https://images.unsplash.com/photo-1566073771259-6a8506099945?w=400&h=300&fit=crop",
      color: "from-slate-900/60 to-slate-800/80",
    },
  ];

  const getStarted = [
    {
      title: "Take our travel quiz",
      icon: <Sparkles className="w-8 h-8" />,
      gradient: "from-slate-700 to-slate-800",
    },
    {
      title: "Create a trip",
      icon: <Plane className="w-8 h-8" />,
      gradient: "from-slate-700 to-slate-800",
    },
    {
      title: "Creator tools",
      icon: <Camera className="w-8 h-8" />,
      gradient: "from-slate-700 to-slate-800",
    },
  ];

  const inspired = [
    {
      title: "A Culinary Journey Through Tokyo",
      image:
        "https://images.unsplash.com/photo-1555396273-367ea4eb4db5?w=400&h=300&fit=crop",
    },
    {
      title: "Exploring Mediterranean Paradise",
      image:
        "https://images.unsplash.com/photo-1476514525535-07fb3b4ae5f1?w=400&h=300&fit=crop",
    },
    {
      title: "7 Days in Southeast Asia",
      image:
        "https://images.unsplash.com/photo-1537996194471-e657df975ab4?w=400&h=300&fit=crop",
    },
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-gray-50 to-slate-100">
      {/* Background */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none opacity-30">
        <div className="absolute top-0 right-0 w-96 h-96 bg-blue-100 rounded-full mix-blend-multiply filter blur-3xl"></div>
        <div className="absolute bottom-0 left-0 w-96 h-96 bg-slate-100 rounded-full mix-blend-multiply filter blur-3xl"></div>
      </div>

      {/* Header */}
      <header className="relative z-10 border-b border-slate-200 bg-white/80 backdrop-blur-lg shadow-sm">
        <div className="max-w-7xl mx-auto px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-8">
            <h1 className="text-2xl font-semibold text-slate-900 tracking-tight">
              Travelwise
            </h1>
          </div>
          <div className="flex items-center gap-4">
            {profilePic && (
              <img
                src={profilePic}
                alt="Profile"
                className="w-10 h-10 rounded-full border-2 border-slate-200 shadow-sm object-cover bg-white"
              />
            )}
            {user?.email && (
              <span className="text-slate-700 font-medium hidden md:block">
                {user.email}
              </span>
            )}
            <button
              onClick={handleLogout}
              className="px-4 py-2 bg-slate-900 text-white rounded-lg hover:bg-slate-800 transition-all shadow-sm hover:shadow-md flex items-center gap-2"
            >
              <LogOut className="w-4 h-4" />
              Logout
            </button>
          </div>
        </div>
      </header>

      {/* Content */}
      <div className="flex max-w-7xl mx-auto relative z-10">
        {/* Sidebar */}
        <aside className="w-64 min-h-screen border-r border-slate-200 bg-white/60 backdrop-blur-lg p-6">
          <nav className="space-y-1">
            {[
              { icon: <Sparkles className="w-5 h-5" />, label: "Chats", badge: "1" },
              { icon: <MapPin className="w-5 h-5" />, label: "Explore" },
              { icon: <Star className="w-5 h-5" />, label: "Saved" },
              { icon: <Map className="w-5 h-5" />, label: "Trips" },
              { icon: <Calendar className="w-5 h-5" />, label: "Updates" },
              { icon: <Plane className="w-5 h-5" />, label: "Inspiration" },
            ].map((item, i) => (
              <button
                key={i}
                className="w-full flex items-center gap-3 px-4 py-3 rounded-lg text-slate-700 hover:bg-slate-100 transition-all group"
              >
                <span className="text-slate-600 group-hover:text-slate-900 transition-colors">
                  {item.icon}
                </span>
                <span className="group-hover:text-slate-900 transition-colors font-medium">
                  {item.label}
                </span>
                {item.badge && (
                  <span className="ml-auto bg-slate-900 text-white text-xs px-2 py-1 rounded-full font-medium">
                    {item.badge}
                  </span>
                )}
              </button>
            ))}
          </nav>
        </aside>

        {/* Main */}
        <main className="flex-1 p-8 bg-gradient-to-b from-transparent to-slate-50/50">
          {/* Hero */}
          <div className="text-center mb-12">
            <h2 className="text-5xl font-bold mb-4 text-slate-900 tracking-tight">
              Where to today?
            </h2>
            <p className="text-xl text-slate-600 mb-2">
              Hey {user?.email?.split("@")[0] || "traveler"}, ready to plan your journey?
            </p>
          </div>

          {/* Attractions */}
          <div className="mb-12">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-2xl font-semibold text-slate-900 flex items-center gap-2">
                <span>For you in</span>
                <MapPin className="w-6 h-6 text-slate-600" />
                <span className="text-slate-700">Adityapur</span>
              </h3>
            </div>
            <div className="grid grid-cols-3 gap-6">
              {attractions.map((place, i) => (
                <div
                  key={i}
                  className="group relative h-64 rounded-xl overflow-hidden cursor-pointer transform hover:scale-[1.02] transition-all duration-300 shadow-md hover:shadow-xl"
                >
                  <img
                    src={place.image}
                    alt={place.name}
                    className="w-full h-full object-cover"
                  />
                  <div
                    className={`absolute inset-0 bg-gradient-to-t ${place.color}`}
                  ></div>
                  <div className="absolute inset-0 flex flex-col justify-end p-6">
                    <h4 className="text-2xl font-semibold text-white mb-2">
                      {place.name}
                    </h4>
                    <span className="text-white/90 flex items-center gap-2 font-medium">
                      <Star className="w-4 h-4 fill-current" />
                      {place.type}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Get Started */}
          <div className="mb-12">
            <h3 className="text-2xl font-semibold text-slate-900 mb-6">
              Get started
            </h3>
            <div className="grid grid-cols-3 gap-6">
              {getStarted.map((item, i) => (
                <div
                  key={i}
                  className="group relative h-48 rounded-xl bg-white border border-slate-200 overflow-hidden cursor-pointer transform hover:scale-[1.02] transition-all duration-300 shadow-sm hover:shadow-md"
                >
                  <div className="relative h-full flex flex-col items-center justify-center text-slate-700">
                    <div className="mb-4">{item.icon}</div>
                    <h4 className="text-lg font-semibold text-slate-900">
                      {item.title}
                    </h4>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Get Inspired */}
          <div className="mb-12">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-2xl font-semibold text-slate-900">
                Get inspired
              </h3>
            </div>
            <div className="grid grid-cols-3 gap-6">
              {inspired.map((item, i) => (
                <div
                  key={i}
                  className="group relative h-64 rounded-xl overflow-hidden cursor-pointer transform hover:scale-[1.02] transition-all duration-300 shadow-md hover:shadow-xl"
                >
                  <img
                    src={item.image}
                    alt={item.title}
                    className="w-full h-full object-cover"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-slate-900/80 via-slate-900/30 to-transparent"></div>
                  <div className="absolute inset-0 flex flex-col justify-end p-6">
                    <h4 className="text-xl font-semibold text-white">
                      {item.title}
                    </h4>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Chat Input */}
          <div className="max-w-3xl mx-auto">
            <div className="relative">
              <input
                type="text"
                placeholder="Ask anything..."
                className="w-full px-6 py-4 bg-white border-2 border-slate-200 rounded-xl text-slate-900 placeholder-slate-400 focus:outline-none focus:border-slate-400 transition-all shadow-sm focus:shadow-md"
              />
              <button className="absolute right-3 top-1/2 -translate-y-1/2 w-10 h-10 bg-slate-900 rounded-lg flex items-center justify-center hover:bg-slate-800 transition-all shadow-sm">
                <Search className="w-5 h-5 text-white" />
              </button>
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}
