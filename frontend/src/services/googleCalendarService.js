// Google Calendar Integration Service - Modern GIS Implementation
class GoogleCalendarService {
  constructor() {
    this.clientId = import.meta.env.VITE_GOOGLE_CLIENT_ID;
    this.scope = 'https://www.googleapis.com/auth/calendar';
    
    this.tokenClient = null;
    this.accessToken = null;
    this.isInitialized = false;
  }

  // Initialize Google Identity Services (GIS)
  async initialize() {
    if (this.isInitialized) return true;
    
    try {
      // Load Google Identity Services
      if (!window.google?.accounts?.oauth2) {
        await this.loadGoogleIdentityServices();
      }
      
      // Initialize token client
      this.tokenClient = window.google.accounts.oauth2.initTokenClient({
        client_id: this.clientId,
        scope: this.scope,
        callback: '', // Will be set later when requesting token
      });
      
      this.isInitialized = true;
      console.log('✅ Google Identity Services initialized');
      return true;
      
    } catch (error) {
      console.error('❌ Failed to initialize Google Identity Services:', error);
      return false;
    }
  }

  // Load Google Identity Services script
  loadGoogleIdentityServices() {
    return new Promise((resolve, reject) => {
      const script = document.createElement('script');
      script.src = 'https://accounts.google.com/gsi/client';
      script.onload = resolve;
      script.onerror = reject;
      document.head.appendChild(script);
    });
  }

  // Check if user has valid access token
  isSignedIn() {
    return !!this.accessToken;
  }

  // Request access token from Google
  async signIn() {
    try {
      if (!this.isInitialized) {
        const initialized = await this.initialize();
        if (!initialized) throw new Error('Failed to initialize Google Identity Services');
      }

      return new Promise((resolve, reject) => {
        this.tokenClient.callback = (response) => {
          if (response.error !== undefined) {
            console.error('❌ OAuth Error Details:', response);
            
            // Provide helpful error messages based on error type
            let userMessage = 'Authentication failed. ';
            if (response.error === 'access_denied') {
              userMessage += 'This app needs to be configured in Google Cloud Console. Please contact the developer.';
            } else if (response.error === 'popup_blocked') {
              userMessage += 'Please allow popups for this site and try again.';
            } else {
              userMessage += `Error: ${response.error}`;
            }
            
            reject(new Error(userMessage));
            return;
          }
          
          this.accessToken = response.access_token;
          console.log('✅ Access token received successfully');
          resolve(true);
        };
        
        // Try to request token with proper error handling
        try {
          this.tokenClient.requestAccessToken({
            prompt: 'consent',
            hint: 'Please allow calendar access to sync your travel itinerary'
          });
        } catch (requestError) {
          console.error('❌ Error requesting access token:', requestError);
          reject(new Error('Failed to initiate Google sign-in. Please try again.'));
        }
      });
      
    } catch (error) {
      console.error('❌ Google Calendar sign-in failed:', error);
      throw error;
    }
  }

