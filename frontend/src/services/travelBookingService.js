// Travel Booking Service - Comprehensive transportation options
class TravelBookingService {
  constructor() {
    this.baseURL = 'http://localhost:5000/api/v1';
    // API Keys - these should be moved to environment variables
    this.amadeus = {
      clientId: import.meta.env.VITE_AMADEUS_CLIENT_ID,
      clientSecret: import.meta.env.VITE_AMADEUS_CLIENT_SECRET,
      baseURL: 'https://test.api.amadeus.com'
    };
    this.skyscanner = {
      apiKey: import.meta.env.VITE_SKYSCANNER_API_KEY,
      baseURL: 'https://skyscanner-skyscanner-flight-search-v1.p.rapidapi.com'
    };
  }

  // Get user's current location using geolocation
  async getCurrentLocation() {
    return new Promise((resolve, reject) => {
      if (!navigator.geolocation) {
        reject(new Error('Geolocation is not supported by this browser'));
        return;
      }

      navigator.geolocation.getCurrentPosition(
        async (position) => {
          const { latitude, longitude } = position.coords;
          try {
            // Reverse geocode to get city information
            const locationData = await this.reverseGeocode(latitude, longitude);
            resolve({
              lat: latitude,
              lon: longitude,
              city: locationData.city,
              country: locationData.country,
              airport: locationData.nearestAirport
            });
          } catch (error) {
            resolve({
              lat: latitude,
              lon: longitude,
              city: 'Unknown',
              country: 'Unknown',
              airport: null
            });
          }
        },
        (error) => {
          reject(new Error(`Geolocation error: ${error.message}`));
        },
        {
          enableHighAccuracy: true,
          timeout: 10000,
          maximumAge: 300000 // 5 minutes
        }
      );
    });
  }

  // Reverse geocode coordinates to city information
  async reverseGeocode(lat, lon) {
    try {
      const response = await fetch(
        `https://api.openweathermap.org/geo/1.0/reverse?lat=${lat}&lon=${lon}&limit=1&appid=${import.meta.env.VITE_OPENWEATHER_API_KEY}`
      );
      const data = await response.json();
      
      if (data && data.length > 0) {
        const location = data[0];
        return {
          city: location.name,
          country: location.country,
          state: location.state
        };
      }
      throw new Error('No location data found');
    } catch (error) {
      console.error('Reverse geocoding failed:', error);
      return {
        city: 'Unknown Location',
        country: 'Unknown',
        state: null
      };
    }
  }

  // Get airport codes for cities
  async getAirportCode(cityName) {
    try {
      // Using a simple airport mapping - in production, use a proper airport API
      const airportMap = {
        'New York': ['JFK', 'LGA', 'EWR'],
        'Los Angeles': ['LAX'],
        'Chicago': ['ORD', 'MDW'],
        'Miami': ['MIA'],
        'San Francisco': ['SFO'],
        'Las Vegas': ['LAS'],
        'Boston': ['BOS'],
        'Washington': ['DCA', 'BWI', 'IAD'],
        'Seattle': ['SEA'],
        'Denver': ['DEN'],
        'Atlanta': ['ATL'],
        'Dallas': ['DFW', 'DAL'],
        'Houston': ['IAH', 'HOU'],
        'Phoenix': ['PHX'],
        'Philadelphia': ['PHL'],
        'Detroit': ['DTW'],
        'Minneapolis': ['MSP'],
        'Orlando': ['MCO'],
        'London': ['LHR', 'LGW', 'STN'],
        'Paris': ['CDG', 'ORY'],
        'Tokyo': ['NRT', 'HND'],
        'Delhi': ['DEL'],
        'Mumbai': ['BOM'],
        'Bangalore': ['BLR'],
        'Chennai': ['MAA'],
        'Kolkata': ['CCU'],
        'Hyderabad': ['HYD'],
        'Dubai': ['DXB'],
        'Singapore': ['SIN'],
        'Bangkok': ['BKK'],
        'Hong Kong': ['HKG'],
        'Sydney': ['SYD'],
        'Melbourne': ['MEL'],
        'Toronto': ['YYZ'],
        'Vancouver': ['YVR']
      };

      const normalizedCity = cityName.toLowerCase();
      for (const [city, codes] of Object.entries(airportMap)) {
        if (city.toLowerCase().includes(normalizedCity) || normalizedCity.includes(city.toLowerCase())) {
          return codes[0]; // Return primary airport
        }
      }
      return null;
    } catch (error) {
      console.error('Airport code lookup failed:', error);
      return null;
    }
  }

