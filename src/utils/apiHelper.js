/**
 * API Helper - Pastelería Mil Sabores
 * 
 * Este archivo contiene todas las funciones para consumir los endpoints del backend.
 * Base URL: http://localhost:8094/api
 * 
 * Soporta dos métodos de autenticación:
 * 1. JWT Token (Authorization: Bearer <token>) - Para usuarios logueados
 * 2. API Key (X-API-Key: <key>) - Para testing o integraciones
 * 
 * Todas las respuestas del backend tienen el formato:
 * {
 *   status: number,
 *   message: string,
 *   data: T | null,
 *   timestamp: string
 * }
 */

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL 
  ? `${import.meta.env.VITE_API_BASE_URL}/api`
  : 'http://localhost:8094/api';

// ============================================
// UTILIDADES DE AUTENTICACIÓN
// ============================================

/**
 * Obtiene el token JWT del localStorage
 */
const getToken = () => localStorage.getItem('token');

/**
 * Obtiene la API Key del localStorage
 */
const getApiKey = () => localStorage.getItem('api_key');

/**
 * Configura una API Key para usar en las peticiones
 * @param {string} apiKey - La API Key a usar
 */
export const setApiKey = (apiKey) => {
  if (apiKey) {
    localStorage.setItem('api_key', apiKey);
  } else {
    localStorage.removeItem('api_key');
  }
};

/**
 * Obtiene la API Key actual
 * @returns {string|null}
 */
export const getCurrentApiKey = () => getApiKey();

/**
 * Elimina la API Key del localStorage
 */
export const clearApiKey = () => {
  localStorage.removeItem('api_key');
};

/**
 * Verifica si el usuario está autenticado (por token o API Key)
 * @returns {boolean}
 */
export const isAuthenticated = () => !!getToken() || !!getApiKey();

/**
 * Verifica si hay un token JWT válido
 * @returns {boolean}
 */
export const hasToken = () => !!getToken();

/**
 * Verifica si hay una API Key configurada
 * @returns {boolean}
 */
export const hasApiKey = () => !!getApiKey();

/**
 * Headers comunes para peticiones JSON
 */
const jsonHeaders = () => ({
  'Content-Type': 'application/json',
});

/**
 * Headers con autenticación (JWT Token o API Key)
 * Prioridad: API Key > JWT Token
 */
const authHeaders = () => {
  const headers = {
    'Content-Type': 'application/json',
  };
  
  // Priorizar API Key si existe
  const apiKey = getApiKey();
  if (apiKey) {
    headers['X-API-Key'] = apiKey;
    return headers;
  }
  
  // Si no hay API Key, usar JWT Token
  const token = getToken();
  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }
  
  return headers;
};

/**
 * Headers solo con API Key (forzar uso de API Key)
 * @param {string} apiKey - API Key a usar (opcional, usa la guardada si no se proporciona)
 */
export const apiKeyHeaders = (apiKey = null) => {
  const key = apiKey || getApiKey();
  if (!key) {
    throw new Error('No hay API Key configurada');
  }
  return {
    'Content-Type': 'application/json',
    'X-API-Key': key,
  };
};

/**
 * Maneja la respuesta de fetch y parsea JSON
 * - Maneja respuestas vacías (204 No Content)
 * - Maneja errores de parsing JSON
 * - Maneja errores HTTP
 */
