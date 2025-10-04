// backend/mcp/mcpServer.js
import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { z } from "zod";
import fetch from "node-fetch"; // only needed if Node <18
import dotenv from "dotenv";

dotenv.config();

const OPENWEATHER_API_KEY = process.env.OPENWEATHER_API_KEY;
const GOOGLE_PLACES_API_KEY = process.env.GOOGLE_PLACES_API_KEY;
const FOURSQUARE_API_KEY = process.env.FOURSQUARE_API_KEY;
const EVENTBRITE_API_KEY = process.env.EVENTBRITE_API_KEY;
const TICKETMASTER_API_KEY = process.env.TICKETMASTER_API_KEY;

if (!OPENWEATHER_API_KEY) {
  throw new Error("OPENWEATHER_API_KEY not set in .env");
}

// Google Places and Foursquare are optional - fallback to static data if not available
if (!GOOGLE_PLACES_API_KEY) {
  console.warn("⚠️ GOOGLE_PLACES_API_KEY not set - using fallback attraction data");
}
if (!FOURSQUARE_API_KEY) {
  console.warn("⚠️ FOURSQUARE_API_KEY not set - using fallback attraction data");
}

// Event APIs are optional - fallback to curated events if not available
if (!EVENTBRITE_API_KEY) {
  console.warn("⚠️ EVENTBRITE_API_KEY not set - using fallback event data");
}
if (!TICKETMASTER_API_KEY) {
  console.warn("⚠️ TICKETMASTER_API_KEY not set - using fallback event data");
}

// Create MCP server
export const server = new McpServer({
  name: "weatherData",
  version: "1.0.0",
});

// --- Cache for API results (in-memory cache to reduce API calls) ---
const attractionCache = new Map();
const eventsCache = new Map();
const CACHE_DURATION = 24 * 60 * 60 * 1000; // 24 hours
const EVENTS_CACHE_DURATION = 6 * 60 * 60 * 1000; // 6 hours (events change more frequently)

// --- Rate limiting for APIs ---
const apiCallTracker = {
  googlePlaces: { calls: 0, resetTime: Date.now() + (60 * 60 * 1000) }, // Reset every hour
  foursquare: { calls: 0, resetTime: Date.now() + (60 * 60 * 1000) },
  eventbrite: { calls: 0, resetTime: Date.now() + (60 * 60 * 1000) },
  ticketmaster: { calls: 0, resetTime: Date.now() + (60 * 60 * 1000) }
};

const API_LIMITS = {
  googlePlaces: 100, // Conservative limit per hour
  foursquare: 50,    // Conservative limit per hour
  eventbrite: 200,   // Eventbrite is more generous
  ticketmaster: 100  // Ticketmaster rate limit
};

function canMakeAPICall(apiName) {
  const tracker = apiCallTracker[apiName];
  
  // Reset counter if time has passed
  if (Date.now() > tracker.resetTime) {
    tracker.calls = 0;
    tracker.resetTime = Date.now() + (60 * 60 * 1000);
  }
  
  // Check if we're under the limit
  if (tracker.calls >= API_LIMITS[apiName]) {
    console.warn(`⚠️ ${apiName} API rate limit reached. Using fallback data.`);
    return false;
  }
  
  tracker.calls++;
  return true;
}

function getCachedAttractions(city) {
  const cached = attractionCache.get(city.toLowerCase());
  if (cached && (Date.now() - cached.timestamp) < CACHE_DURATION) {
    console.log(`📦 Using cached attractions for ${city}`);
    return cached.data;
  }
  return null;
}

function setCachedAttractions(city, data) {
  attractionCache.set(city.toLowerCase(), {
    data,
    timestamp: Date.now()
  });
  console.log(`💾 Cached attractions for ${city}`);
}

// --- Events Cache Functions ---
function getCachedEvents(city, startDate, endDate) {
  const cacheKey = `${city.toLowerCase()}-${startDate}-${endDate}`;
  const cached = eventsCache.get(cacheKey);
  if (cached && (Date.now() - cached.timestamp) < EVENTS_CACHE_DURATION) {
    console.log(`📦 Using cached events for ${city} (${startDate} to ${endDate})`);
    return cached.data;
  }
  return null;
}

function setCachedEvents(city, startDate, endDate, data) {
  const cacheKey = `${city.toLowerCase()}-${startDate}-${endDate}`;
  eventsCache.set(cacheKey, {
    data,
    timestamp: Date.now()
  });
  console.log(`💾 Cached events for ${city} (${startDate} to ${endDate})`);
}

// --- Helper function to clean and validate attraction names ---
function cleanAttractionName(name) {
  if (!name || typeof name !== 'string') return null;
  
  // Remove common suffixes that don't add value
  const cleaned = name
    .replace(/\s+(Restaurant|Cafe|Bar|Shop|Store|Hotel|Mall)$/i, '')
    .replace(/\s+(Branch|Location|Outlet)$/i, '')
    .trim();
  
  // Filter out generic/low-quality names
  const invalidNames = [
    'untitled', 'unnamed', 'unknown', 'n/a', 'tbd',
    'parking', 'atm', 'toilet', 'restroom', 'wc'
  ];
  
  if (invalidNames.some(invalid => cleaned.toLowerCase().includes(invalid))) {
    return null;
  }
  
  // Must be at least 3 characters and not all numbers
  if (cleaned.length < 3 || /^\d+$/.test(cleaned)) {
    return null;
  }
  
  return cleaned;
}

