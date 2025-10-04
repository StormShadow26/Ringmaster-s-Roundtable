// backend/mcp/mcpServer.js
import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { z } from "zod";
import dotenv from "dotenv";

dotenv.config();

// If Node < 18 and you still want fetch, uncomment the next line:
// import fetch from "node-fetch";

const OPENWEATHER_API_KEY = process.env.OPENWEATHER_API_KEY;
const GOOGLE_PLACES_API_KEY = process.env.GOOGLE_PLACES_API_KEY;
const FOURSQUARE_API_KEY = process.env.FOURSQUARE_API_KEY;

if (!OPENWEATHER_API_KEY) {
  throw new Error("OPENWEATHER_API_KEY not set in .env");
}

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

// --- Cache for API results (in-memory) ---
const attractionCache = new Map();
const CACHE_DURATION = 24 * 60 * 60 * 1000; // 24 hours

// --- Simple rate limiting tracker ---
const apiCallTracker = {
  googlePlaces: { calls: 0, resetTime: Date.now() + 60 * 60 * 1000 }, // hourly
  foursquare: { calls: 0, resetTime: Date.now() + 60 * 60 * 1000 },
};

const API_LIMITS = {
  googlePlaces: 100,
  foursquare: 50,
};

function canMakeAPICall(apiName) {
  const tracker = apiCallTracker[apiName];
  if (!tracker) return false;

  // Reset if window passed
  if (Date.now() > tracker.resetTime) {
    tracker.calls = 0;
    tracker.resetTime = Date.now() + 60 * 60 * 1000;
  }

  if (tracker.calls >= API_LIMITS[apiName]) {
    console.warn(`⚠️ ${apiName} API rate limit reached. Using fallback data.`);
    return false;
  }

  tracker.calls++;
  return true;
}

function getCachedAttractions(city) {
  if (!city) return null;
  const key = city.toLowerCase();
  const cached = attractionCache.get(key);
  if (cached && Date.now() - cached.timestamp < CACHE_DURATION) {
    console.log(`📦 Using cached attractions for ${city}`);
    return cached.data;
  }
  return null;
}

function setCachedAttractions(city, data) {
  if (!city) return;
  attractionCache.set(city.toLowerCase(), {
    data,
    timestamp: Date.now(),
  });
  console.log(`💾 Cached attractions for ${city}`);
}

// --- Helper: clean and validate attraction names ---
function cleanAttractionName(name) {
  if (!name || typeof name !== "string") return null;

  const cleaned = name
    .replace(/\s+(Restaurant|Cafe|Bar|Shop|Store|Hotel|Mall)$/i, "")
    .replace(/\s+(Branch|Location|Outlet)$/i, "")
    .trim();

  const invalidNames = [
    "untitled",
    "unnamed",
    "unknown",
    "n/a",
    "tbd",
    "parking",
    "atm",
    "toilet",
    "restroom",
    "wc",
  ];

  if (invalidNames.some((invalid) => cleaned.toLowerCase().includes(invalid))) {
    return null;
  }

  if (cleaned.length < 3 || /^\d+$/.test(cleaned)) {
    return null;
  }

  return cleaned;
}

// --- Merge & dedupe attractions between API and static lists ---
function mergeAttractions(apiAttractions = {}, staticAttractions = {}) {
  const merged = {};

  for (const category of [
    "outdoor",
    "indoor",
    "heritage",
    "adventure",
    "nightlife",
    "beaches",
  ]) {
    const apiList = apiAttractions[category] || [];
    const staticList = staticAttractions[category] || [];

    const cleanedApi = apiList.map(cleanAttractionName).filter((n) => n !== null);
    const combined = [...cleanedApi, ...staticList];
    merged[category] = [...new Set(combined)].slice(0, 8);
  }

  return merged;
}

// --- API status & health check ---
function getAPIStatus() {
  const status = {
    apis: {
      openweather: !!OPENWEATHER_API_KEY,
      gemini: !!process.env.GEMINI_API_KEY,
      googlePlaces: !!GOOGLE_PLACES_API_KEY,
      foursquare: !!FOURSQUARE_API_KEY,
    },
    rateLimits: {
      googlePlaces: {
        used: apiCallTracker.googlePlaces.calls,
        limit: API_LIMITS.googlePlaces,
        resetTime: new Date(apiCallTracker.googlePlaces.resetTime).toISOString(),
      },
      foursquare: {
        used: apiCallTracker.foursquare.calls,
        limit: API_LIMITS.foursquare,
        resetTime: new Date(apiCallTracker.foursquare.resetTime).toISOString(),
      },
    },
    cache: {
      entries: attractionCache.size,
      cities: Array.from(attractionCache.keys()),
    },
  };

  console.log("🔧 API Status:", JSON.stringify(status, null, 2));
  return status;
}

