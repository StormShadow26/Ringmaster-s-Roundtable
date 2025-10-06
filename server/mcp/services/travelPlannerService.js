// services/travelPlannerService.js
import { getAttractionsForCity } from './attractionsService.js';
import { getEventsForTrip } from './eventsService.js';

export async function planTripBasedOnWeather(city, weatherData) {
  try {
    console.log(`🗓️ Planning trip for ${city} based on weather conditions`);
    
    if (weatherData.error) {
      return { error: weatherData.error };
    }

    const { lat, lon } = weatherData.coordinates;
    const { startDate, endDate } = weatherData;

    // Get attractions for the city
    console.log(`🎯 Fetching attractions for ${city}...`);
    const attractions = await getAttractionsForCity(city, lat, lon);

    // Get events happening during the trip
    console.log(`🎭 Fetching events for ${city}...`);
    const events = await getEventsForTrip(city, lat, lon, startDate, endDate);

    // Analyze weather to recommend activities
    const weatherRecommendations = analyzeWeatherForActivities(weatherData.forecast);

    // Create day-by-day itinerary
    const dailyItinerary = createDailyItinerary(weatherData.forecast, attractions, events, startDate, endDate);

    // Calculate trip summary
    const tripSummary = generateTripSummary(weatherData, attractions, events);

    const travelPlan = {
      destination: {
        city: weatherData.city,
        coordinates: weatherData.coordinates
      },
      tripDuration: {
        startDate,
        endDate,
        totalDays: Math.ceil((new Date(endDate) - new Date(startDate)) / (1000 * 60 * 60 * 24)) + 1
      },
      weather: {
        forecast: weatherData.forecast,
        recommendations: weatherRecommendations
      },
      attractions: {
        total: attractions.length,
        categories: categorizeAttractions(attractions),
        featured: attractions.slice(0, 8) // Top 8 attractions
      },
      events: {
        total: events?.length || 0,
        upcoming: events || [],
        categories: categorizeEvents(events || [])
      },
      dailyItinerary,
      tripSummary,
      nearbyDestinations: weatherData.neighbors || []
    };

    console.log(`✅ Trip plan created for ${city} with ${attractions.length} attractions and ${events?.length || 0} events`);
    return travelPlan;
    
  } catch (err) {
    console.error("❌ Error creating travel plan:", err);
    return { error: "Failed to create travel plan." };
  }
}

function analyzeWeatherForActivities(forecast) {
  console.log(`🌤️ Analyzing weather for ${forecast.length} days:`, forecast.map(f => ({ 
    date: f.dateOnly || f.date.split(' ')[0], 
    condition: f.condition, 
    temp: f.temp || f.tempNumeric 
  })));
  
  const recommendations = {
    outdoor: [],
    indoor: [],
    general: []
  };

  if (!forecast || forecast.length === 0) {
    console.log('⚠️ No forecast data to analyze');
    recommendations.general.push('Weather data unavailable - check conditions locally');
    return recommendations;
  }

  forecast.forEach(day => {
    const dateStr = day.dateOnly || day.date.split(' ')[0];
    const condition = day.condition.toLowerCase();
    const temp = parseFloat(day.tempNumeric || day.temp);
    
    console.log(`📅 Analyzing ${dateStr}: ${condition}, ${temp}°C`);
    
    if (condition.includes('rain') || condition.includes('storm')) {
      const message = `${dateStr}: Perfect for museums and indoor attractions due to ${condition}`;
      recommendations.indoor.push(message);
      console.log(`🏢 Indoor day: ${message}`);
    } else if (condition.includes('sun') || condition.includes('clear')) {
      const message = `${dateStr}: Great weather for outdoor activities and sightseeing`;
      recommendations.outdoor.push(message);
      console.log(`☀️ Outdoor day: ${message}`);
    } else if (temp < 10) {
      const message = `${dateStr}: Cool weather - dress warmly for outdoor activities`;
      recommendations.general.push(message);
      console.log(`🧥 Cool day: ${message}`);
    } else if (temp > 30) {
      const message = `${dateStr}: Hot weather - stay hydrated and seek shade during midday`;
      recommendations.general.push(message);
      console.log(`🌡️ Hot day: ${message}`);
    } else {
      const message = `${dateStr}: Pleasant weather for any activities`;
      recommendations.general.push(message);
      console.log(`😊 Pleasant day: ${message}`);
    }
  });

  console.log(`🎯 Weather analysis complete:`, {
    outdoor: recommendations.outdoor.length,
    indoor: recommendations.indoor.length,
    general: recommendations.general.length
  });

  return recommendations;
}

