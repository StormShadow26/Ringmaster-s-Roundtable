// backend/helpers/gemini.js
import fetch from "node-fetch";

/**
 * Calls the Gemini API to generate content.
 *
 * @param {string} prompt - The text prompt to send to the model.
 * @param {Array<Object>} tools - Optional array of tools/functions to enable.
 * @returns {Promise<{text: string, tool_call: any}>} - The response text and any tool call (currently null).
 */
export const callGeminiAPI = async (prompt, tools = []) => {
  try {
    if (!process.env.GEMINI_API_KEY) {
      throw new Error("GEMINI_API_KEY is not set in environment variables.");
    }

    // ✅ Stable model name
    const modelName = "gemini-2.5-flash";

    // ✅ API endpoint with key as query param
    const endpoint = `https://generativelanguage.googleapis.com/v1/models/${modelName}:generateContent?key=${process.env.GEMINI_API_KEY}`;

    const response = await fetch(endpoint, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        contents: [
          {
            role: "user",
            parts: [{ text: prompt }],
          },
        ],
      }),
    });

    if (!response.ok) {
      // Log full response body for debugging
      const errorBody = await response.text();
      throw new Error(
        `Gemini API error: ${response.status} ${response.statusText}. Details: ${errorBody}`
      );
    }

    const data = await response.json();

    const message =
      data?.candidates?.[0]?.content?.parts?.[0]?.text ||
      "Sorry, I could not process your request.";

    return { text: message, tool_call: null };
  } catch (err) {
    console.error("❌ Error calling Gemini API:", err.message);
    return {
      text: "Sorry, I could not process your request.",
      tool_call: null,
    };
  }
};