const handleResponse = async (response) => {
  // Si es 204 No Content o respuesta vacía
  const contentType = response.headers.get('content-type');
  const contentLength = response.headers.get('content-length');
  
  // Si no hay contenido, retornar objeto vacío
  if (response.status === 204 || contentLength === '0') {
    if (!response.ok) {
      throw { status: response.status, message: 'Error del servidor' };
    }
    return { status: response.status, data: null, message: 'OK' };
  }
  
  // Intentar parsear JSON
  let data = null;
  try {
    const text = await response.text();
    if (text && text.trim()) {
      data = JSON.parse(text);
    } else {
      // Respuesta vacía
      if (!response.ok) {
        throw { status: response.status, message: `Error HTTP ${response.status}` };
      }
      return { status: response.status, data: null, message: 'OK' };
    }
  } catch (parseError) {
    // Error al parsear JSON
    if (!response.ok) {
      throw { status: response.status, message: `Error HTTP ${response.status}` };
    }
    console.warn('Respuesta no es JSON válido:', parseError);
    return { status: response.status, data: null, message: 'OK' };
  }
  
  if (!response.ok) {
    throw { status: response.status, ...(typeof data === 'object' ? data : { message: data }) };
  }
  
  return data;
};

/**
 * Convierte el carrito del frontend al formato esperado por el backend
 * @param {Array} carrito - Array de productos del carrito local
 * @param {Object} datosCliente - Datos adicionales del cliente
 * @returns {Object} - Objeto formateado para el endpoint de crear pedido
 * 
 * @example
 * const carritoLocal = [
 *   { id: 1, nombre: "Torta", precio: 15000, cantidad: 2 },
 *   { id: 5, nombre: "Pie", precio: 8000, cantidad: 1 }
 * ];
 * const pedido = convertirCarritoParaBackend(carritoLocal, {
 *   direccionEntrega: "Calle 123",
 *   telefonoCliente: "+56912345678"
 * });
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
// AUTENTICACIÓN - /api/v2/auth
// ============================================

/**
 * Login de usuario
 * @param {string} correo - Email del usuario
 * @param {string} contrasena - Contraseña del usuario
 * @returns {Promise} - { token, userId, nombre, correo, role }
 */
export const login = async (correo, contrasena) => {
  const response = await fetch(`${API_BASE_URL}/v2/auth/login`, {
    method: 'POST',
    headers: jsonHeaders(),
    body: JSON.stringify({ correo, contrasena }),
  });
  return handleResponse(response);
};

/**
 * Registro de nuevo usuario
 * @param {Object} usuario - { nombre, apellido, correo, contrasena, telefono?, direccion? }
 * @returns {Promise} - { token, userId, nombre, correo, role }
 */
export const registro = async (usuario) => {
  const response = await fetch(`${API_BASE_URL}/v2/auth/registro`, {
    method: 'POST',
    headers: jsonHeaders(),
    body: JSON.stringify(usuario),
  });
  return handleResponse(response);
};

/**
 * Verificar token JWT
 * @returns {Promise} - { valido, userId, correo, role }
 */
export const verificarToken = async () => {
  const response = await fetch(`${API_BASE_URL}/v2/auth/verificar`, {
    method: 'GET',
    headers: authHeaders(),
  });
  return handleResponse(response);
};

/**
 * Cerrar sesión
 * @returns {Promise}
 */
export const logout = async () => {
  const response = await fetch(`${API_BASE_URL}/v2/auth/logout`, {
    method: 'POST',
    headers: authHeaders(),
  });
  return handleResponse(response);
};

// ============================================
// PRODUCTOS - /api/v2/productos (Públicos)
// ============================================

/**
 * Obtener todos los productos
 * @returns {Promise} - Lista de productos con detalles
 */
export const obtenerProductos = async () => {
  const response = await fetch(`${API_BASE_URL}/v2/productos`, {
    method: 'GET',
    headers: jsonHeaders(),
  });
  return handleResponse(response);
};

/**
 * Obtener un producto por ID
 * @param {number} id - ID del producto
 * @returns {Promise} - Detalles del producto
 */
export const obtenerProductoPorId = async (id) => {
  const response = await fetch(`${API_BASE_URL}/v2/productos/${id}`, {
    method: 'GET',
    headers: jsonHeaders(),
  });
  return handleResponse(response);
};

/**
 * Buscar productos por nombre o descripción
 * @param {string} query - Término de búsqueda
 * @returns {Promise} - Lista de productos encontrados
 */
