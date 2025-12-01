/**
 * RequireVendedor: protege rutas de vendedor verificando el rol desde el JWT.
 * - Decodifica el JWT para extraer el rol (más seguro que session_user)
 * - Verifica que el rol sea vendedor o tester
 * - Redirige a /login si no está autenticado
 * - Redirige a / si no tiene permisos
 */
import React from "react";
import { Navigate, useLocation } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

/**
 * Decodifica el payload de un JWT sin verificar la firma
 * @param {string} token - JWT token
 * @returns {object|null} - Payload decodificado o null si inválido
 */
function decodeJwtPayload(token) {
  try {
    if (!token || typeof token !== "string") return null;
    
    const parts = token.split(".");
    if (parts.length !== 3) return null;
    
    const payload = parts[1];
    const base64 = payload.replace(/-/g, "+").replace(/_/g, "/");
    const jsonPayload = decodeURIComponent(
      atob(base64)
        .split("")
        .map((c) => "%" + ("00" + c.charCodeAt(0).toString(16)).slice(-2))
        .join("")
    );
    
    return JSON.parse(jsonPayload);
  } catch {
    return null;
  }
}

/**
 * Verifica si un JWT está expirado
 * @param {string} token - JWT token
 * @returns {boolean} - true si está expirado o inválido
 */
function isTokenExpired(token) {
  const payload = decodeJwtPayload(token);
  if (!payload || !payload.exp) return true;
  
  const expirationTime = payload.exp * 1000;
  const now = Date.now();
  
  return now >= expirationTime - 60000;
}

/**
 * Extrae el rol del usuario desde el JWT
 * @param {object} payload - Payload del JWT decodificado
 * @returns {string} - Rol del usuario en minúsculas
 */
function extractRoleFromJwt(payload) {
  if (!payload) return "";
  
  if (payload.role) return payload.role.toString().toLowerCase();
  if (payload.rol) return payload.rol.toString().toLowerCase();
  
  if (Array.isArray(payload.authorities) && payload.authorities.length > 0) {
    const firstAuthority = payload.authorities[0];
    if (typeof firstAuthority === "string") {
      return firstAuthority.replace("ROLE_", "").toLowerCase();
    }
    if (firstAuthority?.authority) {
      return firstAuthority.authority.replace("ROLE_", "").toLowerCase();
    }
  }
  
  if (Array.isArray(payload.roles) && payload.roles.length > 0) {
    return payload.roles[0].toString().replace("ROLE_", "").toLowerCase();
  }
  
  if (payload.scope) {
    const scopes = payload.scope.split(" ");
    for (const scope of scopes) {
      if (["admin", "tester", "vendedor"].includes(scope.toLowerCase())) {
        return scope.toLowerCase();
      }
    }
  }
  
  return "";
}

// Roles permitidos para acceso vendedor
const VENDEDOR_ROLES = ["vendedor", "tester", "admin"];

export default function RequireVendedor({ children, allowedRoles = VENDEDOR_ROLES }) {
  const location = useLocation();
  const { user, logout } = useAuth();

  // 1. Verificar existencia del token
  const token = localStorage.getItem("token");
  
  if (!token) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  // 2. Verificar que el token no esté expirado
  if (isTokenExpired(token)) {
    logout();
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  // 3. Decodificar el JWT y extraer el rol
  const payload = decodeJwtPayload(token);
  
  if (!payload) {
    logout();
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  // 4. Verificar rol desde el JWT (más seguro que session_user)
  const jwtRole = extractRoleFromJwt(payload);
  
  const contextRole = user 
    ? (user.role || user.rol || user.roleName || "").toString().toLowerCase() 
    : "";

  const effectiveRole = jwtRole || contextRole;

  // 5. Verificar si el rol está en los permitidos
  if (allowedRoles.some(role => role.toLowerCase() === effectiveRole)) {
    return children;
  }

  // 6. No autorizado
  console.warn(`Acceso denegado a vendedor. Rol '${effectiveRole}' no permitido.`);
  return <Navigate to="/" state={{ from: location, unauthorized: true }} replace />;
}
