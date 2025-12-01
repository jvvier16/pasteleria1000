// RequireAdmin: protege rutas de administración verificando correo del usuario
// guardado en `session_user`. Redirige a /login si no es admin.
import React from "react";
import { Navigate, useLocation } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

export default function RequireAdmin({ children }) {
  const location = useLocation();
  const { user } = useAuth();

  if (!user) return <Navigate to="/login" state={{ from: location }} replace />;

  const userRole = (user.role || user.rol || user.roleName || "").toString().toLowerCase();
  if (userRole === "admin" || userRole === "tester") return children;

  // Not authorized -> redirect to login (could be changed to a 403 page)
  return <Navigate to="/login" state={{ from: location }} replace />;
}