export const buscarProductos = async (query) => {
  const response = await fetch(`${API_BASE_URL}/v2/productos/buscar?q=${encodeURIComponent(query)}`, {
    method: 'GET',
    headers: jsonHeaders(),
  });
  return handleResponse(response);
};

/**
 * Obtener productos por categoría
 * @param {number} categoriaId - ID de la categoría
 * @returns {Promise} - Lista de productos de la categoría
 */
export const obtenerProductosPorCategoria = async (categoriaId) => {
  const response = await fetch(`${API_BASE_URL}/v2/productos/categoria/${categoriaId}`, {
    method: 'GET',
    headers: jsonHeaders(),
  });
  return handleResponse(response);
};

// ============================================
// PRODUCTOS ADMIN - /api/v2/productos (Requiere Auth)
// ============================================

/**
 * Crear nuevo producto (Admin/Vendedor)
 * @param {Object} producto - { nombre, precio, stock, imagen?, descripcion?, categoriaId? }
 * @returns {Promise} - Producto creado
 */
export const crearProducto = async (producto) => {
  const response = await fetch(`${API_BASE_URL}/v2/productos`, {
    method: 'POST',
    headers: authHeaders(),
    body: JSON.stringify(producto),
  });
  return handleResponse(response);
};

/**
 * Actualizar producto (Admin/Vendedor)
 * @param {number} id - ID del producto
 * @param {Object} producto - Datos a actualizar
 * @returns {Promise} - Producto actualizado
 */
export const actualizarProducto = async (id, producto) => {
  const response = await fetch(`${API_BASE_URL}/v2/productos/${id}`, {
    method: 'PUT',
    headers: authHeaders(),
    body: JSON.stringify(producto),
  });
  return handleResponse(response);
};

/**
 * Eliminar producto (Admin)
 * @param {number} id - ID del producto
 * @returns {Promise}
 */
export const eliminarProducto = async (id) => {
  const response = await fetch(`${API_BASE_URL}/v2/productos/${id}`, {
    method: 'DELETE',
    headers: authHeaders(),
  });
  return handleResponse(response);
};

// ============================================
// CATEGORÍAS - /api/v2/categorias (Públicos)
// ============================================

/**
 * Obtener todas las categorías
 * @returns {Promise} - Lista de categorías
 */
export const obtenerCategorias = async () => {
  const response = await fetch(`${API_BASE_URL}/v2/categorias`, {
    method: 'GET',
    headers: jsonHeaders(),
  });
  return handleResponse(response);
};

/**
 * Obtener una categoría por ID
 * @param {number} id - ID de la categoría
 * @returns {Promise} - Detalles de la categoría
 */
export const obtenerCategoriaPorId = async (id) => {
  const response = await fetch(`${API_BASE_URL}/v2/categorias/${id}`, {
    method: 'GET',
    headers: jsonHeaders(),
  });
  return handleResponse(response);
};

// ============================================
// CATEGORÍAS ADMIN - /api/v1/categorias (Requiere Auth)
// ============================================

/**
 * Crear nueva categoría (Admin)
 * @param {Object} categoria - { nombre, descripcion? }
 * @returns {Promise} - Categoría creada
 */
export const crearCategoria = async (categoria) => {
  const response = await fetch(`${API_BASE_URL}/v1/categorias`, {
    method: 'POST',
    headers: authHeaders(),
    body: JSON.stringify(categoria),
  });
  return handleResponse(response);
};

/**
 * Actualizar categoría (Admin)
 * @param {Object} categoria - { categoriaId, nombre, descripcion? }
 * @returns {Promise} - Categoría actualizada
 */
export const actualizarCategoria = async (categoria) => {
  const response = await fetch(`${API_BASE_URL}/v1/categorias`, {
    method: 'PUT',
    headers: authHeaders(),
    body: JSON.stringify(categoria),
  });
  return handleResponse(response);
};

