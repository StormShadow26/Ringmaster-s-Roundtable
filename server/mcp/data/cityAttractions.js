// data/cityAttractions.js

export const staticCityAttractions = {
  // India
  goa: {
    beaches: ["Baga Beach", "Calangute Beach", "Anjuna Beach", "Palolem Beach"],
    indoor: ["Basilica of Bom Jesus", "Se Cathedral", "Goa State Museum", "Reis Magos Fort"],
    adventure: ["Dudhsagar Falls", "Spice Plantations", "River Cruising", "Water Sports"],
    nightlife: ["Tito's Bar", "Club Cubana", "Shiva Valley", "Casino Royale"],
    heritage: ["Old Goa Churches", "Fontainhas Latin Quarter", "Chapora Fort", "Aguada Fort"]
  },
  mumbai: {
    beaches: ["Juhu Beach", "Marine Drive", "Versova Beach", "Aksa Beach"],
    indoor: ["Gateway of India", "Chhatrapati Shivaji Museum", "Siddhivinayak Temple", "Crawford Market"],
    adventure: ["Elephanta Caves", "Sanjay Gandhi National Park", "Kanheri Caves", "Film City Tours"],
    nightlife: ["Leopold Cafe", "Cafe Mondegar", "Trilogy", "Hard Rock Cafe"],
    heritage: ["Victoria Terminus", "Dhobi Ghat", "Mani Bhavan", "Haji Ali Dargah"]
  },
  delhi: {
    beaches: [],
    indoor: ["Red Fort", "India Gate", "Lotus Temple", "Akshardham Temple"],
    adventure: ["Chandni Chowk Tours", "Yamuna River Boating", "Adventure Island", "Kingdom of Dreams"],
    nightlife: ["Connaught Place", "Hauz Khas Village", "Cyber Hub", "Khan Market"],
    heritage: ["Qutub Minar", "Humayun's Tomb", "Jama Masjid", "Raj Ghat"]
  },
  bangalore: {
    beaches: [],
    indoor: ["Lalbagh Botanical Garden", "Bangalore Palace", "ISKCON Temple", "Vidhana Soudha"],
    adventure: ["Nandi Hills", "Bannerghatta National Park", "Ramanagara", "Savandurga"],
    nightlife: ["Brigade Road", "MG Road", "Indiranagar", "Koramangala"],
    heritage: ["Tipu Sultan's Summer Palace", "Bull Temple", "Cubbon Park", "Bangalore Fort"]
  },
  jaipur: {
    beaches: [],
    indoor: ["Amber Fort", "City Palace", "Hawa Mahal", "Jantar Mantar"],
    adventure: ["Hot Air Ballooning", "Camel Safari", "Elephant Ride", "Desert Camping"],
    nightlife: ["Chokhi Dhani", "Nahargarh Fort", "Bar Palladio", "Steam Lounge"],
    heritage: ["Nahargarh Fort", "Jaigarh Fort", "Albert Hall Museum", "Galtaji Temple"]
  },
  dehradun: {
    beaches: [],
    indoor: ["Forest Research Institute", "Mindrolling Monastery", "Tapkeshwar Temple", "Robber's Cave"],
    adventure: ["Mussoorie Hill Station", "Rajaji National Park", "River Rafting", "Trekking"],
    nightlife: ["Mall Road Mussoorie", "Paltan Bazaar", "Clock Tower", "Dehradun Club"],
    heritage: ["Sahastradhara", "Malsi Deer Park", "Tapovan Temple", "Guru Ram Rai Darbar"]
  },
  
  // International
  paris: {
    beaches: [],
    indoor: ["Louvre Museum", "Eiffel Tower", "Notre-Dame", "Arc de Triomphe"],
    adventure: ["Seine River Cruise", "Versailles Day Trip", "Montmartre Walking", "Bike Tours"],
    nightlife: ["Moulin Rouge", "Latin Quarter", "Marais District", "Champs-Élysées"],
    heritage: ["Sacré-Cœur", "Panthéon", "Sainte-Chapelle", "Les Invalides"]
  },
  london: {
    beaches: [],
    indoor: ["British Museum", "Tower of London", "Westminster Abbey", "Tate Modern"],
    adventure: ["Thames River Cruise", "London Eye", "Camden Market", "Borough Market"],
    nightlife: ["Covent Garden", "Soho", "Shoreditch", "Westminster Bridge"],
    heritage: ["Buckingham Palace", "Big Ben", "St. Paul's Cathedral", "Tower Bridge"]
  },
  tokyo: {
    beaches: [],
    indoor: ["Senso-ji Temple", "Meiji Shrine", "Tokyo National Museum", "Imperial Palace"],
    adventure: ["Mount Fuji Day Trip", "Tokyo Skytree", "Robot Restaurant", "Tsukiji Market"],
    nightlife: ["Shibuya Crossing", "Harajuku", "Ginza", "Roppongi"],
    heritage: ["Asakusa District", "Ueno Park", "Tokyo Station", "Yasukuni Shrine"]
  },
  newyork: {
    beaches: ["Coney Island", "Brighton Beach", "Rockaway Beach"],
    indoor: ["Statue of Liberty", "Empire State Building", "9/11 Memorial", "Metropolitan Museum"],
    adventure: ["Central Park", "Brooklyn Bridge", "High Line", "Staten Island Ferry"],
    nightlife: ["Times Square", "Broadway Shows", "Village", "Brooklyn"],
    heritage: ["Ellis Island", "Wall Street", "Chinatown", "Little Italy"]
  }
};

// Generate base attractions for any city
export function generateBaseAttractions(city) {
  return {
    outdoor: [
      `${city} City Center`,
      `${city} Walking Tours`,
      `${city} Parks and Gardens`,
      `${city} Viewpoints`
    ],
    indoor: [
      `${city} Museums`,
      `${city} Art Galleries`, 
      `${city} Shopping Centers`,
      `${city} Cultural Centers`
    ],
    heritage: [
      `${city} Historic Sites`,
      `${city} Religious Places`,
      `${city} Architecture Tours`,
      `${city} Local Markets`
    ],
    adventure: [
      `${city} Adventure Activities`,
      `${city} Sports Centers`,
      `${city} Nature Trails`,
      `${city} Local Experiences`
    ],
    nightlife: [
      `${city} Restaurants`,
      `${city} Cafes and Bars`,
      `${city} Entertainment District`,
      `${city} Local Cuisine Tours`
    ],
    beaches: []
  };
}