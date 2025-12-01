/**
 * dataService: Capa centralizada para CRUD de datos en localStorage y JSON.
 * Maneja: usuarios, pasteles, pedidos, carrito.
 * Ventajas:
 * - Un único lugar para acceso a datos
 * - Facilita auditoría y debugging
 * - Permite migrar a backend sin cambiar componentes
 * - Incluye validación y eventos
 */

import usuariosData from '../data/Usuarios.json'
import pastelesData from '../data/Pasteles.json'

// API base (Vite environment or fallback)
export const API_BASE = typeof import.meta !== 'undefined' && import.meta.env && import.meta.env.VITE_API_BASE_URL
  ? import.meta.env.VITE_API_BASE_URL.replace(/\/$/, '')
  : 'http://localhost:3000'

// Helper: Normalize image paths to absolute URLs or Vite imports
function normalizeImagePath(imagePath) {
  if (!imagePath) return null
  
  // If already absolute URL, return as-is
  if (imagePath.startsWith('http://') || imagePath.startsWith('https://') || imagePath.startsWith('data:')) {
    return imagePath
  }
  
  // Convert relative paths like ../assets/img/... to /assets/img/...
  if (imagePath.includes('../assets/')) {
    const filename = imagePath.split('../assets/')[1]
    return `/assets/${filename}`
  }
  
  // If it's just a filename, assume it's in /assets/img/
  if (!imagePath.startsWith('/')) {
    return `/assets/img/${imagePath}`
  }
  
  return imagePath
}

// Helper: perform fetch with JSON and error handling
async function apiFetch(path, opts = {}) {
  const url = `${API_BASE}${path}`
  try {
    // attach Authorization header if token present in session
    try {
      const sessRaw = localStorage.getItem(KEYS.SESSION)
      const sess = sessRaw ? JSON.parse(sessRaw) : null
      if (sess && sess.token) {
        opts.headers = Object.assign({}, opts.headers || {}, { Authorization: `Bearer ${sess.token}` })
      }
    } catch (e) {
      // ignore parse errors
    }

    const res = await fetch(url, opts)
    const json = await res.json().catch(() => null)
    if (!res.ok) throw new Error(json && json.error ? json.error : `HTTP ${res.status}`)
    return json
  } catch (err) {
    console.warn('API fetch failed:', url, err.message)
    throw err
  }
}

// ==================== STORAGE KEYS ====================
const KEYS = {
  USUARIOS: 'usuarios_local',
  PASTELES: 'pasteles_local',
  PEDIDOS: 'pedidos_local',
  CARRITO: 'pasteleria_cart',
  SESSION: 'session_user',
}

// ==================== HELPER: Safe JSON Parse ====================
function safeParse(raw, fallback = null) {
  try {
    return raw ? JSON.parse(raw) : fallback
  } catch (err) {
    console.error('Error parsing JSON:', err)
    return fallback
  }
}

