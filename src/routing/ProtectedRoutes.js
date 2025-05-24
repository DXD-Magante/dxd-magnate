// components/routing/ProtectedRoute.js
import { Navigate, useLocation } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import LoadingSpinner from "../assets/LoadingSpinner";

export function ProtectedRoute({ children }) {
  const { user, loading } = useAuth();
  const location = useLocation();

  if (loading) {
    return <LoadingSpinner text="Verifying authentication..." />;
  }

  if (!user) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  return children;
}

// components/routing/RoleRoute.js

export function RoleRoute({ children, allowedRoles }) {
  const { user, loading } = useAuth();
  const location = useLocation();

  if (loading) {
    return <LoadingSpinner text="Verifying permissions..." />;
  }

  if (!user) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  if (!allowedRoles.includes(user.role)) {
    return <Navigate to="/not-authorized" replace />;
  }

  return children;
}

// components/routing/GuestRoute.js

export function GuestRoute({ children }) {
  const { user, loading } = useAuth();
  const location = useLocation();

  if (loading) {
    return <LoadingSpinner text="Checking session..." />;
  }

  if (user) {
    // Redirect to appropriate dashboard based on role
    let redirectPath = "/home";
    switch(user.role) {
      case 'Admin': redirectPath = "/admin-dashboard"; break;
      case 'sales': redirectPath = "/sales-dashboard"; break;
      case 'Project Manager': redirectPath = "/project-manager-dashboard"; break;
      case 'marketing': redirectPath = "/marketing-team-dashboard"; break;
      case 'collaborator':
      case 'intern': redirectPath = "/colaborator-dashboard"; break;
      case 'client': redirectPath = "/client-dashboard"; break;
      default: redirectPath = "/home";
    }
    return <Navigate to={redirectPath} state={{ from: location }} replace />;
  }

  return children;
}