function createDailyItinerary(forecast, attractions, events, startDate, endDate) {
  const start = new Date(startDate);
  const end = new Date(endDate);
  const itinerary = [];
  
  let currentDate = new Date(start);
  let dayIndex = 0;
  
  while (currentDate <= end) {
    const dateStr = currentDate.toISOString().split('T')[0];
    const dayForecast = forecast.find(f => f.date.includes(dateStr));
    
    // Get events for this day
    const dayEvents = events?.filter(event => event.date === dateStr) || [];
    
    // Recommend attractions based on weather
    const recommendedAttractions = getRecommendedAttractions(dayForecast, attractions, dayIndex);
    
    itinerary.push({
      date: dateStr,
      dayOfWeek: currentDate.toLocaleDateString('en-US', { weekday: 'long' }),
      weather: dayForecast || { temp: 'N/A', condition: 'No forecast available' },
      recommendedAttractions,
      events: dayEvents,
      activities: generateDayActivities(dayForecast, recommendedAttractions, dayEvents)
    });
    
    currentDate.setDate(currentDate.getDate() + 1);
    dayIndex++;
  }
  
  return itinerary;
}

function getRecommendedAttractions(dayForecast, attractions, dayIndex) {
  if (!dayForecast) return attractions.slice(dayIndex * 2, (dayIndex * 2) + 2);
  
  const condition = dayForecast.condition.toLowerCase();
  
  if (condition.includes('rain') || condition.includes('storm')) {
    // Prefer indoor attractions
    return attractions
      .filter(a => a.category === 'indoor' || a.category === 'cultural')
      .slice(0, 3);
  } else if (condition.includes('sun') || condition.includes('clear')) {
    // Prefer outdoor attractions
    return attractions
      .filter(a => a.category === 'outdoor' || a.category === 'adventure' || a.category === 'heritage')
      .slice(0, 3);
  }
  
  // Mixed recommendations for other weather
  return attractions.slice(dayIndex * 2, (dayIndex * 2) + 3);
}

function generateDayActivities(dayForecast, attractions, events) {
  const activities = [];
  
  // Morning activity
  if (attractions.length > 0) {
    activities.push({
      time: '09:00-12:00',
      type: 'sightseeing',
      activity: `Visit ${attractions[0]?.name || 'local attractions'}`,
      description: 'Start your day exploring the city'
    });
  }
  
  // Afternoon activity
  if (attractions.length > 1) {
    activities.push({
      time: '14:00-17:00',
      type: 'exploration',
      activity: `Explore ${attractions[1]?.name || 'city center'}`,
      description: 'Continue discovering the destination'
    });
  }
  
  // Evening activity
  if (events.length > 0) {
    activities.push({
      time: events[0]?.time || '19:00',
      type: 'event',
      activity: events[0]?.name || 'Local cultural experience',
      description: events[0]?.description || 'Enjoy local culture and entertainment'
    });
  } else {
    activities.push({
      time: '18:00-20:00',
      type: 'dining',
      activity: 'Local cuisine experience',
      description: 'Try local restaurants and food culture'
    });
  }
  
  return activities;
}

function categorizeAttractions(attractions) {
  const categories = {};
  attractions.forEach(attraction => {
    const category = attraction.category || 'general';
    if (!categories[category]) {
      categories[category] = 0;
    }
    categories[category]++;
  });
  return categories;
}

function categorizeEvents(events) {
  const categories = {};
  events.forEach(event => {
    const category = event.category || 'general';
    if (!categories[category]) {
      categories[category] = 0;
    }
    categories[category]++;
  });
  return categories;
}

function generateTripSummary(weatherData, attractions, events) {
  return {
    destination: weatherData.city,
    highlights: [
      `${attractions.length} attractions to explore`,
      `${events?.length || 0} events and activities`,
      `${weatherData.forecast.length} days of weather forecast`,
      'Personalized daily recommendations'
    ],
    topAttractions: attractions.slice(0, 3).map(a => a.name),
    upcomingEvents: events?.slice(0, 2).map(e => e.name) || [],
    weatherOverview: analyzeOverallWeather(weatherData.forecast),
    bestDays: getBestDaysForActivities(weatherData.forecast)
  };
}

function analyzeOverallWeather(forecast) {
  const conditions = forecast.map(f => f.condition.toLowerCase());
  const avgTemp = forecast.reduce((sum, f) => sum + parseFloat(f.temp), 0) / forecast.length;
  
  const rainDays = conditions.filter(c => c.includes('rain')).length;
  const sunnyDays = conditions.filter(c => c.includes('sun') || c.includes('clear')).length;
  
  return {
    averageTemperature: `${avgTemp.toFixed(1)} °C`,
    sunnyDays,
    rainyDays: rainDays,
    overall: sunnyDays > rainDays ? 'mostly pleasant' : 'mixed conditions'
  };
}

function getBestDaysForActivities(forecast) {
  return forecast
    .filter(f => {
      const condition = f.condition.toLowerCase();
      const temp = parseFloat(f.temp);
      return !condition.includes('rain') && temp > 15 && temp < 32;
    })
    .map(f => f.date.split(' ')[0])
    .slice(0, 3);
}