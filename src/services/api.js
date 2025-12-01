/**
 * API Service - Pastelería Mil Sabores
 * 
 * Servicio centralizado para todas las llamadas al backend.
 * Re-exporta y organiza las funciones de apiHelper.js
 * 
 * @example
 * import api from '../services/api';
 * 
 * // Autenticación
 * const response = await api.auth.login(email, password);
 * 
 * // Productos
 * const productos = await api.productos.obtenerTodos();
 * 
 * // Pedidos
 * const pedido = await api.pedidos.crear(data);
 */

// ============================================
// CONFIGURACIÓN
// ============================================

export const API_BASE_URL = import.meta.env.VITE_API_BASE_URL 
  ? `${import.meta.env.VITE_API_BASE_URL}/api`
  : 'http://localhost:8094/api';

/**
 * Obtiene el token JWT del localStorage
 * @returns {string|null}
 */
export const getToken = () => localStorage.getItem('token');

/**
 * Guarda el token JWT en localStorage
 * @param {string} token 
 */
export const setToken = (token) => localStorage.setItem('token', token);

/**
 * Elimina el token JWT del localStorage
 */
export const removeToken = () => localStorage.removeItem('token');

/**
 * Verifica si el usuario está autenticado
 * @returns {boolean}
 */
export const isAuthenticated = () => !!getToken();

// ============================================
// HEADERS
// ============================================

/**
 * Headers comunes para peticiones JSON
 */
export const jsonHeaders = () => ({
  'Content-Type': 'application/json',
});

/**
 * Headers con autenticación JWT
 */
export const authHeaders = () => ({
  'Content-Type': 'application/json',
  'Authorization': `Bearer ${getToken()}`,
});

/**
 * Headers para multipart/form-data (sin Content-Type, el browser lo agrega)
 */
export const formDataHeaders = () => ({
  'Authorization': `Bearer ${getToken()}`,
});

// ============================================
// UTILIDADES
// ============================================

/**
 * Maneja la respuesta de fetch y parsea JSON
 * @param {Response} response 
 * @returns {Promise<object>}
 */
export const handleResponse = async (response) => {
  const data = await response.json();
  if (!response.ok) {
    const error = new Error(data.message || 'Error en la petición');
    error.status = response.status;
    error.data = data;
    throw error;
  }
  return data;
};

/**
 * Realiza una petición fetch con configuración estándar
 * @param {string} endpoint - Endpoint relativo (ej: '/v2/productos')
 * @param {object} options - Opciones de fetch
 * @returns {Promise<object>}
 */
export const fetchApi = async (endpoint, options = {}) => {
  const url = `${API_BASE_URL}${endpoint}`;
  const config = {
    ...options,
    headers: options.headers || (options.requiresAuth !== false ? authHeaders() : jsonHeaders()),
  };
  
  const response = await fetch(url, config);
  return handleResponse(response);
};

/**
 * Convierte el carrito del frontend al formato del backend
 * @param {Array} carrito - Array de productos del carrito
 * @param {Object} datosCliente - Datos adicionales del cliente
 * @returns {Object}
 */
export const convertirCarritoParaBackend = (carrito, datosCliente = {}) => {
  return {
    items: carrito.map(item => ({
      productoId: item.id || item.productoId,
      cantidad: item.cantidad || 1
    })),
    ...datosCliente
  };
};

// ============================================
// SERVICIOS ORGANIZADOS
// ============================================

/**
 * Servicio de Autenticación
 */
export const auth = {
  /**
   * Login de usuario
   * @param {string} correo 
   * @param {string} contrasena 
   */
  login: async (correo, contrasena) => {
    const response = await fetch(`${API_BASE_URL}/v2/auth/login`, {
      method: 'POST',
      headers: jsonHeaders(),
      body: JSON.stringify({ correo, contrasena }),
    });
    return handleResponse(response);
  },

  /**
   * Registro de usuario
   * @param {object} userData - { nombre, apellido, correo, contrasena, fechaNacimiento, direccion }
   */
  registro: async (userData) => {
    const response = await fetch(`${API_BASE_URL}/v2/auth/registro`, {
      method: 'POST',
      headers: jsonHeaders(),
      body: JSON.stringify(userData),
    });
    return handleResponse(response);
  },

  /**
   * Verificar token JWT
   */
  verificarToken: async () => {
    const response = await fetch(`${API_BASE_URL}/v2/auth/verificar`, {
      method: 'GET',
      headers: authHeaders(),
    });
    return handleResponse(response);
  },

  /**
   * Logout
   */
  logout: async () => {
    const response = await fetch(`${API_BASE_URL}/v2/auth/logout`, {
      method: 'POST',
      headers: authHeaders(),
    });
    return handleResponse(response);
  },
};

