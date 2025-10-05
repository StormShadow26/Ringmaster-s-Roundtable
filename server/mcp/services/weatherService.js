// services/weatherService.js
import fetch from "node-fetch";
import { OPENWEATHER_API_KEY } from '../config/environment.js';

export async function getWeatherByCityAndDate(city, startDate, endDate) {
  try {
    console.log(`🌤️ Fetching weather for ${city} from ${startDate} to ${endDate}`);

    // 1️⃣ Get coordinates for the city with improved geocoding
    let geoQuery = city;
    
    // Add country context for common ambiguous city names
    const cityEnhancements = {
      'goa': 'panaji, goa, india', // Use capital city since OpenWeatherMap doesn't recognize Goa state directly
      'paris': 'paris, france', 
      'london': 'london, uk',
      'delhi': 'delhi, india',
      'mumbai': 'mumbai, india',
      'bangalore': 'bangalore, india',
      'chennai': 'chennai, india',
      'hyderabad': 'hyderabad, india',
      'pune': 'pune, india',
      'kolkata': 'kolkata, india',
      'agra': 'agra, india',
      'jaipur': 'jaipur, india',
      'udaipur': 'udaipur, india',
      'varanasi': 'varanasi, india',
      'rishikesh': 'rishikesh, india',
      'manali': 'manali, india',
      'shimla': 'shimla, india',
      'darjeeling': 'darjeeling, india',
      'kochi': 'kochi, india',
      'mysore': 'mysore, india'
    };
    
    const cityLower = city.toLowerCase().trim();
    if (cityEnhancements[cityLower]) {
      geoQuery = cityEnhancements[cityLower];
      console.log(`🌍 Enhanced query: "${city}" -> "${geoQuery}"`);
    }
    
    const geoRes = await fetch(
      `https://api.openweathermap.org/geo/1.0/direct?q=${encodeURIComponent(geoQuery)}&limit=5&appid=${OPENWEATHER_API_KEY}`
    );
    const geoData = await geoRes.json();

    if (!geoData[0]) {
      return { error: `City "${city}" not found.` };
    }

    // For ambiguous cities, prefer results from India if available
    let selectedLocation = geoData[0];
    if (geoData.length > 1) {
      const indiaResult = geoData.find(loc => loc.country === 'IN');
      if (indiaResult && (cityLower.includes('goa') || cityLower.includes('delhi') || cityLower.includes('mumbai'))) {
        selectedLocation = indiaResult;
        console.log(`🇮🇳 Selected India location over other matches`);
      }
    }

    const { lat, lon } = selectedLocation;
    console.log(`📍 ${city} coordinates: ${lat}, ${lon} (${selectedLocation.country})`);

    // 2️⃣ Get 5-day weather forecast
    const weatherRes = await fetch(
      `https://api.openweathermap.org/data/2.5/forecast?lat=${lat}&lon=${lon}&appid=${OPENWEATHER_API_KEY}&units=metric`
    );
    const weatherData = await weatherRes.json();

    if (!weatherData.list) {
      return { error: "Weather data not available." };
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