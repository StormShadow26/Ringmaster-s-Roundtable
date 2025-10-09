// Travel Planning Utility - Detects and processes travel requests
export class TravelPlanningUtil {
  constructor() {
    // Patterns to detect travel planning requests
    this.travelPatterns = [
      /plan\s+a?\s*trip\s+to\s+([^,\s]+)(?:\s+from\s+([^,\s]+))?\s*(?:from|on|starting)?\s*([^,]*)/i,
      /(?:travel|go|visit|fly)\s+to\s+([^,\s]+)(?:\s+from\s+([^,\s]+))?\s*(?:on|from|starting)?\s*([^,]*)/i,
      /(?:book|find)\s+(?:flights?|trains?|buses?)\s+to\s+([^,\s]+)(?:\s+from\s+([^,\s]+))?\s*(?:on|from|starting)?\s*([^,]*)/i,
      /how\s+to\s+(?:get|reach|travel)\s+to\s+([^,\s]+)(?:\s+from\s+([^,\s]+))?\s*(?:on|from|starting)?\s*([^,]*)/i,
      /(?:cheap|best)\s+(?:flights?|way)\s+to\s+([^,\s]+)(?:\s+from\s+([^,\s]+))?\s*(?:on|from|starting)?\s*([^,]*)/i
    ];

    // Date patterns
    this.datePatterns = [
      /(\d{1,2}[\/\-]\d{1,2}[\/\-]\d{2,4})/g,
      /(\d{4}-\d{2}-\d{2})/g,
      /(january|february|march|april|may|june|july|august|september|october|november|december)\s+\d{1,2}(?:st|nd|rd|th)?(?:,?\s+\d{4})?/gi,
      /(jan|feb|mar|apr|may|jun|jul|aug|sep|oct|nov|dec)\s+\d{1,2}(?:st|nd|rd|th)?(?:,?\s+\d{4})?/gi,
      /next\s+(week|month|weekend)/gi,
      /tomorrow/gi,
      /this\s+(week|weekend|month)/gi,
      /in\s+(\d+)\s+(days?|weeks?|months?)/gi
    ];

    // City name patterns and common aliases
    this.cityAliases = {
      'nyc': 'New York',
      'ny': 'New York', 
      'la': 'Los Angeles',
      'sf': 'San Francisco',
      'chicago': 'Chicago',
      'miami': 'Miami',
      'vegas': 'Las Vegas',
      'dc': 'Washington',
      'boston': 'Boston',
      'seattle': 'Seattle',
      'denver': 'Denver',
      'atlanta': 'Atlanta',
      'dallas': 'Dallas',
      'houston': 'Houston',
      'phoenix': 'Phoenix',
      'philly': 'Philadelphia',
      'detroit': 'Detroit',
      'orlando': 'Orlando',
      'london': 'London',
      'paris': 'Paris',
      'tokyo': 'Tokyo',
      'delhi': 'Delhi',
      'mumbai': 'Mumbai',
      'bangalore': 'Bangalore',
      'chennai': 'Chennai',
      'kolkata': 'Kolkata',
      'hyderabad': 'Hyderabad',
      'dubai': 'Dubai',
      'singapore': 'Singapore',
      'bangkok': 'Bangkok',
      'sydney': 'Sydney',
      'toronto': 'Toronto'
    };
  }

  // Detect if a message is a travel planning request
  isTravelRequest(message) {
    const normalizedMessage = message.toLowerCase().trim();
    
    // Check against travel patterns
    for (const pattern of this.travelPatterns) {
      if (pattern.test(normalizedMessage)) {
        return true;
      }
    }
    
    // Additional keywords check
    const travelKeywords = [
      'trip', 'travel', 'fly', 'flight', 'plane', 'train', 'bus',
      'visit', 'vacation', 'holiday', 'journey', 'book', 'ticket',
      'destination', 'departure', 'arrival', 'airport', 'station'
    ];
    
    const destinationKeywords = [
      'to', 'destination', 'city', 'country', 'place'
    ];
    
    const hasTravelKeyword = travelKeywords.some(keyword => 
      normalizedMessage.includes(keyword)
    );
    
    const hasDestinationKeyword = destinationKeywords.some(keyword => 
      normalizedMessage.includes(keyword)
    );
    
    return hasTravelKeyword && hasDestinationKeyword;
  }