// ==================== USUARIO SERVICE ====================
export const UsuarioService = {
  /**
   * Obtener todos los usuarios (combina JSON + localStorage)
   */
  getAll() {
    // Return local cache synchronously, then try to refresh from API
    try {
      // If we know the API is down, do not show local/users data
      if (typeof window !== 'undefined' && window.__API_HEALTH__ === false) {
        return []
      }

      const raw = localStorage.getItem(KEYS.USUARIOS)
      const locales = safeParse(raw, [])
      const initial = locales?.length ? locales : usuariosData

      // Background refresh from server
      (async () => {
        try {
          const remote = await apiFetch('/api/usuarios')
          if (Array.isArray(remote)) {
            localStorage.setItem(KEYS.USUARIOS, JSON.stringify(remote))
            // trigger storage event to update UI
            try { window.dispatchEvent(new CustomEvent('storage')) } catch (e) {}
          }
        } catch (e) {
          // ignore, keep local
        }
      })()

      return initial
    } catch (err) {
      console.error('Error al obtener usuarios:', err)
      return usuariosData
    }
  },

  /**
   * Buscar un usuario por id, correo o nombre
   */
  findBy(filter) {
    const usuarios = this.getAll()
    if (typeof filter === 'number' || typeof filter === 'string') {
      const id = Number(filter)
      if (!isNaN(id)) return usuarios.find(u => u.id === id)
    }
    const normalized = (s) => (s || '').toString().toLowerCase()
    const filterNorm = normalized(filter)
    return usuarios.find(
      u =>
        normalized(u.correo) === filterNorm ||
        normalized(u.nombre) === filterNorm ||
        normalized((u.nombre || '') + ' ' + (u.apellido || '')) === filterNorm
    )
  },

  /**
   * Crear usuario (guardar en localStorage)
   */
  create(usuario) {
    try {
      // optimistic local creation; attempt server POST
      const usuarios = this.getAll()
      const newId = usuarios.length > 0 ? Math.max(...usuarios.map(u => u.id)) + 1 : 1
      const newUser = { ...usuario, id: newId }
      const updated = [...usuarios, newUser]
      localStorage.setItem(KEYS.USUARIOS, JSON.stringify(updated))
      // async send to server
      (async () => {
        try {
          const created = await apiFetch('/api/usuarios', {
            method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(usuario)
          })
          if (created && created.id) {
            // replace local with server id/version
            const locals = safeParse(localStorage.getItem(KEYS.USUARIOS), [])
            const merged = locals.map(u => (u === newUser ? created : u))
            localStorage.setItem(KEYS.USUARIOS, JSON.stringify(merged))
          }
        } catch (e) { /* ignore */ }
      })()
      return newUser
    } catch (err) {
      console.error('Error al crear usuario:', err)
      return null
    }
  },

  /**
   * Actualizar usuario por id
   */
  update(id, changes) {
    try {
      const usuarios = this.getAll()
      const idx = usuarios.findIndex(u => u.id === id)
      if (idx === -1) return null
      usuarios[idx] = { ...usuarios[idx], ...changes }
      localStorage.setItem(KEYS.USUARIOS, JSON.stringify(usuarios))
      // async update server
      (async () => {
        try {
          await apiFetch(`/api/usuarios/${id}`, { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(changes) })
        } catch (e) { /* ignore */ }
      })()
      return usuarios[idx]
    } catch (err) {
      console.error('Error al actualizar usuario:', err)
      return null
    }
  },

  /**
   * Eliminar usuario por id
   */
  delete(id) {
    try {
      const usuarios = this.getAll().filter(u => u.id !== id)
      localStorage.setItem(KEYS.USUARIOS, JSON.stringify(usuarios))
      // async delete on server
      (async () => {
        try { await apiFetch(`/api/usuarios/${id}`, { method: 'DELETE' }) } catch (e) {}
      })()
      return true
    } catch (err) {
      console.error('Error al eliminar usuario:', err)
      return false
    }
  },

  /**
   * Inicializar usuarios en localStorage si no existen
   */
  initialize() {
    try {
      const raw = localStorage.getItem(KEYS.USUARIOS)
      if (!raw || raw === '[]') {
        const editables = usuariosData.map(u => ({ ...u, _origen: 'local' }))
        localStorage.setItem(KEYS.USUARIOS, JSON.stringify(editables))
        // try to sync to server in background
        (async () => {
          try {
            for (const u of editables) {
              await apiFetch('/api/usuarios', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(u) })
            }
          } catch (e) { /* ignore */ }
        })()
      }
    } catch (err) {
      console.error('Error inicializando usuarios:', err)
    }
  },
}

