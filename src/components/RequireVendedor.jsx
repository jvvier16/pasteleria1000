import React from "react";
import { Navigate, useLocation } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

export default function RequireVendedor({ children }) {
  const location = useLocation();
  const { user } = useAuth();

  if (!user) return <Navigate to="/login" state={{ from: location }} replace />;

  const userRole = (user.role || user.rol || user.roleName || "").toString().toLowerCase();
  if (userRole === "vendedor" || userRole === "tester") return children;

  return <Navigate to="/login" state={{ from: location }} replace />;
}