console.log("🚀 MCP Server starting with enhanced API integrations...");
getAPIStatus();

// --- Core: fetch attractions for a city (tries cache, Google, Foursquare, fallback) ---
async function getAttractionsForCity(city, lat, lon) {
  try {
    console.log(`🔍 Fetching attractions for ${city} at (${lat}, ${lon})`);

    const cached = getCachedAttractions(city);
    if (cached) return cached;

    let attractions = null;

    // Try Google Places
    if (GOOGLE_PLACES_API_KEY && canMakeAPICall("googlePlaces")) {
      const startTime = Date.now();
      attractions = await getGooglePlacesAttractions(city, lat, lon);
      const duration = Date.now() - startTime;
      if (attractions && Object.keys(attractions).length > 0) {
        const totalPlaces = Object.values(attractions).reduce((s, arr) => s + arr.length, 0);
        console.log(`✅ Google Places API: ${totalPlaces} attractions in ${duration}ms for ${city}`);
        setCachedAttractions(city, attractions);
        return attractions;
      }
    }

    // Foursquare fallback
    if (FOURSQUARE_API_KEY && canMakeAPICall("foursquare")) {
      const startTime = Date.now();
      attractions = await getFoursquareAttractions(city, lat, lon);
      const duration = Date.now() - startTime;
      if (attractions && Object.keys(attractions).length > 0) {
        const totalPlaces = Object.values(attractions).reduce((s, arr) => s + arr.length, 0);
        console.log(`✅ Foursquare API: ${totalPlaces} attractions in ${duration}ms for ${city}`);
        setCachedAttractions(city, attractions);
        return attractions;
      }
    }

    // Final fallback (generated)
    console.warn(`⚠️ Using static/generated attractions for ${city}`);
    attractions = await generateAttractionsForCity(city, lat, lon);
    setCachedAttractions(city, attractions);
    return attractions;
  } catch (err) {
    console.error("❌ Error fetching attractions:", err);
    return generateFallbackAttractions(city);
  }
}

// --- Google Places integration (nearbysearch) ---
async function getGooglePlacesAttractions(city, lat, lon) {
  if (!GOOGLE_PLACES_API_KEY) return null;
  // canMakeAPICall already checked above, but double-check safe call
  if (!canMakeAPICall("googlePlaces")) return null;

  try {
    const radius = 25000;
    const attractions = {
      outdoor: [],
      indoor: [],
      heritage: [],
      adventure: [],
      nightlife: [],
      beaches: [],
    };

    const searchQueries = {
      outdoor: ["park", "garden", "viewpoint", "square", "landmark"],
      indoor: ["museum", "gallery", "shopping_mall", "aquarium", "library"],
      heritage: ["church", "temple", "mosque", "historical_site", "monument"],
      adventure: ["amusement_park", "zoo", "stadium", "tourist_attraction"],
      nightlife: ["restaurant", "bar", "night_club", "cafe"],
      beaches: ["beach", "waterfront"],
    };

    for (const [category, types] of Object.entries(searchQueries)) {
      const collected = [];
      for (const type of types) {
        try {
          const url = `https://maps.googleapis.com/maps/api/place/nearbysearch/json?location=${lat},${lon}&radius=${radius}&type=${type}&key=${GOOGLE_PLACES_API_KEY}`;
          const response = await fetch(url);
          const data = await response.json();

          if (data?.results?.length > 0) {
            const goodPlaces = data.results
              .filter((place) => !place.rating || place.rating >= 4.0)
              .slice(0, 4)
              .map((place) => cleanAttractionName(place.name))
              .filter((name) => name !== null);
            collected.push(...goodPlaces);
          }
        } catch (err) {
          console.error(`❌ Error fetching ${type} from Google Places:`, err);
        }
      }
      attractions[category] = [...new Set(collected)].slice(0, 6);
    }

    const total = Object.values(attractions).reduce((s, arr) => s + arr.length, 0);
    return total > 5 ? attractions : null;
  } catch (err) {
    console.error("❌ Google Places API error:", err);
    return null;
  }
}

