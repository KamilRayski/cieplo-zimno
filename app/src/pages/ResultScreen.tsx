import { CloseIcon, CopyIcon, RefreshIcon, ShareIcon } from '../components/icons'

export default function ResultScreen() {
  return (
    <>
      <div className="result-header">
        <button className="icon-button" type="button" aria-label="Zamknij">
          <CloseIcon />
        </button>
        <div className="result-title">Wynik</div>
        <button className="icon-button" type="button" aria-label="Reset">
          <RefreshIcon />
        </button>
      </div>

      <div className="result-hero">
        <div className="result-label">Cel osiągnięty</div>
        <h1 className="page-title">OSIĄGNIĘTO 100°C</h1>
      </div>

      <div className="card result-card">
        <div className="result-chip">WRZĄTEK</div>
        <div className="stat-label">Hasło dnia</div>
        <div className="result-word">FENOMENALNY</div>
        <div className="mini-gradient" aria-hidden="true" />
      </div>

      <div className="stats-grid">
        <div className="card stat-mini">
          <div className="stat-label">Liczba prób</div>
          <div className="stat-large">12</div>
        </div>
        <div className="card stat-mini">
          <div className="stat-label">Średnia temp.</div>
          <div className="stat-large accent">42.5°C</div>
        </div>
      </div>

      <div className="share-block">
        <div className="section-title">Podziel się wynikiem</div>
        <div className="share-actions">
          <button className="icon-button" type="button" aria-label="Udostępnij">
            <ShareIcon />
          </button>
          <button className="icon-button" type="button" aria-label="Kopiuj">
            <CopyIcon />
          </button>
        </div>
      </div>
    </>
  )
}
