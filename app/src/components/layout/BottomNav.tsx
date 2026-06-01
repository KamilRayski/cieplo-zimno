import { NavLink } from 'react-router-dom'
import { ArchiveIcon, PlayIcon, RankingIcon } from '../icons'

export default function BottomNav() {
  const items = [
    { to: '/game', label: 'Graj', icon: <PlayIcon /> },
    { to: '/ranking', label: 'Ranking', icon: <RankingIcon /> },
    { to: '/archive', label: 'Archiwum', icon: <ArchiveIcon /> },
  ]

  return (
    <nav className="bottom-nav">
      {items.map((item) => (
        <NavLink
          key={item.to}
          to={item.to}
          className={({ isActive }) =>
            `nav-item${isActive ? ' nav-item--active' : ''}`
          }
        >
          <span className="nav-icon">{item.icon}</span>
          <span className="nav-label">{item.label}</span>
        </NavLink>
      ))}
    </nav>
  )
}
