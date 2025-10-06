// services/eventsService.js
import { getTicketmasterEvents } from '../api/ticketmasterAPI.js';
import { getCachedEvents, setCachedEvents } from '../utils/cache.js';
import { curatedEventsByCity, getSeasonalEvents, generateGenericCityEvents, generateFallbackEvents } from '../data/curatedEvents.js';
import { TICKETMASTER_API_KEY } from '../config/environment.js';
import { canMakeAPICall } from '../utils/rateLimiter.js';

// Main function to get events happening during travel dates
export async function getEventsForTrip(city, lat, lon, startDate, endDate) {
  try {
    console.log(`🎭 Fetching events for ${city} from ${startDate} to ${endDate} (Coords: ${lat}, ${lon})`);
    
    // 1. Check cache first
    const cached = getCachedEvents(city, startDate, endDate);
    if (cached) {
      console.log(`📋 Using cached events for ${city}`);
      return cached;
    }
    
    // 2. Determine geographic region for API selection
    const isNorthAmerica = (lat >= 25 && lat <= 71 && lon >= -168 && lon <= -52);
    const isEurope = (lat >= 35 && lat <= 71 && lon >= -10 && lon <= 60);
    const isAustralia = (lat >= -50 && lat <= -10 && lon >= 110 && lon <= 180);
    const isTicketmasterRegion = isNorthAmerica || isEurope || isAustralia;
    
    console.log(`🌍 Geographic analysis: ${city} - Ticketmaster coverage: ${isTicketmasterRegion ? 'Yes' : 'Limited'}`);
    
    let events = null;
    
    // 3. Try Ticketmaster API (primarily for NA/EU/AU regions)
    if (TICKETMASTER_API_KEY && canMakeAPICall('ticketmaster') && isTicketmasterRegion) {
      console.log(`🎫 Trying Ticketmaster for ${city} (in supported region)`);
      events = await getTicketmasterEvents(city, lat, lon, startDate, endDate);
      if (events && events.length > 0) {
        console.log(`✅ Ticketmaster: Found ${events.length} events for ${city}`);
        setCachedEvents(city, startDate, endDate, events);
        return events;
      } else {
        console.log(`📍 Ticketmaster returned no events for ${city} - this is expected for some regions`);
      }
    } else if (!isTicketmasterRegion) {
      console.log(`🌏 Skipping Ticketmaster for ${city} - outside primary coverage area (Asia/Africa/South America)`);
    }
    
    // 4. Fallback to curated events database
    console.log(`🎨 Using curated events database for ${city} - this ensures users always get relevant event suggestions`);
    events = await getCuratedEventsForCity(city, startDate, endDate);
    
    // Cache even fallback data to improve performance
    setCachedEvents(city, startDate, endDate, events);
    return events;
    
  } catch (err) {
    console.error("❌ Error fetching events:", err);
    return generateFallbackEvents(city, startDate, endDate);
  }
}

// Curated events database for popular cities and general events
async function getCuratedEventsForCity(city, startDate, endDate) {
  const cityLower = city.toLowerCase();
  
  // Calculate days between dates for seasonal events
  const start = new Date(startDate);
  const end = new Date(endDate);
  const month = start.getMonth() + 1; // 1-12
  
  // Get events for the city or use generic events
  let cityEvents = curatedEventsByCity[cityLower] || generateGenericCityEvents(city);
  
  // Add seasonal events based on month
  const seasonalEvents = getSeasonalEvents(city, month);
  cityEvents = [...cityEvents, ...seasonalEvents];
  
  // Format events with dates during the trip
  const tripEvents = [];
  const tripDays = Math.ceil((end - start) / (1000 * 60 * 60 * 24)) + 1;
  
  cityEvents.forEach((event, index) => {
    // Distribute events across trip dates
    const dayOffset = index % tripDays;
    const eventDate = new Date(start);
    eventDate.setDate(start.getDate() + dayOffset);
    
    tripEvents.push({
      ...event,
      date: eventDate.toISOString().split('T')[0],
      type: 'curated_event'
    });
  });
  
  return tripEvents.slice(0, 8); // Max 8 curated events
}