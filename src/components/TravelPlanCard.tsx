// components/TravelPlanCard.tsx
import React, { useState } from "react";
import {
  Calendar,
  Clock,
  DollarSign,
  Heart,
  MapPin,
  Music,
  ChevronDown,
  ChevronUp,
  Coffee,
  Utensils,
  Bus,
  Train,
  Bed,
  Lightbulb,
  Sparkles,
  Map,
} from "lucide-react";

interface TravelPlanCardProps {
  plan: any;
  isSelected: boolean;
  onSelect: () => void;
}

const TravelPlanCard: React.FC<TravelPlanCardProps> = ({
  plan,
  isSelected,
  onSelect,
}) => {
  const [expanded, setExpanded] = useState(false);

  // Helper function to format currency
  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "USD",
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount);
  };

  // Ensure itinerary is an array
  const getItinerary = () => {
    if (!plan.itinerary) {
      return [];
    }

    // If itinerary is already an array, return it
    if (Array.isArray(plan.itinerary)) {
      return plan.itinerary;
    }

    // If itinerary is an object with values, convert to array
    if (typeof plan.itinerary === "object") {
      return Object.values(plan.itinerary);
    }

    // Fallback to empty array
    return [];
  };

  // Get safe itinerary array
  const itinerary = getItinerary();

  return (
    <div
      className={`rounded-xl overflow-hidden border transition-all duration-300 ${
        isSelected
          ? "border-green-500 shadow-lg scale-[1.02] bg-white"
          : "border-gray-200 shadow hover:shadow-md bg-white hover:border-blue-300"
      }`}
    >
      {/* Card Header with Image */}
      <div className="relative h-48 overflow-hidden">
        <img
          src={plan.imageUrl}
          alt={plan.title}
          className="w-full h-full object-cover"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black/70 to-transparent flex flex-col justify-end p-4">
          <h3 className="text-white text-xl font-bold">{plan.title}</h3>
          <div className="flex items-center text-white/90 text-sm mt-1">
            <MapPin size={14} className="mr-1" />
            <span>
              {plan.metadata?.generatedFor?.endDestination || "Destination"}
            </span>
          </div>
        </div>
        <button
          onClick={onSelect}
          className={`absolute top-3 right-3 p-2 rounded-full ${
            isSelected
              ? "bg-green-500 text-white"
              : "bg-white/80 text-gray-700 hover:bg-white"
          }`}
        >
          <Heart size={18} className={isSelected ? "fill-white" : ""} />
        </button>
      </div>

      {/* Destination Map (if available) */}
      {plan.destinationMapUrl && (
        <div className="relative">
          <img
            src={plan.destinationMapUrl}
            alt={`Map of ${plan.metadata?.generatedFor?.endDestination}`}
            className="w-full h-32 object-cover"
          />
          <div className="absolute bottom-2 left-2 bg-white/80 px-2 py-1 rounded-md flex items-center">
            <Map size={14} className="text-blue-700 mr-1" />
            <span className="text-xs font-medium text-blue-800">
              Destination Map
            </span>
          </div>
        </div>
      )}

      {/* Card Body */}
      <div className="p-4">
        {/* Budget Overview */}
        <div className="flex items-center justify-between mb-4 bg-blue-50 rounded-lg p-3">
          <div className="flex items-center">
            <DollarSign size={18} className="text-blue-600 mr-1" />
            <span className="text-sm font-medium text-blue-700">
              Trip Budget
            </span>
          </div>
          <span className="text-lg font-bold text-blue-800">
            {plan.budgetBreakdown?.dailyTotal
              ? formatCurrency(plan.budgetBreakdown.dailyTotal)
              : "$150-200"}
          </span>
        </div>

        {/* Description */}
        <p className="text-gray-600 text-sm mb-4">{plan.description}</p>

        {/* Transit Information */}
        <div className="mb-4">
          <div className="flex items-center mb-2">
            <Bus size={16} className="text-purple-600 mr-2" />
            <h4 className="text-sm font-medium text-gray-700">
              Transit Options
            </h4>
          </div>
          <div className="flex flex-wrap gap-2">
            {Array.isArray(plan.transitDetails?.options) ? (
              plan.transitDetails.options
                .slice(0, 2)
                .map((option: any, index: number) => (
                  <div
                    key={index}
                    className="rounded-md bg-purple-50 px-3 py-2 text-xs text-purple-800"
                  >
                    <div className="font-medium">{option.mode}</div>
                    <div className="text-purple-600">
                      {option.duration} • {formatCurrency(option.cost)}
                    </div>
                  </div>
                ))
            ) : (
              <div className="rounded-md bg-purple-50 px-3 py-2 text-xs text-purple-800">
                <div className="font-medium">Public Transit</div>
                <div className="text-purple-600">Available at destination</div>
              </div>
            )}
          </div>
        </div>

        {/* Quick Highlights */}
        <div className="grid grid-cols-2 gap-3 mb-4">
          <div className="bg-green-50 rounded-md p-2">
            <div className="flex items-center mb-1">
              <Coffee size={14} className="text-green-600 mr-1" />
              <span className="text-xs font-medium text-green-800">Food</span>
            </div>
            <span className="text-xs text-green-700">
              {plan.budgetBreakdown?.food?.total
                ? formatCurrency(plan.budgetBreakdown.food.total)
                : "$40-60"}
            </span>
          </div>

          <div className="bg-amber-50 rounded-md p-2">
            <div className="flex items-center mb-1">
              <Clock size={14} className="text-amber-600 mr-1" />
              <span className="text-xs font-medium text-amber-800">
                Duration
              </span>
            </div>
            <span className="text-xs text-amber-700">
              {plan.metadata?.generatedFor?.travelHours
                ? `${plan.metadata.generatedFor.travelHours} hours`
                : "Full day"}
            </span>
          </div>
        </div>

        {/* Itinerary Preview */}
        <div className="mb-4">
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center">
              <Clock size={16} className="text-blue-600 mr-2" />
              <h4 className="text-sm font-medium text-gray-700">Itinerary</h4>
            </div>
          </div>

          {itinerary.length > 0 ? (
            <div className="space-y-2">
              {itinerary
                .slice(0, expanded ? undefined : 3)
                .map((item: any, index: number) => (
                  <div
                    key={index}
                    className="rounded-md border border-gray-100 overflow-hidden"
                  >
                    <div className="flex items-start text-sm p-2">
                      <div className="text-blue-600 font-medium w-16 flex-shrink-0">
                        {item.time}
                      </div>
                      <div className="text-gray-700">{item.activity}</div>
                    </div>
                    {item.mapImageUrl && (
                      <img
                        src={item.mapImageUrl}
                        alt={`Map for ${item.activity}`}
                        className="w-full h-24 object-cover border-t border-gray-100"
                      />
                    )}
                  </div>
                ))}

              {itinerary.length > 3 && (
                <button
                  onClick={() => setExpanded(!expanded)}
                  className="w-full mt-2 text-blue-600 text-sm flex items-center justify-center py-1 hover:bg-blue-50 rounded-md transition-colors"
                >
                  {expanded ? (
                    <>
                      <ChevronUp size={16} className="mr-1" />
                      Show Less
                    </>
                  ) : (
                    <>
                      <ChevronDown size={16} className="mr-1" />
                      Show More ({itinerary.length - 3} more)
                    </>
                  )}
                </button>
              )}
            </div>
          ) : (
            <div className="text-sm text-gray-500 italic">
              Itinerary details not available
            </div>
          )}
        </div>

        {/* Restaurant Recommendations (for trips 3+ hours) */}
        {Array.isArray(plan.restaurants) && plan.restaurants.length > 0 && (
          <div className="mb-4">
            <div className="flex items-center mb-2">
              <Utensils size={16} className="text-red-600 mr-2" />
              <h4 className="text-sm font-medium text-gray-700">
                Open Restaurants
              </h4>
            </div>
            <div className="space-y-2">
              {plan.restaurants
                .slice(0, 2)
                .map((restaurant: any, index: number) => (
                  <div
                    key={index}
                    className="rounded-md border border-gray-100 overflow-hidden"
                  >
                    <div className="p-2">
                      <div className="flex justify-between">
                        <span className="text-sm font-medium">
                          {restaurant.name}
                        </span>
                        <span className="text-xs bg-green-100 text-green-800 px-1.5 py-0.5 rounded-full">
                          {restaurant.rating} ★
                        </span>
                      </div>
                      <div className="text-xs text-gray-500">
                        {restaurant.vicinity}
                      </div>
                    </div>
                    {restaurant.mapImageUrl && (
                      <img
                        src={restaurant.mapImageUrl}
                        alt={`Map to ${restaurant.name}`}
                        className="w-full h-24 object-cover border-t border-gray-100"
                      />
                    )}
                  </div>
                ))}
            </div>
          </div>
        )}

        {/* Local Tips and Spotify */}
        <div className="grid grid-cols-2 gap-3">
          <div className="bg-amber-50 rounded-md p-2 flex items-center">
            <Lightbulb
              size={16}
              className="text-amber-600 mr-2 flex-shrink-0"
            />
            <div className="text-xs text-amber-800">
              {plan.localTips?.[0] ||
                (Array.isArray(plan.transitDetails?.localTransitTips)
                  ? plan.transitDetails.localTransitTips[0]
                  : "Check local transit apps for real-time updates")}
            </div>
          </div>

          <div className="bg-pink-50 rounded-md p-2 flex items-center">
            <Music size={16} className="text-pink-600 mr-2 flex-shrink-0" />
            <div className="text-xs text-pink-800">
              {plan.spotifyPlaylist?.name || "Travel Playlist Available"}
            </div>
          </div>
        </div>
      </div>

      {/* Card Footer */}
      {isSelected && (
        <div className="bg-green-50 border-t border-green-100 p-4">
          <div className="flex items-center text-green-800">
            <Sparkles size={16} className="mr-1" />
            <span className="text-sm font-medium">Selected Plan</span>
          </div>
        </div>
      )}
    </div>
  );
};

export default TravelPlanCard;
