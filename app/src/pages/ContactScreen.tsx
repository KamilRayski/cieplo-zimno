import { useState } from 'react'
import type { FormEvent } from 'react'
import { Link } from 'react-router-dom'
import Logo from '../components/Logo'
import { ArrowRightIcon, MessageIcon } from '../components/icons'
import { withDelay } from '../lib/withDelay'

export default function ContactScreen() {
  const [message, setMessage] = useState('')
  const [status, setStatus] = useState<'idle' | 'loading' | 'success'>('idle')
  const [error, setError] = useState<string | null>(null)

  const isLoading = status === 'loading'

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    if (isLoading) return

    if (!message.trim()) {
      setError('Wpisz treść wiadomości.')
      return
    }

    setStatus('loading')
    setError(null)

    try {
      // Symulacja wysyłania wiadomości
      await new Promise((resolve) => setTimeout(resolve, 800))
      setStatus('success')
      setMessage('')
    } catch {
      setError('Wystąpił błąd podczas wysyłania. Spróbuj ponownie.')
      setStatus('idle')
    }
  }

  return (
    <div className="screen auth-screen">
      <div className="auth-hero">
        <Logo />
        <p className="auth-tagline">KONTAKT</p>
      </div>

      <div className="card auth-card reveal" style={withDelay('0.1s')}>
        <h2 className="auth-title">NAPISZ DO NAS</h2>
        <div className="mini-gradient" aria-hidden="true" />
        <form className="auth-form" onSubmit={handleSubmit}>
          {error ? (
            <div className="game-status game-status--error">{error}</div>
          ) : null}
          {status === 'success' ? (
            <div className="game-status game-status--success">
              Wiadomość została wysłana. Dziękujemy!
            </div>
          ) : null}
          <div className="field">
            <span className="field-label">WIADOMOŚĆ</span>
            <label className="field-control" style={{ alignItems: 'flex-start' }}>
              <span className="field-icon" style={{ marginTop: '12px' }}>
                <MessageIcon />
              </span>
              <textarea
                placeholder="Wpisz treść wiadomości..."
                value={message}
                onChange={(event) => setMessage(event.target.value)}
                disabled={isLoading}
                style={{
                  flex: 1,
                  minHeight: '100px',
                  padding: '12px 0',
                  background: 'transparent',
                  border: 'none',
                  color: 'inherit',
                  resize: 'vertical',
                  outline: 'none',
                  fontFamily: 'inherit',
                  fontSize: 'inherit',
                }}
              />
            </label>
          </div>
          <button className="primary-btn" type="submit" disabled={isLoading}>
            {isLoading ? 'Wysyłanie...' : 'Wyślij wiadomość'}
            <ArrowRightIcon />
          </button>
        </form>
      </div>

      <p className="auth-switch">
        <Link className="link-accent" to="/info">
          Wróć do informacji
        </Link>
      </p>
    </div>
  )
}
