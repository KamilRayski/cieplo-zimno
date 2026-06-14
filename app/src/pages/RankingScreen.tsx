import { useEffect, useState } from 'react'
import { apiRequest } from '../lib/api'
import { formatTemperature, getAvatarUrl } from '../lib/format'
import { withDelay } from '../lib/withDelay'
import type { LeaderboardEntry } from '../types'

export default function RankingScreen() {
  const [entries, setEntries] = useState<LeaderboardEntry[]>([])
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    const loadLeaderboard = async () => {
      try {
        const data = await apiRequest<LeaderboardEntry[]>('/leaderboard')
        // merge with any locally added friends (fabricated results)
        const raw = localStorage.getItem('localAddedFriends')
        const localAdded = raw ? JSON.parse(raw) : []
        const combined = [...data, ...localAdded]
        // sort by temperature desc and assign ranks
        const sorted = combined
          .slice()
          .sort((a, b) => {
            if (Math.abs(b.temperature - a.temperature) > 0.001) {
              return b.temperature - a.temperature
            }
            return (a.attempts ?? 0) - (b.attempts ?? 0)
          })
          .map((item, idx) => ({
            rank: idx + 1,
            name: item.name,
            temperature: item.temperature,
            attempts: item.attempts ?? 0,
            avgTemp: item.avgTemp ?? 0,
          }))
        setEntries(sorted)
      } catch (error) {
        console.error(error)
      } finally {
        setIsLoading(false)
      }
    }

    void loadLeaderboard()
  }, [])

  const podium = entries.slice(0, 3)
  const list = entries.slice(3)

  const today = new Date().toLocaleDateString('pl-PL', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  })

  return (
    <>
      <div>
        <h1 className="page-title accent">RANKING GRACZY</h1>
        <p className="page-subtitle">
          Najlepsi w dniu {today}. Sprawdź, kto dzisiaj najlepiej poradził sobie z hasłem dnia.
        </p>
      </div>

      <div className="stack">
        {isLoading ? (
          <div className="empty-state">Ładuję ranking...</div>
        ) : podium.length === 0 ? (
          <div className="empty-state">Brak danych rankingowych.</div>
        ) : (
          podium.map((item, index) => (
            <div
              key={item.rank}
              className="card ranking-hero reveal"
              style={withDelay(`${0.08 + index * 0.08}s`)}
            >
              <div
                className="ranking-avatar"
                style={{
                  backgroundImage: `url('${getAvatarUrl(item.name)}')`,
                  backgroundSize: 'cover',
                  backgroundPosition: 'center',
                }}
              >
                <span className="ranking-rank">{item.rank}</span>
              </div>
              <div>
                <div className="ranking-name">{item.name}</div>
                <div className="ranking-temp" style={{ fontSize: '18px', fontWeight: 'bold', color: 'var(--accent-rose)', marginTop: '4px' }}>
                  Liczba prób: {item.attempts}
                </div>
                <div style={{ fontSize: '11px', color: 'rgba(255, 255, 255, 0.5)', marginTop: '4px' }}>
                  Najlepsza: {formatTemperature(item.temperature)} • Średnia: {item.avgTemp}°C
                </div>
              </div>
            </div>
          ))
        )}
      </div>

      <div className="stack">
        {list.map((item, index) => (
          <div
            key={item.rank}
            className="card ranking-item reveal"
            style={withDelay(`${0.12 + index * 0.06}s`)}
          >
            <div className="ranking-number">{item.rank}</div>
            <div
              className="avatar"
              style={{
                backgroundImage: `url('${getAvatarUrl(item.name)}')`,
                backgroundSize: 'cover',
                backgroundPosition: 'center',
              }}
            />
            <div style={{ flex: 1 }}>
              <div className="list-title">{item.name}</div>
              <div className="list-sub" style={{ textTransform: 'none', letterSpacing: 'normal' }}>
                Średnia temp. prób: {item.avgTemp}°C
              </div>
            </div>
            <div style={{ textAlign: 'right' }}>
              <div className="list-temp temp-hot" style={{ fontSize: '14px', fontWeight: 'bold' }}>
                Liczba prób: {item.attempts}
              </div>
              <div className="list-sub" style={{ fontSize: '10px', marginTop: '2px', textTransform: 'none', letterSpacing: 'normal' }}>
                Najlepsza: {formatTemperature(item.temperature)}
              </div>
            </div>
          </div>
        ))}
      </div>
    </>
  )
}
