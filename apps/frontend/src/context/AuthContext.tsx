// src/context/AuthContext.tsx
import { createContext, useContext, useState, useEffect } from "react";

const AuthContext = createContext(null);

const BaseUrl = "http://localhost:5176";

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  const fetchUser = async () => {
    try {
      const res = await fetch(`${BaseUrl}/api/Auth/me`, {
        credentials: "include",
      });
      if (res.ok) setUser(await res.json());
      else setUser(null);
    } finally {
      setLoading(false);
    }
  };

  const login = async (email: string, password: string) => {
    await fetch(`${BaseUrl}/api/Auth/login`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      credentials: "include",
      body: JSON.stringify({ email, password }),
    });
    await fetchUser();
  };

  const logout = async () => {
    await fetch(`${BaseUrl}/api/Auth/logout`, {
      method: "POST",
      credentials: "include",
    });
    setUser(null);
  };

  useEffect(() => {
    fetchUser();
  }, []);

  return (
    // @ts-ignore
    <AuthContext.Provider value={{ user, loading, login, logout, fetchUser }}>
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => useContext(AuthContext);
