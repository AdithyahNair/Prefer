import React, { useState } from "react";
import {
  Compass,
  Check,
  MapPin,
  Utensils,
  Bed,
  Plane,
  Users,
  Camera,
  Coffee,
  Sunset,
  Mountain,
  Palmtree,
  Music,
  Sparkles,
} from "lucide-react";

interface PreferencesPageProps {
  onComplete: (preferences: any) => void;
  initialPreferences?: any;
}

const PreferencesPage: React.FC<PreferencesPageProps> = ({
  onComplete,
  initialPreferences,
}) => {
  const [step, setStep] = useState(1);
  const [preferences, setPreferences] = useState(
    initialPreferences || {
      travelStyle: [],
      accommodation: [],
      budget: "",
      activities: [],
    }
  );

  const handlePreferenceToggle = (category: string, item: string) => {
    setPreferences((prev: { [x: string]: any }) => {
      const current = [
        ...(prev[category as keyof typeof prev] || []),
      ] as string[];

      if (current.includes(item)) {
        return {
          ...prev,
          [category]: current.filter((i) => i !== item),
        };
      } else {
        return {
          ...prev,
          [category]: [...current, item],
        };
      }
    });
  };

  const handleBudgetChange = (budget: string) => {
    setPreferences((prev) => ({
      ...prev,
      budget,
    }));
  };

  const handleNextStep = () => {
    setStep((prev) => prev + 1);
  };

  const handlePrevStep = () => {
    setStep((prev) => prev - 1);
  };

  const handleComplete = () => {
    onComplete(preferences);
  };

  // Background patterns based on step
  const getBackgroundPattern = () => {
    switch (step) {
      case 1:
        return "bg-gradient-to-br from-blue-50 to-indigo-50";
      case 2:
        return "bg-gradient-to-br from-purple-50 to-pink-50";
      case 3:
        return "bg-gradient-to-br from-green-50 to-emerald-50";
      default:
        return "bg-gray-50";
    }
  };

  return (
    <div className={`min-h-screen ${getBackgroundPattern()} flex flex-col`}>
      {/* Header */}
      <header className="bg-white shadow-md py-4 sticky top-0 z-10">
        <div className="container mx-auto px-4 flex items-center">
          <div className="flex items-center">
            <div className="w-10 h-10 rounded-full bg-blue-600 flex items-center justify-center text-white">
              <Compass size={24} />
            </div>
            <span className="ml-2 text-xl font-medium text-blue-600">
              Prefer Solo
            </span>
          </div>

          <div className="ml-auto flex items-center space-x-4">
            <div className="flex items-center space-x-2">
              <div className="text-sm font-medium text-gray-700">
                Step {step} of 3
              </div>
              <div className="w-32 h-2 bg-gray-200 rounded-full overflow-hidden">
                <div
                  className="h-full bg-blue-600 transition-all duration-300"
                  style={{ width: `${(step / 3) * 100}%` }}
                ></div>
              </div>
            </div>
          </div>
        </div>
      </header>

      <div className="flex-grow container mx-auto px-4 py-8 flex items-center justify-center">
        {step === 1 && (
          <div className="w-full max-w-3xl mx-auto bg-white rounded-2xl shadow-xl overflow-hidden">
            <div className="p-8 md:p-12">
              <div className="flex items-center mb-6">
                <div className="w-12 h-12 rounded-full bg-blue-100 flex items-center justify-center text-blue-600 mr-4">
                  <Plane size={24} />
                </div>
                <div>
                  <h1 className="text-3xl font-bold text-gray-900">
                    What's your travel style?
                  </h1>
                  <p className="text-gray-600 mt-1">
                    Select all that match your preferences
                  </p>
                </div>
              </div>

              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                {[
                  {
                    icon: <Plane size={20} />,
                    label: "Adventure Seeker",
                    color: "blue",
                  },
                  {
                    icon: <Camera size={20} />,
                    label: "Cultural Explorer",
                    color: "indigo",
                  },
                  {
                    icon: <Coffee size={20} />,
                    label: "Relaxation",
                    color: "purple",
                  },
                  {
                    icon: <Users size={20} />,
                    label: "Social Butterfly",
                    color: "pink",
                  },
                  {
                    icon: <MapPin size={20} />,
                    label: "Off the Beaten Path",
                    color: "orange",
                  },
                  {
                    icon: <Utensils size={20} />,
                    label: "Foodie",
                    color: "amber",
                  },
                  {
                    icon: <Sunset size={20} />,
                    label: "Luxury Travel",
                    color: "yellow",
                  },
                  {
                    icon: <Mountain size={20} />,
                    label: "Outdoor Enthusiast",
                    color: "lime",
                  },
                  {
                    icon: <Palmtree size={20} />,
                    label: "Beach Lover",
                    color: "emerald",
                  },
                  {
                    icon: <Music size={20} />,
                    label: "Festival Goer",
                    color: "teal",
                  },
                  {
                    icon: <Sparkles size={20} />,
                    label: "Pet Friendly",
                    color: "cyan",
                  },
                ].map((item, index) => {
                  const isSelected = preferences.travelStyle?.includes(
                    item.label
                  );
                  const colorClasses = {
                    blue: isSelected
                      ? "bg-blue-100 border-blue-500 text-blue-700"
                      : "hover:border-blue-300 hover:bg-blue-50",
                    indigo: isSelected
                      ? "bg-indigo-100 border-indigo-500 text-indigo-700"
                      : "hover:border-indigo-300 hover:bg-indigo-50",
                    purple: isSelected
                      ? "bg-purple-100 border-purple-500 text-purple-700"
                      : "hover:border-purple-300 hover:bg-purple-50",
                    pink: isSelected
                      ? "bg-pink-100 border-pink-500 text-pink-700"
                      : "hover:border-pink-300 hover:bg-pink-50",
                    orange: isSelected
                      ? "bg-orange-100 border-orange-500 text-orange-700"
                      : "hover:border-orange-300 hover:bg-orange-50",
                    amber: isSelected
                      ? "bg-amber-100 border-amber-500 text-amber-700"
                      : "hover:border-amber-300 hover:bg-amber-50",
                    yellow: isSelected
                      ? "bg-yellow-100 border-yellow-500 text-yellow-700"
                      : "hover:border-yellow-300 hover:bg-yellow-50",
                    lime: isSelected
                      ? "bg-lime-100 border-lime-500 text-lime-700"
                      : "hover:border-lime-300 hover:bg-lime-50",
                    emerald: isSelected
                      ? "bg-emerald-100 border-emerald-500 text-emerald-700"
                      : "hover:border-emerald-300 hover:bg-emerald-50",
                    teal: isSelected
                      ? "bg-teal-100 border-teal-500 text-teal-700"
                      : "hover:border-teal-300 hover:bg-teal-50",
                    cyan: isSelected
                      ? "bg-cyan-100 border-cyan-500 text-cyan-700"
                      : "hover:border-cyan-300 hover:bg-cyan-50",
                  };

                  return (
                    <button
                      key={index}
                      onClick={() =>
                        handlePreferenceToggle("travelStyle", item.label)
                      }
                      className={`p-3 rounded-xl border-2 flex items-center transition-all ${
                        isSelected ? "border-2" : "border-gray-200"
                      } ${
                        colorClasses[item.color as keyof typeof colorClasses]
                      }`}
                    >
                      <div
                        className={`mr-3 ${
                          isSelected ? "text-current" : "text-gray-500"
                        }`}
                      >
                        {item.icon}
                      </div>
                      <div className="font-medium text-sm">{item.label}</div>
                      {isSelected && <Check size={16} className="ml-auto" />}
                    </button>
                  );
                })}
              </div>

              <div className="mt-10 flex justify-end">
                <button
                  onClick={handleNextStep}
                  className="px-6 py-3 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 transition-colors shadow-md hover:shadow-lg transform hover:-translate-y-0.5 transition-all"
                >
                  Continue
                </button>
              </div>
            </div>
          </div>
        )}

        {step === 2 && (
          <div className="w-full max-w-3xl mx-auto bg-white rounded-2xl shadow-xl overflow-hidden">
            <div className="p-8 md:p-12">
              <div className="flex items-center mb-6">
                <div className="w-12 h-12 rounded-full bg-purple-100 flex items-center justify-center text-purple-600 mr-4">
                  <Bed size={24} />
                </div>
                <div>
                  <h1 className="text-3xl font-bold text-gray-900">
                    Budget & Accommodation
                  </h1>
                  <p className="text-gray-600 mt-1">
                    Tell us about your travel budget and where you like to stay
                  </p>
                </div>
              </div>

              <div className="mb-10">
                <h2 className="text-xl font-semibold mb-4">
                  What's your budget range?
                </h2>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  {[
                    {
                      label: "Budget",
                      description: "Under $50/day",
                      color: "green",
                    },
                    {
                      label: "Mid-range",
                      description: "$50-150/day",
                      color: "blue",
                    },
                    {
                      label: "Luxury",
                      description: "Over $150/day",
                      color: "purple",
                    },
                  ].map((item, index) => {
                    const isSelected = preferences.budget === item.label;
                    const colorClasses = {
                      green: isSelected
                        ? "bg-green-100 border-green-500 text-green-700"
                        : "hover:border-green-300 hover:bg-green-50",
                      blue: isSelected
                        ? "bg-blue-100 border-blue-500 text-blue-700"
                        : "hover:border-blue-300 hover:bg-blue-50",
                      purple: isSelected
                        ? "bg-purple-100 border-purple-500 text-purple-700"
                        : "hover:border-purple-300 hover:bg-purple-50",
                    };

                    return (
                      <button
                        key={index}
                        onClick={() => handleBudgetChange(item.label)}
                        className={`p-6 rounded-xl border-2 flex flex-col items-center text-center transition-all ${
                          isSelected ? "border-2" : "border-gray-200"
                        } ${
                          colorClasses[item.color as keyof typeof colorClasses]
                        }`}
                      >
                        <div className="font-medium text-lg mb-2">
                          {item.label}
                        </div>
                        <div className="text-sm text-gray-500">
                          {item.description}
                        </div>
                        {isSelected && <Check size={20} className="mt-3" />}
                      </button>
                    );
                  })}
                </div>
              </div>

              <div>
                <h2 className="text-xl font-semibold mb-4">
                  Accommodation preferences
                </h2>

                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  {[
                    {
                      icon: <Bed size={20} />,
                      label: "Hostels",
                      color: "pink",
                    },
                    { icon: <Bed size={20} />, label: "Hotels", color: "blue" },
                    { icon: <Bed size={20} />, label: "Airbnb", color: "red" },
                    {
                      icon: <Bed size={20} />,
                      label: "Couchsurfing",
                      color: "orange",
                    },
                  ].map((item, index) => {
                    const isSelected = preferences.accommodation?.includes(
                      item.label
                    );
                    const colorClasses = {
                      pink: isSelected
                        ? "bg-pink-100 border-pink-500 text-pink-700"
                        : "hover:border-pink-300 hover:bg-pink-50",
                      blue: isSelected
                        ? "bg-blue-100 border-blue-500 text-blue-700"
                        : "hover:border-blue-300 hover:bg-blue-50",
                      red: isSelected
                        ? "bg-red-100 border-red-500 text-red-700"
                        : "hover:border-red-300 hover:bg-red-50",
                      orange: isSelected
                        ? "bg-orange-100 border-orange-500 text-orange-700"
                        : "hover:border-orange-300 hover:bg-orange-50",
                    };

                    return (
                      <button
                        key={index}
                        onClick={() =>
                          handlePreferenceToggle("accommodation", item.label)
                        }
                        className={`p-4 rounded-xl border-2 flex flex-col items-center text-center transition-all ${
                          isSelected ? "border-2" : "border-gray-200"
                        } ${
                          colorClasses[item.color as keyof typeof colorClasses]
                        }`}
                      >
                        <div
                          className={`mb-2 ${
                            isSelected ? "text-current" : "text-gray-500"
                          }`}
                        >
                          {item.icon}
                        </div>
                        <div className="font-medium text-sm">{item.label}</div>
                        {isSelected && <Check size={16} className="mt-2" />}
                      </button>
                    );
                  })}
                </div>
              </div>

              <div className="mt-10 flex justify-between">
                <button
                  onClick={handlePrevStep}
                  className="px-6 py-3 bg-white border border-gray-300 text-gray-700 rounded-lg font-medium hover:bg-gray-50 transition-colors"
                >
                  Back
                </button>
                <button
                  onClick={handleNextStep}
                  className="px-6 py-3 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 transition-colors shadow-md hover:shadow-lg transform hover:-translate-y-0.5 transition-all"
                >
                  Continue
                </button>
              </div>
            </div>
          </div>
        )}

        {step === 3 && (
          <div className="w-full max-w-3xl mx-auto bg-white rounded-2xl shadow-xl overflow-hidden">
            <div className="p-8 md:p-12">
              <div className="flex items-center mb-6">
                <div className="w-12 h-12 rounded-full bg-green-100 flex items-center justify-center text-green-600 mr-4">
                  <Camera size={24} />
                </div>
                <div>
                  <h1 className="text-3xl font-bold text-gray-900">
                    Activities You Enjoy
                  </h1>
                  <p className="text-gray-600 mt-1">
                    Select the activities that make your trip memorable
                  </p>
                </div>
              </div>

              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                {[
                  { label: "Hiking", color: "emerald" },
                  { label: "Museums", color: "amber" },
                  { label: "Local Cuisine", color: "red" },
                  { label: "Photography", color: "blue" },
                  { label: "Nightlife", color: "purple" },
                  { label: "Shopping", color: "pink" },
                  { label: "Beach", color: "cyan" },
                  { label: "Historical Sites", color: "orange" },
                  { label: "Nature", color: "lime" },
                  { label: "Festivals", color: "indigo" },
                  { label: "Water Sports", color: "sky" },
                  { label: "Wildlife", color: "green" },
                ].map((item, index) => {
                  const isSelected = preferences.activities?.includes(
                    item.label
                  );
                  const colorClasses = {
                    emerald: isSelected
                      ? "bg-emerald-100 border-emerald-500 text-emerald-700"
                      : "hover:border-emerald-300 hover:bg-emerald-50",
                    amber: isSelected
                      ? "bg-amber-100 border-amber-500 text-amber-700"
                      : "hover:border-amber-300 hover:bg-amber-50",
                    red: isSelected
                      ? "bg-red-100 border-red-500 text-red-700"
                      : "hover:border-red-300 hover:bg-red-50",
                    blue: isSelected
                      ? "bg-blue-100 border-blue-500 text-blue-700"
                      : "hover:border-blue-300 hover:bg-blue-50",
                    purple: isSelected
                      ? "bg-purple-100 border-purple-500 text-purple-700"
                      : "hover:border-purple-300 hover:bg-purple-50",
                    pink: isSelected
                      ? "bg-pink-100 border-pink-500 text-pink-700"
                      : "hover:border-pink-300 hover:bg-pink-50",
                    cyan: isSelected
                      ? "bg-cyan-100 border-cyan-500 text-cyan-700"
                      : "hover:border-cyan-300 hover:bg-cyan-50",
                    orange: isSelected
                      ? "bg-orange-100 border-orange-500 text-orange-700"
                      : "hover:border-orange-300 hover:bg-orange-50",
                    lime: isSelected
                      ? "bg-lime-100 border-lime-500 text-lime-700"
                      : "hover:border-lime-300 hover:bg-lime-50",
                    indigo: isSelected
                      ? "bg-indigo-100 border-indigo-500 text-indigo-700"
                      : "hover:border-indigo-300 hover:bg-indigo-50",
                    sky: isSelected
                      ? "bg-sky-100 border-sky-500 text-sky-700"
                      : "hover:border-sky-300 hover:bg-sky-50",
                    green: isSelected
                      ? "bg-green-100 border-green-500 text-green-700"
                      : "hover:border-green-300 hover:bg-green-50",
                  };

                  return (
                    <button
                      key={index}
                      onClick={() =>
                        handlePreferenceToggle("activities", item.label)
                      }
                      className={`p-3 rounded-xl border-2 flex items-center justify-between transition-all ${
                        isSelected ? "border-2" : "border-gray-200"
                      } ${
                        colorClasses[item.color as keyof typeof colorClasses]
                      }`}
                    >
                      <div className="font-medium text-sm">{item.label}</div>
                      {isSelected && <Check size={16} className="ml-2" />}
                    </button>
                  );
                })}
              </div>

              <div className="mt-10 flex justify-between">
                <button
                  onClick={handlePrevStep}
                  className="px-6 py-3 bg-white border border-gray-300 text-gray-700 rounded-lg font-medium hover:bg-gray-50 transition-colors"
                >
                  Back
                </button>
                <button
                  onClick={handleComplete}
                  className="px-6 py-3 bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-lg font-medium hover:from-blue-700 hover:to-indigo-700 transition-colors shadow-md hover:shadow-lg transform hover:-translate-y-0.5 transition-all"
                >
                  Complete Setup
                </button>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Footer with progress indicators */}
      <footer className="bg-white py-4 border-t border-gray-200">
        <div className="container mx-auto px-4 flex justify-center">
          <div className="flex space-x-2">
            {[1, 2, 3].map((i) => (
              <button
                key={i}
                onClick={() => setStep(i)}
                className={`w-3 h-3 rounded-full transition-all ${
                  step === i
                    ? "bg-blue-600 scale-125"
                    : "bg-gray-300 hover:bg-gray-400"
                }`}
                aria-label={`Go to step ${i}`}
              />
            ))}
          </div>
        </div>
      </footer>
    </div>
  );
};

export default PreferencesPage;
