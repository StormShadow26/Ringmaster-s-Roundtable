// data/curatedEvents.js

export const curatedEventsByCity = {
  // India - Enhanced coverage
  delhi: [
    { name: "Red Fort Light & Sound Show", category: "cultural", venue: "Red Fort", time: "19:00", priceRange: "₹80-150", description: "Historical light and sound show about Mughal history" },
    { name: "India Gate Evening Walk", category: "cultural", venue: "India Gate", time: "18:30", priceRange: "Free", description: "Popular evening gathering spot with street food and cultural activities" },
    { name: "Qutub Festival", category: "festivals", venue: "Qutub Minar", time: "18:00", priceRange: "Free", description: "Classical music and dance performances" },
    { name: "Delhi International Arts Festival", category: "cultural", venue: "Various venues", time: "19:30", priceRange: "₹500-2000", description: "Contemporary arts and performance festival" },
    { name: "Connaught Place Cultural Events", category: "community", venue: "Connaught Place", time: "19:00", priceRange: "Free-₹200", description: "Regular street performances and cultural shows" }
  ],
  dehradun: [
    { name: "Ganga Aarti at Har Ki Pauri (Haridwar)", category: "cultural", venue: "Har Ki Pauri, Haridwar", time: "18:00", priceRange: "Free", description: "Sacred evening prayer ceremony by the Ganges river" },
    { name: "Mindrolling Monastery Festival", category: "festivals", venue: "Mindrolling Monastery", time: "15:00", priceRange: "Free", description: "Tibetan Buddhist ceremonies and cultural performances" },
    { name: "Dehradun Literature Festival", category: "cultural", venue: "Various venues", time: "10:00", priceRange: "Free-₹300", description: "Local authors and literary discussions" },
    { name: "Forest Research Institute Heritage Walk", category: "cultural", venue: "FRI Campus", time: "16:00", priceRange: "₹50", description: "Guided tour of colonial architecture and forest museum" },
    { name: "Mussoorie Cultural Evening", category: "concerts", venue: "Mall Road, Mussoorie", time: "19:30", priceRange: "₹200-500", description: "Local folk music and dance performances in the hill station" }
  ],
  mumbai: [
    { name: "Prithvi Theatre Festival", category: "cultural", venue: "Prithvi Theatre", time: "20:00", priceRange: "₹300-800", description: "International theatre festival" },
    { name: "Kala Ghoda Arts Festival", category: "festivals", venue: "Kala Ghoda District", time: "All day", priceRange: "Free", description: "Street art, performances, and cultural events" },
    { name: "Bollywood Live Concert", category: "concerts", venue: "NSCI Dome", time: "19:00", priceRange: "₹1500-5000", description: "Live Bollywood music performances" },
    { name: "Gateway of India Cultural Shows", category: "cultural", venue: "Gateway of India", time: "18:00", priceRange: "Free", description: "Street artists and cultural performances by the iconic monument" }
  ],
  bangalore: [
    { name: "Bangalore Literature Festival", category: "cultural", venue: "Various venues", time: "10:00", priceRange: "Free-₹500", description: "Authors, poets, and literary discussions" },
    { name: "UB City Mall Events", category: "community", venue: "UB City", time: "18:00", priceRange: "Free", description: "Regular cultural performances and exhibitions" },
    { name: "Lalbagh Flower Show", category: "festivals", venue: "Lalbagh Gardens", time: "09:00", priceRange: "₹30", description: "Beautiful flower exhibitions and garden tours" },
    { name: "Brigade Road Cultural Walk", category: "community", venue: "Brigade Road", time: "19:00", priceRange: "Free", description: "Street music and local artist performances" }
  ],
  jaipur: [
    { name: "Amber Fort Light & Sound Show", category: "cultural", venue: "Amber Fort", time: "19:00", priceRange: "₹200-400", description: "Spectacular light show narrating Rajputana history" },
    { name: "City Palace Evening Tour", category: "cultural", venue: "City Palace", time: "17:00", priceRange: "₹500-1000", description: "Royal heritage walk with cultural performances" },
    { name: "Chokhi Dhani Cultural Village", category: "festivals", venue: "Chokhi Dhani", time: "19:00", priceRange: "₹800-1500", description: "Traditional Rajasthani folk performances and cuisine" }
  ],
  kolkata: [
    { name: "Howrah Bridge Evening Walk", category: "cultural", venue: "Howrah Bridge", time: "18:00", priceRange: "Free", description: "Iconic bridge walk with street performances and river views" },
    { name: "Victoria Memorial Cultural Shows", category: "cultural", venue: "Victoria Memorial", time: "19:00", priceRange: "₹150", description: "Historical exhibitions and cultural events" },
    { name: "Park Street Music Scene", category: "concerts", venue: "Park Street", time: "20:00", priceRange: "₹300-800", description: "Live music venues and cultural performances" }
  ],
  
  // International
  paris: [
    { name: "Seine River Evening Cruise", category: "cultural", venue: "Seine River", time: "20:30", priceRange: "€25-60", description: "Illuminated monuments cruise with dinner option" },
    { name: "Louvre Late Night Opening", category: "cultural", venue: "Louvre Museum", time: "18:00", priceRange: "€17", description: "Extended hours with special exhibitions" },
    { name: "Moulin Rouge Show", category: "concerts", venue: "Moulin Rouge", time: "21:00", priceRange: "€87-200", description: "Iconic cabaret performance" }
  ],
  london: [
    { name: "West End Theatre Shows", category: "cultural", venue: "Various theatres", time: "19:30", priceRange: "£25-150", description: "World-class musical and drama performances" },
    { name: "Thames River Jazz Cruise", category: "concerts", venue: "Thames River", time: "19:00", priceRange: "£35-55", description: "Live jazz music while cruising past landmarks" },
    { name: "Borough Market Food Tours", category: "community", venue: "Borough Market", time: "11:00", priceRange: "£45", description: "Guided food tasting and market exploration" }
  ],
  tokyo: [
    { name: "Robot Restaurant Show", category: "cultural", venue: "Shinjuku", time: "20:00", priceRange: "¥8000", description: "Unique robot and neon performance show" },
    { name: "Shibuya Sky Observatory", category: "cultural", venue: "Shibuya Sky", time: "18:00", priceRange: "¥1800", description: "360-degree city views and sunset experience" },
    { name: "Traditional Tea Ceremony", category: "cultural", venue: "Various temples", time: "14:00", priceRange: "¥3000", description: "Authentic Japanese tea ceremony experience" }
  ]
};

