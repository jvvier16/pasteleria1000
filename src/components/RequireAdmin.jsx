/**
 * RequireAdmin: protege rutas de administración verificando el rol desde el JWT.
 * - Decodifica el JWT para extraer el rol (más seguro que session_user)
 * - Verifica que el rol sea admin, tester o vendedor
 * - Redirige a /login si no está autenticado
 * - Redirige a / (o página 403) si no tiene permisos
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
    
    // Decodificar la parte del payload (índice 1)
    const payload = parts[1];
    // Reemplazar caracteres URL-safe por estándar base64
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
  
  // exp está en segundos, Date.now() en milisegundos
  const expirationTime = payload.exp * 1000;
  const now = Date.now();
  
  // Dar 60 segundos de margen
  return now >= expirationTime - 60000;
}

/**
 * Extrae el rol del usuario desde el JWT
 * El backend puede guardar el rol en diferentes campos según la implementación
 * @param {object} payload - Payload del JWT decodificado
 * @returns {string} - Rol del usuario en minúsculas
 */
function extractRoleFromJwt(payload) {
  if (!payload) return "";
  
  // El rol puede estar en diferentes campos según la implementación del backend
  // Orden de prioridad: role, rol, authorities, roles
  
  // Campo directo 'role' o 'rol'
  if (payload.role) return payload.role.toString().toLowerCase();
  if (payload.rol) return payload.rol.toString().toLowerCase();
  
  // Spring Security usa 'authorities' como array de objetos { authority: "ROLE_ADMIN" }
  if (Array.isArray(payload.authorities) && payload.authorities.length > 0) {
    const firstAuthority = payload.authorities[0];
    if (typeof firstAuthority === "string") {
      return firstAuthority.replace("ROLE_", "").toLowerCase();
    }
    if (firstAuthority?.authority) {
      return firstAuthority.authority.replace("ROLE_", "").toLowerCase();
    }
  }
  
  // Algunos backends usan 'roles' como array de strings
  if (Array.isArray(payload.roles) && payload.roles.length > 0) {
    return payload.roles[0].toString().replace("ROLE_", "").toLowerCase();
  }
  
  // Campo 'scope' o 'scp' (OAuth2)
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

// Roles permitidos para acceso admin
const ADMIN_ROLES = ["admin", "tester", "vendedor"];

export default function RequireAdmin({ children, allowedRoles = ADMIN_ROLES }) {
  const location = useLocation();
  const { user, logout } = useAuth();

  // 1. Verificar existencia del token
  const token = localStorage.getItem("token");
  
  if (!token) {
    // No hay token, redirigir a login
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
    // Token inválido
    logout();
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  // 4. Verificar rol desde el JWT (más seguro que session_user)
  const jwtRole = extractRoleFromJwt(payload);
  
  // También verificar el rol del contexto como fallback
  const contextRole = user 
    ? (user.role || user.rol || user.roleName || "").toString().toLowerCase() 
    : "";

  // Usar el rol del JWT primero, luego el del contexto
  const effectiveRole = jwtRole || contextRole;

  // 5. Verificar si el rol está en los permitidos
  if (allowedRoles.some(role => role.toLowerCase() === effectiveRole)) {
    return children;
  }

  // 6. No autorizado - redirigir a página principal (o podría ser una página 403)
  console.warn(`Acceso denegado. Rol '${effectiveRole}' no está en roles permitidos:`, allowedRoles);
  return <Navigate to="/" state={{ from: location, unauthorized: true }} replace />;
}

/**
 * Hook para obtener información del rol desde el JWT
 * Útil para componentes que necesitan verificar permisos manualmente
 */
export function useJwtRole() {
  const token = localStorage.getItem("token");
  const payload = decodeJwtPayload(token);
  const role = extractRoleFromJwt(payload);
  
  return {
    role,
    isAdmin: role === "admin",
    isTester: role === "tester",
    isVendedor: role === "vendedor",
    hasAdminAccess: ADMIN_ROLES.includes(role),
    payload,
  };
}
