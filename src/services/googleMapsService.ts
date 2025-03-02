// services/googleMapsService.ts
import axios from "axios";

// Helper function to get user's geolocation using browser API
export const getUserLocation = (): Promise<{
  latitude: number;
  longitude: number;
}> => {
  return new Promise((resolve, reject) => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          resolve({
            latitude: position.coords.latitude,
            longitude: position.coords.longitude,
          });
        },
        (error) => {
          reject(new Error(`Geolocation error: ${error.message}`));
        },
        { timeout: 10000 }
      );
    } else {
      reject(new Error("Geolocation is not supported by your browser"));
    }
  });
};

// Function to reverse geocode coordinates to address using Google Maps API
export const reverseGeocode = async (
  latitude: number,
  longitude: number,
  apiKey: string
): Promise<{ address: string; error?: string }> => {
  try {
    const response = await axios.get(
      `https://maps.googleapis.com/maps/api/geocode/json?latlng=${latitude},${longitude}&key=${apiKey}`
    );

    if (response.data.status === "OK" && response.data.results.length > 0) {
      // Extract the formatted address
      const formattedAddress = response.data.results[0].formatted_address;

      // Try to extract city and country for a cleaner display
      let city = "";
      let country = "";

      const addressComponents = response.data.results[0].address_components;
      for (const component of addressComponents) {
        if (component.types.includes("locality")) {
          city = component.long_name;
        } else if (component.types.includes("country")) {
          country = component.long_name;
        }
      }

      // Use city and country if both are available, otherwise use the full address
      const address =
        city && country ? `${city}, ${country}` : formattedAddress;

      return { address };
    } else {
      return {
        address: `${latitude.toFixed(4)}, ${longitude.toFixed(4)}`,
        error: `Geocoding API error: ${response.data.status}`,
      };
    }
  } catch (error) {
    console.error("Error in reverse geocoding:", error);
    return {
      address: `${latitude.toFixed(4)}, ${longitude.toFixed(4)}`,
      error: error instanceof Error ? error.message : "Unknown error",
    };
  }
};

// Function to get transit information between two locations
export const getTransitInfo = async (
  origin: string,
  destination: string,
  apiKey?: string
) => {
  // If no API key is provided, try to get it from localStorage
  if (!apiKey) {
    apiKey = localStorage.getItem("prefer_google_maps_api_key") || "";
  }

  // Default response in case of error or missing API key
  const defaultResponse = {
    transitOptions: [
      {
        mode: "Public Transit",
        duration: "Approximately 30-45 minutes",
        cost: 2.5,
        route: "Varies by location",
        frequency: "Every 10-15 minutes",
      },
      {
        mode: "Taxi/Rideshare",
        duration: "Approximately 15-25 minutes",
        cost: 15,
        route: "Direct",
        frequency: "On demand",
      },
      {
        mode: "Walking",
        duration: "Varies by distance",
        cost: 0,
        route: "Direct",
        frequency: "Anytime",
      },
    ],
    localTransitTips: [
      "Buy a daily or weekly transit pass to save money if you plan to use public transportation frequently",
      "Off-peak hours typically have less crowded transit options",
      "Download the local transit app for real-time updates",
    ],
    averageCost: 2.5,
  };

  // If no API key or origin/destination is empty, return default data
  if (!apiKey || !origin || !destination) {
    return defaultResponse;
  }

  try {
    // Call Google Maps Directions API to get transit information
    const response = await axios.get(
      "https://maps.googleapis.com/maps/api/directions/json",
      {
        params: {
          origin,
          destination,
          mode: "transit",
          alternatives: true,
          key: apiKey,
        },
      }
    );

    if (response.data.status === "OK" && response.data.routes.length > 0) {
      // Process transit data from Google Maps
      const transitOptions = response.data.routes.map((route: any) => {
        const leg = route.legs[0];
        const transitSteps = leg.steps.filter(
          (step: any) => step.travel_mode === "TRANSIT"
        );

        // Get transit details from the first transit step (if available)
        const transitDetails =
          transitSteps.length > 0 ? transitSteps[0].transit_details : null;

        return {
          mode: "Public Transit",
          duration: leg.duration.text,
          cost: estimateTransitCost(destination),
          route: transitDetails
            ? `${
                transitDetails.line.short_name || transitDetails.line.name
              } - ${transitDetails.departure_stop.name} to ${
                transitDetails.arrival_stop.name
              }`
            : `From ${leg.start_address} to ${leg.end_address}`,
          frequency:
            transitDetails && transitDetails.line.frequency_text
              ? transitDetails.line.frequency_text
              : "Varies",
        };
      });

      // Add additional transport options
      const walkingOption = {
        mode: "Walking",
        duration: response.data.routes[0].legs[0].duration.text,
        cost: 0,
        route: "Direct",
        frequency: "Anytime",
      };

      // Estimate taxi cost based on distance
      const distanceInMeters = response.data.routes[0].legs[0].distance.value;
      const taxiCost = estimateTaxiCost(distanceInMeters, destination);

      const taxiOption = {
        mode: "Taxi/Rideshare",
        duration: response.data.routes[0].legs[0].duration.text.replace(
          "transit",
          "driving"
        ),
        cost: taxiCost,
        route: "Direct",
        frequency: "On demand",
      };

      return {
        transitOptions: [...transitOptions, walkingOption, taxiOption],
        localTransitTips: generateTransitTips(destination, transitOptions),
        averageCost: transitOptions.length > 0 ? transitOptions[0].cost : 2.5,
      };
    }

    return defaultResponse;
  } catch (error) {
    console.error("Error fetching transit information:", error);
    return defaultResponse;
  }
};