/**
 * Eliminar categoría (Admin)
 * @param {number} id - ID de la categoría
 * @returns {Promise}
 */
export const eliminarCategoria = async (id) => {
  const response = await fetch(`${API_BASE_URL}/v1/categorias/${id}`, {
    method: 'DELETE',
    headers: authHeaders(),
  });
  return handleResponse(response);
};

// ============================================
// PERFIL DE USUARIO - /api/v2/perfil
// ============================================

/**
 * Obtener perfil del usuario autenticado
 * @returns {Promise} - Datos del perfil
 */
export const obtenerMiPerfil = async () => {
  const response = await fetch(`${API_BASE_URL}/v2/perfil`, {
    method: 'GET',
    headers: authHeaders(),
  });
  return handleResponse(response);
};

/**
 * Actualizar perfil del usuario
 * @param {Object} datos - { nombre?, apellido?, telefono?, direccion?, imagen?, fechaNacimiento? }
 * @returns {Promise} - Perfil actualizado
 */
export const actualizarMiPerfil = async (datos) => {
  const response = await fetch(`${API_BASE_URL}/v2/perfil`, {
    method: 'PUT',
    headers: authHeaders(),
    body: JSON.stringify(datos),
  });
  return handleResponse(response);
};

/**
 * Cambiar contraseña del usuario
 * @param {string} contrasenaActual - Contraseña actual
 * @param {string} contrasenaNueva - Nueva contraseña
 * @returns {Promise}
 */
export const cambiarPassword = async (contrasenaActual, contrasenaNueva) => {
  const response = await fetch(`${API_BASE_URL}/v2/perfil/password`, {
    method: 'PUT',
    headers: authHeaders(),
    body: JSON.stringify({ contrasenaActual, contrasenaNueva }),
  });
  return handleResponse(response);
};

// ============================================
// BOLETAS/PEDIDOS USUARIO - /api/v2/boletas
// ============================================

/**
 * Obtener mis pedidos (usuario autenticado)
 * @returns {Promise} - Lista de pedidos del usuario
 */
export const obtenerMisPedidos = async () => {
  const response = await fetch(`${API_BASE_URL}/v2/boletas/mis-pedidos`, {
    method: 'GET',
    headers: authHeaders(),
  });
  return handleResponse(response);
};

/**
 * Crear nueva boleta/pedido (finalizar compra)
 * @param {Object} pedido - Datos del pedido
 * @param {Array} pedido.items - Lista de productos [{ productoId: number, cantidad: number }]
 * @param {string} [pedido.nombreCliente] - Nombre del cliente (para compras sin autenticación)
 * @param {string} [pedido.emailCliente] - Email del cliente
 * @param {string} [pedido.telefonoCliente] - Teléfono del cliente
 * @param {string} [pedido.direccionEntrega] - Dirección de entrega
 * @param {string} [pedido.notas] - Notas adicionales del pedido
 * @returns {Promise} - Boleta creada con detalles
 * 
 * @example
 * // Ejemplo de uso:
 * const pedido = {
 *   items: [
 *     { productoId: 1, cantidad: 2 },
 *     { productoId: 5, cantidad: 1 }
 *   ],
 *   direccionEntrega: "Calle Principal 123",
 *   telefonoCliente: "+56912345678",
 *   notas: "Sin gluten por favor"
 * };
 * const resultado = await crearPedido(pedido);
 */
export const crearPedido = async (pedido) => {
  const token = getToken();
  const apiKey = getApiKey();
  const headers = (token || apiKey) ? authHeaders() : jsonHeaders();
  
  const response = await fetch(`${API_BASE_URL}/v2/boletas`, {
    method: 'POST',
    headers,
    body: JSON.stringify(pedido),
  });
  return handleResponse(response);
};

/**
 * Obtener una boleta por ID
 * @param {number} id - ID de la boleta
 * @returns {Promise} - Detalles de la boleta
 */
