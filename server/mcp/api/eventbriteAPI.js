// api/eventbriteAPI.js
import fetch from "node-fetch";
import { EVENTBRITE_API_KEY } from '../config/environment.js';
import { canMakeAPICall } from '../utils/rateLimiter.js';

export async function getEventbriteEvents(city, lat, lon, startDate, endDate) {
  if (!EVENTBRITE_API_KEY) {
    console.log("❌ Eventbrite API key not found");
    return null;
  }
  
  try {
    console.log(`🎪 Attempting Eventbrite API for ${city} (${lat}, ${lon}) from ${startDate} to ${endDate}`);
    
    // Note: Current Eventbrite token may have limited search access
    // This is a common issue with free-tier Eventbrite tokens
    console.log("⚠️ Eventbrite search endpoint not accessible with current token - skipping to curated events");
    return null;
    
    /* EVENTBRITE API CODE (commented due to API limitations)
    const events = [];
    
    // Format dates for Eventbrite API
    const startDateTime = `${startDate}T00:00:00`;
    const endDateTime = `${endDate}T23:59:59`;
    
    // Eventbrite API with correct authorization header
    const url = `https://www.eventbriteapi.com/v3/events/search/?location.latitude=${lat}&location.longitude=${lon}&location.within=50km&start_date.range_start=${startDateTime}&start_date.range_end=${endDateTime}`;
    
    console.log(`🔍 Eventbrite URL: ${url}`);
    
    const response = await fetch(url, {
      headers: {
        'Authorization': `Bearer ${EVENTBRITE_API_KEY}`,
        'Content-Type': 'application/json'
      }
    });
    
    const data = await response.json();
    
    console.log(`📊 Eventbrite response status: ${response.status}`);
    console.log(`📊 Eventbrite response keys:`, Object.keys(data));
    
    if (response.status !== 200) {
      console.error("❌ Eventbrite API returned non-200 status:", response.status, data);
      return null;
    }
    
    if (data.events && data.events.length > 0) {
      console.log(`✅ Found ${data.events.length} Eventbrite events`);
      
      data.events.forEach(event => {
        // Categorize events based on category or name
        let category = 'community';
        const eventName = event.name.text.toLowerCase();
        
        if (eventName.includes('concert') || eventName.includes('music') || eventName.includes('band')) {
          category = 'concerts';
        } else if (eventName.includes('festival') || eventName.includes('fair')) {
          category = 'festivals';
        } else if (eventName.includes('sport') || eventName.includes('game') || eventName.includes('match')) {
          category = 'sports';
        } else if (eventName.includes('art') || eventName.includes('exhibition') || eventName.includes('gallery')) {
          category = 'cultural';
        }
        
        events.push({
          name: event.name.text,
          category: category,
          date: event.start.local.split('T')[0],
          time: event.start.local.split('T')[1],
          venue: event.venue?.name || 'Online/TBA',
          description: event.description?.text?.substring(0, 200) || `Local ${category} event in ${city}`,
          url: event.url,
          priceRange: event.is_free ? 'Free' : 'Paid event',
          type: 'community_event',
          source: 'Eventbrite'
        });
      });
    }
    
    console.log(`🎪 Total Eventbrite events found: ${events.length}`);
    return events.length > 0 ? events.slice(0, 10) : null; // Max 10 events
    */
    
  } catch (err) {
    console.error("❌ Eventbrite API error:", err);
    return null;
  }
}