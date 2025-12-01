/**
 * Hook: useUsuarios - Acceso reactivo a la lista de usuarios
 * Sincroniza con localStorage
 */
import { useState, useEffect } from 'react'
import { UsuarioService } from '../services/dataService'

export function useUsuarios() {
  const [usuarios, setUsuarios] = useState(() => UsuarioService.getAll())
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)

  useEffect(() => {
    const updateUsuarios = () => {
      setUsuarios(UsuarioService.getAll())
    }

    window.addEventListener('storage', (e) => {
      if (e.key === 'usuarios_local' || e.key === null) updateUsuarios()
    })

    let mounted = true
    ;(async () => {
      setLoading(true)
      try {
        // fetch latest users via background sync
        await import('../services/dataService').then(m => m.syncFromServer())
      } catch (e) {
        setError(e)
      } finally {
        if (mounted) setLoading(false)
      }
    })()

    return () => {
      mounted = false
      window.removeEventListener('storage', updateUsuarios)
    }
  }, [])

  return {
    usuarios,
    loading,
    error,
    findBy: (filter) => UsuarioService.findBy(filter),
    create: (usuario) => {
      const created = UsuarioService.create(usuario)
      setUsuarios(UsuarioService.getAll())
      return created
    },
    update: (id, changes) => {
      const updated = UsuarioService.update(id, changes)
      setUsuarios(UsuarioService.getAll())
      return updated
    },
    delete: (id) => {
      const ok = UsuarioService.delete(id)
      setUsuarios(UsuarioService.getAll())
      return ok
    },
  }
}