// --- Foursquare integration ---
async function getFoursquareAttractions(city, lat, lon) {
  if (!FOURSQUARE_API_KEY) return null;
  if (!canMakeAPICall("foursquare")) return null;

  try {
    const radius = 25000;
    const attractions = {
      outdoor: [],
      indoor: [],
      heritage: [],
      adventure: [],
      nightlife: [],
      beaches: [],
    };

    const categoryQueries = {
      outdoor: "outdoors",
      indoor: "arts,shops",
      heritage: "landmarks,religious",
      adventure: "entertainment,recreation",
      nightlife: "food,nightlife",
      beaches: "beaches,waterfront",
    };

    for (const [category, query] of Object.entries(categoryQueries)) {
      try {
        const url = `https://api.foursquare.com/v3/places/search?ll=${lat},${lon}&radius=${radius}&categories=${encodeURIComponent(
          query
        )}&limit=10`;

        const response = await fetch(url, {
          headers: {
            Authorization: FOURSQUARE_API_KEY,
            Accept: "application/json",
          },
        });

        const data = await response.json();

        if (data?.results?.length > 0) {
          const places = data.results
            .slice(0, 6)
            .map((place) => cleanAttractionName(place.name))
            .filter((n) => n !== null);
          attractions[category] = places;
        }
      } catch (err) {
        console.error(`❌ Error fetching ${category} from Foursquare:`, err);
      }
    }

    const total = Object.values(attractions).reduce((s, arr) => s + arr.length, 0);
    return total > 5 ? attractions : null;
  } catch (err) {
    console.error("❌ Foursquare API error:", err);
    return null;
  }
}

// --- Fallback generator (some template strings fixed) ---
async function generateAttractionsForCity(city, lat, lon) {
  const cityStr = city || "This City";

  const baseAttractions = {
    outdoor: [
      `${cityStr} City Center`,
      `${cityStr} Walking Tours`,
      `${cityStr} Parks and Gardens`,
      `${cityStr} Viewpoints`,
    ],
    indoor: [
      `${cityStr} Museums`,
      `${cityStr} Art Galleries`,
      `${cityStr} Shopping Centers`,
      `${cityStr} Cultural Centers`,
    ],
    heritage: [
      `${cityStr} Historic Sites`,
      `${cityStr} Religious Places`,
      `${cityStr} Architecture Tours`,
      `${cityStr} Local Markets`,
    ],
    adventure: [
      `${cityStr} Adventure Activities`,
      `${cityStr} Sports Centers`,
      `${cityStr} Nature Trails`,
      `${cityStr} Local Experiences`,
    ],
    nightlife: [
      `${cityStr} Restaurants`,
      `${cityStr} Cafes and Bars`,
      `${cityStr} Entertainment District`,
      `${cityStr} Local Cuisine Tours`,
    ],
    beaches: [],
  };

  const specificAttractions = getSpecificCityAttractions(cityStr.toLowerCase());

  return {
    outdoor: specificAttractions.outdoor || baseAttractions.outdoor,
    indoor: specificAttractions.indoor || baseAttractions.indoor,
    heritage: specificAttractions.heritage || baseAttractions.heritage,
    adventure: specificAttractions.adventure || baseAttractions.adventure,
    nightlife: specificAttractions.nightlife || baseAttractions.nightlife,
    beaches: specificAttractions.beaches || baseAttractions.beaches || [],
  };
}

