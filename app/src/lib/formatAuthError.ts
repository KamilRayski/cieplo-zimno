type FirebaseLikeError = {
  code?: string
  message?: string
  customData?: unknown
}

export function getAuthErrorDetails(error: unknown) {
  const firebase =
    typeof error === 'object' && error !== null
      ? (error as FirebaseLikeError)
      : {}

  const code = firebase.code ?? '(brak kodu)'
  const message =
    firebase.message ??
    (error instanceof Error ? error.message : String(error))

  let hint = ''
  switch (firebase.code) {
    case 'auth/configuration-not-found':
      hint =
        'Włącz Authentication w Firebase Console (Get started) i provider Google (Enable).'
      break
    case 'auth/unauthorized-domain':
      hint = 'Dodaj localhost w Authentication → Settings → Authorized domains.'
      break
    case 'auth/popup-blocked':
      hint = 'Zezwól na wyskakujące okna dla tej strony.'
      break
    case 'auth/popup-closed-by-user':
      hint = 'Logowanie przerwane przez użytkownika.'
      break
    case 'auth/network-request-failed':
      hint = 'Sprawdź internet i serwer backend (port 4000).'
      break
    case 'auth/operation-not-allowed':
      hint =
        'Włącz Email/Password w Firebase → Authentication → Sign-in method.'
      break
    case 'auth/email-already-in-use':
      hint = 'Użyj logowania lub innego adresu e-mail.'
      break
    case 'auth/invalid-credential':
    case 'auth/wrong-password':
      hint = 'Nieprawidłowy e-mail lub hasło.'
      break
    case 'auth/weak-password':
      hint = 'Hasło musi mieć co najmniej 6 znaków.'
      break
    default:
      if (message.includes('Failed to fetch')) {
        hint = 'Backend nie odpowiada — uruchom: cd server && npm run dev'
      }
      break
  }

  return { code, message, hint }
}

/** Tekst na UI — zawsze z kodem i message z Firebase */
export function formatAuthError(error: unknown) {
  const { code, message, hint } = getAuthErrorDetails(error)

  console.error('[Auth error]', { code, message, error })

  const lines = [`Kod: ${code}`, `Wiadomość: ${message}`]
  if (hint) lines.push(`Podpowiedź: ${hint}`)

  return lines.join('\n')
}
