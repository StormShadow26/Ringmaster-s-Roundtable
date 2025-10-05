import { useState } from "react";
import axios from "axios";
import TravelSummaryCard from "./TravelSummaryCard";
import ExamplePrompts from "./ExamplePrompts";
import EventsCard from "./EventsCard";
import RobustTravelMap from "./RobustTravelMap";
import BudgetCard from "./BudgetCard";
import BudgetDailyCard from "./BudgetDailyCard";

export default function Chat() {
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [currentTravelData, setCurrentTravelData] = useState(null);
  const [error, setError] = useState(null);

  const sendMessage = async () => {
    if (!input.trim()) return;

    const userMessage = input;
    setInput("");
    setIsLoading(true);
    
    // Add user message immediately
    setMessages((prev) => [...prev, { sender: "user", text: userMessage }]);

    try {
      setError(null);
      const res = await axios.post("http://localhost:5000/api/v1/mcp/chat", {
        message: userMessage,
      });
      

      console.log("Server response:", res.data); // Debug log

      // Normalize travel data: prefer travelData, otherwise build from budget payload
      const normalizedTravelData = res.data.travelData || (res.data.budget ? {
        destination: res.data.budget.destination ? { city: res.data.budget.destination } : undefined,
        budget: res.data.budget,
        budgetSummary: res.data.rawSummary
      } : null);

      if (normalizedTravelData?.budget) {
        console.log("Budget present in response:", normalizedTravelData.budget);
      }

      // Add AI response
      setMessages((prev) => [
        ...prev,
        { 
          sender: "ai", 
          text: res.data.response || "I received your message but couldn't generate a response.",
          travelData: normalizedTravelData || null // Include travel data if available
        },
      ]);

      // Update map data if this is a travel response
      if (normalizedTravelData) {
        
        console.log("Setting travel data:", normalizedTravelData); // Debug log
        setCurrentTravelData(normalizedTravelData);
      }
    } catch (err) {
      console.error("Chat error:", err);
      setError(err.message);
      setMessages((prev) => [
        ...prev,
        { sender: "ai", text: "Sorry, I encountered an error. Please try again." },
      ]);
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
    <div className="flex h-[85vh] max-w-7xl mx-auto border border-gray-200 rounded-xl shadow-lg bg-white overflow-hidden">
      {/* Left Side - Chat */}
      <div className={`flex flex-col transition-all duration-300 ${currentTravelData ? 'w-1/2' : 'w-full'}`}>
        {/* Chat Header */}
        <div className="bg-gradient-to-r from-blue-500 to-purple-600 text-white p-4 rounded-tl-xl">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 bg-white bg-opacity-20 rounded-full flex items-center justify-center">
              <span className="text-lg">🤖</span>
            </div>
            <div>
              <h2 className="text-lg font-semibold">AI Travel Assistant</h2>
              <p className="text-sm text-blue-100">Weather-powered trip planning</p>
            </div>
          </div>
        </div>

        {/* Messages Area */}
        <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-gray-50">
          {messages.length === 0 && (
            <div className="text-center py-4">
              <div className="text-6xl mb-4">✈️</div>
              <h3 className="text-xl font-semibold text-gray-600 mb-2">Ready for your next adventure?</h3>
              <p className="text-gray-500 mb-6">Ask me to plan a trip, check weather, or suggest activities for any city!</p>
              <ExamplePrompts onPromptClick={handlePromptClick} />
            </div>
          )}
          
          {messages.map((m, i) => (
            <div
              key={i}
              className={`flex ${m.sender === "user" ? "justify-end" : "justify-start"}`}
            >
              <div className={`max-w-[85%] ${m.sender === "user" ? "order-2" : "order-1"}`}>
                {m.sender === "user" ? (
                  <div className="bg-blue-500 text-white rounded-2xl rounded-tr-sm px-4 py-3 shadow-md">
                    <p className="text-sm">{m.text}</p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {(() => {
                      try {
                        console.log(`Rendering message ${i}:`, m);
                        return (
                          <>
                            <TravelSummaryCard response={m.text} travelData={m.travelData} showMapButton={false} />
                            {m.travelData && m.travelData.budget && (
                              <BudgetCard budget={m.travelData.budget} summary={m.travelData.budgetSummary} />
                            )}
                            {m.travelData && m.travelData.budget && (
                              <BudgetDailyCard budget={m.travelData.budget} />
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
          {isLoading && (
            <div className="flex justify-start">
              <div className="max-w-[85%]">
                <div className="bg-white rounded-xl px-4 py-3 shadow-md border border-gray-200">
                  <div className="flex items-center space-x-2">
                    <div className="flex space-x-1">
                      <div className="w-2 h-2 bg-blue-500 rounded-full animate-bounce"></div>
                      <div className="w-2 h-2 bg-blue-500 rounded-full animate-bounce" style={{animationDelay: '0.1s'}}></div>
                      <div className="w-2 h-2 bg-blue-500 rounded-full animate-bounce" style={{animationDelay: '0.2s'}}></div>
                    </div>
                    <span className="text-sm text-gray-500">Planning your perfect trip...</span>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Input Area */}
        <div className="border-t border-gray-200 p-4 bg-white rounded-bl-xl">
          <div className="flex space-x-3">
            <input
              className="flex-1 border border-gray-300 rounded-full px-4 py-3 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="Ask me to plan a trip, check weather, or find activities..."
              disabled={isLoading}
            />
            <button
              className={`px-6 py-3 rounded-full font-medium transition-all ${
                isLoading 
                  ? 'bg-gray-300 text-gray-500 cursor-not-allowed' 
                  : 'bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700 text-white shadow-lg hover:shadow-xl transform hover:-translate-y-0.5'
              }`}
              onClick={sendMessage}
              disabled={isLoading || !input.trim()}
            >
              {isLoading ? (
                <div className="w-5 h-5 border-2 border-gray-400 border-t-transparent rounded-full animate-spin"></div>
              ) : (
                <span>✈️ Send</span>
              )}
            </button>
          </div>
        </div>
      </div>

      {/* Right Side - Map (appears when travel data is available) */}
      {currentTravelData && (
        <div className="w-1/2 border-l border-gray-200 flex flex-col bg-gray-50">
          {/* Map Header */}
          <div className="bg-gradient-to-r from-emerald-500 to-teal-600 text-white p-4 rounded-tr-xl">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <div className="w-10 h-10 bg-white bg-opacity-20 rounded-full flex items-center justify-center">
                  <span className="text-lg">🗺️</span>
                </div>
                <div>
                  <h3 className="text-lg font-semibold">{currentTravelData.destination?.city || currentTravelData.city || 'Travel Map'}</h3>
                  <p className="text-sm text-emerald-100">Interactive location map</p>
                </div>
              </div>
              <button
                onClick={() => setCurrentTravelData(null)}
                className="text-white hover:text-emerald-200 transition-colors p-1"
                title="Close map"
              >
                ✕
              </button>
            </div>
          </div>

          {/* Map Area */}
          <div className="flex-1 p-4 overflow-y-auto">

            

            

            
            {currentTravelData.destination?.coordinates ? (
              <RobustTravelMap 
                city={currentTravelData.destination?.city || currentTravelData.city}
                locations={currentTravelData.attractions?.featured || []}
                coordinates={currentTravelData.destination?.coordinates}
              />
            ) : (
              <div className="h-full flex items-center justify-center bg-white rounded-lg border-2 border-dashed border-gray-300">
                <div className="text-center text-gray-500">
                  <div className="text-4xl mb-3">🗺️</div>
                  <p className="text-lg font-medium">Map Loading</p>
                  <p className="text-sm">Coordinate data not available</p>
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}