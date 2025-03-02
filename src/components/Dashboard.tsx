import React, { useState, useEffect } from "react";
import {
  Compass,
  LogOut,
  Settings,
  User,
  Edit,
  Check,
  X,
  Calendar,
  MapPin,
  Plane,
  CreditCard,
  Utensils,
  Camera,
  Mountain,
  Sunrise,
  Sunset,
  Globe,
  Clock,
  Sparkles,
  Bed,
  Calendar as CalendarIcon,
  Clock as ClockIcon,
  Map,
  Smile,
  Send,
  ArrowRight,
  Loader,
  Music,
  ChevronLeft,
  ChevronRight,
  Heart,
  ThumbsUp,
  ThumbsDown,
  Play,
  Pause,
  SkipForward,
  SkipBack,
  Check as CheckIcon,
  AlertTriangle,
} from "lucide-react";
import { useAuth } from "../context/AuthContext";
import PreferencesPage from "./PreferencesPage";
import TravelPlanCard from "./TravelPlanCard";
import { generateTravelPlans } from "../services/openaiService";
import { getUserLocation, reverseGeocode } from "../services/googleMapsService";

// Google Maps API key - this will be provided by the user
const GOOGLE_MAPS_API_KEY = import.meta.env.REACT_APP_GOOGLEMAPS_API_KEY;
interface DashboardProps {
  userData: any;
  onSignOut: () => void;
}

