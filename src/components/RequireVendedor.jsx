import React from "react";
import { Navigate } from "react-router-dom";

export default function RequireVendedor({ children }) {
  let user = null;
  try {
    const raw = localStorage.getItem("session_user");
    if (raw) user = JSON.parse(raw);
  } catch (err) {
    console.error("Error parsing session_user:", err);
    return <Navigate to="/login" replace />;
  }

  if (!user) return <Navigate to="/login" replace />;

  const userRole = (user.role || user.rol || user.roleName || "").toString().toLowerCase();
  // Allow testers to access vendor/admin areas for QA
  if (userRole === "vendedor" || userRole === "tester") return children;

  return <Navigate to="/login" replace />;
}
