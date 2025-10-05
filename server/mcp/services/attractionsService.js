// services/attractionsService.js
import { getGooglePlacesAttractions } from '../api/googlePlacesAPI.js';
import { getFoursquareAttractions } from '../api/foursquareAPI.js';
import { getCachedAttractions, setCachedAttractions } from '../utils/cache.js';
import { mergeAttractions } from '../utils/validators.js';
import { staticCityAttractions, generateBaseAttractions } from '../data/cityAttractions.js';
import { GOOGLE_PLACES_API_KEY, FOURSQUARE_API_KEY } from '../config/environment.js';

export async function getAttractionsForCity(city, lat, lon) {
  try {
    console.log(`🎯 Fetching attractions for ${city} (${lat}, ${lon})`);
    
    // 1. Check cache first
    const cached = getCachedAttractions(city);
    if (cached) {
      return cached;
    }
    
    // 2. Try real APIs first
    const apiAttractions = [];
    
    // Google Places API
    if (GOOGLE_PLACES_API_KEY) {
      const googleAttractions = await getGooglePlacesAttractions(city, lat, lon);
      apiAttractions.push(...googleAttractions);
    }
    
    // Foursquare API  
    if (FOURSQUARE_API_KEY) {
      const foursquareAttractions = await getFoursquareAttractions(city, lat, lon);
      apiAttractions.push(...foursquareAttractions);
    }
    
    // 3. Get static fallback attractions
    const staticAttractions = await generateAttractionsForCity(city, lat, lon);
    
    // 4. Merge API and static data
    const mergedAttractions = mergeAttractions(apiAttractions, staticAttractions);
    
    console.log(`✅ Total attractions for ${city}: ${mergedAttractions.length} (${apiAttractions.length} from APIs, ${staticAttractions.length} static)`);
    
    // 5. Cache the result
    setCachedAttractions(city, mergedAttractions);
    
    return mergedAttractions;
    
  } catch (err) {
    console.error("❌ Error fetching attractions:", err);
    return generateAttractionsForCity(city, lat, lon);
  }
}

// Generate attractions using city knowledge and coordinates (FALLBACK)
async function generateAttractionsForCity(city, lat, lon) {
  const cityLower = city.toLowerCase();
  
  // Get specific attractions for known cities or use base attractions
  const specificAttractions = getSpecificCityAttractions(cityLower);
  const baseAttractions = generateBaseAttractions(city);
  
  // Merge base and specific attractions
  const fallbackAttractions = {
    outdoor: specificAttractions.outdoor || baseAttractions.outdoor,
    indoor: specificAttractions.indoor || baseAttractions.indoor,
    heritage: specificAttractions.heritage || baseAttractions.heritage,
    adventure: specificAttractions.adventure || baseAttractions.adventure,
    nightlife: specificAttractions.nightlife || baseAttractions.nightlife,
    beaches: specificAttractions.beaches || []
  };
  
  // Convert to flat array with proper format
  const allAttractions = [];
  
  Object.entries(fallbackAttractions).forEach(([category, attractions]) => {
    attractions.forEach(attraction => {
      allAttractions.push({
        name: attraction,
        category: category,
        rating: 4.2,
        reviews: Math.floor(Math.random() * 500) + 100,
        description: `Popular ${category} destination in ${city}`,
        source: 'static'
      });
    });
  });
  
  return allAttractions;
}

function getSpecificCityAttractions(cityLower) {
  return staticCityAttractions[cityLower] || {
    outdoor: [],
    indoor: [],
    heritage: [],
    adventure: [],
    nightlife: [],
    beaches: []
  };
}

// API Status and Health Check
export function getAPIStatus() {
  return {
    googlePlaces: {
      available: !!GOOGLE_PLACES_API_KEY,
      status: GOOGLE_PLACES_API_KEY ? 'active' : 'not configured'
    },
    foursquare: {
      available: !!FOURSQUARE_API_KEY,
      status: FOURSQUARE_API_KEY ? 'active' : 'not configured'
    },
    fallback: {
      available: true,
      status: 'static attraction database ready'
    }
  };
}