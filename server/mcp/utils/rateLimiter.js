// utils/rateLimiter.js
import { API_LIMITS } from '../config/environment.js';

// Rate limiting tracker
const apiCallTracker = {
  googlePlaces: { calls: 0, resetTime: Date.now() + (60 * 60 * 1000) }, // Reset every hour
  foursquare: { calls: 0, resetTime: Date.now() + (60 * 60 * 1000) },
  ticketmaster: { calls: 0, resetTime: Date.now() + (60 * 60 * 1000) }
};

export function canMakeAPICall(apiName) {
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