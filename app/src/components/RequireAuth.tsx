import { useEffect, useState } from 'react'
import type { ReactNode } from 'react'
import { Navigate } from 'react-router-dom'
import { apiRequest } from '../lib/api'
import { clearAuthSessionId, clearSessionId, getAuthSessionId } from '../lib/session'
import type { AuthMeResponse } from '../types'
import Logo from './Logo'

export default function RequireAuth({ children }: { children: ReactNode }) {
  const [status, setStatus] = useState<
    'checking' | 'authorized' | 'unauthorized'
  >('checking')

  useEffect(() => {
    const authSessionId = getAuthSessionId()
    if (!authSessionId) {
      setStatus('unauthorized')
      return
    }

    const checkAuth = async () => {
      try {
        const data = await apiRequest<AuthMeResponse>(
          `/auth/me?sessionId=${authSessionId}`,
        )
        if (data.user) {
          setStatus('authorized')
        } else {
          clearAuthSessionId()
          clearSessionId()
          setStatus('unauthorized')
        }
      } catch {
        clearAuthSessionId()
        clearSessionId()
        setStatus('unauthorized')
      }
    }

    void checkAuth()
  }, [])

  if (status === 'checking') {
    return (
      <div className="screen auth-screen">
        <div className="auth-hero">
          <Logo />
          <p className="auth-tagline">SPRAWDZAM LOGOWANIE</p>
        </div>
        <div className="card auth-card">
          <div className="game-status">Ładuję profil...</div>
        </div>
      </div>
    )
  }

  if (status === 'unauthorized') {
    return <Navigate to="/login" replace />
  }

  return <>{children}</>
}
