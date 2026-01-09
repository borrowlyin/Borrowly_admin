import React, {
  createContext,
  useContext,
  useState,
  useEffect,
  ReactNode,
} from "react";

interface User {
  id: string;
  email: string;
  name: string;
  role: string;
}

interface AuthError {
  message: string;
  type: "network" | "validation" | "server" | "auth" | "unknown";
  code?: string;
}

interface AuthContextType {
  user: User | null;
  token: string | null;
  login: (email: string, password: string) => Promise<void>;
  register: (name: string, email: string, password: string) => Promise<void>;
  logout: () => void;
  isLoading: boolean;
  error: AuthError | null;
  clearError: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);
import { API_BASE_URL, API_ENDPOINTS } from "@/lib/api";

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
};

interface AuthProviderProps {
  children: ReactNode;
}

export const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<AuthError | null>(null);

  useEffect(() => {
    const storedToken = localStorage.getItem("admin_token");
    const storedUser = localStorage.getItem("admin_user");

    if (storedToken && storedUser) {
      try {
        const parsedUser = JSON.parse(storedUser);
        setToken(storedToken);
        setUser(parsedUser);
      } catch (parseError) {
        
        localStorage.removeItem("admin_token");
        localStorage.removeItem("admin_user");
        setError({
          message: "Stored authentication data is invalid. Please login again.",
          type: "auth",
        });
      }
    }
    setIsLoading(false);
  }, []);

  const clearError = () => {
    setError(null);
  };

  const handleApiError = (response: Response, data: any): AuthError => {
    if (response.status === 401) {
      return {
        message: "Invalid credentials. Please check your email and password.",
        type: "auth",
        code: "INVALID_CREDENTIALS",
      };
    }

    if (response.status === 403) {
      return {
        message:
          "Access denied. You don't have permission to access this resource.",
        type: "auth",
        code: "ACCESS_DENIED",
      };
    }

    if (response.status === 422) {
      return {
        message:
          data.errors?.[0]?.msg || "Validation error. Please check your input.",
        type: "validation",
        code: "VALIDATION_ERROR",
      };
    }

    if (response.status >= 500) {
      return {
        message: "Server error. Please try again later.",
        type: "server",
        code: "SERVER_ERROR",
      };
    }

    return {
      message: data.message || "An unexpected error occurred.",
      type: "unknown",
      code: "UNKNOWN_ERROR",
    };
  };

  const login = async (email: string, password: string) => {
    setIsLoading(true);
    clearError();
    console.log("login", email, password)
    try {
      // Validate input
      if (!email || !password) {
        throw {
          message: "Email and password are required.",
          type: "validation" as const,
          code: "MISSING_FIELDS",
        };
      }

      if (!email.includes("@")) {
        throw {
          message: "Please enter a valid email address.",
          type: "validation" as const,
          code: "INVALID_EMAIL",
        };
      }

      const res = await fetch(`${API_BASE_URL}${API_ENDPOINTS.ADMIN_LOGIN}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      });

      const data = await res.json();
      console.log(data)
      if (!res.ok) {
        const error = handleApiError(res, data);
        setError(error);
        throw error;
      }

      const token = data.token;
      if (!token) {
        const error = {
          message: "No authentication token received from server.",
          type: "auth" as const,
          code: "NO_TOKEN",
        };
        setError(error);
        throw error;
      }

    
      const user = {
        id: data.user?.id || "",
        email,
        name: data.user?.name || "",
        role: "admin",
        newrole :data.admin.role || ""
      };
      setUser(user);
      setToken(token);
      localStorage.setItem("admin_token", token);
      localStorage.setItem("admin_user", JSON.stringify(user));
      localStorage.setItem("newrole",user.newrole)
    } catch (error) {
      if (error instanceof TypeError && error.message.includes("fetch")) {
        const networkError = {
          message:
            "Network error. Please check your internet connection and try again.",
          type: "network" as const,
          code: "NETWORK_ERROR",
        };
        setError(networkError);
        throw networkError;
      }

      if (typeof error === "object" && error !== null && "message" in error) {
        // This is our custom error object
        throw error;
      }

      const unknownError = {
        message: "An unexpected error occurred. Please try again.",
        type: "unknown" as const,
        code: "UNKNOWN_ERROR",
      };
      setError(unknownError);
      throw unknownError;
    } finally {
      setIsLoading(false);
    }
  };

  const register = async (name: string, email: string, password: string) => {
    setIsLoading(true);
    clearError();

    try {
      // Validate input
      if (!name || !email || !password) {
        throw {
          message: "Name, email, and password are required.",
          type: "validation" as const,
          code: "MISSING_FIELDS",
        };
      }

      if (!email.includes("@")) {
        throw {
          message: "Please enter a valid email address.",
          type: "validation" as const,
          code: "INVALID_EMAIL",
        };
      }

      if (password.length < 6) {
        throw {
          message: "Password must be at least 6 characters long.",
          type: "validation" as const,
          code: "WEAK_PASSWORD",
        };
      }

      const res = await fetch(
        `${API_BASE_URL}${API_ENDPOINTS.ADMIN_REGISTER}`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ name, email, password }),
        }
      );

      const data = await res.json();

      if (!res.ok) {
        const error = handleApiError(res, data);
        setError(error);
        throw error;
      }

      const token = data.token;
      if (!token) {
        const error = {
          message: "No authentication token received from server.",
          type: "auth" as const,
          code: "NO_TOKEN",
        };
        setError(error);
        throw error;
      }

      const user = { id: data.user?.id || "", email, name, role: "admin" };
      setUser(user);
      setToken(token);
      localStorage.setItem("admin_token", token);
      localStorage.setItem("admin_user", JSON.stringify(user));
    } catch (error) {
      if (error instanceof TypeError && error.message.includes("fetch")) {
        const networkError = {
          message:
            "Network error. Please check your internet connection and try again.",
          type: "network" as const,
          code: "NETWORK_ERROR",
        };
        setError(networkError);
        throw networkError;
      }

      if (typeof error === "object" && error !== null && "message" in error) {
        // This is our custom error object
        throw error;
      }

      const unknownError = {
        message: "An unexpected error occurred. Please try again.",
        type: "unknown" as const,
        code: "UNKNOWN_ERROR",
      };
      setError(unknownError);
      throw unknownError;
    } finally {
      setIsLoading(false);
    }
  };

  const logout = () => {
  setUser(null);
  setToken(null);
  clearError();
  localStorage.removeItem("admin_token");
  localStorage.removeItem("admin_user");

  // Redirect to home page
  window.location.href = "/login";
};


  const value = {
    user,
    token,
    login,
    register,
    logout,
    isLoading,
    error,
    clearError,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};
