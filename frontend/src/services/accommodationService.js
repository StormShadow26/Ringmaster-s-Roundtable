// Accommodation Booking Service - Hotels, hostels, and accommodations
class AccommodationService {
  constructor() {
    this.booking = {
      apiKey: import.meta.env.VITE_BOOKING_API_KEY,
      baseURL: 'https://booking-com.p.rapidapi.com'
    };
    this.airbnb = {
      apiKey: import.meta.env.VITE_AIRBNB_API_KEY,
      baseURL: 'https://airbnb13.p.rapidapi.com'
    };
  }

  // Search all accommodation types
  async searchAccommodations(destination, checkIn, checkOut, guests = 2) {
    try {
      console.log('🏨 Searching accommodations for:', { destination, checkIn, checkOut, guests });

      const [hotels, hostels, apartments] = await Promise.allSettled([
        this.searchHotels(destination, checkIn, checkOut, guests),
        this.searchHostels(destination, checkIn, checkOut, guests),
        this.searchApartments(destination, checkIn, checkOut, guests)
      ]);

      const result = {
        hotels: hotels.status === 'fulfilled' ? hotels.value : [],
        hostels: hostels.status === 'fulfilled' ? hostels.value : [],
        apartments: apartments.status === 'fulfilled' ? apartments.value : [],
        searchParams: {
          destination,
          checkIn,
          checkOut,
          guests
        }
      };

      console.log('📊 Accommodation search results:', {
        hotelCount: result.hotels.length,
        hostelCount: result.hostels.length,
        apartmentCount: result.apartments.length
      });

      return result;
    } catch (error) {
      console.error('❌ Accommodation search failed:', error);
      throw error;
    }
  }

  // Search hotels via Booking.com API (mock for now)
  async searchHotels(destination, checkIn, checkOut, guests) {
    try {
      // In production, this would call the real Booking.com API
      // For now, return realistic mock data
      return this.getMockHotels(destination, checkIn, checkOut, guests);
    } catch (error) {
      console.error('Hotel search failed:', error);
      return this.getMockHotels(destination, checkIn, checkOut, guests);
    }
  }

  // Search hostels
  async searchHostels(destination, checkIn, checkOut, guests) {
    try {
      return this.getMockHostels(destination, checkIn, checkOut, guests);
    } catch (error) {
      console.error('Hostel search failed:', error);
      return [];
    }
  }

  // Search apartments/Airbnb
  async searchApartments(destination, checkIn, checkOut, guests) {
    try {
      return this.getMockApartments(destination, checkIn, checkOut, guests);
    } catch (error) {
      console.error('Apartment search failed:', error);
      return [];
    }
  }

  // Generate mock hotel data
  getMockHotels(destination, checkIn, checkOut, guests) {
    const hotelChains = [
      { name: 'Marriott International', brand: 'Marriott', stars: 4 },
      { name: 'Hilton Worldwide', brand: 'Hilton', stars: 4 },
      { name: 'InterContinental Hotels Group', brand: 'Holiday Inn', stars: 3 },
      { name: 'Hyatt Hotels Corporation', brand: 'Hyatt', stars: 4 },
      { name: 'Radisson Hotel Group', brand: 'Radisson', stars: 3 },
      { name: 'Accor', brand: 'Mercure', stars: 3 },
      { name: 'Wyndham Hotels', brand: 'Days Inn', stars: 2 },
      { name: 'Best Western', brand: 'Best Western', stars: 3 }
    ];

    const amenities = [
      'Free WiFi', 'Swimming Pool', 'Fitness Center', 'Restaurant', 'Bar/Lounge',
      'Room Service', 'Concierge', 'Business Center', 'Spa', 'Parking',
      'Pet Friendly', 'Airport Shuttle', 'Laundry Service', 'Meeting Rooms'
    ];

    const checkInDate = new Date(checkIn);
    const checkOutDate = new Date(checkOut);
    const nights = Math.ceil((checkOutDate - checkInDate) / (1000 * 60 * 60 * 24));
    
    const hotels = [];
    const basePrice = 80 + Math.random() * 200; // $80-280 per night

    for (let i = 0; i < 8; i++) {
      const hotel = hotelChains[Math.floor(Math.random() * hotelChains.length)];
      const rating = 3.5 + Math.random() * 1.5; // 3.5-5.0 rating
      const pricePerNight = basePrice + (Math.random() * 150) - 75;
      const totalPrice = pricePerNight * nights;
      const selectedAmenities = amenities
        .sort(() => 0.5 - Math.random())
        .slice(0, 5 + Math.floor(Math.random() * 4)); // 5-8 amenities

      hotels.push({
        id: `hotel-${destination.toLowerCase().replace(/\s+/g, '-')}-${i}`,
        name: `${hotel.brand} ${destination}`,
        brand: hotel.name,
        type: 'hotel',
        stars: hotel.stars,
        rating: Math.round(rating * 10) / 10,
        reviewCount: 150 + Math.floor(Math.random() * 2000),
        address: `${Math.floor(Math.random() * 999) + 1} ${['Main St', 'Broadway', 'Central Ave', 'Park Rd', 'City Center'][Math.floor(Math.random() * 5)]}, ${destination}`,
        price: {
          perNight: Math.round(pricePerNight),
          total: Math.round(totalPrice),
          currency: 'USD',
          nights: nights,
          taxes: Math.round(totalPrice * 0.15) // 15% taxes
        },
        amenities: selectedAmenities,
        images: [
          `https://images.unsplash.com/photo-1566073771259-6a8506099945?w=400&h=300&fit=crop`,
          `https://images.unsplash.com/photo-1564501049412-61c2a3083791?w=400&h=300&fit=crop`,
          `https://images.unsplash.com/photo-1582719508461-905c673771fd?w=400&h=300&fit=crop`
        ],
        checkIn: checkIn,
        checkOut: checkOut,
        guests: guests,
        cancellation: Math.random() > 0.3 ? 'Free cancellation until 24 hours before check-in' : 'Non-refundable',
        description: `Experience luxury and comfort at ${hotel.brand} ${destination}. Located in the heart of the city with easy access to major attractions.`
      });
    }

    return hotels.sort((a, b) => a.price.perNight - b.price.perNight);
  }

