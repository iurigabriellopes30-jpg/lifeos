import { createContext, useContext, useState, ReactNode, useEffect } from "react";
import { apiUrl } from "./api";

interface User {
  id: number;
  email: string;
}

interface AuthContextType {
  isAuthenticated: boolean;
  user: User | null;
  token: string | null;
  onboardingCompleted: boolean;
  consultationStarted: boolean;
  login: (email: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
  loading: boolean;
  error: string | null;
  checkOnboardingStatus: () => Promise<void>;
  setAuthFromToken: (token: string) => Promise<void>;
  markConsultationStarted: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [onboardingCompleted, setOnboardingCompleted] = useState(false);
  const [consultationStarted, setConsultationStarted] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Check onboarding status
  const checkOnboardingStatus = async () => {
    try {
      const storedToken = sessionStorage.getItem("lifeos:token");
      const headers: Record<string, string> = {};
      if (storedToken) {
        headers["Authorization"] = `Bearer ${storedToken}`;
      }

      const response = await fetch(apiUrl("/auth/me"), {
        method: "GET",
        credentials: "include",
        headers,
      });

      if (response.ok) {
        const data = await response.json();
        setOnboardingCompleted(data.onboardingCompleted || false);
        setConsultationStarted(data.consultationStarted || false);
      }
    } catch (err) {
      console.error("Onboarding status check failed:", err);
      setOnboardingCompleted(false);
      setConsultationStarted(false);
    }
  };

  const markConsultationStarted = async () => {
    try {
      const storedToken = sessionStorage.getItem("lifeos:token");
      const headers: Record<string, string> = { "Content-Type": "application/json" };
      if (storedToken) {
        headers["Authorization"] = `Bearer ${storedToken}`;
      }

      const response = await fetch(apiUrl("/auth/mark-consultation-started"), {
        method: "POST",
        credentials: "include",
        headers,
      });

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}`);
      }

      setConsultationStarted(true);
    } catch (err) {
      console.error("Failed to mark consultation started:", err);
      // Ainda assim marca como iniciado no frontend mesmo se falhar no backend
      setConsultationStarted(true);
    }
  };

  // Check if user is already logged in
  useEffect(() => {
    const checkAuth = async () => {
      try {
        setLoading(true);
        const storedToken = sessionStorage.getItem("lifeos:token");
        if (storedToken) {
          // Verify token by calling /auth/me with Authorization header
          const response = await fetch(apiUrl("/auth/me"), {
            method: "GET",
            credentials: "include",
            headers: {
              "Authorization": `Bearer ${storedToken}`,
            },
          });

          if (response.ok) {
            const userData = await response.json();
            setToken(storedToken);
            setUser(userData);
            setIsAuthenticated(true);
            // Check onboarding status
            await checkOnboardingStatus();
          } else {
            // Token invalid, clear
            sessionStorage.removeItem("lifeos:token");
            setToken(null);
            setUser(null);
            setIsAuthenticated(false);
          }
        }
      } catch (err) {
        console.error("Auth check failed:", err);
        sessionStorage.removeItem("lifeos:token");
        setToken(null);
        setUser(null);
        setIsAuthenticated(false);
      } finally {
        setLoading(false);
      }
    };

    checkAuth();
  }, []);

  const login = async (email: string, password: string) => {
    try {
      setError(null);
      const response = await fetch(apiUrl("/auth/login"), {
        method: "POST",
        credentials: "include",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ email, password }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.detail || "Login failed");
      }

      const data = await response.json();
      setToken(data.token);
      setUser(data.user);
      setIsAuthenticated(true);
      sessionStorage.setItem("lifeos:token", data.token);
      
      // Check onboarding status after successful login
      await checkOnboardingStatus();
    } catch (err) {
      const message = err instanceof Error ? err.message : "Login failed";
      setError(message);
      throw err;
    }
  };

  const logout = async () => {
    try {
      await fetch(apiUrl("/auth/logout"), {
        method: "POST",
        credentials: "include",
        headers: {
          "Authorization": `Bearer ${token}`,
        },
      });
    } catch (err) {
      console.error("Logout error:", err);
    } finally {
      setIsAuthenticated(false);
      setUser(null);
      setToken(null);
      setOnboardingCompleted(false);
      sessionStorage.removeItem("lifeos:token");
    }
  };

  // Set auth directly from token (used after signup)
  const setAuthFromToken = async (token: string) => {
    try {
      sessionStorage.setItem("lifeos:token", token);
      setToken(token);
      
      // Verify token and get user info
      const response = await fetch(apiUrl("/auth/me"), {
        method: "GET",
        credentials: "include",
        headers: {
          "Authorization": `Bearer ${token}`,
        },
      });

      if (response.ok) {
        const userData = await response.json();
        setUser(userData);
        setIsAuthenticated(true);
        console.log("[AUTH] Token autenticado, usuário:", userData.email);
      }
    } catch (err) {
      console.error("setAuthFromToken error:", err);
      sessionStorage.removeItem("lifeos:token");
      setToken(null);
      setUser(null);
      setIsAuthenticated(false);
    }
  };

  return (
    <AuthContext.Provider
      value={{ isAuthenticated, user, token, onboardingCompleted, consultationStarted, login, logout, loading, error, checkOnboardingStatus, setAuthFromToken, markConsultationStarted }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within AuthProvider");
  }
  return context;
}
