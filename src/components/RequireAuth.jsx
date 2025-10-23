import React from "react";
import { Navigate, useLocation } from "react-router-dom";

export default function RequireAuth({ children }) {
  const location = useLocation();
  let user = null;
  try {
    const raw = localStorage.getItem("session_user");
    user = raw ? JSON.parse(raw) : null;
  } catch (err) {
    user = null;
  }

  // If there's a session_user, allow access
  if (user && (user.id || user.correo || user.email)) return children;

  // Otherwise redirect to login preserving the intended location
  return <Navigate to="/login" state={{ from: location }} replace />;
}