  // Parse date ranges from natural language
  parseDateRange(dateString) {
    try {
      const today = new Date();
      const cleanString = dateString.toLowerCase();
      
      // Common patterns
      if (cleanString.includes('tomorrow')) {
        const tomorrow = new Date(today);
        tomorrow.setDate(today.getDate() + 1);
        return {
          departure: tomorrow.toISOString().split('T')[0],
          return: null
        };
      }
      
      if (cleanString.includes('next week')) {
        const nextWeek = new Date(today);
        nextWeek.setDate(today.getDate() + 7);
        return {
          departure: nextWeek.toISOString().split('T')[0],
          return: null
        };
      }

      // Look for date patterns (YYYY-MM-DD, MM/DD/YYYY, etc.)
      const dateRegex = /(\d{4}-\d{2}-\d{2}|\d{1,2}\/\d{1,2}\/\d{4}|\d{1,2}-\d{1,2}-\d{4})/g;
      const dates = dateString.match(dateRegex);
      
      if (dates && dates.length >= 1) {
        return {
          departure: this.normalizeDate(dates[0]),
          return: dates.length > 1 ? this.normalizeDate(dates[1]) : null
        };
      }

      // Default to next week if no specific date found
      const defaultDate = new Date(today);
      defaultDate.setDate(today.getDate() + 7);
      return {
        departure: defaultDate.toISOString().split('T')[0],
        return: null
      };
    } catch (error) {
      console.error('Date parsing failed:', error);
      const fallbackDate = new Date();
      fallbackDate.setDate(fallbackDate.getDate() + 7);
      return {
        departure: fallbackDate.toISOString().split('T')[0],
        return: null
      };
    }
  }

  // Normalize date to YYYY-MM-DD format
  normalizeDate(dateString) {
    try {
      const date = new Date(dateString);
      return date.toISOString().split('T')[0];
    } catch (error) {
      return new Date().toISOString().split('T')[0];
    }
  }

  // Search flights using multiple APIs
  async searchFlights(origin, destination, departureDate, returnDate = null) {
    console.log('🔍 searchFlights called with:', { origin, destination, departureDate, returnDate });
    
    try {
      const results = await Promise.allSettled([
        this.searchFlightsAmadeus(origin, destination, departureDate, returnDate),
        this.searchFlightsSkyscanner(origin, destination, departureDate, returnDate),
        this.searchFlightsFallback(origin, destination, departureDate, returnDate)
      ]);

      console.log('📊 Flight search results:', results.map(r => ({ status: r.status, hasValue: !!r.value })));

      // Combine results from successful API calls
      const flights = [];
      results.forEach((result, index) => {
        const apiNames = ['Amadeus', 'Skyscanner', 'Fallback'];
        if (result.status === 'fulfilled' && result.value) {
          console.log(`✅ ${apiNames[index]}: ${Array.isArray(result.value) ? result.value.length : 'Invalid'} flights`);
          if (Array.isArray(result.value)) {
            flights.push(...result.value);
          }
        } else {
          console.log(`❌ ${apiNames[index]}: ${result.status === 'rejected' ? result.reason?.message || 'Failed' : 'No data'}`);
        }
      });

      console.log(`✈️ Total flights combined: ${flights.length}`);

      // If no flights found from APIs, return mock data
      if (flights.length === 0) {
        console.log('⚠️ No flights from APIs, returning mock data');
        return this.getMockFlights(origin, destination, departureDate);
      }

      // Sort by price
      return flights.sort((a, b) => parseFloat(a.price) - parseFloat(b.price));
    } catch (error) {
      console.error('❌ Flight search failed:', error);
      return this.getMockFlights(origin, destination, departureDate);
    }
  }

  // Amadeus flight search
  async searchFlightsAmadeus(origin, destination, departureDate, returnDate) {
    try {
      // First get access token
      const tokenResponse = await fetch(`${this.amadeus.baseURL}/v1/security/oauth2/token`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded'
        },
        body: `grant_type=client_credentials&client_id=${this.amadeus.clientId}&client_secret=${this.amadeus.clientSecret}`
      });

