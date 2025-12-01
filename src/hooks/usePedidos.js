/**
 * Hook: usePedidos - Acceso reactivo a la lista de pedidos
 * Sincroniza con localStorage
 */
import { useState, useEffect } from 'react'
import { PedidoService } from '../services/dataService'

export function usePedidos(userId = null) {
  const [pedidos, setPedidos] = useState(() =>
    userId ? PedidoService.getByUserId(userId) : PedidoService.getAll()
  )
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)

  useEffect(() => {
    const updatePedidos = () => {
      setPedidos(userId ? PedidoService.getByUserId(userId) : PedidoService.getAll())
    }

    window.addEventListener('storage', (e) => {
      if (e.key === 'pedidos_local' || e.key === null) updatePedidos()
    })

    let mounted = true
    ;(async () => {
      setLoading(true)
      try {
        await import('../services/dataService').then(m => m.syncFromServer())
      } catch (e) { setError(e) }
      if (mounted) setLoading(false)
    })()

    return () => {
      mounted = false
      window.removeEventListener('storage', updatePedidos)
    }
  }, [userId])

  return {
    pedidos,
    loading,
    error,
    getById: (id) => PedidoService.getById(id),
    create: (pedido) => {
      const created = PedidoService.create(pedido)
      setPedidos(userId ? PedidoService.getByUserId(userId) : PedidoService.getAll())
      return created
    },
    update: (id, changes) => {
      const updated = PedidoService.update(id, changes)
      setPedidos(userId ? PedidoService.getByUserId(userId) : PedidoService.getAll())
      return updated
    },
    delete: (id) => {
      const ok = PedidoService.delete(id)
      setPedidos(userId ? PedidoService.getByUserId(userId) : PedidoService.getAll())
      return ok
    },
  }
}
