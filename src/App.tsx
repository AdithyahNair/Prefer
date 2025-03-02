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
      {/* Left side - Dark section with card display */}
      <div className="w-full md:w-1/2 bg-gray-900 text-white p-8 flex flex-col relative overflow-hidden">
        <div className="absolute top-8 left-8">
          <div className="text-xl font-light">01/03</div>
        </div>

        <div className="flex-grow flex items-center justify-center relative">
          {/* Card in background (lighter) */}
          <div className="absolute transform rotate-12 translate-x-12 -translate-y-12 opacity-60">
            <div className="w-72 h-44 bg-gray-300 rounded-xl p-5 text-gray-800 shadow-lg">
              <div className="flex justify-between">
                <div className="w-8 h-8 rounded-full bg-red-500 flex items-center justify-center">
                  <div className="w-4 h-2 bg-white rounded-sm"></div>
                </div>
              </div>
              <div className="mt-8 text-xs">Account number</div>
              <div className="font-mono">**** **** **** 9568</div>
              <div className="mt-8 flex justify-between items-center">
                <div className="text-2xl font-bold">PR</div>
              </div>
            </div>
          </div>

          {/* Main card (darker) */}
          <div className="w-72 h-44 bg-gray-800 rounded-xl p-5 shadow-xl z-10">
            <div className="flex justify-between">
              <div className="w-8 h-8 rounded-full bg-red-500 flex items-center justify-center">
                <div className="w-4 h-2 bg-white rounded-sm"></div>
              </div>
            </div>
            <div className="mt-8 text-xs">Account number</div>
            <div className="font-mono">
              **** **** **** 9568 <span className="ml-2">👁️</span>
            </div>
            <div className="mt-8 flex justify-between items-center">
              <div className="text-2xl font-bold">PR</div>
              <div className="flex items-center">
                <div className="font-mono mr-2">$2,458.00</div>
                <Eye size={16} />
              </div>
            </div>
          </div>
        </div>

        <div className="mt-16">
          <div className="flex items-center">
            <h2 className="text-5xl font-bold">Create</h2>
            <div className="ml-2 w-10 h-10 bg-white bg-opacity-20 rounded-full flex items-center justify-center">
              <ArrowUpRight className="text-white" size={20} />
            </div>
          </div>
          <h2 className="text-5xl font-bold mt-2">Travel Plans</h2>
          <p className="mt-4 text-gray-400 max-w-md">
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
