/* ══════════════════════════════════════════
   Auth Context — provides role-aware user state
   across the entire app
══════════════════════════════════════════ */

import { createContext, useContext, useState, useCallback, useEffect } from "react";

const AuthContext = createContext(null);

/** Parse the stored user from localStorage with defensive checks */
const loadUser = () => {
  try {
    const raw = localStorage.getItem("user");
    // Handle null, undefined, or empty strings
    if (!raw || raw === "null" || raw === "undefined") return null;

    const user = JSON.parse(raw);
    if (!user || typeof user !== 'object') return null;

    // Normalize role
    if (user.role) {
      user.role = user.role.toString().toUpperCase().replace('ROLE_', '').trim();
    } else {
      // Fallback if role is missing but user exists
      user.role = "USER";
    }
    
    // Ensure we have a username or name
    if (!user.username && !user.name) {
      const fallbackUsername = localStorage.getItem("username");
      if (fallbackUsername && fallbackUsername !== "undefined") {
        user.username = fallbackUsername;
      }
    }

    return user;
  } catch (err) {
    console.error("AuthContext: Failed to load user", err);
    return null;
  }
};

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [isLoading, setIsLoading] = useState(true);

  // Load user data on mount
  useEffect(() => {
    const userData = loadUser();
    const token = localStorage.getItem('token');
    
    if (userData && token) {
      setUser(userData);
      localStorage.setItem("username", userData.username || userData.name || "");
      localStorage.setItem("role", userData.role || "USER");
      localStorage.setItem("email", userData.email || "");
      if (userData.outletId) {
        localStorage.setItem("outletId", userData.outletId);
      }
    } else if (!userData && token) {
      localStorage.removeItem('token');
    }
    setIsLoading(false);
  }, []);

  /** Call this after a successful login response */
  const login = useCallback((userData, token) => {
    const normalizedRole = (userData.role || "USER").toString().toUpperCase().replace('ROLE_', '').trim();
    const normalizedUserData = { ...userData, role: normalizedRole };
    localStorage.setItem("token", token);
    localStorage.setItem("user", JSON.stringify(normalizedUserData));
    localStorage.setItem("username", normalizedUserData.username || normalizedUserData.name || "");
    localStorage.setItem("email", normalizedUserData.email || "");
    localStorage.setItem("role", normalizedUserData.role);
    if (normalizedUserData.outletId) {
      localStorage.setItem("outletId", normalizedUserData.outletId);
    }
    setUser(normalizedUserData);
    window.dispatchEvent(new Event('storage'));
  }, []);

  /** Call this on logout */
  const logout = useCallback(() => {
    localStorage.removeItem("token");
    localStorage.removeItem("user");
    localStorage.removeItem("username");
    localStorage.removeItem("email");
    localStorage.removeItem("role");
    localStorage.removeItem("outletId");
    setUser(null);
    window.dispatchEvent(new Event('storage'));
  }, []);

  // Listen for storage changes from other tabs/windows
  useEffect(() => {
    const handleStorageChange = () => {
      const userData = loadUser();
      setUser(userData);
    };
    
    window.addEventListener('storage', handleStorageChange);
    return () => window.removeEventListener('storage', handleStorageChange);
  }, []);

  const role = user?.role || null;

  return (
    <AuthContext.Provider value={{ user, role, login, logout, isLoading }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);
