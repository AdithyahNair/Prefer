import React, { useState, useEffect } from "react";
import { Eye, EyeOff, ArrowUpRight, Compass } from "lucide-react";
import { Toaster } from "react-hot-toast";
import SignUpForm from "./components/SignUpForm";
import SignInForm from "./components/SignInForm";
import PreferencesPage from "./components/PreferencesPage";
import Dashboard from "./components/Dashboard";
import { AuthProvider, useAuth } from "./context/AuthContext";

function AppContent() {
  const { currentUser, logout } = useAuth();
  const [isSignUp, setIsSignUp] = useState(true);
  const [isNewUser, setIsNewUser] = useState(false);
  const [userData, setUserData] = useState<any>(null);

  // Check if user data exists in localStorage on component mount
  useEffect(() => {
    const storedUserData = localStorage.getItem("prefer_user");
    if (storedUserData) {
      const parsedUserData = JSON.parse(storedUserData);
      setUserData(parsedUserData);

      // Check if user has completed preferences
      if (!parsedUserData.preferencesCompleted) {
        setIsNewUser(true);
      }
    }
  }, []);

  // Update userData when currentUser changes
  useEffect(() => {
    if (currentUser) {
      // If we have a Firebase user but no local userData, create it
      if (!userData) {
        const newUserData = {
          uid: currentUser.uid,
          email: currentUser.email,
          preferencesCompleted: false,
        };
        setUserData(newUserData);
        localStorage.setItem("prefer_user", JSON.stringify(newUserData));
        setIsNewUser(true);
      }
    } else {
      // If no Firebase user, clear userData
      if (userData) {
        setUserData(null);
      }
    }
  }, [currentUser]);

  const handleSignUp = (newUserData: any) => {
    // Mark as new user to show preferences page
    setIsNewUser(true);

    // Store user data in localStorage with preferences not completed
    const userToSave = {
      ...newUserData,
      preferencesCompleted: false,
    };
    setUserData(userToSave);
    localStorage.setItem("prefer_user", JSON.stringify(userToSave));
  };

  const handleSignIn = (existingUserData: any) => {
    // Check if we have existing data in localStorage
    const storedUserData = localStorage.getItem("prefer_user");

    if (storedUserData) {
      const parsedUserData = JSON.parse(storedUserData);

      // Update with latest auth data
      const updatedUserData = {
        ...parsedUserData,
        uid: existingUserData.uid,
        email: existingUserData.email,
        lastLogin: new Date().toISOString(),
      };

      setUserData(updatedUserData);
      localStorage.setItem("prefer_user", JSON.stringify(updatedUserData));

      // Check if preferences are completed
      if (!updatedUserData.preferencesCompleted) {
        setIsNewUser(true);
      }
    } else {
      // No existing data, treat as new user
      const newUserData = {
        ...existingUserData,
        preferencesCompleted: false,
        lastLogin: new Date().toISOString(),
      };

      setUserData(newUserData);
      localStorage.setItem("prefer_user", JSON.stringify(newUserData));
      setIsNewUser(true);
    }
  };

  const handlePreferencesComplete = (preferences: any) => {
    // Update user data with preferences and mark as completed
    if (userData) {
      const updatedUserData = {
        ...userData,
        preferences,
        preferencesCompleted: true,
      };
      setUserData(updatedUserData);
      localStorage.setItem("prefer_user", JSON.stringify(updatedUserData));
      setIsNewUser(false);
    }
  };

  const handleSignOut = () => {
    localStorage.removeItem("prefer_user");
    setUserData(null);
    setIsNewUser(false);
  };

  const toggleAuthMode = () => {
    setIsSignUp(!isSignUp);
  };

  // If authenticated and new user, show preferences page
  if (userData && isNewUser) {
    return <PreferencesPage onComplete={handlePreferencesComplete} />;
  }

  // If authenticated and not new user, show dashboard
  if (userData && !isNewUser) {
    return <Dashboard userData={userData} onSignOut={handleSignOut} />;
  }

  // Otherwise show the sign up / login page
  return (
    <div className="flex flex-col md:flex-row h-screen w-full">
      {/* Left side - Travel-themed section */}
      <div className="w-full md:w-1/2 bg-blue-50 text-gray-800 p-8 flex flex-col relative overflow-hidden">
        <div className="flex-grow flex items-center justify-center relative">
          {/* Background travel elements */}
          <div className="absolute w-full h-full flex items-center justify-center">
            <div className="w-64 h-64 rounded-full bg-blue-100 opacity-40 blur-lg"></div>
            <div className="absolute inset-0 flex items-center justify-center">
              <svg
                viewBox="0 0 24 24"
                className="w-48 h-48 text-blue-200 opacity-60"
                fill="none"
                stroke="currentColor"
                strokeWidth="1"
              >
                <path d="M12 2L2 7L12 12L22 7L12 2Z" />
                <path d="M2 17L12 22L22 17" />
                <path d="M2 12L12 17L22 12" />
              </svg>
            </div>
          </div>

          {/* Main travel illustration */}
          <div className="relative z-10 text-center space-y-8">
            <div className="inline-block p-6 bg-white rounded-2xl shadow-lg">
              <svg
                className="w-16 h-16 text-blue-600"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth="2"
                  d="M3.055 11H5a2 2 0 012 2v1a2 2 0 002 2 2 2 0 012 2v2.945M8 3.935V5.5A2.5 2.5 0 0010.5 8h.5a2 2 0 012 2 2 2 0 104 0 2 2 0 012-2h1.064M15 20.488V18a2 2 0 012-2h3.064M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                />
              </svg>
            </div>
            <div className="space-y-2">
              <div className="inline-block px-4 py-2 bg-white rounded-full text-sm font-medium shadow-sm">
                ✈️ Next Destination
              </div>
              <h3 className="text-2xl font-semibold">Explore NYC</h3>
            </div>
          </div>
        </div>

        <div className="mt-16">
          <div className="flex items-center">
            <h2 className="text-5xl font-bold">Create</h2>
            <div className="ml-2 w-10 h-10 bg-blue-600 text-white rounded-full flex items-center justify-center">
              <ArrowUpRight className="text-white" size={20} />
            </div>
          </div>
          <h2 className="text-5xl font-bold mt-2">Travel Plans</h2>
          <p className="mt-4 text-gray-600 max-w-md">
            Design personalized travel itineraries that reflect your style and
            preferences with our easy-to-use customization tools.
          </p>
        </div>
      </div>
      {/* Right side - Light section with sign up/in form */}
      <div className="w-full md:w-1/2 bg-white p-8 flex flex-col">
        <div className="flex items-center">
          <div className="w-10 h-10 rounded-full bg-blue-600 flex items-center justify-center text-white">
            <Compass size={24} />
          </div>
          <span className="ml-2 text-xl font-medium text-blue-600">Prefer</span>
        </div>

        {isSignUp ? (
          <SignUpForm onSignUp={handleSignUp} onToggleMode={toggleAuthMode} />
        ) : (
          <SignInForm onSignIn={handleSignIn} onToggleMode={toggleAuthMode} />
        )}
      </div>
    </div>
  );
}

function App() {
  return (
    <AuthProvider>
      <Toaster position="top-center" />
      <AppContent />
    </AuthProvider>
  );
}

export default App;
