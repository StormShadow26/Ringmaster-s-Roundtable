import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Plane, 
  Train, 
  Bus, 
  Clock, 
  DollarSign, 
  MapPin, 
  Calendar, 
  Users, 
  Wifi, 
  Coffee, 
  Zap,
  Star,
  ArrowRight,
  Filter,
  SortAsc,
  Loader2,
  ExternalLink,
  CheckCircle
} from 'lucide-react';

const TravelOptionsDisplay = ({ 
  travelData, 
  loading, 
  origin, 
  destination, 
  onBookingClick 
}) => {
  const [activeTab, setActiveTab] = useState('flights');
  const [sortBy, setSortBy] = useState('price');
  const [showFilters, setShowFilters] = useState(false);
  const [filters, setFilters] = useState({
    maxPrice: 1000,
    departureTime: 'any',
    stops: 'any',
    class: 'any'
  });

  const tabs = [
    { 
      id: 'flights', 
      label: 'Flights', 
      icon: Plane, 
      count: travelData?.flights?.length || 0,
      color: 'from-blue-500 to-blue-600'
    },
    { 
      id: 'trains', 
      label: 'Trains', 
      icon: Train, 
      count: travelData?.trains?.length || 0,
      color: 'from-green-500 to-green-600'
    },
    { 
      id: 'buses', 
      label: 'Buses', 
      icon: Bus, 
      count: travelData?.buses?.length || 0,
      color: 'from-orange-500 to-orange-600'
    }
  ];

  // Sort data based on selected criteria
  const sortData = (data, sortBy) => {
    if (!data) return [];
    
    return [...data].sort((a, b) => {
      switch (sortBy) {
        case 'price':
          return parseFloat(a.price) - parseFloat(b.price);
        case 'duration':
          return a.duration.localeCompare(b.duration);
        case 'departure':
          return new Date(a.departure.time) - new Date(b.departure.time);
        default:
          return 0;
      }
    });
  };

  // Filter data based on user preferences
  const filterData = (data) => {
    if (!data) return [];
    
    return data.filter(item => {
      const price = parseFloat(item.price);
      const departureHour = new Date(item.departure.time).getHours();
      
      if (price > filters.maxPrice) return false;
      
      if (filters.departureTime !== 'any') {
        if (filters.departureTime === 'morning' && (departureHour < 6 || departureHour >= 12)) return false;
        if (filters.departureTime === 'afternoon' && (departureHour < 12 || departureHour >= 18)) return false;
        if (filters.departureTime === 'evening' && (departureHour < 18 || departureHour >= 24)) return false;
      }
      
      if (filters.stops !== 'any' && item.stops !== undefined) {
        if (filters.stops === 'direct' && item.stops > 0) return false;
        if (filters.stops === 'one-stop' && item.stops !== 1) return false;
      }
      
      if (filters.class !== 'any') {
        const itemClass = item.bookingClass || item.class || 'economy';
        if (!itemClass.toLowerCase().includes(filters.class.toLowerCase())) return false;
      }
      
      return true;
    });
  };

  const getCurrentData = () => {
    const rawData = travelData?.[activeTab] || [];
    const filteredData = filterData(rawData);
    return sortData(filteredData, sortBy);
  };

  const formatTime = (dateString) => {
    return new Date(dateString).toLocaleTimeString([], { 
      hour: '2-digit', 
      minute: '2-digit' 
    });
  };

  const formatDuration = (duration) => {
    return duration.replace('h', ' hr ').replace('m', ' min');
  };

  const getProviderLogo = (provider, type) => {
    // Mock logos - in production, use actual airline/train/bus logos
    const logos = {
      flights: '✈️',
      trains: '🚆',
      buses: '🚌'
    };
    return logos[type] || '🚗';
  };

  if (loading) {
    return (
      <div className="bg-white rounded-2xl shadow-xl p-8">
        <div className="flex flex-col items-center justify-center py-12">
          <Loader2 className="w-12 h-12 animate-spin text-orange-500 mb-4" />
          <h3 className="text-xl font-bold text-gray-800 mb-2">Searching Travel Options</h3>
          <p className="text-gray-600 text-center">
            Finding the best flights, trains, and buses from {origin} to {destination}...
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-2xl shadow-xl overflow-hidden">
      {/* Header */}
      <div className="bg-gradient-to-r from-slate-800 to-slate-900 text-white p-6">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-2xl font-bold mb-2">Travel Options</h3>
            <div className="flex items-center space-x-4 text-slate-300">
              <div className="flex items-center space-x-1">
                <MapPin className="w-4 h-4" />
                <span>{origin}</span>
              </div>
              <ArrowRight className="w-4 h-4" />
              <div className="flex items-center space-x-1">
                <MapPin className="w-4 h-4" />
                <span>{destination}</span>
              </div>
            </div>
          </div>
          
          <div className="flex items-center space-x-2">
            <button
              onClick={() => setShowFilters(!showFilters)}
              className="flex items-center space-x-1 px-3 py-2 bg-slate-700 hover:bg-slate-600 rounded-lg transition-colors"
            >
              <Filter className="w-4 h-4" />
              <span>Filters</span>
            </button>
            
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value)}
              className="px-3 py-2 bg-slate-700 text-white rounded-lg border-slate-600 focus:border-orange-500 focus:ring-orange-500"
            >
              <option value="price">Sort by Price</option>
              <option value="duration">Sort by Duration</option>
              <option value="departure">Sort by Departure</option>
            </select>
          </div>
        </div>
      </div>

      {/* Filters Panel */}
      <AnimatePresence>
        {showFilters && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            className="bg-slate-50 border-b border-slate-200 p-4"
          >
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Max Price</label>
                <input
                  type="range"
                  min="0"
                  max="2000"
                  step="50"
                  value={filters.maxPrice}
                  onChange={(e) => setFilters({...filters, maxPrice: parseInt(e.target.value)})}
                  className="w-full"
                />
                <span className="text-sm text-gray-500">${filters.maxPrice}</span>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Departure Time</label>
                <select
                  value={filters.departureTime}
                  onChange={(e) => setFilters({...filters, departureTime: e.target.value})}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-orange-500 focus:border-orange-500"
                >
                  <option value="any">Any Time</option>
                  <option value="morning">Morning (6AM-12PM)</option>
                  <option value="afternoon">Afternoon (12PM-6PM)</option>
                  <option value="evening">Evening (6PM-12AM)</option>
                </select>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Stops</label>
                <select
                  value={filters.stops}
                  onChange={(e) => setFilters({...filters, stops: e.target.value})}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-orange-500 focus:border-orange-500"
                >
                  <option value="any">Any</option>
                  <option value="direct">Direct Only</option>
                  <option value="one-stop">1 Stop Max</option>
                </select>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Class</label>
                <select
                  value={filters.class}
                  onChange={(e) => setFilters({...filters, class: e.target.value})}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-orange-500 focus:border-orange-500"
                >
                  <option value="any">Any Class</option>
                  <option value="economy">Economy</option>
                  <option value="business">Business</option>
                  <option value="first">First Class</option>
                </select>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Tabs */}
      <div className="flex border-b border-gray-200">
        {tabs.map((tab) => {
          const IconComponent = tab.icon;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex-1 px-6 py-4 text-center font-semibold transition-all relative ${
                activeTab === tab.id
                  ? 'text-orange-600 bg-orange-50 border-b-2 border-orange-600'
                  : 'text-gray-600 hover:text-gray-800 hover:bg-gray-50'
              }`}
            >
              <div className="flex items-center justify-center space-x-2">
                <IconComponent className="w-5 h-5" />
                <span>{tab.label}</span>
                {tab.count > 0 && (
                  <span className={`px-2 py-1 rounded-full text-xs ${
                    activeTab === tab.id 
                      ? 'bg-orange-100 text-orange-600' 
                      : 'bg-gray-100 text-gray-600'
                  }`}>
                    {tab.count}
                  </span>
                )}
              </div>
            </button>
          );
        })}
      </div>

      {/* Content */}
      <div className="p-6">
        <AnimatePresence mode="wait">
          <motion.div
            key={activeTab}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            transition={{ duration: 0.2 }}
          >
            {getCurrentData().length === 0 ? (
              <div className="text-center py-12">
                <div className="text-6xl mb-4">
                  {activeTab === 'flights' && '✈️'}
                  {activeTab === 'trains' && '🚆'}  
                  {activeTab === 'buses' && '🚌'}
                </div>
                <h4 className="text-xl font-semibold text-gray-800 mb-2">
                  No {activeTab} found
                </h4>
                <p className="text-gray-600">
                  Try adjusting your filters or search criteria
                </p>
              </div>
            ) : (
              <div className="space-y-4">
                {getCurrentData().map((item, index) => (
                  <motion.div
                    key={item.id}
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ delay: index * 0.1 }}
                    className="border border-gray-200 rounded-xl p-6 hover:shadow-lg transition-shadow cursor-pointer group"
                    onClick={() => onBookingClick && onBookingClick(item)}
                  >
                    <div className="flex items-center justify-between">
                      {/* Left side - Provider & Route */}
                      <div className="flex items-center space-x-4 flex-1">
                        <div className="text-3xl">
                          {getProviderLogo(item.provider, activeTab)}
                        </div>
                        
                        <div className="flex-1">
                          <div className="flex items-center space-x-2 mb-2">
                            <span className="font-bold text-lg text-gray-800">
                              {item.airlineName || item.operatorName || item.provider}
                            </span>
                            <span className="text-gray-500">
                              {item.flightNumber || item.trainNumber || item.busNumber}
                            </span>
                          </div>
                          
                          {/* Route Information */}
                          <div className="flex items-center space-x-4 text-sm">
                            <div className="text-center">
                              <div className="font-semibold text-gray-800">
                                {formatTime(item.departure.time)}
                              </div>
                              <div className="text-gray-500">
                                {item.departure.airport || item.departure.station}
                              </div>
                            </div>
                            
                            <div className="flex items-center space-x-2 flex-1">
                              <div className="w-2 h-2 rounded-full bg-gray-300"></div>
                              <div className="flex-1 h-px bg-gray-300 relative">
                                {item.stops > 0 && (
                                  <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-2 h-2 rounded-full bg-orange-400"></div>
                                )}
                              </div>
                              <div className="w-2 h-2 rounded-full bg-gray-300"></div>
                            </div>
                            
                            <div className="text-center">
                              <div className="font-semibold text-gray-800">
                                {formatTime(item.arrival.time)}
                              </div>
                              <div className="text-gray-500">
                                {item.arrival.airport || item.arrival.station}
                              </div>
                            </div>
                          </div>
                          
                          {/* Duration & Stops */}
                          <div className="flex items-center space-x-4 mt-2">
                            <div className="flex items-center space-x-1 text-gray-600">
                              <Clock className="w-4 h-4" />
                              <span>{formatDuration(item.duration)}</span>
                            </div>
                            
                            {item.stops !== undefined && (
                              <div className="flex items-center space-x-1 text-gray-600">
                                <div className="w-4 h-4 flex items-center justify-center">
                                  <div className="w-2 h-2 rounded-full bg-gray-400"></div>
                                </div>
                                <span>
                                  {item.stops === 0 ? 'Direct' : `${item.stops} stop${item.stops > 1 ? 's' : ''}`}
                                </span>
                              </div>
                            )}
                            
                            <div className="flex items-center space-x-1 text-gray-600">
                              <Users className="w-4 h-4" />
                              <span>{item.bookingClass || item.class || 'Standard'}</span>
                            </div>
                          </div>
                          
                          {/* Amenities */}
                          {item.amenities && item.amenities.length > 0 && (
                            <div className="flex items-center space-x-3 mt-3">
                              {item.amenities.slice(0, 3).map((amenity, idx) => (
                                <div key={idx} className="flex items-center space-x-1 text-xs text-gray-500">
                                  <CheckCircle className="w-3 h-3 text-green-500" />
                                  <span>{amenity}</span>
                                </div>
                              ))}
                            </div>
                          )}
                        </div>
                      </div>
                      
                      {/* Right side - Price & Book */}
                      <div className="text-right ml-6">
                        <div className="text-3xl font-bold text-gray-800 mb-1">
                          ${item.price}
                        </div>
                        <div className="text-sm text-gray-500 mb-3">
                          {item.currency} per person
                        </div>
                        
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            onBookingClick && onBookingClick(item);
                          }}
                          className="bg-gradient-to-r from-orange-500 to-orange-600 hover:from-orange-600 hover:to-orange-700 text-white px-6 py-3 rounded-xl font-semibold transition-all duration-300 transform group-hover:scale-105 shadow-lg hover:shadow-xl flex items-center space-x-2"
                        >
                          <span>Book Now</span>
                          <ExternalLink className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  </motion.div>
                ))}
              </div>
            )}
          </motion.div>
        </AnimatePresence>
      </div>
    </div>
  );
};

export default TravelOptionsDisplay;