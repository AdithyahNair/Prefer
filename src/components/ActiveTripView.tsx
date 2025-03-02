import React, { useState, useEffect } from "react";
import {
  Plane,
  Clock,
  MapPin,
  Music,
  Check,
  ArrowLeft,
  ArrowRight,
} from "lucide-react";
import SpotifyPlayer from "./SpotifyPlayer";

interface ActiveTripViewProps {
  trip: any;
  onEndTrip: () => void;
}

const ActiveTripView: React.FC<ActiveTripViewProps> = ({ trip, onEndTrip }) => {
  const [currentTime, setCurrentTime] = useState(new Date());
  const [currentActivity, setCurrentActivity] = useState(0);

  // Update current time every minute
  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(new Date());
    }, 60000);

    return () => clearInterval(timer);
  }, []);

  // Calculate trip duration
  const startDate = new Date(trip.startDate);
  const tripDurationMs = currentTime.getTime() - startDate.getTime();
  const tripHours = Math.floor(tripDurationMs / (1000 * 60 * 60));
  const tripMinutes = Math.floor(
    (tripDurationMs % (1000 * 60 * 60)) / (1000 * 60)
  );

  const nextActivity = () => {
    setCurrentActivity((prev) => Math.min(prev + 1, trip.itinerary.length - 1));
  };

  const prevActivity = () => {
    setCurrentActivity((prev) => Math.max(prev - 1, 0));
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
      {/* Trip Details */}
      <div className="bg-white rounded-xl shadow-lg overflow-hidden lg:col-span-2">
        <div className="relative h-48 overflow-hidden">
          <img
            src={trip.imageUrl}
            alt={trip.title}
            className="w-full h-full object-cover"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-black/70 to-transparent flex flex-col justify-end p-6">
            <div className="flex items-center text-white mb-2">
              <Plane size={20} className="mr-2 animate-pulse" />
              <span className="text-sm font-medium">Active Trip</span>
            </div>
            <h1 className="text-3xl font-bold text-white">{trip.title}</h1>
            <p className="text-white/80 mt-1">{trip.description}</p>
          </div>
        </div>

        <div className="p-6">
          <div className="flex flex-wrap gap-4 mb-6">
            <div className="flex items-center px-4 py-2 bg-blue-50 text-blue-700 rounded-lg">
              <Clock size={18} className="mr-2" />
              <span>
                Trip time: {tripHours}h {tripMinutes}m
              </span>
            </div>
            <div className="flex items-center px-4 py-2 bg-green-50 text-green-700 rounded-lg">
              <MapPin size={18} className="mr-2" />
              <span>
                {trip.startDestination} → {trip.endDestination}
              </span>
            </div>
          </div>

          <div className="mb-8">
            <h2 className="text-xl font-bold mb-4">Your Itinerary</h2>
            <div className="relative">
              <div className="absolute left-4 top-0 bottom-0 w-0.5 bg-gray-200 z-0"></div>

              {trip.itinerary.map((item: any, index: number) => (
                <div
                  key={index}
                  className={`relative z-10 flex mb-6 ${
                    index === currentActivity
                      ? "opacity-100"
                      : index < currentActivity
                      ? "opacity-50"
                      : "opacity-70"
                  }`}
                >
                  <div
                    className={`w-8 h-8 rounded-full flex items-center justify-center mr-4 flex-shrink-0 ${
                      index === currentActivity
                        ? "bg-blue-600 text-white"
                        : index < currentActivity
                        ? "bg-green-600 text-white"
                        : "bg-gray-200 text-gray-500"
                    }`}
                  >
                    {index < currentActivity ? (
                      <Check size={16} />
                    ) : (
                      <span>{index + 1}</span>
                    )}
                  </div>
                  <div className="bg-white rounded-lg border p-4 shadow-sm flex-grow">
                    <div className="flex justify-between">
                      <div className="font-medium text-blue-800">
                        {item.time}
                      </div>
                      {index === currentActivity && (
                        <div className="text-xs px-2 py-1 bg-blue-100 text-blue-800 rounded-full">
                          Current
                        </div>
                      )}
                    </div>
                    <div className="mt-1">{item.activity}</div>
                  </div>
                </div>
              ))}
            </div>

            <div className="flex justify-between mt-6">
              <button
                onClick={prevActivity}
                disabled={currentActivity === 0}
                className={`flex items-center px-4 py-2 rounded-lg ${
                  currentActivity === 0
                    ? "bg-gray-100 text-gray-400 cursor-not-allowed"
                    : "bg-gray-200 text-gray-700 hover:bg-gray-300"
                }`}
              >
                <ArrowLeft size={16} className="mr-2" />
                Previous
              </button>

              <button
                onClick={nextActivity}
                disabled={currentActivity === trip.itinerary.length - 1}
                className={`flex items-center px-4 py-2 rounded-lg ${
                  currentActivity === trip.itinerary.length - 1
                    ? "bg-gray-100 text-gray-400 cursor-not-allowed"
                    : "bg-blue-600 text-white hover:bg-blue-700"
                }`}
              >
                Next
                <ArrowRight size={16} className="ml-2" />
              </button>
            </div>
          </div>

          <div className="flex justify-center">
            <button
              onClick={onEndTrip}
              className="px-6 py-3 bg-red-600 text-white rounded-lg font-medium hover:bg-red-700 transition-colors flex items-center"
            >
              <Check size={18} className="mr-2" />
              Complete Trip
            </button>
          </div>
        </div>
      </div>

      {/* Spotify Player */}
      <div className="bg-white rounded-xl shadow-lg overflow-hidden">
        <SpotifyPlayer playlist={trip.spotifyPlaylist} />
      </div>
    </div>
  );
};

export default ActiveTripView;