// ==================== PASTEL SERVICE ====================
export const PastelService = {
  /**
   * Obtener todos los pasteles (combina JSON + localStorage sin duplicados)
   */
  getAll() {
    try {
      // If API is known to be down, return empty list so pasteles don't appear
      if (typeof window !== 'undefined' && window.__API_HEALTH__ === false) {
        return []
      }

      const raw = localStorage.getItem(KEYS.PASTELES)
      const locales = safeParse(raw, [])
      // Map para evitar duplicados: sobrescribir JSON con locales
      const mapa = new Map()
      for (const p of pastelesData) mapa.set(p.id, p)
      for (const p of locales || []) mapa.set(p.id, p)
      let initial = Array.from(mapa.values())

      // Normalize image paths
      initial = initial.map(p => ({
        ...p,
        imagen: normalizeImagePath(p.imagen)
      }))

      // Background refresh from server
      (async () => {
        try {
          let remote = await apiFetch('/api/pasteles')
          if (Array.isArray(remote)) {
            // Normalize image paths from server
            remote = remote.map(p => ({
              ...p,
              imagen: normalizeImagePath(p.imagen)
            }))
            localStorage.setItem(KEYS.PASTELES, JSON.stringify(remote))
            try { window.dispatchEvent(new CustomEvent('storage')) } catch (e) {}
          }
        } catch (e) {}
      })()

      return initial
    } catch (err) {
      console.error('Error al obtener pasteles:', err)
      return pastelesData.map(p => ({
        ...p,
        imagen: normalizeImagePath(p.imagen)
      }))
    }
  },

  /**
   * Obtener un pastel por id
   */
  getById(id) {
    return this.getAll().find(p => p.id === id)
  },

  /**
   * Filtrar pasteles por nombre/descripción (normalizado)
   */
  search(query) {
    const normalize = (s) =>
      String(s || '')
        .normalize('NFD')
        .replace(/\p{Diacritic}/gu, '')
        .toLowerCase()
    const searchNorm = normalize(query)
    return this.getAll().filter(p => {
      const hay = normalize(`${p.nombre || ''} ${p.descripcion || ''}`)
      return hay.includes(searchNorm)
    })
  },

  /**
   * Crear pastel (guardar en localStorage)
   */
  create(pastel) {
    try {
      const pasteles = this.getAll()
      const newId = pasteles.length > 0 ? Math.max(...pasteles.map(p => p.id)) + 1 : 1
      const newPastel = { ...pastel, id: newId }
      const locales = safeParse(localStorage.getItem(KEYS.PASTELES), [])
      const updated = [...(locales || []), newPastel]
      localStorage.setItem(KEYS.PASTELES, JSON.stringify(updated))
      // async create on server
      (async () => {
        try {
          const created = await apiFetch('/api/pasteles', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(pastel) })
          if (created && created.id) {
            const locals = safeParse(localStorage.getItem(KEYS.PASTELES), [])
            const merged = locals.map(p => (p === newPastel ? created : p))
            localStorage.setItem(KEYS.PASTELES, JSON.stringify(merged))
          }
        } catch (e) {}
      })()
      return newPastel
    } catch (err) {
      console.error('Error al crear pastel:', err)
      return null
    }
  },

  /**
   * Actualizar pastel por id (en localStorage)
   */
  update(id, changes) {
    try {
      const locales = safeParse(localStorage.getItem(KEYS.PASTELES), [])
      const idx = locales.findIndex(p => p.id === id)
      if (idx === -1) return null
      locales[idx] = { ...locales[idx], ...changes }
      localStorage.setItem(KEYS.PASTELES, JSON.stringify(locales))
      // async server update
      (async () => {
        try { await apiFetch(`/api/pasteles/${id}`, { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(changes) }) } catch (e) {}
      })()
      return locales[idx]
    } catch (err) {
      console.error('Error al actualizar pastel:', err)
      return null
    }
  },

  /**
   * Eliminar pastel por id (solo de localStorage)
   */
  delete(id) {
    try {
      const locales = safeParse(localStorage.getItem(KEYS.PASTELES), [])
      const updated = locales.filter(p => p.id !== id)
      localStorage.setItem(KEYS.PASTELES, JSON.stringify(updated))
      (async () => { try { await apiFetch(`/api/pasteles/${id}`, { method: 'DELETE' }) } catch (e) {} })()
      return true
    } catch (err) {
      console.error('Error al eliminar pastel:', err)
      return false
    }
  },

  /**
   * Inicializar pasteles en localStorage si no existen
   */
  initialize() {
    try {
      const raw = localStorage.getItem(KEYS.PASTELES)
      if (!raw || raw === '[]') {
        const editables = pastelesData.map(p => ({
          ...p,
          _origen: 'local',
          imagen: p.imagen || '',
        }))
        localStorage.setItem(KEYS.PASTELES, JSON.stringify(editables))
        // try to sync to server
        (async () => {
          try {
            for (const p of editables) {
              await apiFetch('/api/pasteles', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(p) })
            }
          } catch (e) {}
        })()
      }
    } catch (err) {
      console.error('Error inicializando pasteles:', err)
    }
  },
}

