import React, {
  createContext,
  useContext,
  useState,
  useEffect,
  ReactNode,
} from "react";
import toast from "react-hot-toast";

// Mock user type to replace Firebase User
interface MockUser {
  uid: string;
  email: string | null;
  displayName?: string | null;
}

interface AuthContextType {
  currentUser: MockUser | null;
  loading: boolean;
  signUpWithEmail: (
    email: string,
    password: string
  ) => Promise<MockUser | null>;
  signInWithEmail: (
    email: string,
    password: string
  ) => Promise<MockUser | null>;
  signInWithGoogle: () => Promise<MockUser | null>;
  signInWithApple: () => Promise<MockUser | null>;
  logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | null>(null);

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
};

interface AuthProviderProps {
  children: ReactNode;
}

export const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
  const [currentUser, setCurrentUser] = useState<MockUser | null>(null);
  const [loading, setLoading] = useState(false);

  // Check if user is logged in from localStorage
  useEffect(() => {
    const storedUser = localStorage.getItem("prefer_auth_user");
    if (storedUser) {
      setCurrentUser(JSON.parse(storedUser));
    }
    setLoading(false);
  }, []);

  const signUpWithEmail = async (
    email: string,
    password: string
  ): Promise<MockUser | null> => {
    try {
      // Create a mock user
      const mockUser: MockUser = {
        uid: `email_${Date.now()}`,
        email: email,
      };

      // Store in localStorage
      localStorage.setItem("prefer_auth_user", JSON.stringify(mockUser));
      setCurrentUser(mockUser);

      toast.success("Account created successfully!");
      return mockUser;
    } catch (error: any) {
      toast.error(error.message || "Failed to create account");
      return null;
    }
  };

  const signInWithEmail = async (
    email: string,
    password: string
  ): Promise<MockUser | null> => {
    try {
      // In a real app, we would validate credentials
      // For now, just create a mock user
      const mockUser: MockUser = {
        uid: `email_${Date.now()}`,
        email: email,
      };

      localStorage.setItem("prefer_auth_user", JSON.stringify(mockUser));
      setCurrentUser(mockUser);

      toast.success("Signed in successfully!");
      return mockUser;
    } catch (error: any) {
      toast.error(error.message || "Failed to sign in");
      return null;
    }
  };

  const signInWithGoogle = async (): Promise<MockUser | null> => {
    try {
      // Create a mock Google user
      const mockUser: MockUser = {
        uid: `google_${Date.now()}`,
        email: "google.user@example.com",
        displayName: "Google User",
      };

      localStorage.setItem("prefer_auth_user", JSON.stringify(mockUser));
      setCurrentUser(mockUser);

      toast.success("Signed in with Google successfully!");
      return mockUser;
    } catch (error: any) {
      toast.error(error.message || "Failed to sign in with Google");
      return null;
    }
  };

  const signInWithApple = async (): Promise<MockUser | null> => {
    try {
      // Create a mock Apple user
      const mockUser: MockUser = {
        uid: `apple_${Date.now()}`,
        email: "apple.user@example.com",
        displayName: "Apple User",
      };

      localStorage.setItem("prefer_auth_user", JSON.stringify(mockUser));
      setCurrentUser(mockUser);

      toast.success("Signed in with Apple successfully!");
      return mockUser;
    } catch (error: any) {
      toast.error(error.message || "Failed to sign in with Apple");
      return null;
    }
  };

  const logout = async (): Promise<void> => {
    try {
      localStorage.removeItem("prefer_auth_user");
      setCurrentUser(null);
      toast.success("Signed out successfully!");
    } catch (error: any) {
      toast.error(error.message || "Failed to sign out");
    }
  };

  const value = {
    currentUser,
    loading,
    signUpWithEmail,
    signInWithEmail,
    signInWithGoogle,
    signInWithApple,
    logout,
  };

  return (
    <AuthContext.Provider value={value}>
      {!loading && children}
    </AuthContext.Provider>
  );
};
