import express from "express";
import { callGeminiAPI } from "../helpers/gemini.js";
import { server as mcpServer } from "../mcp/mcpServer.js";

const router = express.Router();

router.post("/chat", async (req, res) => {
  const { message } = req.body;
  console.log("message is:",message);
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

      // Return both the AI response and structured data for map integration
      return res.json({ 
        response: finalResponse.text,
        travelData: travelData // Include structured data if available
      });
    }

    // Step 4: Otherwise just return Gemini's reply
    res.json({ response: geminiResponse.text });
  } catch (err) {
    console.error("❌ Chat error:", err);
    res.status(500).json({ response: "Something went wrong." });
  }
});

export default router;