import { Link } from 'react-router-dom'
import Logo from '../components/Logo'

export default function NotFoundPage() {
  return (
    <div className="screen auth-screen">
      <div className="auth-hero">
        <Logo />
        <p className="auth-tagline">404 — NIE ZNALEZIONO</p>
      </div>
      <div className="card auth-card">
        <h2 className="auth-title">BRAK TRASY</h2>
        <p className="card-desc" style={{ textAlign: 'center', marginBottom: 16 }}>
          Ta strona nie istnieje w aplikacji Ciepło–Zimno.
        </p>
        <Link className="primary-btn" to="/login" style={{ justifyContent: 'center' }}>
          Wróć do logowania
        </Link>
      </div>
    </div>
  )
}
