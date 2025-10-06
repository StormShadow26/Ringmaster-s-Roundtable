// src/components/SidebarNav.jsx
import React from "react";
import { Sparkles, MapPin, Airplane, TrendingUp, PlusCircle, ChevronRight } from "lucide-react";

const SidebarNav = ({ activeNav, setActiveNav }) => {
  const navItems = [
    { name: "Home", icon: Sparkles },
    { name: "Explore", icon: MapPin },
    { name: "Trips", icon: Airplane },
    { name: "Quiz", icon: TrendingUp },
    { name: "Create Trip", icon: PlusCircle },
  ];

  return (
    <nav className="flex-1 p-4 space-y-2">
      {navItems.map((item) => (
        <button
          key={item.name}
          onClick={() => setActiveNav(item.name)}
          className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-300 group ${
            activeNav === item.name
              ? "bg-orange-500 text-white shadow-lg shadow-orange-500/30"
              : "text-gray-700 hover:bg-white hover:shadow-md"
          }`}
        >
          <item.icon
            className={`w-5 h-5 transition-colors ${
              activeNav === item.name ? "text-white" : "text-orange-500"
            }`}
          />
          <span className="font-semibold flex-1 text-left">{item.name}</span>
          <ChevronRight
            className={`w-4 h-4 transition-transform ${
              activeNav === item.name ? "translate-x-1" : ""
            }`}
          />
        </button>
      ))}
    </nav>
  );
};

export default SidebarNav;