      if (!tokenResponse.ok) {
        throw new Error('Failed to get Amadeus token');
      }

      const tokenData = await tokenResponse.json();
      const accessToken = tokenData.access_token;

      // Search flights
      const params = new URLSearchParams({
        originLocationCode: origin,
        destinationLocationCode: destination,
        departureDate: departureDate,
        adults: '1',
        max: '10'
      });

      if (returnDate) {
        params.append('returnDate', returnDate);
      }

      const flightResponse = await fetch(
        `${this.amadeus.baseURL}/v2/shopping/flight-offers?${params}`,
        {
          headers: {
            'Authorization': `Bearer ${accessToken}`
          }
        }
      );

      if (!flightResponse.ok) {
        throw new Error('Amadeus flight search failed');
      }

      const flightData = await flightResponse.json();
      return this.parseAmadeusFlights(flightData.data || []);
    } catch (error) {
      console.error('Amadeus API error:', error);
      return [];
    }
  }

  // Parse Amadeus flight response
  parseAmadeusFlights(flightOffers) {
    return flightOffers.map(offer => {
      const itinerary = offer.itineraries[0];
      const segment = itinerary.segments[0];
      
      return {
        id: offer.id,
        airline: segment.carrierCode,
        flightNumber: `${segment.carrierCode}${segment.number}`,
        departure: {
          airport: segment.departure.iataCode,
          time: segment.departure.at,
          terminal: segment.departure.terminal
        },
        arrival: {
          airport: segment.arrival.iataCode,
          time: segment.arrival.at,
          terminal: segment.arrival.terminal
        },
        duration: itinerary.duration,
        price: offer.price.total,
        currency: offer.price.currency,
        bookingClass: segment.cabin,
        aircraft: segment.aircraft?.code,
        stops: itinerary.segments.length - 1,
        type: 'flight',
        provider: 'Amadeus'
      };
    });
  }

  // Skyscanner flight search (mock implementation)
  async searchFlightsSkyscanner(origin, destination, departureDate, returnDate) {
    try {
      // Note: Skyscanner's API requires special access
      // This is a mock implementation
      return this.getMockFlights(origin, destination, departureDate, 'Skyscanner');
    } catch (error) {
      console.error('Skyscanner API error:', error);
      return [];
    }
  }

  // Fallback flight search with mock data
  async searchFlightsFallback(origin, destination, departureDate, returnDate) {
    return this.getMockFlights(origin, destination, departureDate, 'TravelBooking');
  }

  // Generate realistic mock flight data
  getMockFlights(origin, destination, departureDate, provider = 'MockAir') {
    const airlines = [
      { code: 'AA', name: 'American Airlines' },
      { code: 'DL', name: 'Delta Air Lines' },
      { code: 'UA', name: 'United Airlines' },
      { code: 'SW', name: 'Southwest Airlines' },
      { code: 'AI', name: 'Air India' },
      { code: 'EK', name: 'Emirates' },
      { code: 'LH', name: 'Lufthansa' },
      { code: 'BA', name: 'British Airways' }
    ];

    // Safely parse the departure date
    let parsedDate;
    if (departureDate instanceof Date) {
      parsedDate = departureDate;
    } else if (typeof departureDate === 'string') {
      parsedDate = new Date(departureDate);
    } else {
      parsedDate = new Date(); // Default to today
    }

    // Ensure we have a valid date
    if (isNaN(parsedDate.getTime())) {
      parsedDate = new Date(); // Fallback to today if invalid
    }

    const basePrice = 200 + Math.random() * 800;
    const flights = [];

    for (let i = 0; i < 5; i++) {
      const airline = airlines[Math.floor(Math.random() * airlines.length)];
      const departureHour = 6 + Math.floor(Math.random() * 16);
      const flightDuration = 2 + Math.random() * 10; // 2-12 hours
      
      // Create departure date using the parsed date
      const departure = new Date(parsedDate);
      departure.setHours(departureHour, Math.floor(Math.random() * 60), 0, 0);
      
      const arrival = new Date(departure.getTime() + (flightDuration * 60 * 60 * 1000));

      flights.push({
        id: `${provider}-${origin}-${destination}-${i}`,
        airline: airline.code,
        airlineName: airline.name,
        flightNumber: `${airline.code}${Math.floor(1000 + Math.random() * 9000)}`,
        departure: {
          airport: origin,
          time: departure.toISOString(),
          terminal: Math.random() > 0.5 ? String(Math.floor(1 + Math.random() * 3)) : null
        },
        arrival: {
          airport: destination,
          time: arrival.toISOString(),
          terminal: Math.random() > 0.5 ? String(Math.floor(1 + Math.random() * 3)) : null
        },
        duration: `${Math.floor(flightDuration)}h ${Math.floor((flightDuration % 1) * 60)}m`,
        price: (basePrice + (Math.random() * 300) - 150).toFixed(0),
        currency: 'USD',
        bookingClass: Math.random() > 0.7 ? 'Business' : 'Economy',
        aircraft: ['Boeing 737', 'Airbus A320', 'Boeing 777', 'Airbus A330'][Math.floor(Math.random() * 4)],
        stops: Math.random() > 0.7 ? 1 : 0,
        type: 'flight',
        provider: provider,
        amenities: [
          'WiFi Available',
          'In-flight Entertainment',
          'Meal Included',
          'Extra Legroom Available'
        ].filter(() => Math.random() > 0.5)
      });
    }

    return flights.sort((a, b) => parseFloat(a.price) - parseFloat(b.price));
  }

  // Search trains
  async searchTrains(origin, destination, departureDate) {
    try {
      // Mock train data - in production, integrate with actual train APIs
      return this.getMockTrains(origin, destination, departureDate);
    } catch (error) {
      console.error('Train search failed:', error);
      return [];
    }
  }

  // Generate mock train data
  getMockTrains(origin, destination, departureDate) {
    const trainOperators = [
      { code: 'AMTK', name: 'Amtrak' },
      { code: 'IRCTC', name: 'Indian Railways' },
      { code: 'DB', name: 'Deutsche Bahn' },
      { code: 'SNCF', name: 'SNCF Connect' },
      { code: 'JR', name: 'Japan Railways' }
    ];

    // Safely parse the departure date
    let parsedDate;
    if (departureDate instanceof Date) {
      parsedDate = departureDate;
    } else if (typeof departureDate === 'string') {
      parsedDate = new Date(departureDate);
    } else {
      parsedDate = new Date(); // Default to today
    }

    // Ensure we have a valid date
    if (isNaN(parsedDate.getTime())) {
      parsedDate = new Date(); // Fallback to today if invalid
    }

    const trains = [];
    const basePrice = 50 + Math.random() * 200;

    for (let i = 0; i < 3; i++) {
      const operator = trainOperators[Math.floor(Math.random() * trainOperators.length)];
      const departureHour = 6 + Math.floor(Math.random() * 16);
      const journeyDuration = 3 + Math.random() * 8; // 3-11 hours
      
      // Create departure date using the parsed date
      const departure = new Date(parsedDate);
      departure.setHours(departureHour, Math.floor(Math.random() * 60), 0, 0);
      
      const arrival = new Date(departure.getTime() + (journeyDuration * 60 * 60 * 1000));

      trains.push({
        id: `train-${origin}-${destination}-${i}`,
        operator: operator.code,
        operatorName: operator.name,
        trainNumber: `${operator.code}${Math.floor(100 + Math.random() * 900)}`,
        departure: {
          station: `${origin} Central`,
          time: departure.toISOString(),
          platform: Math.floor(1 + Math.random() * 10).toString()
        },
        arrival: {
          station: `${destination} Central`,
          time: arrival.toISOString(),
          platform: Math.floor(1 + Math.random() * 10).toString()
        },
        duration: `${Math.floor(journeyDuration)}h ${Math.floor((journeyDuration % 1) * 60)}m`,
        price: (basePrice + (Math.random() * 100) - 50).toFixed(0),
        currency: 'USD',
        class: Math.random() > 0.6 ? 'First Class' : 'Second Class',
        type: 'train',
        provider: 'Railways',
        amenities: [
          'WiFi Available',
          'Food Service',
          'Power Outlets',
          'Air Conditioning'
        ].filter(() => Math.random() > 0.4)
      });
    }

    return trains.sort((a, b) => parseFloat(a.price) - parseFloat(b.price));
  }

  // Search buses
  async searchBuses(origin, destination, departureDate) {
    try {
      return this.getMockBuses(origin, destination, departureDate);
    } catch (error) {
      console.error('Bus search failed:', error);
      return [];
    }
  }

  // Generate mock bus data
  getMockBuses(origin, destination, departureDate) {
    const busOperators = [
      { code: 'GH', name: 'Greyhound' },
      { code: 'MB', name: 'Megabus' },
      { code: 'FB', name: 'FlixBus' },
      { code: 'RB', name: 'RedBus' }
    ];

    // Safely parse the departure date
    let parsedDate;
    if (departureDate instanceof Date) {
      parsedDate = departureDate;
    } else if (typeof departureDate === 'string') {
      parsedDate = new Date(departureDate);
    } else {
      parsedDate = new Date(); // Default to today
    }

    // Ensure we have a valid date
    if (isNaN(parsedDate.getTime())) {
      parsedDate = new Date(); // Fallback to today if invalid
    }

    const buses = [];
    const basePrice = 25 + Math.random() * 75;

    for (let i = 0; i < 4; i++) {
      const operator = busOperators[Math.floor(Math.random() * busOperators.length)];
      const departureHour = 6 + Math.floor(Math.random() * 18);
      const journeyDuration = 4 + Math.random() * 12; // 4-16 hours
      
      // Create departure date using the parsed date
      const departure = new Date(parsedDate);
      departure.setHours(departureHour, Math.floor(Math.random() * 60), 0, 0);
      
      const arrival = new Date(departure.getTime() + (journeyDuration * 60 * 60 * 1000));

      buses.push({
        id: `bus-${origin}-${destination}-${i}`,
        operator: operator.code,
        operatorName: operator.name,
        busNumber: `${operator.code}${Math.floor(100 + Math.random() * 900)}`,
        departure: {
          station: `${origin} Bus Terminal`,
          time: departure.toISOString(),
          gate: String(Math.floor(1 + Math.random() * 20))
        },
        arrival: {
          station: `${destination} Bus Terminal`,
          time: arrival.toISOString(),
          gate: String(Math.floor(1 + Math.random() * 20))
        },
        duration: `${Math.floor(journeyDuration)}h ${Math.floor((journeyDuration % 1) * 60)}m`,
        price: (basePrice + (Math.random() * 40) - 20).toFixed(0),
        currency: 'USD',
        class: Math.random() > 0.7 ? 'Premium' : 'Standard',
        type: 'bus',
        provider: 'BusLines',
        amenities: [
          'WiFi Available',
          'Reclining Seats',
          'USB Charging',
          'Restroom Onboard'
        ].filter(() => Math.random() > 0.5)
      });
    }

    return buses.sort((a, b) => parseFloat(a.price) - parseFloat(b.price));
  }

  // Comprehensive travel search
  async searchAllTransportation(origin, destination, departureDate, returnDate = null) {
    console.log('🚀 TravelBookingService.searchAllTransportation called with:', {
      origin,
      destination, 
      departureDate,
      returnDate
    });
    
    try {
      console.log('📡 Starting parallel transportation searches...');
      const [flights, trains, buses] = await Promise.allSettled([
        this.searchFlights(origin, destination, departureDate, returnDate),
        this.searchTrains(origin, destination, departureDate),
        this.searchBuses(origin, destination, departureDate)
      ]);

      console.log('✅ Search results:', {
        flights: flights.status,
        trains: trains.status,
        buses: buses.status
      });

      const result = {
        flights: flights.status === 'fulfilled' ? flights.value : [],
        trains: trains.status === 'fulfilled' ? trains.value : [],
        buses: buses.status === 'fulfilled' ? buses.value : [],
        searchParams: {
          origin,
          destination,
          departureDate,
          returnDate
        }
      };

      console.log('📊 Final transportation results:', {
        flightCount: result.flights.length,
        trainCount: result.trains.length,
        busCount: result.buses.length
      });

      return result;
    } catch (error) {
      console.error('❌ Transportation search failed:', error);
      throw error;
    }
  }
}

export default new TravelBookingService();