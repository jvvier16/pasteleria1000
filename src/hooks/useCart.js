/**
 * Hook: useCart - Acceso reactivo al carrito
 * Sincroniza con localStorage y eventos de actualización
 */
import { useState, useEffect } from 'react'
import { CarritoService } from '../services/dataService'

export function useCart() {
  const [cart, setCart] = useState(() => CarritoService.get())

  useEffect(() => {
    const updateCart = () => {
      setCart(CarritoService.get())
    }

    window.addEventListener('cartUpdated', updateCart)
    window.addEventListener('storage', (e) => {
      if (e.key === 'pasteleria_cart' || e.key === null) updateCart()
    })

    // If user logged in with token, try to load server cart
    ;(async () => {
      try {
        const sessRaw = localStorage.getItem('session_user')
        const sess = sessRaw ? JSON.parse(sessRaw) : null
        if (sess && sess.token) {
          const API_BASE = (import.meta && import.meta.env && import.meta.env.VITE_API_BASE_URL) || 'http://localhost:8094'
          const r = await fetch(`${API_BASE}/api/cart`, { headers: { Authorization: `Bearer ${sess.token}` } })
          if (r.ok) {
            const data = await r.json()
            if (data && Array.isArray(data.items)) {
              localStorage.setItem('pasteleria_cart', JSON.stringify(data.items))
              updateCart()
            }
          }
        }
      } catch (e) { /* ignore */ }
    })()

    return () => {
      window.removeEventListener('cartUpdated', updateCart)
      window.removeEventListener('storage', updateCart)
    }
  }, [])

  return {
    cart,
    addItem: (product) => {
      const updated = CarritoService.addItem(product)
      setCart(updated)
      return updated
    },
    updateQuantity: (id, cantidad) => {
      const updated = CarritoService.updateQuantity(id, cantidad)
      setCart(updated)
      return updated
    },
    removeItem: (id) => {
      const updated = CarritoService.removeItem(id)
      setCart(updated)
      return updated
    },
    clear: () => {
      CarritoService.clear()
      setCart([])
    },
    total: CarritoService.getTotal(),
  }
}
