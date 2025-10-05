// api/googlePlacesAPI.js
import fetch from "node-fetch";
import { GOOGLE_PLACES_API_KEY } from '../config/environment.js';
import { canMakeAPICall } from '../utils/rateLimiter.js';

export async function getGooglePlacesAttractions(city, lat, lon) {
  if (!GOOGLE_PLACES_API_KEY || !canMakeAPICall('googlePlaces')) {
    return [];
  }

  try {
    console.log(`🔍 Fetching Google Places for ${city}`);
    
    const types = ['tourist_attraction', 'museum', 'park', 'place_of_worship', 'point_of_interest'];
    const allAttractions = [];

    for (const type of types) {
      const url = `https://maps.googleapis.com/maps/api/place/nearbysearch/json?location=${lat},${lon}&radius=10000&type=${type}&key=${GOOGLE_PLACES_API_KEY}`;
      
      const response = await fetch(url);
      const data = await response.json();

      if (data.results) {
        data.results.forEach((place) => {
          if (place.rating >= 4.0 && place.user_ratings_total >= 50) {
            allAttractions.push({
              name: place.name,
              category: getCategoryFromGoogleType(type),
              rating: place.rating,
              reviews: place.user_ratings_total,
              description: `Popular ${getCategoryFromGoogleType(type)} in ${city}`,
              source: 'Google Places'
            });
          }
        });
      }
      
      // Small delay between requests
      await new Promise(resolve => setTimeout(resolve, 200));
    }

    console.log(`✅ Google Places: Found ${allAttractions.length} attractions for ${city}`);
    return allAttractions.slice(0, 10); // Limit to top 10
    
  } catch (error) {
    console.error("❌ Google Places API error:", error.message);
    return [];
  }
}

function getCategoryFromGoogleType(type) {
  const categoryMap = {
    'tourist_attraction': 'attraction',
    'museum': 'cultural',
    'park': 'nature',
    'place_of_worship': 'cultural',
    'point_of_interest': 'attraction'
  };
  return categoryMap[type] || 'attraction';
}