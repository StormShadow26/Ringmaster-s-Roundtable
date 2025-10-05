import { useState } from "react";

const EventsCard = ({ events, city, travelPeriod }) => {
  const [expandedEvent, setExpandedEvent] = useState(null);

  // Comprehensive error handling
  try {
    console.log('EventsCard received:', { events, city, travelPeriod });
    
    if (!events) {
      console.log('EventsCard: No events provided');
      return null;
    }
    
    if (!Array.isArray(events)) {
      console.log('EventsCard: Events is not an array:', typeof events, events);
      return (
        <div className="bg-yellow-100 border border-yellow-400 text-yellow-700 px-4 py-3 rounded">
          <p className="text-sm">Events data is not in expected format</p>
        </div>
      );
    }
    
    if (events.length === 0) {
      console.log('EventsCard: No events in array');
      return null;
    }
    
    console.log(`EventsCard: Processing ${events.length} events`);
    
  } catch (error) {
    console.error('EventsCard initialization error:', error);
    return (
      <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded">
        <p className="font-bold">Error initializing events display</p>
        <p className="text-sm">{error.message}</p>
      </div>
    );
  }

  // Group events by category for better organization  
  const groupedEvents = {};
  try {
    groupedEvents.concerts = events.filter(e => e && e.category === 'concerts');
    groupedEvents.festivals = events.filter(e => e && e.category === 'festivals');
    groupedEvents.sports = events.filter(e => e && e.category === 'sports');
    groupedEvents.cultural = events.filter(e => e && e.category === 'cultural');
    groupedEvents.community = events.filter(e => e && e.category === 'community');
  } catch (filterError) {
    console.error('EventsCard: Error filtering events by category:', filterError);
    // Fallback: put all events in cultural category
    groupedEvents.cultural = events || [];
    groupedEvents.concerts = [];
    groupedEvents.festivals = [];
    groupedEvents.sports = [];
    groupedEvents.community = [];
  }

  // Get category styling
  const getCategoryStyle = (category) => {
    const styles = {
      concerts: 'from-purple-100 to-pink-100 border-purple-200',
      festivals: 'from-orange-100 to-red-100 border-orange-200', 
      sports: 'from-green-100 to-blue-100 border-green-200',
      cultural: 'from-indigo-100 to-purple-100 border-indigo-200',
      community: 'from-yellow-100 to-orange-100 border-yellow-200'
    };
    return styles[category] || 'from-gray-100 to-gray-200 border-gray-200';
  };

  const getCategoryIcon = (category) => {
    const icons = {
      concerts: '🎵',
      festivals: '🎭', 
      sports: '⚽',
      cultural: '🎨',
      community: '🤝'
    };
    return icons[category] || '📅';
  };

  const getCategoryName = (category) => {
    const names = {
      concerts: 'Live Concerts & Music',
      festivals: 'Festivals & Celebrations',
      sports: 'Sports & Games', 
      cultural: 'Cultural Events',
      community: 'Community Activities'
    };
    return names[category] || 'Events';
  };

  // Format date for display
  const formatDate = (dateStr) => {
    const date = new Date(dateStr);
    return date.toLocaleDateString('en-US', { 
      weekday: 'short', 
      month: 'short', 
      day: 'numeric' 
    });
  };

  // Format price for display
  const formatPrice = (price) => {
    if (!price) return 'Price TBA';
    if (price.toLowerCase().includes('free')) return '🆓 Free';
    return `💰 ${price}`;
  };

  return (
    <div className="bg-gradient-to-br from-purple-50 via-pink-50 to-orange-50 rounded-xl p-6 shadow-xl border border-purple-200 backdrop-blur-sm">
      {/* Header */}
      <div className="flex items-center space-x-3 mb-6">
        <div className="w-12 h-12 bg-gradient-to-br from-purple-500 to-pink-500 rounded-full flex items-center justify-center">
          <span className="text-white text-xl">🎪</span>
        </div>
        <div>
          <h3 className="text-xl font-bold text-purple-800">
            Events & Festivities in {city}
          </h3>
          <p className="text-sm text-purple-600">
            {travelPeriod} • {events.length} events found
          </p>
        </div>
      </div>

      {/* Events by Category */}
      <div className="space-y-6">
        {Object.entries(groupedEvents).map(([category, categoryEvents]) => {
          if (categoryEvents.length === 0) return null;

          return (
            <div key={category} className={`bg-gradient-to-r ${getCategoryStyle(category)} rounded-lg p-4 border`}>
              {/* Category Header */}
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center space-x-3">
                  <span className="text-2xl">{getCategoryIcon(category)}</span>
                  <div>
                    <h4 className="font-semibold text-gray-800">
                      {getCategoryName(category)}
                    </h4>
                    <p className="text-sm text-gray-600">
                      {categoryEvents.length} {categoryEvents.length === 1 ? 'event' : 'events'}
                    </p>
                  </div>
                </div>
              </div>

              {/* Events List */}
              <div className="space-y-3">
                {categoryEvents.map((event, index) => (
                  <div 
                    key={index}
                    className="bg-white bg-opacity-70 rounded-lg p-4 hover:bg-opacity-90 transition-all cursor-pointer border border-white border-opacity-50"
                    onClick={() => setExpandedEvent(expandedEvent === `${category}-${index}` ? null : `${category}-${index}`)}
                  >
                    {/* Event Header */}
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <h5 className="font-semibold text-gray-800 mb-1">
                          {event.name}
                        </h5>
                        <div className="flex items-center space-x-4 text-sm text-gray-600 mb-2">
                          <span className="flex items-center space-x-1">
                            <span>📅</span>
                            <span>{formatDate(event.date)}</span>
                          </span>
                          <span className="flex items-center space-x-1">
                            <span>🕐</span>
                            <span>{event.time || '20:00'}</span>
                          </span>
                          <span className="flex items-center space-x-1">
                            <span>📍</span>
                            <span>{event.venue}</span>
                          </span>
                        </div>
                        <div className="flex items-center space-x-2">
                          <span className="text-xs font-medium px-2 py-1 bg-gray-100 rounded-full">
                            {formatPrice(event.priceRange)}
                          </span>
                          {event.type && (
                            <span className="text-xs text-gray-500 px-2 py-1 bg-gray-50 rounded-full">
                              {event.type.replace('_', ' ')}
                            </span>
                          )}
                        </div>
                      </div>
                      <div className="text-gray-400">
                        {expandedEvent === `${category}-${index}` ? '▲' : '▼'}
                      </div>
                    </div>

                    {/* Expanded Details */}
                    {expandedEvent === `${category}-${index}` && (
                      <div className="mt-4 pt-4 border-t border-gray-200">
                        <p className="text-gray-700 text-sm mb-4 leading-relaxed">
                          {event.description}
                        </p>
                        
                        {/* Action Buttons */}
                        <div className="flex space-x-2">
                          {event.url && (
                            <a
                              href={event.url}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="px-3 py-2 bg-purple-500 hover:bg-purple-600 text-white text-sm rounded-lg transition-colors flex items-center space-x-2"
                            >
                              <span>🎟️</span>
                              <span>Get Tickets</span>
                            </a>
                          )}
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              // Add to calendar functionality could go here
                              navigator.clipboard.writeText(
                                `${event.name}\nDate: ${formatDate(event.date)} at ${event.time}\nVenue: ${event.venue}\n${event.description}`
                              );
                            }}
                            className="px-3 py-2 bg-white hover:bg-gray-50 text-gray-700 text-sm rounded-lg border border-gray-300 transition-colors flex items-center space-x-2"
                          >
                            <span>📋</span>
                            <span>Copy Details</span>
                          </button>
                        </div>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          );
        })}
      </div>

      {/* Events Summary */}
      <div className="mt-6 pt-4 border-t border-purple-200">
        <div className="grid grid-cols-2 md:grid-cols-5 gap-4 text-center">
          {Object.entries(groupedEvents).map(([category, categoryEvents]) => (
            <div key={category} className="bg-white bg-opacity-50 rounded-lg p-3">
              <div className="text-2xl mb-1">{getCategoryIcon(category)}</div>
              <div className="text-lg font-semibold text-gray-800">{categoryEvents.length}</div>
              <div className="text-xs text-gray-600 capitalize">{category}</div>
            </div>
          ))}
        </div>
      </div>

      {/* Pro Tip */}
      <div className="mt-4 p-4 bg-gradient-to-r from-blue-50 to-indigo-50 rounded-lg border border-blue-200">
        <div className="flex items-start space-x-3">
          <span className="text-blue-500 text-lg">💡</span>
          <div>
            <p className="text-sm text-blue-700 font-medium mb-1">Pro Tip</p>
            <p className="text-sm text-blue-600">
              Book tickets in advance for popular events! Prices may vary and availability changes frequently.
              Check event websites for the most up-to-date information.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default EventsCard;