"use client";

import React, { createContext, useContext, useState, useEffect } from "react";
import axios from "axios";

// Define types
interface User {
  id: string;
  email: string;
  full_name: string;
  is_active: boolean;
}

interface AuthContextType {
  user: User | null;
  token: string | null;
  login: (token: string) => Promise<void>;
  logout: () => void;
  isAuthenticated: boolean;
  isLoading: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider = ({ children }: { children: React.ReactNode }) => {
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // Initialize auth state from localStorage
  useEffect(() => {
    const storedToken = localStorage.getItem("token");
    if (storedToken) {
      setToken(storedToken);
      fetchUser(storedToken);
    } else {
      setIsLoading(false);
    }
  }, []);

  const fetchUser = async (authToken: string) => {
    console.log("Fetching user with token:", authToken);
    try {
      const response = await axios.get("http://localhost:8000/auth/users/me", {
        headers: { Authorization: `Bearer ${authToken}` },
      });
      console.log("User fetched successfully:", response.data);
      setUser(response.data);
    } catch (error) {
      console.error("Failed to fetch user", error);
      logout();
    } finally {
      setIsLoading(false);
    }
  };

  const login = async (newToken: string) => {
    localStorage.setItem("token", newToken);
    setToken(newToken);
    await fetchUser(newToken);
  };

  const logout = () => {
    localStorage.removeItem("token");
    setToken(null);
    setUser(null);
    // Don't use router here - let the pages handle redirect via useEffect
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        token,
        login,
        logout,
        isAuthenticated: !!user,
        isLoading,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
};
