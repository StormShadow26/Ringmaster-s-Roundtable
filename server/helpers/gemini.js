import fetch from "node-fetch";

export const callGeminiAPI = async (prompt, tools = []) => {
  try {
    // 🔹 Check for API key
    if (!process.env.GEMINI_API_KEY) {
      throw new Error("❌ GEMINI_API_KEY not set in environment");
    }

    // 🔹 Define model and endpoint properly
    const modelName = "gemini-2.5-flash";
    const endpoint = `https://generativelanguage.googleapis.com/v1beta/models/${modelName}:generateContent`;

    // 🔹 Request body setup
    const requestBody = {
      contents: [
        {
          role: "user",
          parts: [{ text: prompt }],
        },
      ],
      generationConfig: {
        candidateCount: 1, // generates only a single response
        temperature: 0.3,  // Controls randomness/creativity
      },
    };

    // 🔹 Add tools only if present
    if (tools.length) {
      requestBody.tools = [{ functionDeclarations: tools }];
    }

    // 🔹 Perform the API request
    const response = await fetch(endpoint, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-goog-api-key": process.env.GEMINI_API_KEY,
      },
      body: JSON.stringify(requestBody),
    });

    // 🔹 Handle non-OK responses
    if (!response.ok) {
      const errBody = await response.text();
      throw new Error(
        `Gemini API error: ${response.status} ${response.statusText}. Details: ${errBody}`
      );
    }

    // 🔹 Parse JSON
    const data = await response.json();

    // 🔹 Extract text response safely
    let textResponse = null;
    if (data?.candidates?.[0]?.content?.parts) {
      textResponse = data.candidates[0].content.parts
        .map((p) => p.text || "")
        .join(" ")
        .trim();
    }

    // 🔹 Extract tool call if present
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

    // 🔹 Normal return
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
