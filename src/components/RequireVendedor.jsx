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

  if (user.role === "vendedor") return children;

  return <Navigate to="/login" replace />;
}
