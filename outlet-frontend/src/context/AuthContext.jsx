/* ══════════════════════════════════════════
   Auth Context — provides role-aware user state
   across the entire app
══════════════════════════════════════════ */

import { createContext, useContext, useState, useCallback } from "react";

const AuthContext = createContext(null);

/** Parse the stored user from localStorage */
const loadUser = () => {
  try {
    const raw = localStorage.getItem("user");
    if (raw) return JSON.parse(raw);
  } catch {}
  // Fallback: build from individual keys
  const role = localStorage.getItem("role") || "USER";
  const username = localStorage.getItem("username");
  if (username) return { username, role };
  return null;
};

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(loadUser);

  /** Call this after a successful login response */
  const login = useCallback((userData, token) => {
    localStorage.setItem("token", token);
    localStorage.setItem("user", JSON.stringify(userData));
    localStorage.setItem("username", userData.username || userData.name || "");
    localStorage.setItem("role", userData.role || "USER");
    document.cookie = `token=${token}; path=/; SameSite=Strict`;
    setUser(userData);
  }, []);

  /** Call this on logout */
  const logout = useCallback(() => {
    localStorage.removeItem("token");
    localStorage.removeItem("user");
    localStorage.removeItem("username");
    localStorage.removeItem("role");
    document.cookie = "token=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT";
    setUser(null);
  }, []);

  const role = user?.role || null;

  return (
    <AuthContext.Provider value={{ user, role, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);