/**
 * Servicio de Productos (público)
 */
export const productos = {
  /**
   * Obtener todos los productos
   */
  obtenerTodos: async () => {
    const response = await fetch(`${API_BASE_URL}/v2/productos`, {
      method: 'GET',
      headers: jsonHeaders(),
    });
    return handleResponse(response);
  },

  /**
   * Obtener producto por ID
   * @param {number} id 
   */
  obtenerPorId: async (id) => {
    const response = await fetch(`${API_BASE_URL}/v2/productos/${id}`, {
      method: 'GET',
      headers: jsonHeaders(),
    });
    return handleResponse(response);
  },

  /**
   * Buscar productos por texto
   * @param {string} query 
   */
  buscar: async (query) => {
    const response = await fetch(`${API_BASE_URL}/v2/productos/buscar?q=${encodeURIComponent(query)}`, {
      method: 'GET',
      headers: jsonHeaders(),
    });
    return handleResponse(response);
  },

  /**
   * Obtener productos por categoría
   * @param {number} categoriaId 
   */
  obtenerPorCategoria: async (categoriaId) => {
    const response = await fetch(`${API_BASE_URL}/v2/productos/categoria/${categoriaId}`, {
      method: 'GET',
      headers: jsonHeaders(),
    });
    return handleResponse(response);
  },

  /**
   * Crear producto (admin)
   * @param {object} producto 
   */
  crear: async (producto) => {
    const response = await fetch(`${API_BASE_URL}/v2/productos`, {
      method: 'POST',
      headers: authHeaders(),
      body: JSON.stringify(producto),
    });
    return handleResponse(response);
  },

  /**
   * Actualizar producto (admin)
   * @param {number} id 
   * @param {object} producto 
   */
  actualizar: async (id, producto) => {
    const response = await fetch(`${API_BASE_URL}/v2/productos/${id}`, {
      method: 'PUT',
      headers: authHeaders(),
      body: JSON.stringify(producto),
    });
    return handleResponse(response);
  },

  /**
   * Eliminar producto (admin)
   * @param {number} id 
   */
  eliminar: async (id) => {
    const response = await fetch(`${API_BASE_URL}/v2/productos/${id}`, {
      method: 'DELETE',
      headers: authHeaders(),
    });
    return handleResponse(response);
  },
};

/**
 * Servicio de Categorías (público)
 */
export const categorias = {
  /**
   * Obtener todas las categorías
   */
  obtenerTodas: async () => {
    const response = await fetch(`${API_BASE_URL}/v2/categorias`, {
      method: 'GET',
      headers: jsonHeaders(),
    });
    return handleResponse(response);
  },

  /**
   * Obtener categoría por ID
   * @param {number} id 
   */
  obtenerPorId: async (id) => {
    const response = await fetch(`${API_BASE_URL}/v2/categorias/${id}`, {
      method: 'GET',
      headers: jsonHeaders(),
    });
    return handleResponse(response);
  },

  /**
   * Crear categoría (admin)
   * @param {object} categoria - { nombre, descripcion? }
   */
  crear: async (categoria) => {
    const response = await fetch(`${API_BASE_URL}/v1/categorias`, {
      method: 'POST',
      headers: authHeaders(),
      body: JSON.stringify(categoria),
    });
    return handleResponse(response);
  },

  /**
   * Actualizar categoría (admin)
   * @param {object} categoria - { categoriaId, nombre, descripcion? }
   */
  actualizar: async (categoria) => {
    const response = await fetch(`${API_BASE_URL}/v1/categorias`, {
      method: 'PUT',
      headers: authHeaders(),
      body: JSON.stringify(categoria),
    });
    return handleResponse(response);
  },

  /**
   * Eliminar categoría (admin)
   * @param {number} id 
   */
  eliminar: async (id) => {
    const response = await fetch(`${API_BASE_URL}/v1/categorias/${id}`, {
      method: 'DELETE',
      headers: authHeaders(),
    });
    return handleResponse(response);
  },
};

