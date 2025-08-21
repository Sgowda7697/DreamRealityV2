import OpenAI from "openai";
import { NextRequest, NextResponse } from "next/server";
import { PlanResponse, TPlanResponse } from "@/lib/schema";
import { MOCK_FLIGHTS, MOCK_HOTELS } from "@/lib/mock-data";

// Helper functions for generating dynamic mock data
function generateMockDestinations(prompt: string) {
  const lowerPrompt = prompt.toLowerCase();
  
  // Simple keyword matching for different types of trips
  if (lowerPrompt.includes('beach') || lowerPrompt.includes('ocean') || lowerPrompt.includes('seaside')) {
    return [
      { name: "Maldives", country: "Maldives", summary: "Crystal clear waters and overwater bungalows", tags: ["beach", "luxury", "relaxation"] },
      { name: "Bali", country: "Indonesia", summary: "Tropical paradise with beaches and culture", tags: ["beach", "culture", "adventure"] },
      { name: "Santorini", country: "Greece", summary: "Stunning sunsets and white-washed buildings", tags: ["beach", "romance", "scenic"] }
    ];
  } else if (lowerPrompt.includes('mountain') || lowerPrompt.includes('hiking') || lowerPrompt.includes('trek')) {
    return [
      { name: "Swiss Alps", country: "Switzerland", summary: "Majestic mountains and pristine nature", tags: ["mountains", "adventure", "nature"] },
      { name: "Himalayas", country: "Nepal", summary: "World's highest peaks and spiritual journey", tags: ["mountains", "trekking", "culture"] },
      { name: "Rocky Mountains", country: "USA", summary: "Rugged wilderness and outdoor adventures", tags: ["mountains", "hiking", "wildlife"] }
    ];
  } else if (lowerPrompt.includes('city') || lowerPrompt.includes('urban') || lowerPrompt.includes('culture')) {
    return [
      { name: "Tokyo", country: "Japan", summary: "Modern metropolis with rich tradition", tags: ["city", "culture", "technology"] },
      { name: "Paris", country: "France", summary: "City of lights and romance", tags: ["city", "culture", "romance"] },
      { name: "New York", country: "USA", summary: "The city that never sleeps", tags: ["city", "entertainment", "shopping"] }
    ];
  } else if (lowerPrompt.includes('adventure') || lowerPrompt.includes('safari') || lowerPrompt.includes('wildlife')) {
    return [
      { name: "Kenya", country: "Kenya", summary: "African safari and wildlife experiences", tags: ["adventure", "wildlife", "safari"] },
      { name: "Costa Rica", country: "Costa Rica", summary: "Biodiversity and adventure activities", tags: ["adventure", "nature", "wildlife"] },
      { name: "New Zealand", country: "New Zealand", summary: "Adventure sports and stunning landscapes", tags: ["adventure", "nature", "sports"] }
    ];
  } else {
    // Default mix of popular destinations
    return [
      { name: "Thailand", country: "Thailand", summary: "Exotic culture and beautiful landscapes", tags: ["culture", "beach", "adventure"] },
      { name: "Italy", country: "Italy", summary: "Rich history, art, and delicious cuisine", tags: ["culture", "history", "food"] },
      { name: "Australia", country: "Australia", summary: "Diverse landscapes and unique wildlife", tags: ["adventure", "wildlife", "beach"] }
    ];
  }
}

function generateMockFlights(destination: string) {
  return [
    { from: "DEL", to: "INT", airline: "Air India", price: 45000 },
    { from: "BOM", to: "INT", airline: "Emirates", price: 52000 },
    { from: "BLR", to: "INT", airline: "Qatar Airways", price: 48000 }
  ];
}

function generateMockHotels(destination: string) {
  return [
    { name: `Grand ${destination} Resort`, pricePerNight: 8000 },
    { name: `${destination} Palace Hotel`, pricePerNight: 6500 },
    { name: `Budget Stay ${destination}`, pricePerNight: 3500 }
  ];
}

