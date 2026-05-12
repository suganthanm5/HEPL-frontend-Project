
import { Navigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { CircularProgress, Box } from "@mui/material";

const ProtectedRoute = ({ children, roles }) => {
  const { user, role, isLoading } = useAuth();
  const token = localStorage.getItem("token");
  const currentRole = role || localStorage.getItem("role");

  console.log('ProtectedRoute Debug:', {
    user,
    role,
    currentRole,
    isLoading,
    hasToken: !!token,
    requiredRoles: roles,
    localStorage: {
      user: localStorage.getItem('user'),
      role: localStorage.getItem('role'),
      token: !!localStorage.getItem('token')
    }
  });

  // Show loading spinner while auth is initializing
  if (isLoading) {
    console.log('ProtectedRoute: Still loading auth state');
    return (
      <Box sx={{ 
        display: 'flex', 
        justifyContent: 'center', 
        alignItems: 'center', 
        height: '100vh',
        backgroundColor: '#f8fafc'
      }}>
        <CircularProgress sx={{ color: '#4f46e5' }} />
      </Box>
    );
  }

  // Not authenticated or session incomplete → back to login
  if (!token || !user) {
    console.log('ProtectedRoute: Missing token or user data, redirecting to login');
    return <Navigate to="/" replace />;
  }

  // If no roles specified, any authenticated user can access
  if (!roles || roles.length === 0) {
    console.log('ProtectedRoute: No role restrictions, access granted');
    return children;
  }

  // Role check - use currentRole (context or localStorage)
  const userRole = (currentRole || '').toString().toUpperCase().replace('ROLE_', '').trim();
  const normalizedRoles = roles.map(r => r.toString().toUpperCase().replace('ROLE_', '').trim());
  
  const hasAccess = normalizedRoles.includes(userRole);

  if (!hasAccess) {
    console.log('ProtectedRoute: Access denied. Required:', normalizedRoles, 'User has:', userRole);
    return <Navigate to="/unauthorized" replace />;
  }

  console.log('ProtectedRoute: Access granted. Role:', userRole);
  return children;
};

export default ProtectedRoute;
