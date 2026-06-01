import { useMemo } from 'react'
import { getDaysInMonth, getFirstDayOfMonth, toIsoLocal } from '../lib/date'
import { weekDays } from '../lib/constants'
import type { ArchiveEntry } from '../types'

type CalendarCardProps = {
  compact?: boolean
  currentDate: Date
  selectedDate: Date
  onSelectDate: (date: Date) => void
  entries: ArchiveEntry[]
}

export default function CalendarCard({
  compact,
  currentDate,
  selectedDate,
  onSelectDate,
  entries,
}: CalendarCardProps) {
  const year = currentDate.getFullYear()
  const month = currentDate.getMonth()

  const daysInMonth = getDaysInMonth(year, month)
  const firstDay = getFirstDayOfMonth(year, month)
  const daysInPrevMonth = getDaysInMonth(year, month - 1)

  const days = []

  for (let i = 0; i < firstDay; i++) {
    days.push({
      day: daysInPrevMonth - firstDay + i + 1,
      muted: true,
      date: new Date(year, month - 1, daysInPrevMonth - firstDay + i + 1),
    })
  }

  for (let i = 1; i <= daysInMonth; i++) {
    days.push({ day: i, muted: false, date: new Date(year, month, i) })
  }

  const remaining = days.length % 7
  if (remaining !== 0) {
    for (let i = 1; i <= 7 - remaining; i++) {
      days.push({ day: i, muted: true, date: new Date(year, month + 1, i) })
    }
  }

  const entriesByDate = useMemo(() => {
    const map = new Map<string, ArchiveEntry>()
    entries.forEach((entry) => map.set(entry.rawDate, entry))
    return map
  }, [entries])

  return (
    <div className={`card calendar-card${compact ? ' calendar-card--compact' : ''}`}>
      <div className="calendar-week">
        {weekDays.map((day) => (
          <span key={day}>{day}</span>
        ))}
      </div>
      <div className="calendar-grid">
        {days.map((entry, index) => {
          const iso = toIsoLocal(entry.date)
          const archive = entriesByDate.get(iso)
          const isSelected = iso === toIsoLocal(selectedDate)

          return (
            <div
              key={`${entry.day}-${index}`}
              className={`day${entry.muted ? ' day--muted' : ''}${isSelected ? ' day--active' : ''}`}
              onClick={() => onSelectDate(entry.date)}
              style={{ cursor: 'pointer' }}
            >
              {entry.day}
              {archive ? <span className={`day-dot dot-${archive.tone}`} /> : null}
            </div>
          )
        })}
      </div>
    </div>
  )
}
