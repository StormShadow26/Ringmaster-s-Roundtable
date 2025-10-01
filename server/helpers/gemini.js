// backend/helpers/gemini.js
import fetch from "node-fetch";

/**
 * Call the Gemini API with a user prompt and optional tools.
 * @param {string} prompt - The user's message
 * @param {Array} tools - Optional list of tools available for MCP
 * @returns {Promise<Object>} - Gemini response { text, tool_call }
 */
export const callGeminiAPI = async (prompt, tools = []) => {
  try {
    if (!process.env.GEMINI_API_KEY) {
      throw new Error("GEMINI_API_KEY is not set in environment variables.");
    }

    // ✅ Updated Gemini API endpoint (Google Vertex AI)
    const response = await fetch(
      "https://generativelanguage.googleapis.com/v1beta2/models/gemini-2.5-pro:generateMessage",
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${process.env.GEMINI_API_KEY}`,
        },
        body: JSON.stringify({
          prompt: {
            text: prompt,
          },
          // You can include tools or instructions as "context" if needed
          candidateCount: 1, // return 1 response
        }),
      }
    );

    if (!response.ok) {
      throw new Error(`Gemini API error: ${response.status} ${response.statusText}`);
    }

    const data = await response.json();

    // The Gemini API response may have messages in data.candidates[0].content
    const message = data?.candidates?.[0]?.content
      ?.map(c => c.text)
      .join(" ") || "Sorry, I could not process your request.";

    // Return a structure compatible with your MCP flow
    return {
      text: message,
      tool_call: null, // You can parse tool calls if you pass structured prompts
    };
  } catch (err) {
    console.error("❌ Error calling Gemini API:", err);
    return { text: "Sorry, I could not process your request.", tool_call: null };
  }
};
