import express from "express";
import { callGeminiAPI } from "../helpers/gemini.js";

const router = express.Router();

// Route for analyzing city data with Gemini
router.post("/analyze-city", async (req, res) => {
  try {
    const { mcpResponse, cityName, comparisonContext } = req.body;

    console.log(`🧠 Starting Gemini city analysis for ${cityName}:`, {
      cityName,
      comparisonContext,
      mcpResponseType: typeof mcpResponse,
      hasResponse: !!mcpResponse?.response,
      hasTravelData: !!mcpResponse?.travelData,
      timestamp: new Date().toISOString()
    });

    // Validate input
    if (!mcpResponse || !cityName) {
      return res.status(400).json({
        error: "Missing required fields: mcpResponse and cityName are required"
      });
    }

    // Prepare the analysis prompt
    const analysisPrompt = `
You are a travel expert analyzing destination data. Based on the following travel data for ${cityName}, provide a comprehensive analysis:

**RAW TRAVEL DATA:**
${JSON.stringify(mcpResponse, null, 2)}

**ANALYSIS REQUEST:**
Please analyze this destination and provide:

1. **City Overview** (2-3 sentences about what makes this city special)
2. **Top Attractions** (List 4-5 must-visit places with brief descriptions)
3. **Travel Experience** (What type of traveler would love this place)
4. **Budget Assessment** (Is it budget-friendly, mid-range, or luxury destination)
5. **Best For** (What this city is particularly good for - culture, food, nightlife, history, etc.)
6. **Unique Selling Points** (3-4 things that set this city apart)

${comparisonContext ? `**COMPARISON CONTEXT:** This analysis will be compared with another city, so highlight distinctive features and competitive advantages.` : ''}

**RESPONSE FORMAT:**
Please provide a well-structured, engaging analysis that helps travelers understand what ${cityName} offers. Be specific, informative, and highlight what makes this destination unique.

**TONE:** Professional yet engaging, like a knowledgeable travel advisor.
`;

    console.log(`📤 Sending analysis prompt to Gemini for ${cityName}:`, {
      cityName,
      promptLength: analysisPrompt.length,
      promptPreview: analysisPrompt.substring(0, 200) + "...",
      timestamp: new Date().toISOString()
    });

    // Call Gemini API directly
    const geminiResponse = await callGeminiAPI(analysisPrompt);

    console.log(`✅ Received Gemini analysis response for ${cityName}:`, {
      cityName,
      responseType: typeof geminiResponse,
      hasText: !!geminiResponse?.text,
      responseLength: geminiResponse?.text?.length || 0,
      analysisPreview: geminiResponse?.text?.substring(0, 300) + "..." || "No text response",
      timestamp: new Date().toISOString()
    });

    // Extract the analysis text
    const analysisText = geminiResponse?.text || geminiResponse || "Analysis not available";

    console.log(`🎯 Final analysis for ${cityName}:`, {
      cityName,
      analysisLength: analysisText.length,
      hasOverview: /city overview|overview/i.test(analysisText),
      hasAttractions: /attractions|top/i.test(analysisText),
      hasBudget: /budget|cost|price/i.test(analysisText),
      sections: analysisText.split('**').length - 1,
      analysisQuality: analysisText.length > 500 ? "Comprehensive" : "Basic"
    });

    res.json({
      success: true,
      cityName,
      analysis: analysisText,
      metadata: {
        analysisLength: analysisText.length,
        hasStructuredData: analysisText.split('**').length > 1,
        timestamp: new Date().toISOString()
      }
    });

  } catch (error) {
    console.error(`❌ Error in city analysis for ${req.body?.cityName}:`, {
      cityName: req.body?.cityName,
      error: error.message,
      stack: error.stack,
      timestamp: new Date().toISOString()
    });

    res.status(500).json({
      success: false,
      error: "Failed to analyze city data",
      details: error.message,
      cityName: req.body?.cityName || "Unknown"
    });
  }
});

