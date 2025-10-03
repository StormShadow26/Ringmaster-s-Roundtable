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

// Create MCP server
export const server = new McpServer({
  name: "weatherData",
  version: "1.0.0",
});

// --- Cache for API results (in-memory cache to reduce API calls) ---
const attractionCache = new Map();
const CACHE_DURATION = 24 * 60 * 60 * 1000; // 24 hours

// --- Rate limiting for APIs ---
const apiCallTracker = {
  googlePlaces: { calls: 0, resetTime: Date.now() + (60 * 60 * 1000) }, // Reset every hour
  foursquare: { calls: 0, resetTime: Date.now() + (60 * 60 * 1000) }
};

const API_LIMITS = {
  googlePlaces: 100, // Conservative limit per hour
  foursquare: 50     // Conservative limit per hour
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
      foursquare: !!FOURSQUARE_API_KEY
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
      }
    },
    cache: {
      entries: attractionCache.size,
      cities: Array.from(attractionCache.keys())
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

    return {
      city,
      travelPeriod: `${weatherData.startDate} to ${weatherData.endDate}`,
      weatherSummary: {
        totalDays: forecast.length > 0 ? Math.ceil(forecast.length / 8) : 0,
        sunnyDays: Math.ceil(sunnyDays.length / 8),
        rainyDays: Math.ceil(rainyDays.length / 8),
        cloudyDays: Math.ceil(cloudyDays.length / 8)
      },
      recommendations,
      availableAttractions: {
        totalOutdoor: (places.outdoor || []).length + (places.beaches || []).length + (places.adventure || []).length,
        totalIndoor: (places.indoor || []).length,
        totalHeritage: (places.heritage || []).length,
        totalNightlife: (places.nightlife || []).length
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