// --- Helper function to merge and deduplicate attractions ---
function mergeAttractions(apiAttractions, staticAttractions) {
  const merged = {};
  
  for (const category in staticAttractions) {
    const apiList = apiAttractions[category] || [];
    const staticList = staticAttractions[category] || [];
    
    // Clean API results
    const cleanedApi = apiList
      .map(cleanAttractionName)
      .filter(name => name !== null);
    
    // Combine and deduplicate
    const combined = [...cleanedApi, ...staticList];
    merged[category] = [...new Set(combined)].slice(0, 8); // Max 8 per category
  }
  
  return merged;
}

// --- API Status and Health Check ---
function getAPIStatus() {
  const status = {
    apis: {
      openweather: !!OPENWEATHER_API_KEY,
      gemini: !!process.env.GEMINI_API_KEY,
      googlePlaces: !!GOOGLE_PLACES_API_KEY,
      foursquare: !!FOURSQUARE_API_KEY,
      eventbrite: !!EVENTBRITE_API_KEY,
      ticketmaster: !!TICKETMASTER_API_KEY
    },
    rateLimits: {
      googlePlaces: {
        used: apiCallTracker.googlePlaces.calls,
        limit: API_LIMITS.googlePlaces,
        resetTime: new Date(apiCallTracker.googlePlaces.resetTime).toISOString()
      },
      foursquare: {
        used: apiCallTracker.foursquare.calls,
        limit: API_LIMITS.foursquare,
        resetTime: new Date(apiCallTracker.foursquare.resetTime).toISOString()
      },
      eventbrite: {
        used: apiCallTracker.eventbrite.calls,
        limit: API_LIMITS.eventbrite,
        resetTime: new Date(apiCallTracker.eventbrite.resetTime).toISOString()
      },
      ticketmaster: {
        used: apiCallTracker.ticketmaster.calls,
        limit: API_LIMITS.ticketmaster,
        resetTime: new Date(apiCallTracker.ticketmaster.resetTime).toISOString()
      }
    },
    cache: {
      attractions: {
        entries: attractionCache.size,
        cities: Array.from(attractionCache.keys())
      },
      events: {
        entries: eventsCache.size,
        queries: Array.from(eventsCache.keys())
      }
    }
  };
  
  console.log("🔧 API Status:", JSON.stringify(status, null, 2));
  return status;
}

// Log API status on startup
console.log("🚀 MCP Server starting with enhanced API integrations...");
getAPIStatus();

// --- Dynamic Travel Places Fetcher with Real APIs ---
async function getAttractionsForCity(city, lat, lon) {
  try {
    console.log(`🔍 Fetching attractions for ${city} at (${lat}, ${lon})`);
    
    // 1. Check cache first
    const cached = getCachedAttractions(city);
    if (cached) {
      return cached;
    }
    
    // 2. Try real APIs first, then fallback to static data
    let attractions = null;
    
    // 3. Try Google Places API first (most comprehensive)
    if (GOOGLE_PLACES_API_KEY) {
      const startTime = Date.now();
      attractions = await getGooglePlacesAttractions(city, lat, lon);
      const duration = Date.now() - startTime;
      
      if (attractions && Object.keys(attractions).length > 0) {
        const totalPlaces = Object.values(attractions).reduce((sum, arr) => sum + arr.length, 0);
        console.log(`✅ Google Places API: ${totalPlaces} attractions in ${duration}ms for ${city}`);
        setCachedAttractions(city, attractions);
        return attractions;
      }
    }
    
    // 4. Try Foursquare API as backup
    if (FOURSQUARE_API_KEY) {
      const startTime = Date.now();
      attractions = await getFoursquareAttractions(city, lat, lon);
      const duration = Date.now() - startTime;
      
      if (attractions && Object.keys(attractions).length > 0) {
        const totalPlaces = Object.values(attractions).reduce((sum, arr) => sum + arr.length, 0);
        console.log(`✅ Foursquare API: ${totalPlaces} attractions in ${duration}ms for ${city}`);
        setCachedAttractions(city, attractions);
        return attractions;
      }
    }
    
    // 5. Fallback to static database + dynamic generation
    console.log(`⚠️ Using static/generated attractions for ${city}`);
    attractions = await generateAttractionsForCity(city, lat, lon);
    
    // Cache even fallback data to improve performance
    setCachedAttractions(city, attractions);
    return attractions;
    
  } catch (err) {
    console.error("❌ Error fetching attractions:", err);
    // Emergency fallback to ensure system never breaks
    return generateFallbackAttractions(city);
  }
}

