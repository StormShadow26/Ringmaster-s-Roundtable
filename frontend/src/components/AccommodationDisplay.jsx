import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Building, 
  Home, 
  Users, 
  Clock, 
  DollarSign, 
  MapPin, 
  Star,
  Wifi,
  Car,
  Coffee,
  Utensils,
  Bed,
  Bath,
  ExternalLink,
  Filter,
  SortAsc,
  Loader2,
  CheckCircle,
  Calendar
} from 'lucide-react';

const AccommodationDisplay = ({ 
  accommodationData, 
  loading, 
  destination, 
  onBookingClick 
}) => {
  const [activeTab, setActiveTab] = useState('hotels');
  const [sortBy, setSortBy] = useState('price');
  const [filterBy, setFilterBy] = useState('all');

  // Tab configuration
  const tabs = [
    {
      key: 'hotels',
      label: 'Hotels',
      icon: Building,
      color: 'blue',
      count: accommodationData?.hotels?.length || 0,
    },
    {
      key: 'hostels',
      label: 'Hostels',
      icon: Users,
      color: 'green',
      count: accommodationData?.hostels?.length || 0,
    },
    {
      key: 'apartments',
      label: 'Apartments',
      icon: Home,
      color: 'purple',
      count: accommodationData?.apartments?.length || 0,
    }
  ];

  // Get and process data for current tab
  const rawData = accommodationData?.[activeTab] || [];
  
  // Apply filtering
  const filteredData = rawData.filter(item => {
    if (filterBy === 'all') return true;
    if (filterBy === 'budget' && item.price.perNight <= 80) return true;
    if (filterBy === 'mid-range' && item.price.perNight > 80 && item.price.perNight <= 150) return true;
    if (filterBy === 'luxury' && item.price.perNight > 150) return true;
    return false;
  });

  // Apply sorting
  const sortedData = [...filteredData].sort((a, b) => {
    switch (sortBy) {
      case 'price':
        return a.price.perNight - b.price.perNight;
      case 'rating':
        return b.rating - a.rating;
      case 'name':
        return a.name.localeCompare(b.name);
      default:
        return 0;
    }
  });

  // Get tab color classes
  const getTabColorClasses = (color, isActive) => {
    const colors = {
      blue: isActive ? 'bg-blue-500 text-white' : 'text-blue-600 hover:bg-blue-50',
      green: isActive ? 'bg-green-500 text-white' : 'text-green-600 hover:bg-green-50',
      purple: isActive ? 'bg-purple-500 text-white' : 'text-purple-600 hover:bg-purple-50'
    };
    return colors[color] || colors.blue;
  };

  // Render accommodation amenities
  const renderAmenities = (amenities) => {
    const iconMap = {
      'Free WiFi': Wifi,
      'Swimming Pool': '🏊',
      'Fitness Center': '💪',
      'Restaurant': Utensils,
      'Bar/Lounge': Coffee,
      'Parking': Car,
      'Full Kitchen': Utensils,
      'Shared Kitchen': '👥',
      'Private Entrance': '🚪'
    };

    return amenities?.slice(0, 4).map((amenity, index) => {
      const Icon = iconMap[amenity];
      return (
        <div key={index} className="flex items-center space-x-1 text-xs text-gray-600">
          {typeof Icon === 'string' ? (
            <span className="text-sm">{Icon}</span>
          ) : Icon ? (
            <Icon className="w-3 h-3" />
          ) : (
            <CheckCircle className="w-3 h-3" />
          )}
          <span>{amenity}</span>
        </div>
      );
    });
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="text-center">
          <Loader2 className="w-8 h-8 animate-spin text-blue-500 mx-auto mb-4" />
          <p className="text-gray-600 font-medium">Searching accommodations...</p>
        </div>
      </div>
    );
  }

  if (!accommodationData) {
    return (
      <div className="text-center py-12">
        <Building className="w-16 h-16 text-gray-300 mx-auto mb-4" />
        <p className="text-gray-500 font-medium">No accommodation data available</p>
      </div>
    );
  }

  return (
    <div className="w-full">
      {/* Tabs */}
      <div className="flex space-x-1 mb-6 p-1 bg-gray-100 rounded-2xl">
        {tabs.map((tab) => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.key;
          
          return (
            <button
              key={tab.key}
              onClick={() => setActiveTab(tab.key)}
              className={`flex-1 flex items-center justify-center space-x-2 py-3 px-4 rounded-xl font-semibold transition-all duration-200 ${getTabColorClasses(tab.color, isActive)}`}
            >
              <Icon className="w-4 h-4" />
              <span>{tab.label}</span>
              <span className="bg-white/20 px-2 py-1 rounded-full text-xs">
                {tab.count}
              </span>
            </button>
          );
        })}
      </div>

      {/* Controls */}
      <div className="flex flex-col sm:flex-row gap-4 mb-6">
        {/* Sort */}
        <div className="flex items-center space-x-2">
          <SortAsc className="w-4 h-4 text-gray-500" />
          <select
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value)}
            className="border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          >
            <option value="price">Price (Low to High)</option>
            <option value="rating">Rating (High to Low)</option>
            <option value="name">Name (A-Z)</option>
          </select>
        </div>

        {/* Filter */}
        <div className="flex items-center space-x-2">
          <Filter className="w-4 h-4 text-gray-500" />
          <select
            value={filterBy}
            onChange={(e) => setFilterBy(e.target.value)}
            className="border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          >
            <option value="all">All Prices</option>
            <option value="budget">Budget ($0-80)</option>
            <option value="mid-range">Mid-range ($80-150)</option>
            <option value="luxury">Luxury ($150+)</option>
          </select>
        </div>

        {/* Results count */}
        <div className="flex items-center text-sm text-gray-600 sm:ml-auto">
          <span>{sortedData.length} accommodations found</span>
        </div>
      </div>

      {/* Accommodation Cards */}
      <div className="space-y-4">
        <AnimatePresence mode="wait">
          {sortedData.map((accommodation, index) => (
            <motion.div
              key={accommodation.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              transition={{ duration: 0.3, delay: index * 0.05 }}
              className="bg-white border border-gray-200 rounded-2xl overflow-hidden hover:shadow-lg transition-all duration-300"
            >
              <div className="flex flex-col md:flex-row">
                {/* Image */}
                <div className="md:w-1/3 h-48 md:h-auto bg-gray-200 relative">
                  <img
                    src={accommodation.images?.[0] || '/api/placeholder/400/300'}
                    alt={accommodation.name}
                    className="w-full h-full object-cover"
                    loading="lazy"
                  />
                  {accommodation.stars && (
                    <div className="absolute top-3 left-3 bg-white/90 backdrop-blur-sm px-2 py-1 rounded-lg">
                      <div className="flex items-center space-x-1">
                        {[...Array(accommodation.stars)].map((_, i) => (
                          <Star key={i} className="w-3 h-3 fill-yellow-400 text-yellow-400" />
                        ))}
                      </div>
                    </div>
                  )}
                </div>

                {/* Content */}
                <div className="md:w-2/3 p-6 flex flex-col">
                  <div className="flex-1">
                    {/* Header */}
                    <div className="flex items-start justify-between mb-3">
                      <div>
                        <h3 className="text-lg font-bold text-gray-900 mb-1">
                          {accommodation.name}
                        </h3>
                        <div className="flex items-center space-x-4 text-sm text-gray-600">
                          <div className="flex items-center space-x-1">
                            <MapPin className="w-4 h-4" />
                            <span>{accommodation.address}</span>
                          </div>
                        </div>
                      </div>
                      
                      {/* Rating */}
                      <div className="text-right">
                        <div className="flex items-center space-x-1 mb-1">
                          <Star className="w-4 h-4 fill-yellow-400 text-yellow-400" />
                          <span className="font-semibold text-gray-900">{accommodation.rating}</span>
                          <span className="text-sm text-gray-600">({accommodation.reviewCount})</span>
                        </div>
                        <div className="text-xs text-gray-500 capitalize">
                          {accommodation.type}
                        </div>
                      </div>
                    </div>

                    {/* Room details for apartments */}
                    {accommodation.bedrooms && (
                      <div className="flex items-center space-x-4 text-sm text-gray-600 mb-3">
                        <div className="flex items-center space-x-1">
                          <Bed className="w-4 h-4" />
                          <span>{accommodation.bedrooms} bed{accommodation.bedrooms > 1 ? 's' : ''}</span>
                        </div>
                        <div className="flex items-center space-x-1">
                          <Bath className="w-4 h-4" />
                          <span>{accommodation.bathrooms} bath{accommodation.bathrooms > 1 ? 's' : ''}</span>
                        </div>
                        {accommodation.roomType && (
                          <span className="text-blue-600 font-medium">{accommodation.roomType}</span>
                        )}
                      </div>
                    )}

                    {/* Amenities */}
                    <div className="grid grid-cols-2 gap-2 mb-4">
                      {renderAmenities(accommodation.amenities)}
                    </div>

                    {/* Cancellation policy */}
                    <div className="text-xs text-green-600 mb-4">
                      {accommodation.cancellation}
                    </div>
                  </div>

                  {/* Footer */}
                  <div className="flex items-end justify-between">
                    <div className="text-right">
                      <div className="text-2xl font-bold text-gray-900">
                        ${accommodation.price.perNight}
                        <span className="text-sm font-normal text-gray-600">/night</span>
                      </div>
                      <div className="text-sm text-gray-600">
                        ${accommodation.price.total} total ({accommodation.price.nights} nights)
                      </div>
                      <div className="text-xs text-gray-500">
                        +${accommodation.price.taxes} taxes
                      </div>
                    </div>

                    <button
                      onClick={() => onBookingClick(accommodation)}
                      className="bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 text-white font-semibold py-2 px-6 rounded-xl transition-all duration-200 transform hover:scale-105 flex items-center space-x-2"
                    >
                      <span>Book Now</span>
                      <ExternalLink className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              </div>
            </motion.div>
          ))}
        </AnimatePresence>

        {/* No results */}
        {sortedData.length === 0 && (
          <div className="text-center py-12">
            <Building className="w-16 h-16 text-gray-300 mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-gray-700 mb-2">No accommodations found</h3>
            <p className="text-gray-500">Try adjusting your filters or search criteria.</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default AccommodationDisplay;