// ==================== CARRITO SERVICE ====================
export const CarritoService = {
  /**
   * Obtener carrito completo
   */
  get() {
    try {
      const raw = localStorage.getItem(KEYS.CARRITO)
      return safeParse(raw, [])
    } catch (err) {
      console.error('Error obteniendo carrito:', err)
      return []
    }
  },

  /**
   * Guardar carrito y emitir evento
   */
  save(cart) {
    try {
      localStorage.setItem(KEYS.CARRITO, JSON.stringify(cart))
      this._emitEvent(cart)
      // Try to persist cart to server if user is logged in (background)
      (async () => {
        try {
          await apiFetch('/api/cart', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ items: cart }) })
        } catch (e) {
          // ignore server errors; keep local copy
        }
      })()
    } catch (err) {
      console.error('Error guardando carrito:', err)
    }
  },

  /**
   * Añadir producto al carrito
   */
  addItem(product) {
    const qty = Number(product.cantidad) || 1
    const cart = this.get()
    const existing = cart.find(i => i.id === product.id)
    const stock = product.stock ?? existing?.stock ?? null
    if (existing) {
      const newQty = (existing.cantidad || 0) + qty
      existing.cantidad = stock != null && newQty > stock ? stock : newQty
    } else {
      const toAdd = { ...product, cantidad: qty }
      if (stock != null && toAdd.cantidad > stock) toAdd.cantidad = stock
      cart.push(toAdd)
    }
    this.save(cart)
    return cart
  },

  /**
   * Actualizar cantidad de un item
   */
  updateQuantity(id, cantidad) {
    const cart = this.get().map(i => {
      if (i.id !== id) return i
      const desired = Number(cantidad) || 1
      const stock = i.stock ?? null
      return { ...i, cantidad: stock != null && desired > stock ? stock : desired }
    })
    this.save(cart)
    return cart
  },

  /**
   * Remover item del carrito
   */
  removeItem(id) {
    const cart = this.get().filter(i => i.id !== id)
    this.save(cart)
    return cart
  },

  /**
   * Limpiar carrito
   */
  clear() {
    this.save([])
  },

  /**
   * Obtener total del carrito
   */
  getTotal() {
    return this.get().reduce(
      (acc, item) => acc + (Number(item.precio) || 0) * (item.cantidad || 1),
      0
    )
  },

  /**
   * Emitir evento cartUpdated para sincronizar UI
   */
  _emitEvent(cart) {
    if (typeof window !== 'undefined' && window.dispatchEvent) {
      try {
        window.dispatchEvent(new CustomEvent('cartUpdated', { detail: cart }))
      } catch (e) {
        // ignore
      }
    }
  },
}

