// src/context/AuthContext.tsx
import { createContext, useContext, useState, useEffect } from "react";
import { useAuth as useClerkAuth, useUser } from "@clerk/tanstack-react-start";

const AuthContext = createContext(null);

const BaseUrl = import.meta.env.VITE_API_BASE_URL || "http://localhost:5176";

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const { isSignedIn, isLoaded: clerkLoaded, getToken } = useClerkAuth();
  const { user: clerkUser } = useUser();
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  // Fetch user data from your backend using Clerk token
  const fetchUser = async () => {
    try {
      if (!isSignedIn || !clerkLoaded) {
        setUser(null);
        setLoading(false);
        return;
      }

      // Get Clerk JWT token with custom template
      // Replace 'custom' with your JWT template name from Clerk Dashboard
      const token = await getToken({ template: "neon" });
      if (!token) {
        setUser(null);
        setLoading(false);
        return;
      }

      // Fetch user from your backend
      const res = await fetch(`${BaseUrl}/api/User/me`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (res.ok) {
        const userData = await res.json();
        setUser(userData);
      } else {
        // If user doesn't exist in backend, they might need to be synced via webhook
        console.warn(
          "User not found in backend database. Webhook sync may be pending."
        );
        setUser(null);
      }
    } catch (error) {
      console.error("Error fetching user:", error);
      setUser(null);
    } finally {
      setLoading(false);
    }
  };

  // Fetch user data whenever Clerk auth state changes
  useEffect(() => {
    if (clerkLoaded) {
      fetchUser();
    }
  }, [isSignedIn, clerkLoaded, clerkUser?.id]);

  const value = {
    user, // Your backend user data
    clerkUser, // Clerk user object
    isSignedIn,
    loading: !clerkLoaded || loading,
    fetchUser,
    getToken, // Function to get Clerk JWT token
  };

  return (
    // @ts-ignore
    <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
  );
}

export const useAuth = () => useContext(AuthContext);
