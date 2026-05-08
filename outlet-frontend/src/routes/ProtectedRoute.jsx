/* ══════════════════════════════════════════
   ProtectedRoute — checks auth + optional role
══════════════════════════════════════════ */

import { Navigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

/**
 * Props:
 *   children  — the page to render
 *   roles     — optional array of allowed roles e.g. ["ADMIN"]
 *               if omitted, any authenticated user passes
 */
const ProtectedRoute = ({ children, roles }) => {
  const { user, role } = useAuth();
  const token = localStorage.getItem("token") ||
    document.cookie.match(/(?:^|; )token=([^;]*)/)?.[1];

  // Not authenticated → back to login
  if (!token && !user) return <Navigate to="/" replace />;

  // Role check
  if (roles && roles.length > 0 && !roles.includes(role)) {
    return <Navigate to="/unauthorized" replace />;
  }

  return children;
};

export default ProtectedRoute;
