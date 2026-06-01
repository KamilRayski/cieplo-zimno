import { useEffect, useState } from 'react'
import { apiRequest } from '../lib/api'
import { getAvatarUrl } from '../lib/format'
import { getAuthSessionId } from '../lib/session'
import { withDelay } from '../lib/withDelay'
import type { FriendsData } from '../types'
import { CheckIcon, CopyIcon, SearchIcon, ThermoIcon } from '../components/icons'

export default function FriendsScreen() {
  const [friendsData, setFriendsData] = useState<FriendsData | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [currentLink, setCurrentLink] = useState('cieplo-zimno.io/invite/...')
  const [copied, setCopied] = useState(false)

  const generateUniqueLink = (base: string) => {
    return `${base}-${Math.random().toString(36).slice(2, 8)}`
  }

  useEffect(() => {
    const loadFriends = async () => {
      try {
        const authSessionId = getAuthSessionId()
        if (!authSessionId) return
        const data = await apiRequest<FriendsData>(
          `/friends?authSessionId=${authSessionId}`,
        )
        setFriendsData(data)
        if (data.inviteLink) {
          setCurrentLink(generateUniqueLink(data.inviteLink))
        }
      } catch (error) {
        console.error(error)
      } finally {
        setIsLoading(false)
      }
    }

    void loadFriends()
  }, [])

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(currentLink)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)

      const base = friendsData?.inviteLink ?? 'cieplo-zimno.io/invite/...'
      setCurrentLink(generateUniqueLink(base))
    } catch (err) {
      console.error('Failed to copy', err)
    }
  }

  const suggestions = friendsData?.suggestions ?? []
  const inviteNote =
    friendsData?.inviteNote ??
    'Zaproś znajomych do gry i odbierz bonusowe podpowiedzi za każdego nowego gracza, który dołączy z Twojego polecenia.'

  return (
    <>
      <div className="page-head">
        <div>
          <h1 className="page-title">Dodaj Znajomych</h1>
          <p className="page-subtitle">Zaproś lub znajdź nowych graczy.</p>
        </div>
        <button className="icon-button" type="button" aria-label="Termometr">
          <ThermoIcon />
        </button>
      </div>

      <div
        style={{
          position: 'relative',
          display: 'flex',
          alignItems: 'center',
          width: '100%',
          borderBottom: '2px solid #353534',
          boxSizing: 'border-box',
          marginBottom: '32px',
        }}
      >
        <div
          style={{
            position: 'absolute',
            left: '12px',
            display: 'flex',
            alignItems: 'center',
            color: '#414754',
          }}
        >
          <SearchIcon />
        </div>
        <input
          placeholder="Szukaj po nazwie użytkownika lub emailu"
          style={{
            width: '100%',
            padding: '19px 12px 20px 48px',
            background: 'transparent',
            border: 'none',
            outline: 'none',
            color: '#E5E2E1',
            fontFamily: 'Inter',
            fontWeight: 400,
            fontSize: '18px',
            lineHeight: '22px',
          }}
        />
      </div>

      <div className="section-title">Sugerowani</div>
      <div className="stack">
        {isLoading ? (
          <div className="empty-state">Ładuję sugestie...</div>
        ) : suggestions.length === 0 ? (
          <div className="empty-state">Brak sugestii znajomych.</div>
        ) : (
          suggestions.map((item, index) => (
            <div
              key={item.name}
              className="card friend-card reveal"
              style={withDelay(`${0.1 + index * 0.08}s`)}
            >
              <div className="friend-left">
                <div
                  className="avatar"
                  style={{
                    backgroundImage: `url('${getAvatarUrl(item.name)}')`,
                    backgroundSize: 'cover',
                    backgroundPosition: 'center',
                  }}
                />
                <div>
                  <div className="list-title">{item.name}</div>
                  <div className="list-sub">{item.info}</div>
                </div>
              </div>
              <button className="primary-btn" type="button">
                Dodaj
              </button>
            </div>
          ))
        )}
      </div>

      <div className="card invite-card">
        <div className="card-title">Twój link zaproszenia</div>
        <div className="invite-link">
          {currentLink}
          <button
            className="icon-button"
            type="button"
            aria-label="Skopiuj"
            onClick={handleCopy}
            title={copied ? 'Skopiowano!' : 'Skopiuj link'}
          >
            {copied ? <CheckIcon /> : <CopyIcon />}
          </button>
        </div>
        <p className="card-desc">{inviteNote}</p>
      </div>
    </>
  )
}
