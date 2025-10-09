import React, { useState, useEffect } from 'react';
import { ArrowRight, Plane, Train, Bus, MapPin, Calendar, Users, Search, Loader2, Clock, DollarSign, ArrowLeft } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import TravelOptionsDisplay from './TravelOptionsDisplay';
import travelBookingService from '../services/travelBookingService';

const Transport = () => {
  const navigate = useNavigate();
  
  // Form state
  const [fromCity, setFromCity] = useState('');
  const [toCity, setToCity] = useState('');
  const [departureDate, setDepartureDate] = useState('');
  const [returnDate, setReturnDate] = useState('');
  const [passengers, setPassengers] = useState(1);
  
  // Search state
  const [isSearching, setIsSearching] = useState(false);
  const [searchResults, setSearchResults] = useState(null);
  const [searchError, setSearchError] = useState('');
  
  // Get today's date in YYYY-MM-DD format for min date
  const today = new Date().toISOString().split('T')[0];

  const handleSearch = async () => {
    if (!fromCity.trim() || !toCity.trim() || !departureDate) {
      setSearchError('Please fill in all required fields (From, To, and Departure Date)');
      return;
    }

    setIsSearching(true);
    setSearchError('');
    setSearchResults(null);

    try {
      console.log('🚀 Searching transportation between cities:', {
        from: fromCity,
        to: toCity,
        departure: departureDate,
        return: returnDate,
        passengers
      });

      // Use the travel booking service
      const results = await travelBookingService.searchAllTransportation(
        fromCity.trim(),
        toCity.trim(),
        new Date(departureDate),
        returnDate ? new Date(returnDate) : null
      );

      console.log('✅ Transportation search completed:', results);
      setSearchResults(results);

    } catch (error) {
      console.error('❌ Transportation search failed:', error);
      setSearchError('Search failed. Please try again later.');
    } finally {
      setIsSearching(false);
    }
  };

  // Handle booking click
  const handleBookingClick = (travelOption) => {
    console.log("🎫 Booking clicked:", travelOption);
    
    const bookingDetails = `${travelOption.airlineName || travelOption.operatorName} - ${travelOption.flightNumber || travelOption.trainNumber || travelOption.busNumber}\n` +
      `${new Date(travelOption.departure.time).toLocaleDateString()} at ${new Date(travelOption.departure.time).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}\n` +
      `Price: $${travelOption.price} ${travelOption.currency}\n\n` +
      `This would redirect to the booking website in a real application.`;
    
    alert(`Booking Details:\n\n${bookingDetails}`);
  };

  // Clear search results
  const clearSearch = () => {
    setSearchResults(null);
    setSearchError('');
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50">
      {/* Header */}
      <div className="bg-white shadow-sm border-b border-gray-100">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center space-x-4">
              <button
                onClick={() => navigate('/dashboard')}
                className="flex items-center space-x-2 text-gray-600 hover:text-gray-900 transition-colors"
              >
                <ArrowLeft className="w-5 h-5" />
                <span className="font-medium">Back to Dashboard</span>
              </button>
            </div>
            <div className="flex items-center space-x-3">
              <Bus className="w-8 h-8 text-green-600" />
              <h1 className="text-2xl font-bold text-gray-900">Transportation Search</h1>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Search Form */}
        <div className="bg-white rounded-2xl shadow-xl border border-gray-100 p-8 mb-8">
          <div className="text-center mb-8">
            <h2 className="text-3xl font-bold text-gray-900 mb-3">Find Your Perfect Journey</h2>
            <p className="text-gray-600 text-lg">Search for flights, trains, and buses between any two cities</p>
          </div>

          {/* Form Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
            {/* From City */}
            <div className="space-y-2">
              <label className="block text-sm font-semibold text-gray-700">
                <MapPin className="w-4 h-4 inline mr-1" />
                From City *
              </label>
              <input
                type="text"
                value={fromCity}
                onChange={(e) => setFromCity(e.target.value)}
                placeholder="e.g., New York, London, Tokyo"
                className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-green-500 focus:border-transparent transition-all"
              />
            </div>

            {/* To City */}
            <div className="space-y-2">
              <label className="block text-sm font-semibold text-gray-700">
                <MapPin className="w-4 h-4 inline mr-1" />
                To City *
              </label>
              <input
                type="text"
                value={toCity}
                onChange={(e) => setToCity(e.target.value)}
                placeholder="e.g., Paris, Mumbai, Sydney"
                className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-green-500 focus:border-transparent transition-all"
              />
            </div>

            {/* Departure Date */}
            <div className="space-y-2">
              <label className="block text-sm font-semibold text-gray-700">
                <Calendar className="w-4 h-4 inline mr-1" />
                Departure Date *
              </label>
              <input
                type="date"
                value={departureDate}
                onChange={(e) => setDepartureDate(e.target.value)}
                min={today}
                className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-green-500 focus:border-transparent transition-all"
              />
            </div>

            {/* Return Date */}
            <div className="space-y-2">
              <label className="block text-sm font-semibold text-gray-700">
                <Calendar className="w-4 h-4 inline mr-1" />
                Return Date (Optional)
              </label>
              <input
                type="date"
                value={returnDate}
                onChange={(e) => setReturnDate(e.target.value)}
                min={departureDate || today}
                className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-green-500 focus:border-transparent transition-all"
              />
            </div>

            {/* Passengers */}
            <div className="space-y-2">
              <label className="block text-sm font-semibold text-gray-700">
                <Users className="w-4 h-4 inline mr-1" />
                Passengers
              </label>
              <select
                value={passengers}
                onChange={(e) => setPassengers(parseInt(e.target.value))}
                className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-green-500 focus:border-transparent transition-all"
              >
                {[1,2,3,4,5,6,7,8].map(num => (
                  <option key={num} value={num}>{num} {num === 1 ? 'Passenger' : 'Passengers'}</option>
                ))}
              </select>
            </div>

            {/* Search Button */}
            <div className="space-y-2 flex flex-col justify-end">
              <button
                onClick={handleSearch}
                disabled={isSearching}
                className="w-full bg-gradient-to-r from-green-500 to-green-600 hover:from-green-600 hover:to-green-700 disabled:from-gray-400 disabled:to-gray-500 text-white font-bold py-3 px-6 rounded-xl transition-all duration-300 transform hover:scale-105 disabled:hover:scale-100 flex items-center justify-center space-x-2"
              >
                {isSearching ? (
                  <>
                    <Loader2 className="w-5 h-5 animate-spin" />
                    <span>Searching...</span>
                  </>
                ) : (
                  <>
                    <Search className="w-5 h-5" />
                    <span>Search Transportation</span>
                  </>
                )}
              </button>
            </div>
          </div>

          {/* Error Message */}
          {searchError && (
            <div className="bg-red-50 border border-red-200 rounded-xl p-4 mb-4">
              <p className="text-red-700 font-medium">{searchError}</p>
            </div>
          )}

          {/* Info Cards */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-8">
            <div className="bg-blue-50 rounded-xl p-4 text-center">
              <Plane className="w-8 h-8 text-blue-600 mx-auto mb-2" />
              <h3 className="font-semibold text-blue-900">Flights</h3>
              <p className="text-sm text-blue-700">Commercial airlines worldwide</p>
            </div>
            <div className="bg-purple-50 rounded-xl p-4 text-center">
              <Train className="w-8 h-8 text-purple-600 mx-auto mb-2" />
              <h3 className="font-semibold text-purple-900">Trains</h3>
              <p className="text-sm text-purple-700">Railway networks and high-speed trains</p>
            </div>
            <div className="bg-orange-50 rounded-xl p-4 text-center">
              <Bus className="w-8 h-8 text-orange-600 mx-auto mb-2" />
              <h3 className="font-semibold text-orange-900">Buses</h3>
              <p className="text-sm text-orange-700">Intercity and long-distance bus services</p>
            </div>
          </div>
        </div>

        {/* Search Results */}
        {searchResults && (
          <div className="bg-white rounded-2xl shadow-xl border border-gray-100 overflow-hidden">
            <div className="bg-gradient-to-r from-green-500 to-green-600 px-6 py-4">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-2xl font-bold text-white">Transportation Options</h3>
                  <p className="text-green-100 font-medium">
                    {fromCity} → {toCity} • {new Date(departureDate).toLocaleDateString()}
                  </p>
                </div>
                <button
                  onClick={clearSearch}
                  className="bg-white/20 hover:bg-white/30 text-white px-4 py-2 rounded-lg transition-colors font-medium"
                >
                  New Search
                </button>
              </div>
            </div>

            <div className="p-6">
              <TravelOptionsDisplay
                travelData={searchResults}
                onBookingClick={handleBookingClick}
                loading={isSearching}
                origin={fromCity}
                destination={toCity}
              />
            </div>
          </div>
        )}

        {/* No Results Message */}
        {searchResults && !isSearching && (
          <>
            {(!searchResults.flights?.length && !searchResults.trains?.length && !searchResults.buses?.length) && (
              <div className="bg-white rounded-2xl shadow-xl border border-gray-100 p-8 text-center">
                <div className="text-6xl mb-4">🔍</div>
                <h3 className="text-xl font-bold text-gray-900 mb-2">No Transportation Found</h3>
                <p className="text-gray-600 mb-6">
                  We couldn't find any transportation options for this route. Try different cities or dates.
                </p>
                <button
                  onClick={clearSearch}
                  className="bg-gradient-to-r from-green-500 to-green-600 hover:from-green-600 hover:to-green-700 text-white font-bold py-3 px-6 rounded-xl transition-all"
                >
                  Try New Search
                </button>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
};

export default Transport;