// Function to get nearby restaurants based on meal type and location
export const getNearbyRestaurants = async (
  location: string,
  mealType: string = "restaurant",
  apiKey?: string
) => {
  // If no API key is provided, try to get it from localStorage
  if (!apiKey) {
    apiKey = localStorage.getItem("prefer_google_maps_api_key") || "";
  }

  // Default restaurant data in case API call fails
  const defaultRestaurants = [
    {
      name: "Local Café",
      rating: 4.3,
      priceLevel: 2,
      vicinity: "Main Street",
      types: ["cafe", "breakfast", "coffee"],
      openNow: true,
    },
    {
      name: "City Bistro",
      rating: 4.5,
      priceLevel: 3,
      vicinity: "Downtown Avenue",
      types: ["restaurant", "dinner", "lunch"],
      openNow: true,
    },
    {
      name: "Quick Bites",
      rating: 4.1,
      priceLevel: 1,
      vicinity: "Market Square",
      types: ["fast_food", "lunch", "takeaway"],
      openNow: true,
    },
    {
      name: "Sunset Restaurant",
      rating: 4.7,
      priceLevel: 4,
      vicinity: "Harbor Road",
      types: ["fine_dining", "dinner"],
      openNow: true,
    },
    {
      name: "Street Food Alley",
      rating: 4.2,
      priceLevel: 1,
      vicinity: "Food Court Road",
      types: ["street_food", "lunch", "dinner"],
      openNow: true,
    },
  ];

  // If no API key or location is empty, return default data
  if (!apiKey || !location) {
    return defaultRestaurants;
  }

  try {
    // First get geocoded location to get latitude and longitude
    const geocodeResponse = await axios.get(
      "https://maps.googleapis.com/maps/api/geocode/json",
      {
        params: {
          address: location,
          key: apiKey,
        },
      }
    );

    if (
      geocodeResponse.data.status === "OK" &&
      geocodeResponse.data.results.length > 0
    ) {
      const { lat, lng } = geocodeResponse.data.results[0].geometry.location;

      // Determine the search keyword based on meal type
      let keyword = mealType;
      if (mealType === "breakfast") {
        keyword = "breakfast cafe";
      } else if (mealType === "lunch") {
        keyword = "lunch restaurant";
      } else if (mealType === "dinner") {
        keyword = "dinner restaurant";
      }

      // Call Places API to get restaurants
      const placesResponse = await axios.get(
        "https://maps.googleapis.com/maps/api/place/nearbysearch/json",
        {
          params: {
            location: `${lat},${lng}`,
            radius: 1500, // 1.5km radius
            type: "restaurant",
            keyword: keyword,
            opennow: true,
            rankby: "prominence",
            key: apiKey,
          },
        }
      );

      if (
        placesResponse.data.status === "OK" &&
        placesResponse.data.results.length > 0
      ) {
        // Format restaurant data
        return placesResponse.data.results
          .filter((place: any) => place.rating && place.user_ratings_total > 10) // Only places with ratings and sufficient reviews
          .slice(0, 10)
          .map((place: any) => ({
            name: place.name,
            rating: place.rating,
            priceLevel: place.price_level || 2,
            vicinity: place.vicinity,
            types: place.types,
            openNow: place.opening_hours ? place.opening_hours.open_now : true,
            photos: place.photos
              ? place.photos.map(
                  (photo: any) =>
                    `https://maps.googleapis.com/maps/api/place/photo?maxwidth=400&photoreference=${photo.photo_reference}&key=${apiKey}`
                )
              : [],
          }));
      }
    }

    return defaultRestaurants;
  } catch (error) {
    console.error("Error fetching restaurant information:", error);
    return defaultRestaurants;
  }
};

