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
      {
        name: "estimateBudgetForTravelPlan",
        description: "Estimate cheap, moderate, and luxury budgets for a travel plan using local price signals.",
        parameters: {
          type: "object",
          properties: {
            travelPlan: { type: "object", description: "Travel plan object as returned by planTripBasedOnWeather" },
            travelers: { type: "number", description: "Number of travelers" },
            currency: { type: "string", description: "Currency code like USD, EUR, INR" }
          },
          required: ["travelPlan"],
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

      // If budget missing (older plan or failure), compute it now
      if (travelData && !travelData.budget) {
        try {
          console.log("ℹ️ No budget in travelData; computing via MCP tool");
          const budgetResp = await mcpServer.invokeTool("estimateBudgetForTravelPlan", { travelPlan: travelData });
          const contentTexts = budgetResp.content.map((c) => c.text);
          const budgetJsonText = contentTexts[0] || '{}';
          const summaryText = contentTexts[1] || '';
          const budgetData = JSON.parse(budgetJsonText);
          travelData.budget = budgetData;
          travelData.budgetSummary = summaryText;
          console.log("✅ Budget attached in route handler");
        } catch (e) {
          console.warn("Failed to attach budget:", e.message);
        }
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

    if (geminiResponse.tool_call?.name === "estimateBudgetForTravelPlan") {
      const { travelPlan, travelers, currency } = geminiResponse.tool_call.arguments || {};
      console.log("🛠 Budget tool called with:", { travelers, currency, hasPlan: !!travelPlan });

      // Accept object or JSON string for travelPlan
      let planObj = travelPlan;
      try {
        if (typeof travelPlan === 'string') {
          planObj = JSON.parse(travelPlan);
        }
      } catch (e) {
        console.warn("Budget tool: travelPlan is not valid JSON string; passing as-is");
      }

      const toolResponse = await mcpServer.invokeTool(
        "estimateBudgetForTravelPlan",
        { travelPlan: planObj ?? travelPlan, travelers, currency }
      );

      const contentTexts = toolResponse.content.map((c) => c.text);
      const budgetJsonText = contentTexts[0] || '{}';
      const summaryText = contentTexts[1] || '';

      let budgetData = null;
      try {
        budgetData = JSON.parse(budgetJsonText);
      } catch (e) {
        console.warn("Could not parse budget JSON; returning text only");
      }

      // Ask Gemini to provide a polished budget presentation
      const finalResponse = await callGeminiAPI(
        `Provide a clear, user-friendly budget summary. Here is the budget data (JSON): ${budgetJsonText}. Also include a brief explanation per tier using this text: ${summaryText}`
      );

      return res.json({
        response: finalResponse.text,
        budget: budgetData || null,
        rawSummary: summaryText,
        // Provide a consistent travelData envelope so the frontend can consume uniformly
        travelData: budgetData ? {
          destination: budgetData.destination ? { city: budgetData.destination } : undefined,
          budget: budgetData,
          budgetSummary: summaryText
        } : null
      });
    }

    // Step 4: Fallback — if user asked for budget but no tool was called, try to infer and compute
    if (/budget/i.test(message)) {
      console.log("🛟 Fallback budget flow triggered");

      // naive city and date parsing from free text
      const months = {
        january: 1, february: 2, march: 3, april: 4, may: 5, june: 6,
        july: 7, august: 8, september: 9, october: 10, november: 11, december: 12
      };

      function parseMonthDay(str) {
        const m = str.match(/(january|february|march|april|may|june|july|august|september|october|november|december)\s+(\d{1,2})/i);
        if (!m) return null;
        return { month: months[m[1].toLowerCase()], day: parseInt(m[2], 10) };
      }

      function extractCity(msg) {
        const m = msg.match(/for\s+([a-zA-Z\s]+?)\s+trip/i)
          || msg.match(/to\s+([a-zA-Z\s]+?)(?:\s+(?:from|between|on|in)\b|\.|,|$)/i)
          || msg.match(/in\s+([a-zA-Z\s]+?)\s+(?:from|between|on|\d{4}|$)/i);
        return m ? m[1].trim().replace(/\s+/g, ' ') : null;
      }

      function extractDates(msg) {
        // supports: "Dec 15 to Dec 20 2025", "December 15 - December 20 in 2025", "between December 15 and December 20, 2025"
        const yearMatch = msg.match(/\b(20\d{2})\b/);
        const rangeRegex = /(january|february|march|april|may|june|july|august|september|october|november|december|jan|feb|mar|apr|jun|jul|aug|sep|sept|oct|nov|dec)\s+\d{1,2}\s*(?:to|\-|until|through|and)\s*(january|february|march|april|may|june|july|august|september|october|november|december|jan|feb|mar|apr|jun|jul|aug|sep|sept|oct|nov|dec)\s+\d{1,2}/i;
        const m = msg.match(rangeRegex);
        if (!m || !yearMatch) return null;
        const parts = m[0].split(/\s*(?:to|\-|until|through|and)\s*/i);
        const monthAlias = (s) => ({jan:'january',feb:'february',mar:'march',apr:'april',jun:'june',jul:'july',aug:'august',sep:'september',sept:'september',oct:'october',nov:'november',dec:'december'})[s.toLowerCase()] || s;
        const aStr = parts[0].replace(/\b(jan|feb|mar|apr|jun|jul|aug|sep|sept|oct|nov|dec)\b/i, (m)=>monthAlias(m));
        const bStr = parts[1].replace(/\b(jan|feb|mar|apr|jun|jul|aug|sep|sept|oct|nov|dec)\b/i, (m)=>monthAlias(m));
        const a = parseMonthDay(aStr);
        const b = parseMonthDay(bStr);
        if (!a || !b) return null;
        const year = parseInt(yearMatch[1], 10);
        const pad = (n) => String(n).padStart(2, '0');
        const startDate = `${year}-${pad(a.month)}-${pad(a.day)}`;
        const endDate = `${year}-${pad(b.month)}-${pad(b.day)}`;
        return { startDate, endDate };
      }

      const city = extractCity(message);
      const dates = extractDates(message);

      if (city && dates) {
        console.log("🧭 Parsed fallback params:", { city, ...dates });
        try {
          const planResp = await mcpServer.invokeTool("planTripBasedOnWeather", { city, ...dates });
          const planText = planResp.content.map((c) => c.text).join("\n");
          const travelPlan = JSON.parse(planText);

          const budgetResp = await mcpServer.invokeTool("estimateBudgetForTravelPlan", { travelPlan });
          const budgetText = budgetResp.content.map((c) => c.text);
          const budgetJson = JSON.parse(budgetText[0] || '{}');
          const summaryText = budgetText[1] || '';

          return res.json({
            response: geminiResponse.text || 'Here is the estimated budget based on your dates and destination.',
            travelData: {
              ...travelPlan,
              budget: budgetJson,
              budgetSummary: summaryText
            }
          });
        } catch (e) {
          console.warn("Fallback plan+budget failed, attempting minimal weather+budget:", e.message);
          try {
            const weatherResp = await mcpServer.invokeTool("getWeatherDataByCityName", { city, ...dates });
            const weatherText = weatherResp.content.map((c)=>c.text).join("\n");
            const weatherData = JSON.parse(weatherText);
            const minimalPlan = {
              destination: { city, coordinates: weatherData.coordinates },
              tripDuration: { startDate: dates.startDate, endDate: dates.endDate }
            };
            const budgetResp = await mcpServer.invokeTool("estimateBudgetForTravelPlan", { travelPlan: minimalPlan });
            const bTexts = budgetResp.content.map((c)=>c.text);
            const budgetJson = JSON.parse(bTexts[0] || '{}');
            const summaryText = bTexts[1] || '';
            return res.json({
              response: geminiResponse.text || 'Here is the estimated budget based on your dates and destination.',
              travelData: { destination: { city }, budget: budgetJson, budgetSummary: summaryText }
            });
          } catch (inner) {
            console.warn("Minimal fallback failed:", inner.message);
          }
        }
      } else {
        console.log("ℹ️ Fallback could not parse city/dates; returning text-only response");
      }
    }

    // Default: return Gemini's reply
    res.json({ response: geminiResponse.text });
  } catch (err) {
    console.error("❌ Chat error:", err);
    res.status(500).json({ response: "Something went wrong." });
  }
});

export default router;