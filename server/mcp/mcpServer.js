// backend/mcp/mcpServer.js
import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { z } from "zod";
import fetch from "node-fetch";
import dotenv from "dotenv";

dotenv.config();

const OPENWEATHER_API_KEY = process.env.OPENWEATHER_API_KEY;
if (!OPENWEATHER_API_KEY) throw new Error("OPENWEATHER_API_KEY not set in .env");

// Create MCP server
export const server = new McpServer({
  name: "weatherData",
  version: "1.0.0",
});

// --- Fetch weather for city + neighbors ---
async function getWeatherByCityAndDate(city, startDate, endDate) {
  try {
    const geoRes = await fetch(
      `https://api.openweathermap.org/geo/1.0/direct?q=${encodeURIComponent(
        city
      )}&limit=1&appid=${OPENWEATHER_API_KEY}`
    );
    const geoData = await geoRes.json();
    if (!geoData || geoData.length === 0) return { error: `City not found: ${city}` };
    const { lat, lon } = geoData[0];

    const weatherRes = await fetch(
      `https://api.openweathermap.org/data/2.5/forecast?lat=${lat}&lon=${lon}&appid=${OPENWEATHER_API_KEY}&units=metric`
    );
    const weatherData = await weatherRes.json();
    if (!weatherData?.list) return { error: "Failed to fetch forecast data" };

    const forecasts = weatherData.list.filter(f => {
      const forecastDate = f.dt_txt.split(" ")[0];
      return forecastDate >= startDate && forecastDate <= endDate;
    });

    const neighborRes = await fetch(
      `https://api.openweathermap.org/data/2.5/find?lat=${lat}&lon=${lon}&cnt=5&appid=${OPENWEATHER_API_KEY}&units=metric`
    );
    const neighborData = await neighborRes.json();

    return { city, forecasts, neighbors: neighborData.list || [] };
  } catch (err) {
    console.error("❌ Weather API error:", err);
    return { error: "Failed to fetch weather data." };
  }
}

// --- Format itinerary by day → location → 3-hour intervals ---
function formatItinerary(forecasts, neighbors) {
  const itinerary = {};
  const timesOfInterest = ["06:00:00", "09:00:00", "12:00:00", "15:00:00", "18:00:00", "21:00:00", "00:00:00"];

  const allLocations = [{ name: "Main City", list: forecasts }, ...neighbors.map(n => ({ name: n.name, list: forecasts }))];

  forecasts.forEach(f => {
    const [date, time] = f.dt_txt.split(" ");
    if (!itinerary[date]) itinerary[date] = {};

    allLocations.forEach(loc => {
      if (!itinerary[date][loc.name]) itinerary[date][loc.name] = [];
      if (timesOfInterest.includes(time)) {
        itinerary[date][loc.name].push({
          time,
          temp: `${f.main.temp} °C`,
          condition: f.weather[0].description
        });
      }
    });
  });

  return itinerary;
}

// --- Print itinerary in console ---
function printItinerary(itinerary) {
  console.log("\n📅 Travel Itinerary:");
  let dayCount = 1;
  for (const date of Object.keys(itinerary)) {
    console.log(`\nDay ${dayCount} (${date}):`);
    for (const loc of Object.keys(itinerary[date])) {
      console.log(`  Location: ${loc}`);
      itinerary[date][loc].forEach(f => {
        console.log(`    ${f.time} - Temp: ${f.temp}, Condition: ${f.condition}`);
      });
    }
    dayCount++;
  }
}

// --- Tool registry ---
const toolRegistry = new Map();
function registerTool(name, schema, handler) {
  toolRegistry.set(name, handler);
  server.tool(name, schema, async args => handler(args));
}

server.invokeTool = async (name, args) => {
  if (!toolRegistry.has(name)) throw new Error(`Tool ${name} not registered`);
  return toolRegistry.get(name)(args);
};

// --- Register getWeatherDataByCityName tool ---
registerTool(
  "getWeatherDataByCityName",
  {
    city: z.string(),
    startDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Use YYYY-MM-DD"),
    endDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Use YYYY-MM-DD")
  },
  async ({ city, startDate, endDate }) => {
    const data = await getWeatherByCityAndDate(city, startDate, endDate);
    if (data.error) {
      console.error(`❌ Error: ${data.error}`);
      return { content: [{ type: "text", text: `❌ Error: ${data.error}` }] };
    }

    const itinerary = formatItinerary(data.forecasts, data.neighbors);

    // ✅ Print in console
    printItinerary(itinerary);

    return {
      content: [{ type: "text", text: JSON.stringify(itinerary, null, 2) }]
    };
  }
);

// --- Initialize MCP server ---
export async function initMcpServer() {
  const transport = new StdioServerTransport();
  await server.connect(transport);
  console.log("✅ Weather MCP server running...");
}
