"use client";
import { useState, useRef, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Search, MapPin, Plane, Hotel, Calendar, Clock, AlertCircle, Star, ArrowRight, Filter, Eye, DollarSign, Navigation, ThumbsUp, ThumbsDown, Edit, BookOpen, MessageCircle } from "lucide-react";
import ConversationBubble, { OptionButton } from "@/components/ConversationBubble";
import DestinationCard from "@/components/DestinationCard";
import Itinerary from "@/components/Itinerary";
import type { TPlanResponse } from "@/lib/schema";

type ConversationStep = "start" | "location" | "planning" | "options" | "destinations" | "destinations_feedback" | "filters" | "flight_dates" | "flight_preference" | "itinerary" | "itinerary_feedback" | "modify_itinerary" | "booking_options" | "flights" | "hotels";

export default function Home() {
  const [input, setInput] = useState("");
  const [userLocation, setUserLocation] = useState("");
  const [loading, setLoading] = useState(false);
  
  // Refs for auto-scrolling and focusing
  const chatContainerRef = useRef<HTMLDivElement>(null);
  const startDateRef = useRef<HTMLInputElement>(null);
  const endDateRef = useRef<HTMLInputElement>(null);
  const [plan, setPlan] = useState<TPlanResponse | null>(null);
  const [currentStep, setCurrentStep] = useState<ConversationStep>("start");
  const [error, setError] = useState<string | null>(null);
  const [conversationHistory, setConversationHistory] = useState<Array<{
    type: 'user' | 'bot';
    content: React.ReactNode;
    timestamp: Date;
  }>>([]);
  const [modificationText, setModificationText] = useState("");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [tripDuration, setTripDuration] = useState<number>(3); // Store calculated duration
  const [flightPreference, setFlightPreference] = useState<"cheapest" | "good_timing" | null>(null);
  const [flights, setFlights] = useState<any[]>([]);

  // Auto-scroll and focus when date fields appear
  useEffect(() => {
    if (currentStep === "flight_dates") {
      // Scroll to bottom of chat and focus on start date
      setTimeout(() => {
        if (chatContainerRef.current) {
          chatContainerRef.current.scrollTop = chatContainerRef.current.scrollHeight;
        }
        if (startDateRef.current) {
          startDateRef.current.focus();
        }
      }, 100);
    }
  }, [currentStep]);

  async function generate() {
    if (!input.trim() || !userLocation.trim()) return;
    
    setLoading(true);
    setPlan(null);
    setError(null);
    
    // Add user message to conversation
    addToConversation('user', input);
    setCurrentStep("planning");
    
    try {
      // Enhanced prompt with location
      const enhancedPrompt = `${input}. I'm traveling from ${userLocation}.`;

      const res = await fetch("/api/plan", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ prompt: enhancedPrompt })
      });
      const data: TPlanResponse | {error:string} = await res.json();
      if ((data as any).error) throw new Error((data as any).error);
      
      setPlan(data as TPlanResponse);
      setCurrentStep("options");
      
      // Add bot response with options
      addToConversation('bot', 
        <div className="space-y-3">
          <p>Amazing! I've crafted the perfect travel plan from <strong>{userLocation}</strong>! 🎉</p>
          <p>Found <strong>{(data as TPlanResponse).destinationOptions.length} incredible destinations</strong> with best times to visit, flights, and detailed itineraries!</p>
          <p>What would you like to explore first?</p>
        </div>
      );
      
    } catch (e: any) {
      setError(e.message || "Failed to generate plan");
      addToConversation('bot', 
        <div className="text-red-600">
          <p>Oops! I encountered an issue: {e.message || "Failed to generate plan"}</p>
          <p>Let's try again! Please check your details and try once more.</p>
        </div>
      );
    } finally { 
      setLoading(false); 
    }
  }

  function addToConversation(type: 'user' | 'bot', content: React.ReactNode) {
    setConversationHistory(prev => [...prev, {
      type,
      content,
      timestamp: new Date()
    }]);
  }

  function handleLocationSubmit() {
    const trimmedLocation = userLocation.trim();
    if (!trimmedLocation || trimmedLocation.length < 3) {
      return;
    }
    
    setCurrentStep("location");
    addToConversation('user', `I'm starting my dreamcation from ${userLocation}`);
    addToConversation('bot', 
      <div className="space-y-3">
        <p>Perfect! <strong>{userLocation}</strong> is an amazing starting point! ✈️</p>
        <p>Now tell me about your dream vacation!</p>
      </div>
    );
  }



  function selectDestination(name: string) {
    if (!plan) return;
    setPlan({ ...plan, chosenDestination: name });
    
    addToConversation('user', `I want to explore ${name}`);
    addToConversation('bot', 
      <div className="space-y-2">
        <p>Fantastic choice! <strong>{name}</strong> is absolutely magical! ✨</p>
        <p>Before I create your detailed itinerary, when would you like to travel?</p>
      </div>
    );
    
    setCurrentStep("flight_dates");
  }

  function showDestinations() {
    setCurrentStep("destinations");
    addToConversation('user', "Show me the destination options");
    addToConversation('bot', 
      <div className="space-y-2">
        <p>Here are perfect destinations with best times to visit! 🎯</p>
        <p>Click on any destination to see the detailed itinerary, or let me know if you'd like different options!</p>
      </div>
    );
  }

  function showDestinationsFeedback() {
    addToConversation('bot', 
      <div className="space-y-2">
        <p>How do these destinations look? 😊</p>
        <p>Are you excited about any of these, or would you like me to suggest different options?</p>
      </div>
    );
    setCurrentStep("destinations_feedback");
  }

  function handleDestinationsFeedback(satisfied: boolean) {
    if (satisfied) {
      addToConversation('user', "These destinations look great!");
      addToConversation('bot', 
        <p>Wonderful! Click on any destination to explore detailed itineraries! ✨</p>
      );
      setCurrentStep("destinations");
    } else {
      addToConversation('user', "I'd like to see different destination options");
      addToConversation('bot', 
        <div className="space-y-2">
          <p>No problem at all! Let me find some different amazing places for you! 🌍</p>
          <p>What type of destinations would you prefer instead?</p>
        </div>
      );
    }
  }

  function showItineraryFeedback() {
    setCurrentStep("itinerary_feedback");
    addToConversation('bot', 
      <div className="space-y-2">
        <p>How does this itinerary look? 😊</p>
        <p>I can help you book or modify anything!</p>
      </div>
    );
  }

  function handleItineraryApproval(approved: boolean) {
    if (approved) {
      setCurrentStep("booking_options");
      addToConversation('user', "I love this itinerary!");
      addToConversation('bot', 
        <div className="space-y-2">
          <p>Wonderful! Let's make this dream a reality! 🎉</p>
          <p>Ready to book flights and hotels?</p>
        </div>
      );
    } else {
      addToConversation('user', "I'd like to modify the itinerary");
      addToConversation('bot', 
        <div className="space-y-2">
          <p>No problem! I'd love to customize it for you! 🛠️</p>
          <p>What would you like to change?</p>
        </div>
      );
      setCurrentStep("modify_itinerary");
    }
  }

  function handleModificationSubmit() {
    if (!modificationText.trim()) return;
    
    addToConversation('user', modificationText);
    addToConversation('bot', 
      <div className="space-y-2">
        <p>Perfect! I understand you'd like to: "<strong>{modificationText}</strong>"</p>
        <p>Let me update your itinerary with these changes! ✨</p>
      </div>
    );
    
    // Clear the modification text and go back to itinerary feedback
    setModificationText("");
    setCurrentStep("itinerary_feedback");
  }

  function handleDateSubmit() {
    if (!startDate || !endDate) return;
    
    // Calculate number of days
    const start = new Date(startDate);
    const end = new Date(endDate);
    const days = Math.ceil((end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24));
    
    if (days <= 0) {
      alert('End date must be after start date');
      return;
    }
    
    // Store the calculated duration
    setTripDuration(days);
    
    addToConversation('user', `I want to travel from ${startDate} to ${endDate}`);
    addToConversation('bot', 
      <div className="space-y-2">
        <p>Perfect! A <strong>{days}-day</strong> trip from {new Date(startDate).toLocaleDateString()} to {new Date(endDate).toLocaleDateString()}! 🗓️</p>
        <p>For flights, what's more important to you?</p>
      </div>
    );
    
    setCurrentStep("flight_preference");
  }

  function handleFlightPreference(preference: "cheapest" | "good_timing") {
    setFlightPreference(preference);
    const preferenceText = preference === "cheapest" ? "cheapest flights available" : "good timing flights avoiding off-hours";
    
    addToConversation('user', `I prefer ${preferenceText}`);
    addToConversation('bot', 
      <div className="space-y-2">
        <p>Great choice! Let me find the best {preference === "cheapest" ? "budget-friendly" : "well-timed"} flights and create your itinerary! ✈️</p>
        <p>Searching for flights from <strong>{userLocation}</strong> to <strong>{plan?.chosenDestination}</strong>...</p>
      </div>
    );
    
    // Search for flights and then show itinerary
    searchFlights();
  }

  async function searchFlights() {
    setLoading(true);
    try {
      // First, search for flights
      const response = await fetch('/api/flights', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          origin: userLocation,
          destination: plan?.chosenDestination,
          startDate: startDate,
          endDate: endDate,
          preference: flightPreference
        }),
      });
      
      const flightData = await response.json();
      setFlights(flightData.flights || []);
      
      // Now regenerate the itinerary with the correct duration
      if (plan?.chosenDestination) {
        const updatedPrompt = `Create a detailed ${tripDuration}-day itinerary for ${plan.chosenDestination}. I'm traveling from ${userLocation} from ${new Date(startDate).toLocaleDateString()} to ${new Date(endDate).toLocaleDateString()}. ${input}`;
        
        const planResponse = await fetch("/api/plan", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ prompt: updatedPrompt })
        });
        
        if (planResponse.ok) {
          const updatedPlan = await planResponse.json();
          // Update the plan with correct duration and itinerary
          setPlan({
            ...plan,
            durationDays: tripDuration,
            itinerary: updatedPlan.itinerary || plan.itinerary
          });
        }
      }
      
      addToConversation('bot', 
        <div className="space-y-2">
          <p>Found amazing {flightPreference === "cheapest" ? "budget-friendly" : "well-timed"} flight options for you! ✈️</p>
          <p>Here's your complete {tripDuration}-day itinerary with the best flights for your preference:</p>
        </div>
      );
      
      setCurrentStep("itinerary");
      
      // Auto-trigger feedback after showing itinerary
      setTimeout(() => showItineraryFeedback(), 3000);
      
    } catch (error) {
      console.error('Error searching flights:', error);
      addToConversation('bot', 
        <div className="space-y-2">
          <p>I'll show you the {tripDuration}-day itinerary while I continue searching for the best {flightPreference === "cheapest" ? "budget-friendly" : "well-timed"} flights! 🛫</p>
          <p className="text-sm text-gray-600">Flight search is taking longer than expected, but I'll keep looking for great options.</p>
        </div>
      );
      setCurrentStep("itinerary");
      setTimeout(() => showItineraryFeedback(), 3000);
    } finally {
      setLoading(false);
    }
  }

  function showFilters() {
    setCurrentStep("filters");
    addToConversation('user', "Show me filter options");
    addToConversation('bot', 
      <p>Let me help you find exactly what you're looking for! 🎛️</p>
    );
  }

  const samplePrompts = [
    "Beach vacation with water sports, 5 days, moderate budget",
    "Royal palaces and culture, 3 days, luxury experience", 
    "Mountain adventure and trekking, 4 days, budget-friendly"
  ];

  // Enhanced destination data
  const getDestinationInfo = (name: string) => {
    const destInfo: Record<string, { bestTime: string; catchyPhrase: string; weather: string }> = {
      'Goa': { 
        bestTime: "Nov - Feb", 
        catchyPhrase: "Sun, sand, and sensational seafood!", 
        weather: "Perfect beach weather with gentle breeze" 
      },
      'Mysore': { 
        bestTime: "Oct - Mar", 
        catchyPhrase: "Royal heritage meets modern charm!", 
        weather: "Pleasant climate ideal for sightseeing" 
      },
      'Rajasthan': { 
        bestTime: "Oct - Mar", 
        catchyPhrase: "Where every palace tells a story!", 
        weather: "Cool desert evenings and golden sunrises" 
      },
      'Himachal': { 
        bestTime: "Apr - Jun, Sep - Nov", 
        catchyPhrase: "Breathtaking mountains and pure adventure!", 
        weather: "Crisp mountain air and stunning views" 
      },
    };
    return destInfo[name] || { 
      bestTime: "Year-round", 
      catchyPhrase: "An amazing destination awaits!", 
      weather: "Great weather for exploration" 
    };
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-orange-50 via-red-50 to-pink-50">
      {/* Hero Section - Only shown initially */}
      {currentStep === "start" && (
        <section className="hero-section relative flex items-center justify-center text-center text-white min-h-screen">
          <div 
            className="absolute inset-0 bg-cover bg-center"
            style={{
              backgroundImage: `linear-gradient(rgba(0,0,0,0.4), rgba(0,0,0,0.3)), url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 1200 800'%3E%3Cdefs%3E%3ClinearGradient id='tropical' x1='0%25' y1='0%25' x2='100%25' y2='100%25'%3E%3Cstop offset='0%25' style='stop-color:%23ff6b35;stop-opacity:0.8'/%3E%3Cstop offset='50%25' style='stop-color:%233742fa;stop-opacity:0.6'/%3E%3Cstop offset='100%25' style='stop-color:%23ff4757;stop-opacity:0.8'/%3E%3C/linearGradient%3E%3C/defs%3E%3Crect width='1200' height='800' fill='url(%23tropical)'/%3E%3Cpath d='M0,400 Q300,200 600,400 T1200,400 L1200,800 L0,800 Z' fill='%23ffffff' fill-opacity='0.1'/%3E%3C/svg%3E")`
            }}
          />
          
          <div className="relative z-10 container px-4 py-20">
            <motion.div
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8 }}
              className="max-w-4xl mx-auto"
            >
              <h1 className="text-4xl md:text-6xl font-bold mb-4">
                Your Dream Vacation<br />
                <span className="text-orange-300">Starts Here</span>
              </h1>
              <p className="text-xl md:text-2xl mb-8 text-gray-100">
                Where do you want to start your dreamcation from?
              </p>
              
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.8, delay: 0.3 }}
                className="max-w-2xl mx-auto space-y-4"
              >
                <div className="relative">
                  <Navigation className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                  <input 
                    className="w-full pl-12 pr-4 py-4 border-2 border-white/30 rounded-2xl bg-white/90 backdrop-blur-sm focus:ring-2 focus:ring-orange-500 focus:border-orange-500 text-gray-700 text-lg placeholder-gray-500"
                    placeholder="e.g., Mumbai, Delhi, Bangalore, Chennai..."
                    value={userLocation} 
                    onChange={e=>setUserLocation(e.target.value)} 
                    onKeyPress={e => {
                      if (e.key === 'Enter' && userLocation.trim().length >= 3) {
                        handleLocationSubmit();
                      }
                    }}
                  />
                </div>
                
                <motion.button 
                  disabled={!userLocation.trim() || userLocation.trim().length < 3} 
                  onClick={handleLocationSubmit}
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  className="w-full bg-gradient-to-r from-orange-500 to-red-500 text-white py-4 px-6 rounded-2xl font-semibold text-lg disabled:opacity-50 hover:shadow-lg transition-all duration-200"
                >
                  <Navigation className="w-5 h-5 inline mr-2" />
                  Let's Start Planning!
                </motion.button>
              </motion.div>
            </motion.div>
          </div>
        </section>
      )}

                           {/* Main Split Layout */}
       {currentStep !== "start" && (
         <div className="min-h-screen flex">
           {/* Left Panel - Results & Suggestions */}
           <div className="flex-1 lg:w-1/2 bg-gray-50">
             <div className="h-full overflow-y-auto">
               <div className="p-6">
                 <div className="text-center mb-6">
                   <h2 className="text-2xl font-bold text-gray-800">Your Travel Options</h2>
                   <p className="text-gray-600">Explore destinations, itineraries & flights</p>
                 </div>

                 {/* Results Display */}
                 <AnimatePresence>
                   {/* Default State */}
                   {!["destinations", "itinerary", "itinerary_feedback", "modify_itinerary", "flights", "filters"].includes(currentStep) && (
                     <motion.div
                       initial={{ opacity: 0, y: 20 }}
                       animate={{ opacity: 1, y: 0 }}
                       className="text-center py-16"
                     >
                       <div className="w-20 h-20 bg-gradient-to-r from-orange-500 to-red-500 rounded-full flex items-center justify-center mx-auto mb-6">
                         <MessageCircle className="w-10 h-10 text-white" />
                       </div>
                       <h3 className="text-xl font-bold text-gray-800 mb-2">
                         Ready to Plan!
                       </h3>
                       <p className="text-gray-600 max-w-md mx-auto">
                         Use the chat on the right to describe your dream vacation and I'll show amazing options here!
                       </p>
                     </motion.div>
                   )}

                   {/* Destinations Display */}
                   {currentStep === "destinations" && plan && (
                     <motion.div 
                       initial={{ opacity: 0, y: 30 }}
                       animate={{ opacity: 1, y: 0 }}
                       exit={{ opacity: 0, y: -30 }}
                       transition={{ duration: 0.6 }}
                     >
                       <div className="text-center mb-6">
                         <h3 className="text-xl font-bold text-gray-800 mb-2">Perfect Destinations for You</h3>
                         <p className="text-gray-600">Amazing places that match your preferences</p>
                       </div>
                       
                       <div className="grid gap-6">
                         {plan.destinationOptions.map((destination, i) => {
                           const destInfo = getDestinationInfo(destination.name);
                           return (
                             <motion.div
                               key={i}
                               initial={{ opacity: 0, y: 30 }}
                               animate={{ opacity: 1, y: 0 }}
                               transition={{ duration: 0.5, delay: i * 0.2 }}
                               className="space-y-4"
                             >
                               <DestinationCard 
                                 name={destination.name} 
                                 summary={`${destination.summary} • ${destInfo.catchyPhrase}`}
                                 tags={[...destination.tags || [], `Best: ${destInfo.bestTime}`]}
                                 onSelect={() => selectDestination(destination.name)} 
                               />
                               <div className="bg-white rounded-xl p-4 shadow-sm border border-orange-100">
                                 <div className="flex items-center justify-between">
                                   <div className="flex items-center gap-2">
                                     <Calendar className="w-4 h-4 text-orange-500" />
                                     <span className="text-sm font-medium text-gray-700">Best Time: {destInfo.bestTime}</span>
                                   </div>
                                   <div className="text-sm text-gray-600">{destInfo.weather}</div>
                                 </div>
                               </div>
                             </motion.div>
                           );
                         })}
                       </div>
                     </motion.div>
                   )}

                   {/* Itinerary Display */}
                   {(currentStep === "itinerary" || currentStep === "itinerary_feedback" || currentStep === "modify_itinerary") && plan?.chosenDestination && plan.itinerary && (
                     <motion.div 
                       initial={{ opacity: 0, y: 30 }}
                       animate={{ opacity: 1, y: 0 }}
                       transition={{ duration: 0.6 }}
                     >
                       <div className="text-center mb-6">
                         <h3 className="text-xl font-bold text-gray-800 mb-2">Your {plan.chosenDestination} Itinerary</h3>
                         <p className="text-gray-600">
                           {currentStep === "modify_itinerary" ? "Review and modify your trip details" : "Day-by-day guide to make the most of your trip"}
                         </p>
                       </div>
                       <Itinerary days={plan.itinerary as any} />
                     </motion.div>
                   )}

                                      {/* Flights Display */}
                  {(currentStep === "flights" || (currentStep === "itinerary" && flights.length > 0)) && (
                    <motion.div 
                      initial={{ opacity: 0, y: 30 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ duration: 0.6 }}
                    >
                      <div className="text-center mb-6">
                        <h3 className="text-xl font-bold text-gray-800 mb-2">
                          {flightPreference === "cheapest" ? "💰 Cheapest Flight Options" : "⏰ Best Timed Flights"}
                        </h3>
                        <p className="text-gray-600">
                          From {userLocation} to {plan?.chosenDestination} | {startDate && endDate ? `${new Date(startDate).toLocaleDateString()} to ${new Date(endDate).toLocaleDateString()}` : 'Dates TBD'}
                        </p>
                        {flightPreference && (
                          <div className="inline-flex items-center gap-2 bg-orange-100 text-orange-800 px-3 py-1 rounded-full text-sm mt-2">
                            {flightPreference === "cheapest" ? "💰 Budget Priority" : "⏰ Timing Priority"}
                          </div>
                        )}
                      </div>

                       <div className="space-y-4">
                         {flights.length ? flights.map((flight, i) => (
                           <div key={flight.id || i} className="bg-white rounded-xl p-6 shadow-md border border-gray-200 hover:shadow-lg transition-shadow">
                             <div className="flex justify-between items-start">
                               <div className="flex-1">
                                 <div className="flex items-center gap-4 mb-4">
                                   <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
                                     <Plane className="w-5 h-5 text-blue-600" />
                                   </div>
                                   <div>
                                     <div className="font-semibold text-gray-800 text-lg">{flight.airline}</div>
                                     <div className="text-sm text-gray-600">{flight.flightNumber}</div>
                                   </div>
                                   <div className="flex gap-2">
                                     {flight.stops === 0 && (
                                       <div className="bg-green-100 text-green-800 text-xs px-2 py-1 rounded-full">
                                         Non-stop
                                       </div>
                                     )}
                                     {i === 0 && flightPreference === "cheapest" && (
                                       <div className="bg-orange-100 text-orange-800 text-xs px-2 py-1 rounded-full">
                                         💰 Best Price
                                       </div>
                                     )}
                                     {i === 0 && flightPreference === "good_timing" && (
                                       <div className="bg-blue-100 text-blue-800 text-xs px-2 py-1 rounded-full">
                                         ⏰ Best Timing
                                       </div>
                                     )}
                                   </div>
                                 </div>
                                 
                                 <div className="grid grid-cols-1 gap-4">
                                   <div>
                                     <p className="text-sm text-gray-500 mb-1">Outbound</p>
                                     <div className="flex items-center gap-2">
                                       <span className="font-medium">{flight.from}</span>
                                       <span className="text-gray-400">→</span>
                                       <span className="font-medium">{flight.to}</span>
                                     </div>
                                     <div className="text-sm text-gray-600">
                                       {flight.departTime} - {flight.arrivalTime}
                                     </div>
                                     <div className="text-xs text-gray-500">{flight.duration}</div>
                                   </div>
                                   
                                   <div>
                                     <p className="text-sm text-gray-500 mb-1">Return</p>
                                     <div className="flex items-center gap-2">
                                       <span className="font-medium">{flight.to}</span>
                                       <span className="text-gray-400">→</span>
                                       <span className="font-medium">{flight.from}</span>
                                     </div>
                                     <div className="text-sm text-gray-600">
                                       {flight.returnDepartTime} - {flight.returnArrivalTime}
                                     </div>
                                   </div>
                                 </div>
                               </div>
                               
                               <div className="text-right ml-6">
                                 <div className="text-xl font-bold text-orange-600">
                                   ₹{flight.price.toLocaleString()}
                                 </div>
                                 <div className="text-xs text-gray-600 mb-3">per person</div>
                                 <button className="bg-gradient-to-r from-orange-500 to-red-500 text-white px-4 py-2 rounded-lg text-sm font-medium hover:shadow-lg transition-all duration-200">
                                   Select Flight
                                 </button>
                               </div>
                             </div>
                           </div>
                         )) : (
                           <div className="text-center py-12 text-gray-500">
                             <Plane className="w-16 h-16 mx-auto mb-4 text-gray-300" />
                             <p className="text-lg">Searching for the best {flightPreference === "cheapest" ? "budget-friendly" : "well-timed"} flights...</p>
                             <p className="text-sm">Checking {flightPreference === "cheapest" ? "cheapest options" : "flights with good timing"} from {userLocation} to {plan?.chosenDestination}</p>
                             <div className="mt-4">
                               <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-orange-500 mx-auto"></div>
                             </div>
                           </div>
                         )}
                       </div>
                     </motion.div>
                   )}

                   {/* Filter Options Display */}
                   {currentStep === "filters" && (
                     <motion.div
                       initial={{ opacity: 0, y: 20 }}
                       animate={{ opacity: 1, y: 0 }}
                       className="space-y-6"
                     >
                       <div className="text-center mb-6">
                         <h3 className="text-xl font-bold text-gray-800 mb-2">Filter Your Options</h3>
                         <p className="text-gray-600">Find exactly what you're looking for</p>
                       </div>
                       
                       <div className="bg-white rounded-xl p-6 shadow-md">
                         <h4 className="font-medium text-gray-700 mb-4">Budget Range</h4>
                         <div className="grid grid-cols-1 gap-3">
                           <button onClick={() => {
                             addToConversation('user', "Show budget-friendly options");
                             addToConversation('bot', <p>Smart choice! Here are incredible budget-friendly options under ₹20,000! 💰</p>);
                             setCurrentStep("destinations");
                           }} className="flex items-center gap-3 w-full p-3 bg-gradient-to-r from-green-500 to-green-600 text-white rounded-lg hover:shadow-lg transition-all">
                             <DollarSign className="w-4 h-4" />
                             Budget (&lt; ₹20K)
                           </button>
                           <button onClick={() => {
                             addToConversation('user', "Show mid-range options");
                             addToConversation('bot', <p>Perfect! Here are comfortable mid-range options (₹20K-50K)! 🏖️</p>);
                             setCurrentStep("destinations");
                           }} className="flex items-center gap-3 w-full p-3 bg-gradient-to-r from-blue-500 to-blue-600 text-white rounded-lg hover:shadow-lg transition-all">
                             <DollarSign className="w-4 h-4" />
                             Mid-range (₹20K-50K)
                           </button>
                           <button onClick={() => {
                             addToConversation('user', "Show luxury options");
                             addToConversation('bot', <p>Luxury it is! Here are premium experiences above ₹50K! ✨</p>);
                             setCurrentStep("destinations");
                           }} className="flex items-center gap-3 w-full p-3 bg-gradient-to-r from-purple-500 to-purple-600 text-white rounded-lg hover:shadow-lg transition-all">
                             <DollarSign className="w-4 h-4" />
                             Luxury (&gt; ₹50K)
                           </button>
                         </div>
                       </div>
                       
                       <div className="bg-white rounded-xl p-6 shadow-md">
                         <h4 className="font-medium text-gray-700 mb-4">Trip Duration</h4>
                         <div className="grid grid-cols-1 gap-3">
                           <button onClick={() => {
                             addToConversation('user', "Show 2-3 day trips");
                             addToConversation('bot', <p>Quick getaways! Perfect 2-3 day escapes from <strong>{userLocation}</strong>! 🎒</p>);
                             setCurrentStep("destinations");
                           }} className="flex items-center gap-3 w-full p-3 bg-gradient-to-r from-orange-500 to-red-500 text-white rounded-lg hover:shadow-lg transition-all">
                             <Calendar className="w-4 h-4" />
                             2-3 Days
                           </button>
                           <button onClick={() => {
                             addToConversation('user', "Show 4-7 day trips");
                             addToConversation('bot', <p>Excellent choice! Week-long adventures give you perfect time to explore! 🌟</p>);
                             setCurrentStep("destinations");
                           }} className="flex items-center gap-3 w-full p-3 bg-gradient-to-r from-orange-500 to-red-500 text-white rounded-lg hover:shadow-lg transition-all">
                             <Calendar className="w-4 h-4" />
                             4-7 Days
                           </button>
                           <button onClick={() => {
                             addToConversation('user', "Show longer trips");
                             addToConversation('bot', <p>Extended adventures! Immersive trips longer than a week! 🌍</p>);
                             setCurrentStep("destinations");
                           }} className="flex items-center gap-3 w-full p-3 bg-gradient-to-r from-orange-500 to-red-500 text-white rounded-lg hover:shadow-lg transition-all">
                             <Calendar className="w-4 h-4" />
                             7+ Days
                           </button>
                         </div>
                       </div>
                       
                       <div className="text-center">
                         <button onClick={showDestinations} className="bg-gradient-to-r from-orange-500 to-red-500 text-white px-6 py-3 rounded-lg font-medium hover:shadow-lg transition-all">
                           <Eye className="w-4 h-4 inline mr-2" />
                           Back to All Destinations
                         </button>
                       </div>
                     </motion.div>
                   )}
                 </AnimatePresence>
               </div>
             </div>
           </div>

           {/* Right Panel - Chat Conversation */}
           <div className="flex-1 lg:w-1/2 bg-white border-l border-gray-200">
             <div className="h-full flex flex-col">
               {/* Chat Header */}
               <div className="bg-gradient-to-r from-orange-500 to-red-500 text-white p-4">
                 <div className="flex items-center gap-3">
                   <div className="w-8 h-8 bg-white/20 rounded-full flex items-center justify-center">
                     <MessageCircle className="w-4 h-4" />
                   </div>
                   <div>
                     <h3 className="text-lg font-bold">Travel Assistant</h3>
                     <p className="text-sm text-white/80">Let's plan your perfect trip!</p>
                   </div>
                 </div>
               </div>

                              {/* Chat Messages */}
              <div ref={chatContainerRef} className="flex-1 overflow-y-auto p-6 space-y-6">
                 {conversationHistory.map((message, index) => (
                   <ConversationBubble key={index} isBot={message.type === 'bot'}>
                     {message.content}
                   </ConversationBubble>
                 ))}
                 
                 {loading && (
                   <ConversationBubble isBot>
                     <div className="flex items-center gap-2">
                       <div className="loading-spinner" />
                       <span>Planning your perfect trip from {userLocation}...</span>
                     </div>
                   </ConversationBubble>
                 )}
               </div>

               {/* Chat Input Area */}
               <div className="border-t border-gray-200 p-6 bg-gray-50">
                 {/* Trip Description Input */}
                 {currentStep === "location" && (
                   <div className="space-y-4">
                     <div className="relative">
                       <Search className="absolute left-4 top-4 text-gray-400 w-5 h-5" />
                       <textarea 
                         className="w-full pl-12 pr-4 py-4 border-2 border-gray-300 rounded-2xl focus:ring-2 focus:ring-orange-500 focus:border-orange-500 text-gray-700 min-h-[120px] resize-none text-lg"
                         placeholder="e.g., A beach escape with nightlife and water sports, 4-5 days, moderate budget..."
                         value={input} 
                         onChange={e=>setInput(e.target.value)} 
                       />
                     </div>
                     
                                         <div className="text-sm text-gray-500 bg-white rounded-xl p-3 text-center border">
                      📍 From: <strong>{userLocation}</strong>
                    </div>
                     
                     <button 
                       disabled={loading || !input.trim() || input.trim().length < 15} 
                       onClick={generate}
                       className="w-full bg-gradient-to-r from-orange-500 to-red-500 text-white py-4 px-6 rounded-2xl font-semibold text-lg disabled:opacity-50 hover:shadow-lg transition-all duration-200 flex items-center justify-center gap-2"
                     >
                       {loading ? (
                         <>
                           <div className="loading-spinner" />
                           Crafting your perfect trip...
                         </>
                       ) : (
                         <>
                           <Search className="w-5 h-5" />
                           Plan My Dream Journey
                         </>
                       )}
                     </button>
                     
                     <div className="space-y-3">
                       <p className="text-sm text-gray-500 text-center">Try these examples:</p>
                       {samplePrompts.map((prompt, i) => (
                         <button
                           key={i}
                           onClick={() => setInput(prompt)}
                           className="w-full text-left bg-white hover:bg-gray-50 px-4 py-3 rounded-xl text-gray-700 transition-colors border border-gray-200 hover:border-orange-300"
                         >
                           {prompt}
                         </button>
                       ))}
                     </div>
                   </div>
                 )}

                 {/* Modification Input */}
                 {currentStep === "modify_itinerary" && (
                   <div className="space-y-4">
                     <div className="relative">
                       <Edit className="absolute left-4 top-4 text-gray-400 w-5 h-5" />
                       <textarea 
                         className="w-full pl-12 pr-4 py-4 border-2 border-gray-300 rounded-2xl focus:ring-2 focus:ring-orange-500 focus:border-orange-500 text-gray-700 min-h-[120px] resize-none text-lg"
                         placeholder="e.g., Add more adventure activities, reduce the number of days, include local food tours, change accommodation type..."
                         value={modificationText} 
                         onChange={e=>setModificationText(e.target.value)}
                         onKeyPress={e => {
                           if (e.key === 'Enter' && !e.shiftKey && modificationText.trim()) {
                             e.preventDefault();
                             handleModificationSubmit();
                           }
                         }}
                       />
                     </div>
                     
                     <button 
                       disabled={!modificationText.trim()} 
                       onClick={handleModificationSubmit}
                       className="w-full bg-gradient-to-r from-orange-500 to-red-500 text-white py-4 px-6 rounded-2xl font-semibold text-lg disabled:opacity-50 hover:shadow-lg transition-all duration-200 flex items-center justify-center gap-2"
                     >
                       <Edit className="w-5 h-5" />
                       Update My Itinerary
                     </button>
                   </div>
                 )}

                                 {/* Flight Date Selection */}
                {currentStep === "flight_dates" && (
                  <motion.div 
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.3 }}
                    className="space-y-6 bg-gradient-to-br from-orange-50 to-red-50 p-6 rounded-2xl border border-orange-200"
                  >
                    <div className="text-center">
                      <h3 className="text-lg font-bold text-gray-800 mb-2">📅 Select Your Travel Dates</h3>
                      <p className="text-sm text-gray-600">Choose when you'd like to embark on your adventure!</p>
                    </div>
                    
                    <div className="space-y-4">
                      <div>
                        <label className="block text-sm font-semibold text-gray-700 mb-3">
                          <Calendar className="w-4 h-4 inline mr-2 text-orange-500" />
                          Departure Date
                        </label>
                        <div className="relative">
                          <input 
                            ref={startDateRef}
                            type="date"
                            className="w-full px-4 py-4 border-2 border-orange-200 rounded-xl focus:ring-3 focus:ring-orange-200 focus:border-orange-500 text-gray-700 text-lg bg-white shadow-sm transition-all duration-200 hover:border-orange-300"
                            value={startDate} 
                            onChange={e=>setStartDate(e.target.value)}
                            min={new Date().toISOString().split('T')[0]}
                            placeholder="Select departure date"
                          />
                        </div>
                      </div>
                      
                      <div>
                        <label className="block text-sm font-semibold text-gray-700 mb-3">
                          <Calendar className="w-4 h-4 inline mr-2 text-orange-500" />
                          Return Date
                        </label>
                        <div className="relative">
                          <input 
                            ref={endDateRef}
                            type="date"
                            className="w-full px-4 py-4 border-2 border-orange-200 rounded-xl focus:ring-3 focus:ring-orange-200 focus:border-orange-500 text-gray-700 text-lg bg-white shadow-sm transition-all duration-200 hover:border-orange-300"
                            value={endDate} 
                            onChange={e=>{
                              setEndDate(e.target.value);
                              // Auto-focus next field logic could go here
                            }}
                            min={startDate || new Date().toISOString().split('T')[0]}
                            placeholder="Select return date"
                          />
                        </div>
                      </div>
                    </div>
                    
                    {startDate && endDate && (
                      <motion.div 
                        initial={{ opacity: 0, scale: 0.95 }}
                        animate={{ opacity: 1, scale: 1 }}
                        className="bg-white p-4 rounded-xl border border-orange-200 text-center"
                      >
                        <p className="text-sm text-gray-600">
                          <strong className="text-orange-600">
                            {Math.ceil((new Date(endDate).getTime() - new Date(startDate).getTime()) / (1000 * 60 * 60 * 24))} days
                          </strong> of amazing adventure!
                        </p>
                        <p className="text-xs text-gray-500 mt-1">
                          {new Date(startDate).toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })} 
                          {' → '}
                          {new Date(endDate).toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
                        </p>
                      </motion.div>
                    )}
                    
                    <button 
                      disabled={!startDate || !endDate} 
                      onClick={handleDateSubmit}
                      className="w-full bg-gradient-to-r from-orange-500 to-red-500 text-white py-4 px-6 rounded-2xl font-semibold text-lg disabled:opacity-50 hover:shadow-lg transition-all duration-200 flex items-center justify-center gap-2 disabled:cursor-not-allowed"
                    >
                      <Calendar className="w-5 h-5" />
                      {!startDate || !endDate ? 'Please Select Both Dates' : 'Confirm Travel Dates'}
                    </button>
                  </motion.div>
                )}

                                 {/* Action Options */}

                 {currentStep === "options" && plan && (
                   <div className="flex gap-2 justify-center overflow-x-auto pb-2">
                     <OptionButton onClick={showDestinations} icon={<MapPin className="w-4 h-4" />}>
                       Show Destinations ({plan.destinationOptions.length})
                     </OptionButton>
                     <OptionButton onClick={showFilters} icon={<Filter className="w-4 h-4" />}>
                       Filter Options
                     </OptionButton>
                                         <OptionButton onClick={() => {
                      addToConversation('user', "I want to change my vacation plans");
                      addToConversation('bot', 
                        <div className="space-y-2">
                          <p>No problem at all! Let's adjust your dream vacation! ✨</p>
                          <p>I've pre-filled your previous description so you can easily modify it. What would you like to change about your trip from <strong>{userLocation}</strong>?</p>
                        </div>
                      );
                      setCurrentStep("location");
                      // Keep the previous input so they can edit it
                    }} icon={<Edit className="w-4 h-4" />}>
                      Change of Plans
                    </OptionButton>
                   </div>
                 )}

                                 {currentStep === "destinations_feedback" && plan && (
                  <div className="flex gap-2 justify-center overflow-x-auto pb-2">
                    <OptionButton onClick={() => handleDestinationsFeedback(true)} icon={<ThumbsUp className="w-4 h-4" />}>
                      I Love These Options!
                    </OptionButton>
                    <OptionButton onClick={() => handleDestinationsFeedback(false)} icon={<Search className="w-4 h-4" />}>
                      Show Me Different Places
                    </OptionButton>
                    <OptionButton onClick={() => {
                      addToConversation('user', "I want to change my vacation plans");
                      addToConversation('bot', 
                        <div className="space-y-2">
                          <p>Of course! Let's adjust your dream vacation! ✨</p>
                          <p>I've pre-filled your previous description so you can easily modify it.</p>
                        </div>
                      );
                      setCurrentStep("location");
                    }} icon={<Edit className="w-4 h-4" />}>
                      Change of Plans
                    </OptionButton>
                  </div>
                )}

                 {currentStep === "flight_preference" && (
                   <div className="flex gap-2 justify-center overflow-x-auto pb-2">
                     <OptionButton onClick={() => handleFlightPreference("cheapest")} icon={<DollarSign className="w-4 h-4" />}>
                       Cheapest Flights
                     </OptionButton>
                     <OptionButton onClick={() => handleFlightPreference("good_timing")} icon={<Clock className="w-4 h-4" />}>
                       Good Timing (Avoid Off-Hours)
                     </OptionButton>
                   </div>
                 )}

                 {currentStep === "itinerary_feedback" && plan && (
                   <div className="flex gap-2 justify-center overflow-x-auto pb-2">
                     <OptionButton onClick={() => handleItineraryApproval(true)} icon={<ThumbsUp className="w-4 h-4" />}>
                       I Love It! Let's Book
                     </OptionButton>
                     <OptionButton onClick={() => handleItineraryApproval(false)} icon={<Edit className="w-4 h-4" />}>
                       Modify Itinerary
                     </OptionButton>
                     <OptionButton onClick={() => {
                       addToConversation('user', "Add more days to the trip");
                       addToConversation('bot', 
                         <p>Great idea! How many additional days would you like? I can extend your <strong>{plan.chosenDestination}</strong> adventure! 📅</p>
                       );
                     }} icon={<Calendar className="w-4 h-4" />}>
                       Add More Days
                     </OptionButton>
                   </div>
                 )}

                                 {currentStep === "booking_options" && plan && (
                  <div className="flex gap-2 justify-center overflow-x-auto pb-2">
                    <OptionButton onClick={async () => {
                      addToConversation('user', "Book flights");
                      addToConversation('bot', 
                        <div className="space-y-2">
                          <p>Perfect! Let me search for the best {flightPreference === "cheapest" ? "budget-friendly" : "well-timed"} flights from <strong>{userLocation}</strong> to <strong>{plan.chosenDestination}</strong>! ✈️</p>
                          <p>Searching based on your preference for {flightPreference === "cheapest" ? "cheapest flights" : "good timing flights"}...</p>
                        </div>
                      );
                      
                      // Ensure we have all required information
                      if (!startDate || !endDate) {
                        addToConversation('bot', 
                          <p>I need your travel dates first! When would you like to travel?</p>
                        );
                        setCurrentStep("flight_dates");
                      } else if (!flightPreference) {
                        addToConversation('bot', 
                          <div className="space-y-2">
                            <p>I need to know your flight preference first!</p>
                            <p>What's more important to you for your flights?</p>
                          </div>
                        );
                        setCurrentStep("flight_preference");
                      } else {
                        // Call the actual flight search API
                        await searchFlights();
                      }
                    }} icon={<Plane className="w-4 h-4" />}>
                      Book Flights
                    </OptionButton>
                     <OptionButton onClick={() => {
                       addToConversation('user', "Book hotels");
                       addToConversation('bot', 
                         <p>Excellent! Here are the best hotel options in <strong>{plan.chosenDestination}</strong>! 🏨</p>
                       );
                       setCurrentStep("hotels");
                     }} icon={<Hotel className="w-4 h-4" />}>
                       Book Hotels
                     </OptionButton>
                     <OptionButton onClick={() => {
                       addToConversation('user', "Show me travel tips");
                       addToConversation('bot', 
                         <p>Great question! Let me share some insider tips for your <strong>{plan.chosenDestination}</strong> adventure! 💡</p>
                       );
                     }} icon={<BookOpen className="w-4 h-4" />}>
                       Travel Tips
                     </OptionButton>
                   </div>
                 )}
               </div>
             </div>
           </div>
         </div>
       )}
     </div>
   );
 }