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
        setEntries(data)
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

  return (
    <>
      <div>
        <h1 className="page-title accent">RANKING GRACZY</h1>
        <p className="page-subtitle">
          Najlepsi z najlepszych. Sprawdź, kto ma największe wyczucie
          temperatury.
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
                <div className="ranking-temp">
                  {formatTemperature(item.temperature)}
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
              <div className="list-sub">
                ŚREDNIA PRÓB: {item.avgAttempts}
              </div>
            </div>
            <div className="list-temp temp-hot">
              {formatTemperature(item.temperature)}
            </div>
          </div>
        ))}
      </div>
    </>
  )
}
