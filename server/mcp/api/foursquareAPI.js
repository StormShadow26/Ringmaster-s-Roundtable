// api/foursquareAPI.js
import fetch from "node-fetch";
import { FOURSQUARE_API_KEY } from '../config/environment.js';
import { canMakeAPICall } from '../utils/rateLimiter.js';

export async function getFoursquareAttractions(city, lat, lon) {
  // console.log(`🔍 Foursquare API Check:`, {
  //   hasApiKey: !!FOURSQUARE_API_KEY,
  //   canMakeCall: canMakeAPICall('foursquare'),
  //   coordinates: { lat, lon }
  // });

  if (!FOURSQUARE_API_KEY) {
    console.log('❌ FOURSQUARE_API_KEY not configured');
    return [];
  }

  if (!canMakeAPICall('foursquare')) {
    console.log('❌ Foursquare API rate limit exceeded');
    return [];
  }

  try {
    // Updated Foursquare categories for tourist attractions
    const categories = [
      '10000', // Arts & Entertainment
      '12000', // Community & Government 
      '16000', // Travel & Transport
      '19000', // Nightlife Spot
      '15000'  // Travel Retail
    ];
    
    const allAttractions = [];

    for (const categoryId of categories) {
      // Updated Foursquare Places API endpoint (new base URL)
      const url = `https://places-api.foursquare.com/places/search?ll=${lat}%2C${lon}&radius=10000&categories=${categoryId}&limit=20&sort=POPULARITY`;
      
      const response = await fetch(url, {
        headers: {
          'Authorization': `Bearer ${FOURSQUARE_API_KEY}`,
          'Accept': 'application/json',
          'X-Places-Api-Version': '2025-06-17'
        }
      });

      if (!response.ok) {
        console.error(`❌ Foursquare API HTTP ${response.status}:`, response.statusText);
        continue;
      }

      const data = await response.json();

      if (data.results && data.results.length > 0) {

        data.results.forEach((place, index) => {
          // Enhanced venue processing with coordinates (new API format)
          const attraction = {
            name: place.name,
            category: getCategoryFromFoursquareId(categoryId),
            rating: place.rating || 4.0,
            reviews: place.stats?.total_photos || place.stats?.checkinsCount || 0,
            description: `${getCategoryFromFoursquareId(categoryId)} venue in ${city}`,
            source: 'Foursquare',
            // Add location data for map pinning (new API format)
            geometry: {
              location: {
                lat: place.latitude || lat,
                lng: place.longitude || lon
              }
            },
            vicinity: place.location?.formatted_address || place.location?.address,
            formatted_address: place.location?.formatted_address,
            foursquare_id: place.fsq_place_id, // New API uses fsq_place_id
            categories: place.categories?.map(c => c.name).join(', ')
          };

          allAttractions.push(attraction);
        });
      }
      
      // Small delay between requests
      await new Promise(resolve => setTimeout(resolve, 300));
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
    '10000': 'cultural',    // Arts & Entertainment
    '12000': 'community',   // Community & Government
    '16000': 'travel',      // Travel & Transport
    '19000': 'nightlife',   // Nightlife Spot
    '15000': 'shopping'     // Travel Retail
  };
  return categoryMap[categoryId] || 'attraction';
}