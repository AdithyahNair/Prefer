// services/openaiService.ts
import axios from "axios";
import {
  getTransitInfo,
  getPointsOfInterest,
  getNearbyRestaurants,
} from "./googleMapsService";
import {
  generateItineraryMapImages,
  generateRestaurantMapImage,
  generateMapImageUrl,
} from "./mapImageService";

interface TravelPlanParams {
  startDestination: string;
  endDestination: string;
  travelHours: number;
  travelMood: string;
  travelDate: string;
  userPreferences: {
    travelStyle: string[];
    accommodation: string[];
    budget: string;
    activities: string[];
  };
}

interface BudgetBreakdown {
  food: {
    breakfast: number;
    lunch: number;
    dinner: number;
    snacks: number;
    total: number;
  };
  transportation: {
    publicTransit: number;
    taxi: number;
    total: number;
  };
  activities: {
    paid: number;
    free: number;
    total: number;
  };
  miscellaneous: number;
  dailyTotal: number;
}

interface Restaurant {
  name: string;
  rating: number;
  priceLevel: number;
  vicinity: string;
  photos?: string[];
  openNow?: boolean;
  types: string[];
}

export const generateTravelPlans = async (params: TravelPlanParams) => {
  try {
    // First, get transit information from Google Maps API
    const transitInfo = await getTransitInfo(
      params.startDestination,
      params.endDestination
    );

    // Get points of interest near the destination
    const pointsOfInterest = await getPointsOfInterest(params.endDestination);

    // Calculate budget based on destination and preferences
    const budgetBreakdown = calculateBudgetEstimate(
      params.endDestination,
      params.userPreferences.budget
    );

    // Get current time for meal recommendations
    const currentTime = new Date();
    const currentHour = currentTime.getHours();

    // Determine which meal to recommend based on current time
    let mealTime = "restaurant";
    if (currentHour >= 6 && currentHour < 11) {
      mealTime = "breakfast";
    } else if (currentHour >= 11 && currentHour < 15) {
      mealTime = "lunch";
    } else if (currentHour >= 17 && currentHour < 22) {
      mealTime = "dinner";
    }

    // Get nearby restaurant recommendations if trip is 3+ hours
    const restaurants =
      params.travelHours >= 3
        ? await getNearbyRestaurants(params.endDestination, mealTime)
        : [];

    // Create a more detailed prompt for OpenAI with all the gathered information
    const prompt = createEnhancedPrompt(
      params,
      transitInfo,
      pointsOfInterest,
      budgetBreakdown,
      restaurants
    );

    // Make the API call to OpenAI
    const response = await axios.post(
      "https://api.openai.com/v1/chat/completions",
      {
        model: "gpt-4-turbo",
        messages: [
          {
            role: "system",
            content: `You are an expert travel planner specializing in DAY TRIPS only, with deep knowledge of destinations worldwide. 
                     Create personalized one-day travel itineraries that include detailed budget breakdowns, local transit options, 
                     restaurant recommendations, and experiences tailored to the traveler's preferences. Your response MUST include 
                     hourly activities for a full day trip with specific times for each activity. Format your response as JSON.`,
          },
          {
            role: "user",
            content: prompt,
          },
        ],
        response_format: { type: "json_object" },
      },
      {
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${import.meta.env.VITE_REACT_OPENAI_API_KEY}`,
        },
      }
    );

    // Parse the JSON response
    const planData = JSON.parse(response.data.choices[0].message.content);

    // Process and enhance the data before returning
    return enhanceTravelPlans(planData, params, transitInfo, restaurants);
  } catch (error) {
    console.error("Error generating travel plans:", error);
    // Return fallback data for testing if API call fails
    return generateFallbackPlans(params);
  }
};

// Helper function to calculate estimated budget
const calculateBudgetEstimate = (
  destination: string,
  budgetLevel: string
): BudgetBreakdown => {
  // Default budget multipliers
  let multiplier = 1;

  // Adjust multiplier based on budget level
  switch (budgetLevel) {
    case "Budget":
      multiplier = 0.7;
      break;
    case "Mid-range":
      multiplier = 1;
      break;
    case "Luxury":
      multiplier = 2;
      break;
    default:
      multiplier = 1;
  }

  // Destination cost factors (simplified - would be expanded with real data)
  const destinationCostFactors: Record<string, number> = {
    Paris: 1.5,
    Tokyo: 1.7,
    "New York": 1.8,
    Bangkok: 0.6,
    London: 1.6,
    Rome: 1.3,
    Barcelona: 1.2,
    Berlin: 1.1,
    Sydney: 1.4,
    Dubai: 1.7,
    // Default for other destinations
    default: 1,
  };

  // Extract city name from the destination string
  const city = destination.split(",")[0].trim();

  // Get the cost factor for the destination or use default
  const costFactor =
    destinationCostFactors[city] || destinationCostFactors["default"];

  // Base budget for a mid-range traveler in an average city
  const baseFood = {
    breakfast: 10,
    lunch: 15,
    dinner: 25,
    snacks: 5,
    total: 55,
  };

  const baseTransportation = {
    publicTransit: 10,
    taxi: 20,
    total: 30,
  };

  const baseActivities = {
    paid: 30,
    free: 0,
    total: 30,
  };

  const baseMiscellaneous = 15;

  // Apply destination and budget adjustments
  const food = {
    breakfast: Math.round(baseFood.breakfast * costFactor * multiplier),
    lunch: Math.round(baseFood.lunch * costFactor * multiplier),
    dinner: Math.round(baseFood.dinner * costFactor * multiplier),
    snacks: Math.round(baseFood.snacks * costFactor * multiplier),
    total: 0, // Calculate total after individual items
  };
  food.total = food.breakfast + food.lunch + food.dinner + food.snacks;

  const transportation = {
    publicTransit: Math.round(
      baseTransportation.publicTransit * costFactor * multiplier
    ),
    taxi: Math.round(baseTransportation.taxi * costFactor * multiplier),
    total: 0, // Calculate total after individual items
  };
  transportation.total = transportation.publicTransit + transportation.taxi;

  const activities = {
    paid: Math.round(baseActivities.paid * costFactor * multiplier),
    free: 0,
    total: Math.round(baseActivities.paid * costFactor * multiplier),
  };

  const miscellaneous = Math.round(baseMiscellaneous * costFactor * multiplier);

  const dailyTotal =
    food.total + transportation.total + activities.total + miscellaneous;

  return {
    food,
    transportation,
    activities,
    miscellaneous,
    dailyTotal,
  };
};

// Helper function to create an enhanced prompt for OpenAI
const createEnhancedPrompt = (
  params: TravelPlanParams,
  transitInfo: any,
  pointsOfInterest: any,
  budgetBreakdown: BudgetBreakdown,
  restaurants: Restaurant[]
): string => {
  const {
    startDestination,
    endDestination,
    travelHours,
    travelMood,
    travelDate,
    userPreferences,
  } = params;

  // Format restaurant data for the prompt
  const restaurantRecommendations = restaurants.map((restaurant) => {
    return {
      name: restaurant.name,
      rating: restaurant.rating,
      priceLevel: restaurant.priceLevel,
      vicinity: restaurant.vicinity,
      openNow: restaurant.openNow,
      types: restaurant.types.filter(
        (type) =>
          type !== "restaurant" &&
          type !== "food" &&
          type !== "point_of_interest" &&
          type !== "establishment"
      ),
    };
  });

  // Determine if we need to include meal times based on travel duration
  const includeMeals = travelHours >= 3;

  // Get current time to adjust the starting time for the itinerary
  const currentTime = new Date();
  const startHour = currentTime.getHours();
  const startMinute = Math.ceil(currentTime.getMinutes() / 15) * 15; // Round to nearest 15 minutes

  // Format starting time string (e.g., "10:00 AM")
  let startTimeStr = "";
  if (startHour === 0) {
    startTimeStr = `12:${startMinute.toString().padStart(2, "0")} AM`;
  } else if (startHour < 12) {
    startTimeStr = `${startHour}:${startMinute.toString().padStart(2, "0")} AM`;
  } else if (startHour === 12) {
    startTimeStr = `12:${startMinute.toString().padStart(2, "0")} PM`;
  } else {
    startTimeStr = `${startHour - 12}:${startMinute
      .toString()
      .padStart(2, "0")} PM`;
  }

  return `
      Create 2 different personalized travel plans for a solo traveler going from ${startDestination} to ${endDestination}.
      
      TRAVELER PROFILE:
      - Travel Mood: ${travelMood}
      - Available time: ${travelHours} hours (THIS IS A ${
    travelHours >= 8 ? "ONE-DAY" : `${travelHours}-HOUR`
  } TRIP, START AT ${startTimeStr})
      - Travel Date: ${travelDate}
      - Travel Styles: ${userPreferences.travelStyle.join(", ")}
      - Budget Level: ${userPreferences.budget}
      - Favorite Activities: ${userPreferences.activities.join(", ")}
      
      DESTINATION INSIGHTS:
      - Transit Options: ${JSON.stringify(transitInfo.transitOptions)}
      - Local Points of Interest: ${JSON.stringify(
        pointsOfInterest.slice(0, 5)
      )}
      ${
        includeMeals
          ? `- Restaurant Recommendations: ${JSON.stringify(
              restaurantRecommendations
            )}`
          : ""
      }
      
      BUDGET BREAKDOWN:
      - Food: $${budgetBreakdown.food.total} (Breakfast: $${
    budgetBreakdown.food.breakfast
  }, Lunch: $${budgetBreakdown.food.lunch}, Dinner: $${
    budgetBreakdown.food.dinner
  }, Snacks: $${budgetBreakdown.food.snacks})
      - Transportation: $${
        budgetBreakdown.transportation.total
      } (Public Transit: $${
    budgetBreakdown.transportation.publicTransit
  }, Taxi/Ride-share: $${budgetBreakdown.transportation.taxi})
      - Activities: $${budgetBreakdown.activities.total}
      - Miscellaneous: $${budgetBreakdown.miscellaneous}
      - Total Estimate: $${budgetBreakdown.dailyTotal}
      
      FORMAT REQUIREMENTS:
      For EACH of the 2 plans, provide the following structure in a single JSON object with a "plans" array containing two plan objects, each with these EXACT field names:
      1. "title": A catchy title that reflects the travel style and mood
      2. "description": A detailed description of the trip experience (100-150 words)
      3. "itinerary": An ARRAY of objects, each with "time" and "activity" fields. Include EXACTLY ${Math.max(
        3,
        Math.min(Math.round(travelHours * 1.5), 12)
      )} activities spanning ${travelHours} hours, with SPECIFIC TIMES in HH:MM AM/PM format starting from ${startTimeStr}
      4. "spotifyPlaylist": An object with "name", "description", and "embedUrl" fields
      ${
        includeMeals
          ? `5. "localFood": An array of at least 2 food recommendations, each with "dish", "price", and "where" fields (use the restaurant data provided)`
          : `5. "localFood": An array with at least 1 food recommendation`
      }
      6. "transitDetails": Specific public transit directions between major activities
      7. "offBeatExperiences": An array of at least 1 off-the-beaten-path experience
      8. "savingTips": An array of money-saving tips specific to the destination
      9. "imageUrl": A URL for a relevant image that captures the essence of the plan
      
      IMPORTANT NOTES:
      - Format your response as a SINGLE JSON OBJECT with a top-level "plans" array containing EXACTLY 2 plan objects.
      - THIS IS A ${
        travelHours >= 8 ? "SINGLE-DAY" : `${travelHours}-HOUR`
      } TRIP. Do not include accommodation recommendations.
      - Start the itinerary at ${startTimeStr} and plan activities to fill exactly ${travelHours} hours.
      - Include SPECIFIC TIMES for each activity in the itinerary (e.g., "${startTimeStr}", not just "Morning").
      - The activities should be spaced appropriately throughout the time period.
      ${
        includeMeals
          ? `- Include meal times appropriate to the time of day, using the restaurant data provided if applicable.`
          : `- No need to include formal meal times, but you can include quick snack/coffee breaks if appropriate.`
      }
      - Include exact transit directions between activities.
      - Your response must be a valid JSON object with this exact structure: {"plans": [plan1, plan2]}
      
      The two plans should be different from each other, catering to different aspects of the traveler's preferences.
    `;
};

// Helper function to enhance the OpenAI response with additional data
const enhanceTravelPlans = (
  planData: any,
  params: TravelPlanParams,
  transitInfo: any,
  restaurants: Restaurant[]
) => {
  // Extract the plans from the OpenAI response
  const plans = planData.plans || [];

  // If no plans in the response but there is a single plan at root level
  // (happens with short trips that generate just one plan)
  if (plans.length === 0 && planData.title && planData.description) {
    plans.push(planData);
  }

  // Get API key from localStorage if available
  const apiKey = localStorage.getItem("prefer_google_maps_api_key") || "";

  // Add transit information to each plan
  return plans.map((plan: any) => {
    // Ensure the itinerary is always an array
    let itinerary = [];

    if (plan.itinerary) {
      if (Array.isArray(plan.itinerary)) {
        itinerary = plan.itinerary;
      } else if (typeof plan.itinerary === "object") {
        itinerary = Object.values(plan.itinerary);
      }
    }

    // Sort itinerary by time if it exists
    if (itinerary.length > 0) {
      itinerary.sort((a: any, b: any) => {
        // Convert time strings to comparable values (assume HH:MM AM/PM format)
        const timeA = convertTimeStringToMinutes(a.time);
        const timeB = convertTimeStringToMinutes(b.time);
        return timeA - timeB;
      });
    }

    // Get open restaurants for the current time if trip is 3+ hours
    const openRestaurants =
      params.travelHours >= 3
        ? restaurants
            .filter((r) => r.openNow)
            .map((restaurant) => ({
              ...restaurant,
              mapImageUrl: generateRestaurantMapImage(restaurant, apiKey),
            }))
        : [];

    // Add map images to the itinerary
    interface ItineraryItem {
      time: string;
      activity: string;
      mapImageUrl?: string;
    }

    const enhancedItinerary: ItineraryItem[] = apiKey
      ? generateItineraryMapImages(itinerary, params.endDestination, apiKey)
      : itinerary.map((item: ItineraryItem) => ({ ...item, mapImageUrl: "" }));

    // Add transit details and recommended restaurants
    const enhancedPlan = {
      ...plan,
      itinerary: enhancedItinerary,
      restaurants: openRestaurants.slice(0, 3),
      transitDetails: {
        options: transitInfo.transitOptions || [],
        localTransitTips: transitInfo.localTransitTips || [],
        averageCost: transitInfo.averageCost || 0,
      },
      // Add main map image for the destination
      destinationMapUrl: apiKey
        ? generateMapImageUrl(params.endDestination, apiKey, 600, 300, 13)
        : "",
      // Add budget info
      budgetBreakdown: {
        food: {
          breakfast: plan.budgetBreakdown?.food?.breakfast || 15,
          lunch: plan.budgetBreakdown?.food?.lunch || 20,
          dinner: plan.budgetBreakdown?.food?.dinner || 35,
          total: plan.budgetBreakdown?.food?.total || 70,
        },
        transportation: {
          publicTransit:
            plan.budgetBreakdown?.transportation?.publicTransit || 10,
          taxi: plan.budgetBreakdown?.transportation?.taxi || 25,
          total: plan.budgetBreakdown?.transportation?.total || 35,
        },
        activities: {
          paid: plan.budgetBreakdown?.activities?.paid || 40,
          free: 0,
          total: plan.budgetBreakdown?.activities?.total || 40,
        },
        miscellaneous: plan.budgetBreakdown?.miscellaneous || 15,
        dailyTotal: plan.budgetBreakdown?.dailyTotal || 160,
      },
      // Add metadata about the request
      metadata: {
        generatedFor: {
          startDestination: params.startDestination,
          endDestination: params.endDestination,
          travelMood: params.travelMood,
          travelHours: params.travelHours,
          travelDate: params.travelDate,
          userPreferences: params.userPreferences,
        },
        generatedAt: new Date().toISOString(),
      },
      // Ensure required fields exist for the UI
      imageUrl:
        plan.imageUrl ||
        "https://images.unsplash.com/photo-1488646953014-85cb44e25828?q=80&w=2070&auto=format&fit=crop",
      spotifyPlaylist: plan.spotifyPlaylist || {
        name: "Trip Vibes",
        description: "A playlist to match your travel mood",
        tracks: [],
        embedUrl:
          "https://open.spotify.com/embed/playlist/37i9dQZF1DX0SM0LYsmbMT",
      },
    };

    return enhancedPlan;
  });
};

// Helper function to convert time strings to minutes for sorting
const convertTimeStringToMinutes = (timeStr: string): number => {
  try {
    const [time, period] = timeStr.split(" ");
    const [hourStr, minuteStr] = time.split(":");
    let hour = parseInt(hourStr);
    const minute = parseInt(minuteStr);

    // Convert to 24-hour format
    if (period === "PM" && hour !== 12) {
      hour += 12;
    } else if (period === "AM" && hour === 12) {
      hour = 0;
    }

    return hour * 60 + minute;
  } catch (e) {
    // If the format doesn't match, return a default value
    return 0;
  }
};

// Generate fallback plans for when the API fails
const generateFallbackPlans = (params: TravelPlanParams) => {
  const { endDestination, travelMood, travelHours } = params;

  // Create plans with the correct number of hours
  const startTime = new Date();

  // Format times for display
  const formatTime = (date: Date) => {
    let hours = date.getHours();
    const minutes = date.getMinutes();
    const ampm = hours >= 12 ? "PM" : "AM";
    hours = hours % 12;
    hours = hours ? hours : 12; // the hour '0' should be '12'
    const minutesStr = minutes < 10 ? "0" + minutes : minutes;
    return hours + ":" + minutesStr + " " + ampm;
  };

  // Create evenly spaced activities
  const createTimeSpacedActivities = (hours: number, themeIndex: number) => {
    const activities = [];
    const currentTime = new Date();

    // Determine number of activities based on hours
    const numActivities = Math.max(3, Math.min(Math.round(hours * 1.5), 10));
    const timeIncrement = (hours * 60) / (numActivities - 1); // in minutes

    // Different themes for different plans
    const themes = [
      // Cultural theme
      {
        start: "Begin your cultural exploration of",
        activities: [
          "Visit a local museum",
          "Explore a historical landmark",
          "Admire architecture in the old town",
          "Visit an art gallery",
          "Take a guided walking tour",
          "Discover local crafts at a workshop",
          "Visit a cultural center",
          "Explore ancient ruins or monuments",
        ],
        end: "Conclude your cultural tour with a farewell view of",
      },
      // Nature/Outdoor theme
      {
        start: "Start your outdoor adventure in",
        activities: [
          "Hike a scenic trail",
          "Explore a local park",
          "Visit a botanical garden",
          "Take photos at a scenic viewpoint",
          "Enjoy a riverside walk",
          "Explore a natural reserve",
          "Visit a local beach or lakefront",
          "Take a bike tour around the city",
        ],
        end: "End your nature exploration with a sunset view of",
      },
    ];

    const theme = themes[themeIndex % themes.length];

    for (let i = 0; i < numActivities; i++) {
      const activityTime = new Date(
        currentTime.getTime() + i * timeIncrement * 60 * 1000
      );

      let activity = "Explore the local area";
      // Add meal activities based on time of day
      const hour = activityTime.getHours();
      if (i === 0) {
        activity = theme.start + " " + endDestination.split(",")[0];
      } else if (
        hour >= 7 &&
        hour <= 9 &&
        !activities.some((a) => a.activity.includes("breakfast"))
      ) {
        activity = "Enjoy breakfast at a local café";
      } else if (
        hour >= 11 &&
        hour <= 14 &&
        !activities.some((a) => a.activity.includes("lunch"))
      ) {
        activity = "Have lunch at a popular restaurant";
      } else if (
        hour >= 17 &&
        hour <= 20 &&
        !activities.some((a) => a.activity.includes("dinner"))
      ) {
        activity = "Dinner at a recommended spot";
      } else if (i === numActivities - 1) {
        activity = theme.end + " " + endDestination.split(",")[0];
      } else {
        // Themed activities
        activity =
          theme.activities[Math.floor(Math.random() * theme.activities.length)];
      }

      activities.push({
        time: formatTime(activityTime),
        activity: activity,
      });
    }

    return activities;
  };

  // Get API key from localStorage if available
  const apiKey = localStorage.getItem("prefer_google_maps_api_key") || "";

  // Create activities with appropriate timing for two different plans
  const activities1 = createTimeSpacedActivities(travelHours, 0);
  const activities2 = createTimeSpacedActivities(travelHours, 1);

  // Add map images to activities if API key is available
  const enhancedActivities1 = apiKey
    ? generateItineraryMapImages(activities1, endDestination, apiKey)
    : activities1.map((item) => ({ ...item, mapImageUrl: "" }));

  const enhancedActivities2 = apiKey
    ? generateItineraryMapImages(activities2, endDestination, apiKey)
    : activities2.map((item) => ({ ...item, mapImageUrl: "" }));

  return [
    {
      title: `Cultural ${travelMood} Tour in ${endDestination.split(",")[0]}`,
      description: `A ${travelHours}-hour cultural journey through ${
        endDestination.split(",")[0]
      } designed to match your ${travelMood.toLowerCase()} travel mood. This itinerary focuses on the rich history, art, and local traditions that make this destination unique.`,
      itinerary: enhancedActivities1,
      spotifyPlaylist: {
        name: `${endDestination.split(",")[0]} Cultural Vibes`,
        description: `Traditional and contemporary music from ${
          endDestination.split(",")[0]
        } to enhance your cultural exploration`,
        tracks: [
          { title: "Local Traditional", artist: "Heritage Ensemble" },
          { title: "Modern Fusion", artist: "Contemporary Artist" },
          { title: "Cultural Themes", artist: "Local Orchestra" },
        ],
        embedUrl:
          "https://open.spotify.com/embed/playlist/37i9dQZF1DX0SM0LYsmbMT",
      },
      imageUrl:
        "https://images.unsplash.com/photo-1488646953014-85cb44e25828?q=80&w=2070&auto=format&fit=crop",
      destinationMapUrl: apiKey
        ? generateMapImageUrl(endDestination, apiKey, 600, 300, 13)
        : "",
      budgetBreakdown: {
        food: {
          breakfast: 15,
          lunch: 20,
          dinner: 35,
          snacks: 10,
          total: travelHours >= 8 ? 80 : Math.round((travelHours / 8) * 80),
        },
        transportation: {
          publicTransit: 10,
          taxi: 15,
          total: 25,
        },
        activities: {
          paid: travelHours >= 8 ? 40 : Math.round((travelHours / 8) * 40),
          free: 0,
          total: travelHours >= 8 ? 40 : Math.round((travelHours / 8) * 40),
        },
        miscellaneous: 15,
        dailyTotal:
          travelHours >= 8 ? 160 : Math.round((travelHours / 8) * 160),
      },
      localFood: [
        {
          dish: "Traditional Specialty",
          price: 18,
          where: "Historic Restaurant",
        },
        { dish: "Cultural Delicacy", price: 12, where: "Local Eatery" },
      ],
      transitDetails: {
        options: [],
        localTransitTips: [
          "Many cultural sites are in the same district, making them walkable",
          "Look for day passes that include entry to multiple museums",
        ],
        averageCost: 10,
      },
      offBeatExperiences: [
        "Visit a hidden museum known mostly to locals",
        "Attend a traditional craft workshop",
      ],
      savingTips: [
        "Many museums have discounted or free entry days",
        "Look for cultural passes that combine multiple attractions",
        "Take guided group tours instead of private options",
      ],
      restaurants: [],
      metadata: {
        generatedFor: {
          startDestination: params.startDestination,
          endDestination: params.endDestination,
          travelMood: params.travelMood,
          travelHours: params.travelHours,
          travelDate: params.travelDate,
          userPreferences: params.userPreferences,
        },
        generatedAt: new Date().toISOString(),
      },
    },
    {
      title: `Outdoor ${travelMood} Adventure in ${
        endDestination.split(",")[0]
      }`,
      description: `Experience the natural beauty of ${
        endDestination.split(",")[0]
      } with this ${travelHours}-hour outdoor-focused ${travelMood.toLowerCase()} adventure. This itinerary takes you to scenic spots, parks, and outdoor experiences that showcase the destination's natural charm.`,
      itinerary: enhancedActivities2,
      spotifyPlaylist: {
        name: `${endDestination.split(",")[0]} Nature Sounds`,
        description: `Relaxing and energizing tracks to accompany your outdoor exploration`,
        tracks: [
          { title: "Natural Rhythms", artist: "Ambient Collective" },
          { title: "Urban Nature", artist: "City Soundscapes" },
          { title: "Adventure Beats", artist: "Explorer's Playlist" },
        ],
        embedUrl:
          "https://open.spotify.com/embed/playlist/37i9dQZF1DXdLEN7aqioXM",
      },
      imageUrl:
        "https://images.unsplash.com/photo-1551634979-2b11f8c946fe?q=80&w=2071&auto=format&fit=crop",
      destinationMapUrl: apiKey
        ? generateMapImageUrl(endDestination, apiKey, 600, 300, 13)
        : "",
      budgetBreakdown: {
        food: {
          breakfast: 12,
          lunch: 15,
          dinner: 28,
          snacks: 8,
          total: travelHours >= 8 ? 63 : Math.round((travelHours / 8) * 63),
        },
        transportation: {
          publicTransit: 8,
          taxi: 15,
          total: 23,
        },
        activities: {
          paid: travelHours >= 8 ? 25 : Math.round((travelHours / 8) * 25),
          free: 0,
          total: travelHours >= 8 ? 25 : Math.round((travelHours / 8) * 25),
        },
        miscellaneous: 12,
        dailyTotal:
          travelHours >= 8 ? 123 : Math.round((travelHours / 8) * 123),
      },
      localFood: [
        { dish: "Fresh Local Produce", price: 10, where: "Farmers Market" },
        { dish: "Picnic Lunch", price: 15, where: "Local Deli" },
      ],
      transitDetails: {
        options: [],
        localTransitTips: [
          "Rent a bike to easily access parks and nature spots",
          "Some natural areas have shuttle services during peak seasons",
        ],
        averageCost: 8,
      },
      offBeatExperiences: [
        "Discover a hidden viewpoint known mostly to locals",
        "Find a secluded picnic spot with amazing views",
      ],
      savingTips: [
        "Pack your own water and snacks for outdoor activities",
        "Use bike-sharing programs rather than taxis",
        "Most parks and natural areas have free admission",
      ],
      restaurants: [],
      metadata: {
        generatedFor: {
          startDestination: params.startDestination,
          endDestination: params.endDestination,
          travelMood: params.travelMood,
          travelHours: params.travelHours,
          travelDate: params.travelDate,
          userPreferences: params.userPreferences,
        },
        generatedAt: new Date().toISOString(),
      },
    },
  ];
};
