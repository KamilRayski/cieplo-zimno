import { useEffect, useState } from 'react'
import CalendarCard from '../components/CalendarCard'
import { ChevronLeftIcon, ChevronRightIcon, FlameIcon } from '../components/icons'
import { apiRequest } from '../lib/api'
import { monthNames } from '../lib/constants'
import { toIsoLocal } from '../lib/date'
import { formatTemperature } from '../lib/format'
import { getAuthSessionId } from '../lib/session'
import { withDelay } from '../lib/withDelay'
import type { ArchiveEntry } from '../types'

export default function CalendarScreen() {
  const [archiveEntries, setArchiveEntries] = useState<ArchiveEntry[]>([])
  const [isLoading, setIsLoading] = useState(true)

  const [currentDate, setCurrentDate] = useState(new Date())
  const [selectedDate, setSelectedDate] = useState(new Date())

  useEffect(() => {
    const loadArchive = async () => {
      try {
        const authSessionId = getAuthSessionId()
        if (!authSessionId) return
        const data = await apiRequest<ArchiveEntry[]>(
          `/archive?authSessionId=${authSessionId}`,
        )
        setArchiveEntries(data)
      } catch (error) {
        console.error(error)
      } finally {
        setIsLoading(false)
      }
    }
    void loadArchive()
  }, [])

  const handlePrevMonth = () =>
    setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() - 1, 1))
  const handleNextMonth = () =>
    setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 1))

  const selectedIso = toIsoLocal(selectedDate)
  const todayIso = toIsoLocal(new Date())
  const archiveEntry = archiveEntries.find((entry) => entry.rawDate === selectedIso)

  let bestTemp = '--'
  let bestMeta = selectedIso > todayIso ? 'Ten dzień jeszcze nie nadszedł.' : 'Brak prób w tym dniu.'

  if (archiveEntry) {
    bestTemp = formatTemperature(archiveEntry.temperature)
    bestMeta = `Słowo: ${archiveEntry.word}`
  }

  return (
    <>
      <div className="page-head">
        <div>
          <h1 className="page-title">
            {monthNames[currentDate.getMonth()]} {currentDate.getFullYear()}
          </h1>
          <p className="page-subtitle">Mapa temperatur dla każdego dnia.</p>
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
        currentDate={currentDate}
        selectedDate={selectedDate}
        onSelectDate={setSelectedDate}
        entries={archiveEntries}
      />

      <section className="stack" style={{ marginTop: '24px' }}>
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
      </section>
      {isLoading ? <div className="empty-state">Ładuję archiwum...</div> : null}
    </>
  )
}