// --- Google Places API Integration ---
async function getGooglePlacesAttractions(city, lat, lon) {
  if (!GOOGLE_PLACES_API_KEY || !canMakeAPICall('googlePlaces')) return null;
  
  try {
    const radius = 25000; // 25km radius
    const attractions = {
      outdoor: [],
      indoor: [],
      heritage: [],
      adventure: [],
      nightlife: [],
      beaches: []
    };

    // Define search queries for different attraction types
    const searchQueries = {
      outdoor: ['park', 'garden', 'viewpoint', 'square', 'landmark'],
      indoor: ['museum', 'gallery', 'shopping_mall', 'aquarium', 'library'],
      heritage: ['church', 'temple', 'mosque', 'historical_site', 'monument'],
      adventure: ['amusement_park', 'zoo', 'stadium', 'tourist_attraction'],
      nightlife: ['restaurant', 'bar', 'night_club', 'cafe'],
      beaches: ['beach', 'waterfront']
    };

    // Fetch places for each category
    for (const [category, types] of Object.entries(searchQueries)) {
      for (const type of types) {
        try {
          const url = `https://maps.googleapis.com/maps/api/place/nearbysearch/json?location=${lat},${lon}&radius=${radius}&type=${type}&key=${GOOGLE_PLACES_API_KEY}`;
          
          const response = await fetch(url);
          const data = await response.json();
          
          if (data.results && data.results.length > 0) {
            // Get top-rated places (rating >= 4.0 or no rating)
            const goodPlaces = data.results
              .filter(place => !place.rating || place.rating >= 4.0)
              .slice(0, 4) // Limit to top 4 per type
              .map(place => cleanAttractionName(place.name))
              .filter(name => name !== null);
            
            attractions[category].push(...goodPlaces);
          }
        } catch (err) {
          console.error(`❌ Error fetching ${type} from Google Places:`, err);
        }
      }
      
      // Remove duplicates and limit to 6 per category
      attractions[category] = [...new Set(attractions[category])].slice(0, 6);
    }

    // Only return if we got meaningful data
    const totalAttractions = Object.values(attractions).reduce((sum, arr) => sum + arr.length, 0);
    if (totalAttractions > 5) {
      return attractions;
    }
    
    return null; // Not enough data, let other methods try
    
  } catch (err) {
    console.error("❌ Google Places API error:", err);
    return null;
  }
}

// --- Foursquare API Integration ---
async function getFoursquareAttractions(city, lat, lon) {
  if (!FOURSQUARE_API_KEY || !canMakeAPICall('foursquare')) return null;
  
  try {
    const radius = 25000; // 25km radius
    const attractions = {
      outdoor: [],
      indoor: [],
      heritage: [],
      adventure: [],
      nightlife: [],
      beaches: []
    };

    // Foursquare category mappings
    const categoryQueries = {
      outdoor: 'outdoors',
      indoor: 'arts,shops',
      heritage: 'landmarks,religious',
      adventure: 'entertainment,recreation',
      nightlife: 'food,nightlife',
      beaches: 'beaches,waterfront'
    };

    for (const [category, query] of Object.entries(categoryQueries)) {
      try {
        const url = `https://api.foursquare.com/v3/places/search?ll=${lat},${lon}&radius=${radius}&categories=${query}&limit=10`;
        
        const response = await fetch(url, {
          headers: {
            'Authorization': FOURSQUARE_API_KEY,
            'Accept': 'application/json'
          }
        });
        
        const data = await response.json();
        
        if (data.results && data.results.length > 0) {
          const places = data.results
            .slice(0, 6) // Top 6 per category
            .map(place => cleanAttractionName(place.name))
            .filter(name => name !== null);
          
          attractions[category] = places;
        }
      } catch (err) {
        console.error(`❌ Error fetching ${category} from Foursquare:`, err);
      }
    }

    // Check if we got meaningful data
    const totalAttractions = Object.values(attractions).reduce((sum, arr) => sum + arr.length, 0);
    if (totalAttractions > 5) {
      return attractions;
    }
    
    return null;
    
  } catch (err) {
    console.error("❌ Foursquare API error:", err);
    return null;
  }
}

// Generate attractions using city knowledge and coordinates (FALLBACK)
async function generateAttractionsForCity(city, lat, lon) {
  // This is a comprehensive list based on common travel categories
  // In a real implementation, you'd use APIs like Google Places, Foursquare, etc.
  
  const cityLower = city.toLowerCase();
  
  // Define common attraction types for any city
  const baseAttractions = {
    outdoor: [
      `${city} City Center`,
      `${city} Walking Tours`,
      `${city} Parks and Gardens`,
      `${city} Viewpoints`
    ],
    indoor: [
      `${city} Museums`,
      `${city} Art Galleries`, 
      `${city} Shopping Centers`,
      `${city} Cultural Centers`
    ],
    heritage: [
      `${city} Historic Sites`,
      `${city} Religious Places`,
      `${city} Architecture Tours`,
      `${city} Local Markets`
    ],
    adventure: [
      `${city} Adventure Activities`,
      `${city} Sports Centers`,
      `${city} Nature Trails`,
      `${city} Local Experiences`
    ],
    nightlife: [
      `${city} Restaurants`,
      `${city} Cafes and Bars`,
      `${city} Entertainment District`,
      `${city} Local Cuisine Tours`
    ]
  };

  // Add specific attractions for well-known cities
  const specificAttractions = getSpecificCityAttractions(cityLower);
  
  // Merge base and specific attractions (now serves as fallback only)
  const fallbackAttractions = {
    outdoor: specificAttractions.outdoor || baseAttractions.outdoor,
    indoor: specificAttractions.indoor || baseAttractions.indoor,
    heritage: specificAttractions.heritage || baseAttractions.heritage,
    adventure: specificAttractions.adventure || baseAttractions.adventure,
    nightlife: specificAttractions.nightlife || baseAttractions.nightlife,
    beaches: specificAttractions.beaches || []
  };
  
  return fallbackAttractions;
}

