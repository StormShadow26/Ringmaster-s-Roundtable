// backend/helpers/gemini.js
import fetch from "node-fetch";

export const callGeminiAPI = async (prompt, tools = []) => {
  try {
    if (!process.env.GEMINI_API_KEY) {
      throw new Error("GEMINI_API_KEY not set");
    }

    const modelName = "gemini-2.5-flash";
    const endpoint = `https://generativelanguage.googleapis.com/v1beta/models/${modelName}:generateContent`;

    const response = await fetch(endpoint, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-goog-api-key": process.env.GEMINI_API_KEY,
      },
      body: JSON.stringify({
        contents: [
          {
            role: "user",
            parts: [{ text: prompt }],
          },
        ],
        tools: tools.length
          ? [{ functionDeclarations: tools }]
          : undefined,
        generationConfig: {
          candidateCount: 1,
          // Add other configs as needed
        },
      }),
    });

    if (!response.ok) {
      const errBody = await response.text();
      throw new Error(`Gemini API error: ${response.status} ${response.statusText}. Details: ${errBody}`);
    }

    const data = await response.json();

    // Check for tool call
    const partWithFunc = data?.candidates?.[0]?.content?.parts?.find(p => p.functionCall);
    if (partWithFunc) {
      return {
        text: null,
        tool_call: {
          name: partWithFunc.functionCall.name,
          arguments: partWithFunc.functionCall.args,
        },
      };
    }

    // Otherwise get text
    const text =
      data?.candidates?.[0]?.content?.parts
        ?.map(p => p.text)
        .join(" ") ||
      "Sorry, I could not process your request.";

    return { text, tool_call: null };
  } catch (err) {
    console.error("❌ Error calling Gemini API:", err.message);
    return { text: "Sorry, I could not process your request.", tool_call: null };
  }
};
