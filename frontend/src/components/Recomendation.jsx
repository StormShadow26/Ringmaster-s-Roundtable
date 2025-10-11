import React, { useState, useEffect } from 'react';
import { 
  Brain, 
  MapPin, 
  Star, 
  Clock, 
  DollarSign, 
  Users, 
  Heart, 
  TrendingUp, 
  Filter,
  Zap,
  Target,
  Sparkles,
  ChevronRight,
  Calendar,
  Camera
} from 'lucide-react';

const RecommendationSystem = () => {
  const [userPreferences, setUserPreferences] = useState({
    budget: 'medium',
    travelStyle: 'adventure',
    duration: '7',
    interests: []
  });
  
  const [recommendations, setRecommendations] = useState([]);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [analysisStage, setAnalysisStage] = useState(0);
  const [selectedCategory, setSelectedCategory] = useState('all');

  // Mock recommendation data with rich details
  const mockRecommendations = [
    {
      id: 1,
      destination: "Santorini, Greece",
      type: "Romantic Getaway",
      score: 98,
      matchReason: "Perfect for sunset photography and luxury experiences",
      image: "https://images.unsplash.com/photo-1570077188670-e3a8d69ac5ff?w=800",
      price: "$2,400",
      duration: "5-7 days",
      highlights: ["Iconic blue domes", "Wine tasting", "Luxury resorts", "Sunset cruises"],
      aiInsight: "Based on your interest in photography and romantic settings",
      tags: ["Photography", "Romance", "Luxury", "Culture"],
      rating: 4.9,
      reviews: 2847,
      bestTime: "Apr-Oct"
    },
    {
      id: 2,
      destination: "Tokyo, Japan",
      type: "Cultural Adventure",
      score: 95,
      matchReason: "Combines modern technology with traditional culture",
      image: "https://images.unsplash.com/photo-1540959733332-eab4deabeeaf?w=800",
      price: "$1,800",
      duration: "7-10 days",
      highlights: ["Cherry blossoms", "Temple visits", "Street food", "Tech districts"],
      aiInsight: "Matches your adventure spirit and cultural curiosity",
      tags: ["Culture", "Food", "Technology", "Adventure"],
      rating: 4.8,
      reviews: 5692,
      bestTime: "Mar-May, Sep-Nov"
    },
    {
      id: 3,
      destination: "Machu Picchu, Peru",
      type: "Adventure Trek",
      score: 92,
      matchReason: "Epic hiking experience with historical significance",
      image: "https://images.unsplash.com/photo-1587595431973-160d0d94add1?w=800",
      price: "$1,200",
      duration: "4-6 days",
      highlights: ["Inca Trail", "Ancient ruins", "Mountain views", "Llama encounters"],
      aiInsight: "Perfect match for your adventurous travel style",
      tags: ["Adventure", "History", "Hiking", "Nature"],
      rating: 4.7,
      reviews: 3241,
      bestTime: "May-Sep"
    },
    {
      id: 4,
      destination: "Dubai, UAE",
      type: "Luxury Experience",
      score: 89,
      matchReason: "Modern luxury with unique architectural marvels",
      image: "https://images.unsplash.com/photo-1512453979798-5ea266f8880c?w=800",
      price: "$3,200",
      duration: "4-5 days",
      highlights: ["Burj Khalifa", "Desert safari", "Gold souks", "Luxury shopping"],
      aiInsight: "Matches your preference for modern experiences",
      tags: ["Luxury", "Modern", "Shopping", "Architecture"],
      rating: 4.6,
      reviews: 4156,
      bestTime: "Nov-Mar"
    },
    {
      id: 5,
      destination: "Bali, Indonesia",
      type: "Wellness Retreat",
      score: 87,
      matchReason: "Perfect blend of nature, spirituality, and relaxation",
      image: "https://images.unsplash.com/photo-1537953773345-d172ccf13cf1?w=800",
      price: "$1,600",
      duration: "6-8 days",
      highlights: ["Rice terraces", "Yoga retreats", "Beach clubs", "Temple tours"],
      aiInsight: "Great for balancing adventure with relaxation",
      tags: ["Wellness", "Nature", "Spirituality", "Beach"],
      rating: 4.8,
      reviews: 2934,
      bestTime: "Apr-Oct"
    }
  ];

  const categories = [
    { id: 'all', name: 'All Recommendations', icon: Target },
    { id: 'adventure', name: 'Adventure', icon: TrendingUp },
    { id: 'luxury', name: 'Luxury', icon: Sparkles },
    { id: 'culture', name: 'Culture', icon: Camera },
    { id: 'wellness', name: 'Wellness', icon: Heart }
  ];

  const analysisStages = [
    "Analyzing your travel history...",
    "Processing preference patterns...",
    "Matching destinations with AI...",
    "Calculating compatibility scores...",
    "Optimizing recommendations..."
  ];

  // Simulate AI recommendation generation
  const generateRecommendations = async () => {
    setIsAnalyzing(true);
    setAnalysisStage(0);
    
    // Simulate AI processing stages
    for (let i = 0; i < analysisStages.length; i++) {
      setAnalysisStage(i);
      await new Promise(resolve => setTimeout(resolve, 1500));
    }
    
    // Simulate network delay
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    setRecommendations(mockRecommendations);
    setIsAnalyzing(false);
  };

  useEffect(() => {
    // Auto-generate recommendations on mount
    generateRecommendations();
  }, []);

  const filteredRecommendations = selectedCategory === 'all' 
    ? recommendations 
    : recommendations.filter(rec => 
        rec.tags.some(tag => tag.toLowerCase().includes(selectedCategory))
      );

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-50 via-white to-purple-50 p-6">
      
      {/* Header Section */}
      <div className="max-w-7xl mx-auto">
        <div className="text-center mb-12">
          <div className="flex items-center justify-center mb-6">
            <div className="relative">
              <Brain className="w-16 h-16 text-indigo-600 animate-pulse" />
              <div className="absolute -top-2 -right-2 w-6 h-6 bg-gradient-to-r from-purple-500 to-pink-500 rounded-full flex items-center justify-center">
                <Zap className="w-3 h-3 text-white" />
              </div>
            </div>
          </div>
          <h1 className="text-5xl font-extrabold bg-gradient-to-r from-indigo-600 via-purple-600 to-pink-600 bg-clip-text text-transparent mb-4">
            AI-Powered Travel Recommendations
          </h1>
          <p className="text-xl text-gray-600 max-w-3xl mx-auto">
            Our advanced AI analyzes millions of data points to create personalized travel experiences just for you
          </p>
        </div>

        {/* AI Analysis Section */}
        {isAnalyzing && (
          <div className="bg-white rounded-2xl shadow-xl p-8 mb-8 border border-indigo-200">
            <div className="flex items-center justify-center mb-6">
              <div className="relative">
                <div className="w-16 h-16 border-4 border-indigo-200 border-t-indigo-600 rounded-full animate-spin"></div>
                <Brain className="w-8 h-8 text-indigo-600 absolute top-4 left-4 animate-pulse" />
              </div>
            </div>
            <div className="text-center">
              <h3 className="text-2xl font-bold text-gray-800 mb-4">AI Engine Processing</h3>
              <p className="text-lg text-indigo-600 mb-6">{analysisStages[analysisStage]}</p>
              <div className="w-full bg-gray-200 rounded-full h-3">
                <div 
                  className="bg-gradient-to-r from-indigo-600 to-purple-600 h-3 rounded-full transition-all duration-500"
                  style={{ width: `${((analysisStage + 1) / analysisStages.length) * 100}%` }}
                ></div>
              </div>
            </div>
          </div>
        )}

        {/* Category Filter */}
        {!isAnalyzing && recommendations.length > 0 && (
          <div className="bg-white rounded-xl shadow-lg p-6 mb-8">
            <h3 className="text-xl font-bold text-gray-800 mb-4 flex items-center">
              <Filter className="w-5 h-5 mr-2" />
              Filter by Category
            </h3>
            <div className="flex flex-wrap gap-3">
              {categories.map((category) => {
                const Icon = category.icon;
                return (
                  <button
                    key={category.id}
                    onClick={() => setSelectedCategory(category.id)}
                    className={`flex items-center px-4 py-2 rounded-full transition-all duration-300 ${
                      selectedCategory === category.id
                        ? 'bg-gradient-to-r from-indigo-500 to-purple-500 text-white shadow-lg'
                        : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                    }`}
                  >
                    <Icon className="w-4 h-4 mr-2" />
                    {category.name}
                  </button>
                );
              })}
            </div>
          </div>
        )}

        {/* Recommendations Grid */}
        {!isAnalyzing && (
          <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-8">
            {filteredRecommendations.map((rec, index) => (
              <div
                key={rec.id}
                className="bg-white rounded-2xl shadow-xl overflow-hidden hover:shadow-2xl transition-all duration-500 transform hover:-translate-y-2 group"
                style={{ animationDelay: `${index * 0.1}s` }}
              >
                {/* Image Section */}
                <div className="relative h-64 overflow-hidden">
                  <img
                    src={rec.image}
                    alt={rec.destination}
                    className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
                  />
                  <div className="absolute top-4 left-4 bg-white/90 backdrop-blur-sm rounded-full px-3 py-1">
                    <span className="text-sm font-bold text-indigo-600">{rec.score}% Match</span>
                  </div>
                  <div className="absolute top-4 right-4 bg-gradient-to-r from-indigo-500 to-purple-500 text-white rounded-full p-2">
                    <Heart className="w-4 h-4" />
                  </div>
                </div>

                {/* Content Section */}
                <div className="p-6">
                  <div className="flex items-center justify-between mb-3">
                    <h3 className="text-2xl font-bold text-gray-800">{rec.destination}</h3>
                    <span className="text-lg font-bold text-green-600">{rec.price}</span>
                  </div>
                  
                  <p className="text-indigo-600 font-semibold mb-3">{rec.type}</p>
                  
                  <div className="flex items-center mb-4">
                    <Star className="w-4 h-4 text-yellow-400 fill-current" />
                    <span className="text-gray-700 ml-1">{rec.rating} ({rec.reviews.toLocaleString()} reviews)</span>
                  </div>

                  <div className="bg-gradient-to-r from-indigo-50 to-purple-50 rounded-lg p-4 mb-4">
                    <div className="flex items-center mb-2">
                      <Sparkles className="w-4 h-4 text-indigo-500 mr-2" />
                      <span className="text-sm font-semibold text-gray-700">AI Insight</span>
                    </div>
                    <p className="text-sm text-gray-600">{rec.aiInsight}</p>
                  </div>

                  <div className="space-y-3 mb-6">
                    <div className="flex items-center text-sm text-gray-600">
                      <Clock className="w-4 h-4 mr-2" />
                      <span>{rec.duration}</span>
                    </div>
                    <div className="flex items-center text-sm text-gray-600">
                      <Calendar className="w-4 h-4 mr-2" />
                      <span>Best time: {rec.bestTime}</span>
                    </div>
                  </div>

                  {/* Tags */}
                  <div className="flex flex-wrap gap-2 mb-6">
                    {rec.tags.map((tag, tagIndex) => (
                      <span
                        key={tagIndex}
                        className="px-2 py-1 bg-gray-100 text-gray-600 rounded-full text-xs"
                      >
                        {tag}
                      </span>
                    ))}
                  </div>

                  {/* Highlights */}
                  <div className="mb-6">
                    <h4 className="font-semibold text-gray-700 mb-2">Top Highlights</h4>
                    <ul className="space-y-1">
                      {rec.highlights.slice(0, 3).map((highlight, highlightIndex) => (
                        <li key={highlightIndex} className="flex items-center text-sm text-gray-600">
                          <ChevronRight className="w-3 h-3 mr-1 text-indigo-400" />
                          {highlight}
                        </li>
                      ))}
                    </ul>
                  </div>

                  {/* Action Buttons */}
                  <div className="flex space-x-3">
                    <button className="flex-1 bg-gradient-to-r from-indigo-500 to-purple-500 text-white py-3 px-4 rounded-lg font-semibold hover:from-indigo-600 hover:to-purple-600 transition-all duration-300 transform hover:scale-105">
                      Plan Trip
                    </button>
                    <button className="px-4 py-3 border-2 border-indigo-500 text-indigo-500 rounded-lg font-semibold hover:bg-indigo-500 hover:text-white transition-all duration-300">
                      Save
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Footer Stats */}
        {!isAnalyzing && recommendations.length > 0 && (
          <div className="mt-16 bg-gradient-to-r from-indigo-600 to-purple-600 rounded-2xl p-8 text-white">
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6 text-center">
              <div>
                <div className="text-3xl font-bold mb-2">50M+</div>
                <div className="text-indigo-200">Data Points Analyzed</div>
              </div>
              <div>
                <div className="text-3xl font-bold mb-2">98%</div>
                <div className="text-indigo-200">Accuracy Rate</div>
              </div>
              <div>
                <div className="text-3xl font-bold mb-2">2.5M+</div>
                <div className="text-indigo-200">Happy Travelers</div>
              </div>
              <div>
                <div className="text-3xl font-bold mb-2">24/7</div>
                <div className="text-indigo-200">AI Learning</div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default RecommendationSystem;