function generateMockItinerary(destination: string, tags: string[], duration: number = 3) {
  const isBeach = tags.includes('beach');
  const isMountain = tags.includes('mountains') || tags.includes('hiking');
  const isCity = tags.includes('city');
  const isAdventure = tags.includes('adventure');

  if (isBeach) {
    const baseItinerary = [
      {
        day: 1,
        title: "Beach Day & Arrival",
        activities: [
          { time: "10:00 AM", name: "Check-in to hotel", description: "Get settled and freshen up" },
          { time: "2:00 PM", name: `${destination} Beach`, description: "Relax on the pristine sands" },
          { time: "7:00 PM", name: "Sunset Dinner", description: "Beachside dining with ocean views" }
        ]
      },
      {
        day: 2,
        title: "Water Activities",
        activities: [
          { time: "9:00 AM", name: "Water Sports", description: "Snorkeling and diving" },
          { time: "1:00 PM", name: "Beach Lunch", description: "Fresh seafood and local cuisine" },
          { time: "4:00 PM", name: "Beach Walk", description: "Explore coastal areas" }
        ]
      }
    ];
    
    // Add middle days if duration > 3
    for (let i = 3; i < duration; i++) {
      baseItinerary.push({
        day: i,
        title: `Beach Adventure Day ${i - 1}`,
        activities: [
          { time: "9:00 AM", name: "Morning Beach", description: "Start your day by the ocean" },
          { time: "1:00 PM", name: "Local Exploration", description: "Discover hidden gems" },
          { time: "6:00 PM", name: "Evening Relaxation", description: "Unwind and enjoy the sunset" }
        ]
      });
    }
    
    // Final day
    baseItinerary.push({
      day: duration,
      title: "Cultural & Departure",
      activities: [
        { time: "9:00 AM", name: "Local Culture", description: "Visit local markets and temples" },
        { time: "12:00 PM", name: "Check-out", description: "Pack up and prepare for departure" },
        { time: "3:00 PM", name: "Departure", description: "Head to airport" }
      ]
    });
    
    return baseItinerary;
  } else if (isMountain) {
    return [
      {
        day: 1,
        title: "Mountain Arrival",
        activities: [
          { time: "10:00 AM", name: "Check-in to lodge", description: "Mountain lodge accommodation" },
          { time: "2:00 PM", name: "Easy Hiking Trail", description: "Acclimatization hike" },
          { time: "7:00 PM", name: "Mountain Dinner", description: "Traditional mountain cuisine" }
        ]
      },
      {
        day: 2,
        title: "Adventure Day",
        activities: [
          { time: "6:00 AM", name: "Sunrise Trek", description: "Watch sunrise from peak" },
          { time: "12:00 PM", name: "Mountain Lunch", description: "Packed lunch with views" },
          { time: "4:00 PM", name: "Nature Walk", description: "Explore mountain flora and fauna" }
        ]
      },
      {
        day: 3,
        title: "Final Exploration",
        activities: [
          { time: "9:00 AM", name: "Local Village", description: "Visit mountain communities" },
          { time: "12:00 PM", name: "Check-out", description: "Prepare for departure" },
          { time: "3:00 PM", name: "Departure", description: "Return journey" }
        ]
      }
    ];
  } else if (isCity) {
    return [
      {
        day: 1,
        title: "City Arrival",
        activities: [
          { time: "10:00 AM", name: "Hotel Check-in", description: "Downtown accommodation" },
          { time: "2:00 PM", name: "City Tour", description: "Famous landmarks and attractions" },
          { time: "7:00 PM", name: "Fine Dining", description: "Local cuisine experience" }
        ]
      },
      {
        day: 2,
        title: "Culture & Shopping",
        activities: [
          { time: "9:00 AM", name: "Museums", description: "Art and history museums" },
          { time: "1:00 PM", name: "Local Market", description: "Shopping and street food" },
          { time: "4:00 PM", name: "City Views", description: "Observation deck or scenic spots" }
        ]
      },
      {
        day: 3,
        title: "Final Exploration",
        activities: [
          { time: "9:00 AM", name: "Local Neighborhoods", description: "Explore authentic areas" },
          { time: "12:00 PM", name: "Check-out", description: "Prepare for departure" },
          { time: "3:00 PM", name: "Departure", description: "Head to airport" }
        ]
      }
    ];
  } else {
    // Default itinerary - dynamic duration
    const baseItinerary = [
      {
        day: 1,
        title: "Arrival & Exploration",
        activities: [
          { time: "10:00 AM", name: "Check-in", description: "Get settled in accommodation" },
          { time: "2:00 PM", name: `Explore ${destination}`, description: "Main attractions and overview" },
          { time: "7:00 PM", name: "Welcome Dinner", description: "Try local specialties" }
        ]
      }
    ];
    
    // Add middle days
    for (let i = 2; i < duration; i++) {
      baseItinerary.push({
        day: i,
        title: `Adventure Day ${i - 1}`,
        activities: [
          { time: "9:00 AM", name: "Morning Activity", description: "Discover local attractions" },
          { time: "1:00 PM", name: "Local Lunch", description: "Authentic local cuisine" },
          { time: "4:00 PM", name: "Cultural Experience", description: "Local traditions and customs" }
        ]
      });
    }
    
    // Final day
    baseItinerary.push({
      day: duration,
      title: "Final Day",
      activities: [
        { time: "9:00 AM", name: "Last-minute Exploration", description: "Final sightseeing" },
        { time: "12:00 PM", name: "Check-out", description: "Pack and prepare for departure" },
        { time: "3:00 PM", name: "Departure", description: "Journey home" }
      ]
    });
    
    return baseItinerary;
  }
}

