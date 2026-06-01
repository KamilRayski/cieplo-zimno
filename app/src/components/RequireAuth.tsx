import { useEffect, useState } from 'react'
import type { ReactNode } from 'react'
import { Navigate } from 'react-router-dom'
import { useAuth } from '../auth/AuthContext'
import { apiRequest } from '../lib/api'
import { syncBackendFromFirebaseUser } from '../lib/authSync'
import { clearAuthSessionId, clearSessionId, getAuthSessionId } from '../lib/session'
import type { AuthMeResponse } from '../types'
import Logo from './Logo'

export default function RequireAuth({ children }: { children: ReactNode }) {
  const { user, loading: firebaseLoading } = useAuth()
  const [status, setStatus] = useState<
    'checking' | 'authorized' | 'unauthorized'
  >('checking')

  useEffect(() => {
    const authorize = async () => {
      const existingSession = getAuthSessionId()

      if (firebaseLoading && !existingSession && !user) {
        return
      }

      if (user) {
        let authSessionId = existingSession
        if (!authSessionId) {
          try {
            await syncBackendFromFirebaseUser(user)
            authSessionId = getAuthSessionId()
          } catch {
            setStatus('unauthorized')
            return
          }
        }
        setStatus(authSessionId ? 'authorized' : 'unauthorized')
        return
      }

      if (!existingSession) {
        setStatus('unauthorized')
        return
      }

      try {
        const data = await apiRequest<AuthMeResponse>(
          `/auth/me?sessionId=${existingSession}`,
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

    void authorize()
  }, [user, firebaseLoading])

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