  // Extract travel details from message
  extractTravelDetails(message) {
    const normalizedMessage = message.toLowerCase().trim();
    let destination = null;
    let origin = null;
    let dates = [];

    // Try each pattern to extract destination and origin
    for (const pattern of this.travelPatterns) {
      const match = normalizedMessage.match(pattern);
      if (match) {
        destination = this.normalizeCity(match[1]);
        origin = match[2] ? this.normalizeCity(match[2]) : null;
        
        // Extract date information from the match or full message
        const dateString = match[3] || message;
        dates = this.extractDates(dateString);
        break;
      }
    }

    // If no destination found, try to extract city names
    if (!destination) {
      const cities = this.extractCityNames(message);
      if (cities.length > 0) {
        destination = cities[cities.length - 1]; // Last city mentioned is usually destination
        if (cities.length > 1) {
          origin = cities[0]; // First city mentioned is usually origin
        }
      }
    }

    // Extract dates if not found yet
    if (dates.length === 0) {
      dates = this.extractDates(message);
    }

    return {
      destination,
      origin,
      dates: dates.length > 0 ? dates : [this.getDefaultDate()],
      isRoundTrip: this.detectRoundTrip(message),
      passengers: this.extractPassengerCount(message),
      transportType: this.detectTransportPreference(message)
    };
  }