// Specific attractions for popular cities (expandable database)
function getSpecificCityAttractions(cityLower) {
  const knownCities = {
    // India
    goa: {
      beaches: ["Baga Beach", "Calangute Beach", "Anjuna Beach", "Palolem Beach"],
      indoor: ["Basilica of Bom Jesus", "Se Cathedral", "Goa State Museum", "Reis Magos Fort"],
      adventure: ["Dudhsagar Falls", "Spice Plantations", "River Cruising", "Water Sports"],
      nightlife: ["Tito's Bar", "Club Cubana", "Shiva Valley", "Casino Royale"],
      heritage: ["Old Goa Churches", "Fontainhas Latin Quarter", "Chapora Fort", "Aguada Fort"]
    },
    mumbai: {
      beaches: ["Juhu Beach", "Marine Drive", "Versova Beach", "Aksa Beach"],
      indoor: ["Gateway of India", "Chhatrapati Shivaji Museum", "Siddhivinayak Temple", "Crawford Market"],
      adventure: ["Elephanta Caves", "Sanjay Gandhi National Park", "Kanheri Caves", "Film City Tours"],
      nightlife: ["Leopold Cafe", "Cafe Mondegar", "Trilogy", "Hard Rock Cafe"],
      heritage: ["Victoria Terminus", "Dhobi Ghat", "Mani Bhavan", "Haji Ali Dargah"]
    },
    delhi: {
      beaches: [],
      indoor: ["Red Fort", "India Gate", "Lotus Temple", "Akshardham Temple"],
      adventure: ["Chandni Chowk Tours", "Yamuna River Boating", "Adventure Island", "Kingdom of Dreams"],
      nightlife: ["Connaught Place", "Hauz Khas Village", "Cyber Hub", "Khan Market"],
      heritage: ["Qutub Minar", "Humayun's Tomb", "Jama Masjid", "Raj Ghat"]
    },
    bangalore: {
      beaches: [],
      indoor: ["Bangalore Palace", "Vidhana Soudha", "ISKCON Temple", "Bull Temple"],
      adventure: ["Nandi Hills", "Bannerghatta National Park", "Innovative Film City", "Wonderla"],
      nightlife: ["MG Road", "Brigade Road", "Koramangala", "UB City Mall"],
      heritage: ["Tipu Sultan's Palace", "Cubbon Park", "Lalbagh Gardens", "KR Market"]
    },
    // International Cities
    paris: {
      beaches: [],
      indoor: ["Louvre Museum", "Notre-Dame Cathedral", "Sacré-Cœur", "Musée d'Orsay"],
      adventure: ["Seine River Cruise", "Montmartre Walking Tour", "Versailles Day Trip", "Eiffel Tower"],
      nightlife: ["Champs-Élysées", "Moulin Rouge", "Latin Quarter", "Marais District"],
      heritage: ["Arc de Triomphe", "Palace of Versailles", "Sainte-Chapelle", "Panthéon"]
    },
    london: {
      beaches: [],
      indoor: ["British Museum", "Tower of London", "Westminster Abbey", "Tate Modern"],
      adventure: ["Thames River Cruise", "London Eye", "Hyde Park", "Camden Market"],
      nightlife: ["Covent Garden", "Soho", "Shoreditch", "Borough Market"],
      heritage: ["Buckingham Palace", "Big Ben", "St. Paul's Cathedral", "Tower Bridge"]
    },
    tokyo: {
      beaches: [],
      indoor: ["Tokyo National Museum", "Senso-ji Temple", "Meiji Shrine", "Tokyo Skytree"],
      adventure: ["Mount Fuji Day Trip", "Shibuya Crossing", "Robot Restaurant", "TeamLabs Borderless"],
      nightlife: ["Shinjuku", "Harajuku", "Ginza", "Roppongi"],
      heritage: ["Imperial Palace", "Asakusa District", "Ueno Park", "Tsukiji Market"]
    },
    newyork: {
      beaches: [],
      indoor: ["Metropolitan Museum", "9/11 Memorial", "Statue of Liberty", "Empire State Building"],
      adventure: ["Central Park", "Brooklyn Bridge Walk", "High Line Park", "Staten Island Ferry"],
      nightlife: ["Times Square", "Broadway Shows", "Greenwich Village", "Meatpacking District"],
      heritage: ["Ellis Island", "One World Observatory", "St. Patrick's Cathedral", "Wall Street"]
    }
  };

  return knownCities[cityLower] || {};
}

// Fallback attractions generator
function generateFallbackAttractions(city) {
  return {
    outdoor: [`${city} City Center`, `${city} Parks`, `${city} Walking Areas`, `${city} Public Squares`],
    indoor: [`${city} Museums`, `${city} Shopping Areas`, `${city} Cultural Sites`, `${city} Markets`],
    heritage: [`${city} Historic District`, `${city} Religious Sites`, `${city} Architecture`, `${city} Monuments`],
    adventure: [`${city} Tours`, `${city} Activities`, `${city} Sports`, `${city} Local Experiences`],
    nightlife: [`${city} Restaurants`, `${city} Bars`, `${city} Entertainment`, `${city} Night Markets`],
    beaches: []
  };
}

// --- EVENTS & FESTIVALS INTEGRATION ---

// Main function to get events happening during travel dates
async function getEventsForTrip(city, lat, lon, startDate, endDate) {
  try {
    console.log(`🎭 Fetching events for ${city} from ${startDate} to ${endDate}`);
    
    // 1. Check cache first
    const cached = getCachedEvents(city, startDate, endDate);
    if (cached) {
      return cached;
    }
    
    // 2. Try real event APIs first
    let events = null;
    
    // 3. Try Ticketmaster API first (best for concerts, sports, festivals)
    if (TICKETMASTER_API_KEY && canMakeAPICall('ticketmaster')) {
      events = await getTicketmasterEvents(city, lat, lon, startDate, endDate);
      if (events && events.length > 0) {
        console.log(`✅ Ticketmaster: Found ${events.length} events for ${city}`);
        setCachedEvents(city, startDate, endDate, events);
        return events;
      }
    }
    
    // 4. Try Eventbrite API as backup
    if (EVENTBRITE_API_KEY && canMakeAPICall('eventbrite')) {
      events = await getEventbriteEvents(city, lat, lon, startDate, endDate);
      if (events && events.length > 0) {
        console.log(`✅ Eventbrite: Found ${events.length} events for ${city}`);
        setCachedEvents(city, startDate, endDate, events);
        return events;
      }
    }
    
    // 5. Fallback to curated events database
    console.log(`⚠️ Using curated events for ${city}`);
    events = await getCuratedEventsForCity(city, startDate, endDate);
    
    // Cache even fallback data to improve performance
    setCachedEvents(city, startDate, endDate, events);
    return events;
    
  } catch (err) {
    console.error("❌ Error fetching events:", err);
    return generateFallbackEvents(city, startDate, endDate);
  }
}

