/**
 * AuthContext - Contexto de autenticación para Pastelería Mil Sabores
 * 
 * Proporciona:
 * - Estado global para usuario y token
 * - Funciones login(), logout(), isAuthenticated()
 * - Verificación automática de expiración del JWT
 * - Sincronización entre pestañas del navegador
 * 
 * @example
 * // En App.jsx
 * import { AuthProvider } from './context/AuthContext';
 * <AuthProvider>
 *   <App />
 * </AuthProvider>
 * 
 * // En componentes
 * import { useAuth } from '../context/AuthContext';
 * const { user, login, logout, isAuthenticated } = useAuth();
 */
import React, { createContext, useContext, useEffect, useState, useCallback, useMemo } from 'react';

const AuthContext = createContext(null);

// ============================================
// UTILIDADES JWT
// ============================================

/**
 * Decodifica el payload de un JWT
 * @param {string} token 
 * @returns {object|null}
 */
function decodeJwtPayload(token) {
  try {
    if (!token || typeof token !== 'string') return null;
    
    const parts = token.split('.');
    if (parts.length !== 3) return null;
    
    const payload = parts[1];
    const base64 = payload.replace(/-/g, '+').replace(/_/g, '/');
    const jsonPayload = decodeURIComponent(
      atob(base64)
        .split('')
        .map((c) => '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2))
        .join('')
    );
    
    return JSON.parse(jsonPayload);
  } catch {
    return null;
  }
}

/**
 * Verifica si un JWT está expirado
 * @param {string} token 
 * @returns {boolean}
 */
function isTokenExpired(token) {
  const payload = decodeJwtPayload(token);
  if (!payload || !payload.exp) return true;
  
  const expirationTime = payload.exp * 1000;
  const now = Date.now();
  
  // 60 segundos de margen
  return now >= expirationTime - 60000;
}

/**
 * Extrae el rol del JWT
 * @param {object} payload 
 * @returns {string}
 */
function extractRoleFromPayload(payload) {
  if (!payload) return '';
  
  if (payload.role) return payload.role.toString().toLowerCase();
  if (payload.rol) return payload.rol.toString().toLowerCase();
  
  if (Array.isArray(payload.authorities) && payload.authorities.length > 0) {
    const auth = payload.authorities[0];
    if (typeof auth === 'string') return auth.replace('ROLE_', '').toLowerCase();
    if (auth?.authority) return auth.authority.replace('ROLE_', '').toLowerCase();
  }
  
  if (Array.isArray(payload.roles) && payload.roles.length > 0) {
    return payload.roles[0].toString().replace('ROLE_', '').toLowerCase();
  }
  
  return '';
}

// ============================================
// AUTH PROVIDER
// ============================================

export function AuthProvider({ children }) {
  // Estado del usuario
  const [user, setUser] = useState(null);
  // Estado de carga inicial
  const [loading, setLoading] = useState(true);
  // Token JWT
  const [token, setTokenState] = useState(null);

  /**
   * Inicialización: cargar sesión desde localStorage
   */
  useEffect(() => {
    const initAuth = () => {
      try {
        const storedToken = localStorage.getItem('token');
        const storedSession = localStorage.getItem('session_user');
        
        // Verificar si hay token y no está expirado
        if (storedToken && !isTokenExpired(storedToken)) {
          setTokenState(storedToken);
          
          // Cargar datos de usuario
          if (storedSession) {
            const sessionData = JSON.parse(storedSession);
            setUser(sessionData);
          } else {
            // Si hay token pero no session_user, extraer datos del JWT
            const payload = decodeJwtPayload(storedToken);
            if (payload) {
              const userData = {
                id: payload.sub || payload.userId,
                correo: payload.email || payload.correo,
                nombre: payload.name || payload.nombre,
                role: extractRoleFromPayload(payload),
                token: storedToken,
              };
              setUser(userData);
              localStorage.setItem('session_user', JSON.stringify(userData));
            }
          }
        } else {
          // Token expirado o no existe, limpiar todo
          localStorage.removeItem('token');
          localStorage.removeItem('session_user');
          setTokenState(null);
          setUser(null);
        }
      } catch (err) {
        console.error('Error inicializando auth:', err);
        setUser(null);
        setTokenState(null);
      } finally {
        setLoading(false);
      }
    };

    initAuth();
  }, []);

  /**
   * Escuchar cambios de storage (otras pestañas)
   */
  useEffect(() => {
    function onStorage(e) {
      if (e.key === 'session_user') {
        try {
          const value = e.newValue ? JSON.parse(e.newValue) : null;
          setUser(value);
        } catch {
          setUser(null);
        }
      }
      if (e.key === 'token') {
        const newToken = e.newValue;
        if (newToken && !isTokenExpired(newToken)) {
          setTokenState(newToken);
        } else {
          setTokenState(null);
          setUser(null);
        }
      }
    }

    function onUserLogin(e) {
      setUser(e.detail ?? null);
    }

    function onUserLogout() {
      setUser(null);
      setTokenState(null);
    }

    window.addEventListener('storage', onStorage);
    window.addEventListener('userLogin', onUserLogin);
    window.addEventListener('userLogout', onUserLogout);

    return () => {
      window.removeEventListener('storage', onStorage);
      window.removeEventListener('userLogin', onUserLogin);
      window.removeEventListener('userLogout', onUserLogout);
    };
  }, []);

  /**
   * Verificar expiración del token periódicamente
   */
  useEffect(() => {
    if (!token) return;

    const checkExpiration = () => {
      if (isTokenExpired(token)) {
        console.warn('Token expirado, cerrando sesión...');
        logout();
      }
    };

    // Verificar cada minuto
    const interval = setInterval(checkExpiration, 60000);
    
    return () => clearInterval(interval);
  }, [token]);

  /**
   * Login: guarda sesión y token
   * @param {object} sessionObj - { id, nombre, correo, role, token }
   * @returns {boolean}
   */
  const login = useCallback((sessionObj) => {
    try {
      if (!sessionObj) return false;

      // Guardar token
      if (sessionObj.token) {
        localStorage.setItem('token', sessionObj.token);
        setTokenState(sessionObj.token);
      }

      // Guardar sesión de usuario
      localStorage.setItem('session_user', JSON.stringify(sessionObj));
      setUser(sessionObj);

      // Disparar eventos para otros componentes
      window.dispatchEvent(new CustomEvent('userLogin', { detail: sessionObj }));
      window.dispatchEvent(new Event('storage'));

      // Sincronizar carrito si hay token (opcional)
      if (sessionObj.token) {
        syncCartFromServer(sessionObj.token);
      }

      return true;
    } catch (err) {
      console.error('Error en login:', err);
      return false;
    }
  }, []);

  /**
   * Logout: limpia sesión y token
   * @returns {boolean}
   */
  const logout = useCallback(() => {
    try {
      localStorage.removeItem('session_user');
      localStorage.removeItem('token');
      setUser(null);
      setTokenState(null);

      window.dispatchEvent(new CustomEvent('userLogout'));
      window.dispatchEvent(new Event('storage'));

      return true;
    } catch (err) {
      console.error('Error en logout:', err);
      return false;
    }
  }, []);

  /**
   * Verifica si el usuario está autenticado
   * @returns {boolean}
   */
  const isAuthenticated = useCallback(() => {
    const currentToken = localStorage.getItem('token');
    return !!currentToken && !isTokenExpired(currentToken) && !!user;
  }, [user]);

  /**
   * Obtiene el rol del usuario actual
   * @returns {string}
   */
  const getRole = useCallback(() => {
    if (user?.role) return user.role.toLowerCase();
    
    const currentToken = localStorage.getItem('token');
    if (currentToken) {
      const payload = decodeJwtPayload(currentToken);
      return extractRoleFromPayload(payload);
    }
    
    return '';
  }, [user]);

  /**
   * Verifica si el usuario tiene un rol específico
   * @param {string|string[]} roles 
   * @returns {boolean}
   */
  const hasRole = useCallback((roles) => {
    const currentRole = getRole();
    if (!currentRole) return false;
    
    const rolesArray = Array.isArray(roles) ? roles : [roles];
    return rolesArray.some(r => r.toLowerCase() === currentRole);
  }, [getRole]);

  /**
   * Verifica si tiene acceso de admin
   * @returns {boolean}
   */
  const isAdmin = useCallback(() => {
    return hasRole(['admin', 'tester']);
  }, [hasRole]);

  /**
   * Verifica si tiene acceso de vendedor
   * @returns {boolean}
   */
  const isVendedor = useCallback(() => {
    return hasRole(['vendedor', 'tester', 'admin']);
  }, [hasRole]);

  /**
   * Actualiza los datos del usuario en el contexto
   * @param {object} updates 
   */
  const updateUser = useCallback((updates) => {
    if (!user) return;
    
    const updatedUser = { ...user, ...updates };
    localStorage.setItem('session_user', JSON.stringify(updatedUser));
    setUser(updatedUser);
  }, [user]);

  /**
   * Obtiene información del token
   * @returns {object}
   */
  const getTokenInfo = useCallback(() => {
    const currentToken = localStorage.getItem('token');
    if (!currentToken) return null;
    
    const payload = decodeJwtPayload(currentToken);
    if (!payload) return null;
    
    return {
      payload,
      isExpired: isTokenExpired(currentToken),
      expiresAt: payload.exp ? new Date(payload.exp * 1000) : null,
      role: extractRoleFromPayload(payload),
    };
  }, []);

  /**
   * Sincroniza carrito desde el servidor (si existe endpoint)
   */
  const syncCartFromServer = async (authToken) => {
    try {
      const API_BASE = import.meta?.env?.VITE_API_BASE_URL || 'http://localhost:8094';
      const response = await fetch(`${API_BASE}/api/cart`, {
        headers: { Authorization: `Bearer ${authToken}` }
      });
      
      if (response.ok) {
        const data = await response.json();
        if (data && Array.isArray(data.items)) {
          localStorage.setItem('pasteleria_cart', JSON.stringify(data.items));
          window.dispatchEvent(new CustomEvent('cartUpdated', { detail: data.items }));
        }
      }
    } catch {
      // Ignorar errores de sincronización de carrito
    }
  };

  // Valor del contexto memoizado
  const value = useMemo(() => ({
    // Estado
    user,
    token,
    loading,
    
    // Funciones principales
    login,
    logout,
    isAuthenticated,
    
    // Funciones de rol
    getRole,
    hasRole,
    isAdmin,
    isVendedor,
    
    // Utilidades
    updateUser,
    getTokenInfo,
  }), [user, token, loading, login, logout, isAuthenticated, getRole, hasRole, isAdmin, isVendedor, updateUser, getTokenInfo]);

  // Mostrar loading mientras se inicializa
  if (loading) {
    return (
      <div className="d-flex justify-content-center align-items-center" style={{ minHeight: '100vh' }}>
        <div className="spinner-border text-primary" role="status">
          <span className="visually-hidden">Cargando...</span>
        </div>
      </div>
    );
  }

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
}

/**
 * Hook para usar el contexto de autenticación
 * @returns {object}
 */
export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) {
    throw new Error('useAuth debe usarse dentro de AuthProvider');
  }
  return ctx;
}

export default AuthContext;