/**
 * Servicio de Pedidos/Boletas (usuario)
 */
export const pedidos = {
  /**
   * Obtener mis pedidos
   */
  obtenerMisPedidos: async () => {
    const response = await fetch(`${API_BASE_URL}/v2/boletas/mis-pedidos`, {
      method: 'GET',
      headers: authHeaders(),
    });
    return handleResponse(response);
  },

  /**
   * Obtener pedido por ID
   * @param {number} id 
   */
  obtenerPorId: async (id) => {
    const response = await fetch(`${API_BASE_URL}/v2/boletas/${id}`, {
      method: 'GET',
      headers: authHeaders(),
    });
    return handleResponse(response);
  },

  /**
   * Crear pedido/boleta
   * @param {object} pedido - { items: [{productoId, cantidad}], direccionEntrega?, notas? }
   */
  crear: async (pedido) => {
    const token = getToken();
    const headers = token ? authHeaders() : jsonHeaders();
    
    const response = await fetch(`${API_BASE_URL}/v2/boletas`, {
      method: 'POST',
      headers,
      body: JSON.stringify(pedido),
    });
    return handleResponse(response);
  },

  /**
   * Cancelar pedido
   * @param {number} id 
   */
  cancelar: async (id) => {
    const response = await fetch(`${API_BASE_URL}/v2/boletas/${id}/cancelar`, {
      method: 'PUT',
      headers: authHeaders(),
    });
    return handleResponse(response);
  },
};

/**
 * Servicio de Boletas (admin)
 */
export const boletasAdmin = {
  /**
   * Obtener todas las boletas
   */
  obtenerTodas: async () => {
    const response = await fetch(`${API_BASE_URL}/v1/boletas`, {
      method: 'GET',
      headers: authHeaders(),
    });
    return handleResponse(response);
  },

  /**
   * Obtener boleta por ID
   * @param {number} id 
   */
  obtenerPorId: async (id) => {
    const response = await fetch(`${API_BASE_URL}/v1/boletas/${id}`, {
      method: 'GET',
      headers: authHeaders(),
    });
    return handleResponse(response);
  },

  /**
   * Obtener boletas por usuario
   * @param {number} userId 
   */
  obtenerPorUsuario: async (userId) => {
    const response = await fetch(`${API_BASE_URL}/v1/boletas/usuario/${userId}`, {
      method: 'GET',
      headers: authHeaders(),
    });
    return handleResponse(response);
  },

  /**
   * Obtener boletas por estado
   * @param {string} estado - pendiente, procesado, enviado, entregado, cancelado
   */
  obtenerPorEstado: async (estado) => {
    const response = await fetch(`${API_BASE_URL}/v1/boletas/estado/${estado}`, {
      method: 'GET',
      headers: authHeaders(),
    });
    return handleResponse(response);
  },

  /**
   * Actualizar estado de boleta
   * @param {number} id 
   * @param {string} estado 
   */
  actualizarEstado: async (id, estado) => {
    const response = await fetch(`${API_BASE_URL}/v1/boletas/${id}/estado?estado=${encodeURIComponent(estado)}`, {
      method: 'PUT',
      headers: authHeaders(),
    });
    return handleResponse(response);
  },

  /**
   * Eliminar boleta
   * @param {number} id 
   */
  eliminar: async (id) => {
    const response = await fetch(`${API_BASE_URL}/v1/boletas/${id}`, {
      method: 'DELETE',
      headers: authHeaders(),
    });
    return handleResponse(response);
  },
};

/**
 * Servicio de Perfil de Usuario
 */
