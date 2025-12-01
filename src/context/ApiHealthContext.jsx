import React, { createContext, useContext, useEffect, useState, useCallback, useRef } from 'react'
import { API_BASE } from '../services/dataService'

// By default assume API is DOWN until proven otherwise. This prevents
// local JSON/localStorage data from being shown before health check completes.
if (typeof window !== 'undefined' && typeof window.__API_HEALTH__ === 'undefined') {
  window.__API_HEALTH__ = false
}

const ApiHealthContext = createContext({ healthy: false, checking: true, retry: () => {} })

export function ApiHealthProvider({ children, checkInterval = 10000 }) {
  const [healthy, setHealthy] = useState(false)
  const [checking, setChecking] = useState(true)
  const mounted = useRef(false)
  const timer = useRef(null)

  const checkHealth = useCallback(async () => {
    setChecking(true)
    try {
      const res = await fetch(`${API_BASE}/api/health`, { method: 'GET' })
      if (!res.ok) throw new Error('HTTP ' + res.status)
      setHealthy(true)
    } catch (e) {
      setHealthy(false)
    } finally {
      setChecking(false)
    }
  }, [])

  useEffect(() => {
    mounted.current = true
    // initial check
    checkHealth()
    // periodic check
    timer.current = setInterval(() => {
      checkHealth()
    }, checkInterval)

    return () => {
      mounted.current = false
      if (timer.current) clearInterval(timer.current)
    }
  }, [checkHealth, checkInterval])

  // expose a global flag and fire event for non-react modules
  useEffect(() => {
    try {
      if (typeof window !== 'undefined') {
        window.__API_HEALTH__ = healthy
        try { window.dispatchEvent(new CustomEvent('apiHealthChanged', { detail: { healthy } })) } catch (e) {}
      }
    } catch (e) {}
  }, [healthy])

  return (
    <ApiHealthContext.Provider value={{ healthy, checking, retry: checkHealth }}>
      {children}
    </ApiHealthContext.Provider>
  )
}

export function useApiHealth() {
  return useContext(ApiHealthContext)
}