export const obtenerPedidoPorId = async (id) => {
  const response = await fetch(`${API_BASE_URL}/v2/boletas/${id}`, {
    method: 'GET',
    headers: authHeaders(),
  });
  return handleResponse(response);
};

/**
 * Cancelar un pedido
 * @param {number} id - ID del pedido
 * @returns {Promise} - Pedido cancelado
 */
export const cancelarPedido = async (id) => {
  const response = await fetch(`${API_BASE_URL}/v2/boletas/${id}/cancelar`, {
    method: 'PUT',
    headers: authHeaders(),
  });
  return handleResponse(response);
};

// ============================================
// BOLETAS ADMIN - /api/v1/boletas (Requiere Admin)
// ============================================

/**
 * Obtener todas las boletas (Admin)
 * @returns {Promise} - Lista de todas las boletas
 */
export const obtenerTodasLasBoletas = async () => {
  const response = await fetch(`${API_BASE_URL}/v1/boletas`, {
    method: 'GET',
    headers: authHeaders(),
  });
  return handleResponse(response);
};

/**
 * Obtener boletas de un usuario específico (Admin)
 * @param {number} userId - ID del usuario
 * @returns {Promise} - Lista de boletas del usuario
 */
export const obtenerBoletasPorUsuario = async (userId) => {
  const response = await fetch(`${API_BASE_URL}/v1/boletas/usuario/${userId}`, {
    method: 'GET',
    headers: authHeaders(),
  });
  return handleResponse(response);
};

/**
 * Obtener boletas por estado (Admin)
 * @param {string} estado - Estado de la boleta (pendiente, procesado, enviado)
 * @returns {Promise} - Lista de boletas con ese estado
 */
export const obtenerBoletasPorEstado = async (estado) => {
  const response = await fetch(`${API_BASE_URL}/v1/boletas/estado/${estado}`, {
    method: 'GET',
    headers: authHeaders(),
  });
  return handleResponse(response);
};

/**
 * Actualizar estado de una boleta (Admin)
 * @param {number} id - ID de la boleta
 * @param {string} estado - Nuevo estado (pendiente, procesado, enviado)
 * @returns {Promise} - Boleta actualizada
 */
export const actualizarEstadoBoleta = async (id, estado) => {
  const response = await fetch(`${API_BASE_URL}/v1/boletas/${id}/estado?estado=${encodeURIComponent(estado)}`, {
    method: 'PUT',
    headers: authHeaders(),
  });
  return handleResponse(response);
};

/**
 * Eliminar boleta (Admin)
 * @param {number} id - ID de la boleta
 * @returns {Promise}
 */
export const eliminarBoleta = async (id) => {
  const response = await fetch(`${API_BASE_URL}/v1/boletas/${id}`, {
    method: 'DELETE',
    headers: authHeaders(),
  });
  return handleResponse(response);
};

// ============================================
// USUARIOS ADMIN - /api/v1/usuarios (Requiere Admin)
// ============================================

/**
 * Obtener todos los usuarios (Admin)
 * @returns {Promise} - Lista de usuarios
 */
export const obtenerTodosLosUsuarios = async () => {
  const response = await fetch(`${API_BASE_URL}/v1/usuarios`, {
    method: 'GET',
    headers: authHeaders(),
  });
  return handleResponse(response);
};

/**
 * Obtener usuario por ID (Admin)
 * @param {number} id - ID del usuario
 * @returns {Promise} - Datos del usuario
 */
export const obtenerUsuarioPorId = async (id) => {
  const response = await fetch(`${API_BASE_URL}/v1/usuarios/${id}`, {
    method: 'GET',
    headers: authHeaders(),
  });
  return handleResponse(response);
};

/**
 * Crear usuario (Admin)
 * @param {Object} usuario - Datos del usuario
 * @returns {Promise} - Usuario creado
 */
