import { useEffect, useState } from 'react'
import type { FormEvent } from 'react'
import {
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signInWithPopup,
  updateProfile,
} from 'firebase/auth'
import { Link, useNavigate } from 'react-router-dom'
import Logo from '../components/Logo'
import { ArrowRightIcon, EyeIcon, LockIcon, MailIcon, UserIcon } from '../components/icons'
import { syncBackendFromFirebaseUser } from '../lib/authSync'
import { formatAuthError } from '../lib/formatAuthError'
import { auth, googleProvider } from '../lib/firebase'
import { withDelay } from '../lib/withDelay'

export default function AuthScreen({ mode }: { mode: 'login' | 'register' }) {
  const isRegister = mode === 'register'
  const navigate = useNavigate()
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [showConfirmPassword, setShowConfirmPassword] = useState(false)
  const [status, setStatus] = useState<'idle' | 'loading'>('idle')
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    setError(null)
    setShowPassword(false)
    setShowConfirmPassword(false)
  }, [mode])

  const isLoading = status === 'loading'

  const finishLogin = async (firebaseUser: {
    email: string | null
    displayName: string | null
  }) => {
    await syncBackendFromFirebaseUser(firebaseUser)
    navigate('/game')
  }

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    if (isLoading) return

    if (isRegister && !name.trim()) {
      setError('Podaj imię i nazwisko.')
      return
    }

    if (!email.trim()) {
      setError('Podaj adres e-mail.')
      return
    }

    if (!password) {
      setError('Podaj hasło.')
      return
    }

    if (isRegister && password !== confirmPassword) {
      setError('Hasła nie są takie same.')
      return
    }

    setStatus('loading')
    setError(null)
    try {
      const trimmedEmail = email.trim()

      if (isRegister) {
        const credential = await createUserWithEmailAndPassword(
          auth,
          trimmedEmail,
          password,
        )
        const displayName = name.trim()
        await updateProfile(credential.user, { displayName })
        await finishLogin({
          email: credential.user.email,
          displayName,
        })
      } else {
        const credential = await signInWithEmailAndPassword(
          auth,
          trimmedEmail,
          password,
        )
        await finishLogin(credential.user)
      }
    } catch (submitError) {
      setError(formatAuthError(submitError))
    } finally {
      setStatus('idle')
    }
  }

  const handleGoogle = async () => {
    if (isLoading) return
    setError(null)
    setStatus('loading')
    try {
      const result = await signInWithPopup(auth, googleProvider)
      await finishLogin(result.user)
    } catch (googleError) {
      setError(formatAuthError(googleError))
    } finally {
      setStatus('idle')
    }
  }

  return (
    <div className="screen auth-screen">
      <div className="auth-hero">
        <Logo />
        <p className="auth-tagline">ODNAJDŹ UKRYTE ZNACZENIE</p>
      </div>

      <div className="card auth-card reveal" style={withDelay('0.1s')}>
        <h2 className="auth-title">
          {isRegister ? 'UTWÓRZ KONTO' : 'LOGOWANIE'}
        </h2>
        <div className="mini-gradient" aria-hidden="true" />
        <form className="auth-form" onSubmit={handleSubmit}>
          {error ? (
            <div className="game-status game-status--error auth-error-detail">
              {error}
            </div>
          ) : null}
          {isRegister ? (
            <div className="field">
              <span className="field-label">IMIĘ I NAZWISKO</span>
              <label className="field-control">
                <span className="field-icon">
                  <UserIcon />
                </span>
                <input
                  placeholder="Jan Kowalski"
                  value={name}
                  onChange={(event) => setName(event.target.value)}
                  disabled={isLoading}
                />
              </label>
            </div>
          ) : null}
          <div className="field">
            <span className="field-label">EMAIL</span>
            <label className="field-control">
              <span className="field-icon">
                <MailIcon />
              </span>
              <input
                type="email"
                autoComplete="email"
                placeholder="jan@example.com"
                value={email}
                onChange={(event) => setEmail(event.target.value)}
                disabled={isLoading}
              />
            </label>
          </div>
          <div className="field">
            <span className="field-label">HASŁO</span>
            <label className="field-control">
              <span className="field-icon">
                <LockIcon />
              </span>
              <input
                type={showPassword ? 'text' : 'password'}
                autoComplete={isRegister ? 'new-password' : 'current-password'}
                placeholder="••••••••"
                value={password}
                onChange={(event) => setPassword(event.target.value)}
                disabled={isLoading}
              />
              <button
                className={`field-trailing${showPassword ? ' is-active' : ''}`}
                type="button"
                onClick={() => setShowPassword((prev) => !prev)}
                aria-label={showPassword ? 'Ukryj hasło' : 'Pokaż hasło'}
                aria-pressed={showPassword}
                disabled={isLoading}
              >
                <EyeIcon />
              </button>
            </label>
          </div>
          {isRegister ? (
            <div className="field">
              <span className="field-label">POWTÓRZ HASŁO</span>
              <label className="field-control">
                <span className="field-icon">
                  <LockIcon />
                </span>
                <input
                  type={showConfirmPassword ? 'text' : 'password'}
                  autoComplete="new-password"
                  placeholder="••••••••"
                  value={confirmPassword}
                  onChange={(event) => setConfirmPassword(event.target.value)}
                  disabled={isLoading}
                />
                <button
                  className={`field-trailing${showConfirmPassword ? ' is-active' : ''}`}
                  type="button"
                  onClick={() => setShowConfirmPassword((prev) => !prev)}
                  aria-label={
                    showConfirmPassword ? 'Ukryj hasło' : 'Pokaż hasło'
                  }
                  aria-pressed={showConfirmPassword}
                  disabled={isLoading}
                >
                  <EyeIcon />
                </button>
              </label>
            </div>
          ) : null}
          <button className="primary-btn" type="submit" disabled={isLoading}>
            {isLoading
              ? 'Przetwarzanie...'
              : isRegister
                ? 'Zarejestruj się'
                : 'Zaloguj się'}
            <ArrowRightIcon />
          </button>
          <p className="auth-divider">lub</p>
          <button
            className="btn-google"
            type="button"
            disabled={isLoading}
            onClick={() => void handleGoogle()}
            aria-label="Zaloguj się przez Google"
          >
            <GoogleIcon /> Google
          </button>
        </form>
      </div>

      <p className="auth-switch">
        {isRegister ? 'Masz już konto? ' : 'Nie masz konta? '}
        <Link className="link-accent" to={isRegister ? '/login' : '/register'}>
          {isRegister ? 'ZALOGUJ SIĘ' : 'ZAREJESTRUJ SIĘ'}
        </Link>
      </p>
    </div>
  )
}

function GoogleIcon() {
  return (
    <svg viewBox="0 0 24 24" width="18" height="18" aria-hidden="true">
      <path
        fill="currentColor"
        d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 0 1-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z"
      />
      <path
        fill="currentColor"
        d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
      />
      <path
        fill="currentColor"
        d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
      />
      <path
        fill="currentColor"
        d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
      />
    </svg>
  )
}
