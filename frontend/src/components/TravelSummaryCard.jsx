import { useState } from "react";

const TravelSummaryCard = ({ response, travelData, showMapButton = true }) => {
  const [isExpanded, setIsExpanded] = useState(false);

  // Add error boundary at component level
  if (!response) {
    return (
      <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded">
        <p className="font-bold">No response data available</p>
      </div>
    );
  }

  try {
    // Check if this is a travel planning response (contains keywords)
    const isTravelResponse = response.toLowerCase().includes('trip') || 
                            response.toLowerCase().includes('weather') || 
                            response.toLowerCase().includes('visit') ||
                            response.toLowerCase().includes('attractions') ||
                            response.toLowerCase().includes('itinerary');

    // If not a travel response, show simple text
    if (!isTravelResponse) {
      return (
        <div className="bg-gradient-to-br from-blue-50 to-indigo-100 rounded-lg p-4 shadow-md border border-blue-200">
          <div className="text-gray-800 leading-relaxed">
            {response}
          </div>
        </div>
      );
    }
  } catch (error) {
    console.error('Error in TravelSummaryCard:', error);
    return (
      <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded">
        <p className="font-bold">Error rendering travel summary</p>
        <p className="text-sm">{error.message}</p>
        <p className="text-sm mt-2">Raw response: {String(response)}</p>
      </div>
    );
  }

  // Get appropriate emoji for section type
  const getSectionEmoji = (title) => {
    const titleLower = title.toLowerCase();
    if (titleLower.includes('weather') || titleLower.includes('forecast')) return '🌤️';
    if (titleLower.includes('outdoor') || titleLower.includes('beach')) return '🏖️';
    if (titleLower.includes('indoor') || titleLower.includes('museum')) return '🏛️';
    if (titleLower.includes('heritage') || titleLower.includes('culture')) return '🏰';
    if (titleLower.includes('adventure') || titleLower.includes('activity')) return '🎢';
    if (titleLower.includes('night') || titleLower.includes('dining')) return '🍽️';
    if (titleLower.includes('concerts') || titleLower.includes('music')) return '🎵';
    if (titleLower.includes('festivals') || titleLower.includes('celebrations')) return '🎭';
    if (titleLower.includes('sports') || titleLower.includes('games')) return '⚽';
    if (titleLower.includes('cultural events') || titleLower.includes('activities')) return '🎨';
    if (titleLower.includes('day') && titleLower.includes('1')) return '1️⃣';
    if (titleLower.includes('day') && titleLower.includes('2')) return '2️⃣';
    if (titleLower.includes('day') && titleLower.includes('3')) return '3️⃣';
    if (titleLower.includes('day') && titleLower.includes('4')) return '4️⃣';
    if (titleLower.includes('day') && titleLower.includes('5')) return '5️⃣';
    return '📍';
  };

  // Check if a section is a day-based itinerary
  const isDaySection = (title) => {
    const titleLower = title.toLowerCase();
    return titleLower.includes('day ') || titleLower.match(/day\s*\d+/);
  };

  // Parse travel response for better presentation and extract map data
  const parseResponse = (text) => {
    // Handle case where text might not be a string
    if (!text || typeof text !== 'string') {
      console.log('TravelSummaryCard parseResponse: Invalid text input:', typeof text, text);
      return {
        title: 'Travel Information',
        summary: 'Unable to parse travel response',
        sections: [],
        recommendations: ['Please try asking again for travel recommendations'],
        city: '',
        coordinates: null,
        weather: 'Weather information not available',
        attractions: [],
        dailyPlans: {}
      };
    }
    
    const lines = text.split('\n').filter(line => line.trim());
    const parsed = {
      title: '',
      summary: '',
      sections: [],
      weather: '',
      recommendations: [],
      city: '',
      coordinates: null,
      locations: {
        outdoor: [],
        indoor: [],
        heritage: [],
        adventure: [],
        nightlife: [],
        beaches: []
      }
    };

    let currentSection = '';
    
    // Extract city name from the response (look for common patterns)
    const cityPattern = /(?:trip to|visit|travel to|in|for) ([A-Za-z\s]+?)(?:\s|,|from|between|$)/i;
    const cityMatch = text.match(cityPattern);
    if (cityMatch) {
      parsed.city = cityMatch[1].trim();
    }
    
    // Try to extract coordinates if mentioned in the response
    const coordPattern = /latitude[:\s]+([0-9.-]+)[,\s]+longitude[:\s]+([0-9.-]+)/i;
    const coordMatch = text.match(coordPattern);
    if (coordMatch) {
      parsed.coordinates = {
        lat: parseFloat(coordMatch[1]),
        lon: parseFloat(coordMatch[2])
      };
    }
    
    for (let line of lines) {
      line = line.trim();
      
      // Extract title (usually first meaningful line)
      if (!parsed.title && (line.includes('trip') || line.includes('itinerary') || line.includes('plan'))) {
        parsed.title = line;
        continue;
      }
      
      // Weather information
      if (line.toLowerCase().includes('weather') || line.toLowerCase().includes('sunny') || 
          line.toLowerCase().includes('rainy') || line.toLowerCase().includes('cloudy')) {
        parsed.weather = line;
        continue;
      }
      
      // Section headers (usually numbered or have special characters)
      if (line.match(/^\d+\.|\*\*|##|###/) || line.endsWith(':')) {
        currentSection = line.replace(/^\d+\.\s*|\*\*|\#/g, '').replace(/:$/, '');
        parsed.sections.push({
          title: currentSection,
          items: []
        });
        continue;
      }
      
      // Items under sections
      if (currentSection && parsed.sections.length > 0) {
        const item = line.replace(/^-\s*|\*\s*/, '');
        parsed.sections[parsed.sections.length - 1].items.push(item);
        
        // Extract locations based on section type and add to locations object
        const sectionLower = currentSection.toLowerCase();
        if (sectionLower.includes('outdoor') || sectionLower.includes('park') || sectionLower.includes('nature')) {
          parsed.locations.outdoor.push(item);
        } else if (sectionLower.includes('indoor') || sectionLower.includes('museum') || sectionLower.includes('gallery')) {
          parsed.locations.indoor.push(item);
        } else if (sectionLower.includes('heritage') || sectionLower.includes('historic') || sectionLower.includes('culture')) {
          parsed.locations.heritage.push(item);
        } else if (sectionLower.includes('adventure') || sectionLower.includes('activity') || sectionLower.includes('sport')) {
          parsed.locations.adventure.push(item);
        } else if (sectionLower.includes('night') || sectionLower.includes('dining') || sectionLower.includes('restaurant')) {
          parsed.locations.nightlife.push(item);
        } else if (sectionLower.includes('beach') || sectionLower.includes('water')) {
          parsed.locations.beaches.push(item);
        } else {
          // Default to outdoor if we can't categorize
          parsed.locations.outdoor.push(item);
        }
      } else {
        // General recommendations or summary
        if (line.length > 10) {
          parsed.recommendations.push(line);
        }
      }
    }
    
    return parsed;
  };

  const parsedData = parseResponse(response);
  
  // Since map is now shown separately, we don't need map data in the card

  return (
    <div className="bg-gradient-to-br from-orange-50 via-white to-orange-100 rounded-2xl p-6 shadow-xl border border-orange-200 max-w-5xl backdrop-blur-sm">
      {/* Header */}
      <div className="flex items-start justify-between mb-6">
        <div className="flex items-center space-x-4">
          <div className="w-12 h-12 bg-gradient-to-r from-orange-400 to-orange-600 rounded-2xl flex items-center justify-center shadow-lg">
            <span className="text-white text-xl">✈️</span>
          </div>
          <div>
            <h3 className="text-xl font-bold text-orange-800">
              {parsedData.title || "Travel Recommendations"}
            </h3>
            <p className="text-sm text-orange-600 font-medium">AI-Powered Itinerary</p>
          </div>
        </div>
        <button
          onClick={() => setIsExpanded(!isExpanded)}
          className="text-orange-600 hover:text-orange-800 transition-all duration-300 p-2 hover:bg-orange-100 rounded-xl"
        >
          {isExpanded ? '🔼' : '🔽'}
        </button>
      </div>

      {/* Weather Summary */}
      {parsedData.weather && (
        <div className="bg-gradient-to-r from-orange-100 to-amber-100 rounded-xl p-4 mb-6 border border-orange-200 shadow-lg">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 bg-gradient-to-r from-orange-400 to-orange-600 rounded-xl flex items-center justify-center shadow-md">
              <span className="text-white">🌤️</span>
            </div>
            <div>
              <p className="text-xs text-orange-600 font-bold uppercase tracking-wide">Weather Forecast</p>
              <p className="text-orange-800 font-semibold">{parsedData.weather}</p>
            </div>
          </div>
        </div>
      )}

      {/* Quick Summary */}
      <div className="space-y-3 mb-6">
        {parsedData.recommendations.slice(0, isExpanded ? parsedData.recommendations.length : 2).map((rec, idx) => (
          <div key={idx} className="text-orange-800 leading-relaxed bg-white/50 rounded-xl p-4 border border-orange-100 shadow-sm">
            {rec}
          </div>
        ))}
      </div>

      {/* Detailed Sections */}
      {isExpanded && parsedData.sections.length > 0 && (
        <div className="space-y-6 mt-6 border-t border-orange-200 pt-6">
          {parsedData.sections.map((section, idx) => (
            <div 
              key={idx} 
              className={`${
                isDaySection(section.title) 
                  ? 'bg-gradient-to-r from-orange-100 to-amber-50 border-2 border-orange-300 shadow-lg' 
                  : 'bg-white/70 border border-orange-200 shadow-md'
              } rounded-2xl p-6 transition-all duration-300 hover:shadow-xl`}
            >
              <div className={`${
                isDaySection(section.title) 
                  ? 'bg-gradient-to-r from-orange-400 to-orange-600 text-white' 
                  : 'bg-orange-50 text-orange-800'
              } rounded-xl p-3 mb-4 shadow-md`}>
                <h4 className={`font-bold flex items-center text-lg ${
                  isDaySection(section.title) ? 'text-white' : 'text-orange-800'
                }`}>
                  <span className="text-xl mr-3">{getSectionEmoji(section.title)}</span>
                  {section.title}
                </h4>
              </div>
              <div className="space-y-3">
                {section.items.map((item, itemIdx) => (
                  <div key={itemIdx} className={`${
                    isDaySection(section.title)
                      ? 'bg-white/80 border-l-4 border-orange-400 text-orange-900'
                      : 'bg-orange-50/50 border-l-4 border-orange-300 text-orange-800'
                  } pl-4 pr-4 py-3 rounded-r-xl shadow-sm hover:shadow-md transition-all duration-200`}>
                    <span className="font-medium">{item}</span>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Full Response Toggle */}
      {!isExpanded && (parsedData.sections.length > 0 || parsedData.recommendations.length > 2) && (
        <button
          onClick={() => setIsExpanded(true)}
          className="w-full mt-4 py-3 bg-gradient-to-r from-orange-400 to-orange-600 hover:from-orange-500 hover:to-orange-700 text-white rounded-xl transition-all duration-300 font-bold shadow-lg hover:shadow-xl transform hover:-translate-y-1"
        >
          View Full Itinerary ✨
        </button>
      )}

      {/* Action Buttons */}
      <div className="flex space-x-3 mt-6 pt-6 border-t border-orange-200">
        <button 
          onClick={() => {
            navigator.clipboard.writeText(response);
            // You could add a toast notification here
          }}
          className="flex-1 py-3 bg-white hover:bg-orange-50 text-orange-700 rounded-xl font-semibold transition-all duration-300 border-2 border-orange-200 hover:border-orange-300 shadow-md hover:shadow-lg flex items-center justify-center space-x-2 transform hover:-translate-y-0.5"
        >
          <span>📋</span>
          <span>Copy Itinerary</span>
        </button>
        <button 
          onClick={() => {
            const shareData = {
              title: 'My Travel Itinerary',
              text: response
            };
            if (navigator.share) {
              navigator.share(shareData);
            } else {
              // Fallback to copy
              navigator.clipboard.writeText(response);
            }
          }}
          className="flex-1 py-3 bg-white hover:bg-orange-50 text-orange-700 rounded-xl font-semibold transition-all duration-300 border-2 border-orange-200 hover:border-orange-300 shadow-md hover:shadow-lg flex items-center justify-center space-x-2 transform hover:-translate-y-0.5"
        >
          <span>📤</span>
          <span>Share</span>
        </button>
      </div>
    </div>
  );
};

export default TravelSummaryCard;