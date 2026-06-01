import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from 'react'
import type { ReactNode } from 'react'
import {
  getIdTokenResult,
  onAuthStateChanged,
  signOut as firebaseSignOut,
} from 'firebase/auth'
import type { User } from 'firebase/auth'
import { doc, getDoc, setDoc } from 'firebase/firestore'
import { auth, db } from '../lib/firebase'
import { apiRequest } from '../lib/api'
import { syncBackendFromFirebaseUser } from '../lib/authSync'
import {
  clearAuthSessionId,
  clearSessionId,
  getAuthSessionId,
} from '../lib/session'

type AuthContextValue = {
  user: User | null
  role: string | null
  groupId: string | null
  loading: boolean
  signOut: () => Promise<void>
}

const AuthContext = createContext<AuthContextValue | null>(null)

const FIRESTORE_TIMEOUT_MS = 8000

async function syncFirestoreProfile(u: User) {
  const userRef = doc(db, 'users', u.uid)
  const snap = await getDoc(userRef)

  if (!snap.exists()) {
    await setDoc(userRef, {
      email: u.email ?? '',
      name: u.displayName ?? '',
      groupId: null,
    })
    return null
  }

  const data = snap.data()
  return typeof data.groupId === 'string' ? data.groupId : null
}

function withTimeout<T>(promise: Promise<T>, ms: number): Promise<T> {
  return Promise.race([
    promise,
    new Promise<T>((_, reject) =>
      setTimeout(() => reject(new Error('Firestore timeout')), ms),
    ),
  ])
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [role, setRole] = useState<string | null>(null)
  const [groupId, setGroupId] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const unsub = onAuthStateChanged(auth, async (u) => {
      setUser(u)

      if (!u) {
        setRole(null)
        setGroupId(null)
        setLoading(false)
        return
      }

      try {
        if (!getAuthSessionId()) {
          await syncBackendFromFirebaseUser(u)
        }

        const token = await getIdTokenResult(u, true)
        setRole((token.claims.role as string | undefined) || 'student')
      } catch (error) {
        console.error('Sync konta z serwerem gry nie powiódł się:', error)
      } finally {
        setLoading(false)
      }

      void withTimeout(syncFirestoreProfile(u), FIRESTORE_TIMEOUT_MS)
        .then(setGroupId)
        .catch((error) => {
          console.warn('Firestore (profil) — pominięto:', error)
          setGroupId(null)
        })
    })

    return () => unsub()
  }, [])

  const signOut = useCallback(async () => {
    const sessionId = localStorage.getItem('authSessionId')
    if (sessionId) {
      try {
        await apiRequest<{ ok: boolean }>('/auth/logout', {
          method: 'POST',
          json: { sessionId },
        })
      } catch (error) {
        console.error(error)
      }
    }
    clearAuthSessionId()
    clearSessionId()
    await firebaseSignOut(auth)
  }, [])

  const value = useMemo(
    () => ({ user, role, groupId, loading, signOut }),
    [user, role, groupId, loading, signOut],
  )

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

export function useAuth() {
  const context = useContext(AuthContext)
  if (!context) {
    throw new Error('useAuth must be used within AuthProvider')
  }
  return context
}