// Route for comparative analysis between two cities
router.post("/compare-cities", async (req, res) => {
  try {
    const { 
      city1Analysis, 
      city2Analysis, 
      city1Name, 
      city2Name, 
      travelContext 
    } = req.body;

    console.log(`🔄 Starting comparative analysis:`, {
      city1Name,
      city2Name,
      travelContext,
      city1AnalysisLength: city1Analysis?.length || 0,
      city2AnalysisLength: city2Analysis?.length || 0,
      timestamp: new Date().toISOString()
    });

    // Validate input
    if (!city1Analysis || !city2Analysis || !city1Name || !city2Name || !travelContext) {
      return res.status(400).json({
        error: "Missing required fields: city1Analysis, city2Analysis, city1Name, city2Name, and travelContext are required"
      });
    }

    const comparisonPrompt = `
You are a travel expert comparing two destinations. Based on the detailed analyses below, provide a comprehensive comparison:

**${city1Name.toUpperCase()} ANALYSIS:**
${city1Analysis}

**${city2Name.toUpperCase()} ANALYSIS:**
${city2Analysis}

**TRAVEL CONTEXT:**
- Trip Duration: ${travelContext.days} days
- Travelers: ${travelContext.travelers} people  
- Budget: ${travelContext.budget}
- Dates: ${travelContext.startDate} to ${travelContext.endDate}

**COMPARISON REQUEST:**
Provide a detailed comparison covering:

1. **Winner Categories** (Which city wins in: Culture, Food, Budget, Activities, Nightlife, History, etc.)
2. **Traveler Recommendations** (Which city for which type of traveler)
3. **Budget Comparison** (Value for money analysis)
4. **Unique Experiences** (What each city offers that the other doesn't)
5. **Final Recommendation** (Given the travel context, which would you recommend and why)

**RESPONSE FORMAT:**
Structure your response as a comprehensive travel advisor comparison. Be specific about why one city might be better than another for different aspects.

**TONE:** Expert travel advisor providing balanced, insightful comparison to help travelers make the best choice.
`;

    console.log(`📤 Sending comparison prompt to Gemini:`, {
      city1Name,
      city2Name,
      promptLength: comparisonPrompt.length,
      promptPreview: comparisonPrompt.substring(0, 300) + "...",
      timestamp: new Date().toISOString()
    });

    // Call Gemini API directly
    const geminiResponse = await callGeminiAPI(comparisonPrompt);

    console.log(`✅ Received comparative analysis response:`, {
      city1Name,
      city2Name,
      responseType: typeof geminiResponse,
      hasText: !!geminiResponse?.text,
      responseLength: geminiResponse?.text?.length || 0,
      comparisonPreview: geminiResponse?.text?.substring(0, 300) + "..." || "No text response",
      timestamp: new Date().toISOString()
    });

    // Extract the comparison text
    const comparisonText = geminiResponse?.text || geminiResponse || "Comparison not available";

    console.log(`🎯 Final comparative analysis:`, {
      city1Name,
      city2Name,
      comparisonLength: comparisonText.length,
      hasWinners: /winner|better|best/i.test(comparisonText),
      hasRecommendation: /recommend|suggestion|choose/i.test(comparisonText),
      hasBudget: /budget|cost|price/i.test(comparisonText),
      sections: comparisonText.split('**').length - 1,
      analysisQuality: comparisonText.length > 800 ? "Comprehensive" : "Basic"
    });

    res.json({
      success: true,
      city1Name,
      city2Name,
      comparison: comparisonText,
      metadata: {
        comparisonLength: comparisonText.length,
        hasStructuredData: comparisonText.split('**').length > 1,
        timestamp: new Date().toISOString()
      }
    });

  } catch (error) {
    console.error(`❌ Error in comparative analysis:`, {
      city1Name: req.body?.city1Name,
      city2Name: req.body?.city2Name,
      error: error.message,
      stack: error.stack,
      timestamp: new Date().toISOString()
    });

    res.status(500).json({
      success: false,
      error: "Failed to generate comparative analysis",
      details: error.message,
      cities: {
        city1: req.body?.city1Name || "Unknown",
        city2: req.body?.city2Name || "Unknown"
      }
    });
  }
});

export default router;