// RequireAdmin: protege rutas de administración verificando correo del usuario
// guardado en `session_user`. Redirige a /login si no es admin.
import React from "react";
import { Navigate } from "react-router-dom";

export default function RequireAdmin({ children }) {
  let user = null;
  try {
    const raw = localStorage.getItem("session_user");
    if (raw) {
      user = JSON.parse(raw);
    }
  } catch (err) {
    console.error("Error parsing session_user:", err);
    return <Navigate to="/login" replace />;
  }

  // Verificar que el usuario existe
  if (!user) {
    return <Navigate to="/login" replace />;
  }

  // Verificar el rol del usuario (soportar 'role' y 'rol' por compatibilidad)
  const userRole = (user.role || user.rol || user.roleName || "").toString().toLowerCase();
  // Permitir también a usuarios con rol 'tester' como administradores de prueba
  if (userRole === "admin" || userRole === "tester") {
    return children;
  }

  return <Navigate to="/login" replace />;
}
