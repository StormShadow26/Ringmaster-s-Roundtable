import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import {
  ArrowLeft,
  GitCompare,
  MapPin,
  Calendar,
  DollarSign,
  Clock,
  Users,
  Plus,
  X,
  Loader2,
  Star,
  Plane,
  Hotel,
  Camera,
  Coffee,
  Mountain,
  Building,
} from "lucide-react";
import axios from "axios";

const Compare = () => {
  const navigate = useNavigate();
  const [comparisons, setComparisons] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [newComparison, setNewComparison] = useState({
    city1: "",
    city2: "",
    startDate: "",
    endDate: "",
    travelers: 2,
    budget: "medium",
  });

  // Get tomorrow's date as minimum date
  const tomorrow = new Date();
  tomorrow.setDate(tomorrow.getDate() + 1);
  const minDate = tomorrow.toISOString().split("T")[0];

  const handleInputChange = (field, value) => {
    setNewComparison((prev) => ({
      ...prev,
      [field]: value,
    }));
  };

  const validateForm = () => {
    const { city1, city2, startDate, endDate } = newComparison;

    if (!city1.trim() || !city2.trim()) {
      alert("Please enter both cities to compare");
      return false;
    }

    if (city1.toLowerCase().trim() === city2.toLowerCase().trim()) {
      alert("Please select two different cities to compare");
      return false;
    }

    if (!startDate || !endDate) {
      alert("Please select both start and end dates");
      return false;
    }

    if (new Date(startDate) >= new Date(endDate)) {
      alert("End date must be after start date");
      return false;
    }

    return true;
  };

  // New function to make MCP API calls
  const fetchItineraryFromMCP = async (
    city,
    startDate,
    endDate,
    travelers,
    budget
  ) => {
    try {
      const start = new Date(startDate);
      const end = new Date(endDate);
      
      const message = `Plan trip to ${city} from ${start.toLocaleDateString()} to ${end.toLocaleDateString()}.`;

      console.log(`🔍 Requesting itinerary for ${city}:`, {
        message,
        city,
        startDate,
        endDate,
        travelers,
        budget
      });

      const response = await axios.post(
        "http://localhost:5000/api/v1/mcp/chat",
        {
          message: message,
          chatId: 1234,
        }
      );

      console.log(`✅ RAW MCP Response for ${city}:`, {
        city,
        status: response.status,
        statusText: response.statusText,
        headers: response.headers,
        fullResponse: response.data,
        responseType: typeof response.data,
        hasResponse: !!response.data.response,
        hasTravelData: !!response.data.travelData,
        responseLength: response.data.response?.length || 0
      });

      // Log the structured travelData if it exists
      if (response.data.travelData) {
        console.log(`📊 Travel Data Structure for ${city}:`, {
          city,
          travelData: response.data.travelData,
          hasAttractions: !!response.data.travelData.attractions,
          hasFeatured: !!response.data.travelData.attractions?.featured,
          featuredCount: response.data.travelData.attractions?.featured?.length || 0,
          categories: response.data.travelData.attractions?.categories || {}
        });
      }

      // Log the text response preview
      if (response.data.response) {
        console.log(`📝 Response Text Preview for ${city}:`, {
          city,
          preview: response.data.response.substring(0, 200) + "...",
          fullLength: response.data.response.length,
          containsCost: /\$\d+/.test(response.data.response),
          containsAttraction: /attraction|museum|temple|palace/i.test(response.data.response)
        });
      }
      
      return response.data;
    } catch (error) {
      console.error(`❌ Error fetching itinerary for ${city}:`, {
        city,
        error: error.message,
        status: error.response?.status,
        statusText: error.response?.statusText,
        responseData: error.response?.data,
        stack: error.stack
      });
      throw error;
    }
  };

  // City-based cost estimation using cost of living data
  const getCityBasedCostEstimate = async (cityName, days, travelers, budget) => {
    try {
      console.log(`💰 Calculating cost estimate for ${cityName}`);
      
      // Get cost of living data
      let costOfLivingIndex = await getCostOfLivingIndex(cityName);
      
      if (!costOfLivingIndex) {
        // Fallback to our predefined data
        costOfLivingIndex = getPredefinedCostIndex(cityName);
      }
      
      console.log(`📊 Cost of living index for ${cityName}: ${costOfLivingIndex}`);
      
      // Calculate base costs per day per person based on cost of living index
      const baseCosts = {
        budget: Math.floor(costOfLivingIndex * 0.8),    // 80% of cost index
        medium: Math.floor(costOfLivingIndex * 1.2),    // 120% of cost index  
        luxury: Math.floor(costOfLivingIndex * 2.0)      // 200% of cost index
      };
      
      const dailyCostPerPerson = baseCosts[budget] || baseCosts.medium;
      const totalCost = dailyCostPerPerson * travelers * days;
      
      console.log(`💵 Calculated cost for ${cityName}: $${totalCost} (${days} days, ${travelers} travelers, ${budget} budget)`);
      
      return totalCost;
      
    } catch (error) {
      console.error(`❌ Error calculating cost for ${cityName}:`, error);
      // Fallback to predefined costs if API fails
      return getPredefinedCostIndex(cityName) * travelers * days;
    }
  };

  // Function to get cost of living index from comprehensive city database
  const getCostOfLivingIndex = async (cityName) => {
    try {
      // Comprehensive city daily cost database (based on real cost of living data)
      const cityDailyCosts = {
        // Europe - High Cost
        'zurich': 180,
        'geneva': 170,
        'paris': 120,
        'london': 140,
        'amsterdam': 130,
        'stockholm': 150,
        'copenhagen': 160,
        'oslo': 165,
        'dublin': 125,
        'rome': 100,
        'barcelona': 90,
        'madrid': 85,
        'berlin': 85,
        'vienna': 95,
        'prague': 70,
        'budapest': 65,
        'warsaw': 60,
        
        // North America
        'new york': 160,
        'san francisco': 180,
        'los angeles': 150,
        'chicago': 130,
        'boston': 145,
        'washington': 135,
        'seattle': 140,
        'toronto': 120,
        'vancouver': 130,
        'montreal': 100,
        
        // Asia - Developed
        'tokyo': 110,
        'singapore': 100,
        'hong kong': 120,
        'seoul': 80,
        'taipei': 70,
        'osaka': 100,
        'sydney': 140,
        'melbourne': 130,
        'auckland': 120,
        
        // Asia - Developing  
        'bangkok': 45,
        'mumbai': 35,
        'delhi': 30,
        'bangalore': 40,
        'kolkata': 28,
        'chennai': 35,
        'goa': 50,
        'kerala': 40,
        'jaipur': 32,
        'agra': 30,
        'varanasi': 25,
        'rishikesh': 28,
        'manali': 35,
        'shimla': 40,
        'dubai': 130,
        'abu dhabi': 120,
        'doha': 115,
        'riyadh': 100,
        'kuwait city': 105,
        'beijing': 65,
        'shanghai': 75,
        'guangzhou': 60,
        'shenzhen': 70,
        'chengdu': 45,
        'xi\'an': 40,
        'kuala lumpur': 50,
        'penang': 40,
        'jakarta': 35,
        'bali': 45,
        'ho chi minh city': 35,
        'hanoi': 30,
        'phnom penh': 30,
        'vientiane': 25,
        'yangon': 25,
        'manila': 40,
        'cebu': 35,
        
        // Middle East & Africa
        'tel aviv': 130,
        'jerusalem': 110,
        'cairo': 40,
        'alexandria': 35,
        'casablanca': 50,
        'marrakech': 45,
        'tunis': 40,
        'cape town': 65,
        'johannesburg': 60,
        'lagos': 45,
        'nairobi': 50,
        'addis ababa': 35,
        
        // South America
        'buenos aires': 60,
        'rio de janeiro': 70,
        'sao paulo': 75,
        'santiago': 80,
        'lima': 50,
        'bogota': 45,
        'quito': 40,
        'montevideo': 65,
        'caracas': 35,
        
        // Oceania
        'fiji': 80,
        'wellington': 115,
        'christchurch': 100,
        
        // Central America & Caribbean
        'mexico city': 55,
        'cancun': 70,
        'guatemala city': 40,
        'san jose': 60,
        'panama city': 65,
        'havana': 50,
        'kingston': 60,
        'port of spain': 70
      };
      
      const normalizedCityName = cityName.toLowerCase().trim();
      const dailyCost = cityDailyCosts[normalizedCityName];
      
      if (dailyCost) {
        console.log(`✅ Found cost data for ${cityName}: $${dailyCost}/day`);
        return dailyCost;
      }
      
      // If city not found, try to estimate based on country
      const countryEstimates = {
        'france': 110,
        'united kingdom': 130, 
        'uk': 130,
        'japan': 100,
        'united states': 140,
        'usa': 140,
        'uae': 120,
        'singapore': 100,
        'italy': 95,
        'spain': 85,
        'netherlands': 120,
        'thailand': 45,
        'australia': 130,
        'india': 35,
        'germany': 85,
        'switzerland': 170,
        'canada': 115,
        'south korea': 75,
        'china': 60,
        'vietnam': 32,
        'indonesia': 40,
        'malaysia': 45,
        'philippines': 38,
        'egypt': 38,
        'morocco': 47,
        'south africa': 62,
        'brazil': 70,
        'argentina': 60,
        'chile': 80,
        'peru': 50,
        'mexico': 60,
        'israel': 120,
        'turkey': 55,
        'russia': 65,
        'poland': 60,
        'czech republic': 70,
        'hungary': 65,
        'greece': 75,
        'portugal': 70,
        'croatia': 65,
        'romania': 50,
        'bulgaria': 45,
        'serbia': 40,
        'ukraine': 35,
        'belarus': 35,
        'lithuania': 55,
        'latvia': 55,
        'estonia': 60,
        'finland': 130,
        'sweden': 140,
        'norway': 160,
        'denmark': 155,
        'iceland': 145,
        'ireland': 120,
        'belgium': 110,
        'austria': 100,
        'slovenia': 70,
        'slovakia': 60,
        'bosnia and herzegovina': 45,
        'montenegro': 50,
        'albania': 40,
        'north macedonia': 40,
        'moldova': 30,
        'georgia': 35,
        'armenia': 35,
        'azerbaijan': 40
      };
      
      const country = getCountryForCity(cityName).toLowerCase();
      const countryEstimate = countryEstimates[country];
      
      if (countryEstimate) {
        console.log(`✅ Found country-based estimate for ${cityName}: $${countryEstimate}/day`);
        return countryEstimate;
      }
      
      console.log(`⚠️ No cost data found for ${cityName}, using global average`);
      return 80; // Global average fallback
      
    } catch (error) {
      console.error('❌ Error fetching cost of living data:', error);
      return null;
    }
  };

  // Fallback function with predefined cost indices
  const getPredefinedCostIndex = (cityName) => {
    const costIndices = {
      // High cost cities (150+ per day)
      'zurich': 180,
      'geneva': 170,
      'new york': 160,
      'san francisco': 180,
      'london': 140,
      'paris': 120,
      'sydney': 140,
      'tokyo': 110,
      
      // Medium cost cities (80-149 per day)
      'amsterdam': 130,
      'dubai': 130,
      'singapore': 100,
      'rome': 100,
      'barcelona': 90,
      'berlin': 85,
      'toronto': 120,
      'melbourne': 130,
      
      // Budget-friendly cities (30-79 per day)
      'bangkok': 45,
      'mumbai': 35,
      'delhi': 30,
      'bangalore': 40,
      'goa': 50,
      'cairo': 40,
      'buenos aires': 60,
      'prague': 70,
      'budapest': 65,
      'cape town': 65
    };
    
    const normalizedCity = cityName.toLowerCase().trim();
    return costIndices[normalizedCity] || 80; // Default to $80/day if city not found
  };

  // Updated function to extract cost estimate using real cost data
  const extractCostEstimate = async (mcpResponse, cityName, days, travelers, budget) => {
    try {
      console.log(`💰 Starting cost estimation for ${cityName}:`, {
        cityName,
        days,
        travelers,
        budget,
        mcpResponseType: typeof mcpResponse,
        hasResponse: !!mcpResponse.response,
        hasTravelData: !!mcpResponse.travelData,
        hasCostInTravelData: !!mcpResponse.travelData?.cost
      });

      // First try to extract from MCP response if it has cost data
      if (mcpResponse && mcpResponse.travelData && mcpResponse.travelData.cost) {
        const cost = parseInt(mcpResponse.travelData.cost);
        console.log(`✅ Found cost in MCP travelData for ${cityName}:`, {
          cityName,
          rawCost: mcpResponse.travelData.cost,
          parsedCost: cost,
          source: "MCP_TRAVEL_DATA"
        });
        return cost;
      }

      // Try to extract from response text
      let textToAnalyze = "";
      if (typeof mcpResponse === "string") {
        textToAnalyze = mcpResponse;
      } else if (mcpResponse && mcpResponse.response) {
        textToAnalyze = mcpResponse.response;
      }

      console.log(`🔍 Analyzing text for cost extraction:`, {
        cityName,
        textLength: textToAnalyze.length,
        textPreview: textToAnalyze.substring(0, 200) + "...",
        hasDollarSigns: (textToAnalyze.match(/\$/g) || []).length,
        hasNumbers: (textToAnalyze.match(/\d+/g) || []).length
      });

      // Look for cost mentions in text
      if (textToAnalyze) {
        const costRegex = /\$(\d{1,4}(?:,\d{3})*(?:\.\d{2})?)/g;
        const matches = [...textToAnalyze.matchAll(costRegex)];
        
        console.log(`💸 Cost regex matches found:`, {
          cityName,
          matchCount: matches.length,
          matches: matches.map(match => ({ full: match[0], amount: match[1] }))
        });
        
        if (matches.length > 0) {
          const costs = matches.map(match => parseInt(match[1].replace(/,/g, '')));
          const validCosts = costs.filter(cost => cost > 50 && cost < 10000);
          
          console.log(`💵 Cost processing results:`, {
            cityName,
            allCosts: costs,
            validCosts,
            filteredCount: validCosts.length
          });
          
          if (validCosts.length > 0) {
            const avgCost = validCosts.reduce((sum, cost) => sum + cost, 0) / validCosts.length;
            const finalCost = Math.floor(avgCost);
            
            console.log(`✅ Extracted cost from MCP text for ${cityName}:`, {
              cityName,
              validCosts,
              averageCost: avgCost,
              finalCost,
              source: "MCP_TEXT_EXTRACTION"
            });
            
            return finalCost;
          }
        }
      }

      // Use cost of living data as primary method
      console.log(`🏙️ Using cost of living estimation for ${cityName}...`);
      const estimatedCost = await getCityBasedCostEstimate(cityName, days, travelers, budget);
      
      console.log(`✅ Final cost estimation for ${cityName}:`, {
        cityName,
        estimatedCost,
        days,
        travelers,
        budget,
        source: "COST_OF_LIVING_DATABASE",
        costPerDay: Math.round(estimatedCost / (days * travelers)),
        costPerPerson: Math.round(estimatedCost / travelers)
      });
      
      return estimatedCost;

    } catch (error) {
      console.error(`❌ Error in cost estimation for ${cityName}:`, {
        cityName,
        error: error.message,
        stack: error.stack
      });
      
      // Final fallback
      const fallbackCost = getPredefinedCostIndex(cityName) * travelers * days;
      console.log(`🔄 Using fallback cost for ${cityName}:`, {
        cityName,
        fallbackCost,
        source: "PREDEFINED_FALLBACK"
      });
      
      return fallbackCost;
    }
  };

// Extract comprehensive MCP data for analysis display
const extractMCPData = (mcpResponse, cityName) => {
  try {
    console.log(`🔍 EXTRACTING MCP DATA for ${cityName}:`, {
      cityName,
      responseType: typeof mcpResponse,
      hasData: !!mcpResponse,
      timestamp: new Date().toISOString()
    });

    // Initialize comprehensive data structure
    const extractedData = {
      attractions: [],
      accommodations: [],
      transportation: [],
      restaurants: [],
      activities: [],
      budget: null,
      overview: '',
      cityName: cityName,
      rawData: mcpResponse
    };

    // Check if response has travelData structure
    if (mcpResponse && mcpResponse.travelData) {
      const { travelData } = mcpResponse;

      // Extract attractions
      if (travelData.attractions && Array.isArray(travelData.attractions.featured)) {
        extractedData.attractions = travelData.attractions.featured
          .filter(item => item && item.name)
          .slice(0, 10)
          .map(item => ({
            name: item.name,
            category: item.category || 'attraction',
            description: item.description || '',
            rating: item.rating || null
          }));
      }

      // Extract accommodations
      if (travelData.accommodations && Array.isArray(travelData.accommodations)) {
        extractedData.accommodations = travelData.accommodations
          .filter(item => item && item.name)
          .slice(0, 8)
          .map(item => ({
            name: item.name,
            type: item.type || 'hotel',
            priceRange: item.priceRange || '',
            rating: item.rating || null
          }));
      }

      // Extract transportation
      if (travelData.transportation) {
        extractedData.transportation = Object.values(travelData.transportation)
          .filter(item => item && typeof item === 'object')
          .slice(0, 6);
      }

      // Extract restaurants if available
      if (travelData.restaurants && Array.isArray(travelData.restaurants)) {
        extractedData.restaurants = travelData.restaurants
          .filter(item => item && item.name)
          .slice(0, 8)
          .map(item => ({
            name: item.name,
            cuisine: item.cuisine || '',
            priceRange: item.priceRange || ''
          }));
      }

      // Extract budget information
      if (travelData.budget) {
        extractedData.budget = travelData.budget;
      }
    }

    console.log(`✅ EXTRACTED MCP DATA for ${cityName}:`, {
      cityName,
      attractionsCount: extractedData.attractions.length,
      accommodationsCount: extractedData.accommodations.length,
      transportationCount: extractedData.transportation.length,
      restaurantsCount: extractedData.restaurants.length,
      hasBudget: !!extractedData.budget,
      extractedData: extractedData
    });

    return extractedData;

  } catch (error) {
    console.error(`❌ ERROR EXTRACTING MCP DATA for ${cityName}:`, {
      cityName,
      error: error.message,
      stack: error.stack
    });

    return {
      attractions: ['Data extraction error'],
      accommodations: [],
      transportation: [],
      restaurants: [],
      activities: [],
      budget: null,
      overview: `Unable to extract data for ${cityName}`,
      cityName: cityName,
      rawData: null
    };
  }
};

// Legacy function for backward compatibility 
const extractActivities = (mcpResponse, maxActivities = 5) => {
  const mcpData = extractMCPData(mcpResponse, 'Unknown City');
  return mcpData.attractions.map(attr => attr.name).slice(0, maxActivities);
};

  // Helper function to extract activities from text
  const extractActivitiesFromText = (text, maxActivities) => {
    if (!text || typeof text !== "string") {
      return ["No activities available"];
    }

    console.log(
      "📝 Extracting activities from text:",
      text.substring(0, 100) + "..."
    );

    const activities = [];

    // Look for patterns like "Day X:" or bullet points
    const dayPatterns = [
      /Day\s*\d+[:\-]([^]*?)(?=Day\s*\d+[:\-]|$)/gi,
      /Day\s*\d+([^]*?)(?=Day\s*\d+|$)/gi,
      /\*\*Day\s*\d+\*\*([^]*?)(?=\*\*Day|$)/gi,
    ];

    let foundActivitiesInDays = false;
    for (const dayPattern of dayPatterns) {
      const dayMatches = [...text.matchAll(dayPattern)];
      if (dayMatches.length > 0) {
        foundActivitiesInDays = true;
        console.log(
          `✅ Found ${dayMatches.length} days using pattern:`,
          dayPattern
        );

        // Process each day's content
        for (const match of dayMatches.slice(0, maxActivities)) {
          const dayContent = match[1];

          // Try to extract bullet points or numbered items from the day's content
          const activityPatterns = [
            /[-•*]\s*([^\n]+)/g, // Bullet points
            /\d+\.\s*([^\n]+)/g, // Numbered items
            /\n+([^:\n]+:[^\n]+)/g, // Lines with colons (like "Morning: Visit...")
            /\n+([A-Z][^.!?\n]+[.!?])/g, // Sentences starting with capital letter
          ];

          let foundActivity = false;
          for (const pattern of activityPatterns) {
            const activityMatches = [...dayContent.matchAll(pattern)];
            if (activityMatches.length > 0) {
              // Get the first activity from this day
              const activity = activityMatches[0][1].trim();
              if (activity.length > 10) {
                activities.push(activity);
                foundActivity = true;
                break;
              }
            }
          }

          // If no structured activity found, just get the first sentence
          if (!foundActivity) {
            const sentences = dayContent
              .split(/[.!?]+/)
              .filter((s) => s.trim().length > 15);
            if (sentences.length > 0) {
              activities.push(sentences[0].trim());
            }
          }

          if (activities.length >= maxActivities) break;
        }

        break; // Stop after finding the first matching day pattern
      }
    }

    // If no day structure found, look for any activities
    if (!foundActivitiesInDays) {
      console.log("⚠️ No day structure found, looking for any activities...");

      // Try to find markdown lists, bullet points, or numbered items directly
      const directActivityPatterns = [
        /[-•*]\s*([^\n]+)/g, // Bullet points
        /\d+\.\s*([^\n]+)/g, // Numbered items
        /\b(visit|explore|see|discover|experience|tour|enjoy)\b[^.!?]*[.!?]/gi, // Sentences with action verbs
      ];

      for (const pattern of directActivityPatterns) {
        const matches = [...text.matchAll(pattern)];
        if (matches.length > 0) {
          console.log(
            `✅ Found ${matches.length} direct activities using pattern`
          );

          for (const match of matches) {
            const activity = match[1] || match[0];
            const cleanActivity = activity.trim();

            // Only add if it's a substantial activity description
            if (cleanActivity.length > 10) {
              activities.push(cleanActivity);
              if (activities.length >= maxActivities) break;
            }
          }
        }

        if (activities.length >= maxActivities) break;
      }
    }

    // If still empty, extract key sentences with locations or attractions
    if (activities.length < maxActivities) {
      console.log("⚠️ Few activities found, looking for key sentences...");

      // Look for sentences that contain likely points of interest
      const poiIndicators = [
        "museum",
        "park",
        "garden",
        "palace",
        "castle",
        "cathedral",
        "temple",
        "market",
        "square",
        "tower",
        "bridge",
        "gallery",
        "theater",
        "monument",
        "statue",
        "landmark",
        "attraction",
        "restaurant",
        "café",
        "beach",
        "mountain",
        "building",
      ];

      const sentences = text
        .split(/[.!?]+/)
        .filter((s) => s.trim().length > 15);

      for (const sentence of sentences) {
        for (const phrase of poiIndicators) {
          if (sentence.toLowerCase().includes(phrase)) {
            activities.push(sentence.trim());
            if (activities.length >= maxActivities) break;
          }
        }
        if (activities.length >= maxActivities) break;
      }
    }

    console.log(
      `📊 Final activities extracted from text: ${activities.length}`
    );
    return activities.slice(0, maxActivities);
  };

  // Function to extract highlights from MCP response
  const extractHighlights = (mcpResponse, maxHighlights = 4) => {
    // Check if we have structured categories in travelData
    if (
      mcpResponse &&
      mcpResponse.travelData &&
      mcpResponse.travelData.categories
    ) {
      const categories = mcpResponse.travelData.categories;
      const highlights = [];

      // Convert categories to highlights
      for (const [category, count] of Object.entries(categories)) {
        if (count && count > 0) {
          // Format the category name nicely
          const formattedCategory =
            category.charAt(0).toUpperCase() +
            category.slice(1) +
            " Attractions";
          highlights.push(formattedCategory);

          if (highlights.length >= maxHighlights) break;
        }
      }

      // If we got highlights from categories, return them
      if (highlights.length > 0) {
        return highlights;
      }
    }

    // If no structured data, fall back to text extraction
    let textToAnalyze = "";
    if (typeof mcpResponse === "string") {
      textToAnalyze = mcpResponse;
    } else if (mcpResponse && mcpResponse.response) {
      textToAnalyze = mcpResponse.response;
    } else {
      textToAnalyze = JSON.stringify(mcpResponse);
    }

    const highlights = [];
    const highlightPatterns = [
      /highlights?[:\-]\s*([^]*?)(?=\n\n|\n#)/i,
      /key attractions[:\-]\s*([^]*?)(?=\n\n|\n#)/i,
      /must-see[:\-]\s*([^]*?)(?=\n\n|\n#)/i,
    ];

    // Try to find a highlights section
    for (const pattern of highlightPatterns) {
      const match = textToAnalyze.match(pattern);
      if (match) {
        const bulletPattern = /[-•*]\s*([^\n]+)/g;
        const bulletMatches = [...match[1].matchAll(bulletPattern)];

        if (bulletMatches.length > 0) {
          for (const bullet of bulletMatches.slice(0, maxHighlights)) {
            highlights.push(bullet[1]);
          }
          break;
        }
      }
    }

    // If no structured highlights found, extract key phrases
    if (highlights.length === 0) {
      const phrases = [
        "famous for",
        "known for",
        "popular",
        "renowned",
        "iconic",
        "celebrated",
        "best known",
      ];

      const sentences = textToAnalyze.split(/[.!?]+/);
      for (const sentence of sentences) {
        for (const phrase of phrases) {
          if (sentence.toLowerCase().includes(phrase)) {
            // Extract what comes after the phrase
            const match = sentence.match(new RegExp(`${phrase}\\s+(.+)`, "i"));
            if (match && match[1]) {
              highlights.push(match[1].trim());
              break;
            }
          }
        }
        if (highlights.length >= maxHighlights) break;
      }
    }

    // If still not enough, use predefined categories
    const defaultHighlights = [
      "Historic Architecture",
      "Cultural Museums",
      "Local Cuisine",
      "Shopping Districts",
      "Scenic Views",
      "Art Galleries",
      "Parks & Gardens",
      "Nightlife",
      "Local Markets",
      "Religious Sites",
    ];

    while (highlights.length < maxHighlights) {
      const randomHighlight =
        defaultHighlights[Math.floor(Math.random() * defaultHighlights.length)];
      if (!highlights.includes(randomHighlight)) {
        highlights.push(randomHighlight);
      }
    }

    return highlights.slice(0, maxHighlights);
  };

  // Function to extract accommodation info
  const extractAccommodationPrices = (mcpResponse) => {
    // Try to find accommodation prices using regex
    let textToAnalyze = "";
    if (typeof mcpResponse === "string") {
      textToAnalyze = mcpResponse;
    } else if (mcpResponse && mcpResponse.response) {
      textToAnalyze = mcpResponse.response;
    } else {
      textToAnalyze = JSON.stringify(mcpResponse);
    }

    const priceRegex = /(?:budget|hostel|affordable).*?\$(\d+)/i;
    const midRegex = /(?:mid[-\s]range|standard|average).*?\$(\d+)/i;
    const luxuryRegex = /(?:luxury|high[-\s]end|premium).*?\$(\d+)/i;

    const budgetMatch = textToAnalyze.match(priceRegex);
    const midMatch = textToAnalyze.match(midRegex);
    const luxuryMatch = textToAnalyze.match(luxuryRegex);

    return {
      budget: budgetMatch
        ? parseInt(budgetMatch[1])
        : Math.floor(Math.random() * 50) + 30,
      midRange: midMatch
        ? parseInt(midMatch[1])
        : Math.floor(Math.random() * 100) + 80,
      luxury: luxuryMatch
        ? parseInt(luxuryMatch[1])
        : Math.floor(Math.random() * 200) + 200,
    };
  };

  // Function to extract transportation info
  const extractTransportationPrices = (mcpResponse) => {
    // Try to find transportation prices using regex
    let textToAnalyze = "";
    if (typeof mcpResponse === "string") {
      textToAnalyze = mcpResponse;
    } else if (mcpResponse && mcpResponse.response) {
      textToAnalyze = mcpResponse.response;
    } else {
      textToAnalyze = JSON.stringify(mcpResponse);
    }

    const publicRegex = /(?:public|transport|bus|metro|subway).*?\$(\d+)/i;
    const taxiRegex = /(?:taxi|cab|uber).*?\$(\d+)/i;
    const rentalRegex = /(?:rent|rental|car).*?\$(\d+)/i;

    const publicMatch = textToAnalyze.match(publicRegex);
    const taxiMatch = textToAnalyze.match(taxiRegex);
    const rentalMatch = textToAnalyze.match(rentalRegex);

    return {
      public: publicMatch
        ? parseInt(publicMatch[1])
        : Math.floor(Math.random() * 50) + 30,
      taxi: taxiMatch
        ? parseInt(taxiMatch[1])
        : Math.floor(Math.random() * 100) + 50,
      rental: rentalMatch
        ? parseInt(rentalMatch[1])
        : Math.floor(Math.random() * 80) + 40,
    };
  };

  // Extract rating from MCP response
  const extractRating = (mcpResponse) => {
    // Check if we have attractions with ratings
    if (
      mcpResponse &&
      mcpResponse.travelData &&
      mcpResponse.travelData.featured &&
      Array.isArray(mcpResponse.travelData.featured) &&
      mcpResponse.travelData.featured.length > 0
    ) {
      // Get the average rating from attractions
      let totalRating = 0;
      let ratingCount = 0;

      for (const attraction of mcpResponse.travelData.featured) {
        if (attraction && typeof attraction.rating === "number") {
          totalRating += attraction.rating;
          ratingCount++;
        }
      }

      if (ratingCount > 0) {
        return (totalRating / ratingCount).toFixed(1);
      }
    }

    // Fallback to text extraction
    let textToAnalyze = "";
    if (typeof mcpResponse === "string") {
      textToAnalyze = mcpResponse;
    } else if (mcpResponse && mcpResponse.response) {
      textToAnalyze = mcpResponse.response;
    } else {
      textToAnalyze = JSON.stringify(mcpResponse);
    }

    const ratingRegex = /(\d+(\.\d+)?)\/5|rating.*?(\d+(\.\d+)?)/i;
    const match = textToAnalyze.match(ratingRegex);

    if (match) {
      const rating = parseFloat(match[1] || match[3]);
      // Normalize to 5-star scale if needed
      return rating > 5 ? (rating / 10) * 5 : rating;
    }

    // Default to random good rating
    return (4 + Math.random()).toFixed(1);
  };

  // Function to generate a fallback analysis (if Gemini API fails)
  const generateFallbackAnalysis = (mcpResponse, cityName) => {
      let analysis = `**Quick Overview of ${cityName}**\n\n`;

      if (mcpResponse && mcpResponse.response) {
          analysis += mcpResponse.response.substring(0, 500).replace(/\*\*(.*?)\*\*/g, '• $1') + '...\n\n';
      } else {
          analysis += `${cityName} is a fantastic destination, offering a mix of culture, history, and modern attractions. `;
      }

      const highlights = extractHighlights(mcpResponse, 4);
      if (highlights.length > 0) {
          analysis += `**Key Experiences**\n`;
          highlights.forEach(h => analysis += `• ${h}\n`);
      } else {
          analysis += `• Explore historic landmarks\n• Enjoy the local cuisine\n• Discover vibrant neighborhoods\n`;
      }

      analysis += `\nThis analysis is a fallback due to an issue with the AI advisor.`;
      return analysis;
  };

  // Enhanced function to analyze MCP responses using Gemini with comprehensive logging
  const analyzeWithGemini = async (mcpResponse, cityName, comparisonContext) => {
    try {
      console.log(`🚀 GEMINI CITY ANALYSIS START for ${cityName}:`, {
        cityName,
        comparisonContext,
        mcpResponseType: typeof mcpResponse,
        hasResponse: !!mcpResponse?.response,
        hasTravelData: !!mcpResponse?.travelData,
        timestamp: new Date().toISOString(),
        mcpDataStructure: {
          responseLength: mcpResponse?.response?.length || 0,
          travelDataKeys: mcpResponse?.travelData ? Object.keys(mcpResponse.travelData) : [],
          attractionsCount: mcpResponse?.travelData?.attractions?.featured?.length || 0
        }
      });

      // Log the full MCP response for debugging
      console.log(`📋 FULL MCP RESPONSE for ${cityName}:`, {
        cityName,
        fullMcpResponse: mcpResponse,
        responsePreview: mcpResponse?.response?.substring(0, 500) + "...",
        travelDataPreview: mcpResponse?.travelData
      });

      const response = await axios.post(
        "http://localhost:5000/api/v1/gemini/analyze-city",
        {
          mcpResponse,
          cityName,
          comparisonContext
        }
      );

      console.log(`✅ GEMINI ANALYSIS SUCCESS for ${cityName}:`, {
        cityName,
        success: response.data.success,
        analysisLength: response.data.analysis?.length || 0,
        metadata: response.data.metadata,
        timestamp: new Date().toISOString(),
        rawResponse: response.data
      });

      // Log the FULL analysis content
      console.log(`📝 COMPLETE GEMINI ANALYSIS for ${cityName}:`, {
        cityName,
        fullAnalysis: response.data.analysis,
        analysisStructure: {
          hasOverview: /overview|city/i.test(response.data.analysis || ''),
          hasAttractions: /attraction|visit/i.test(response.data.analysis || ''),
          hasBudget: /budget|cost|price/i.test(response.data.analysis || ''),
          hasRecommendations: /recommend|suggest/i.test(response.data.analysis || ''),
          sections: (response.data.analysis || '').split('**').length - 1
        }
      });

      if (!response.data.success) {
        throw new Error(response.data.error || 'Analysis failed');
      }

      return response.data.analysis;

    } catch (error) {
      console.error(`❌ GEMINI ANALYSIS ERROR for ${cityName}:`, {
        cityName,
        error: error.message,
        status: error.response?.status,
        statusText: error.response?.statusText,
        responseData: error.response?.data,
        timestamp: new Date().toISOString(),
        errorStack: error.stack
      });
      
      const fallbackAnalysis = generateFallbackAnalysis(mcpResponse, cityName);
      console.log(`🔄 FALLBACK ANALYSIS USED for ${cityName}:`, {
        cityName,
        fallbackLength: fallbackAnalysis.length,
        fallbackAnalysis: fallbackAnalysis
      });
      
      return fallbackAnalysis;
    }
  };

  // Enhanced logging for generateComparativeAnalysis
  const generateComparativeAnalysis = async (city1Analysis, city2Analysis, city1Name, city2Name, travelContext) => {
    try {
      console.log(`🔄 COMPARATIVE ANALYSIS START:`, {
        city1Name,
        city2Name,
        travelContext,
        city1AnalysisLength: city1Analysis?.length || 0,
        city2AnalysisLength: city2Analysis?.length || 0,
        timestamp: new Date().toISOString(),
        city1AnalysisPreview: city1Analysis?.substring(0, 300) + "...",
        city2AnalysisPreview: city2Analysis?.substring(0, 300) + "..."
      });
      
      const response = await axios.post(
        "http://localhost:5000/api/v1/gemini/compare-cities",
        {
          city1Analysis,
          city2Analysis,
          city1Name,
          city2Name,
          travelContext
        }
      );

      console.log(`✅ COMPARATIVE ANALYSIS SUCCESS:`, {
        city1Name,
        city2Name,
        success: response.data.success,
        comparisonLength: response.data.comparison?.length || 0,
        metadata: response.data.metadata,
        timestamp: new Date().toISOString(),
        rawResponse: response.data
      });

      // Log the FULL comparative analysis content
      console.log(`📊 COMPLETE COMPARATIVE ANALYSIS:`, {
        city1Name,
        city2Name,
        fullComparison: response.data.comparison,
        comparisonStructure: {
          hasWinners: /winner|better|best/i.test(response.data.comparison || ''),
          hasRecommendation: /recommend|suggestion|choose/i.test(response.data.comparison || ''),
          hasBudget: /budget|cost|price/i.test(response.data.comparison || ''),
          sections: (response.data.comparison || '').split('**').length - 1,
          analysisQuality: (response.data.comparison?.length || 0) > 800 ? "Comprehensive" : "Basic"
        }
      });

      if (!response.data.success) {
        throw new Error(response.data.error || 'Comparative analysis failed');
      }

      return response.data.comparison;

    } catch (error) {
      console.error(`❌ COMPARATIVE ANALYSIS ERROR:`, {
        city1Name,
        city2Name,
        error: error.message,
        status: error.response?.status,
        statusText: error.response?.statusText,
        responseData: error.response?.data,
        timestamp: new Date().toISOString(),
        errorStack: error.stack
      });
      
      const fallbackComparison = `**Comparison Summary**\n\nBoth ${city1Name} and ${city2Name} offer unique travel experiences. ${city1Name} provides distinct cultural attractions while ${city2Name} offers its own set of memorable experiences. Your choice depends on personal preferences and travel style.\n\n**Key Differences**\nEach destination has unique attractions, cultural experiences, and cost structures.\n\n**Recommendation**\nConsider your travel preferences, budget, and desired experiences when making your choice.`;
      
      console.log(`🔄 FALLBACK COMPARATIVE ANALYSIS:`, {
        city1Name,
        city2Name,
        fallbackLength: fallbackComparison.length,
        fallbackComparison: fallbackComparison
      });
      
      return fallbackComparison;
    }
  };

  // Updated handleCompare function with Gemini analysis
  const handleCompare = async () => {
    if (!validateForm()) return;

    console.log(`🚀 Starting city comparison process:`, {
      timestamp: new Date().toISOString(),
      comparisonId: Date.now(),
      inputData: newComparison
    });

    setIsLoading(true);

    try {
      const { city1, city2, startDate, endDate, travelers, budget } = newComparison;
      const comparisonId = Date.now();

      // Calculate trip duration
      const start = new Date(startDate);
      const end = new Date(endDate);
      const days = Math.ceil((end - start) / (1000 * 60 * 60 * 24));

      console.log(`📅 Trip calculation results:`, {
        comparisonId,
        city1,
        city2,
        startDate,
        endDate,
        days,
        travelers,
        budget,
        startDateObj: start,
        endDateObj: end
      });

      // Step 1: Make parallel requests to get MCP data for both cities
      console.log(`📡 Fetching MCP data for both cities...`);
      const mcpStartTime = performance.now();
      
      const [city1Response, city2Response] = await Promise.all([
        fetchItineraryFromMCP(city1, startDate, endDate, travelers, budget),
        fetchItineraryFromMCP(city2, startDate, endDate, travelers, budget),
      ]);

      const mcpEndTime = performance.now();
      console.log(`✅ MCP data retrieval completed:`, {
        comparisonId,
        duration: `${(mcpEndTime - mcpStartTime).toFixed(2)}ms`,
        city1ResponseSize: JSON.stringify(city1Response).length,
        city2ResponseSize: JSON.stringify(city2Response).length,
        city1HasData: !!city1Response,
        city2HasData: !!city2Response
      });

      // Step 2: Calculate costs using real cost of living data
      console.log(`💰 Calculating costs for both cities...`);
      const costStartTime = performance.now();
      
      const [city1Cost, city2Cost] = await Promise.all([
        extractCostEstimate(city1Response, city1, days, travelers, budget),
        extractCostEstimate(city2Response, city2, days, travelers, budget)
      ]);

      const costEndTime = performance.now();
      console.log(`💵 Cost calculation completed:`, {
        comparisonId,
        duration: `${(costEndTime - costStartTime).toFixed(2)}ms`,
        city1Cost,
        city2Cost,
        costDifference: Math.abs(city1Cost - city2Cost),
        cheaperCity: city1Cost < city2Cost ? city1 : city2,
        savings: Math.abs(city1Cost - city2Cost)
      });

      // Step 3: Get intelligent analysis from Gemini for both cities
      console.log(`🧠 Starting Gemini analysis for both cities...`);
      const analysisStartTime = performance.now();
      
      const [city1Analysis, city2Analysis] = await Promise.all([
        analyzeWithGemini(city1Response, city1, true),
        analyzeWithGemini(city2Response, city2, true)
      ]);

      const analysisEndTime = performance.now();
      console.log(`🎯 Individual city analyses completed:`, {
        comparisonId,
        duration: `${(analysisEndTime - analysisStartTime).toFixed(2)}ms`,
        city1AnalysisLength: city1Analysis?.length || 0,
        city2AnalysisLength: city2Analysis?.length || 0,
        city1AnalysisQuality: city1Analysis?.length > 500 ? "Comprehensive" : "Basic",
        city2AnalysisQuality: city2Analysis?.length > 500 ? "Comprehensive" : "Basic"
      });

      // Step 4: Generate comparative analysis
      console.log(`🔄 Generating comparative analysis...`);
      const comparisonStartTime = performance.now();
      
      const travelContext = { days, travelers, budget, startDate, endDate };
      const comparativeAnalysis = await generateComparativeAnalysis(
        city1Analysis, 
        city2Analysis, 
        city1, 
        city2, 
        travelContext
      );

      const comparisonEndTime = performance.now();
      console.log(`📊 Comparative analysis completed:`, {
        comparisonId,
        duration: `${(comparisonEndTime - comparisonStartTime).toFixed(2)}ms`,
        comparativeAnalysisLength: comparativeAnalysis?.length || 0,
        comparativeAnalysisQuality: comparativeAnalysis?.length > 800 ? "Comprehensive" : "Basic"
      });

      // Step 5: Create comparison data with Gemini insights
      const totalStartTime = mcpStartTime;
      const totalEndTime = performance.now();
      
      console.log(`🏗️ Building final comparison data structure...`);
      
      // Extract comprehensive MCP data for enhanced display
      const city1MCPData = extractMCPData(city1Response, city1);
      const city2MCPData = extractMCPData(city2Response, city2);

      console.log(`📊 MCP DATA EXTRACTION COMPLETE:`, {
        city1: {
          name: city1,
          attractionsCount: city1MCPData.attractions.length,
          accommodationsCount: city1MCPData.accommodations.length,
          transportationCount: city1MCPData.transportation.length
        },
        city2: {
          name: city2,
          attractionsCount: city2MCPData.attractions.length,
          accommodationsCount: city2MCPData.accommodations.length,
          transportationCount: city2MCPData.transportation.length
        }
      });

      const comparisonData = {
        id: comparisonId,
        city1: {
          name: city1,
          country: getCountryForCity(city1),
          itinerary: extractActivities(city1Response), // Legacy support
          estimatedCost: city1Cost,
          rating: extractRating(city1Response),
          highlights: extractHighlights(city1Response),
          weather: generateWeather(),
          transportation: extractTransportationPrices(city1Response),
          accommodation: extractAccommodationPrices(city1Response),
          geminiAnalysis: city1Analysis,
          mcpData: city1MCPData, // Enhanced MCP data
          fullResponse: city1Response,
        },
        city2: {
          name: city2,
          country: getCountryForCity(city2),
          itinerary: extractActivities(city2Response), // Legacy support
          estimatedCost: city2Cost,
          rating: extractRating(city2Response),
          highlights: extractHighlights(city2Response),
          weather: generateWeather(),
          transportation: extractTransportationPrices(city2Response),
          accommodation: extractAccommodationPrices(city2Response),
          geminiAnalysis: city2Analysis,
          mcpData: city2MCPData, // Enhanced MCP data
          fullResponse: city2Response,
        },
        comparativeAnalysis: comparativeAnalysis,
        dates: { start: startDate, end: endDate },
        travelers: travelers,
        budget: budget,
        createdAt: new Date().toISOString(),
      };

      console.log(`🎉 Comparison process completed successfully:`, {
        comparisonId,
        totalDuration: `${(totalEndTime - totalStartTime).toFixed(2)}ms`,
        city1: city1,
        city2: city2,
        city1Cost: city1Cost,
        city2Cost: city2Cost,
        winner: city1Cost < city2Cost ? city1 : city2,
        savings: Math.abs(city1Cost - city2Cost),
        hasCity1Analysis: !!city1Analysis,
        hasCity2Analysis: !!city2Analysis,
        hasComparativeAnalysis: !!comparativeAnalysis,
        comparisonDataSize: JSON.stringify(comparisonData).length,
        timestamp: new Date().toISOString()
      });

      setComparisons((prev) => [comparisonData, ...prev]);

      // Reset form
      setNewComparison({
        city1: "",
        city2: "",
        startDate: "",
        endDate: "",
        travelers: 2,
        budget: "medium",
      });

      console.log(`✨ Comparison added to state and form reset`);

    } catch (error) {
      console.error("❌ Comparison process failed:", {
        error: error.message,
        stack: error.stack,
        timestamp: new Date().toISOString(),
        inputData: newComparison
      });
      
      alert(
        "Failed to generate comparison. Please check your network connection and try again."
      );
    } finally {
      setIsLoading(false);
      console.log(`🔄 Loading state reset`);
    }
  };

  const removeComparison = (id) => {
    setComparisons((prev) => prev.filter((comp) => comp.id !== id));
  };

  const getCountryForCity = (city) => {
    const cityCountryMap = {
      paris: "France",
      london: "United Kingdom",
      tokyo: "Japan",
      "new york": "United States",
      dubai: "UAE",
      singapore: "Singapore",
      rome: "Italy",
      barcelona: "Spain",
      amsterdam: "Netherlands",
      bangkok: "Thailand",
      sydney: "Australia",
      mumbai: "India",
      delhi: "India",
      bangalore: "India",
      goa: "India",
    };

    return cityCountryMap[city.toLowerCase()] || "Unknown";
  };

  const generateWeather = () => {
    const conditions = ["Sunny", "Partly Cloudy", "Clear", "Mild"];
    const temp = Math.floor(Math.random() * 15) + 15; // 15-30°C

    return {
      condition: conditions[Math.floor(Math.random() * conditions.length)],
      temperature: `${temp}°C`,
      humidity: `${Math.floor(Math.random() * 30) + 40}%`,
    };
  };

  // Enhanced Component to render Gemini analysis with breathtaking design
const GeminiAnalysisDisplay = ({ analysis, cityName }) => {
  const formatAnalysis = (text) => {
    if (!text) return (
      <div className="text-center py-8">
        <div className="animate-pulse">
          <div className="w-16 h-16 bg-gradient-to-br from-purple-100 to-indigo-100 rounded-full mx-auto mb-4 flex items-center justify-center">
            <span className="text-2xl">🤖</span>
          </div>
          <p className="text-slate-500 italic">AI analysis is processing...</p>
        </div>
      </div>
    );
    
    // Split by lines to handle markdown headers and lists
    const lines = text.split('\n');
    
    return lines.map((line, index) => {
      const trimmedLine = line.trim();

      // Check for markdown headers (e.g., **Header**)
      if (trimmedLine.startsWith('**') && trimmedLine.endsWith('**') && trimmedLine.length > 4) {
        const headerText = trimmedLine.replace(/\*\*/g, '');
        return (
          <div key={index} className="group relative">
            <div className="absolute -left-4 top-0 w-1 h-full bg-gradient-to-b from-purple-500 to-indigo-500 rounded-full opacity-70 group-hover:opacity-100 transition-opacity"></div>
            <h6 className="font-bold text-slate-800 mt-6 mb-3 first:mt-0 text-lg bg-gradient-to-r from-purple-600 to-indigo-600 bg-clip-text text-transparent">
              {headerText}
            </h6>
          </div>
        );
      }
      
      // Check for list items (• or -)
      if (trimmedLine.startsWith('•') || trimmedLine.startsWith('-')) {
        return (
          <div key={index} className="flex items-start space-x-3 mb-3 group hover:bg-white/50 rounded-lg p-2 -ml-2 transition-all duration-200">
            <div className="w-2 h-2 bg-gradient-to-r from-purple-400 to-indigo-400 rounded-full mt-2 flex-shrink-0 group-hover:scale-125 transition-transform"></div>
            <p className="text-sm text-slate-700 leading-relaxed group-hover:text-slate-800 transition-colors">
              {trimmedLine.replace(/^[•\-]\s*/, '')}
            </p>
          </div>
        );
      }
      
      // Treat non-empty lines as paragraphs
      if (trimmedLine.length > 0) {
        return (
          <p key={index} className="text-sm text-slate-700 mb-3 leading-relaxed hover:text-slate-800 transition-colors">
            {trimmedLine}
          </p>
        );
      }
      
      return null; // Ignore empty lines after trim
    }).filter(el => el != null); // Remove null elements
  };

  return (
    <div className="relative overflow-hidden bg-gradient-to-br from-purple-50/80 via-indigo-50/80 to-blue-50/80 backdrop-blur-sm rounded-2xl border border-white/20 shadow-xl mb-8 group hover:shadow-2xl transition-all duration-500">
      {/* Animated background pattern */}
      <div className="absolute inset-0 bg-gradient-to-r from-purple-100/20 via-indigo-100/20 to-blue-100/20 opacity-50"></div>
      <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-br from-purple-200/30 to-indigo-200/30 rounded-full blur-xl transform translate-x-16 -translate-y-16 group-hover:scale-150 transition-transform duration-700"></div>
      <div className="absolute bottom-0 left-0 w-24 h-24 bg-gradient-to-tr from-indigo-200/30 to-blue-200/30 rounded-full blur-xl transform -translate-x-12 translate-y-12 group-hover:scale-150 transition-transform duration-700"></div>
      
      {/* Content */}
      <div className="relative p-6">
        <div className="flex items-center space-x-3 mb-6">
          <div className="w-10 h-10 bg-gradient-to-br from-purple-500 to-indigo-600 rounded-xl flex items-center justify-center shadow-lg group-hover:shadow-xl transition-shadow duration-300">
            <div className="relative">
              <span className="text-white text-lg font-bold">✨</span>
              <div className="absolute inset-0 bg-white/20 rounded-lg animate-pulse"></div>
            </div>
          </div>
          <div>
            <h5 className="font-bold text-slate-800 text-lg">
              <span className="bg-gradient-to-r from-purple-600 to-indigo-600 bg-clip-text text-transparent">
                AI Travel Insights
              </span>
            </h5>
            <p className="text-sm text-slate-600 font-medium">Personalized analysis for {cityName}</p>
          </div>
          <div className="ml-auto">
            <div className="flex items-center space-x-1 bg-white/60 rounded-full px-3 py-1 backdrop-blur-sm">
              <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse"></div>
              <span className="text-xs font-medium text-slate-600">Live</span>
            </div>
          </div>
        </div>
        
        <div className="relative">
          <div className="absolute inset-0 bg-white/40 rounded-xl blur-sm"></div>
          <div className="relative bg-white/60 backdrop-blur-sm rounded-xl p-5 border border-white/30">
            <div className="prose prose-sm max-w-none">
              {formatAnalysis(analysis)}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

// Enhanced Component to render comparative analysis with breathtaking design
const ComparativeAnalysisDisplay = ({ analysis, city1Name, city2Name }) => {
  const formatAnalysis = (text) => {
    if (!text) return (
      <div className="text-center py-12">
        <div className="animate-bounce">
          <div className="w-20 h-20 bg-gradient-to-br from-emerald-100 to-teal-100 rounded-full mx-auto mb-6 flex items-center justify-center">
            <span className="text-3xl">⚖️</span>
          </div>
          <p className="text-slate-500 italic text-lg">Comparative analysis is brewing...</p>
        </div>
      </div>
    );
    
    // Split by lines to handle markdown headers and lists
    const lines = text.split('\n');
    
    return lines.map((line, index) => {
      const trimmedLine = line.trim();

      // Check for markdown headers (e.g., **Header**)
      if (trimmedLine.startsWith('**') && trimmedLine.endsWith('**') && trimmedLine.length > 4) {
        const headerText = trimmedLine.replace(/\*\*/g, '');
        return (
          <div key={index} className="group relative mb-4">
            <div className="absolute -left-6 top-0 w-1.5 h-full bg-gradient-to-b from-emerald-500 via-teal-500 to-blue-500 rounded-full opacity-70 group-hover:opacity-100 transition-opacity"></div>
            <div className="relative">
              <h6 className="font-bold text-slate-800 mt-6 mb-4 first:mt-0 text-xl">
                <span className="bg-gradient-to-r from-emerald-600 via-teal-600 to-blue-600 bg-clip-text text-transparent">
                  {headerText}
                </span>
              </h6>
              <div className="absolute -bottom-2 left-0 w-16 h-0.5 bg-gradient-to-r from-emerald-500 to-teal-500 rounded-full"></div>
            </div>
          </div>
        );
      }
      
      // Check for list items (• or -)
      if (trimmedLine.startsWith('•') || trimmedLine.startsWith('-')) {
        const itemText = trimmedLine.replace(/^[•\-]\s*/, '');
        const isWinnerItem = /winner|better|best|recommend/i.test(itemText);
        
        return (
          <div key={index} className={`flex items-start space-x-4 mb-4 group hover:bg-white/60 rounded-xl p-3 -ml-3 transition-all duration-300 ${isWinnerItem ? 'bg-gradient-to-r from-green-50/80 to-emerald-50/80 border-l-4 border-green-400' : ''}`}>
            <div className={`w-3 h-3 rounded-full mt-2 flex-shrink-0 group-hover:scale-125 transition-transform ${isWinnerItem ? 'bg-gradient-to-r from-green-400 to-emerald-400' : 'bg-gradient-to-r from-emerald-400 to-teal-400'}`}>
            </div>
            <p className="text-sm text-slate-700 leading-relaxed group-hover:text-slate-800 transition-colors font-medium">
              {itemText}
            </p>
          </div>
        );
      }
      
      // Special handling for recommendation sections
      if (trimmedLine.toLowerCase().includes('recommend') || trimmedLine.toLowerCase().includes('winner')) {
        return (
          <div key={index} className="bg-gradient-to-r from-green-50/80 via-emerald-50/80 to-teal-50/80 rounded-xl p-4 mb-4 border border-green-200/50">
            <div className="flex items-center space-x-3 mb-2">
              <div className="w-6 h-6 bg-gradient-to-r from-green-500 to-emerald-500 rounded-full flex items-center justify-center">
                <span className="text-white text-xs">★</span>
              </div>
              <span className="text-xs font-semibold text-green-700 uppercase tracking-wide">Recommendation</span>
            </div>
            <p className="text-sm text-slate-800 font-medium leading-relaxed">
              {trimmedLine}
            </p>
          </div>
        );
      }
      
      // Treat non-empty lines as paragraphs
      if (trimmedLine.length > 0) {
        return (
          <p key={index} className="text-sm text-slate-700 mb-3 leading-relaxed hover:text-slate-800 transition-colors">
            {trimmedLine}
          </p>
        );
      }
      
      return null; // Ignore empty lines after trim
    }).filter(el => el != null); // Remove null elements
  };

  return (
    <div className="relative overflow-hidden bg-gradient-to-br from-emerald-50/90 via-teal-50/90 to-cyan-50/90 backdrop-blur-sm rounded-3xl border border-white/30 shadow-2xl mt-8 mb-8 group hover:shadow-3xl transition-all duration-700">
      {/* Animated background elements */}
      <div className="absolute inset-0 bg-gradient-to-r from-emerald-100/30 via-teal-100/30 to-cyan-100/30 opacity-60"></div>
      <div className="absolute top-0 left-0 w-40 h-40 bg-gradient-to-br from-emerald-200/40 to-teal-200/40 rounded-full blur-2xl transform -translate-x-20 -translate-y-20 group-hover:scale-150 transition-transform duration-1000"></div>
      <div className="absolute bottom-0 right-0 w-32 h-32 bg-gradient-to-tl from-teal-200/40 to-cyan-200/40 rounded-full blur-2xl transform translate-x-16 translate-y-16 group-hover:scale-150 transition-transform duration-1000"></div>
      <div className="absolute top-1/2 left-1/2 w-24 h-24 bg-gradient-to-br from-cyan-200/30 to-blue-200/30 rounded-full blur-xl transform -translate-x-12 -translate-y-12 group-hover:rotate-180 transition-transform duration-1000"></div>
      
      {/* Content */}
      <div className="relative p-8">
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center space-x-4">
            <div className="relative">
              <div className="w-12 h-12 bg-gradient-to-br from-emerald-500 via-teal-500 to-cyan-500 rounded-2xl flex items-center justify-center shadow-xl group-hover:shadow-2xl transition-shadow duration-300">
                <GitCompare className="w-6 h-6 text-white" />
                <div className="absolute inset-0 bg-white/20 rounded-2xl animate-pulse"></div>
              </div>
              <div className="absolute -top-1 -right-1 w-4 h-4 bg-gradient-to-br from-yellow-400 to-orange-400 rounded-full animate-bounce"></div>
            </div>
            <div>
              <h4 className="text-2xl font-bold">
                <span className="bg-gradient-to-r from-emerald-600 via-teal-600 to-cyan-600 bg-clip-text text-transparent">
                  Battle of Cities
                </span>
              </h4>
              <p className="text-slate-600 font-medium">{city1Name} vs {city2Name} • AI Verdict</p>
            </div>
          </div>
          
          {/* Winner indicator */}
          <div className="flex items-center space-x-2 bg-white/70 rounded-full px-4 py-2 backdrop-blur-sm shadow-lg">
            <div className="w-3 h-3 bg-gradient-to-r from-green-400 to-emerald-400 rounded-full animate-pulse"></div>
            <span className="text-sm font-bold text-slate-700">Smart Analysis</span>
          </div>
        </div>
        
        {/* VS Badge */}
        <div className="absolute top-8 right-8 bg-gradient-to-br from-purple-500 to-indigo-600 text-white rounded-full w-16 h-16 flex items-center justify-center shadow-xl transform rotate-12 group-hover:rotate-0 transition-transform duration-500">
          <span className="font-bold text-lg">VS</span>
        </div>
        
        {/* Analysis content */}
        <div className="relative">
          <div className="absolute inset-0 bg-white/50 rounded-2xl blur-sm"></div>
          <div className="relative bg-white/70 backdrop-blur-sm rounded-2xl p-6 border border-white/40 shadow-inner">
            <div className="prose prose-sm max-w-none">
              {formatAnalysis(analysis)}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-orange-50">
      {/* Header */}
      <div className="bg-white border-b border-slate-200 sticky top-0 z-40 backdrop-blur-sm bg-white/90">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center space-x-4">
              <button
                onClick={() => navigate("/dashboard")}
                className="flex items-center space-x-2 text-slate-600 hover:text-slate-900 transition-colors group"
              >
                <ArrowLeft className="w-5 h-5 transition-transform group-hover:-translate-x-1" />
                <span className="font-medium">Back to Dashboard</span>
              </button>

              <div className="hidden sm:block w-px h-6 bg-slate-300"></div>

              <div className="flex items-center space-x-3">
                <div className="w-10 h-10 bg-gradient-to-r from-orange-500 to-orange-600 rounded-xl flex items-center justify-center">
                  <GitCompare className="w-5 h-5 text-white" />
                </div>
                <div>
                  <h1 className="text-xl font-bold text-slate-900">
                    Compare Itineraries
                  </h1>
                  <p className="text-sm text-slate-600">
                    Compare travel plans between cities
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Comparison Form */}
        <div className="bg-white rounded-2xl shadow-lg border border-slate-200 p-6 mb-8">
          <div className="flex items-center space-x-3 mb-6">
            <div className="w-8 h-8 bg-orange-100 rounded-lg flex items-center justify-center">
              <Plus className="w-5 h-5 text-orange-600" />
            </div>
            <h2 className="text-xl font-bold text-slate-900">
              Create New Comparison
            </h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {/* Cities Input */}
            <div className="lg:col-span-2 grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">
                  First City
                </label>
                <div className="relative">
                  <MapPin className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-slate-400" />
                  <input
                    type="text"
                    value={newComparison.city1}
                    onChange={(e) => handleInputChange("city1", e.target.value)}
                    placeholder="e.g., Paris"
                    className="w-full pl-10 pr-4 py-3 border border-slate-300 rounded-xl focus:ring-2 focus:ring-orange-500 focus:border-transparent transition-all"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">
                  Second City
                </label>
                <div className="relative">
                  <MapPin className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-slate-400" />
                  <input
                    type="text"
                    value={newComparison.city2}
                    onChange={(e) => handleInputChange("city2", e.target.value)}
                    placeholder="e.g., London"
                    className="w-full pl-10 pr-4 py-3 border border-slate-300 rounded-xl focus:ring-2 focus:ring-orange-500 focus:border-transparent transition-all"
                  />
                </div>
              </div>
            </div>

            {/* Dates and Details */}
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-2">
                    Start Date
                  </label>
                  <input
                    type="date"
                    value={newComparison.startDate}
                    onChange={(e) =>
                      handleInputChange("startDate", e.target.value)
                    }
                    min={minDate}
                    className="w-full px-3 py-3 border border-slate-300 rounded-xl focus:ring-2 focus:ring-orange-500 focus:border-transparent transition-all"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-2">
                    End Date
                  </label>
                  <input
                    type="date"
                    value={newComparison.endDate}
                    onChange={(e) =>
                      handleInputChange("endDate", e.target.value)
                    }
                    min={newComparison.startDate || minDate}
                    className="w-full px-3 py-3 border border-slate-300 rounded-xl focus:ring-2 focus:ring-orange-500 focus:border-transparent transition-all"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-2">
                    Travelers
                  </label>
                  <select
                    value={newComparison.travelers}
                    onChange={(e) =>
                      handleInputChange("travelers", parseInt(e.target.value))
                    }
                    className="w-full px-3 py-3 border border-slate-300 rounded-xl focus:ring-2 focus:ring-orange-500 focus:border-transparent transition-all"
                  >
                    {[1, 2, 3, 4, 5, 6, 7, 8].map((num) => (
                      <option key={num} value={num}>
                        {num} {num === 1 ? "Person" : "People"}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-2">
                    Budget
                  </label>
                  <select
                    value={newComparison.budget}
                    onChange={(e) =>
                      handleInputChange("budget", e.target.value)
                    }
                    className="w-full px-3 py-3 border border-slate-300 rounded-xl focus:ring-2 focus:ring-orange-500 focus:border-transparent transition-all"
                  >
                    <option value="budget">Budget</option>
                    <option value="medium">Medium</option>
                    <option value="luxury">Luxury</option>
                  </select>
                </div>
              </div>
            </div>
          </div>

          {/* Compare Button */}
          <div className="mt-6 flex justify-end">
            <button
              onClick={handleCompare}
              disabled={isLoading}
              className="bg-gradient-to-r from-orange-500 to-orange-600 hover:from-orange-600 hover:to-orange-700 disabled:from-gray-400 disabled:to-gray-500 text-white font-bold py-3 px-8 rounded-xl transition-all duration-300 transform hover:scale-105 disabled:hover:scale-100 flex items-center space-x-2 shadow-lg hover:shadow-xl"
            >
              {isLoading ? (
                <>
                  <Loader2 className="w-5 h-5 animate-spin" />
                  <span>Comparing...</span>
                </>
              ) : (
                <>
                  <GitCompare className="w-5 h-5" />
                  <span>Compare Itineraries</span>
                </>
              )}
            </button>
          </div>
        </div>

        {/* Comparisons Results */}
        {comparisons.length > 0 && (
          <div className="space-y-8">
            <div className="flex items-center justify-between">
              <h2 className="text-2xl font-bold text-slate-900">
                Your Comparisons
              </h2>
              <span className="bg-orange-100 text-orange-800 px-3 py-1 rounded-full text-sm font-medium">
                {comparisons.length} comparison
                {comparisons.length !== 1 ? "s" : ""}
              </span>
            </div>

            {comparisons.map((comparison) => (
              <div
                key={comparison.id}
                className="relative overflow-hidden bg-gradient-to-br from-white/95 via-slate-50/95 to-white/95 backdrop-blur-xl rounded-3xl shadow-2xl border border-white/40 group hover:shadow-3xl transition-all duration-700 hover:scale-[1.02]"
              >
                {/* Floating background elements */}
                <div className="absolute top-0 left-0 w-72 h-72 bg-gradient-to-br from-orange-200/30 via-red-200/30 to-pink-200/30 rounded-full blur-3xl transform -translate-x-36 -translate-y-36 group-hover:scale-150 transition-transform duration-1000"></div>
                <div className="absolute bottom-0 right-0 w-64 h-64 bg-gradient-to-tl from-blue-200/30 via-indigo-200/30 to-purple-200/30 rounded-full blur-3xl transform translate-x-32 translate-y-32 group-hover:scale-150 transition-transform duration-1000"></div>
                <div className="absolute top-1/2 left-1/2 w-48 h-48 bg-gradient-to-br from-emerald-200/20 to-teal-200/20 rounded-full blur-2xl transform -translate-x-24 -translate-y-24 group-hover:rotate-45 transition-transform duration-1000"></div>
                {/* Enhanced Comparison Header */}
                <div className="relative overflow-hidden bg-gradient-to-r from-orange-500/90 via-red-500/90 to-pink-500/90 backdrop-blur-sm px-8 py-6 text-white">
                  {/* Header background effects */}
                  <div className="absolute inset-0 bg-gradient-to-r from-orange-600/20 via-red-600/20 to-pink-600/20"></div>
                  <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-bl from-yellow-300/30 to-orange-300/30 rounded-full blur-2xl transform translate-x-16 -translate-y-16"></div>
                  <div className="absolute bottom-0 left-0 w-24 h-24 bg-gradient-to-tr from-pink-300/30 to-red-300/30 rounded-full blur-2xl transform -translate-x-12 translate-y-12"></div>
                  
                  <div className="relative flex items-center justify-between">
                    <div className="flex items-center space-x-6">
                      <div className="relative">
                        <div className="w-12 h-12 bg-white/20 backdrop-blur-sm rounded-2xl flex items-center justify-center shadow-xl border border-white/30">
                          <GitCompare className="w-7 h-7 text-white" />
                        </div>
                        <div className="absolute -top-2 -right-2 w-6 h-6 bg-gradient-to-br from-yellow-400 to-orange-400 rounded-full flex items-center justify-center shadow-lg animate-bounce">
                          <span className="text-white text-xs font-bold">⚡</span>
                        </div>
                      </div>
                      <div>
                        <h3 className="text-2xl font-bold mb-1 flex items-center space-x-3">
                          <span>{comparison.city1.name}</span>
                          <span className="text-xl opacity-75">vs</span>
                          <span>{comparison.city2.name}</span>
                        </h3>
                        <div className="flex items-center space-x-4 text-orange-100">
                          <div className="flex items-center space-x-2">
                            <Calendar className="w-4 h-4" />
                            <span className="font-medium">
                              {new Date(comparison.dates.start).toLocaleDateString()} - {new Date(comparison.dates.end).toLocaleDateString()}
                            </span>
                          </div>
                          <div className="flex items-center space-x-2">
                            <Users className="w-4 h-4" />
                            <span className="font-medium">{comparison.travelers} travelers</span>
                          </div>
                        </div>
                      </div>
                    </div>
                    <button
                      onClick={() => removeComparison(comparison.id)}
                      className="relative w-10 h-10 bg-white/10 hover:bg-white/20 backdrop-blur-sm rounded-xl flex items-center justify-center transition-all duration-300 hover:scale-110 border border-white/20 group"
                    >
                      <X className="w-5 h-5 text-white group-hover:rotate-90 transition-transform duration-300" />
                    </button>
                  </div>
                </div>

                {/* Enhanced Comparison Content */}
                <div className="relative grid grid-cols-1 lg:grid-cols-2 divide-y lg:divide-y-0 lg:divide-x divide-slate-200/50">
                  {/* Divider line enhancement */}
                  <div className="hidden lg:block absolute left-1/2 top-0 bottom-0 w-px bg-gradient-to-b from-transparent via-slate-300/50 to-transparent transform -translate-x-px"></div>
                  {/* Enhanced City 1 */}
                  <div className="relative p-8 group/city1">
                    {/* City background gradient */}
                    <div className="absolute inset-0 bg-gradient-to-br from-orange-50/60 via-red-50/60 to-pink-50/60 opacity-0 group-hover/city1:opacity-100 transition-opacity duration-500"></div>
                    
                    <div className="relative flex items-center justify-between mb-6">
                      <div className="flex items-center space-x-4">
                        <div className="w-16 h-16 bg-gradient-to-br from-orange-400 via-red-400 to-pink-400 rounded-2xl flex items-center justify-center shadow-xl group-hover/city1:shadow-2xl transition-shadow duration-300">
                          <span className="text-white text-2xl font-bold">{comparison.city1.name.charAt(0)}</span>
                        </div>
                        <div>
                          <h4 className="text-2xl font-bold text-slate-900 group-hover/city1:text-slate-800 transition-colors">
                            {comparison.city1.name}
                          </h4>
                          <p className="text-slate-600 font-medium flex items-center space-x-2">
                            <MapPin className="w-4 h-4" />
                            <span>{comparison.city1.country}</span>
                          </p>
                        </div>
                      </div>
                      <div className="text-right space-y-2">
                        <div className="flex items-center justify-end space-x-2 bg-yellow-50 rounded-full px-3 py-1">
                          <Star className="w-4 h-4 text-yellow-500 fill-current" />
                          <span className="font-bold text-slate-900 text-lg">
                            {comparison.city1.rating}
                          </span>
                        </div>
                        <div className="bg-green-50 rounded-xl px-4 py-2 border border-green-200/50">
                          <p className="text-3xl font-bold text-green-600">
                            ${comparison.city1.estimatedCost}
                          </p>
                          <p className="text-sm text-green-600 font-medium">estimated cost</p>
                        </div>
                      </div>
                    </div>

                    {/* NEW: Gemini Analysis Display for City 1 */}
                    <GeminiAnalysisDisplay
                      analysis={comparison.city1.geminiAnalysis}
                      cityName={comparison.city1.name}
                    />
                    
                    {/* Enhanced MCP Data Display */}
                    {comparison.city1.mcpData && (
                      <div className="mb-6 space-y-4">
                        {/* Attractions Section */}
                        {comparison.city1.mcpData.attractions.length > 0 && (
                          <div className="bg-gradient-to-r from-orange-50/80 to-red-50/80 rounded-xl p-4 border border-orange-200/50">
                            <h6 className="font-semibold text-slate-800 mb-3 flex items-center">
                              <span className="text-lg mr-2">🎯</span>
                              Top Attractions
                            </h6>
                            <div className="grid grid-cols-1 gap-2">
                              {comparison.city1.mcpData.attractions.slice(0, 6).map((attraction, index) => (
                                <div key={index} className="flex items-center space-x-3 p-2 bg-white/60 rounded-lg hover:bg-white/80 transition-colors">
                                  <div className="w-2 h-2 bg-gradient-to-r from-orange-400 to-red-400 rounded-full"></div>
                                  <span className="text-sm text-slate-700 font-medium">{attraction.name}</span>
                                  {attraction.category && (
                                    <span className="text-xs bg-orange-100 text-orange-700 px-2 py-1 rounded-full ml-auto">
                                      {attraction.category}
                                    </span>
                                  )}
                                </div>
                              ))}
                            </div>
                          </div>
                        )}
                        
                        {/* Accommodations Preview */}
                        {comparison.city1.mcpData.accommodations.length > 0 && (
                          <div className="bg-gradient-to-r from-blue-50/80 to-indigo-50/80 rounded-xl p-4 border border-blue-200/50">
                            <h6 className="font-semibold text-slate-800 mb-3 flex items-center">
                              <span className="text-lg mr-2">🏨</span>
                              Accommodation Options
                            </h6>
                            <div className="space-y-2">
                              {comparison.city1.mcpData.accommodations.slice(0, 3).map((hotel, index) => (
                                <div key={index} className="flex items-center justify-between p-2 bg-white/60 rounded-lg">
                                  <span className="text-sm text-slate-700 font-medium">{hotel.name}</span>
                                  {hotel.priceRange && (
                                    <span className="text-xs bg-blue-100 text-blue-700 px-2 py-1 rounded-full">
                                      {hotel.priceRange}
                                    </span>
                                  )}
                                </div>
                              ))}
                            </div>
                          </div>
                        )}
                      </div>
                    )}

                    {/* Highlights */}
                    <div className="mb-6">
                      <h5 className="font-semibold text-slate-900 mb-3">
                        Key Highlights
                      </h5>
                      <div className="flex flex-wrap gap-2">
                        {comparison.city1.highlights.map((highlight, index) => (
                          <span
                            key={index}
                            className="bg-orange-100 text-orange-800 px-3 py-1 rounded-full text-sm"
                          >
                            {highlight}
                          </span>
                        ))}
                      </div>
                    </div>

                    {/* Quick Stats */}
                    <div className="grid grid-cols-2 gap-4 text-sm">
                      <div className="bg-slate-50 rounded-lg p-3">
                        <div className="flex items-center space-x-2 mb-1">
                          <Plane className="w-4 h-4 text-slate-600" />
                          <span className="font-medium text-slate-900">
                            Transport
                          </span>
                        </div>
                        <p className="text-slate-600">
                          From ${comparison.city1.transportation.public}/day
                        </p>
                      </div>
                      <div className="bg-slate-50 rounded-lg p-3">
                        <div className="flex items-center space-x-2 mb-1">
                          <Hotel className="w-4 h-4 text-slate-600" />
                          <span className="font-medium text-slate-900">
                            Hotels
                          </span>
                        </div>
                        <p className="text-slate-600">
                          From ${comparison.city1.accommodation.budget}/night
                        </p>
                      </div>
                    </div>
                  </div>

                  {/* Enhanced City 2 */}
                  <div className="relative p-8 group/city2">
                    {/* City background gradient */}
                    <div className="absolute inset-0 bg-gradient-to-br from-blue-50/60 via-indigo-50/60 to-purple-50/60 opacity-0 group-hover/city2:opacity-100 transition-opacity duration-500"></div>
                    
                    <div className="relative flex items-center justify-between mb-6">
                      <div className="flex items-center space-x-4">
                        <div className="w-16 h-16 bg-gradient-to-br from-blue-400 via-indigo-400 to-purple-400 rounded-2xl flex items-center justify-center shadow-xl group-hover/city2:shadow-2xl transition-shadow duration-300">
                          <span className="text-white text-2xl font-bold">{comparison.city2.name.charAt(0)}</span>
                        </div>
                        <div>
                          <h4 className="text-2xl font-bold text-slate-900 group-hover/city2:text-slate-800 transition-colors">
                            {comparison.city2.name}
                          </h4>
                          <p className="text-slate-600 font-medium flex items-center space-x-2">
                            <MapPin className="w-4 h-4" />
                            <span>{comparison.city2.country}</span>
                          </p>
                        </div>
                      </div>
                      <div className="text-right space-y-2">
                        <div className="flex items-center justify-end space-x-2 bg-yellow-50 rounded-full px-3 py-1">
                          <Star className="w-4 h-4 text-yellow-500 fill-current" />
                          <span className="font-bold text-slate-900 text-lg">
                            {comparison.city2.rating}
                          </span>
                        </div>
                        <div className="bg-green-50 rounded-xl px-4 py-2 border border-green-200/50">
                          <p className="text-3xl font-bold text-green-600">
                            ${comparison.city2.estimatedCost}
                          </p>
                          <p className="text-sm text-green-600 font-medium">estimated cost</p>
                        </div>
                      </div>
                    </div>

                    {/* NEW: Gemini Analysis Display for City 2 */}
                    <GeminiAnalysisDisplay
                      analysis={comparison.city2.geminiAnalysis}
                      cityName={comparison.city2.name}
                    />

                    {/* Enhanced MCP Data Display */}
                    {comparison.city2.mcpData && (
                      <div className="mb-6 space-y-4">
                        {/* Attractions Section */}
                        {comparison.city2.mcpData.attractions.length > 0 && (
                          <div className="bg-gradient-to-r from-green-50/80 to-emerald-50/80 rounded-xl p-4 border border-green-200/50">
                            <h6 className="font-semibold text-slate-800 mb-3 flex items-center">
                              <span className="text-lg mr-2">🎯</span>
                              Top Attractions
                            </h6>
                            <div className="grid grid-cols-1 gap-2">
                              {comparison.city2.mcpData.attractions.slice(0, 6).map((attraction, index) => (
                                <div key={index} className="flex items-center space-x-3 p-2 bg-white/60 rounded-lg hover:bg-white/80 transition-colors">
                                  <div className="w-2 h-2 bg-gradient-to-r from-green-400 to-emerald-400 rounded-full"></div>
                                  <span className="text-sm text-slate-700 font-medium">{attraction.name}</span>
                                  {attraction.category && (
                                    <span className="text-xs bg-green-100 text-green-700 px-2 py-1 rounded-full ml-auto">
                                      {attraction.category}
                                    </span>
                                  )}
                                </div>
                              ))}
                            </div>
                          </div>
                        )}
                        
                        {/* Accommodations Preview */}
                        {comparison.city2.mcpData.accommodations.length > 0 && (
                          <div className="bg-gradient-to-r from-purple-50/80 to-pink-50/80 rounded-xl p-4 border border-purple-200/50">
                            <h6 className="font-semibold text-slate-800 mb-3 flex items-center">
                              <span className="text-lg mr-2">🏨</span>
                              Accommodation Options
                            </h6>
                            <div className="space-y-2">
                              {comparison.city2.mcpData.accommodations.slice(0, 3).map((hotel, index) => (
                                <div key={index} className="flex items-center justify-between p-2 bg-white/60 rounded-lg">
                                  <span className="text-sm text-slate-700 font-medium">{hotel.name}</span>
                                  {hotel.priceRange && (
                                    <span className="text-xs bg-purple-100 text-purple-700 px-2 py-1 rounded-full">
                                      {hotel.priceRange}
                                    </span>
                                  )}
                                </div>
                              ))}
                            </div>
                          </div>
                        )}
                      </div>
                    )}

                    {/* Highlights */}
                    <div className="mb-6">
                      <h5 className="font-semibold text-slate-900 mb-3">
                        Key Highlights
                      </h5>
                      <div className="flex flex-wrap gap-2">
                        {comparison.city2.highlights.map((highlight, index) => (
                          <span
                            key={index}
                            className="bg-orange-100 text-orange-800 px-3 py-1 rounded-full text-sm"
                          >
                            {highlight}
                          </span>
                        ))}
                      </div>
                    </div>

                    {/* Quick Stats */}
                    <div className="grid grid-cols-2 gap-4 text-sm">
                      <div className="bg-slate-50 rounded-lg p-3">
                        <div className="flex items-center space-x-2 mb-1">
                          <Plane className="w-4 h-4 text-slate-600" />
                          <span className="font-medium text-slate-900">
                            Transport
                          </span>
                        </div>
                        <p className="text-slate-600">
                          From ${comparison.city2.transportation.public}/day
                        </p>
                      </div>
                      <div className="bg-slate-50 rounded-lg p-3">
                        <div className="flex items-center space-x-2 mb-1">
                          <Hotel className="w-4 h-4 text-slate-600" />
                          <span className="font-medium text-slate-900">
                            Hotels
                          </span>
                        </div>
                        <p className="text-slate-600">
                          From ${comparison.city2.accommodation.budget}/night
                        </p>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Comparative Analysis and Winner Badge Footer */}
                <div className="px-6 py-4 border-t border-slate-200">
                  {/* NEW: Comparative Analysis Display */}
                  <ComparativeAnalysisDisplay
                    analysis={comparison.comparativeAnalysis}
                    city1Name={comparison.city1.name}
                    city2Name={comparison.city2.name}
                  />

                  {/* Winner Badge */}
                  <div className="mt-6 flex items-center justify-center bg-slate-50 rounded-lg p-3">
                    {comparison.city1.estimatedCost <
                    comparison.city2.estimatedCost ? (
                      <div className="flex items-center space-x-2 text-green-600">
                        <Star className="w-5 h-5 fill-current" />
                        <span className="font-semibold">
                          {comparison.city1.name} is more budget-friendly
                        </span>
                      </div>
                    ) : comparison.city2.estimatedCost <
                      comparison.city1.estimatedCost ? (
                      <div className="flex items-center space-x-2 text-green-600">
                        <Star className="w-5 h-5 fill-current" />
                        <span className="font-semibold">
                          {comparison.city2.name} is more budget-friendly
                        </span>
                      </div>
                    ) : (
                      <div className="flex items-center space-x-2 text-orange-600">
                        <GitCompare className="w-5 h-5" />
                        <span className="font-semibold">
                          Both cities have similar costs
                        </span>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Empty State */}
        {comparisons.length === 0 && !isLoading && (
          <div className="text-center py-12">
            <div className="w-16 h-16 bg-orange-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <GitCompare className="w-8 h-8 text-orange-600" />
            </div>
            <h3 className="text-xl font-semibold text-slate-900 mb-2">
              No comparisons yet
            </h3>
            <p className="text-slate-600 mb-6">
              Start by comparing itineraries between two cities to find your
              perfect destination.
            </p>
          </div>
        )}
      </div>
    </div>
  );
};

export default Compare;