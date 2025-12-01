/**
 * REFACTORIZACIÓN DE DATOS - GUÍA DE USO
 * 
 * Este archivo documenta la nueva capa centralizada de datos y cómo usarla.
 * 
 * ============================================================
 * ESTRUCTURA
 * ============================================================
 * 
 * 1. src/services/dataService.js
 *    - UsuarioService: CRUD para usuarios
 *    - PastelService: CRUD para pasteles
 *    - CarritoService: Gestión del carrito
 *    - PedidoService: CRUD para pedidos
 *    - SessionService: Gestión de sesión
 * 
 * 2. src/hooks/ (Hooks reactivos)
 *    - useCart(): acceso reactivo al carrito
 *    - usePasteles(): acceso reactivo a pasteles
 *    - useUsuarios(): acceso reactivo a usuarios
 *    - usePedidos(): acceso reactivo a pedidos
 * 
 * ============================================================
 * EJEMPLOS DE USO
 * ============================================================
 */

// ============================================================
// 1. USUARIO SERVICE
// ============================================================

import { UsuarioService } from '../services/dataService'

// Obtener todos los usuarios
const usuarios = UsuarioService.getAll()

// Buscar un usuario por id, email o nombre
const usuario = UsuarioService.findBy('ana.garcia@gmail.com')
const usuarioById = UsuarioService.findBy(1)

// Crear nuevo usuario
const nuevoUsuario = UsuarioService.create({
  nombre: 'Juan',
  apellido: 'Pérez',
  correo: 'juan@example.com',
  contrasena: 'JuanPerez123',
  role: 'user',
  direccion: 'Santiago, Chile',
})

// Actualizar usuario
UsuarioService.update(1, { direccion: 'Nueva dirección' })

// Eliminar usuario
UsuarioService.delete(1)

// ============================================================
// 2. PASTEL SERVICE
// ============================================================

import { PastelService } from '../services/dataService'

// Obtener todos los pasteles (mezcla JSON + localStorage sin duplicados)
const pasteles = PastelService.getAll()

// Obtener un pastel por id
const pastel = PastelService.getById(5)

// Buscar pasteles por nombre/descripción
const resultados = PastelService.search('chocolate')

// Crear pastel
const nuevoPastel = PastelService.create({
  nombre: 'Torta de Fresas',
  descripcion: 'Deliciosa torta de fresas',
  precio: 25000,
  stock: 10,
  categoria: 'Tortas',
})

// Actualizar pastel
PastelService.update(5, { precio: 30000, stock: 15 })

// Eliminar pastel (solo del localStorage)
PastelService.delete(5)

// ============================================================
// 3. CARRITO SERVICE (uso directo)
// ============================================================

import { CarritoService } from '../services/dataService'

// Obtener carrito completo
const carrito = CarritoService.get()

// Obtener total
const total = CarritoService.getTotal()

// Añadir producto
CarritoService.addItem({
  id: 1,
  nombre: 'Torta de Chocolate',
  precio: 25000,
  cantidad: 1,
  stock: 10,
})

// Actualizar cantidad
CarritoService.updateQuantity(1, 3)

// Remover item
CarritoService.removeItem(1)

// Limpiar carrito
CarritoService.clear()

// ============================================================
// 4. CARRITO HOOK (USO EN COMPONENTES REACT)
// ============================================================

import { useCart } from '../hooks/useCart'

export function MiComponente() {
  const { cart, total, addItem, updateQuantity, removeItem, clear } = useCart()

  return (
    <div>
      <h2>Carrito ({cart.length} items)</h2>
      <p>Total: ${total.toLocaleString()}</p>
      
      {cart.map(item => (
        <div key={item.id}>
          <span>{item.nombre} - ${item.precio} x {item.cantidad}</span>
          <button onClick={() => updateQuantity(item.id, item.cantidad + 1)}>+</button>
          <button onClick={() => removeItem(item.id)}>Quitar</button>
        </div>
      ))}
      
      <button onClick={clear}>Limpiar carrito</button>
    </div>
  )
}

