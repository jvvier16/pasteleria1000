/**
 * RequireAuth: wrapper para rutas protegidas por sesión.
 * - Verifica existencia del JWT en localStorage
 * - Decodifica JWT para verificar que no esté expirado
 * - Opcional: valida token con el backend (GET /api/v2/auth/verificar)
 * - Si no hay sesión válida, redirige a /login preservando la ubicación deseada.
 */
import React, { useEffect, useState } from "react";
import { Navigate, useLocation } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { verificarToken } from "../utils/apiHelper";

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
  
  // Dar 60 segundos de margen para evitar problemas de sincronización
  return now >= expirationTime - 60000;
}

export default function RequireAuth({ children, validateWithBackend = false }) {
  const location = useLocation();
  const { user, logout } = useAuth();
  const [isValidating, setIsValidating] = useState(validateWithBackend);
  const [isValid, setIsValid] = useState(null);

  // Verificar token al montar (si validateWithBackend está activo)
  useEffect(() => {
    if (!validateWithBackend) return;

    const validate = async () => {
      try {
        const token = localStorage.getItem("token");
        if (!token) {
          setIsValid(false);
          return;
        }

        // Primero verificar localmente si está expirado
        if (isTokenExpired(token)) {
          console.warn("Token expirado localmente");
          logout();
          setIsValid(false);
          return;
        }

        // Validar con el backend
        const response = await verificarToken();
        if (response.status === 200 && response.data?.valid) {
          setIsValid(true);
        } else {
          console.warn("Token inválido según el backend");
          logout();
          setIsValid(false);
        }
      } catch (err) {
        console.error("Error validando token:", err);
        // Si hay error de red, permitir acceso si el token existe y no está expirado
        const token = localStorage.getItem("token");
        if (token && !isTokenExpired(token)) {
          setIsValid(true);
        } else {
          logout();
          setIsValid(false);
        }
      } finally {
        setIsValidating(false);
      }
    };

    validate();
  }, [validateWithBackend, logout]);

  // 1. Verificar existencia del JWT en localStorage
  const token = localStorage.getItem("token");
  
  if (!token) {
    // No hay token, redirigir a login
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  // 2. Decodificar JWT para verificar que no esté expirado
  if (isTokenExpired(token)) {
    // Token expirado, limpiar sesión y redirigir
    logout();
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  // 3. Verificar que haya datos de usuario en el contexto
  if (!user || !(user.id || user.correo || user.email || user.nombre || user.name)) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  // 4. Si se requiere validación con backend, mostrar loading mientras valida
  if (validateWithBackend) {
    if (isValidating) {
      return (
        <div className="d-flex justify-content-center align-items-center" style={{ minHeight: "50vh" }}>
          <div className="text-center">
            <div className="spinner-border text-primary mb-2" role="status">
              <span className="visually-hidden">Verificando sesión...</span>
            </div>
            <p className="text-muted small">Verificando sesión...</p>
          </div>
        </div>
      );
    }

    if (isValid === false) {
      return <Navigate to="/login" state={{ from: location }} replace />;
    }
  }

  // Token válido y usuario autenticado, permitir acceso
  return children;
}

/**
 * Hook para verificar estado del token
 * Útil para componentes que necesitan verificar manualmente
 */
export function useTokenStatus() {
  const token = localStorage.getItem("token");
  
  return {
    hasToken: !!token,
    isExpired: token ? isTokenExpired(token) : true,
    payload: token ? decodeJwtPayload(token) : null,
    expiresAt: (() => {
      const payload = decodeJwtPayload(token);
      return payload?.exp ? new Date(payload.exp * 1000) : null;
    })(),
  };
}