  // Parse itinerary text to extract daily activities
  parseItinerary(itineraryText, startDate, destination) {
    const events = [];
    const lines = itineraryText.split('\n');
    
    let currentDay = 0;
    let currentDate = new Date(startDate);
    
    // Patterns to match day headers
    const dayPatterns = [
      /^Day\s+(\d+)/i,
      /^(\d+)\.\s/,
      /^(\d+):/,
      /^Day\s+(\d+):/i
    ];
    
    // Patterns to match times
    const timePatterns = [
      /(\d{1,2}):(\d{2})\s*(AM|PM|am|pm)/,
      /(\d{1,2}):(\d{2})/,
      /(\d{1,2})\s*(AM|PM|am|pm)/
    ];
    
    for (let line of lines) {
      line = line.trim();
      if (!line) continue;
      
      // Check if this is a day header
      let dayMatch = null;
      for (const pattern of dayPatterns) {
        dayMatch = line.match(pattern);
        if (dayMatch) break;
      }
      
      if (dayMatch) {
        currentDay = parseInt(dayMatch[1]);
        currentDate = new Date(startDate);
        currentDate.setDate(currentDate.getDate() + (currentDay - 1));
        continue;
      }
      
      // Skip if we haven't found a day yet
      if (currentDay === 0) continue;
      
      // Extract activity information
      if (line.length > 10 && !line.includes('**') && !line.includes('###')) {
        let startTime = '09:00'; // Default start time
        let duration = 2; // Default 2 hours
        
        // Try to extract time from the line
        for (const pattern of timePatterns) {
          const timeMatch = line.match(pattern);
          if (timeMatch) {
            let hours = parseInt(timeMatch[1]);
            const minutes = timeMatch[2] || '00';
            const ampm = timeMatch[3];
            
            if (ampm && ampm.toLowerCase() === 'pm' && hours !== 12) {
              hours += 12;
            } else if (ampm && ampm.toLowerCase() === 'am' && hours === 12) {
              hours = 0;
            }
            
            startTime = `${String(hours).padStart(2, '0')}:${minutes}`;
            line = line.replace(timeMatch[0], '').trim();
            break;
          }
        }
        
        // Clean up the activity title
        let title = line
          .replace(/^[-•*]\s*/, '') // Remove bullet points
          .replace(/^\d+\.\s*/, '') // Remove numbers
          .replace(/:\s*$/, '') // Remove trailing colons
          .trim();
        
        if (title.length > 3) { // Only add meaningful activities
          // Determine activity type and adjust duration
          if (title.toLowerCase().includes('museum') || 
              title.toLowerCase().includes('gallery') ||
              title.toLowerCase().includes('tour')) {
            duration = 3;
          } else if (title.toLowerCase().includes('lunch') || 
                     title.toLowerCase().includes('dinner') ||
                     title.toLowerCase().includes('meal')) {
            duration = 1;
          } else if (title.toLowerCase().includes('hotel') || 
                     title.toLowerCase().includes('check')) {
            duration = 0.5;
          }
          
          events.push({
            title,
            date: new Date(currentDate),
            startTime,
            duration,
            location: destination,
            day: currentDay
          });
        }
      }
    }
    
    return events;
  }

  // Create calendar events from itinerary
  async syncItineraryToCalendar(itineraryText, travelData) {
    try {
      if (!this.isSignedIn()) {
        await this.signIn();
      }

      console.log('🔄 Starting calendar sync...');
      console.log('📄 Received itinerary text length:', itineraryText?.length);
      console.log('🗺️ Received travel data:', travelData);
      
      // Use the ENHANCED parsing method instead of the old one
      const activities = this.parseItineraryActivities(itineraryText, travelData);
      
      if (activities.length === 0) {
        console.log('❌ No activities found after parsing');
        throw new Error('No activities found in the itinerary to sync');
      }
      
      console.log(`🎯 Found ${activities.length} activities to sync:`, activities);
      
      // Create calendar events
      const createdEvents = [];
      
      for (const activity of activities) {
        const destination = travelData?.destination?.city || travelData?.city || travelData?.destination || 'Travel Destination';
        
        const calendarEvent = await this.createCalendarEvent({
          summary: `${activity.title}`,
          description: `${activity.description}\n\nPart of your ${destination} travel itinerary (Day ${activity.day})`,
          location: destination,
          start: {
            dateTime: activity.startTime.toISOString(),
            timeZone: Intl.DateTimeFormat().resolvedOptions().timeZone
          },
          end: {
            dateTime: activity.endTime.toISOString(),
            timeZone: Intl.DateTimeFormat().resolvedOptions().timeZone
          },
          colorId: '10' // Green color for travel events
        });
        
        if (calendarEvent) {
          createdEvents.push(calendarEvent);
        }
      }
      
      console.log(`✅ Successfully synced ${createdEvents.length} events to Google Calendar`);
      
      return {
        success: true,
        eventsCreated: createdEvents.length,
        events: createdEvents
      };
      
    } catch (error) {
      console.error('❌ Calendar sync failed:', error);
      throw error;
    }
  }

  // Create a single calendar event using REST API
  async createCalendarEvent(eventData) {
    try {
      if (!this.accessToken) {
        throw new Error('No access token available');
      }

      const response = await fetch('https://www.googleapis.com/calendar/v3/calendars/primary/events', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${this.accessToken}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(eventData)
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(`Calendar API error: ${response.status} - ${errorData.error?.message || 'Unknown error'}`);
      }

      const result = await response.json();
      console.log('✅ Created calendar event:', result.summary);
      return result;
      
    } catch (error) {
      console.error('❌ Failed to create calendar event:', error);
      return null;
    }
  }