// Generate seasonal events based on month
export function getSeasonalEvents(city, month) {
  const seasonalEvents = [];
  
  // Winter events (Dec, Jan, Feb)
  if ([12, 1, 2].includes(month)) {
    seasonalEvents.push({
      name: `${city} Winter Festival`,
      category: "festivals",
      venue: "City Center",
      time: "17:00",
      priceRange: "Free",
      description: "Winter celebrations with lights and local culture"
    });
  }
  
  // Spring events (Mar, Apr, May)
  if ([3, 4, 5].includes(month)) {
    seasonalEvents.push({
      name: `${city} Spring Cultural Festival`,
      category: "festivals", 
      venue: "Public Gardens",
      time: "11:00",
      priceRange: "Free-$20",
      description: "Spring celebrations with outdoor performances"
    });
  }
  
  // Summer events (Jun, Jul, Aug)
  if ([6, 7, 8].includes(month)) {
    seasonalEvents.push({
      name: `${city} Summer Concert Series`,
      category: "concerts",
      venue: "Outdoor Amphitheater",
      time: "19:30",
      priceRange: "$25-75",
      description: "Outdoor summer concerts and music festivals"
    });
  }
  
  // Fall events (Sep, Oct, Nov) 
  if ([9, 10, 11].includes(month)) {
    seasonalEvents.push({
      name: `${city} Harvest Festival`,
      category: "festivals",
      venue: "Market Square", 
      time: "10:00",
      priceRange: "Free",
      description: "Autumn harvest celebrations and local food markets"
    });
  }
  
  return seasonalEvents;
}

// Generate generic events for any city
export function generateGenericCityEvents(city) {
  return [
    {
      name: `${city} Walking Tour`,
      category: "cultural",
      venue: "City Center",
      time: "10:00",
      priceRange: "$15-30",
      description: `Guided historical walking tour of ${city}'s main attractions`
    },
    {
      name: `${city} Food Market`,
      category: "community", 
      venue: "Local Market",
      time: "09:00",
      priceRange: "Free entry",
      description: `Local food market with regional specialties and crafts`
    },
    {
      name: `${city} Cultural Center Events`,
      category: "cultural",
      venue: "Cultural Center",
      time: "19:00", 
      priceRange: "$10-50",
      description: `Regular cultural performances and art exhibitions`
    }
  ];
}

// Emergency fallback events
export function generateFallbackEvents(city, startDate, endDate) {
  return [
    {
      name: `Explore ${city} Markets`,
      category: "community",
      date: startDate,
      time: "10:00", 
      venue: "Local Markets",
      description: `Visit local markets and experience ${city}'s culture`,
      priceRange: "Free",
      type: "suggested_activity"
    },
    {
      name: `${city} Evening Walk`,
      category: "cultural",
      date: startDate,
      time: "18:00",
      venue: "City Center", 
      description: `Evening stroll through ${city}'s historic areas`,
      priceRange: "Free",
      type: "suggested_activity"
    }
  ];
}