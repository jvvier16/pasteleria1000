/**
 * Hook: usePasteles - Acceso reactivo a la lista de pasteles
 * Sincroniza con localStorage y cambios en admin
 */
import { useState, useEffect } from 'react'
import { PastelService, syncFromServer } from '../services/dataService'

export function usePasteles(search = '') {
  const [pasteles, setPasteles] = useState(() =>
    search ? PastelService.search(search) : PastelService.getAll()
  )
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)

  useEffect(() => {
    const updatePasteles = () => {
      setPasteles(search ? PastelService.search(search) : PastelService.getAll())
    }

    window.addEventListener('storage', (e) => {
      if (e.key === 'pasteles_local' || e.key === null) updatePasteles()
    })

    // Fetch from API to ensure newest data
    let mounted = true
    ;(async () => {
      setLoading(true)
      try {
        // syncFromServer will update localStorage and emit storage
        await syncFromServer()
      } catch (e) {
        setError(e)
      } finally {
        if (mounted) setLoading(false)
      }
    })()

    return () => {
      mounted = false
      window.removeEventListener('storage', updatePasteles)
    }
  }, [search])

  return {
    pasteles,
    loading,
    error,
    getById: (id) => PastelService.getById(id),
    create: (pastel) => {
      const created = PastelService.create(pastel)
      setPasteles(search ? PastelService.search(search) : PastelService.getAll())
      return created
    },
    update: (id, changes) => {
      const updated = PastelService.update(id, changes)
      setPasteles(search ? PastelService.search(search) : PastelService.getAll())
      return updated
    },
    delete: (id) => {
      const ok = PastelService.delete(id)
      setPasteles(search ? PastelService.search(search) : PastelService.getAll())
      return ok
    },
  }
}
