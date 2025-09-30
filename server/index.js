// mcp-server.js
import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { z } from "zod";

const server = new McpServer({
  name: "weatherData",
  version: "1.0.0",
});

// Fake weather function
async function getWeatherByCity(city) {
  if (city.toLowerCase() === "london") {
    return { temp: "15C", condition: "Cloudy" };
  }
  if (city.toLowerCase() === "delhi") {
    return { temp: "32C", condition: "Sunny" };
  }
  return { error: `No weather data for ${city}` };
}

// Tool definition
server.tool(
  "getWeatherDataByCityName",
  {
    city: z.string(),
  },
  async ({ city }) => {
    const result = await getWeatherByCity(city);

    // Force log to debug
    console.error("DEBUG returning:", result);

    // ✅ Only "text" is valid — stringify JSON manually
    return {
      content: [
        {
          type: "text",
          text: JSON.stringify(result), // single line string works better
        },
      ],
    };
  }
);



// Init
async function init() {
  const transport = new StdioServerTransport();
  await server.connect(transport);
  console.error("✅ Weather MCP server running...");
}

init();