// ============================================================
// 5. PASTELES HOOK
// ============================================================

import { usePasteles } from '../hooks/usePasteles'

export function MisProductos() {
  // Sin búsqueda: obtener todos
  const { pasteles, create, update, delete: deletePastel } = usePasteles()

  // Con búsqueda: filtrados
  const { pasteles: resultados } = usePasteles('chocolate')

  return (
    <div>
      <h2>Productos ({pasteles.length})</h2>
      
      {pasteles.map(p => (
        <div key={p.id}>
          {p.nombre} - ${p.precio}
          <button onClick={() => update(p.id, { precio: p.precio + 1000 })}>
            Aumentar precio
          </button>
        </div>
      ))}
    </div>
  )
}

// ============================================================
// 6. USUARIOS HOOK
// ============================================================

import { useUsuarios } from '../hooks/useUsuarios'

export function AdminUsuarios() {
  const { usuarios, create, update, delete: deleteUser } = useUsuarios()

  return (
    <div>
      <h2>Usuarios ({usuarios.length})</h2>
      
      {usuarios.map(u => (
        <div key={u.id}>
          {u.nombre} ({u.correo}) - Rol: {u.role}
          <button onClick={() => update(u.id, { role: 'admin' })}>
            Hacer Admin
          </button>
        </div>
      ))}
    </div>
  )
}

// ============================================================
// 7. PEDIDOS HOOK
// ============================================================

import { usePedidos } from '../hooks/usePedidos'

export function MisPedidos() {
  // Obtener todos los pedidos del usuario actual
  // (pasar userId si es necesario)
  const { pedidos, create, update } = usePedidos()

  return (
    <div>
      <h2>Mis Pedidos ({pedidos.length})</h2>
      
      {pedidos.map(p => (
        <div key={p.id}>
          Pedido #{p.id} - Estado: {p.status}
          <button onClick={() => update(p.id, { status: 'enviado' })}>
            Marcar como enviado
          </button>
        </div>
      ))}
    </div>
  )
}

// ============================================================
// 8. LOGIN CON AUTHCONTEXT
// ============================================================

import { useAuth } from '../context/AuthContext'
import { UsuarioService } from '../services/dataService'

export function LoginForm() {
  const { login } = useAuth()

  const handleSubmit = (email, password) => {
    const usuario = UsuarioService.findBy(email)
    if (usuario && usuario.contrasena === password) {
      // El contexto maneja storage y eventos
      login({
        id: usuario.id,
        nombre: usuario.nombre,
        correo: usuario.correo,
        role: usuario.role,
      })
    }
  }

  return <form onSubmit={(e) => handleSubmit(e.target.email.value, e.target.password.value)}>
    {/* ... */}
  </form>
}

// ============================================================
// 9. INICIALIZACIÓN (en main.jsx)
// ============================================================

import { initializeData } from './services/dataService'

// Al iniciar la app
initializeData()

// Esto inicializa usuarios y pasteles en localStorage si no existen

// ============================================================
// VENTAJAS
// ============================================================

/*
 * ✅ Centralización: Un único lugar para acceder a datos
 * ✅ Reactividad: Los hooks mantienen componentes sincronizados
 * ✅ Fácil mantenimiento: Cambios en el servicio no afectan componentes
 * ✅ Migrabilidad: Pasar a backend es trivial (cambiar solo el service)
 * ✅ Tipado: Puedes añadir TypeScript fácilmente
 * ✅ Testing: Services y hooks son fáciles de testear
 * ✅ Eventos: Sincronización automática entre pestañas/ventanas
 */

// ============================================================
// MIGRACIÓN A BACKEND (PRÓXIMO PASO)
// ============================================================

/*
 * Para migrar a un backend real, solo necesitas modificar dataService.js:
 * 
 * En lugar de:
 *   const raw = localStorage.getItem('pasteles_local')
 * 
 * Usa:
 *   const response = await fetch('/api/pasteles')
 *   const data = await response.json()
 * 
 * Los hooks y componentes no necesitan cambiar porque siguen usando
 * la misma API (PastelService.getAll(), etc.)
 */
