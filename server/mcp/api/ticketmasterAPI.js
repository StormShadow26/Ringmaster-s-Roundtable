// api/ticketmasterAPI.js
import fetch from "node-fetch";
import { TICKETMASTER_API_KEY } from '../config/environment.js';
import { canMakeAPICall } from '../utils/rateLimiter.js';

export async function getTicketmasterEvents(city, lat, lon, startDate, endDate) {
  if (!TICKETMASTER_API_KEY) {
    console.log("❌ Ticketmaster API key not found");
    return null;
  }
  
  try {
    const radius = '50'; // 50 miles radius
    const events = [];
    
    // Format dates for Ticketmaster API (YYYY-MM-DDTHH:MM:SSZ)
    const startDateTime = `${startDate}T00:00:00Z`;
    const endDateTime = `${endDate}T23:59:59Z`;
    
    console.log(`🎫 Fetching Ticketmaster events for ${city} (${lat}, ${lon}) from ${startDate} to ${endDate}`);
    
    // Try a general search first (without segment filtering)
    try {
      const generalUrl = `https://app.ticketmaster.com/discovery/v2/events.json?apikey=${TICKETMASTER_API_KEY}&latlong=${lat},${lon}&radius=${radius}&unit=miles&startDateTime=${startDateTime}&endDateTime=${endDateTime}&size=20&sort=date,asc`;
      
      //console.log(`🔍 Ticketmaster URL: ${generalUrl.replace(TICKETMASTER_API_KEY, 'API_KEY_HIDDEN')}`);
      
      const response = await fetch(generalUrl);
      const data = await response.json();
      
      console.log(`📊 Ticketmaster response status: ${response.status}`);
      
      if (response.status !== 200) {
        console.error("❌ Ticketmaster API returned non-200 status:", response.status, data);
        return null;
      }
      
      console.log(`📊 Ticketmaster response keys:`, Object.keys(data));
      
      if (data._embedded?.events) {
        console.log(`✅ Found ${data._embedded.events.length} Ticketmaster events`);
        
        data._embedded.events.forEach(event => {
          // Determine category based on classifications
          let category = 'community';
          if (event.classifications?.[0]) {
            const segment = event.classifications[0].segment?.name?.toLowerCase() || '';
            const genre = event.classifications[0].genre?.name?.toLowerCase() || '';
            
            if (segment.includes('music') || genre.includes('music')) {
              category = 'concerts';
            } else if (segment.includes('sports')) {
              category = 'sports';
            } else if (segment.includes('arts') || segment.includes('theatre')) {
              category = 'cultural';
            } else if (genre.includes('festival')) {
              category = 'festivals';
            }
          }
          
          events.push({
            name: event.name,
            category: category,
            date: event.dates.start.localDate,
            time: event.dates.start.localTime || '20:00',
            venue: event._embedded?.venues?.[0]?.name || 'TBA',
            description: event.info || event.pleaseNote || `${category.charAt(0).toUpperCase() + category.slice(1)} event in ${city}`,
            url: event.url,
            priceRange: event.priceRanges?.[0] ? 
              `$${event.priceRanges[0].min} - $${event.priceRanges[0].max}` : 
              'Price varies',
            type: 'live_event',
            source: 'Ticketmaster'
          });
        });
      } else {
        console.log("❌ No events found in Ticketmaster response");
      }
      
    } catch (fetchError) {
      console.error("❌ Ticketmaster fetch error:", fetchError.message);
    }
    
    console.log(`🎫 Total Ticketmaster events found: ${events.length}`);
    return events.length > 0 ? events.slice(0, 15) : null; // Max 15 events
    
  } catch (err) {
    console.error("❌ Ticketmaster API error:", err);
    return null;
  }
}