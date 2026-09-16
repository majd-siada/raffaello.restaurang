import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from 'react'
import { opsFetch, OpsApiError } from './api'

const AuthContext = createContext(null)

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  const refreshMe = useCallback(async () => {
    setError(null)
    try {
      const me = await opsFetch('/auth/me/')
      if (me?.authenticated) {
        setUser(me)
      } else {
        setUser(null)
      }
      return me
    } catch (err) {
      setUser(null)
      setError(err instanceof OpsApiError ? err.message : 'Kunde inte läsa session.')
      return { authenticated: false, permissions: {} }
    }
  }, [])

  useEffect(() => {
    let cancelled = false
    ;(async () => {
      await Promise.resolve()
      if (cancelled) return
      try {
        await opsFetch('/auth/csrf/')
        const me = await opsFetch('/auth/me/')
        if (!cancelled) {
          setUser(me?.authenticated ? me : null)
        }
      } catch {
        if (!cancelled) setUser(null)
      } finally {
        if (!cancelled) setLoading(false)
      }
    })()
    return () => {
      cancelled = true
    }
  }, [])

  const login = useCallback(async (username, password) => {
    setError(null)
    const data = await opsFetch('/auth/login/', {
      method: 'POST',
      json: { username, password },
    })
    setUser(data)
    return data
  }, [])

  const logout = useCallback(async () => {
    setError(null)
    try {
      await opsFetch('/auth/logout/', { method: 'POST' })
    } finally {
      setUser(null)
    }
  }, [])

  const value = useMemo(
    () => ({
      user,
      loading,
      error,
      authenticated: Boolean(user?.authenticated),
      permissions: user?.permissions || {},
      username: user?.username || '',
      login,
      logout,
      refreshMe,
    }),
    [user, loading, error, login, logout, refreshMe],
  )

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

/** Context consumer hook (paired with AuthProvider). */
// eslint-disable-next-line react-refresh/only-export-components -- hook + provider pair
export function useAuth() {
  const ctx = useContext(AuthContext)
  if (!ctx) {
    throw new Error('useAuth måste användas inom AuthProvider')
  }
  return ctx
}
