// RequireAuth: wrapper para rutas protegidas por sesión.
// - Lee `session_user` desde localStorage y permite el render si existe.
// - Si no hay sesión redirige a /login preservando la ubicación deseada.
import React from "react";
import { Navigate, useLocation } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

export default function RequireAuth({ children }) {
  const location = useLocation();
  const { user } = useAuth();

  // If there's a session_user, allow access
  if (user && (user.id || user.correo || user.email || user.nombre || user.name)) {
    return children;
  }

  // Otherwise redirect to login preserving the intended location
  return <Navigate to="/login" state={{ from: location }} replace />;
}
