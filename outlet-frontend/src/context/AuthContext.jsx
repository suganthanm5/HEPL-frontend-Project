/* ══════════════════════════════════════════
   Auth Context — provides role-aware user state
   across the entire app using secure cookies.
   ══════════════════════════════════════════ */

import { createContext, useContext, useState, useCallback, useEffect } from "react";
import { setCookie, getCookie, deleteCookie } from "../utils/cookieUtils";

const AuthContext = createContext(null);

/** Parse the stored user from cookies with defensive checks */
const loadUser = () => {
  try {
    const raw = getCookie("user");
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
      const fallbackUsername = getCookie("username");
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
  const [user, setUser] = useState(() => loadUser());
  const [isLoading, setIsLoading] = useState(() => {
    const token = getCookie('token');
    const userData = loadUser();
    return !(userData && token);
  });

  // Load user data on mount
  useEffect(() => {
    const userData = loadUser();
    const token = getCookie('token');

    if (userData && token) {
      setUser(userData);
      setCookie("username", userData.username || userData.name || "");
      setCookie("role", userData.role || "USER");
      setCookie("email", userData.email || "");
      if (userData.outletId) {
        setCookie("outletId", userData.outletId);
      }
    } else if (!userData && token) {
      deleteCookie('token');
    }
    setIsLoading(false);
  }, []);

  /** Call this after a successful login response */
  const login = useCallback((userData, token) => {
    const normalizedRole = (userData.role || "USER").toString().toUpperCase().replace('ROLE_', '').trim();
    const normalizedUserData = { ...userData, role: normalizedRole };
    setCookie("token", token);
    setCookie("user", JSON.stringify(normalizedUserData));
    setCookie("username", normalizedUserData.username || normalizedUserData.name || "");
    setCookie("email", normalizedUserData.email || "");
    setCookie("role", normalizedUserData.role);
    if (normalizedUserData.outletId) {
      setCookie("outletId", normalizedUserData.outletId);
    }
    setUser(normalizedUserData);
    window.dispatchEvent(new Event('storage'));
  }, []);

  /** Call this on logout */
  const logout = useCallback(() => {
    deleteCookie("token");
    deleteCookie("user");
    deleteCookie("username");
    deleteCookie("email");
    deleteCookie("role");
    deleteCookie("outletId");
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
