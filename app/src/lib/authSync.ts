import type { User } from 'firebase/auth'
import { apiRequest } from './api'
import { setAuthSessionId } from './session'
import type { AuthResponse } from '../types'

export async function syncBackendFromFirebaseUser(
  firebaseUser: Pick<User, 'email' | 'displayName'>,
) {
  if (!firebaseUser.email) {
    throw new Error('Konto Google nie ma przypisanego adresu e-mail.')
  }

  const data = await apiRequest<AuthResponse>('/auth/google', {
    method: 'POST',
    json: {
      email: firebaseUser.email,
      name:
        firebaseUser.displayName ||
        firebaseUser.email.split('@')[0] ||
        'Użytkownik',
    },
  })
  setAuthSessionId(data.sessionId)
  return data
}