export const perfil = {
  /**
   * Obtener perfil del usuario autenticado
   */
  obtener: async () => {
    const response = await fetch(`${API_BASE_URL}/v2/perfil`, {
      method: 'GET',
      headers: authHeaders(),
    });
    return handleResponse(response);
  },

  /**
   * Actualizar perfil
   * @param {object} datos - { nombre?, apellido?, direccion?, fechaNacimiento? }
   */
  actualizar: async (datos) => {
    const response = await fetch(`${API_BASE_URL}/v2/perfil`, {
      method: 'PUT',
      headers: authHeaders(),
      body: JSON.stringify(datos),
    });
    return handleResponse(response);
  },

  /**
   * Cambiar contraseña
   * @param {string} contrasenaActual 
   * @param {string} contrasenaNueva 
   */
  cambiarPassword: async (contrasenaActual, contrasenaNueva) => {
    const response = await fetch(`${API_BASE_URL}/v2/perfil/password`, {
      method: 'PUT',
      headers: authHeaders(),
      body: JSON.stringify({ contrasenaActual, contrasenaNueva }),
    });
    return handleResponse(response);
  },
};

/**
 * Servicio de Usuarios (admin)
 */
export const usuarios = {
  /**
   * Obtener todos los usuarios
   */
  obtenerTodos: async () => {
    const response = await fetch(`${API_BASE_URL}/v1/usuarios`, {
      method: 'GET',
      headers: authHeaders(),
    });
    return handleResponse(response);
  },

  /**
   * Obtener usuario por ID
   * @param {number} id 
   */
  obtenerPorId: async (id) => {
    const response = await fetch(`${API_BASE_URL}/v1/usuarios/${id}`, {
      method: 'GET',
      headers: authHeaders(),
    });
    return handleResponse(response);
  },

  /**
   * Actualizar rol de usuario
   * @param {number} id 
   * @param {string} rol 
   */
  actualizarRol: async (id, rol) => {
    const response = await fetch(`${API_BASE_URL}/v1/usuarios/${id}/rol?rol=${encodeURIComponent(rol)}`, {
      method: 'PUT',
      headers: authHeaders(),
    });
    return handleResponse(response);
  },

  /**
   * Desactivar usuario
   * @param {number} id 
   */
  desactivar: async (id) => {
    const response = await fetch(`${API_BASE_URL}/v1/usuarios/${id}`, {
      method: 'DELETE',
      headers: authHeaders(),
    });
    return handleResponse(response);
  },
};

/**
 * Servicio de Estadísticas y Reportes (admin)
 */
export const estadisticas = {
  /**
   * Obtener estadísticas generales del dashboard
   */
  obtener: async () => {
    const response = await fetch(`${API_BASE_URL}/v1/estadisticas`, {
      method: 'GET',
      headers: authHeaders(),
    });
    return handleResponse(response);
  },

  /**
   * Obtener reporte de ventas
   * @param {string} fechaInicio - Formato YYYY-MM-DD (opcional)
   * @param {string} fechaFin - Formato YYYY-MM-DD (opcional)
   */
  reporteVentas: async (fechaInicio = null, fechaFin = null) => {
    let url = `${API_BASE_URL}/v1/reportes/ventas`;
    const params = new URLSearchParams();
    if (fechaInicio) params.append('fechaInicio', fechaInicio);
    if (fechaFin) params.append('fechaFin', fechaFin);
    if (params.toString()) url += `?${params.toString()}`;

    const response = await fetch(url, {
      method: 'GET',
      headers: authHeaders(),
    });
    return handleResponse(response);
  },
};

// ============================================
// EXPORTACIÓN POR DEFECTO (objeto agrupado)
// ============================================

const api = {
  // Configuración
  BASE_URL: API_BASE_URL,
  getToken,
  setToken,
  removeToken,
  isAuthenticated,
  
  // Headers
  jsonHeaders,
  authHeaders,
  formDataHeaders,
  
  // Utilidades
  handleResponse,
  fetchApi,
  convertirCarritoParaBackend,
  
  // Servicios
  auth,
  productos,
  categorias,
  pedidos,
  boletasAdmin,
  perfil,
  usuarios,
  estadisticas,
};

export default api;

