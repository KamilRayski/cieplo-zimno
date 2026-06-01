import { ThermoIcon } from './icons'

export default function Logo({ compact }: { compact?: boolean }) {
  return (
    <div className={`logo${compact ? ' logo--compact' : ''}`}>
      <span className="logo-word">CIEPŁO</span>
      <span className="logo-icon">
        <ThermoIcon />
      </span>
      <span className="logo-word">ZIMNO</span>
    </div>
  )
}