// --- Specific city DB ---
function getSpecificCityAttractions(cityLower) {
  const knownCities = {
    goa: {
      beaches: ["Baga Beach", "Calangute Beach", "Anjuna Beach", "Palolem Beach"],
      indoor: ["Basilica of Bom Jesus", "Se Cathedral", "Goa State Museum", "Reis Magos Fort"],
      adventure: ["Dudhsagar Falls", "Spice Plantations", "River Cruising", "Water Sports"],
      nightlife: ["Tito's Bar", "Club Cubana", "Shiva Valley", "Casino Royale"],
      heritage: ["Old Goa Churches", "Fontainhas Latin Quarter", "Chapora Fort", "Aguada Fort"],
    },
    mumbai: {
      beaches: ["Juhu Beach", "Marine Drive", "Versova Beach", "Aksa Beach"],
      indoor: ["Gateway of India", "Chhatrapati Shivaji Museum", "Siddhivinayak Temple", "Crawford Market"],
      adventure: ["Elephanta Caves", "Sanjay Gandhi National Park", "Kanheri Caves", "Film City Tours"],
      nightlife: ["Leopold Cafe", "Cafe Mondegar", "Trilogy", "Hard Rock Cafe"],
      heritage: ["Victoria Terminus", "Dhobi Ghat", "Mani Bhavan", "Haji Ali Dargah"],
    },
    delhi: {
      beaches: [],
      indoor: ["Red Fort", "India Gate", "Lotus Temple", "Akshardham Temple"],
      adventure: ["Chandni Chowk Tours", "Yamuna River Boating", "Adventure Island", "Kingdom of Dreams"],
      nightlife: ["Connaught Place", "Hauz Khas Village", "Cyber Hub", "Khan Market"],
      heritage: ["Qutub Minar", "Humayun's Tomb", "Jama Masjid", "Raj Ghat"],
    },
    bangalore: {
      beaches: [],
      indoor: ["Bangalore Palace", "Vidhana Soudha", "ISKCON Temple", "Bull Temple"],
      adventure: ["Nandi Hills", "Bannerghatta National Park", "Innovative Film City", "Wonderla"],
      nightlife: ["MG Road", "Brigade Road", "Koramangala", "UB City Mall"],
      heritage: ["Tipu Sultan's Palace", "Cubbon Park", "Lalbagh Gardens", "KR Market"],
    },
    paris: {
      beaches: [],
      indoor: ["Louvre Museum", "Notre-Dame Cathedral", "Sacré-Cœur", "Musée d'Orsay"],
      adventure: ["Seine River Cruise", "Montmartre Walking Tour", "Versailles Day Trip", "Eiffel Tower"],
      nightlife: ["Champs-Élysées", "Moulin Rouge", "Latin Quarter", "Marais District"],
      heritage: ["Arc de Triomphe", "Palace of Versailles", "Sainte-Chapelle", "Panthéon"],
    },
    london: {
      beaches: [],
      indoor: ["British Museum", "Tower of London", "Westminster Abbey", "Tate Modern"],
      adventure: ["Thames River Cruise", "London Eye", "Hyde Park", "Camden Market"],
      nightlife: ["Covent Garden", "Soho", "Shoreditch", "Borough Market"],
      heritage: ["Buckingham Palace", "Big Ben", "St. Paul's Cathedral", "Tower Bridge"],
    },
    tokyo: {
      beaches: [],
      indoor: ["Tokyo National Museum", "Senso-ji Temple", "Meiji Shrine", "Tokyo Skytree"],
      adventure: ["Mount Fuji Day Trip", "Shibuya Crossing", "Robot Restaurant", "TeamLabs Borderless"],
      nightlife: ["Shinjuku", "Harajuku", "Ginza", "Roppongi"],
      heritage: ["Imperial Palace", "Asakusa District", "Ueno Park", "Tsukiji Market"],
    },
    newyork: {
      beaches: [],
      indoor: ["Metropolitan Museum", "9/11 Memorial", "Statue of Liberty", "Empire State Building"],
      adventure: ["Central Park", "Brooklyn Bridge Walk", "High Line Park", "Staten Island Ferry"],
      nightlife: ["Times Square", "Broadway Shows", "Greenwich Village", "Meatpacking District"],
      heritage: ["Ellis Island", "One World Observatory", "St. Patrick's Cathedral", "Wall Street"],
    },
  };

  return knownCities[cityLower] || {};
}

// --- Fallback generator used in error cases ---
function generateFallbackAttractions(city) {
  const cityStr = city || "This City";
  return {
    outdoor: [`${cityStr} City Center`, `${cityStr} Parks`, `${cityStr} Walking Areas`, `${cityStr} Public Squares`],
    indoor: [`${cityStr} Museums`, `${cityStr} Shopping Areas`, `${cityStr} Cultural Sites`, `${cityStr} Markets`],
    heritage: [`${cityStr} Historic District`, `${cityStr} Religious Sites`, `${cityStr} Architecture`, `${cityStr} Monuments`],
    adventure: [`${cityStr} Tours`, `${cityStr} Activities`, `${cityStr} Sports`, `${cityStr} Local Experiences`],
    nightlife: [`${cityStr} Restaurants`, `${cityStr} Bars`, `${cityStr} Entertainment`, `${cityStr} Night Markets`],
    beaches: [],
  };
}