// Try both regular OpenAI and Azure OpenAI
const OPENAI_API_KEY = process.env.OPENAI_API_KEY;
const AZURE_OPENAI_ENDPOINT = process.env.AZURE_OPENAI_ENDPOINT;
const AZURE_OPENAI_API_VERSION = process.env.AZURE_OPENAI_API_VERSION;
const AZURE_OPENAI_API_KEY = process.env.AZURE_OPENAI_API_KEY;
const AZURE_OPENAI_MODEL = process.env.AZURE_OPENAI_MODEL;

// Check if we have configuration for either regular OpenAI or Azure OpenAI
const hasOpenAIConfig = OPENAI_API_KEY;
const hasAzureConfig = AZURE_OPENAI_ENDPOINT && AZURE_OPENAI_API_VERSION && AZURE_OPENAI_API_KEY && AZURE_OPENAI_MODEL;

// Initialize OpenAI client
let client: OpenAI | null = null;
let modelName = "gpt-3.5-turbo";

if (hasOpenAIConfig) {
  // Use regular OpenAI
  client = new OpenAI({
    apiKey: OPENAI_API_KEY,
  });
  modelName = "gpt-3.5-turbo";
} else if (hasAzureConfig) {
  // Use Azure OpenAI
  client = new OpenAI({
    apiKey: AZURE_OPENAI_API_KEY,
    baseURL: `${AZURE_OPENAI_ENDPOINT}/openai/deployments/${AZURE_OPENAI_MODEL}`,
    defaultQuery: { 'api-version': AZURE_OPENAI_API_VERSION },
    defaultHeaders: { 'api-key': AZURE_OPENAI_API_KEY },
  });
  modelName = AZURE_OPENAI_MODEL!;
}

