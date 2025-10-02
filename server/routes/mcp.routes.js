import express from "express";
import { callGeminiAPI } from "../helpers/gemini.js";
import { server as mcpServer } from "../mcp/mcpServer.js"; // import the exported MCP server

const router = express.Router();

router.post("/chat", async (req, res) => {
  const { message } = req.body;

  try {
    // Step 1: Send user message to Gemini with tool instructions
    const geminiResponse = await callGeminiAPI(message, [
      {
        name: "getWeatherDataByCityName",
        description:
          "Use this tool when the user asks about weather. Input: city name. Output: string describing weather.",
      },
    ]);

    // Step 2: Check if Gemini wants to call a tool
    if (geminiResponse.tool_call?.name === "getWeatherDataByCityName") {
      const city = geminiResponse.tool_call.arguments.city;

      // Call the MCP server tool
      const toolResponse = await mcpServer.callTool("getWeatherDataByCityName", { city });

      // toolResponse.content is an array of { type: "text", text: "..." }
      const weatherText = toolResponse.content.map(c => c.text).join("\n");

      // Step 3: Optionally, send tool output back to Gemini for final response
      const finalResponse = await callGeminiAPI(
        `User asked about weather. Tool output: ${weatherText}`,
        []
      );

      return res.json({ response: finalResponse.text || finalResponse });
    }

    // Step 4: Otherwise return Gemini's normal reply
    res.json({ response: geminiResponse.text });
  } catch (err) {
    console.error("❌ Chat error:", err);
    res.status(500).json({ response: "Something went wrong." });
  }
});

export default router;
