import { useState } from "react";

const TravelSummaryCard = ({ response }) => {
  const [isExpanded, setIsExpanded] = useState(false);

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

  // Get appropriate emoji for section type
  const getSectionEmoji = (title) => {
    const titleLower = title.toLowerCase();
    if (titleLower.includes('weather') || titleLower.includes('forecast')) return '🌤️';
    if (titleLower.includes('outdoor') || titleLower.includes('beach')) return '🏖️';
    if (titleLower.includes('indoor') || titleLower.includes('museum')) return '🏛️';
    if (titleLower.includes('heritage') || titleLower.includes('culture')) return '🏰';
    if (titleLower.includes('adventure') || titleLower.includes('activity')) return '🎢';
    if (titleLower.includes('night') || titleLower.includes('dining')) return '🍽️';
    if (titleLower.includes('day') && titleLower.includes('1')) return '1️⃣';
    if (titleLower.includes('day') && titleLower.includes('2')) return '2️⃣';
    if (titleLower.includes('day') && titleLower.includes('3')) return '3️⃣';
    if (titleLower.includes('day') && titleLower.includes('4')) return '4️⃣';
    if (titleLower.includes('day') && titleLower.includes('5')) return '5️⃣';
    return '📍';
  };

  // Parse travel response for better presentation
  const parseResponse = (text) => {
    const lines = text.split('\n').filter(line => line.trim());
    const parsed = {
      title: '',
      summary: '',
      sections: [],
      weather: '',
      recommendations: []
    };

    let currentSection = '';
    
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
        parsed.sections[parsed.sections.length - 1].items.push(line.replace(/^-\s*|\*\s*/, ''));
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

  return (
    <div className="bg-gradient-to-br from-emerald-50 via-teal-50 to-cyan-100 rounded-xl p-6 shadow-xl border border-emerald-200 max-w-3xl backdrop-blur-sm">
      {/* Header */}
      <div className="flex items-start justify-between mb-4">
        <div className="flex items-center space-x-3">
          <div className="w-10 h-10 bg-emerald-500 rounded-full flex items-center justify-center">
            <span className="text-white text-lg">✈️</span>
          </div>
          <div>
            <h3 className="text-lg font-semibold text-emerald-800">
              {parsedData.title || "Travel Recommendations"}
            </h3>
            <p className="text-sm text-emerald-600">AI-Powered Itinerary</p>
          </div>
        </div>
        <button
          onClick={() => setIsExpanded(!isExpanded)}
          className="text-emerald-600 hover:text-emerald-800 transition-colors"
        >
          {isExpanded ? '🔼' : '🔽'}
        </button>
      </div>

      {/* Weather Summary */}
      {parsedData.weather && (
        <div className="bg-gradient-to-r from-blue-100 to-sky-100 rounded-lg p-4 mb-4 border border-blue-200 shadow-sm">
          <div className="flex items-center space-x-3">
            <div className="w-8 h-8 bg-blue-500 rounded-full flex items-center justify-center">
              <span className="text-white text-sm">🌤️</span>
            </div>
            <div>
              <p className="text-xs text-blue-600 font-medium uppercase tracking-wide">Weather Forecast</p>
              <p className="text-blue-800 font-medium">{parsedData.weather}</p>
            </div>
          </div>
        </div>
      )}

      {/* Quick Summary */}
      <div className="space-y-2 mb-4">
        {parsedData.recommendations.slice(0, isExpanded ? parsedData.recommendations.length : 2).map((rec, idx) => (
          <div key={idx} className="text-emerald-800 text-sm leading-relaxed">
            {rec}
          </div>
        ))}
      </div>

      {/* Detailed Sections */}
      {isExpanded && parsedData.sections.length > 0 && (
        <div className="space-y-4 mt-4 border-t border-emerald-200 pt-4">
          {parsedData.sections.map((section, idx) => (
            <div key={idx} className="bg-white bg-opacity-40 rounded-lg p-4">
              <h4 className="font-semibold text-emerald-800 mb-3 flex items-center">
                <span className="text-lg mr-2">{getSectionEmoji(section.title)}</span>
                {section.title}
              </h4>
              <div className="space-y-1">
                {section.items.map((item, itemIdx) => (
                  <div key={itemIdx} className="text-emerald-700 text-sm pl-4 border-l-2 border-emerald-200">
                    {item}
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
          className="w-full mt-3 py-2 bg-emerald-500 hover:bg-emerald-600 text-white rounded-lg transition-colors text-sm font-medium"
        >
          View Full Itinerary ✨
        </button>
      )}

      {/* Action Buttons */}
      <div className="flex space-x-2 mt-6 pt-4 border-t border-emerald-200">
        <button 
          onClick={() => {
            navigator.clipboard.writeText(response);
            // You could add a toast notification here
          }}
          className="flex-1 py-2 bg-white bg-opacity-70 hover:bg-opacity-90 text-emerald-700 rounded-lg text-sm font-medium transition-all border border-emerald-200 hover:border-emerald-300 shadow-sm hover:shadow-md flex items-center justify-center space-x-2"
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
          className="flex-1 py-2 bg-white bg-opacity-70 hover:bg-opacity-90 text-emerald-700 rounded-lg text-sm font-medium transition-all border border-emerald-200 hover:border-emerald-300 shadow-sm hover:shadow-md flex items-center justify-center space-x-2"
        >
          <span>�</span>
          <span>Share</span>
        </button>
      </div>
    </div>
  );
};

export default TravelSummaryCard;