  // Normalize city names using aliases
  normalizeCity(cityName) {
    if (!cityName) return null;
    
    const normalized = cityName.toLowerCase().trim();
    
    // Check aliases first
    if (this.cityAliases[normalized]) {
      return this.cityAliases[normalized];
    }
    
    // Capitalize first letter of each word
    return cityName.split(' ')
      .map(word => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
      .join(' ');
  }

  // Extract city names from message
  extractCityNames(message) {
    const cities = [];
    const words = message.split(/\s+/);
    
    // Check for known city aliases and names
    for (let i = 0; i < words.length; i++) {
      const word = words[i].toLowerCase().replace(/[^\w]/g, '');
      
      // Check single word cities
      if (this.cityAliases[word]) {
        cities.push(this.cityAliases[word]);
      }
      
      // Check two-word city names
      if (i < words.length - 1) {
        const twoWords = `${word} ${words[i + 1].toLowerCase().replace(/[^\w]/g, '')}`;
        const twoWordCity = Object.values(this.cityAliases).find(city => 
          city.toLowerCase() === twoWords
        );
        if (twoWordCity) {
          cities.push(twoWordCity);
          i++; // Skip next word as it's part of the city name
        }
      }
    }
    
    return cities;
  }

  // Extract dates from text
  extractDates(text) {
    const dates = [];
    const today = new Date();
    
    // Check each date pattern
    for (const pattern of this.datePatterns) {
      const matches = text.match(pattern);
      if (matches) {
        matches.forEach(match => {
          const date = this.parseDate(match.toLowerCase());
          if (date && date >= today) {
            dates.push(date.toISOString().split('T')[0]);
          }
        });
      }
    }
    
    // Remove duplicates and sort
    return [...new Set(dates)].sort();
  }

  // Parse various date formats
  parseDate(dateString) {
    const today = new Date();
    const normalized = dateString.toLowerCase().trim();
    
    try {
      // Handle relative dates
      if (normalized === 'tomorrow') {
        const tomorrow = new Date(today);
        tomorrow.setDate(today.getDate() + 1);
        return tomorrow;
      }
      
      if (normalized === 'next week') {
        const nextWeek = new Date(today);
        nextWeek.setDate(today.getDate() + 7);
        return nextWeek;
      }
      
      if (normalized === 'next weekend') {
        const nextWeekend = new Date(today);
        const daysToAdd = 6 - today.getDay() + 7; // Next Saturday
        nextWeekend.setDate(today.getDate() + daysToAdd);
        return nextWeekend;
      }
      
      if (normalized === 'this weekend') {
        const thisWeekend = new Date(today);
        const daysToAdd = 6 - today.getDay(); // This Saturday
        thisWeekend.setDate(today.getDate() + daysToAdd);
        return thisWeekend;
      }
      
      if (normalized === 'next month') {
        const nextMonth = new Date(today);
        nextMonth.setMonth(today.getMonth() + 1);
        return nextMonth;
      }
      
      // Handle "in X days/weeks/months"
      const inPattern = /in\s+(\d+)\s+(days?|weeks?|months?)/;
      const inMatch = normalized.match(inPattern);
      if (inMatch) {
        const amount = parseInt(inMatch[1]);
        const unit = inMatch[2];
        const date = new Date(today);
        
        if (unit.startsWith('day')) {
          date.setDate(today.getDate() + amount);
        } else if (unit.startsWith('week')) {
          date.setDate(today.getDate() + (amount * 7));
        } else if (unit.startsWith('month')) {
          date.setMonth(today.getMonth() + amount);
        }
        
        return date;
      }
      
      // Try parsing as regular date
      const date = new Date(dateString);
      if (!isNaN(date.getTime())) {
        return date;
      }
      
      return null;
    } catch (error) {
      console.error('Date parsing error:', error);
      return null;
    }
  }

  // Get default date (next week)
  getDefaultDate() {
    const date = new Date();
    date.setDate(date.getDate() + 7);
    return date.toISOString().split('T')[0];
  }

  // Detect if it's a round trip
  detectRoundTrip(message) {
    const roundTripKeywords = [
      'round trip', 'return', 'back', 'both ways', 
      'return ticket', 'round-trip', 'coming back'
    ];
    
    const lowerMessage = message.toLowerCase();
    return roundTripKeywords.some(keyword => lowerMessage.includes(keyword));
  }

  // Extract passenger count
  extractPassengerCount(message) {
    const passengerPatterns = [
      /(\d+)\s+passengers?/i,
      /(\d+)\s+people/i,
      /(\d+)\s+adults?/i,
      /for\s+(\d+)/i
    ];
    
    for (const pattern of passengerPatterns) {
      const match = message.match(pattern);
      if (match) {
        const count = parseInt(match[1]);
        return count > 0 && count <= 9 ? count : 1;
      }
    }
    
    return 1; // Default to 1 passenger
  }

  // Detect transport preference
  detectTransportPreference(message) {
    const lowerMessage = message.toLowerCase();
    
    if (lowerMessage.includes('flight') || lowerMessage.includes('fly') || lowerMessage.includes('plane')) {
      return 'flights';
    }
    if (lowerMessage.includes('train') || lowerMessage.includes('railway')) {
      return 'trains';
    }
    if (lowerMessage.includes('bus') || lowerMessage.includes('coach')) {
      return 'buses';
    }
    
    return 'all'; // Show all options by default
  }

  // Generate a formatted response about the travel search
  generateSearchResponse(travelDetails, userLocation) {
    const { destination, origin, dates, passengers, transportType } = travelDetails;
    
    const fromLocation = origin || userLocation?.city || 'your location';
    const dateStr = dates.length > 0 ? dates[0] : 'soon';
    const passengerStr = passengers > 1 ? `for ${passengers} passengers` : '';
    
    return {
      message: `I'll help you plan your trip to ${destination}! 🌟\n\nSearching for travel options from ${fromLocation} to ${destination} on ${dateStr} ${passengerStr}.\n\nLet me find the best flights, trains, and buses with current pricing...`,
      searchParams: {
        destination,
        origin: fromLocation,
        dates,
        passengers,
        transportType,
        userLocation
      }
    };
  }
}

export default new TravelPlanningUtil();