// Ticketmaster API Integration for concerts, sports, festivals
async function getTicketmasterEvents(city, lat, lon, startDate, endDate) {
  if (!TICKETMASTER_API_KEY) return null;
  
  try {
    const radius = '50'; // 50 miles radius
    const events = [];
    
    // Format dates for Ticketmaster API (YYYY-MM-DDTHH:MM:SSZ)
    const startDateTime = `${startDate}T00:00:00Z`;
    const endDateTime = `${endDate}T23:59:59Z`;
    
    // Different event categories
    const eventCategories = {
      concerts: 'KZFzniwnSyZfZ7v7nJ', // Music
      sports: 'KZFzniwnSyZfZ7v7nE',   // Sports  
      festivals: 'KZFzniwnSyZfZ7v7na', // Arts & Theatre
      family: 'KZFzniwnSyZfZ7v7n1'    // Family
    };
    
    for (const [category, segmentId] of Object.entries(eventCategories)) {
      try {
        const url = `https://app.ticketmaster.com/discovery/v2/events.json?apikey=${TICKETMASTER_API_KEY}&latlong=${lat},${lon}&radius=${radius}&unit=miles&startDateTime=${startDateTime}&endDateTime=${endDateTime}&segmentId=${segmentId}&size=10&sort=date,asc`;
        
        const response = await fetch(url);
        const data = await response.json();
        
        if (data._embedded?.events) {
          data._embedded.events.forEach(event => {
            events.push({
              name: event.name,
              category: category,
              date: event.dates.start.localDate,
              time: event.dates.start.localTime || '20:00',
              venue: event._embedded?.venues?.[0]?.name || 'TBA',
              description: event.info || `${category.charAt(0).toUpperCase() + category.slice(1)} event in ${city}`,
              url: event.url,
              priceRange: event.priceRanges?.[0] ? 
                `$${event.priceRanges[0].min} - $${event.priceRanges[0].max}` : 
                'Price varies',
              type: 'live_event'
            });
          });
        }
      } catch (err) {
        console.error(`❌ Error fetching ${category} from Ticketmaster:`, err);
      }
    }
    
    return events.length > 0 ? events.slice(0, 15) : null; // Max 15 events
    
  } catch (err) {
    console.error("❌ Ticketmaster API error:", err);
    return null;
  }
}

// Eventbrite API Integration for local events, workshops, meetups
async function getEventbriteEvents(city, lat, lon, startDate, endDate) {
  if (!EVENTBRITE_API_KEY) return null;
  
  try {
    const events = [];
    
    // Format dates for Eventbrite API
    const startDateTime = `${startDate}T00:00:00`;
    const endDateTime = `${endDate}T23:59:59`;
    
    const url = `https://www.eventbriteapi.com/v3/events/search/?location.latitude=${lat}&location.longitude=${lon}&location.within=50km&start_date.range_start=${startDateTime}&start_date.range_end=${endDateTime}&expand=venue&token=${EVENTBRITE_API_KEY}`;
    
    const response = await fetch(url);
    const data = await response.json();
    
    if (data.events && data.events.length > 0) {
      data.events.forEach(event => {
        // Categorize events based on category or name
        let category = 'community';
        const eventName = event.name.text.toLowerCase();
        
        if (eventName.includes('concert') || eventName.includes('music') || eventName.includes('band')) {
          category = 'concerts';
        } else if (eventName.includes('festival') || eventName.includes('fair')) {
          category = 'festivals';
        } else if (eventName.includes('sport') || eventName.includes('game') || eventName.includes('match')) {
          category = 'sports';
        } else if (eventName.includes('art') || eventName.includes('exhibition') || eventName.includes('gallery')) {
          category = 'cultural';
        }
        
        events.push({
          name: event.name.text,
          category: category,
          date: event.start.local.split('T')[0],
          time: event.start.local.split('T')[1],
          venue: event.venue?.name || 'Online/TBA',
          description: event.description?.text?.substring(0, 200) || `Local ${category} event in ${city}`,
          url: event.url,
          priceRange: event.is_free ? 'Free' : 'Paid event',
          type: 'community_event'
        });
      });
    }
    
    return events.length > 0 ? events.slice(0, 10) : null; // Max 10 events
    
  } catch (err) {
    console.error("❌ Eventbrite API error:", err);
    return null;
  }
}