  // Helper to create ISO datetime string
  createDateTime(date, time, durationHours = 0) {
    const [hours, minutes] = time.split(':').map(Number);
    const eventDate = new Date(date);
    eventDate.setHours(hours + durationHours, minutes + (durationHours % 1) * 60);
    return eventDate.toISOString();
  }

  // Get calendar events for a date range (for verification) using REST API
  async getEvents(startDate, endDate) {
    try {
      if (!this.isSignedIn()) return [];
      
      const params = new URLSearchParams({
        timeMin: startDate.toISOString(),
        timeMax: endDate.toISOString(),
        singleEvents: 'true',
        orderBy: 'startTime'
      });

      const response = await fetch(`https://www.googleapis.com/calendar/v3/calendars/primary/events?${params}`, {
        headers: {
          'Authorization': `Bearer ${this.accessToken}`,
        }
      });

      if (!response.ok) {
        throw new Error(`Calendar API error: ${response.status}`);
      }

      const result = await response.json();
      return result.items || [];
      
    } catch (error) {
      console.error('Failed to fetch calendar events:', error);
      return [];
    }
  }

  parseItineraryActivities(itineraryText, travelData) {
    console.log('🔍 Parsing itinerary content:', itineraryText);
    console.log('🗺️ Using travel data:', travelData);

    const activities = [];
    
    if (!itineraryText || typeof itineraryText !== 'string') {
      console.log('❌ Invalid itinerary text provided');
      return activities;
    }

    // Enhanced day detection patterns - more flexible
    const dayPatterns = [
      /##\s*Day\s*(\d+)[:\-\s]*([^\n]+)?/gi,           // ## Day 1: or ## Day 1
      /###\s*Day\s*(\d+)[:\-\s]*([^\n]+)?/gi,          // ### Day 1: or ### Day 1
      /\*\*Day\s*(\d+)[:\-\s]*([^\n]+)?\*\*/gi,        // **Day 1:** or **Day 1**
      /Day\s*(\d+)[:\-\s]*([^\n]+)?/gi,                // Day 1: or Day 1 -
      /(\d+)\.\s*Day[:\-\s]*([^\n]+)?/gi,              // 1. Day: or 1. Day -
    ];

    let dayMatches = [];
    
    // Try each pattern to find day sections
    for (const pattern of dayPatterns) {
      const matches = [...itineraryText.matchAll(pattern)];
      if (matches.length > 0) {
        dayMatches = matches;
        console.log(`✅ Found ${matches.length} days using pattern:`, pattern);
        break;
      }
    }

    if (dayMatches.length === 0) {
      console.log('❌ No day sections found, trying alternative parsing...');
      return this.parseActivitiesWithoutDays(itineraryText, travelData);
    }

    // Process each day
    dayMatches.forEach((match, index) => {
      const dayNumber = parseInt(match[1]);
      const dayTitle = match[2] || `Day ${dayNumber}`;
      
      console.log(`📅 Processing Day ${dayNumber}: ${dayTitle}`);
      
      // Find the content for this day
      let dayContent = '';
      const dayStart = match.index + match[0].length;
      
      if (index < dayMatches.length - 1) {
        // Not the last day - content until next day
        dayContent = itineraryText.substring(dayStart, dayMatches[index + 1].index);
      } else {
        // Last day - content until end
        dayContent = itineraryText.substring(dayStart);
      }
      
      // Extract activities from this day's content
      const dayActivities = this.extractActivitiesFromText(dayContent, dayNumber);
      console.log(`📝 Found ${dayActivities.length} activities for Day ${dayNumber}:`, dayActivities);
      
      activities.push(...dayActivities);
    });

    console.log(`🎯 Total activities parsed: ${activities.length}`);
    return activities;
  }

