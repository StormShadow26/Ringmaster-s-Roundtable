// backend/routes/mcp.routes.js
import express from "express";
import { callGeminiAPI } from "../helpers/gemini.js";
import { server as mcpServer } from "../mcp/mcpServer.js";

const router = express.Router();

router.post("/chat", async (req, res) => {
  const { message } = req.body;
  
  try {
    // Step 1: Send user input + tool definitions to Gemini
    const geminiResponse = await callGeminiAPI(message, [
      {
        name: "getWeatherDataByCityName",
        description: "Get weather data for a city.",
        parameters: {
          type: "object",
          properties: {
            city: { type: "string", description: "Name of the city" },
          },
          required: ["city"],
        },
      }, 
    ]
  );
    // console.log(geminiResponse.tool_call)

    // Step 2: If Gemini decides to call a tool
    if (geminiResponse.tool_call?.name === "getWeatherDataByCityName") {
      const city = geminiResponse.tool_call.arguments.city;
      console.log(geminiResponse.tool_call.arguments.city)

      // Call MCP tool
      const toolResponse = await mcpServer.invokeTool("getWeatherDataByCityName", { city });
      const weatherText = toolResponse.content.map((c) => c.text).join("\n");

      // Step 3: Send tool output back to Gemini for a polished reply
      const finalResponse = await callGeminiAPI(
        `User asked about weather in ${city}. Tool output: ${weatherText}`
      );

      return res.json({ response: finalResponse.text });
    }

    // Step 4: Otherwise just return Gemini's reply
    res.json({ response: geminiResponse.text });
  } catch (err) {
    console.error("❌ Chat error:", err);
    res.status(500).json({ response: "Something went wrong." });
  }
});

export default router;