// Curated events database for popular cities and general events
async function getCuratedEventsForCity(city, startDate, endDate) {
  const cityLower = city.toLowerCase();
  
  // Calculate days between dates for seasonal events
  const start = new Date(startDate);
  const end = new Date(endDate);
  const month = start.getMonth() + 1; // 1-12
  
  // Seasonal and cultural events by city
  const curatedEvents = {
    // India
    delhi: [
      { name: "Red Fort Light & Sound Show", category: "cultural", venue: "Red Fort", time: "19:00", priceRange: "₹80-150", description: "Historical light and sound show about Mughal history" },
      { name: "Qutub Festival", category: "festivals", venue: "Qutub Minar", time: "18:00", priceRange: "Free", description: "Classical music and dance performances" },
      { name: "Delhi International Arts Festival", category: "cultural", venue: "Various venues", time: "19:30", priceRange: "₹500-2000", description: "Contemporary arts and performance festival" }
    ],
    mumbai: [
      { name: "Prithvi Theatre Festival", category: "cultural", venue: "Prithvi Theatre", time: "20:00", priceRange: "₹300-800", description: "International theatre festival" },
      { name: "Kala Ghoda Arts Festival", category: "festivals", venue: "Kala Ghoda District", time: "All day", priceRange: "Free", description: "Street art, performances, and cultural events" },
      { name: "Bollywood Live Concert", category: "concerts", venue: "NSCI Dome", time: "19:00", priceRange: "₹1500-5000", description: "Live Bollywood music performances" }
    ],
    bangalore: [
      { name: "Bangalore Literature Festival", category: "cultural", venue: "Various venues", time: "10:00", priceRange: "Free-₹500", description: "Authors, poets, and literary discussions" },
      { name: "UB City Mall Events", category: "community", venue: "UB City", time: "18:00", priceRange: "Free", description: "Regular cultural performances and exhibitions" },
      { name: "Lalbagh Flower Show", category: "festivals", venue: "Lalbagh Gardens", time: "09:00", priceRange: "₹30", description: "Beautiful flower exhibitions and garden tours" }
    ],
    
    // International
    paris: [
      { name: "Seine River Evening Cruise", category: "cultural", venue: "Seine River", time: "20:30", priceRange: "€25-60", description: "Illuminated monuments cruise with dinner option" },
      { name: "Louvre Late Night Opening", category: "cultural", venue: "Louvre Museum", time: "18:00", priceRange: "€17", description: "Extended hours with special exhibitions" },
      { name: "Moulin Rouge Show", category: "concerts", venue: "Moulin Rouge", time: "21:00", priceRange: "€87-200", description: "Iconic cabaret performance" }
    ],
    london: [
      { name: "West End Theatre Shows", category: "cultural", venue: "Various theatres", time: "19:30", priceRange: "£25-150", description: "World-class musical and drama performances" },
      { name: "Thames River Jazz Cruise", category: "concerts", venue: "Thames River", time: "19:00", priceRange: "£35-55", description: "Live jazz music while cruising past landmarks" },
      { name: "Borough Market Food Tours", category: "community", venue: "Borough Market", time: "11:00", priceRange: "£45", description: "Guided food tasting and market exploration" }
    ],
    tokyo: [
      { name: "Robot Restaurant Show", category: "cultural", venue: "Shinjuku", time: "20:00", priceRange: "¥8000", description: "Unique robot and neon performance show" },
      { name: "Shibuya Sky Observatory", category: "cultural", venue: "Shibuya Sky", time: "18:00", priceRange: "¥1800", description: "360-degree city views and sunset experience" },
      { name: "Traditional Tea Ceremony", category: "cultural", venue: "Various temples", time: "14:00", priceRange: "¥3000", description: "Authentic Japanese tea ceremony experience" }
    ]
  };
  
  // Get events for the city or use generic events
  let cityEvents = curatedEvents[cityLower] || generateGenericCityEvents(city);
  
  // Add seasonal events based on month
  const seasonalEvents = getSeasonalEvents(city, month);
  cityEvents = [...cityEvents, ...seasonalEvents];
  
  // Format events with dates during the trip
  const tripEvents = [];
  const tripDays = Math.ceil((end - start) / (1000 * 60 * 60 * 24)) + 1;
  
  cityEvents.forEach((event, index) => {
    // Distribute events across trip dates
    const dayOffset = index % tripDays;
    const eventDate = new Date(start);
    eventDate.setDate(start.getDate() + dayOffset);
    
    tripEvents.push({
      ...event,
      date: eventDate.toISOString().split('T')[0],
      type: 'curated_event'
    });
  });
  
  return tripEvents.slice(0, 8); // Max 8 curated events
}

// Generate seasonal events based on month
function getSeasonalEvents(city, month) {
  const seasonalEvents = [];
  
  // Winter events (Dec, Jan, Feb)
  if ([12, 1, 2].includes(month)) {
    seasonalEvents.push({
      name: `${city} Winter Festival`,
      category: "festivals",
      venue: "City Center",
      time: "17:00",
      priceRange: "Free",
      description: "Winter celebrations with lights and local culture"
    });
  }
  
  // Spring events (Mar, Apr, May)
  if ([3, 4, 5].includes(month)) {
    seasonalEvents.push({
      name: `${city} Spring Cultural Festival`,
      category: "festivals", 
      venue: "Public Gardens",
      time: "11:00",
      priceRange: "Free-$20",
      description: "Spring celebrations with outdoor performances"
    });
  }
  
  // Summer events (Jun, Jul, Aug)
  if ([6, 7, 8].includes(month)) {
    seasonalEvents.push({
      name: `${city} Summer Concert Series`,
      category: "concerts",
      venue: "Outdoor Amphitheater",
      time: "19:30",
      priceRange: "$25-75",
      description: "Outdoor summer concerts and music festivals"
    });
  }
  
  // Fall events (Sep, Oct, Nov) 
  if ([9, 10, 11].includes(month)) {
    seasonalEvents.push({
      name: `${city} Harvest Festival`,
      category: "festivals",
      venue: "Market Square", 
      time: "10:00",
      priceRange: "Free",
      description: "Autumn harvest celebrations and local food markets"
    });
  }
  
  return seasonalEvents;
}

