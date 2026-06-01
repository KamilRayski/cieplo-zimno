import { useState } from 'react'
import type { FormEvent } from 'react'
import { Link } from 'react-router-dom'
import Logo from '../components/Logo'
import { ArrowRightIcon, EyeIcon, LockIcon } from '../components/icons'
import { apiRequest } from '../lib/api'
import { getAuthSessionId } from '../lib/session'
import { withDelay } from '../lib/withDelay'

export default function ChangePasswordScreen() {
  const [currentPassword, setCurrentPassword] = useState('')
  const [newPassword, setNewPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [showCurrentPassword, setShowCurrentPassword] = useState(false)
  const [showNewPassword, setShowNewPassword] = useState(false)
  const [showConfirmPassword, setShowConfirmPassword] = useState(false)
  const [status, setStatus] = useState<'idle' | 'loading' | 'success'>('idle')
  const [error, setError] = useState<string | null>(null)

  const isLoading = status === 'loading'

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    if (isLoading) return

    if (!currentPassword) {
      setError('Podaj obecne hasło.')
      return
    }

    if (!newPassword) {
      setError('Podaj nowe hasło.')
      return
    }

    if (newPassword !== confirmPassword) {
      setError('Hasła nie są takie same.')
      return
    }

    const sessionId = getAuthSessionId()
    if (!sessionId) {
      setError('Brak aktywnej sesji. Zaloguj się ponownie.')
      return
    }

    setStatus('loading')
    setError(null)

    try {
      await apiRequest<{ ok: boolean }>('/auth/change-password', {
        method: 'POST',
        json: {
          authSessionId: sessionId,
          currentPassword,
          newPassword,
        },
      })
      setStatus('success')
      setCurrentPassword('')
      setNewPassword('')
      setConfirmPassword('')
      setShowCurrentPassword(false)
      setShowNewPassword(false)
      setShowConfirmPassword(false)
    } catch (submitError) {
      const message =
        submitError instanceof Error
          ? submitError.message
          : 'Nie udało się zmienić hasła. Spróbuj ponownie.'
      setError(message)
      setStatus('idle')
    }
  }

  return (
    <div className="screen auth-screen">
      <div className="auth-hero">
        <Logo />
        <p className="auth-tagline">ZMIANA HASŁA</p>
      </div>

      <div className="card auth-card reveal" style={withDelay('0.1s')}>
        <h2 className="auth-title">ZMIANA HASŁA</h2>
        <div className="mini-gradient" aria-hidden="true" />
        <form className="auth-form" onSubmit={handleSubmit}>
          {error ? (
            <div className="game-status game-status--error">{error}</div>
          ) : null}
          {status === 'success' ? (
            <div className="game-status game-status--success">
              Hasło zostało zmienione.
            </div>
          ) : null}
          <div className="field">
            <span className="field-label">OBECNE HASŁO</span>
            <label className="field-control">
              <span className="field-icon">
                <LockIcon />
              </span>
              <input
                type={showCurrentPassword ? 'text' : 'password'}
                placeholder="••••••••"
                value={currentPassword}
                onChange={(event) => setCurrentPassword(event.target.value)}
                disabled={isLoading}
              />
              <button
                className={`field-trailing${showCurrentPassword ? ' is-active' : ''}`}
                type="button"
                onClick={() => setShowCurrentPassword((prev) => !prev)}
                aria-label={
                  showCurrentPassword ? 'Ukryj hasło' : 'Pokaż hasło'
                }
                aria-pressed={showCurrentPassword}
                disabled={isLoading}
              >
                <EyeIcon />
              </button>
            </label>
          </div>
          <div className="field">
            <span className="field-label">NOWE HASŁO</span>
            <label className="field-control">
              <span className="field-icon">
                <LockIcon />
              </span>
              <input
                type={showNewPassword ? 'text' : 'password'}
                placeholder="••••••••"
                value={newPassword}
                onChange={(event) => setNewPassword(event.target.value)}
                disabled={isLoading}
              />
              <button
                className={`field-trailing${showNewPassword ? ' is-active' : ''}`}
                type="button"
                onClick={() => setShowNewPassword((prev) => !prev)}
                aria-label={showNewPassword ? 'Ukryj hasło' : 'Pokaż hasło'}
                aria-pressed={showNewPassword}
                disabled={isLoading}
              >
                <EyeIcon />
              </button>
            </label>
          </div>
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
          <button className="primary-btn" type="submit" disabled={isLoading}>
            {isLoading ? 'Przetwarzanie...' : 'Zmień hasło'}
            <ArrowRightIcon />
          </button>
        </form>
      </div>

      <p className="auth-switch">
        <Link className="link-accent" to="/settings">
          Wróć do ustawień
        </Link>
      </p>
    </div>
  )
}