// ==================== PEDIDOS SERVICE ====================
export const PedidoService = {
  /**
   * Obtener todos los pedidos
   */
  getAll() {
    try {
      const raw = localStorage.getItem(KEYS.PEDIDOS)
      const initial = safeParse(raw, []) || []

      // Background refresh from server
      (async () => {
        try {
          const remote = await apiFetch('/api/pedidos')
          if (Array.isArray(remote)) {
            localStorage.setItem(KEYS.PEDIDOS, JSON.stringify(remote))
            try { window.dispatchEvent(new CustomEvent('storage')) } catch (e) {}
          }
        } catch (e) { /* ignore */ }
      })()

      return initial
    } catch (err) {
      console.error('Error obteniendo pedidos:', err)
      return []
    }
  },

  /**
   * Obtener pedido por id
   */
  getById(id) {
    return this.getAll().find(p => p.id === id)
  },

  /**
   * Crear un pedido
   */
  create(pedido) {
    try {
      const pedidos = this.getAll()
      const newId = pedidos.length > 0 ? Math.max(...pedidos.map(p => p.id)) + 1 : 1
      const newPedido = { ...pedido, id: newId, createdAt: new Date().toISOString() }
      pedidos.push(newPedido)
      localStorage.setItem(KEYS.PEDIDOS, JSON.stringify(pedidos))
      // async create on server
      (async () => {
        try {
          const created = await apiFetch('/api/pedidos', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(pedido) })
          if (created && created.id) {
            const locals = safeParse(localStorage.getItem(KEYS.PEDIDOS), [])
            const merged = locals.map(p => (p === newPedido ? created : p))
            localStorage.setItem(KEYS.PEDIDOS, JSON.stringify(merged))
          }
        } catch (e) {}
      })()
      return newPedido
    } catch (err) {
      console.error('Error creando pedido:', err)
      return null
    }
  },

  /**
   * Actualizar pedido por id
   */
  update(id, changes) {
    try {
      const pedidos = this.getAll()
      const idx = pedidos.findIndex(p => p.id === id)
      if (idx === -1) return null
      pedidos[idx] = { ...pedidos[idx], ...changes, updatedAt: new Date().toISOString() }
      localStorage.setItem(KEYS.PEDIDOS, JSON.stringify(pedidos))
      return pedidos[idx]
    } catch (err) {
      console.error('Error actualizando pedido:', err)
      return null
    }
  },

  /**
   * Eliminar pedido por id
   */
  delete(id) {
    try {
      const pedidos = this.getAll().filter(p => p.id !== id)
      localStorage.setItem(KEYS.PEDIDOS, JSON.stringify(pedidos))
      return true
    } catch (err) {
      console.error('Error eliminando pedido:', err)
      return false
    }
  },

  /**
   * Filtrar pedidos por usuario
   */
  getByUserId(userId) {
    return this.getAll().filter(p => p.userId === userId)
  },

  /**
   * Filtrar pedidos por estado
   */
  getByStatus(status) {
    return this.getAll().filter(p => p.status === status)
  },
}

// ==================== SESSION SERVICE ====================
export const SessionService = {
  /**
   * Obtener sesión actual
   */
  get() {
    try {
      const raw = localStorage.getItem(KEYS.SESSION)
      return safeParse(raw, null)
    } catch (err) {
      console.error('Error obteniendo sesión:', err)
      return null
    }
  },

  /**
   * Establecer sesión
   */
  set(user) {
    try {
      localStorage.setItem(KEYS.SESSION, JSON.stringify(user))
      return true
    } catch (err) {
      console.error('Error guardando sesión:', err)
      return false
    }
  },

  /**
   * Limpiar sesión
   */
  clear() {
    try {
      localStorage.removeItem(KEYS.SESSION)
      return true
    } catch (err) {
      console.error('Error limpiando sesión:', err)
      return false
    }
  },
}

// ==================== INITIALIZE ALL ====================
export function initializeData() {
  UsuarioService.initialize()
  PastelService.initialize()
}

// Optional: force-sync from server into localStorage (useful after server migration)
export async function syncFromServer() {
  try {
    const [usuarios, pasteles, pedidos] = await Promise.all([
      (async () => { try { return await apiFetch('/api/usuarios') } catch (e) { return null } })(),
      (async () => { try { return await apiFetch('/api/pasteles') } catch (e) { return null } })(),
      (async () => { try { return await apiFetch('/api/pedidos') } catch (e) { return null } })(),
    ])
    if (Array.isArray(usuarios)) localStorage.setItem(KEYS.USUARIOS, JSON.stringify(usuarios))
    if (Array.isArray(pasteles)) localStorage.setItem(KEYS.PASTELES, JSON.stringify(pasteles))
    if (Array.isArray(pedidos)) localStorage.setItem(KEYS.PEDIDOS, JSON.stringify(pedidos))
    try { window.dispatchEvent(new CustomEvent('storage')) } catch (e) {}
    return true
  } catch (e) {
    console.error('Error sincronizando desde servidor:', e)
    return false
  }
}
