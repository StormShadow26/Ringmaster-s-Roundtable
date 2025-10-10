// 🧪 API TESTING UTILITIES
// Use these to test your API keys independently

class APITester {
  constructor() {
    this.results = [];
  }

  // Test all APIs with sample requests
  async testAllAPIs() {
    console.log("🧪 Starting API Tests...\n");
    
    const tests = [
      () => this.testAmadeus(),
      () => this.testOpenWeather(),
      () => this.testSkyscanner(), 
      () => this.testTicketmaster(),
      () => this.testUnsplash()
    ];

    for (const test of tests) {
      try {
        await test();
        await this.delay(1000); // Rate limiting
      } catch (error) {
        console.error("Test failed:", error);
      }
    }

    this.printSummary();
  }

  // Test Amadeus Flight API
  async testAmadeus() {
    const clientId = import.meta.env.VITE_AMADEUS_CLIENT_ID;
    const clientSecret = import.meta.env.VITE_AMADEUS_CLIENT_SECRET;

    if (!clientId || !clientSecret) {
      this.log("❌ Amadeus", "Missing API credentials");
      return;
    }

    try {
      // Get access token
      const tokenResponse = await fetch("https://test.api.amadeus.com/v1/security/oauth2/token", {
        method: "POST",
        headers: {
          "Content-Type": "application/x-www-form-urlencoded"
        },
        body: `grant_type=client_credentials&client_id=${clientId}&client_secret=${clientSecret}`
      });

      if (!tokenResponse.ok) {
        this.log("❌ Amadeus", "Authentication failed");
        return;
      }

      const tokenData = await tokenResponse.json();
      
      // Test flight search
      const flightResponse = await fetch(
        "https://test.api.amadeus.com/v2/shopping/flight-offers?originLocationCode=NYC&destinationLocationCode=LAX&departureDate=2024-12-01&adults=1&max=1",
        {
          headers: {
            "Authorization": `Bearer ${tokenData.access_token}`
          }
        }
      );

      if (flightResponse.ok) {
        const data = await flightResponse.json();
        this.log("✅ Amadeus", `Found ${data.data?.length || 0} flight offers`);
      } else {
        this.log("❌ Amadeus", "Flight search failed");
      }
    } catch (error) {
      this.log("❌ Amadeus", `Error: ${error.message}`);
    }
  }

  // Test OpenWeather API
  async testOpenWeather() {
    const apiKey = import.meta.env.VITE_OPENWEATHER_API_KEY;

    if (!apiKey) {
      this.log("❌ OpenWeather", "Missing API key");
      return;
    }

    try {
      const response = await fetch(
        `https://api.openweathermap.org/geo/1.0/direct?q=London&limit=1&appid=${apiKey}`
      );

      if (response.ok) {
        const data = await response.json();
        this.log("✅ OpenWeather", `Geocoding works: ${data[0]?.name}, ${data[0]?.country}`);
      } else {
        this.log("❌ OpenWeather", "API request failed");
      }
    } catch (error) {
      this.log("❌ OpenWeather", `Error: ${error.message}`);
    }
  }

  // Test Skyscanner API
  async testSkyscanner() {
    const apiKey = import.meta.env.VITE_SKYSCANNER_API_KEY;

    if (!apiKey) {
      this.log("❌ Skyscanner", "Missing API key");
      return;
    }

    try {
      // Note: This is a simplified test - actual Skyscanner API is more complex
      const response = await fetch(
        "https://skyscanner-skyscanner-flight-search-v1.p.rapidapi.com/apiservices/browse/browsequotes/v1.0/US/USD/en-US/SFO-sky/LAX-sky/2024-12-01",
        {
          headers: {
            "X-RapidAPI-Host": "skyscanner-skyscanner-flight-search-v1.p.rapidapi.com",
            "X-RapidAPI-Key": apiKey
          }
        }
      );

      if (response.ok) {
        this.log("✅ Skyscanner", "API connection successful");
      } else {
        this.log("❌ Skyscanner", `API error: ${response.status}`);
      }
    } catch (error) {
      this.log("❌ Skyscanner", `Error: ${error.message}`);
    }
  }

  // Test Ticketmaster API
  async testTicketmaster() {
    const apiKey = import.meta.env.VITE_TICKETMASTER_API_KEY;

    if (!apiKey) {
      this.log("❌ Ticketmaster", "Missing API key");
      return;
    }

    try {
      const response = await fetch(
        `https://app.ticketmaster.com/discovery/v2/events.json?city=New York&apikey=${apiKey}&size=1`
      );

      if (response.ok) {
        const data = await response.json();
        this.log("✅ Ticketmaster", `Found ${data._embedded?.events?.length || 0} events`);
      } else {
        this.log("❌ Ticketmaster", "API request failed");
      }
    } catch (error) {
      this.log("❌ Ticketmaster", `Error: ${error.message}`);
    }
  }

  // Test Unsplash API
  async testUnsplash() {
    const apiKey = import.meta.env.VITE_UNSPLASH_ACCESS_KEY;

    if (!apiKey) {
      this.log("❌ Unsplash", "Missing API key");
      return;
    }

    try {
      const response = await fetch(
        `https://api.unsplash.com/photos/random?query=travel&client_id=${apiKey}`
      );

      if (response.ok) {
        const data = await response.json();
        this.log("✅ Unsplash", `Image API works: ${data.urls?.small ? "✓" : "✗"}`);
      } else {
        this.log("❌ Unsplash", "API request failed");
      }
    } catch (error) {
      this.log("❌ Unsplash", `Error: ${error.message}`);
    }
  }

  // Utility functions
  log(status, message) {
    console.log(`${status} ${message}`);
    this.results.push({ status: status.includes("✅"), message });
  }

  printSummary() {
    const passed = this.results.filter(r => r.status).length;
    const total = this.results.length;
    
    console.log(`\n🎯 Test Summary: ${passed}/${total} APIs working`);
    
    if (passed === total) {
      console.log("🎉 All APIs configured correctly!");
    } else if (passed >= 2) {
      console.log("⚠️ Some APIs missing - system will use mock data for missing services");
    } else {
      console.log("🚨 Most APIs missing - system will run in full mock mode");
    }
  }

  delay(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }
}

// Export for use
export default APITester;

// Usage examples:
// 
// In browser console:
// const tester = new APITester();
// tester.testAllAPIs();
//
// Or test individual APIs:
// tester.testAmadeus();
// tester.testOpenWeather();

/* 
🔧 MANUAL TESTING URLS:

1. Amadeus Token Test:
POST https://test.api.amadeus.com/v1/security/oauth2/token
Body: grant_type=client_credentials&client_id=YOUR_ID&client_secret=YOUR_SECRET

2. OpenWeather Test:
GET https://api.openweathermap.org/geo/1.0/direct?q=London&appid=YOUR_KEY

3. Unsplash Test:
GET https://api.unsplash.com/photos/random?client_id=YOUR_KEY

4. Google Maps Test (already working):
https://maps.googleapis.com/maps/api/js?key=YOUR_KEY

🎯 Expected Response Codes:
- 200: Success
- 401: Invalid API key
- 403: Rate limit exceeded
- 404: Endpoint not found
- 429: Too many requests

💡 Pro Tips:
- Test APIs individually before integration
- Check rate limits in API dashboards  
- Use browser network tab to debug requests
- Keep API keys secure and rotate regularly
*/