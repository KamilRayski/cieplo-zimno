import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import CalendarCard from '../components/CalendarCard'
import { ChevronLeftIcon, ChevronRightIcon, FlameIcon } from '../components/icons'
import { apiRequest } from '../lib/api'
import { monthNames } from '../lib/constants'
import { toIsoLocal } from '../lib/date'
import { formatTemperature, getAvatarUrl } from '../lib/format'
import { getAuthSessionId, getSessionId } from '../lib/session'
import { withDelay } from '../lib/withDelay'
import type { ArchiveEntry, HomeData } from '../types'

export default function HomeScreen() {
  const navigate = useNavigate()
  const [homeData, setHomeData] = useState<HomeData | null>(null)
  const [archiveEntries, setArchiveEntries] = useState<ArchiveEntry[]>([])
  const [isLoading, setIsLoading] = useState(true)

  const [currentDate, setCurrentDate] = useState(new Date())
  const [selectedDate, setSelectedDate] = useState(new Date())

  useEffect(() => {
    const loadHome = async () => {
      try {
        const sessionId = getSessionId()
        const authSessionId = getAuthSessionId()
        const query = sessionId ? `?sessionId=${sessionId}` : ''
        const data = await apiRequest<HomeData>(`/home${query}`)
        setHomeData(data)

        if (authSessionId) {
          const archive = await apiRequest<ArchiveEntry[]>(
            `/archive?authSessionId=${authSessionId}`,
          )
          setArchiveEntries(archive)
        }
      } catch (error) {
        console.error(error)
      } finally {
        setIsLoading(false)
      }
    }

    void loadHome()
  }, [])

  const handlePrevMonth = () =>
    setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() - 1, 1))
  const handleNextMonth = () =>
    setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 1))

  const selectedIso = toIsoLocal(selectedDate)
  const todayIso = toIsoLocal(new Date())
  const archiveEntry = archiveEntries.find((entry) => entry.rawDate === selectedIso)

  const friends = homeData?.friends ?? []

  let bestTemp = '--'
  let bestMeta = selectedIso > todayIso ? 'Ten dzień jeszcze nie nadszedł.' : 'Brak prób w tym dniu.'

  if (archiveEntry) {
    bestTemp = formatTemperature(archiveEntry.temperature)
    bestMeta = `Słowo: ${archiveEntry.word} • Liczba prób: ${archiveEntry.attempts}`
  } else if (selectedIso === todayIso && homeData?.bestShot) {
    bestTemp = formatTemperature(homeData.bestShot.temperature)
    bestMeta = `Najlepsze słowo: ${homeData.bestShot.word} • Liczba prób: ${homeData.bestShot.attempts}`
  }

  return (
    <>
      <div className="page-head">
        <div>
          <h1 className="page-title">
            {monthNames[currentDate.getMonth()]} {currentDate.getFullYear()}
          </h1>
          <p className="page-subtitle">Twoja kalendarzowa mapa gry.</p>
        </div>
        <div className="pager">
          <button
            className="icon-button"
            type="button"
            aria-label="Poprzedni"
            onClick={handlePrevMonth}
          >
            <ChevronLeftIcon />
          </button>
          <button
            className="icon-button"
            type="button"
            aria-label="Następny"
            onClick={handleNextMonth}
          >
            <ChevronRightIcon />
          </button>
        </div>
      </div>

      <CalendarCard
        compact
        currentDate={currentDate}
        selectedDate={selectedDate}
        onSelectDate={setSelectedDate}
        entries={archiveEntries}
      />

      <section className="stack">
        <div className="section-title">Twoja Próba • {selectedIso}</div>
        <div className="card stat-card reveal" style={withDelay('0.1s')}>
          <div>
            <div className="stat-label">Twój najlepszy strzał</div>
            <div className="stat-large">{bestTemp}</div>
            <div className="stat-meta">{bestMeta}</div>
          </div>
          <div className="stat-icon">
            <FlameIcon />
          </div>
        </div>

        {selectedIso <= todayIso && (
          <button
            className="primary-btn reveal"
            style={withDelay('0.15s')}
            onClick={() => {
              if (selectedIso === todayIso) {
                navigate('/game')
              } else {
                navigate(`/game/${selectedIso}`)
              }
            }}
          >
            {selectedIso === todayIso ? 'Graj Dzisiaj' : 'Zagraj w ten dzień'}
          </button>
        )}
      </section>

      <section className="stack">
        <div className="section-title">Wyniki Znajomych</div>
        {isLoading ? (
          <div className="empty-state">Ładuję wyniki znajomych...</div>
        ) : friends.length === 0 ? (
          <div className="empty-state">Brak wyników znajomych.</div>
        ) : (
          friends.map((friend, index) => (
            <div
              key={friend.name}
              className="card list-card reveal"
              style={withDelay(`${0.12 + index * 0.06}s`)}
            >
              <div className="list-left">
                <div
                  className="avatar"
                  aria-hidden="true"
                  style={{
                    backgroundImage: `url('${getAvatarUrl(friend.name)}')`,
                    backgroundSize: 'cover',
                    backgroundPosition: 'center',
                  }}
                />
                <div>
                  <div className="list-title">{friend.name}</div>
                  <div className="list-sub">{friend.status}</div>
                </div>
              </div>
              <div className={`list-temp temp-${friend.tone}`}>
                <div>{formatTemperature(friend.temperature)}</div>
                <div className="list-sub">{friend.label}</div>
              </div>
            </div>
          ))
        )}
      </section>
    </>
  )
}
