import { useEffect, useState } from 'react'
import type { CSSProperties } from 'react'
import { Link } from 'react-router-dom'
import { CalendarIcon, ChevronRightIcon } from '../components/icons'
import { apiRequest } from '../lib/api'
import { getAuthSessionId } from '../lib/session'
import { withDelay } from '../lib/withDelay'
import type { ArchiveEntry } from '../types'

export default function ArchiveScreen() {
  const [entries, setEntries] = useState<ArchiveEntry[]>([])
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    const loadArchive = async () => {
      try {
        const authSessionId = getAuthSessionId()
        if (!authSessionId) {
          setEntries([])
          return
        }
        const data = await apiRequest<ArchiveEntry[]>(
          `/archive?authSessionId=${authSessionId}`,
        )
        setEntries(data)
      } catch (error) {
        console.error(error)
      } finally {
        setIsLoading(false)
      }
    }

    void loadArchive()
  }, [])

  const totalPlayed = isLoading ? '--' : `${entries.length}`
  const averageScore =
    isLoading || entries.length === 0
      ? '--'
      : `${Math.round(
        entries.reduce((sum, entry) => sum + entry.progress, 0) /
          entries.length,
      )}%`

  return (
    <>
      <div>
        <h1 className="page-title">Archiwum</h1>
        <p className="page-subtitle">Twoja podróż przez słowa</p>
      </div>

      <div className="stats-grid">
        <div className="card stat-mini">
          <div className="stat-label">Rozegrano</div>
          <div className="stat-large">{totalPlayed}</div>
        </div>
        <div className="card stat-mini">
          <div className="stat-label">Średni wynik</div>
          <div className="stat-large accent">{averageScore}</div>
        </div>
      </div>

      <div className="section-title">Ostatnie rozgrywki</div>
      <div className="stack">
        {isLoading ? (
          <div className="empty-state">Ładuję archiwum...</div>
        ) : entries.length === 0 ? (
          <div className="empty-state">Brak zapisanych rozgrywek.</div>
        ) : (
          entries.map((item, index) => (
            <div
              key={`${item.date}-${item.word}`}
              className="card archive-card reveal"
              style={withDelay(`${0.1 + index * 0.08}s`)}
            >
              <div className="archive-header">
                <div>
                  <div className="archive-date">{item.date}</div>
                  <div className="archive-day">{item.day}</div>
                </div>
                <div className={`archive-label tone-${item.tone}`}>
                  {item.label}
                </div>
              </div>
              <div className="archive-hero">
                <div>
                  <div className="stat-label">Najlepsze trafienie</div>
                  <div className="archive-word">{item.word}</div>
                </div>
                <div className="archive-rank">
                  {item.rank}
                  <span>{item.percent}</span>
                </div>
              </div>
              <div
                className={`progress progress-${item.tone}`}
                style={{ '--progress': `${item.progress}%` } as CSSProperties}
              />
            </div>
          ))
        )}
      </div>

      <Link
        to="/calendar"
        style={{
          display: 'flex',
          flexDirection: 'row',
          justifyContent: 'space-between',
          alignItems: 'center',
          padding: '16px',
          background: '#353534',
          borderRadius: '12px',
          textDecoration: 'none',
          marginTop: '16px',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
          <span style={{ color: '#FFB4AA', display: 'flex', width: '20px', height: '20px' }}>
            <CalendarIcon />
          </span>
          <span
            style={{
              color: '#E5E2E1',
              fontWeight: 700,
              fontSize: '16px',
              lineHeight: '24px',
              letterSpacing: '-0.4px',
            }}
          >
            Zobacz pełny kalendarz
          </span>
        </div>
        <span style={{ color: '#C0C6D6', display: 'flex', width: '20px', height: '20px' }}>
          <ChevronRightIcon />
        </span>
      </Link>
    </>
  )
}
