// config/environment.js
import dotenv from "dotenv";

dotenv.config();

// API Keys
export const OPENWEATHER_API_KEY = process.env.OPENWEATHER_API_KEY;
export const GOOGLE_PLACES_API_KEY = process.env.GOOGLE_PLACES_API_KEY;
export const FOURSQUARE_API_KEY = process.env.FOURSQUARE_API_KEY;
export const EVENTBRITE_API_KEY = process.env.EVENTBRITE_API_KEY;
export const TICKETMASTER_API_KEY = process.env.TICKETMASTER_API_KEY;

// Validate required API keys
if (!OPENWEATHER_API_KEY) {
  throw new Error("OPENWEATHER_API_KEY not set in .env");
}

// Warn about optional API keys
if (!GOOGLE_PLACES_API_KEY) {
  console.warn("⚠️ GOOGLE_PLACES_API_KEY not set - using fallback attraction data");
}
if (!FOURSQUARE_API_KEY) {
  console.warn("⚠️ FOURSQUARE_API_KEY not set - using fallback attraction data");
}
if (!EVENTBRITE_API_KEY) {
  console.warn("⚠️ EVENTBRITE_API_KEY not set - using fallback event data");
}
if (!TICKETMASTER_API_KEY) {
  console.warn("⚠️ TICKETMASTER_API_KEY not set - using fallback event data");
}

// Cache Configuration
export const CACHE_DURATION = 24 * 60 * 60 * 1000; // 24 hours
export const EVENTS_CACHE_DURATION = 6 * 60 * 60 * 1000; // 6 hours (events change more frequently)

// API Rate Limits
export const API_LIMITS = {
  googlePlaces: 100, // Conservative limit per hour
  foursquare: 50,    // Conservative limit per hour
  eventbrite: 200,   // Eventbrite is more generous
  ticketmaster: 100  // Ticketmaster rate limit
};