  extractActivitiesFromText(text, dayNumber) {
    const activities = [];
    
    // Multiple activity patterns
    const activityPatterns = [
      /^\s*[\-\*\•]\s*(.+)$/gm,                    // - Activity or * Activity or • Activity
      /^\s*(\d+)\.\s*(.+)$/gm,                     // 1. Activity
      /^\s*(\d{1,2}:\d{2}\s*(?:AM|PM)?)[:\-\s]*(.+)$/gmi,  // 9:00 AM: Activity
      /^\s*(Morning|Afternoon|Evening)[:\-\s]*(.+)$/gmi,   // Morning: Activity
      /^\s*🕐\s*(.+)$/gm,                          // 🕐 Activity (with clock emoji)
      /^\s*⏰\s*(.+)$/gm,                          // ⏰ Activity (with alarm emoji)
    ];

    let foundActivities = [];

    // Try each pattern
    for (const pattern of activityPatterns) {
      const matches = [...text.matchAll(pattern)];
      matches.forEach(match => {
        let activity = '';
        let time = null;
        
        if (match.length === 2) {
          activity = match[1].trim();
        } else if (match.length === 3) {
          time = match[1];
          activity = match[2].trim();
        }
        
        if (activity && activity.length > 3) {
          foundActivities.push({ activity, time });
        }
      });
      
      if (foundActivities.length > 0) {
        console.log(`✅ Found activities using pattern:`, pattern);
        break;
      }
    }

    // If no structured activities found, try to extract from sentences
    if (foundActivities.length === 0) {
      foundActivities = this.extractActivitiesFromSentences(text);
    }

    // Convert to activity objects with timing
    foundActivities.forEach((item, index) => {
      const startTime = this.calculateActivityTime(dayNumber, index, item.time);
      const endTime = new Date(startTime.getTime() + (2 * 60 * 60 * 1000)); // 2 hours duration
      
      activities.push({
        title: item.activity,
        description: item.activity,
        startTime: startTime,
        endTime: endTime,
        day: dayNumber
      });
    });

    return activities;
  }

  extractActivitiesFromSentences(text) {
    // Extract activities from sentence-based content
    const sentences = text.split(/[.!?]+/).filter(s => s.trim().length > 10);
    const activities = [];
    
    // Look for action words that indicate activities
    const actionWords = ['visit', 'explore', 'see', 'go to', 'walk', 'take', 'enjoy', 'experience', 'discover', 'tour', 'stop by'];
    
    sentences.forEach(sentence => {
      const lowerSentence = sentence.toLowerCase();
      const hasAction = actionWords.some(word => lowerSentence.includes(word));
      
      if (hasAction && sentence.trim().length > 15) {
        activities.push({
          activity: sentence.trim(),
          time: null
        });
      }
    });
    
    console.log(`📝 Extracted ${activities.length} activities from sentences`);
    return activities;
  }

  parseActivitiesWithoutDays(itineraryText, travelData) {
    console.log('🔄 Parsing activities without day structure...');
    
    // Try to extract any activities from the entire text
    const activities = this.extractActivitiesFromText(itineraryText, 1);
    
    if (activities.length === 0) {
      // Last resort - create activities from key sentences
      const sentences = itineraryText.split(/[.!?]+/)
        .filter(s => s.trim().length > 20)
        .slice(0, 10); // Take first 10 meaningful sentences      
      sentences.forEach((sentence, index) => {
        if (sentence.trim().length > 15) {
          const startTime = this.calculateActivityTime(1, index, null);
          const endTime = new Date(startTime.getTime() + (90 * 60 * 1000)); // 1.5 hours
          
          activities.push({
            title: sentence.trim(),
            description: sentence.trim(),
            startTime: startTime,
            endTime: endTime,
            day: 1
          });
        }
      });
    }
    
    console.log(`🎯 Fallback parsing found ${activities.length} activities`);
    return activities;
  }

  calculateActivityTime(dayNumber, activityIndex, timeString) {
    // Calculate start time for activity
    const baseDate = new Date();
    baseDate.setDate(baseDate.getDate() + (dayNumber - 1));
    
    if (timeString) {
      // Try to parse existing time
      const timeMatch = timeString.match(/(\d{1,2}):(\d{2})\s*(AM|PM)?/i);
      if (timeMatch) {
        let hours = parseInt(timeMatch[1]);
        const minutes = parseInt(timeMatch[2]);
        const ampm = timeMatch[3];
        
        if (ampm && ampm.toUpperCase() === 'PM' && hours !== 12) {
          hours += 12;
        } else if (ampm && ampm.toUpperCase() === 'AM' && hours === 12) {
          hours = 0;
        }
        
        baseDate.setHours(hours, minutes, 0, 0);
        return baseDate;
      }
    }
    
    // Default timing: start at 9 AM, space activities 2 hours apart
    const startHour = 9 + (activityIndex * 2);
    baseDate.setHours(Math.min(startHour, 18), 0, 0, 0); // Don't go past 6 PM
    
    return baseDate;
  }
}

export default new GoogleCalendarService();