import { NextRequest, NextResponse } from "next/server";

// Login to get auth token
async function getAuthToken() {
  try {
    const loginResponse = await fetch('https://qa-air-b2b.cleartrip.com/air/api/v4/login', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json',
      },
      body: JSON.stringify({
        email: "ct.hackathon@cleartrip.com",
        password: "7/Ze8@liUd",
        returnSecureToken: true,
        tenantId: "Cleartrip-2bteh"
      })
    });

    if (!loginResponse.ok) {
      throw new Error('Login failed');
    }

    const loginData = await loginResponse.json();
    return loginData.idToken;
  } catch (error) {
    console.error('Auth error:', error);
    throw error;
  }
}

// Airport codes mapping
const airportCodes: { [key: string]: string } = {
  'mumbai': 'BOM',
  'delhi': 'DEL', 
  'bangalore': 'BLR',
  'chennai': 'MAA',
  'kolkata': 'CCU',
  'hyderabad': 'HYD',
  'pune': 'PNQ',
  'goa': 'GOI',
  'jaipur': 'JAI',
  'kochi': 'COK',
  'guwahati': 'GAU',
  'bhubaneswar': 'BBI',
  'indore': 'IDR',
  'coimbatore': 'CJB',
  'chandigarh': 'IXC',
  'lucknow': 'LKO',
  'patna': 'PAT',
  'varanasi': 'VNS',
  'srinagar': 'SXR',
  'dehradun': 'DED',
  'andaman and nicobar islands': 'IXZ', // Port Blair
  'port blair': 'IXZ',
  'maldives': 'MLE',
  'bali': 'DPS',
  'santorini': 'JTR',
  'swiss alps': 'ZUR', // Zurich
  'himalayas': 'KTM', // Kathmandu
  'rocky mountains': 'DEN', // Denver
  'tokyo': 'NRT',
  'paris': 'CDG',
  'new york': 'JFK',
  'kenya': 'NBO', // Nairobi
  'costa rica': 'SJO', // San Jose
  'new zealand': 'AKL', // Auckland
  'thailand': 'BKK', // Bangkok
  'italy': 'FCO', // Rome
  'australia': 'SYD' // Sydney
};

function getAirportCode(city: string): string {
  const normalizedCity = city.toLowerCase().trim();
  return airportCodes[normalizedCity] || 'DEL'; // Default to Delhi
}

// Handle date format - if already DD/MM/YYYY, return as is, otherwise convert from YYYY-MM-DD
function formatDate(dateString: string): string {
  // Check if already in DD/MM/YYYY format
  if (dateString.includes('/') && dateString.match(/^\d{2}\/\d{2}\/\d{4}$/)) {
    return dateString; // Already in correct format
  }
  
  // Convert from YYYY-MM-DD to DD/MM/YYYY
  const date = new Date(dateString);
  const day = date.getDate().toString().padStart(2, '0');
  const month = (date.getMonth() + 1).toString().padStart(2, '0');
  const year = date.getFullYear();
  return `${day}/${month}/${year}`;
}

