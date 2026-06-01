import { useEffect, useState } from 'react'
import type { FormEvent } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import Logo from '../components/Logo'
import { ArrowRightIcon, EyeIcon, LockIcon, MailIcon, UserIcon } from '../components/icons'
import { apiRequest } from '../lib/api'
import { setAuthSessionId } from '../lib/session'
import { withDelay } from '../lib/withDelay'
import type { AuthResponse } from '../types'

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
      const payload: Record<string, string> = {
        email: email.trim(),
        password,
      }
      if (isRegister) {
        payload.name = name.trim()
      }

      const data = await apiRequest<AuthResponse>(
        isRegister ? '/auth/register' : '/auth/login',
        {
          method: 'POST',
          json: payload,
        },
      )
      setAuthSessionId(data.sessionId)
      navigate('/game')
    } catch (submitError) {
      const message =
        submitError instanceof Error
          ? submitError.message
          : 'Nie udało się zalogować. Spróbuj ponownie.'
      setError(message)
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
            <div className="game-status game-status--error">{error}</div>
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