export async function POST(req: NextRequest) {
  try {
    const { prompt } = await req.json();

    if (!prompt) {
      return NextResponse.json({ error: "Missing prompt" }, { status: 400 });
    }

    // If neither OpenAI nor Azure OpenAI is configured, return a dynamic mock response
    if ((!hasOpenAIConfig && !hasAzureConfig) || !client) {
      console.log("OpenAI not configured, generating dynamic mock data based on user input");
      
      // Generate relevant destinations based on user prompt
      const mockDestinations = generateMockDestinations(prompt);
      
      const chosen = mockDestinations[0]?.name || "Goa";
      const flights = MOCK_FLIGHTS[chosen] ?? generateMockFlights(chosen);
      const hotels = MOCK_HOTELS[chosen] ?? generateMockHotels(chosen);
      
      // Extract duration from prompt if available
      const durationMatch = prompt.match(/(\d+)[-\s]?day/i);
      const extractedDuration = durationMatch ? parseInt(durationMatch[1]) : 3;
      
      const mockItinerary = generateMockItinerary(chosen, mockDestinations[0]?.tags || [], extractedDuration);

      const result: TPlanResponse = PlanResponse.parse({
        userQuery: prompt,
        durationDays: extractedDuration,
        budget: "medium" as const,
        themes: ["beach", "culture", "relaxation"],
        destinationOptions: mockDestinations,
        chosenDestination: chosen,
        flights,
        hotels,
        itinerary: mockItinerary,
      });

      return NextResponse.json(result);
    }

    // Ask the model for structured options first
    const system = `You are a travel planner. Extract destination options
    from a dream vacation description and propose a short plan as STRICT JSON.
    Required JSON keys: userQuery, durationDays, budget (low|medium|high),
    themes[], destinationOptions[{name,country?,summary?,tags[]}].
    
    IMPORTANT: If the prompt mentions specific duration like "3-day", "4 days", "week-long", etc., 
    extract that exact number for durationDays. Look for phrases like:
    - "X-day itinerary" or "X day trip" 
    - "Create a detailed X-day itinerary"
    - Date ranges (calculate days between dates)
    
    Only output JSON.`;

    const completion = await client.chat.completions.create({
      model: modelName,
      temperature: 0.7,
      messages: [
        { role: "system", content: system },
        { role: "user", content: prompt }
      ],
      response_format: { type: "json_object" }
    });

    const draft = JSON.parse(completion.choices[0].message.content || "{}") as Partial<TPlanResponse>;

    // Pick first destination (you could let the user choose on the UI)
    const chosen = draft.destinationOptions?.[0]?.name || "Goa";
    const flights = MOCK_FLIGHTS[chosen] ?? [];
    const hotels = MOCK_HOTELS[chosen] ?? [];

    // Get an itinerary for the chosen destination (day-by-day)
    const itinerarySystem = `Create a ${draft.durationDays || 3}-day
    itinerary for ${chosen} optimized for themes ${
      (draft.themes || []).join(", ") || "relaxation"
    }. Output STRICT JSON array: [{day:number,title:string,activities:
    [{time,name,description?,lat?,lng?}]}]. No extra text.

    IMPORTANT: Wrap the JSON array in a JSON object with a key 'itinerary'.
    Example: { "itinerary": [...] }`;

    const itinResp = await client.chat.completions.create({
      model: modelName,
      temperature: 0.7,
      messages: [ { role: "system", content: itinerarySystem } ],
      response_format: { type: "json_object" }
    });

    // Parse the object and extract the itinerary array
    const itinData = JSON.parse(itinResp.choices[0].message.content || "{}");
    const itinerary = itinData.itinerary || [];

    const result: TPlanResponse = PlanResponse.parse({
      userQuery: draft.userQuery || prompt,
      durationDays: draft.durationDays || 3,
      budget: draft.budget || "medium",
      themes: draft.themes || [],
      destinationOptions: draft.destinationOptions || [{ name: chosen }],
      chosenDestination: chosen,
      flights,
      hotels,
      itinerary,
    });

    return NextResponse.json(result);
  } catch (err: any) {
    console.error(err);
    return NextResponse.json({ error: err?.message || "Server error" }, { status: 500 });
  }
}