export async function POST(request: NextRequest) {
  try {
    const { origin, destination, startDate, endDate, preference } = await request.json();
    
    console.log("Flight API received:", { origin, destination, startDate, endDate, preference }); // Debug log

    // Get auth token
    const authToken = await getAuthToken();

    // Convert city names to airport codes
    const originCode = getAirportCode(origin);
    const destinationCode = getAirportCode(destination);
    
    console.log("Airport code conversion:", { 
      originalOrigin: origin, 
      originCode, 
      originalDestination: destination, 
      destinationCode 
    }); // Debug log

    // Format dates
    const formattedStartDate = formatDate(startDate);
    const formattedEndDate = formatDate(endDate);
    
    console.log("Date formatting:", { 
      originalStartDate: startDate, 
      formattedStartDate, 
      originalEndDate: endDate, 
      formattedEndDate 
    }); // Debug log

    // Prepare search request
    const searchRequest = {
      searchCriteria: {
        sellingCountryCode: "IN",
        sellingCurrencyCode: "INR",
        maxRequiredFlightOptions: preference === "cheapest" ? 1000 : 500,
        fareLimitingStrategyList: [
          "PRICE"
        ],
        flightOptionFilter: [],
        responseVersion: "VERSION_V6",
        fareTypes: [
          "RETAIL"
        ]
      },
      searchIntents: {
        sectors: [
          {
            index: 1,
            origin: originCode,
            destination: destinationCode,
            departDate: formattedStartDate,
            cabinType: "ECONOMY",
            paxInfos: [
              {
                paxType: "ADT",
                paxCount: 1,
                paxFareType: "DEFAULT"
              }
            ]
          },
          {
            index: 2,
            origin: destinationCode,
            destination: originCode,
            departDate: formattedEndDate,
            cabinType: "ECONOMY",
            paxInfos: [
              {
                paxType: "ADT",
                paxCount: 1,
                paxFareType: "DEFAULT"
              }
            ]
          }
        ]
      }
    };

    console.log("Sending to Cleartrip API:", JSON.stringify(searchRequest, null, 2)); // Debug log
    
    // Search for flights
    const searchResponse = await fetch('https://qa-air-b2b.cleartrip.com/air/api/v4/search', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${authToken}`,
      },
      body: JSON.stringify(searchRequest)
    });

    if (!searchResponse.ok) {
      throw new Error('Flight search failed');
    }

    const searchData = await searchResponse.json();
    
    // Process and filter flights
    let flights = [];
    
    if (searchData.searchResults && searchData.searchResults.length > 0) {
      const flightOptions = searchData.searchResults[0].flightOptions || [];
      
      // Sort based on preference
      const sortedFlights = flightOptions.sort((a: any, b: any) => {
        if (preference === "cheapest") {
          // Sort by price (lowest first)
          return (a.pricing?.totalPrice || 0) - (b.pricing?.totalPrice || 0);
        } else {
          // Sort by good timing (avoid early morning and late night)
          const aTime = new Date(`1970/01/01 ${a.legs?.[0]?.segments?.[0]?.departTime || '12:00'}`).getHours();
          const bTime = new Date(`1970/01/01 ${b.legs?.[0]?.segments?.[0]?.departTime || '12:00'}`).getHours();
          
          // Prefer flights between 8 AM and 8 PM
          const aScore = (aTime >= 8 && aTime <= 20) ? 0 : 1;
          const bScore = (bTime >= 8 && bTime <= 20) ? 0 : 1;
          
          if (aScore !== bScore) return aScore - bScore;
          return (a.pricing?.totalPrice || 0) - (b.pricing?.totalPrice || 0);
        }
      });

      // Get top 3 flights
      flights = sortedFlights.slice(0, 3).map((flight: any) => ({
        id: flight.id,
        airline: flight.legs?.[0]?.segments?.[0]?.marketingAirline?.name || 'Airlines',
        flightNumber: flight.legs?.[0]?.segments?.[0]?.flightNumber || 'N/A',
        departTime: flight.legs?.[0]?.segments?.[0]?.departTime || 'N/A',
        arrivalTime: flight.legs?.[0]?.segments?.[0]?.arrivalTime || 'N/A',
        duration: flight.legs?.[0]?.duration || 'N/A',
        price: flight.pricing?.totalPrice || 0,
        currency: flight.pricing?.currency || 'INR',
        stops: (flight.legs?.[0]?.segments?.length || 1) - 1,
        from: originCode,
        to: destinationCode,
        returnDepartTime: flight.legs?.[1]?.segments?.[0]?.departTime || 'N/A',
        returnArrivalTime: flight.legs?.[1]?.segments?.[0]?.arrivalTime || 'N/A'
      }));
    }

    return NextResponse.json({
      success: true,
      flights: flights,
      preference: preference,
      searchCriteria: {
        origin: originCode,
        destination: destinationCode,
        startDate: formattedStartDate,
        endDate: formattedEndDate
      }
    });

  } catch (error) {
    console.error('Flight API error:', error);
    
    // Return mock data in case of API failure
    const mockFlights = [
      {
        id: 'mock-1',
        airline: 'IndiGo',
        flightNumber: '6E-431',
        departTime: '07:00',
        arrivalTime: '09:30',
        duration: '2h 30m',
        price: 4500,
        currency: 'INR',
        stops: 0,
        from: 'DEL',
        to: 'BOM',
        returnDepartTime: '18:00',
        returnArrivalTime: '20:30'
      },
      {
        id: 'mock-2',
        airline: 'Air India',
        flightNumber: 'AI-131',
        departTime: '14:00',
        arrivalTime: '16:45',
        duration: '2h 45m',
        price: 6200,
        currency: 'INR',
        stops: 0,
        from: 'DEL',
        to: 'BOM',
        returnDepartTime: '12:00',
        returnArrivalTime: '14:45'
      },
      {
        id: 'mock-3',
        airline: 'SpiceJet',
        flightNumber: 'SG-8709',
        departTime: '20:15',
        arrivalTime: '22:50',
        duration: '2h 35m',
        price: 3800,
        currency: 'INR',
        stops: 0,
        from: 'DEL',
        to: 'BOM',
        returnDepartTime: '16:30',
        returnArrivalTime: '19:05'
      }
    ];

    return NextResponse.json({
      success: false,
      error: 'Flight search service temporarily unavailable',
      flights: mockFlights,
      isMockData: true
    });
  }
} 