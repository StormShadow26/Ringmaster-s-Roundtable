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

// Fetch sample lodging places with price_level and rating
export async function getGoogleLodgingSamples(lat, lon, limit = 20) {
  if (!GOOGLE_PLACES_API_KEY || !canMakeAPICall('googlePlaces')) {
    return [];
  }
  try {
    const url = `https://maps.googleapis.com/maps/api/place/nearbysearch/json?location=${lat},${lon}&radius=10000&type=lodging&key=${GOOGLE_PLACES_API_KEY}`;
    const response = await fetch(url);
    const data = await response.json();
    const results = Array.isArray(data.results) ? data.results : [];
    return results
      .filter(p => p.user_ratings_total >= 20)
      .slice(0, limit)
      .map(p => ({
        name: p.name,
        price_level: p.price_level, // 0-4 per Google
        rating: p.rating,
        user_ratings_total: p.user_ratings_total
      }));
  } catch (e) {
    console.error('❌ Google Places lodging error:', e.message);
    return [];
  }
}

// Fetch sample restaurants with price_level for food cost inference
export async function getGoogleRestaurantSamples(lat, lon, limit = 30) {
  if (!GOOGLE_PLACES_API_KEY || !canMakeAPICall('googlePlaces')) {
    return [];
  }
  try {
    const url = `https://maps.googleapis.com/maps/api/place/nearbysearch/json?location=${lat},${lon}&radius=8000&type=restaurant&key=${GOOGLE_PLACES_API_KEY}`;
    const response = await fetch(url);
    const data = await response.json();
    const results = Array.isArray(data.results) ? data.results : [];
    return results
      .filter(p => p.user_ratings_total >= 30)
      .slice(0, limit)
      .map(p => ({
        name: p.name,
        price_level: p.price_level,
        rating: p.rating,
        user_ratings_total: p.user_ratings_total
      }));
  } catch (e) {
    console.error('❌ Google Places restaurant error:', e.message);
    return [];
  }
}