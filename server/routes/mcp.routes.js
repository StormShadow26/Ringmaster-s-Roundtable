import express from "express";
import jwt from "jsonwebtoken";
import { callGeminiAPI } from "../helpers/gemini.js";
import { server as mcpServer } from "../mcp/mcpServer.js";
import { authenticateToken } from "../middlewares/auth.middleware.js";
import ChatHistory from "../models/chatHistory.model.js";

const router = express.Router();

// Optional authentication middleware - checks for auth but doesn't require it
const optionalAuth = (req, res, next) => {
  const authHeader = req.headers.authorization;
  if (authHeader && authHeader.startsWith('Bearer ')) {
    const token = authHeader.split(' ')[1];
    try {
      const JWT_SECRET = process.env.JWT_SECRET || 'your_jwt_secret';
      const decoded = jwt.verify(token, JWT_SECRET);
      req.user = decoded;
      console.log("✅ User authenticated:", decoded.id);
    } catch (error) {
      console.log("⚠️ Auth failed, continuing without user:", error.message);
      req.user = null;
    }
  } else {
    console.log("⚠️ No auth token provided");
    req.user = null;
  }
  next();
};

// Helper function to save chat messages to database
const saveChatMessages = async (userId, chatId, userMessage, aiResponse, travelData = null) => {
  console.log("🔍 saveChatMessages called with:", { userId, chatId, hasUserMessage: !!userMessage, hasAiResponse: !!aiResponse });
  
  if (!userId || !chatId) {
    console.log("⚠️ Skipping database save - no user or chat ID", { userId: !!userId, chatId: !!chatId });
    return;
  }

  try {
    console.log("🔍 Looking for existing chat:", { userId, chatId });
    // Find or create chat
    let chat = await ChatHistory.findOne({ userId, chatId, isActive: true });
    
    if (!chat) {
      console.log("🆕 Creating new chat");
      chat = await ChatHistory.createNewChat(userId, chatId);
      console.log("✅ New chat created:", chat._id);
    } else {
      console.log("📄 Found existing chat:", chat._id);
    }
    
    // Add user message
    console.log("💬 Adding user message");
    await chat.addMessage('user', userMessage);
    console.log("✅ User message added");
    
    // Add AI response
    console.log("🤖 Adding AI response");
    await chat.addMessage('ai', aiResponse, travelData);
    console.log("✅ AI response added");
    
    console.log("✅ Chat messages saved to database successfully");
  } catch (error) {
    console.error("❌ Error saving chat messages:", error);
    console.error("❌ Error stack:", error.stack);
  }
};

// Test endpoint to verify authentication
router.post("/test-auth", optionalAuth, async (req, res) => {
  console.log("🔍 Test auth endpoint - User:", req.user);
  res.json({ 
    authenticated: !!req.user,
    user: req.user || null,
    message: "Auth test complete"
  });
});

router.post("/chat", optionalAuth, async (req, res) => {
  const { message, chatId } = req.body;
  console.log("🔍 Chat request received:");
  console.log("  - Message:", message);
  console.log("  - ChatId:", chatId);
  console.log("  - User authenticated:", !!req.user);
  console.log("  - User details:", req.user || "None");
  try {
    // Step 1: Send user input + tool definitions to Gemini
    const geminiResponse = await callGeminiAPI(message, [
      {
        name: "getWeatherDataByCityName",
        description: "Get weather data for a city between given dates.",
        parameters: {
          type: "object",
          properties: {
            city: { type: "string", description: "Name of the city" },
            startDate: {
              type: "string",
              description: "Start date (YYYY-MM-DD)",
            },
            endDate: {
              type: "string",
              description: "End date (YYYY-MM-DD)",
            },
          },
          required: ["city", "startDate", "endDate"],
        },
      },
      {
        name: "planTripBasedOnWeather",
        description: "Plan a complete trip to a city based on weather conditions between given dates. This tool automatically gets weather data and suggests places to visit based on weather patterns.",
        parameters: {
          type: "object",
          properties: {
            city: { type: "string", description: "Name of the destination city" },
            startDate: {
              type: "string",
              description: "Trip start date (YYYY-MM-DD)",
            },
            endDate: {
              type: "string",
              description: "Trip end date (YYYY-MM-DD)",
            },
          },
          required: ["city", "startDate", "endDate"],
        },
      },
    ]);

    // Step 2: Handle tool calls
    if (geminiResponse.tool_call?.name === "getWeatherDataByCityName") {
      const { city, startDate, endDate } = geminiResponse.tool_call.arguments;
      console.log("🛠 Weather tool called with:", { city, startDate, endDate });

      const toolResponse = await mcpServer.invokeTool(
        "getWeatherDataByCityName",
        { city, startDate, endDate }
      );

      const weatherText = toolResponse.content.map((c) => c.text).join("\n");

      // Step 3: Send tool output back to Gemini for a polished reply
      const finalResponse = await callGeminiAPI(
        `User asked about weather in ${city} from ${startDate} to ${endDate}. Tool output: ${weatherText}`
      );

      // Save to database if user is authenticated
      console.log("🔍 Checking if user is authenticated for weather response:", !!req.user);
      if (req.user) {
        console.log("💾 Saving weather chat to database");
        await saveChatMessages(req.user.id, chatId, message, finalResponse.text);
      } else {
        console.log("⚠️ No user authenticated, skipping save");
      }

      return res.json({ response: finalResponse.text });
    }

    if (geminiResponse.tool_call?.name === "planTripBasedOnWeather") {
      const { city, startDate, endDate } = geminiResponse.tool_call.arguments;
      console.log("🛠 Travel planning tool called with:", { city, startDate, endDate });

      const toolResponse = await mcpServer.invokeTool(
        "planTripBasedOnWeather",
        { city, startDate, endDate }
      );

      const travelPlanText = toolResponse.content.map((c) => c.text).join("\n");

      // Parse the structured data from the tool response
      let travelData = null;
      try {
        travelData = JSON.parse(travelPlanText);
      } catch (e) {
        console.warn("Could not parse travel data as JSON, using text response only");
      }

      // Step 3: Send tool output back to Gemini for a polished travel plan
      const finalResponse = await callGeminiAPI(
        `User asked to plan a trip to ${city} from ${startDate} to ${endDate}. Here's the weather-based travel plan: ${travelPlanText}. Please format this into a nice, readable trip itinerary for the user.`
      );

      // Save to database if user is authenticated
      console.log("🔍 Checking if user is authenticated for travel response:", !!req.user);
      if (req.user) {
        console.log("💾 Saving travel chat to database");
        await saveChatMessages(req.user.id, chatId, message, finalResponse.text, travelData);
      } else {
        console.log("⚠️ No user authenticated, skipping save");
      }

      // Return both the AI response and structured data for map integration
      return res.json({ 
        response: finalResponse.text,
        travelData: travelData // Include structured data if available
      });
    }

    // Step 4: Otherwise just return Gemini's reply
    // Save to database if user is authenticated
    console.log("🔍 Checking if user is authenticated for general response:", !!req.user);
    if (req.user) {
      console.log("💾 Saving general chat to database");
      await saveChatMessages(req.user.id, chatId, message, geminiResponse.text);
    } else {
      console.log("⚠️ No user authenticated, skipping save");
    }
    
    res.json({ response: geminiResponse.text });
  } catch (err) {
    console.error("❌ Chat error:", err);
    res.status(500).json({ response: "Something went wrong." });
  }
});

export default router;