  // Generate mock hostel data
  getMockHostels(destination, checkIn, checkOut, guests) {
    const hostelNames = [
      'Backpackers Paradise', 'City Center Hostel', 'Traveler\'s Haven', 
      'Budget Stay', 'Urban Nomad Hostel', 'Explorer\'s Base'
    ];

    const checkInDate = new Date(checkIn);
    const checkOutDate = new Date(checkOut);
    const nights = Math.ceil((checkOutDate - checkInDate) / (1000 * 60 * 60 * 24));
    
    const hostels = [];
    const basePrice = 25 + Math.random() * 40; // $25-65 per night

    for (let i = 0; i < 4; i++) {
      const rating = 3.5 + Math.random() * 1.0; // 3.5-4.5 rating
      const pricePerNight = basePrice + (Math.random() * 30) - 15;
      const totalPrice = pricePerNight * nights;

      hostels.push({
        id: `hostel-${destination.toLowerCase().replace(/\s+/g, '-')}-${i}`,
        name: `${hostelNames[i]} ${destination}`,
        type: 'hostel',
        stars: 2,
        rating: Math.round(rating * 10) / 10,
        reviewCount: 50 + Math.floor(Math.random() * 500),
        address: `${Math.floor(Math.random() * 299) + 1} ${['Hostel St', 'Backpacker Ave', 'Budget Rd'][Math.floor(Math.random() * 3)]}, ${destination}`,
        price: {
          perNight: Math.round(pricePerNight),
          total: Math.round(totalPrice),
          currency: 'USD',
          nights: nights,
          taxes: Math.round(totalPrice * 0.10) // 10% taxes
        },
        amenities: ['Free WiFi', 'Shared Kitchen', 'Common Room', 'Lockers', '24/7 Reception'],
        images: [
          `https://images.unsplash.com/photo-1555854877-bab0e564b8d5?w=400&h=300&fit=crop`,
          `https://images.unsplash.com/photo-1571896349842-33c89424de2d?w=400&h=300&fit=crop`
        ],
        checkIn: checkIn,
        checkOut: checkOut,
        guests: guests,
        cancellation: 'Free cancellation until 48 hours before check-in',
        roomType: Math.random() > 0.5 ? 'Shared Dormitory' : 'Private Room',
        description: `Budget-friendly accommodation perfect for travelers looking to explore ${destination} without breaking the bank.`
      });
    }

    return hostels.sort((a, b) => a.price.perNight - b.price.perNight);
  }

  // Generate mock apartment/Airbnb data
  getMockApartments(destination, checkIn, checkOut, guests) {
    const apartmentTypes = [
      'Cozy Studio Apartment', 'Modern 1BR Loft', 'Spacious 2BR Apartment', 
      'Luxury Penthouse', 'Downtown Condo', 'Charming Local Home'
    ];

    const checkInDate = new Date(checkIn);
    const checkOutDate = new Date(checkOut);
    const nights = Math.ceil((checkOutDate - checkInDate) / (1000 * 60 * 60 * 24));
    
    const apartments = [];
    const basePrice = 60 + Math.random() * 120; // $60-180 per night

    for (let i = 0; i < 6; i++) {
      const rating = 4.0 + Math.random() * 1.0; // 4.0-5.0 rating
      const pricePerNight = basePrice + (Math.random() * 100) - 50;
      const totalPrice = pricePerNight * nights;

      apartments.push({
        id: `apartment-${destination.toLowerCase().replace(/\s+/g, '-')}-${i}`,
        name: `${apartmentTypes[i]} in ${destination}`,
        type: 'apartment',
        stars: null,
        rating: Math.round(rating * 10) / 10,
        reviewCount: 20 + Math.floor(Math.random() * 200),
        address: `${Math.floor(Math.random() * 199) + 1} ${['Apartment Blvd', 'Rental St', 'Home Ave'][Math.floor(Math.random() * 3)]}, ${destination}`,
        price: {
          perNight: Math.round(pricePerNight),
          total: Math.round(totalPrice),
          currency: 'USD',
          nights: nights,
          taxes: Math.round(totalPrice * 0.12) // 12% taxes
        },
        amenities: ['Full Kitchen', 'Free WiFi', 'Self Check-in', 'Washer/Dryer', 'Private Entrance'],
        images: [
          `https://images.unsplash.com/photo-1522708323590-d24dbb6b0267?w=400&h=300&fit=crop`,
          `https://images.unsplash.com/photo-1484154218962-a197022b5858?w=400&h=300&fit=crop`
        ],
        checkIn: checkIn,
        checkOut: checkOut,
        guests: guests,
        host: `Host${i + 1}`,
        cancellation: Math.random() > 0.4 ? 'Flexible cancellation policy' : 'Moderate cancellation policy',
        bedrooms: Math.floor(Math.random() * 3) + 1,
        bathrooms: Math.floor(Math.random() * 2) + 1,
        description: `Beautiful ${apartmentTypes[i].toLowerCase()} perfect for your stay in ${destination}. Enjoy the comfort of a home away from home.`
      });
    }

    return apartments.sort((a, b) => a.price.perNight - b.price.perNight);
  }
}

export default new AccommodationService();