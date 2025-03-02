import React, {
  createContext,
  useContext,
  useState,
  useEffect,
  ReactNode,
} from "react";
import toast from "react-hot-toast";

// Mock user type
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
    password: string,
    firstName: string,
    lastName: string
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
  const [loading, setLoading] = useState(true);

  // Check if user is logged in from localStorage
  useEffect(() => {
    const storedUser = localStorage.getItem("prefer_auth_user");
    if (storedUser) {
      setCurrentUser(JSON.parse(storedUser));
    }
    setLoading(false);
  }, []);

  // Mock database to store users
  const addUserToMockDb = (userData: any) => {
    const existingUsers = localStorage.getItem("prefer_users");
    let users = existingUsers ? JSON.parse(existingUsers) : {};
    users[userData.uid] = userData;
    localStorage.setItem("prefer_users", JSON.stringify(users));
    return userData;
  };

  // Get user from mock db
  const getUserFromMockDb = (uid: string) => {
    const existingUsers = localStorage.getItem("prefer_users");
    if (!existingUsers) return null;

    const users = JSON.parse(existingUsers);
    return users[uid] || null;
  };

  // Check if email exists
  const emailExists = (email: string) => {
    const existingUsers = localStorage.getItem("prefer_users");
    if (!existingUsers) return false;

    const users = JSON.parse(existingUsers);
    return Object.values(users).some((user: any) => user.email === email);
  };

  const signUpWithEmail = async (
    email: string,
    password: string,
    firstName: string,
    lastName: string
  ): Promise<MockUser | null> => {
    try {
      // Check if email already exists
      if (emailExists(email)) {
        toast.error("Email already in use. Please sign in instead.");
        return null;
      }

      // Create a mock user
      const uid = `email_${Date.now()}`;
      const mockUser: MockUser = {
        uid,
        email,
        displayName: `${firstName} ${lastName}`,
      };

      // Create full user profile
      const userData = {
        uid,
        firstName,
        lastName,
        email,
        authProvider: "email",
        password, // In a real app, NEVER store plain passwords
        createdAt: new Date().toISOString(),
      };

      // Store in mock db
      addUserToMockDb(userData);

      // Store auth user in localStorage
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
      // Get users from mock db
      const existingUsers = localStorage.getItem("prefer_users");
      if (!existingUsers) {
        toast.error("No user found with this email. Please sign up.");
        return null;
      }

      const users = JSON.parse(existingUsers);
      const user = Object.values(users).find((u: any) => u.email === email);

      if (!user) {
        toast.error("No user found with this email. Please sign up.");
        return null;
      }

      // Check password
      if ((user as any).password !== password) {
        toast.error("Invalid password. Please try again.");
        return null;
      }

      // Create auth user
      const mockUser: MockUser = {
        uid: (user as any).uid,
        email: (user as any).email,
        displayName: `${(user as any).firstName} ${(user as any).lastName}`,
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
      const uid = `google_${Date.now()}`;
      const mockUser: MockUser = {
        uid,
        email: "google.user@example.com",
        displayName: "Google User",
      };

      // Check if this Google user already exists
      const existingUsers = localStorage.getItem("prefer_users");
      let users = existingUsers ? JSON.parse(existingUsers) : {};

      let existingUser = null;
      for (const id in users) {
        if (
          users[id].email === mockUser.email &&
          users[id].authProvider === "google"
        ) {
          existingUser = users[id];
          break;
        }
      }

      // If user exists, use the existing user's ID
      if (existingUser) {
        mockUser.uid = existingUser.uid;
      } else {
        // Create full user profile
        const userData = {
          uid,
          firstName: "Google",
          lastName: "User",
          email: mockUser.email,
          authProvider: "google",
          createdAt: new Date().toISOString(),
        };
        addUserToMockDb(userData);
      }

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
      const uid = `apple_${Date.now()}`;
      const mockUser: MockUser = {
        uid,
        email: "apple.user@example.com",
        displayName: "Apple User",
      };

      // Check if this Apple user already exists
      const existingUsers = localStorage.getItem("prefer_users");
      let users = existingUsers ? JSON.parse(existingUsers) : {};

      let existingUser = null;
      for (const id in users) {
        if (
          users[id].email === mockUser.email &&
          users[id].authProvider === "apple"
        ) {
          existingUser = users[id];
          break;
        }
      }

      // If user exists, use the existing user's ID
      if (existingUser) {
        mockUser.uid = existingUser.uid;
      } else {
        // Create full user profile
        const userData = {
          uid,
          firstName: "Apple",
          lastName: "User",
          email: mockUser.email,
          authProvider: "apple",
          createdAt: new Date().toISOString(),
        };
        addUserToMockDb(userData);
      }

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