// --- Planner: recommend places based on weather forecast ---
async function planTripBasedOnWeather(city, weatherData) {
  try {
    if (weatherData?.error) {
      return { error: `Weather data error: ${weatherData.error}` };
    }

    const lat = weatherData.coordinates?.lat || 0;
    const lon = weatherData.coordinates?.lon || 0;
    const places = await getAttractionsForCity(city, lat, lon);

    const recommendations = [];
    const forecast = weatherData.forecast || [];

    const rainyDays = forecast.filter((f) =>
      f.condition.toLowerCase().includes("rain") ||
      f.condition.toLowerCase().includes("drizzle") ||
      f.condition.toLowerCase().includes("thunderstorm")
    );
    const sunnyDays = forecast.filter((f) =>
      f.condition.toLowerCase().includes("clear") ||
      f.condition.toLowerCase().includes("sunny")
    );
    const cloudyDays = forecast.filter((f) =>
      f.condition.toLowerCase().includes("cloud") || f.condition.toLowerCase().includes("overcast")
    );

    if (sunnyDays.length > rainyDays.length) {
      const outdoorPlaces = [...(places?.beaches || []), ...(places?.outdoor || []), ...(places?.adventure || [])];
      recommendations.push({
        category: "Perfect for Outdoor Activities",
        places: outdoorPlaces.slice(0, 4),
        reason: `${Math.ceil(sunnyDays.length / 8)} sunny days expected - great for outdoor activities!`,
      });
    }

    if (rainyDays.length > 2) {
      recommendations.push({
        category: "Indoor Attractions (Rainy Day Backup)",
        places: (places?.indoor || []).slice(0, 3),
        reason: `${Math.ceil(rainyDays.length / 8)} rainy days expected - perfect for indoor sightseeing!`,
      });
    }

    if (cloudyDays.length > 0) {
      recommendations.push({
        category: "Heritage & Culture",
        places: (places?.heritage || []).slice(0, 3),
        reason: `${Math.ceil(cloudyDays.length / 8)} cloudy days - ideal for heritage sites and walking tours!`,
      });
    }

    recommendations.push({
      category: "Evening Entertainment",
      places: (places?.nightlife || []).slice(0, 2),
      reason: "Great evening options regardless of weather!",
    });

    return {
      city,
      travelPeriod: `${weatherData.startDate} to ${weatherData.endDate}`,
      weatherSummary: {
        totalDays: forecast.length > 0 ? Math.ceil(forecast.length / 8) : 0,
        sunnyDays: Math.ceil(sunnyDays.length / 8),
        rainyDays: Math.ceil(rainyDays.length / 8),
        cloudyDays: Math.ceil(cloudyDays.length / 8),
      },
      recommendations,
      availableAttractions: {
        totalOutdoor: (places?.outdoor || []).length + (places?.beaches || []).length + (places?.adventure || []).length,
        totalIndoor: (places?.indoor || []).length,
        totalHeritage: (places?.heritage || []).length,
        totalNightlife: (places?.nightlife || []).length,
      },
      weatherDetails: weatherData,
    };
  } catch (err) {
    console.error("❌ Travel planning error:", err);
    return { error: "Failed to plan trip based on weather data." };
  }
}

// --- Weather fetcher using OpenWeatherMap (geocoding + forecast) ---
async function getWeatherByCityAndDate(city, startDate, endDate) {
  try {
    // Validate dates
    if (isNaN(Date.parse(startDate)) || isNaN(Date.parse(endDate))) {
      return { error: "Invalid date format. Use YYYY-MM-DD." };
    }
    if (startDate > endDate) {
      return { error: "startDate cannot be after endDate." };
    }

    // 1. Geocode
    const geoRes = await fetch(
      `https://api.openweathermap.org/geo/1.0/direct?q=${encodeURIComponent(city)}&limit=1&appid=${OPENWEATHER_API_KEY}`
    );
    const geoData = await geoRes.json();
    if (!geoData || geoData.length === 0) {
      return { error: `City not found: ${city}` };
    }
    const { lat, lon } = geoData[0];

    // 2. 5-day / 3-hour forecast
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

    // 3. Nearby locations (optional)
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
        condition: f.weather?.[0]?.description || "",
      })),
      neighbors:
        neighborData?.list?.map((n) => ({
          city: n.name,
          temp: `${n.main.temp} °C`,
          condition: n.weather?.[0]?.description || "",
        })) || [],
    };
  } catch (err) {
    console.error("❌ Weather API error:", err);
    return { error: "Failed to fetch weather data." };
  }
}

// --- Tool registry (helper wrapper) ---
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
  z.object({
    city: z.string(),
    startDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Use YYYY-MM-DD"),
    endDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Use YYYY-MM-DD"),
  }),
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
  z.object({
    city: z.string(),
    startDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Use YYYY-MM-DD"),
    endDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Use YYYY-MM-DD"),
  }),
  async ({ city, startDate, endDate }) => {
    const weatherData = await getWeatherByCityAndDate(city, startDate, endDate);
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
