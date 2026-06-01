import { useEffect, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useAuth } from '../auth/AuthContext'
import Toggle from '../components/Toggle'
import { BellIcon, GamepadIcon, UserIcon } from '../components/icons'
import { apiRequest } from '../lib/api'
import { getAvatarUrl } from '../lib/format'
import { getAuthSessionId } from '../lib/session'
import type { AuthMeResponse, AuthUser } from '../types'

export default function SettingsScreen() {
  const { signOut } = useAuth()
  const [user, setUser] = useState<AuthUser | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const navigate = useNavigate()

  useEffect(() => {
    const loadUser = async () => {
      const sessionId = getAuthSessionId()
      if (!sessionId) {
        setIsLoading(false)
        return
      }

      try {
        const data = await apiRequest<AuthMeResponse>(
          `/auth/me?sessionId=${sessionId}`,
        )
        setUser(data.user)
      } catch (error) {
        console.error(error)
      } finally {
        setIsLoading(false)
      }
    }

    void loadUser()
  }, [])

  const handleLogout = async () => {
    try {
      await signOut()
    } catch (error) {
      console.error(error)
    } finally {
      setUser(null)
      navigate('/login', { replace: true })
    }
  }

  return (
    <>
      <div>
        <h1 className="page-title">Ustawienia</h1>
        <p className="page-subtitle">Dostosuj swoje wrażenia z gry.</p>
      </div>

      <div className="card settings-card">
        <div className="settings-header">
          {user ? (
            <div
              className="info-icon tone-warm"
              style={{
                backgroundImage: `url('${getAvatarUrl(user.name)}')`,
                backgroundSize: 'cover',
                backgroundPosition: 'center',
              }}
            />
          ) : (
            <span className="info-icon tone-warm">
              <UserIcon />
            </span>
          )}
          <div>
            <div className="card-title">Konto</div>
            {isLoading ? (
              <div className="card-desc">Ładuję konto...</div>
            ) : user ? (
              <>
                <div className="card-desc">{user.email}</div>
                <div className="card-desc">Zalogowano</div>
              </>
            ) : (
              <>
                <div className="card-desc">Brak aktywnego konta</div>
                <div className="card-desc">
                  Zaloguj się, aby zapisać postępy.
                </div>
              </>
            )}
          </div>
        </div>
        <div className="settings-actions">
          {user ? (
            <>
              <Link className="ghost-btn" to="/change-password">
                Zmień hasło
              </Link>
              <button className="ghost-btn" type="button" onClick={handleLogout}>
                Wyloguj
              </button>
            </>
          ) : (
            <Link className="secondary-btn" to="/login">
              Zaloguj się
            </Link>
          )}
        </div>
      </div>

      <div className="card settings-card">
        <div className="settings-header">
          <span className="info-icon tone-hot">
            <GamepadIcon />
          </span>
          <div className="card-title">Gra</div>
        </div>
        <div className="settings-list">
          <div className="settings-item">
            <div>
              <div className="list-title">Efekty Dźwiękowe</div>
              <div className="list-sub">KLAWIATURA I WYNIKI</div>
            </div>
            <Toggle defaultChecked />
          </div>
          <div className="settings-item">
            <div>
              <div className="list-title">Wibracje (Haptics)</div>
              <div className="list-sub">DLA TEMPERATURY</div>
            </div>
            <Toggle defaultChecked />
          </div>
        </div>
      </div>

      <div className="card settings-card">
        <div className="settings-header">
          <span className="info-icon tone-cold">
            <BellIcon />
          </span>
          <div className="card-title">Powiadomienia</div>
        </div>
        <div className="settings-list">
          <div className="settings-item">
            <div>
              <div className="list-title">Codzienne Słowo</div>
              <div className="list-sub">PRZYPOMNIENIE</div>
            </div>
            <Toggle />
          </div>
          <div className="settings-item">
            <div>
              <div className="list-title">Zmiany w Rankingu</div>
              <div className="list-sub">ZAWODY</div>
            </div>
            <Toggle defaultChecked />
          </div>
        </div>
      </div>
    </>
  )
}