export const crearUsuario = async (usuario) => {
  const response = await fetch(`${API_BASE_URL}/v1/usuarios`, {
    method: 'POST',
    headers: authHeaders(),
    body: JSON.stringify(usuario),
  });
  return handleResponse(response);
};

/**
 * Actualizar usuario (Admin)
 * @param {Object} usuario - Datos del usuario con userId
 * @returns {Promise} - Usuario actualizado
 */
export const actualizarUsuario = async (usuario) => {
  const response = await fetch(`${API_BASE_URL}/v1/usuarios`, {
    method: 'PUT',
    headers: authHeaders(),
    body: JSON.stringify(usuario),
  });
  return handleResponse(response);
};

/**
 * Eliminar usuario (Admin)
 * @param {number} id - ID del usuario
 * @returns {Promise}
 */
export const eliminarUsuario = async (id) => {
  const response = await fetch(`${API_BASE_URL}/v1/usuarios/${id}`, {
    method: 'DELETE',
    headers: authHeaders(),
  });
  return handleResponse(response);
};

// ============================================
// ESTADÍSTICAS - /api/v1/estadisticas (Requiere Admin)
// ============================================

/**
 * Obtener estadísticas generales del dashboard (Admin)
 * @returns {Promise} - Estadísticas { totalProductos, totalUsuarios, totalBoletas, ventasTotales, etc. }
 */
export const obtenerEstadisticas = async () => {
  const response = await fetch(`${API_BASE_URL}/v1/estadisticas`, {
    method: 'GET',
    headers: authHeaders(),
  });
  return handleResponse(response);
};

/**
 * Obtener reporte de ventas (Admin)
 * @param {string} fechaInicio - Fecha inicio (YYYY-MM-DD)
 * @param {string} fechaFin - Fecha fin (YYYY-MM-DD)
 * @returns {Promise} - Reporte de ventas
 */
export const obtenerReporteVentas = async (fechaInicio = null, fechaFin = null) => {
  let url = `${API_BASE_URL}/v1/reportes/ventas`;
  const params = new URLSearchParams();
  
  if (fechaInicio) params.append('fechaInicio', fechaInicio);
  if (fechaFin) params.append('fechaFin', fechaFin);
  
  if (params.toString()) {
    url += `?${params.toString()}`;
  }
  
  const response = await fetch(url, {
    method: 'GET',
    headers: authHeaders(),
  });
  return handleResponse(response);
};

// ============================================
// EXPORTAR TODAS LAS FUNCIONES
// ============================================

export default {
  // Utilidades de autenticación
  isAuthenticated,
  hasToken,
  hasApiKey,
  setApiKey,
  getCurrentApiKey,
  clearApiKey,
  apiKeyHeaders,
  convertirCarritoParaBackend,
  
  // Auth
  login,
  registro,
  verificarToken,
  logout,
  
  // Productos públicos
  obtenerProductos,
  obtenerProductoPorId,
  buscarProductos,
  obtenerProductosPorCategoria,
  
  // Productos admin
  crearProducto,
  actualizarProducto,
  eliminarProducto,
  
  // Categorías públicas
  obtenerCategorias,
  obtenerCategoriaPorId,
  
  // Categorías admin
  crearCategoria,
  actualizarCategoria,
  eliminarCategoria,
  
  // Perfil
  obtenerMiPerfil,
  actualizarMiPerfil,
  cambiarPassword,
  
  // Pedidos usuario
  obtenerMisPedidos,
  crearPedido,
  obtenerPedidoPorId,
  cancelarPedido,
  
  // Boletas admin
  obtenerTodasLasBoletas,
  obtenerBoletasPorUsuario,
  obtenerBoletasPorEstado,
  actualizarEstadoBoleta,
  eliminarBoleta,
  
  // Usuarios admin
  obtenerTodosLosUsuarios,
  obtenerUsuarioPorId,
  crearUsuario,
  actualizarUsuario,
  eliminarUsuario,
  
  // Estadísticas
  obtenerEstadisticas,
  obtenerReporteVentas,
};