// Function to get points of interest near a location
export const getPointsOfInterest = async (
  location: string,
  apiKey?: string
) => {
  // If no API key is provided, try to get it from localStorage
  if (!apiKey) {
    apiKey = localStorage.getItem("prefer_google_maps_api_key") || "";
  }

  // Default POIs in case API call fails
  const defaultPOIs = [
    {
      name: "Local Museum",
      rating: 4.5,
      types: ["museum", "tourist_attraction"],
      user_ratings_total: 1500,
    },
    {
      name: "Central Park",
      rating: 4.7,
      types: ["park", "tourist_attraction"],
      user_ratings_total: 3000,
    },
    {
      name: "Historic Market",
      rating: 4.3,
      types: ["shopping", "food", "point_of_interest"],
      user_ratings_total: 2200,
    },
    {
      name: "City Viewpoint",
      rating: 4.8,
      types: ["tourist_attraction", "viewpoint"],
      user_ratings_total: 1800,
    },
    {
      name: "Local Restaurant",
      rating: 4.4,
      types: ["restaurant", "food"],
      user_ratings_total: 950,
    },
  ];

  // If no API key or location is empty, return default data
  if (!apiKey || !location) {
    return defaultPOIs;
  }

  try {
    // Get geocoded location to get latitude and longitude
    const geocodeResponse = await axios.get(
      "https://maps.googleapis.com/maps/api/geocode/json",
      {
        params: {
          address: location,
          key: apiKey,
        },
      }
    );

    if (
      geocodeResponse.data.status === "OK" &&
      geocodeResponse.data.results.length > 0
    ) {
      const { lat, lng } = geocodeResponse.data.results[0].geometry.location;

      // Call Places API to get points of interest
      const placesResponse = await axios.get(
        "https://maps.googleapis.com/maps/api/place/nearbysearch/json",
        {
          params: {
            location: `${lat},${lng}`,
            radius: 5000, // 5km radius
            type: "tourist_attraction",
            rankby: "prominence",
            key: apiKey,
          },
        }
      );

      if (
        placesResponse.data.status === "OK" &&
        placesResponse.data.results.length > 0
      ) {
        // Return top POIs with relevant info
        return placesResponse.data.results.slice(0, 10).map((place: any) => ({
          name: place.name,
          rating: place.rating,
          types: place.types,
          user_ratings_total: place.user_ratings_total,
        }));
      }
    }

    return defaultPOIs;
  } catch (error) {
    console.error("Error fetching points of interest:", error);
    return defaultPOIs;
  }
};