const Dashboard: React.FC<DashboardProps> = ({ userData, onSignOut }) => {
  const { logout } = useAuth();
  const [editingPreferences, setEditingPreferences] = useState(false);
  const [showTripPlanner, setShowTripPlanner] = useState(false);
  const [loadingLocation, setLoadingLocation] = useState(false);
  const [locationError, setLocationError] = useState("");
  const [generatingPlans, setGeneratingPlans] = useState(false);
  const [travelPlans, setTravelPlans] = useState<any[]>([]);
  const [selectedPlan, setSelectedPlan] = useState<number | null>(null);
  const [activeTrip, setActiveTrip] = useState<any | null>(null);
  const [tripStats, setTripStats] = useState({
    tripsTaken: 0,
    countriesVisited: 0,
    daysTraveled: 0,
  });
  const [googleMapsApiKey, setGoogleMapsApiKey] = useState(GOOGLE_MAPS_API_KEY);
  const [showApiKeyInput, setShowApiKeyInput] = useState(!GOOGLE_MAPS_API_KEY);
  const [currentLocation, setCurrentLocation] = useState<{
    latitude: number;
    longitude: number;
  } | null>(null);

  // Format today's date as YYYY-MM-DD for the date input
  const today = new Date().toISOString().split("T")[0];

  const [tripPlan, setTripPlan] = useState({
    startDestination: "",
    endDestination: "",
    travelHours: 8,
    travelMood: "Relaxed",
    travelDate: today,
  });

  // Load trip stats from localStorage on component mount
  useEffect(() => {
    const storedStats = localStorage.getItem("prefer_trip_stats");
    if (storedStats) {
      setTripStats(JSON.parse(storedStats));
    }

    const storedActiveTrip = localStorage.getItem("prefer_active_trip");
    if (storedActiveTrip) {
      setActiveTrip(JSON.parse(storedActiveTrip));
    }

    // Load Google Maps API key from localStorage if available
    const storedApiKey = localStorage.getItem("prefer_google_maps_api_key");
    if (storedApiKey) {
      setGoogleMapsApiKey(storedApiKey);
      setShowApiKeyInput(false);
    }
  }, []);

  // Get user's location when trip planner is opened
  useEffect(() => {
    if (showTripPlanner && !tripPlan.startDestination && googleMapsApiKey) {
      handleGetLocation();
    }
  }, [showTripPlanner, googleMapsApiKey]);

  const handleGetLocation = async () => {
    if (!googleMapsApiKey) {
      setLocationError("Please enter your Google Maps API key first");
      setShowApiKeyInput(true);
      return;
    }

    setLoadingLocation(true);
    setLocationError("");

    try {
      // Get coordinates using browser geolocation
      const coords = await getUserLocation();
      setCurrentLocation(coords);

      // Use Google Maps to get the address from coordinates
      const result = await reverseGeocode(
        coords.latitude,
        coords.longitude,
        googleMapsApiKey
      );

      if (result.error) {
        setLocationError(result.error);
        // Still set the coordinates as a fallback
        setTripPlan((prev) => ({
          ...prev,
          startDestination: result.address,
        }));
      } else {
        setTripPlan((prev) => ({
          ...prev,
          startDestination: result.address,
        }));
      }
    } catch (error) {
      console.error("Error getting location:", error);
      setLocationError(
        error instanceof Error
          ? error.message
          : "Unable to get your location. Please enter manually."
      );
    } finally {
      setLoadingLocation(false);
    }
  };

  const handleSignOut = async () => {
    await logout();
    onSignOut();
  };

  const handleUpdatePreferences = (updatedPreferences: any) => {
    // Update user data with new preferences
    const updatedUserData = {
      ...userData,
      preferences: updatedPreferences,
      preferencesCompleted: true,
    };

    // Save to localStorage
    localStorage.setItem("prefer_user", JSON.stringify(updatedUserData));

    // Exit editing mode
    setEditingPreferences(false);

    // Reload the page to reflect changes
    window.location.reload();
  };

  const handleTripPlanChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>
  ) => {
    const { name, value } = e.target;
    setTripPlan((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleCreateTrip = async () => {
    if (!tripPlan.startDestination || !tripPlan.endDestination) {
      return;
    }

    setGeneratingPlans(true);

    try {
      // Get user preferences to send to OpenAI
      const userPreferences = userData.preferences || {
        travelStyle: [],
        accommodation: [],
        budget: "Mid-range",
        activities: [],
      };

      // Generate travel plans using OpenAI with exact travel hours
      const plans = await generateTravelPlans({
        startDestination: tripPlan.startDestination,
        endDestination: tripPlan.endDestination,
        travelHours: tripPlan.travelHours, // This will now be respected in the generated plans
        travelMood: tripPlan.travelMood,
        travelDate: tripPlan.travelDate,
        userPreferences,
      });

      setTravelPlans(plans);
      setSelectedPlan(null);
    } catch (error) {
      console.error("Error generating travel plans:", error);
      // Fallback with mock data if API fails
      // Create a plan with the correct number of hours
      const startTime = new Date();
      const endTime = new Date(
        startTime.getTime() + tripPlan.travelHours * 60 * 60 * 1000
      );

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
      const createTimeSpacedActivities = (hours: number) => {
        const activities: { time: string; activity: string }[] = [];
        const currentTime = new Date();

        // Determine number of activities based on hours
        const numActivities = Math.max(
          3,
          Math.min(Math.round(hours * 1.5), 10)
        );
        const timeIncrement = (hours * 60) / (numActivities - 1); // in minutes

        for (let i = 0; i < numActivities; i++) {
          const activityTime = new Date(
            currentTime.getTime() + i * timeIncrement * 60 * 1000
          );

          let activity = "Explore the local area";
          // Add meal activities based on time of day
          const hour = activityTime.getHours();
          if (i === 0) {
            activity =
              "Begin your adventure at " +
              tripPlan.endDestination.split(",")[0];
          } else if (
            hour >= 7 &&
            hour <= 9 &&
            !activities.some((a: { activity: string }) =>
              a.activity.includes("breakfast")
            )
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
            activity =
              "Conclude your trip with a scenic view of " +
              tripPlan.endDestination.split(",")[0];
          } else {
            // Random cultural activities
            const activities = [
              "Visit a local museum",
              "Explore a historical landmark",
              "Stroll through a city park",
              "Shop at a local market",
              "Take photos at a scenic viewpoint",
              "Visit an art gallery",
              "Take a walking tour of the neighborhood",
              "Experience local street performances",
              "Try a local specialty coffee shop",
              "Visit a famous monument",
            ];
            activity =
              activities[Math.floor(Math.random() * activities.length)];
          }

          activities.push({
            time: formatTime(activityTime),
            activity: activity,
          });
        }

        return activities;
      };

      setTravelPlans([
        {
          title: `${tripPlan.travelMood} ${tripPlan.travelHours}-Hour Trip in ${
            tripPlan.endDestination.split(",")[0]
          }`,
          description: `A personalized ${
            tripPlan.travelHours
          }-hour journey through ${
            tripPlan.endDestination.split(",")[0]
          } designed to match your ${tripPlan.travelMood.toLowerCase()} travel mood. This compact itinerary makes the most of your limited time, focusing on the highlights and experiences that match your preferences.`,
          itinerary: createTimeSpacedActivities(tripPlan.travelHours),
          spotifyPlaylist: {
            name: `${tripPlan.endDestination.split(",")[0]} ${
              tripPlan.travelMood
            } Vibes`,
            description: `The perfect soundtrack for your ${tripPlan.travelMood.toLowerCase()} adventure in ${
              tripPlan.endDestination.split(",")[0]
            }`,
            tracks: [
              { title: "Local Favorite", artist: "Popular Artist" },
              { title: "Travel Theme", artist: "Indie Band" },
              { title: "City Sounds", artist: "Music Collective" },
            ],
            embedUrl:
              "https://open.spotify.com/embed/playlist/37i9dQZF1DX0SM0LYsmbMT",
          },
          imageUrl:
            "https://images.unsplash.com/photo-1502602898657-3e91760cbb34?q=80&w=2073&auto=format&fit=crop",
          budgetBreakdown: {
            food: {
              breakfast: 15,
              lunch: 20,
              dinner: 35,
              snacks: 10,
              total:
                tripPlan.travelHours >= 8
                  ? 80
                  : Math.round((tripPlan.travelHours / 8) * 80),
            },
            transportation: {
              publicTransit: 10,
              taxi: 15,
              total: 25,
            },
            activities: {
              paid:
                tripPlan.travelHours >= 8
                  ? 40
                  : Math.round((tripPlan.travelHours / 8) * 40),
              free: 0,
              total:
                tripPlan.travelHours >= 8
                  ? 40
                  : Math.round((tripPlan.travelHours / 8) * 40),
            },
            miscellaneous: 15,
            dailyTotal:
              tripPlan.travelHours >= 8
                ? 160
                : Math.round((tripPlan.travelHours / 8) * 160),
          },
          localFood: [
            { dish: "Local Specialty", price: 15, where: "Popular Restaurant" },
            { dish: "Street Food Item", price: 5, where: "Food Market" },
          ],
          transitDetails:
            "Use a combination of walking and public transit between main attractions.",
          offBeatExperiences: [
            "Discover a hidden viewpoint known mostly to locals",
            "Visit an artisan workshop away from tourist areas",
          ],
          savingTips: [
            "Use public transportation instead of taxis",
            "Look for free admission hours at museums",
            "Eat where the locals eat for better prices",
          ],
          metadata: {
            generatedFor: {
              startDestination: tripPlan.startDestination,
              endDestination: tripPlan.endDestination,
              travelMood: tripPlan.travelMood,
              travelHours: tripPlan.travelHours,
              userPreferences: userPreferences,
            },
            generatedAt: new Date().toISOString(),
          },
        },
      ]);
    } finally {
      setGeneratingPlans(false);
    }
  };

  // Handle Google Maps API key input
  const handleApiKeySubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (googleMapsApiKey) {
      localStorage.setItem("prefer_google_maps_api_key", googleMapsApiKey);
      setShowApiKeyInput(false);
      // Try to get location after API key is set
      handleGetLocation();
    }
  };

  const handleSelectPlan = (index: number) => {
    setSelectedPlan(index);
  };

  const handleStartTrip = () => {
    if (selectedPlan === null) return;

    const selectedTravelPlan = travelPlans[selectedPlan];

    // Create active trip
    const newActiveTrip = {
      ...selectedTravelPlan,
      startDate: new Date().toISOString(),
      startDestination: tripPlan.startDestination,
      endDestination: tripPlan.endDestination,
      travelHours: tripPlan.travelHours,
      travelMood: tripPlan.travelMood,
    };

    // Update trip stats
    const updatedStats = {
      tripsTaken: tripStats.tripsTaken + 1,
      countriesVisited: tripStats.countriesVisited,
      daysTraveled: tripStats.daysTraveled,
    };

    // Check if this is a new country
    const destinationCountry = tripPlan.endDestination.split(",").pop()?.trim();
    const visitedCountries = localStorage.getItem("prefer_visited_countries");
    const visitedCountriesArray = visitedCountries
      ? JSON.parse(visitedCountries)
      : [];

    if (
      destinationCountry &&
      !visitedCountriesArray.includes(destinationCountry)
    ) {
      visitedCountriesArray.push(destinationCountry);
      localStorage.setItem(
        "prefer_visited_countries",
        JSON.stringify(visitedCountriesArray)
      );
      updatedStats.countriesVisited = visitedCountriesArray.length;
    }

    // Save active trip and updated stats
    setActiveTrip(newActiveTrip);
    setTripStats(updatedStats);
    localStorage.setItem("prefer_active_trip", JSON.stringify(newActiveTrip));
    localStorage.setItem("prefer_trip_stats", JSON.stringify(updatedStats));

    // Reset UI state
    setTravelPlans([]);
    setSelectedPlan(null);
    setShowTripPlanner(false);
  };

  const handleEndTrip = () => {
    if (!activeTrip) return;

    // Calculate trip duration in days (or partial days)
    const startDate = new Date(activeTrip.startDate);
    const endDate = new Date();
    const tripDurationMs = endDate.getTime() - startDate.getTime();
    const tripDurationDays = Math.max(
      0.5,
      Math.ceil(tripDurationMs / (1000 * 60 * 60 * 24))
    );

    // Update trip stats
    const updatedStats = {
      ...tripStats,
      daysTraveled: tripStats.daysTraveled + tripDurationDays,
    };

    setTripStats(updatedStats);
    localStorage.setItem("prefer_trip_stats", JSON.stringify(updatedStats));

    // Clear active trip
    setActiveTrip(null);
    localStorage.removeItem("prefer_active_trip");
  };

  // If editing preferences, show the preferences page
  if (editingPreferences) {
    return (
      <div className="relative">
        <div className="absolute top-4 right-4 z-10 flex space-x-2">
          <button
            onClick={() => setEditingPreferences(false)}
            className="p-2 bg-white rounded-full shadow-md hover:bg-gray-100 transition-colors"
            aria-label="Cancel"
          >
            <X size={20} className="text-gray-700" />
          </button>
        </div>
        <PreferencesPage
          onComplete={handleUpdatePreferences}
          initialPreferences={
            userData.preferences || {
              travelStyle: [],
              accommodation: [],
              budget: "",
              activities: [],
            }
          }
        />
      </div>
    );
  }

  // Get current date for the greeting
  const currentHour = new Date().getHours();
  let greeting = "Good morning";
  if (currentHour >= 12 && currentHour < 18) {
    greeting = "Good afternoon";
  } else if (currentHour >= 18) {
    greeting = "Good evening";
  }

  // Get travel style icons
  const getTravelStyleIcon = (style: string) => {
    switch (style) {
      case "Adventure Seeker":
        return <Plane size={14} />;
      case "Cultural Explorer":
        return <Camera size={14} />;
      case "Relaxation":
        return <Sunset size={14} />;
      case "Social Butterfly":
        return <User size={14} />;
      case "Off the Beaten Path":
        return <MapPin size={14} />;
      case "Foodie":
        return <Utensils size={14} />;
      case "Luxury Travel":
        return <CreditCard size={14} />;
      case "Outdoor Enthusiast":
        return <Mountain size={14} />;
      case "Beach Lover":
        return <Sunrise size={14} />;
      case "Festival Goer":
        return <Sparkles size={14} />;
      default:
        return <Globe size={14} />;
    }
  };

  // Get mood icon
  const getMoodIcon = (mood: string) => {
    switch (mood) {
      case "Adventurous":
        return <Mountain size={18} className="text-orange-500" />;
      case "Relaxed":
        return <Sunset size={18} className="text-blue-500" />;
      case "Romantic":
        return <Sparkles size={18} className="text-pink-500" />;
      case "Cultural":
        return <Camera size={18} className="text-purple-500" />;
      case "Foodie":
        return <Utensils size={18} className="text-green-500" />;
      default:
        return <Smile size={18} className="text-gray-500" />;
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-50 to-gray-100">
      {/* Header */}
      <header className="bg-white shadow-sm sticky top-0 z-10">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center">
            <div className="w-10 h-10 rounded-full bg-gradient-to-r from-blue-600 to-indigo-600 flex items-center justify-center text-white">
              <Compass size={24} />
            </div>
            <span className="ml-2 text-xl font-medium bg-gradient-to-r from-blue-600 to-indigo-600 text-transparent bg-clip-text">
              Prefer
            </span>
          </div>

          <div className="flex items-center space-x-4">
            <div className="flex items-center space-x-2">
              <div className="w-8 h-8 rounded-full bg-gradient-to-r from-blue-100 to-indigo-100 flex items-center justify-center">
                <User size={18} className="text-blue-600" />
              </div>
              <span className="text-sm font-medium hidden md:inline-block">
                {userData.firstName} {userData.lastName}
              </span>
            </div>
            <button
              onClick={handleSignOut}
              className="p-2 rounded-full hover:bg-gray-100 transition-colors"
              aria-label="Sign out"
            >
              <LogOut size={20} />
            </button>
          </div>
        </div>
      </header>

      {/* Main content */}
      <main className="container mx-auto px-4 py-8">
        {/* Google Maps API Key Input */}
        {showApiKeyInput && (
          <div className="bg-white rounded-xl shadow-lg overflow-hidden mb-8 border border-blue-100 animate-fadeIn">
            <div className="bg-gradient-to-r from-blue-50 to-indigo-50 p-4 border-b border-blue-100">
              <h2 className="text-xl font-bold text-blue-800 flex items-center">
                <Map size={20} className="mr-2" />
                Google Maps Setup
              </h2>
            </div>
            <div className="p-6">
              <p className="mb-4 text-gray-700">
                To enable precise location features, please enter your Google
                Maps API key. You can get one from the{" "}
                <a
                  href="https://console.cloud.google.com/google/maps-apis/overview"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-blue-600 hover:underline"
                >
                  Google Cloud Console
                </a>
                .
              </p>
              <form onSubmit={handleApiKeySubmit} className="space-y-4">
                <div>
                  <label
                    className="block text-sm font-medium text-gray-700 mb-2"
                    htmlFor="googleMapsApiKey"
                  >
                    Google Maps API Key
                  </label>
                  <input
                    id="googleMapsApiKey"
                    type="text"
                    value={googleMapsApiKey}
                    onChange={(e) => setGoogleMapsApiKey(e.target.value)}
                    className="w-full p-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="AIzaSyA1234example5678-AbCdEfGhIjKlMnOpQrStUvWxYz"
                    required
                  />
                </div>
                <div className="flex justify-end">
                  <button
                    type="submit"
                    className="px-6 py-3 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 transition-colors shadow-md flex items-center"
                    disabled={!googleMapsApiKey}
                  >
                    <CheckIcon size={18} className="mr-2" />
                    Save API Key
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* Active Trip Banner */}
        {activeTrip && (
          <div className="bg-gradient-to-r from-green-600 to-emerald-600 text-white rounded-2xl p-6 mb-8 shadow-lg animate-fadeIn">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center">
              <div>
                <div className="flex items-center">
                  <Plane size={24} className="mr-2 animate-pulse" />
                  <h2 className="text-xl font-bold">
                    Active Trip: {activeTrip.title}
                  </h2>
                </div>
                <p className="mt-2 opacity-90">
                  {activeTrip.startDestination} → {activeTrip.endDestination}
                </p>
              </div>
              <div className="mt-4 md:mt-0 flex space-x-3">
                <button
                  onClick={() =>
                    window.open(activeTrip.spotifyPlaylist.embedUrl, "_blank")
                  }
                  className="px-4 py-2 bg-white bg-opacity-20 rounded-lg font-medium hover:bg-opacity-30 transition-colors flex items-center"
                >
                  <Music size={18} className="mr-2" />
                  Open Playlist
                </button>
                <button
                  onClick={handleEndTrip}
                  className="px-4 py-2 bg-white text-green-700 rounded-lg font-medium hover:bg-green-50 transition-colors flex items-center"
                >
                  <CheckIcon size={18} className="mr-2" />
                  End Trip
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Greeting section */}
        {!activeTrip && (
          <div className="bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-2xl p-6 mb-8 shadow-lg">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center">
              <div>
                <h2 className="text-xl font-medium opacity-90">{greeting},</h2>
                <h1 className="text-3xl font-bold">
                  {userData.firstName || "Traveler"}
                </h1>
                <p className="mt-2 opacity-80">
                  Ready to plan your next solo adventure?
                </p>
              </div>
              <button
                onClick={() => setShowTripPlanner(!showTripPlanner)}
                className="mt-4 md:mt-0 px-6 py-3 bg-white text-blue-600 rounded-lg font-medium hover:bg-blue-50 transition-colors shadow-md flex items-center"
              >
                {showTripPlanner ? "Cancel Planning" : "Plan New Trip"}
                {!showTripPlanner && <ArrowRight size={18} className="ml-2" />}
              </button>
            </div>
          </div>
        )}

        {/* Trip Planner Card */}
        {showTripPlanner && (
          <div className="bg-white rounded-xl shadow-lg overflow-hidden mb-8 border border-blue-100 animate-fadeIn">
            <div className="bg-gradient-to-r from-blue-50 to-indigo-50 p-4 border-b border-blue-100">
              <h2 className="text-xl font-bold text-blue-800 flex items-center">
                <Plane size={20} className="mr-2" />
                Plan Your Trip
              </h2>
            </div>

            <div className="p-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2 flex items-center">
                    <MapPin size={16} className="mr-1 text-blue-600" />
                    Your Current Location
                  </label>
                  <div className="relative">
                    <input
                      type="text"
                      name="startDestination"
                      value={tripPlan.startDestination}
                      onChange={handleTripPlanChange}
                      placeholder={
                        loadingLocation
                          ? "Detecting your location..."
                          : "Enter your starting point"
                      }
                      className="w-full p-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                      disabled={loadingLocation}
                    />
                    <div className="absolute right-3 top-1/2 transform -translate-y-1/2 flex">
                      {loadingLocation ? (
                        <Loader
                          size={18}
                          className="animate-spin text-blue-500"
                        />
                      ) : (
                        <button
                          onClick={handleGetLocation}
                          className="text-blue-500 hover:text-blue-700"
                          title="Get current location"
                        >
                          <MapPin size={18} />
                        </button>
                      )}
                    </div>
                  </div>
                  {locationError && (
                    <p className="mt-1 text-sm text-red-600 flex items-center">
                      <AlertTriangle size={14} className="mr-1" />
                      {locationError}
                    </p>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2 flex items-center">
                    <MapPin size={16} className="mr-1 text-blue-600" />
                    Destination
                  </label>
                  <input
                    type="text"
                    name="endDestination"
                    value={tripPlan.endDestination}
                    onChange={handleTripPlanChange}
                    placeholder="Where do you want to go?"
                    className="w-full p-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2 flex items-center">
                    <Clock size={16} className="mr-1 text-blue-600" />
                    Travel Time (hours)
                  </label>
                  <input
                    type="number"
                    name="travelHours"
                    value={tripPlan.travelHours}
                    onChange={handleTripPlanChange}
                    min="1"
                    max="24"
                    className="w-full p-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2 flex items-center">
                    <Smile size={16} className="mr-1 text-blue-600" />
                    Travel Mood
                  </label>
                  <div className="relative">
                    <select
                      name="travelMood"
                      value={tripPlan.travelMood}
                      onChange={handleTripPlanChange}
                      className="w-full p-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 appearance-none"
                    >
                      <option value="Relaxed">Relaxed</option>
                      <option value="Adventurous">Adventurous</option>
                      <option value="Romantic">Romantic</option>
                      <option value="Cultural">Cultural</option>
                      <option value="Foodie">Foodie</option>
                    </select>
                    <div className="absolute right-3 top-1/2 transform -translate-y-1/2 pointer-events-none">
                      {getMoodIcon(tripPlan.travelMood)}
                    </div>
                  </div>
                </div>
              </div>

              <div className="hidden">
                <label className="block text-sm font-medium text-gray-700 mb-2 flex items-center">
                  <CalendarIcon size={16} className="mr-1 text-blue-600" />
                  Travel Date
                </label>
                <input
                  type="date"
                  name="travelDate"
                  value={tripPlan.travelDate}
                  onChange={handleTripPlanChange}
                  className="w-full p-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div className="mt-8 flex justify-end">
                <button
                  onClick={handleCreateTrip}
                  disabled={
                    !tripPlan.endDestination ||
                    !tripPlan.startDestination ||
                    generatingPlans
                  }
                  className={`px-6 py-3 rounded-lg font-medium shadow-md flex items-center ${
                    !tripPlan.endDestination ||
                    !tripPlan.startDestination ||
                    generatingPlans
                      ? "bg-gray-300 text-gray-500 cursor-not-allowed"
                      : "bg-blue-600 text-white hover:bg-blue-700"
                  }`}
                >
                  {generatingPlans ? (
                    <>
                      <Loader size={18} className="mr-2 animate-spin" />
                      Generating Plans...
                    </>
                  ) : (
                    <>
                      <Send size={18} className="mr-2" />
                      Plan My Trip
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>
        )}

        {/* AI Generated Travel Plans */}
        {travelPlans.length > 0 && (
          <div className="mb-8 animate-fadeIn">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-2xl font-bold text-gray-800 flex items-center">
                <Sparkles size={24} className="mr-2 text-blue-600" />
                AI-Generated Travel Plans
              </h2>
              <button
                onClick={() => setTravelPlans([])}
                className="p-2 rounded-full hover:bg-gray-100 transition-colors"
              >
                <X size={20} className="text-gray-600" />
              </button>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {travelPlans.map((plan, index) => (
                <TravelPlanCard
                  key={index}
                  plan={plan}
                  isSelected={selectedPlan === index}
                  onSelect={() => handleSelectPlan(index)}
                />
              ))}
            </div>

            {selectedPlan !== null && (
              <div className="mt-6 flex justify-center">
                <button
                  onClick={handleStartTrip}
                  className="px-8 py-4 bg-gradient-to-r from-green-600 to-emerald-600 text-white rounded-lg font-medium hover:from-green-700 hover:to-emerald-700 transition-colors shadow-lg flex items-center transform hover:-translate-y-1"
                >
                  <Plane size={20} className="mr-2" />
                  Start This Trip
                </button>
              </div>
            )}
          </div>
        )}

        {/* Stats and Preferences Section */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-8">
          {/* Stats Card */}
          <div className="bg-white rounded-xl shadow-md overflow-hidden border border-gray-100">
            <div className="bg-gradient-to-r from-indigo-50 to-purple-50 p-4 border-b border-gray-100">
              <h2 className="text-lg font-bold text-indigo-800 flex items-center">
                <Globe size={18} className="mr-2" />
                Your Travel Stats
              </h2>
            </div>
            <div className="p-6">
              <div className="grid grid-cols-3 gap-4">
                <div className="text-center p-4 bg-indigo-50 rounded-lg">
                  <div className="flex justify-center mb-2">
                    <Plane size={24} className="text-indigo-600" />
                  </div>
                  <h3 className="text-2xl font-bold text-indigo-700">
                    {tripStats.tripsTaken}
                  </h3>
                  <p className="text-xs text-indigo-600">Trips Taken</p>
                </div>

                <div className="text-center p-4 bg-purple-50 rounded-lg">
                  <div className="flex justify-center mb-2">
                    <Globe size={24} className="text-purple-600" />
                  </div>
                  <h3 className="text-2xl font-bold text-purple-700">
                    {tripStats.countriesVisited}
                  </h3>
                  <p className="text-xs text-purple-600">Countries Visited</p>
                </div>

                <div className="text-center p-4 bg-blue-50 rounded-lg">
                  <div className="flex justify-center mb-2">
                    <Calendar size={24} className="text-blue-600" />
                  </div>
                  <h3 className="text-2xl font-bold text-blue-700">
                    {tripStats.daysTraveled}
                  </h3>
                  <p className="text-xs text-blue-600">Days Traveled</p>
                </div>
              </div>
            </div>
          </div>

          {/* Preferences Card */}
          <div className="bg-white rounded-xl shadow-md overflow-hidden border border-gray-100">
            <div className="bg-gradient-to-r from-pink-50 to-red-50 p-4 border-b border-gray-100 flex justify-between items-center">
              <h2 className="text-lg font-bold text-pink-800 flex items-center">
                <User size={18} className="mr-2" />
                Your Travel Preferences
              </h2>
              <button
                onClick={() => setEditingPreferences(true)}
                className="p-2 rounded-full hover:bg-white hover:bg-opacity-20 transition-colors"
                aria-label="Edit preferences"
              >
                <Edit size={18} className="text-pink-800" />
              </button>
            </div>
            <div className="p-6">
              {userData.preferences ? (
                <>
                  <div className="mb-4">
                    <h3 className="text-sm font-semibold text-gray-600 mb-2">
                      Travel Style
                    </h3>
                    <div className="flex flex-wrap gap-2">
                      {userData.preferences.travelStyle.map((style: string) => (
                        <span
                          key={style}
                          className="inline-flex items-center px-3 py-1 bg-blue-50 text-blue-700 rounded-full text-xs font-medium"
                        >
                          {getTravelStyleIcon(style)}
                          <span className="ml-1">{style}</span>
                        </span>
                      ))}
                    </div>
                  </div>

                  <div className="mb-4">
                    <h3 className="text-sm font-semibold text-gray-600 mb-2">
                      Preferred Accommodation
                    </h3>
                    <div className="flex flex-wrap gap-2">
                      {userData.preferences.accommodation.map(
                        (accommodation: string) => (
                          <span
                            key={accommodation}
                            className="inline-flex items-center px-3 py-1 bg-pink-50 text-pink-700 rounded-full text-xs font-medium"
                          >
                            <Bed size={14} className="mr-1" />
                            {accommodation}
                          </span>
                        )
                      )}
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <h3 className="text-sm font-semibold text-gray-600 mb-2">
                        Budget
                      </h3>
                      <span className="inline-flex items-center px-3 py-1 bg-green-50 text-green-700 rounded-full text-xs font-medium">
                        <CreditCard size={14} className="mr-1" />
                        {userData.preferences.budget}
                      </span>
                    </div>

                    <div>
                      <h3 className="text-sm font-semibold text-gray-600 mb-2">
                        Favorite Activities
                      </h3>
                      <div className="flex flex-wrap gap-2">
                        {userData.preferences.activities
                          .slice(0, 2)
                          .map((activity: string) => (
                            <span
                              key={activity}
                              className="inline-flex items-center px-3 py-1 bg-purple-50 text-purple-700 rounded-full text-xs font-medium truncate max-w-full"
                            >
                              <Sparkles
                                size={14}
                                className="mr-1 flex-shrink-0"
                              />
                              <span className="truncate">{activity}</span>
                            </span>
                          ))}
                        {userData.preferences.activities.length > 2 && (
                          <span className="inline-flex items-center px-3 py-1 bg-gray-50 text-gray-700 rounded-full text-xs font-medium">
                            +{userData.preferences.activities.length - 2} more
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                </>
              ) : (
                <div className="text-center py-4">
                  <p className="text-gray-500 mb-4">
                    You haven't set your travel preferences yet.
                  </p>
                  <button
                    onClick={() => setEditingPreferences(true)}
                    className="px-4 py-2 bg-pink-100 text-pink-700 rounded-lg font-medium hover:bg-pink-200 transition-colors"
                  >
                    Set Preferences
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Recommended Destinations Section (Only show if not planning a trip) */}
        {!showTripPlanner && !activeTrip && (
          <div className="bg-white rounded-xl shadow-md overflow-hidden border border-gray-100 mb-8">
            <div className="bg-gradient-to-r from-yellow-50 to-orange-50 p-4 border-b border-gray-100">
              <h2 className="text-lg font-bold text-yellow-800 flex items-center">
                <Compass size={18} className="mr-2" />
                Recommended Solo Destinations Based on Your Preferences
              </h2>
            </div>
            <div className="p-6">
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {/* These would typically be generated based on user preferences */}
                <div className="rounded-lg overflow-hidden shadow-md border border-gray-100 hover:shadow-lg transition-shadow group">
                  <div className="h-32 bg-gradient-to-r from-blue-400 to-indigo-500 relative">
                    <div className="absolute inset-0 flex items-end p-4 text-white font-bold text-lg">
                      Bali, Indonesia
                    </div>
                  </div>
                  <div className="p-4">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-sm text-gray-500">
                        Perfect for Solo Travelers
                      </span>
                      <span className="text-sm font-medium text-green-600">
                        $$ Mid-range
                      </span>
                    </div>
                    <p className="text-sm text-gray-600 mb-3">
                      Perfect for spiritual retreats, beaches, and adventure.
                      Great for digital nomads.
                    </p>
                    <button className="w-full py-2 bg-gray-100 text-gray-700 rounded font-medium hover:bg-indigo-500 hover:text-white transition-colors group-hover:bg-indigo-50">
                      View Details
                    </button>
                  </div>
                </div>

                <div className="rounded-lg overflow-hidden shadow-md border border-gray-100 hover:shadow-lg transition-shadow group">
                  <div className="h-32 bg-gradient-to-r from-green-400 to-teal-500 relative">
                    <div className="absolute inset-0 flex items-end p-4 text-white font-bold text-lg">
                      Kyoto, Japan
                    </div>
                  </div>
                  <div className="p-4">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-sm text-gray-500">
                        Cultural Immersion
                      </span>
                      <span className="text-sm font-medium text-green-600">
                        $$$ Luxury
                      </span>
                    </div>
                    <p className="text-sm text-gray-600 mb-3">
                      Traditional temples, gardens, and authentic cuisine in a
                      safe environment.
                    </p>
                    <button className="w-full py-2 bg-gray-100 text-gray-700 rounded font-medium hover:bg-teal-500 hover:text-white transition-colors group-hover:bg-teal-50">
                      View Details
                    </button>
                  </div>
                </div>

                <div className="rounded-lg overflow-hidden shadow-md border border-gray-100 hover:shadow-lg transition-shadow group">
                  <div className="h-32 bg-gradient-to-r from-purple-400 to-pink-500 relative">
                    <div className="absolute inset-0 flex items-end p-4 text-white font-bold text-lg">
                      Lisbon, Portugal
                    </div>
                  </div>
                  <div className="p-4">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-sm text-gray-500">
                        Budget-friendly
                      </span>
                      <span className="text-sm font-medium text-green-600">
                        $ Budget
                      </span>
                    </div>
                    <p className="text-sm text-gray-600 mb-3">
                      Colorful streets, delicious food, and vibrant nightlife
                      with great hostels.
                    </p>
                    <button className="w-full py-2 bg-gray-100 text-gray-700 rounded font-medium hover:bg-pink-500 hover:text-white transition-colors group-hover:bg-pink-50">
                      View Details
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
      </main>

      {/* Footer */}
      <footer className="bg-white border-t border-gray-200 py-6 mt-auto">
        <div className="container mx-auto px-4">
          <div className="flex justify-between items-center">
            <div className="flex items-center">
              <Compass size={18} className="text-blue-600 mr-2" />
              <span className="text-sm text-gray-600">
                Prefer Travel Assistant © {new Date().getFullYear()}
              </span>
            </div>
            <div className="text-sm text-gray-500">
              <span>Personalized Solo Travel, Simplified</span>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default Dashboard;
