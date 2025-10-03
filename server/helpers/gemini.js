// backend/helpers/gemini.js
import fetch from "node-fetch";

export const callGeminiAPI = async (prompt, tools = []) => {
  try {
    if (!process.env.GEMINI_API_KEY) {
      throw new Error("❌ GEMINI_API_KEY not set in environment");
    }

    const modelName = "gemini-2.5-flash";
    const endpoint = `https://generativelanguage.googleapis.com/v1beta/models/${modelName}:generateContent`;

    const requestBody = {
      contents: [
        {
          role: "user",
          parts: [{ text: prompt }],
        },
      ],
      generationConfig: {
        candidateCount: 1,
        temperature: 0.7, // optional: controls creativity
      },
    };

    // If tools are defined, add them
    if (tools.length) {
      requestBody.tools = [{ functionDeclarations: tools }];
    }

    const response = await fetch(endpoint, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-goog-api-key": process.env.GEMINI_API_KEY,
      },
      body: JSON.stringify(requestBody),
    });

    if (!response.ok) {
      const errBody = await response.text();
      throw new Error(
        `Gemini API error: ${response.status} ${response.statusText}. Details: ${errBody}`
      );
    }

    const data = await response.json();

    // 🔎 Extract text response
    let textResponse = null;
    if (data?.candidates?.[0]?.content?.parts) {
      textResponse = data.candidates[0].content.parts
        .map((p) => p.text || "")
        .join(" ")
        .trim();
    }

    // 🔎 Extract tool call if present
    const toolCallPart = data?.candidates?.[0]?.content?.parts?.find(
      (p) => p.functionCall
    );

    if (toolCallPart) {
      return {
        text: null,
        tool_call: {
          name: toolCallPart.functionCall.name,
          arguments: toolCallPart.functionCall.args,
        },
      };
    }

    return {
      text: textResponse || "Sorry, I could not process your request.",
      tool_call: null,
    };
  } catch (err) {
    console.error("❌ Error calling Gemini API:", err.message);
    return {
      text: `Sorry, something went wrong: ${err.message}`,
      tool_call: null,
    };
  }
};