// Helper function to estimate transit cost based on destination
const estimateTransitCost = (destination: string): number => {
  // Extract city name from destination
  const city = destination.split(",")[0].trim().toLowerCase();

  // Cost estimates for popular cities (in USD)
  const transitCosts: Record<string, number> = {
    "new york": 2.75,
    london: 2.5,
    paris: 1.9,
    tokyo: 2.0,
    berlin: 3.0,
    rome: 1.5,
    barcelona: 2.2,
    amsterdam: 3.2,
    singapore: 1.7,
    "hong kong": 1.5,
    sydney: 3.8,
    toronto: 3.2,
  };

  return transitCosts[city] || 2.5; // Default to $2.5 if city not found
};

// Helper function to estimate taxi cost based on distance and destination
const estimateTaxiCost = (
  distanceInMeters: number,
  destination: string
): number => {
  // Extract city name from destination
  const city = destination.split(",")[0].trim().toLowerCase();

  // Base rates for popular cities (in USD)
  const baseFares: Record<string, { base: number; perKm: number }> = {
    "new york": { base: 2.5, perKm: 1.56 },
    london: { base: 3.0, perKm: 1.74 },
    paris: { base: 2.6, perKm: 1.07 },
    tokyo: { base: 4.0, perKm: 2.7 },
    berlin: { base: 3.9, perKm: 1.5 },
    rome: { base: 3.0, perKm: 1.1 },
    barcelona: { base: 2.1, perKm: 1.1 },
    amsterdam: { base: 3.0, perKm: 2.17 },
    singapore: { base: 3.2, perKm: 0.55 },
    "hong kong": { base: 2.8, perKm: 0.8 },
    sydney: { base: 2.5, perKm: 1.3 },
    toronto: { base: 3.25, perKm: 1.75 },
  };

  // Default rates if city not found
  const { base, perKm } = baseFares[city] || { base: 3.0, perKm: 1.5 };

  // Calculate cost: base fare + (distance in km * rate per km)
  const distanceInKm = distanceInMeters / 1000;
  const estimatedCost = base + distanceInKm * perKm;

  // Round to nearest tenth
  return Math.round(estimatedCost * 10) / 10;
};

// Helper function to generate transit tips based on destination and options
const generateTransitTips = (
  destination: string,
  transitOptions: any[]
): string[] => {
  // Extract city name from destination
  const city = destination.split(",")[0].trim();

  // Common transit tips
  const commonTips = [
    "Buy a daily or weekly transit pass to save money if you plan to use public transportation frequently",
    "Off-peak hours typically have less crowded transit options",
    "Download the local transit app for real-time updates",
  ];

  // City-specific transit tips
  const cityTips: Record<string, string[]> = {
    London: [
      "Get an Oyster card to save on tube and bus fares",
      "The Tube stops running around midnight, but Night Buses run 24/7",
      "Avoid the Tube during rush hour (8-9:30am and 5-6:30pm)",
    ],
    Paris: [
      "Purchase a carnet of 10 tickets for a discount on metro rides",
      "The Paris Visite pass offers unlimited travel and museum discounts",
      "Metro lines close at 1am on weeknights and 2am on weekends",
    ],
    "New York": [
      "MetroCards can be shared between multiple people",
      "Express trains skip local stations - check the subway map",
      "The subway runs 24/7, but service is limited late at night",
    ],
    Tokyo: [
      "Get a Suica or Pasmo card for seamless travel on all Tokyo transit",
      "The Tokyo subway closes around midnight and reopens at 5am",
      "Rush hour trains are extremely crowded - avoid 7:30-9am if possible",
    ],
    Berlin: [
      "Validate your ticket before boarding to avoid fines",
      "The U-Bahn and S-Bahn connect most major attractions",
      "A Berlin WelcomeCard includes public transport and museum discounts",
    ],
  };

  // Get city-specific tips or use common tips
  const specificTips = cityTips[city] || [];

  // Combine tips and return a maximum of 5
  return [...specificTips, ...commonTips].slice(0, 5);
};