// Generate generic events for any city
function generateGenericCityEvents(city) {
  return [
    {
      name: `${city} Walking Tour`,
      category: "cultural",
      venue: "City Center",
      time: "10:00",
      priceRange: "$15-30",
      description: `Guided historical walking tour of ${city}'s main attractions`
    },
    {
      name: `${city} Food Market`,
      category: "community", 
      venue: "Local Market",
      time: "09:00",
      priceRange: "Free entry",
      description: `Local food market with regional specialties and crafts`
    },
    {
      name: `${city} Cultural Center Events`,
      category: "cultural",
      venue: "Cultural Center",
      time: "19:00", 
      priceRange: "$10-50",
      description: `Regular cultural performances and art exhibitions`
    }
  ];
}

// Emergency fallback events
function generateFallbackEvents(city, startDate, endDate) {
  return [
    {
      name: `Explore ${city} Markets`,
      category: "community",
      date: startDate,
      time: "10:00", 
      venue: "Local Markets",
      description: `Visit local markets and experience ${city}'s culture`,
      priceRange: "Free",
      type: "suggested_activity"
    },
    {
      name: `${city} Evening Walk`,
      category: "cultural",
      date: startDate,
      time: "18:00",
      venue: "City Center", 
      description: `Evening stroll through ${city}'s historic areas`,
      priceRange: "Free",
      type: "suggested_activity"
    }
  ];
}

// --- Travel Planner Function ---
async function planTripBasedOnWeather(city, weatherData) {
  try {
    if (weatherData.error) {
      return { error: `Weather data error: ${weatherData.error}` };
    }

    // Get attractions for any city in the world
    const lat = weatherData.coordinates?.lat || 0;
    const lon = weatherData.coordinates?.lon || 0;
    const places = await getAttractionsForCity(city, lat, lon);

    // Get events happening during the trip dates  
    const events = await getEventsForTrip(city, lat, lon, weatherData.startDate, weatherData.endDate);

    const recommendations = [];
    const forecast = weatherData.forecast || [];

    // Analyze weather patterns
    const rainyDays = forecast.filter(f => 
      f.condition.includes('rain') || f.condition.includes('drizzle') || f.condition.includes('thunderstorm')
    );
    const sunnyDays = forecast.filter(f => 
      f.condition.includes('clear') || f.condition.includes('sunny')
    );
    const cloudyDays = forecast.filter(f => 
      f.condition.includes('cloud') || f.condition.includes('overcast')
    );

    // Plan based on weather conditions
    if (sunnyDays.length > rainyDays.length) {
      const outdoorPlaces = [...(places.beaches || []), ...(places.outdoor || []), ...(places.adventure || [])];
      recommendations.push({
        category: "Perfect for Outdoor Activities",
        places: outdoorPlaces.slice(0, 4),
        reason: `${Math.ceil(sunnyDays.length / 8)} sunny days expected - great for outdoor activities!`
      });
    }

    if (rainyDays.length > 2) {
      recommendations.push({
        category: "Indoor Attractions (Rainy Day Backup)",
        places: (places.indoor || []).slice(0, 3),
        reason: `${Math.ceil(rainyDays.length / 8)} rainy days expected - perfect for indoor sightseeing!`
      });
    }

    if (cloudyDays.length > 0) {
      recommendations.push({
        category: "Heritage & Culture",
        places: (places.heritage || []).slice(0, 3),
        reason: `${Math.ceil(cloudyDays.length / 8)} cloudy days - ideal for heritage sites and walking tours!`
      });
    }

    // Always include nightlife as evening option
    recommendations.push({
      category: "Evening Entertainment",
      places: (places.nightlife || []).slice(0, 2),
      reason: "Great evening options regardless of weather!"
    });

    // Add events happening during the trip if available
    if (events && events.length > 0) {
      // Group events by category
      const eventsByCategory = {
        concerts: events.filter(e => e.category === 'concerts'),
        festivals: events.filter(e => e.category === 'festivals'),  
        sports: events.filter(e => e.category === 'sports'),
        cultural: events.filter(e => e.category === 'cultural'),
        community: events.filter(e => e.category === 'community')
      };

      // Add event recommendations
      if (eventsByCategory.concerts.length > 0) {
        recommendations.push({
          category: "🎵 Live Concerts & Music",
          places: eventsByCategory.concerts.slice(0, 3).map(e => `${e.name} - ${e.venue} (${e.date})`),
          reason: `${eventsByCategory.concerts.length} concerts happening during your visit!`,
          events: eventsByCategory.concerts.slice(0, 3)
        });
      }

      if (eventsByCategory.festivals.length > 0) {
        recommendations.push({
          category: "🎭 Festivals & Celebrations", 
          places: eventsByCategory.festivals.slice(0, 3).map(e => `${e.name} - ${e.venue} (${e.date})`),
          reason: `${eventsByCategory.festivals.length} festivals and celebrations during your trip!`,
          events: eventsByCategory.festivals.slice(0, 3)
        });
      }

      if (eventsByCategory.sports.length > 0) {
        recommendations.push({
          category: "⚽ Sports & Games",
          places: eventsByCategory.sports.slice(0, 2).map(e => `${e.name} - ${e.venue} (${e.date})`),
          reason: `${eventsByCategory.sports.length} exciting sports events to watch!`,
          events: eventsByCategory.sports.slice(0, 2)
        });
      }

      if (eventsByCategory.cultural.length > 0 || eventsByCategory.community.length > 0) {
        const culturalEvents = [...eventsByCategory.cultural, ...eventsByCategory.community];
        recommendations.push({
          category: "🎨 Cultural Events & Activities",
          places: culturalEvents.slice(0, 3).map(e => `${e.name} - ${e.venue} (${e.date})`),
          reason: `${culturalEvents.length} cultural activities and local experiences!`,
          events: culturalEvents.slice(0, 3)
        });
      }
    }

    return {
      city,
      travelPeriod: `${weatherData.startDate} to ${weatherData.endDate}`,
      coordinates: weatherData.coordinates || { lat: 0, lon: 0 },
      weatherSummary: {
        totalDays: forecast.length > 0 ? Math.ceil(forecast.length / 8) : 0,
        sunnyDays: Math.ceil(sunnyDays.length / 8),
        rainyDays: Math.ceil(rainyDays.length / 8),
        cloudyDays: Math.ceil(cloudyDays.length / 8)
      },
      recommendations,
      locations: places,
      events: events || [], // Include all events in response
      availableAttractions: {
        totalOutdoor: (places.outdoor || []).length + (places.beaches || []).length + (places.adventure || []).length,
        totalIndoor: (places.indoor || []).length,
        totalHeritage: (places.heritage || []).length,
        totalNightlife: (places.nightlife || []).length,
        totalEvents: (events || []).length
      },
      weatherDetails: weatherData
    };

  } catch (err) {
    console.error("❌ Travel planning error:", err);
    return { error: "Failed to plan trip based on weather data." };
  }
}

