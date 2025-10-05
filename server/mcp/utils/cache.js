// utils/cache.js
import { CACHE_DURATION, EVENTS_CACHE_DURATION } from '../config/environment.js';

// Cache storage
const attractionCache = new Map();
const eventsCache = new Map();

// --- Attractions Cache Functions ---
export function getCachedAttractions(city) {
  const cached = attractionCache.get(city.toLowerCase());
  if (cached && (Date.now() - cached.timestamp) < CACHE_DURATION) {
    console.log(`📦 Using cached attractions for ${city}`);
    return cached.data;
  }
  return null;
}

export function setCachedAttractions(city, data) {
  attractionCache.set(city.toLowerCase(), {
    data,
    timestamp: Date.now()
  });
  console.log(`💾 Cached attractions for ${city}`);
}

// --- Events Cache Functions ---
export function getCachedEvents(city, startDate, endDate) {
  const cacheKey = `${city.toLowerCase()}-${startDate}-${endDate}`;
  const cached = eventsCache.get(cacheKey);
  if (cached && (Date.now() - cached.timestamp) < EVENTS_CACHE_DURATION) {
    console.log(`📦 Using cached events for ${city} (${startDate} to ${endDate})`);
    return cached.data;
  }
  return null;
}

export function setCachedEvents(city, startDate, endDate, data) {
  const cacheKey = `${city.toLowerCase()}-${startDate}-${endDate}`;
  eventsCache.set(cacheKey, {
    data,
    timestamp: Date.now()
  });
  console.log(`💾 Cached events for ${city} (${startDate} to ${endDate})`);
}