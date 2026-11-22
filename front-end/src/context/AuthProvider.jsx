import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { useLocation } from 'react-router'
import authApi from '../services/authApi.js'
import { AuthContext } from './AuthContext.js'

const anonymous = { status: 'anonymous', user: null, error: null }

export default function AuthProvider({ children }) {
  const { pathname } = useLocation()
  const [session, setSession] = useState({ status: 'loading', user: null, error: null })
  const revision = useRef(0)
  const mutating = useRef(false)

  const refresh = useCallback(({ signal } = {}) => {
    if (mutating.current || signal?.aborted) return Promise.resolve()
    const attempt = ++revision.current
    return authApi.me({ signal }).then(user => {
      if (attempt === revision.current && !signal?.aborted) setSession({ status: 'authenticated', user, error: null })
    }, error => {
      if (signal?.aborted || attempt !== revision.current) return
      setSession(error.status === 401 ? anonymous : { status: 'error', user: null, error: error.message })
    })
  }, [])

  useEffect(() => {
    const controller = new AbortController()
    void refresh({ signal: controller.signal })
    const recheck = () => {
      if (document.visibilityState === 'visible') void refresh({ signal: controller.signal })
    }
    window.addEventListener('focus', recheck)
    window.addEventListener('pageshow', recheck)
    document.addEventListener('visibilitychange', recheck)
    const timer = window.setInterval(recheck, 60000)
    return () => {
      controller.abort()
      window.clearInterval(timer)
      window.removeEventListener('focus', recheck)
      window.removeEventListener('pageshow', recheck)
      document.removeEventListener('visibilitychange', recheck)
    }
  }, [pathname, refresh])

  const login = useCallback(async details => {
    if (mutating.current) throw new Error('Please wait for the current request.')
    mutating.current = true
    revision.current += 1
    try {
      const user = await authApi.login(details)
      setSession({ status: 'authenticated', user, error: null })
    } finally {
      mutating.current = false
    }
  }, [])

  const logout = useCallback(async () => {
    if (mutating.current) throw new Error('Please wait for the current request.')
    mutating.current = true
    revision.current += 1
    try {
      await authApi.logout()
      setSession(anonymous)
    } finally {
      mutating.current = false
    }
  }, [])

  const clearSession = useCallback(() => {
    revision.current += 1
    setSession(anonymous)
  }, [])

  const value = useMemo(() => ({ ...session, login, logout, refresh, clearSession }), [session, login, logout, refresh, clearSession])
  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}
