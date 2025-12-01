import React, { createContext, useContext, useEffect, useState } from 'react'

const AuthContext = createContext(null)

export function AuthProvider({ children }) {
  const [user, setUser] = useState(() => {
    try {
      const raw = localStorage.getItem('session_user')
      return raw ? JSON.parse(raw) : null
    } catch (e) {
      return null
    }
  })

  useEffect(() => {
    function onStorage(e) {
      if (e.key === 'session_user') {
        try {
          const value = e.newValue ? JSON.parse(e.newValue) : null
          setUser(value)
        } catch (err) {
          setUser(null)
        }
      }
    }

    function onUserLogin(e) {
      setUser(e.detail ?? null)
    }

    function onUserLogout() {
      setUser(null)
    }

    window.addEventListener('storage', onStorage)
    window.addEventListener('userLogin', onUserLogin)
    window.addEventListener('userLogout', onUserLogout)

    return () => {
      window.removeEventListener('storage', onStorage)
      window.removeEventListener('userLogin', onUserLogin)
      window.removeEventListener('userLogout', onUserLogout)
    }
  }, [])

  function login(sessionObj) {
    try {
      localStorage.setItem('session_user', JSON.stringify(sessionObj))
      setUser(sessionObj)
      window.dispatchEvent(new CustomEvent('userLogin', { detail: sessionObj }))
      // also dispatch storage so other listeners update (compat)
      window.dispatchEvent(new Event('storage'))
      // If server token provided, try to sync cart from server
      (async () => {
        try {
          if (sessionObj && sessionObj.token) {
            const API_BASE = (import.meta && import.meta.env && import.meta.env.VITE_API_BASE_URL) || 'http://localhost:8094'
            const r = await fetch(`${API_BASE}/api/cart`, { headers: { Authorization: `Bearer ${sessionObj.token}` } })
            if (r.ok) {
              const data = await r.json()
              if (data && Array.isArray(data.items)) {
                localStorage.setItem('pasteleria_cart', JSON.stringify(data.items))
                try { window.dispatchEvent(new CustomEvent('cartUpdated', { detail: data.items })) } catch (e) {}
                try { window.dispatchEvent(new CustomEvent('storage')) } catch (e) {}
              }
            }
          }
        } catch (e) {
          // ignore
        }
      })()
      return true
    } catch (err) {
      return false
    }
  }

  function logout() {
    try {
      localStorage.removeItem('session_user')
      setUser(null)
      window.dispatchEvent(new CustomEvent('userLogout'))
      // also dispatch storage so other listeners update (compat)
      window.dispatchEvent(new Event('storage'))
      return true
    } catch (err) {
      return false
    }
  }

  const value = { user, login, logout }

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

export function useAuth() {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth must be used within AuthProvider')
  return ctx
}

export default AuthContext
