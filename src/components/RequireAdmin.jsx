// RequireAdmin: protege rutas de administración verificando correo del usuario
// guardado en `session_user`. Redirige a /login si no es admin.
import React from "react";
import { Navigate } from "react-router-dom";

export default function RequireAdmin({ children }) {
  let user = null;
  try {
    const raw = localStorage.getItem("session_user");
    user = raw ? JSON.parse(raw) : null;
  } catch (err) {
    user = null;
  }

  const email = (user && (user.correo || user.email || "")).toLowerCase();

  if (email === "admin@gmail.com") return children;

  return <Navigate to="/login" replace />;
}
