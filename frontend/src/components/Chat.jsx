import { useState, useEffect } from "react";
import axios from "axios";
import TravelSummaryCard from "./TravelSummaryCard";
import ExamplePrompts from "./ExamplePrompts";
import EventsCard from "./EventsCard";
import RobustTravelMap from "./RobustTravelMapFixed";
import TravelOptionsDisplay from "./TravelOptionsDisplay";
import AccommodationDisplay from "./AccommodationDisplay";
import travelBookingService from "../services/travelBookingService";
import accommodationService from "../services/accommodationService";
import travelPlanningUtil from "../utils/travelPlanningUtil";

export default function Chat() {
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [currentTravelData, setCurrentTravelData] = useState(null);
  const [mapClosed, setMapClosed] = useState(false);
  const [error, setError] = useState(null);
  const [chatHistory, setChatHistory] = useState([]);
  const [currentChatId, setCurrentChatId] = useState(null);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [showMapCanvas, setShowMapCanvas] = useState(false);
  const [showTransportationModal, setShowTransportationModal] = useState(false);
  const [transportationOptions, setTransportationOptions] = useState(null);
  const [travelSearchLoading, setTravelSearchLoading] = useState(false);
  const [travelOptions, setTravelOptions] = useState(null);
  const [userLocation, setUserLocation] = useState(null);
  const [showAccommodationModal, setShowAccommodationModal] = useState(false);
  const [accommodationOptions, setAccommodationOptions] = useState(null);
  const [accommodationSearchLoading, setAccommodationSearchLoading] = useState(false);

  // Check if user is logged in and fetch history
  useEffect(() => {
    const token = localStorage.getItem('jwtToken'); // Fixed: was 'token', should be 'jwtToken'
    const loggedIn = !!token;
    setIsLoggedIn(loggedIn);
    
    if (loggedIn) {
      fetchChatHistory();
    }
  }, []);

  // API helper functions
  const getAuthHeaders = () => {
    const token = localStorage.getItem('jwtToken'); // Fixed: was 'token', should be 'jwtToken'
    console.log("🔍 getAuthHeaders - Token from localStorage:", token ? `${token.slice(0, 20)}...` : 'null');
    const headers = token ? { Authorization: `Bearer ${token}` } : {};
    console.log("🔍 getAuthHeaders - Generated headers:", headers);
    return headers;
  };

  const fetchChatHistory = async () => {
    if (!isLoggedIn) return;
    
    try {
      const response = await axios.get('http://localhost:5000/api/v1/chat-history', {
        headers: getAuthHeaders()
      });
      
      if (response.data.success) {
        setChatHistory(response.data.data);
      }
    } catch (error) {
      console.error('Error fetching chat history:', error);
    }
  };

  const saveChatToDatabase = async (chatId, userMessage, aiResponse, travelData = null) => {
    if (!isLoggedIn) return;

    try {
      // This happens automatically in the backend now via the /mcp/chat route
      // Just need to pass the chatId in the request
    } catch (error) {
      console.error('Error saving chat:', error);
    }
  };

  // Note: Removed auto-opening map functionality - now manual via button

  // Initialize chat history and create default chat
  useEffect(() => {
    const initializeChat = async () => {
      if (isLoggedIn) {
        await fetchChatHistory();
      }
      
      // Create initial chat if no history exists
      if (chatHistory.length === 0 && !currentChatId) {
        await createNewChat();
      }
    };
    
    initializeChat();
  }, [isLoggedIn]); // Re-run when login status changes

  // Create a new chat session
  const createNewChat = async () => {
    const newChatId = Date.now().toString();
    
    if (isLoggedIn) {
      try {
        const response = await axios.post('http://localhost:5000/api/v1/chat-history/new', {}, {
          headers: getAuthHeaders()
        });
        
        if (response.data.success) {
          const createdChatId = response.data.data.chatId;
          setCurrentChatId(createdChatId);
          setMessages([]);
          setCurrentTravelData(null);
          setMapClosed(false);
          await fetchChatHistory(); // Refresh chat history
          return createdChatId;
        }
      } catch (error) {
        console.error('Error creating new chat:', error);
      }
    }
    
    // Fallback for non-logged-in users
    const newChat = {
      chatId: newChatId,
      _id: newChatId,
      title: "New Chat",
      messages: [],
      timestamp: new Date(),
      preview: "Start a new conversation...",
      lastActivityAt: new Date()
    };
    
    setChatHistory(prev => [newChat, ...prev]);
    setCurrentChatId(newChatId);
    setMessages([]);
    setCurrentTravelData(null);
    setMapClosed(false);
    return newChatId;
  };

  // Load a chat from history
  const loadChatHistory = async (chatId) => {
    if (isLoggedIn) {
      try {
        const response = await axios.get(`http://localhost:5000/api/v1/chat-history/${chatId}`, {
          headers: getAuthHeaders()
        });
        
        if (response.data.success) {
          const chat = response.data.data;
          setCurrentChatId(chatId);
          setMessages(chat.messages);
          // Find travel data from the last AI message if available
          const lastTravelMessage = [...chat.messages].reverse().find(m => m.sender === 'ai' && m.travelData);
          if (lastTravelMessage) {
            setCurrentTravelData(lastTravelMessage.travelData);
          } else {
            setCurrentTravelData(null);
          }
          // Note: No auto-opening of map when loading chat history
          return;
        }
      } catch (error) {
        console.error('Error loading chat:', error);
      }
    }
    
    // Fallback for local history
    const chat = chatHistory.find(c => c.chatId === chatId || c._id === chatId);
    if (chat) {
      setCurrentChatId(chatId);
      setMessages(chat.messages || []);
      const lastTravelMessage = [...(chat.messages || [])].reverse().find(m => m.sender === 'ai' && m.travelData);
      if (lastTravelMessage) {
        setCurrentTravelData(lastTravelMessage.travelData);
      } else {
        setCurrentTravelData(null);
      }
      // Note: No auto-opening of map when switching chat history
    }
  };

  // Update chat title based on first user message
  const updateChatTitle = (chatId, firstMessage) => {
    setChatHistory(prev => 
      prev.map(chat => 
        chat.id === chatId 
          ? { ...chat, title: firstMessage.slice(0, 50) + (firstMessage.length > 50 ? '...' : ''), preview: firstMessage.slice(0, 100) + (firstMessage.length > 100 ? '...' : '') }
          : chat
      )
    );
  };

  // Update chat messages in history
  const updateChatMessages = (chatId, newMessages) => {
    setChatHistory(prev => 
      prev.map(chat => 
        chat.id === chatId 
          ? { ...chat, messages: newMessages, timestamp: new Date() }
          : chat
      )
    );
  };

  // Handle travel planning requests
  const handleTravelPlanningRequest = async (userMessage, currentMessages, chatIdToUse) => {
    try {
      setTravelSearchLoading(true);
      
      // Extract travel details from the message
      const travelDetails = travelPlanningUtil.extractTravelDetails(userMessage);
      console.log("🧳 Extracted travel details:", travelDetails);

      // Get user's current location if not already available
      if (!userLocation) {
        try {
          const location = await travelBookingService.getCurrentLocation();
          setUserLocation(location);
          console.log("📍 User location:", location);
        } catch (locationError) {
          console.warn("Could not get user location:", locationError.message);
          // Continue with fallback location
        }
      }

      // Generate initial response
      const searchResponse = travelPlanningUtil.generateSearchResponse(
        travelDetails, 
        userLocation
      );

      // Add AI response with search message
      const searchMessages = [
        ...currentMessages,
        { 
          sender: "ai", 
          text: searchResponse.message,
          travelSearch: true
        }
      ];
      setMessages(searchMessages);

      // Update chat history
      if (chatIdToUse) {
        updateChatMessages(chatIdToUse, searchMessages);
      }

      // Perform travel search
      const originCity = travelDetails.origin || userLocation?.city || 'Current Location';
      const destinationCity = travelDetails.destination;
      const departureDate = travelDetails.dates[0];
      const returnDate = travelDetails.dates.length > 1 ? travelDetails.dates[1] : null;

      // Get airport codes for flight search
      const [originCode, destinationCode] = await Promise.all([
        travelBookingService.getAirportCode(originCity),
        travelBookingService.getAirportCode(destinationCity)
      ]);

      console.log("🛫 Airport codes:", { 
        origin: originCode, 
        destination: destinationCode 
      });

      // Search all transportation options
      const transportResults = await travelBookingService.searchAllTransportation(
        originCode || originCity,
        destinationCode || destinationCity,
        departureDate,
        returnDate
      );

      console.log("🚗 Transport results:", transportResults);

      // Set travel options for display
      setTravelOptions({
        ...transportResults,
        searchDetails: {
          ...travelDetails,
          originCity,
          destinationCity,
          originCode,
          destinationCode
        }
      });

      // Add results message
      const totalOptions = (transportResults.flights?.length || 0) + 
                          (transportResults.trains?.length || 0) + 
                          (transportResults.buses?.length || 0);

      const resultsMessage = `🎉 Great! I found ${totalOptions} travel options for your trip!\n\n` +
        `✈️ **${transportResults.flights?.length || 0} Flights** - Starting from $${transportResults.flights?.[0]?.price || 'N/A'}\n` +
        `🚆 **${transportResults.trains?.length || 0} Trains** - Starting from $${transportResults.trains?.[0]?.price || 'N/A'}\n` +
        `🚌 **${transportResults.buses?.length || 0} Buses** - Starting from $${transportResults.buses?.[0]?.price || 'N/A'}\n\n` +
        `You can compare prices, schedules, and book directly through the options below. ` +
        `All prices are shown per person and include current availability.`;

      const finalMessages = [
        ...searchMessages,
        { 
          sender: "ai", 
          text: resultsMessage,
          travelOptions: transportResults,
          showTravelResults: true
        }
      ];

      setMessages(finalMessages);

      // Update chat history
      if (chatIdToUse) {
        updateChatMessages(chatIdToUse, finalMessages);
      }

    } catch (error) {
      console.error("🚨 Travel search error:", error);
      
      const errorMessage = "I'm sorry, I encountered an issue while searching for travel options. " +
                          "Please try again or provide more specific details about your destination and dates.";
      
      const errorMessages = [
        ...currentMessages,
        { sender: "ai", text: errorMessage, error: true }
      ];
      
      setMessages(errorMessages);
      
      if (chatIdToUse) {
        updateChatMessages(chatIdToUse, errorMessages);
      }
    } finally {
      setTravelSearchLoading(false);
      setIsLoading(false);
    }
  };

  // Handle booking click (for chat-based travel options)
  const handleBookingClick = (travelOption) => {
    console.log("🎫 Booking clicked:", travelOption);
    
    // In a real implementation, this would redirect to the booking provider
    // For now, we'll show a mock booking interface or redirect to a booking URL
    const bookingMessage = `🎫 **Booking Details**\n\n` +
      `**${travelOption.airlineName || travelOption.operatorName}** ${travelOption.flightNumber || travelOption.trainNumber || travelOption.busNumber}\n` +
      `📅 ${new Date(travelOption.departure.time).toLocaleDateString()}\n` +
      `⏰ ${new Date(travelOption.departure.time).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}\n` +
      `💰 $${travelOption.price} ${travelOption.currency}\n\n` +
      `To complete your booking, you would typically be redirected to the provider's website. ` +
      `This is a demo - in a real application, this would integrate with actual booking APIs.`;

    const bookingMessages = [
      ...messages,
      { 
        sender: "ai", 
        text: bookingMessage,
        bookingInfo: travelOption
      }
    ];

    setMessages(bookingMessages);

    // Update chat history
    if (currentChatId) {
      updateChatMessages(currentChatId, bookingMessages);
    }
  };

  // Handle booking click from transportation modal (doesn't add to chat)
  const handleTransportationBookingClick = (travelOption) => {
    console.log("🎫 Transportation booking clicked:", travelOption);
    
    // Show a browser alert or redirect to booking URL
    const bookingDetails = `${travelOption.airlineName || travelOption.operatorName} - ${travelOption.flightNumber || travelOption.trainNumber || travelOption.busNumber}\n` +
      `${new Date(travelOption.departure.time).toLocaleDateString()} at ${new Date(travelOption.departure.time).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}\n` +
      `Price: $${travelOption.price} ${travelOption.currency}\n\n` +
      `This would redirect to the booking website in a real application.`;
    
    alert(`Booking Details:\n\n${bookingDetails}`);
    
    // In a real app, you might:
    // window.open(travelOption.bookingUrl, '_blank');
    // Or redirect to your own booking flow
  };

  // Handle transportation search for current travel data
  const handleTransportationSearch = async () => {
    if (!currentTravelData?.destination) {
      console.error('No current travel data available');
      return;
    }

    try {
      setTravelSearchLoading(true);
      setTransportationOptions(null);

      console.log('🚀 Searching transportation options for:', currentTravelData.destination);
      console.log('🔍 Current travel data:', currentTravelData);

      // Get user location first
      let userLocation;
      try {
        userLocation = await travelBookingService.getCurrentLocation();
        console.log('📍 User location detected:', userLocation);
      } catch (error) {
        console.log('⚠️ Could not get user location, using default origin');
        userLocation = { city: 'New York', airport: 'JFK' }; // Default origin
      }

      const origin = userLocation.city || userLocation.airport || 'New York';
      const destination = currentTravelData.destination?.city || currentTravelData.city || currentTravelData.destination;
      const departureDate = currentTravelData.startDate || new Date();
      const returnDate = currentTravelData.endDate || null;

      console.log('🔍 Search parameters:', { origin, destination, departureDate, returnDate });

      // Use the existing travel booking service with correct parameters: (origin, destination, departureDate, returnDate)
      const searchResults = await travelBookingService.searchAllTransportation(
        origin,
        destination,
        departureDate,
        returnDate
      );

      console.log('✅ Transportation search completed:', searchResults);
      console.log('📊 Data structure for TravelOptionsDisplay:', {
        flights: searchResults.flights?.length,
        trains: searchResults.trains?.length,
        buses: searchResults.buses?.length,
        sampleFlight: searchResults.flights?.[0],
        sampleTrain: searchResults.trains?.[0],
        sampleBus: searchResults.buses?.[0]
      });

      // Add a simple success message to chat
      const totalOptions = (searchResults.flights?.length || 0) + (searchResults.trains?.length || 0) + (searchResults.buses?.length || 0);
      const transportSuccessMessage = {
        sender: "ai",
        text: `✅ **Transportation Options Found**\n\nI found ${totalOptions} transportation options for your journey! Please check the transportation facilities using the 'Find Transport' button for detailed flight, train, and bus options with prices and booking information.`
      };
      setMessages(prev => [...prev, transportSuccessMessage]);

      setTransportationOptions(searchResults);
      setShowTransportationModal(true);

    } catch (error) {
      console.error('❌ Transportation search failed:', error);
      // You could add an error message to the chat or show a toast notification
      const errorMessage = {
        sender: "ai",
        text: "Sorry, I encountered an error while searching for transportation options. Please try again later."
      };
      setMessages(prev => [...prev, errorMessage]);
    } finally {
      setTravelSearchLoading(false);
    }
  };

  // Handle accommodation search for current travel data
  const handleAccommodationSearch = async () => {
    if (!currentTravelData?.destination) {
      console.error('No current travel data available for accommodation search');
      return;
    }

    try {
      setAccommodationSearchLoading(true);
      setAccommodationOptions(null);

      console.log('🏨 Searching accommodation options for:', currentTravelData.destination);

      // Calculate check-in and check-out dates
      const checkInDate = currentTravelData.startDate || new Date();
      const checkOutDate = currentTravelData.endDate || new Date(Date.now() + 3 * 24 * 60 * 60 * 1000); // Default to 3 days later
      const guests = currentTravelData.passengers || 2;

      // Use the accommodation service
      const searchResults = await accommodationService.searchAccommodations(
        currentTravelData.destination?.city || currentTravelData.city || currentTravelData.destination,
        checkInDate,
        checkOutDate,
        guests
      );

      console.log('✅ Accommodation search completed:', searchResults);

      // Add a success message to chat
      const totalAccommodations = (searchResults.hotels?.length || 0) + (searchResults.hostels?.length || 0) + (searchResults.apartments?.length || 0);
      const accommodationSuccessMessage = {
        sender: "ai",
        text: `🏨 **Accommodation Options Found**\n\nI found ${totalAccommodations} accommodation options in ${currentTravelData.destination?.city || currentTravelData.city}! Check out hotels, hostels, and apartments with detailed information and booking options using the 'Accommodations' button.`
      };
      setMessages(prev => [...prev, accommodationSuccessMessage]);

      setAccommodationOptions(searchResults);
      setShowAccommodationModal(true);

    } catch (error) {
      console.error('❌ Accommodation search failed:', error);
      const errorMessage = {
        sender: "ai",
        text: "Sorry, I encountered an error while searching for accommodations. Please try again later."
      };
      setMessages(prev => [...prev, errorMessage]);
    } finally {
      setAccommodationSearchLoading(false);
    }
  };

  // Handle accommodation booking click (doesn't add to chat)
  const handleAccommodationBookingClick = (accommodation) => {
    console.log("🏨 Accommodation booking clicked:", accommodation);
    
    const bookingDetails = `${accommodation.name}\n` +
      `${accommodation.address}\n` +
      `Check-in: ${new Date(accommodation.checkIn).toLocaleDateString()}\n` +
      `Check-out: ${new Date(accommodation.checkOut).toLocaleDateString()}\n` +
      `Price: $${accommodation.price.perNight}/night (Total: $${accommodation.price.total})\n` +
      `Rating: ${accommodation.rating}⭐ (${accommodation.reviewCount} reviews)\n\n` +
      `This would redirect to the booking website in a real application.`;
    
    alert(`Accommodation Booking:\n\n${bookingDetails}`);
  };

  const sendMessage = async () => {
    if (!input.trim()) return;

    const userMessage = input;
    setInput("");
    setIsLoading(true);

    // Ensure we have a chat ID - create new chat if needed
    let chatIdToUse = currentChatId;
    if (!chatIdToUse && messages.length === 0) {
      chatIdToUse = await createNewChat();
    }
    
    // Add user message immediately
    const newMessages = [...messages, { sender: "user", text: userMessage }];
    setMessages(newMessages);

    try {
      setError(null);
      
      // Prepare request with optional auth headers and chatId
      const requestConfig = {
        headers: getAuthHeaders()
      };
      
      const requestData = {
        message: userMessage,
        chatId: chatIdToUse || currentChatId // Use the guaranteed chat ID
      };
      
      console.log("🔍 Sending request with:", {
        hasAuthHeaders: !!requestConfig.headers.Authorization,
        chatId: currentChatId,
        isLoggedIn
      });
      
      const res = await axios.post("http://localhost:5000/api/v1/mcp/chat", requestData, requestConfig);

      console.log("Server response:", res.data); // Debug log

      // Add AI response
      const updatedMessages = [
        ...newMessages,
        { 
          sender: "ai", 
          text: res.data.response || "I received your message but couldn't generate a response.",
          travelData: res.data.travelData || null // Include travel data if available
        },
      ];
      
      setMessages(updatedMessages);

      // Update chat history
      if (currentChatId) {
        // Update chat title if this is the first user message
        if (newMessages.length === 1) {
          updateChatTitle(currentChatId, userMessage);
        }
        updateChatMessages(currentChatId, updatedMessages);
      }

      // Update map data if this is a travel response (no auto-open)
      if (res.data.travelData) {
        console.log("Setting travel data:", res.data.travelData); // Debug log
        setCurrentTravelData(res.data.travelData);
        // Note: Map no longer auto-opens, user must click button
      }
    } catch (err) {
      console.error("Chat error:", err);
      setError(err.message);
      const errorMessages = [
        ...newMessages,
        { sender: "ai", text: "Sorry, I encountered an error. Please try again." },
      ];
      setMessages(errorMessages);
      
      // Update chat history with error message too
      if (currentChatId) {
        updateChatMessages(currentChatId, errorMessages);
      }
    }

    setIsLoading(false);
  };

  const handleKeyDown = (e) => {
    if (e.key === "Enter" && !isLoading) sendMessage();
  };

  const handlePromptClick = (prompt) => {
    if (isLoading) return;
    setInput(prompt);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-orange-50 via-white to-orange-100">
      <div className="flex h-screen w-full transition-all duration-500 ease-in-out overflow-hidden bg-white">
        
        {/* Chat History Sidebar */}
        <div className={`${sidebarCollapsed ? 'w-16' : 'w-80'} bg-gradient-to-b from-gray-50 to-gray-100 border-r border-gray-200 flex flex-col transition-all duration-300`}>
          {/* Sidebar Header */}
          <div className="bg-gradient-to-r from-gray-700 to-gray-800 text-white p-4 flex items-center justify-between">
            <h3 className={`font-bold ${sidebarCollapsed ? 'hidden' : 'block'}`}>Chat History</h3>
            <button
              onClick={() => setSidebarCollapsed(!sidebarCollapsed)}
              className="text-white hover:text-gray-200 transition-colors p-1 rounded"
            >
              <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5">
                <path strokeLinecap="round" strokeLinejoin="round" d={sidebarCollapsed ? "M3.75 6.75h16.5M3.75 12h16.5m-16.5 5.25h16.5" : "M6 18L18 6M6 6l12 12"} />
              </svg>
            </button>
          </div>

          {/* New Chat Button */}
          {!sidebarCollapsed && (
            <div className="p-4 border-b border-gray-200">
              <button
                onClick={createNewChat}
                className="w-full bg-gradient-to-r from-orange-500 to-orange-600 text-white px-4 py-3 rounded-lg hover:from-orange-600 hover:to-orange-700 transition-all duration-300 flex items-center space-x-2 shadow-md hover:shadow-lg"
              >
                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
                </svg>
                <span className="font-medium">New Chat</span>
              </button>
            </div>
          )}

          {/* Chat History List */}
          <div className="flex-1 overflow-y-auto">
            {!sidebarCollapsed && chatHistory.map((chat) => {
              const chatId = chat.chatId || chat._id;
              const timestamp = new Date(chat.lastActivityAt || chat.timestamp || chat.createdAt);
              
              return (
                <div
                  key={chatId}
                  onClick={() => loadChatHistory(chatId)}
                  className={`p-4 border-b border-gray-200 cursor-pointer hover:bg-gray-50 transition-colors ${currentChatId === chatId ? 'bg-orange-50 border-l-4 border-l-orange-500' : ''}`}
                >
                  <div className="flex items-start justify-between">
                    <div className="flex-1 min-w-0">
                      <h4 className="font-medium text-gray-900 truncate text-sm">{chat.title}</h4>
                      <p className="text-xs text-gray-500 mt-1 line-clamp-2">{chat.preview}</p>
                      <p className="text-xs text-gray-400 mt-2">
                        {timestamp.toLocaleDateString()} {timestamp.toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}
                      </p>
                    </div>
                  </div>
                </div>
              );
            })}
            
            {!sidebarCollapsed && chatHistory.length === 0 && (
              <div className="p-6 text-center text-gray-500">
                <div className="text-4xl mb-2">💬</div>
                <p className="text-sm">No chat history yet</p>
                <p className="text-xs mt-1">Start a conversation to see your history</p>
              </div>
            )}
          </div>
        </div>

        {/* Main Chat Area */}
        <div className={`flex flex-col transition-all duration-500 ease-in-out ${
          sidebarCollapsed ? 'w-[calc(100%-4rem)]' : 'w-[calc(100%-20rem)]'
        }`}>
          {/* Chat Header */}
          <div className="bg-gradient-to-r from-orange-400 to-orange-600 text-white p-6 shadow-lg">
            <div className="flex items-center space-x-4">
              <div className="w-12 h-12 bg-white bg-opacity-20 rounded-2xl flex items-center justify-center backdrop-blur-sm shadow-lg">
                <span className="text-xl">✈️</span>
              </div>
              <div>
                <h2 className="text-xl font-bold">AI Travel Planner</h2>
                <p className="text-sm text-orange-100 font-medium">Smart weather-powered trip planning</p>
              </div>
            </div>
          </div>

          {/* Messages Area */}
          <div className="flex-1 overflow-y-auto p-6 space-y-6 bg-gradient-to-b from-orange-50/30 to-white">
            {messages.length === 0 && (
              <div className="text-center py-12">
                <div className="text-7xl mb-6 animate-bounce">✈️</div>
                <h3 className="text-2xl font-bold text-gray-800 mb-3">Ready for your next adventure?</h3>
                <p className="text-gray-600 mb-8 text-lg">Ask me to plan a trip, check weather, or suggest activities for any city!</p>
                <div className="bg-white rounded-2xl p-6 shadow-lg border border-orange-100">
                  <ExamplePrompts onPromptClick={handlePromptClick} />
                </div>
              </div>
            )}
          
          {messages.map((m, i) => (
            <div
              key={i}
              className={`flex ${m.sender === "user" ? "justify-end" : "justify-start"}`}
            >
              <div className={`max-w-[85%] ${m.sender === "user" ? "order-2" : "order-1"}`}>
                {m.sender === "user" ? (
                  <div className="bg-gradient-to-r from-orange-400 to-orange-500 text-white rounded-2xl rounded-tr-lg px-6 py-4 shadow-lg hover:shadow-xl transition-all duration-300">
                    <p className="font-medium">{m.text}</p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {(() => {
                      try {
                        console.log(`Rendering message ${i}:`, m);
                        return (
                          <>
                            <TravelSummaryCard response={m.text} travelData={m.travelData} showMapButton={false} />
                            
                            {/* Travel Options Display */}
                            {m.showTravelResults && m.travelOptions && (
                              <TravelOptionsDisplay 
                                travelData={m.travelOptions}
                                loading={false}
                                origin={m.travelOptions.searchDetails?.originCity || 'Your Location'}
                                destination={m.travelOptions.searchDetails?.destinationCity || 'Destination'}
                                onBookingClick={handleBookingClick}
                              />
                            )}
                            
                            {m.travelData && m.travelData.events && Array.isArray(m.travelData.events.upcoming) && m.travelData.events.upcoming.length > 0 && (
                              <EventsCard 
                                events={m.travelData.events.upcoming} 
                                city={m.travelData.destination?.city || m.travelData.city || 'Unknown'}
                                travelPeriod={m.travelData.tripDuration ? `${m.travelData.tripDuration.startDate} to ${m.travelData.tripDuration.endDate}` : 'Travel Period'}
                              />
                            )}
                          </>
                        );
                      } catch (error) {
                        console.error(`Error rendering AI message ${i}:`, error);
                        console.error('Message data:', m);
                        return (
                          <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded">
                            <p className="font-bold">Error rendering message</p>
                            <p className="text-sm">{error.message}</p>
                            <p className="text-sm mt-2">Raw response: {m.text}</p>
                          </div>
                        );
                      }
                    })()}
                  </div>
                )}
              </div>
            </div>
          ))}
          
            {/* Loading Indicator */}
            {(isLoading || travelSearchLoading) && (
              <div className="flex justify-start">
                <div className="max-w-[85%]">
                  <div className="bg-white rounded-2xl px-6 py-4 shadow-xl border border-orange-200 backdrop-blur-sm">
                    <div className="flex items-center space-x-3">
                      <div className="flex space-x-1">
                        <div className="w-3 h-3 bg-orange-500 rounded-full animate-bounce"></div>
                        <div className="w-3 h-3 bg-orange-500 rounded-full animate-bounce" style={{animationDelay: '0.1s'}}></div>
                        <div className="w-3 h-3 bg-orange-500 rounded-full animate-bounce" style={{animationDelay: '0.2s'}}></div>
                      </div>
                      <span className="text-gray-700 font-medium">
                        {travelSearchLoading ? '🧳 Searching flights, trains & buses...' : 'Planning your perfect trip...'}
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            )}
            
            {/* Standalone Travel Options Display */}
            {travelOptions && !messages.some(m => m.showTravelResults) && (
              <div className="mt-6">
                <TravelOptionsDisplay 
                  travelData={travelOptions}
                  loading={travelSearchLoading}
                  origin={travelOptions.searchDetails?.originCity || 'Your Location'}
                  destination={travelOptions.searchDetails?.destinationCity || 'Destination'}
                  onBookingClick={handleBookingClick}
                />
              </div>
            )}
        </div>

          {/* Input Area */}
          <div className="border-t border-orange-200 p-6 bg-gradient-to-r from-white to-orange-50 rounded-bl-2xl">
            <div className="flex space-x-4">
              <input
                className="flex-1 border-2 border-orange-200 rounded-2xl px-6 py-4 focus:outline-none focus:ring-2 focus:ring-orange-400 focus:border-orange-400 transition-all duration-300 bg-white shadow-sm text-gray-800 placeholder-gray-500 font-medium"
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder="Ask me to plan a trip, check weather, or find activities..."
                disabled={isLoading}
              />
              <button
                className={`px-8 py-4 rounded-2xl font-bold transition-all duration-300 ${
                  isLoading 
                    ? 'bg-gray-300 text-gray-500 cursor-not-allowed shadow-sm' 
                    : 'bg-gradient-to-r from-orange-400 to-orange-600 hover:from-orange-500 hover:to-orange-700 text-white shadow-lg hover:shadow-xl transform hover:-translate-y-1 hover:scale-105'
                }`}
                onClick={sendMessage}
                disabled={isLoading || !input.trim()}
              >
                {isLoading ? (
                  <div className="w-6 h-6 border-2 border-gray-400 border-t-transparent rounded-full animate-spin"></div>
                ) : (
                  <span className="flex items-center space-x-2">
                    <span>✈️</span>
                    <span>Send</span>
                  </span>
                )}
              </button>
              
              {/* Action Buttons for Travel Data */}
              {currentTravelData && (
                <div className="flex space-x-3 ml-3">
                  {/* View Map Button */}
                  <button
                    onClick={() => {
                      console.log('Opening map canvas...');
                      setShowMapCanvas(true);
                    }}
                    className="px-6 py-4 rounded-2xl font-bold bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 text-white shadow-lg hover:shadow-xl transition-all duration-300 transform hover:-translate-y-1 hover:scale-105 flex items-center space-x-2"
                  >
                    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-5 h-5">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M9 6.75V15m6-6v8.25m.503 3.498l4.875-2.437c.381-.19.622-.58.622-1.006V4.82c0-.836-.88-1.38-1.628-1.006l-3.869 1.934c-.317.159-.69.159-1.006 0L9.503 3.252a1.125 1.125 0 00-1.006 0L3.622 5.689C3.24 5.88 3 6.27 3 6.695V19.18c0 .836.88 1.38 1.628 1.006l3.869-1.934c-.317-.159-.69-.159-1.006 0l4.994 2.497c.317.158.69.158 1.006 0z" />
                    </svg>
                    <span>View Map</span>
                  </button>

                  {/* Transportation Options Button */}
                  <button
                    onClick={() => {
                      console.log('Opening transportation options...');
                      handleTransportationSearch();
                    }}
                    className="px-6 py-4 rounded-2xl font-bold bg-gradient-to-r from-green-500 to-green-600 hover:from-green-600 hover:to-green-700 text-white shadow-lg hover:shadow-xl transition-all duration-300 transform hover:-translate-y-1 hover:scale-105 flex items-center space-x-2"
                    disabled={travelSearchLoading}
                  >
                    {travelSearchLoading ? (
                      <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                    ) : (
                      <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-5 h-5">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M6 12L3.269 3.126A59.768 59.768 0 0121.485 12 59.77 59.77 0 013.27 20.876L5.999 12zm0 0h7.5" />
                      </svg>
                    )}
                    <span>{travelSearchLoading ? 'Searching...' : 'Find Transport'}</span>
                  </button>

                  {/* Accommodations Button */}
                  <button
                    onClick={() => {
                      console.log('Opening accommodation options...');
                      handleAccommodationSearch();
                    }}
                    className="px-6 py-4 rounded-2xl font-bold bg-gradient-to-r from-purple-500 to-purple-600 hover:from-purple-600 hover:to-purple-700 text-white shadow-lg hover:shadow-xl transition-all duration-300 transform hover:-translate-y-1 hover:scale-105 flex items-center space-x-2"
                    disabled={accommodationSearchLoading}
                  >
                    {accommodationSearchLoading ? (
                      <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                    ) : (
                      <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-5 h-5">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M8.25 21v-4.875c0-.621.504-1.125 1.125-1.125h2.25c.621 0 1.125.504 1.125 1.125V21m0 0h4.5V3.545M12.75 21h7.5V10.75M2.25 21h1.5m18 0h-18M2.25 9l4.5-1.636M18.75 3l-1.5.545m0 6.905l3 1m-3-1.5v2.25A2.25 2.25 0 0015 13.5h-1.875a1.125 1.125 0 01-1.125-1.125V9.75c0-.621.504-1.125 1.125-1.125h1.875A2.25 2.25 0 0117.25 10.5V12" />
                      </svg>
                    )}
                    <span>{accommodationSearchLoading ? 'Searching...' : 'Accommodations'}</span>
                  </button>
                </div>
              )}
            </div>
          </div>
      </div>

        {/* Map Canvas Modal */}
        {showMapCanvas && currentTravelData && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-gradient-to-br from-orange-100/30 via-blue-100/20 to-purple-100/30 backdrop-blur-md p-8">
            {/* Animated background elements */}
            <div className="absolute inset-0 overflow-hidden">
              <div className="absolute top-20 left-20 w-32 h-32 bg-orange-400/10 rounded-full blur-xl animate-pulse"></div>
              <div className="absolute top-40 right-32 w-40 h-40 bg-blue-400/10 rounded-full blur-xl animate-pulse delay-1000"></div>
              <div className="absolute bottom-32 left-32 w-28 h-28 bg-purple-400/10 rounded-full blur-xl animate-pulse delay-2000"></div>
              <div className="absolute bottom-20 right-20 w-36 h-36 bg-green-400/10 rounded-full blur-xl animate-pulse delay-3000"></div>
            </div>
            
            <div className="relative bg-white rounded-3xl shadow-2xl border border-slate-200/50 max-w-6xl w-full max-h-[85vh] flex flex-col overflow-hidden">
              {/* Professional Header */}
              <div className="relative bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 text-white">
                {/* Subtle background pattern */}
                <div className="absolute inset-0 opacity-5">
                  <svg width="100%" height="100%" viewBox="0 0 100 100">
                    <defs>
                      <pattern id="grid" width="10" height="10" patternUnits="userSpaceOnUse">
                        <path d="M 10 0 L 0 0 0 10" fill="none" stroke="white" strokeWidth="0.5"/>
                      </pattern>
                    </defs>
                    <rect width="100%" height="100%" fill="url(#grid)"/>
                  </svg>
                </div>
                
                <div className="relative p-6 flex items-center justify-between">
                  <div className="flex items-center space-x-4">
                    {/* Enhanced Icon */}
                    <div className="relative">
                      <div className="w-14 h-14 bg-gradient-to-br from-orange-400 via-orange-500 to-orange-600 rounded-2xl flex items-center justify-center shadow-xl">
                        <span className="text-2xl filter drop-shadow-sm">🗺️</span>
                      </div>
                      <div className="absolute -bottom-1 -right-1 w-6 h-6 bg-green-500 rounded-full flex items-center justify-center border-2 border-white">
                        <span className="text-xs">�</span>
                      </div>
                    </div>
                    
                    {/* Title Section */}
                    <div>
                      <h2 className="text-2xl font-bold mb-1 bg-gradient-to-r from-white to-slate-200 bg-clip-text text-transparent">
                        {currentTravelData.destination?.city || currentTravelData.city || 'Travel Destination'}
                      </h2>
                      <div className="flex items-center space-x-4">
                        <div className="flex items-center space-x-2">
                          <div className="w-2 h-2 bg-orange-400 rounded-full animate-pulse"></div>
                          <span className="text-slate-300 text-sm font-medium">Live Interactive Map</span>
                        </div>
                        <div className="px-3 py-1 bg-slate-700/50 rounded-full text-xs text-slate-300 border border-slate-600/50">
                          {(currentTravelData.attractions?.featured || []).length} Locations
                        </div>
                      </div>
                    </div>
                  </div>
                  
                  {/* Enhanced Close Button */}
                  <button
                    onClick={() => {
                      console.log('Closing map canvas...');
                      setShowMapCanvas(false);
                    }}
                    className="group relative bg-slate-700/30 hover:bg-slate-600/40 backdrop-blur-sm text-slate-200 hover:text-white rounded-xl p-3 transition-all duration-300 border border-slate-600/30 hover:border-slate-500/50 hover:shadow-lg"
                    title="Close map explorer"
                  >
                    <svg className="w-5 h-5 group-hover:rotate-90 transition-transform duration-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>
                </div>
                
                {/* Subtle bottom border */}
                <div className="absolute bottom-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-slate-600/50 to-transparent"></div>
              </div>

              {/* Enhanced Map Content Area */}
              <div className="flex-1 bg-gradient-to-br from-slate-50 to-slate-100/50 overflow-auto">
                {currentTravelData.destination?.coordinates ? (
                  <div className="p-6 pb-8">
                    <div className="bg-white rounded-2xl shadow-xl border border-slate-200/60 overflow-hidden">
                      <RobustTravelMap 
                        city={currentTravelData.destination?.city || currentTravelData.city}
                        locations={currentTravelData.attractions?.featured || []}
                        coordinates={currentTravelData.destination?.coordinates}
                      />
                    </div>
                  </div>
                ) : (
                  <div className="p-6 pb-8">
                    <div className="bg-white rounded-2xl shadow-xl border border-slate-200/60 h-96 flex items-center justify-center">
                      <div className="text-center">
                        <div className="w-16 h-16 bg-gradient-to-br from-slate-100 to-slate-200 rounded-2xl flex items-center justify-center mb-4 mx-auto">
                          <span className="text-3xl animate-pulse">🗺️</span>
                        </div>
                        <h3 className="text-xl font-bold text-slate-800 mb-2">Map Initializing</h3>
                        <p className="text-slate-600 font-medium">Loading coordinate data...</p>
                        <div className="mt-4 flex items-center justify-center space-x-1">
                          <div className="w-2 h-2 bg-orange-400 rounded-full animate-bounce"></div>
                          <div className="w-2 h-2 bg-orange-400 rounded-full animate-bounce delay-100"></div>
                          <div className="w-2 h-2 bg-orange-400 rounded-full animate-bounce delay-200"></div>
                        </div>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {/* Transportation Options Modal */}
        {showTransportationModal && transportationOptions && (
          <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-3xl shadow-2xl max-w-7xl w-full max-h-[90vh] overflow-hidden">
              {/* Modal Header */}
              <div className="relative bg-gradient-to-r from-green-500 to-green-600 px-6 py-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-3">
                    <div className="w-10 h-10 bg-white/20 rounded-xl flex items-center justify-center">
                      <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-6 h-6 text-white">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M6 12L3.269 3.126A59.768 59.768 0 0121.485 12 59.77 59.77 0 013.27 20.876L5.999 12zm0 0h7.5" />
                      </svg>
                    </div>
                    <div>
                      <h2 className="text-2xl font-bold text-white">Transportation Options</h2>
                      <p className="text-green-100/90 font-medium">
                        Travel to {currentTravelData.destination?.city || currentTravelData.city}
                      </p>
                    </div>
                  </div>
                  <button
                    onClick={() => setShowTransportationModal(false)}
                    className="group w-10 h-10 bg-white/20 hover:bg-white/30 rounded-xl flex items-center justify-center transition-all duration-200"
                    title="Close transportation options"
                  >
                    <svg className="w-5 h-5 group-hover:rotate-90 transition-transform duration-300 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>
                </div>
              </div>

              {/* Modal Content */}
              <div className="flex-1 bg-gradient-to-br from-slate-50 to-slate-100/50 overflow-auto max-h-[80vh]">
                <div className="p-6">
                  <TravelOptionsDisplay
                    travelData={transportationOptions}
                    onBookingClick={handleTransportationBookingClick}
                    loading={false}
                  />
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Accommodation Options Modal */}
        {showAccommodationModal && accommodationOptions && (
          <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-3xl shadow-2xl max-w-7xl w-full max-h-[90vh] overflow-hidden">
              {/* Modal Header */}
              <div className="relative bg-gradient-to-r from-purple-500 to-purple-600 px-6 py-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-3">
                    <div className="w-10 h-10 bg-white/20 rounded-xl flex items-center justify-center">
                      <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-6 h-6 text-white">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M8.25 21v-4.875c0-.621.504-1.125 1.125-1.125h2.25c.621 0 1.125.504 1.125 1.125V21m0 0h4.5V3.545M12.75 21h7.5V10.75M2.25 21h1.5m18 0h-18M2.25 9l4.5-1.636M18.75 3l-1.5.545m0 6.905l3 1m-3-1.5v2.25A2.25 2.25 0 0015 13.5h-1.875a1.125 1.125 0 01-1.125-1.125V9.75c0-.621.504-1.125 1.125-1.125h1.875A2.25 2.25 0 0117.25 10.5V12" />
                      </svg>
                    </div>
                    <div>
                      <h2 className="text-2xl font-bold text-white">Accommodation Options</h2>
                      <p className="text-purple-100/90 font-medium">
                        Stay in {currentTravelData.destination?.city || currentTravelData.city}
                      </p>
                    </div>
                  </div>
                  <button
                    onClick={() => setShowAccommodationModal(false)}
                    className="group w-10 h-10 bg-white/20 hover:bg-white/30 rounded-xl flex items-center justify-center transition-all duration-200"
                    title="Close accommodation options"
                  >
                    <svg className="w-5 h-5 group-hover:rotate-90 transition-transform duration-300 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>
                </div>
              </div>

              {/* Modal Content */}
              <div className="flex-1 bg-gradient-to-br from-slate-50 to-slate-100/50 overflow-auto max-h-[80vh]">
                <div className="p-6">
                  <AccommodationDisplay
                    accommodationData={accommodationOptions}
                    onBookingClick={handleAccommodationBookingClick}
                    loading={false}
                    destination={currentTravelData.destination?.city || currentTravelData.city}
                  />
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}