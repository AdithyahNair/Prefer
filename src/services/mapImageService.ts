// services/mapImageService.ts

/**
 * Service to generate map images for itinerary locations
 */

// Generate a Google Maps Static API URL for a given location
export const generateMapImageUrl = (
  location: string,
  apiKey: string,
  width: number = 400,
  height: number = 200,
  zoom: number = 14,
  mapType: string = "roadmap"
): string => {
  // Format the location string for the URL
  const formattedLocation = encodeURIComponent(location);

  // Create the map image URL
  return `https://maps.googleapis.com/maps/api/staticmap?center=${formattedLocation}&zoom=${zoom}&size=${width}x${height}&maptype=${mapType}&markers=color:red|${formattedLocation}&key=${apiKey}`;
};

// Generate map images for all locations in the itinerary
export const generateItineraryMapImages = (
  itinerary: Array<{ time: string; activity: string }>,
  baseLocation: string,
  apiKey: string
): Array<{ time: string; activity: string; mapImageUrl: string }> => {
  if (!apiKey) {
    // Return original itinerary if no API key
    return itinerary.map((item) => ({
      ...item,
      mapImageUrl: "",
    }));
  }

  // Extract location from activity text and generate map image URLs
  return itinerary.map((item) => {
    // Try to extract location from activity text
    const locationMatch =
      item.activity.match(/at\s(.*?)(?:,|\.|$)/i) ||
      item.activity.match(/in\s(.*?)(?:,|\.|$)/i) ||
      item.activity.match(/visit\s(.*?)(?:,|\.|$)/i) ||
      item.activity.match(/explore\s(.*?)(?:,|\.|$)/i);

    let location = baseLocation;

    // If we found a specific location in the activity text, use it
    if (locationMatch && locationMatch[1]) {
      location = `${locationMatch[1]}, ${baseLocation}`;
    }

    // Generate the map image URL
    const mapImageUrl = generateMapImageUrl(location, apiKey);

    return {
      ...item,
      mapImageUrl,
    };
  });
};

// Generate a map image for a restaurant
export const generateRestaurantMapImage = (
  restaurant: { name: string; vicinity: string },
  apiKey: string
): string => {
  if (!apiKey || !restaurant || !restaurant.vicinity) {
    return "";
  }

  // Use the restaurant vicinity (address) for the map
  const location = `${restaurant.name}, ${restaurant.vicinity}`;

  // Generate the map image URL
  return generateMapImageUrl(location, apiKey, 300, 150, 16);
};