// --- Real Weather Fetcher ---
async function getWeatherByCityAndDate(city, startDate, endDate) {
  try {
    // Validate dates
    if (isNaN(Date.parse(startDate)) || isNaN(Date.parse(endDate))) {
      return { error: "Invalid date format. Use YYYY-MM-DD." };
    }
    if (startDate > endDate) {
      return { error: "startDate cannot be after endDate." };
    }

    // 1️⃣ Get coordinates of the city
    const geoRes = await fetch(
      `https://api.openweathermap.org/geo/1.0/direct?q=${encodeURIComponent(
        city
      )}&limit=1&appid=${OPENWEATHER_API_KEY}`
    );
    const geoData = await geoRes.json();
    if (!geoData || geoData.length === 0) {
      return { error: `City not found: ${city}` };
    }
    const { lat, lon } = geoData[0];

    // 2️⃣ Get 5-day / 3-hour forecast
    const weatherRes = await fetch(
      `https://api.openweathermap.org/data/2.5/forecast?lat=${lat}&lon=${lon}&appid=${OPENWEATHER_API_KEY}&units=metric`
    );
    const weatherData = await weatherRes.json();
    if (!weatherData?.list) {
      return { error: "Failed to fetch forecast data" };
    }

    // Filter forecasts by date range
    const forecasts = weatherData.list.filter((f) => {
      const forecastDate = f.dt_txt.split(" ")[0];
      return forecastDate >= startDate && forecastDate <= endDate;
    });

    // 3️⃣ Get neighboring locations (~5 closest)
    const neighborRes = await fetch(
      `https://api.openweathermap.org/data/2.5/find?lat=${lat}&lon=${lon}&cnt=5&appid=${OPENWEATHER_API_KEY}&units=metric`
    );
    const neighborData = await neighborRes.json();

    return {
      city,
      coordinates: { lat, lon },
      startDate,
      endDate,
      forecast: forecasts.map((f) => ({
        date: f.dt_txt,
        temp: `${f.main.temp} °C`,
        condition: f.weather[0].description,
      })),
      neighbors:
        neighborData.list?.map((n) => ({
          city: n.name,
          temp: `${n.main.temp} °C`,
          condition: n.weather[0].description,
        })) || [],
    };
  } catch (err) {
    console.error("❌ Weather API error:", err);
    return { error: "Failed to fetch weather data." };
  }
}

// --- Tool registry ---
const toolRegistry = new Map();
function registerTool(name, schema, handler) {
  toolRegistry.set(name, handler);
  server.tool(name, schema, async (args) => {
    return handler(args);
  });
}

server.invokeTool = async (name, args) => {
  if (!toolRegistry.has(name)) throw new Error(`Tool ${name} not registered`);
  return toolRegistry.get(name)(args);
};

// --- Register getWeatherDataByCityName tool ---
registerTool(
  "getWeatherDataByCityName",
  {
    city: z.string(),
    startDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Use YYYY-MM-DD"),
    endDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Use YYYY-MM-DD"),
  },
  async ({ city, startDate, endDate }) => {
    const result = await getWeatherByCityAndDate(city, startDate, endDate);
    console.log("DEBUG weather returning:", result);

    return {
      content: [
        {
          type: "text",
          text: JSON.stringify(result, null, 2),
        },
      ],
    };
  }
);

// --- Register planTripBasedOnWeather tool ---
registerTool(
  "planTripBasedOnWeather",
  {
    city: z.string(),
    startDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Use YYYY-MM-DD"),
    endDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Use YYYY-MM-DD"),
  },
  async ({ city, startDate, endDate }) => {
    // First get weather data
    const weatherData = await getWeatherByCityAndDate(city, startDate, endDate);
    
    // Then plan trip based on weather
    const travelPlan = await planTripBasedOnWeather(city, weatherData);
    console.log("DEBUG travel plan returning:", travelPlan);

    return {
      content: [
        {
          type: "text",
          text: JSON.stringify(travelPlan, null, 2),
        },
      ],
    };
  }
);

// --- Initialize MCP server ---
export async function initMcpServer() {
  const transport = new StdioServerTransport();
  await server.connect(transport);
  console.log("✅ Weather MCP server running...");
}
