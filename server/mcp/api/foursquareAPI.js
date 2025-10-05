// api/foursquareAPI.js
import fetch from "node-fetch";
import { FOURSQUARE_API_KEY } from '../config/environment.js';
import { canMakeAPICall } from '../utils/rateLimiter.js';

export async function getFoursquareAttractions(city, lat, lon) {
  if (!FOURSQUARE_API_KEY || !canMakeAPICall('foursquare')) {
    return [];
  }

  try {
    console.log(`🔍 Fetching Foursquare venues for ${city}`);
    
    const categories = ['10000', '12000', '16000']; // Arts, Entertainment, Travel
    const allAttractions = [];

    for (const categoryId of categories) {
      const url = `https://api.foursquare.com/v3/places/search?ll=${lat},${lon}&radius=10000&categories=${categoryId}&limit=20`;
      
      const response = await fetch(url, {
        headers: {
          'Authorization': FOURSQUARE_API_KEY,
          'Accept': 'application/json'
        }
      });

      const data = await response.json();

      if (data.results) {
        data.results.forEach((place) => {
          allAttractions.push({
            name: place.name,
            category: getCategoryFromFoursquareId(categoryId),
            rating: place.rating || 4.0,
            reviews: place.stats?.total_photos || 0,
            description: `${getCategoryFromFoursquareId(categoryId)} venue in ${city}`,
            source: 'Foursquare'
          });
        });
      }
      
      // Small delay between requests
      await new Promise(resolve => setTimeout(resolve, 200));
    }

    console.log(`✅ Foursquare: Found ${allAttractions.length} attractions for ${city}`);
    return allAttractions.slice(0, 8); // Limit to top 8
    
  } catch (error) {
    console.error("❌ Foursquare API error:", error.message);
    return [];
  }
}

function getCategoryFromFoursquareId(categoryId) {
  const categoryMap = {
    '10000': 'cultural', // Arts & Entertainment
    '12000': 'attraction', // Event
    '16000': 'attraction'  // Travel & Transportation
  };
  return categoryMap[categoryId] || 'attraction';
}