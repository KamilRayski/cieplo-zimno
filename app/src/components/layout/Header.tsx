import { Link } from 'react-router-dom'
import Logo from '../Logo'
import { InfoIcon, SettingsIcon, UserPlusIcon } from '../icons'

export default function Header() {
  return (
    <header className="topbar">
      <Logo compact />
      <div className="topbar-actions">
        <Link className="icon-button" to="/info" aria-label="Informacje">
          <InfoIcon />
        </Link>
        <Link className="icon-button" to="/friends" aria-label="Dodaj znajomych">
          <UserPlusIcon />
        </Link>
        <Link className="icon-button" to="/settings" aria-label="Ustawienia">
          <SettingsIcon />
        </Link>
      </div>
    </header>
  )
}
