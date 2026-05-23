import './App.css'
import { useEffect, useMemo, useState } from 'react'
import type { CSSProperties, FormEvent, ReactNode } from 'react'
import {
  Link,
  Navigate,
  NavLink,
  Route,
  Routes,
  useNavigate,
} from 'react-router-dom'

type DelayStyle = CSSProperties & { '--delay'?: string }

const withDelay = (delay: string): DelayStyle => ({ '--delay': delay })

const weekDays = ['PN', 'WT', 'ŚR', 'CZ', 'PT', 'SB', 'ND']

const calendarDays = [
  { day: 30, muted: true },
  { day: 1, dot: 'hot' },
  { day: 2, dot: 'cold' },
  { day: 3, dot: 'warm' },
  { day: 4, dot: 'hot' },
  { day: 5, dot: 'hot' },
  { day: 6, dot: 'cold' },
  { day: 7, dot: 'warm' },
  { day: 8, dot: 'hot' },
  { day: 9, dot: 'hot' },
  { day: 10, dot: 'cold' },
  { day: 11, dot: 'hot' },
  { day: 12, dot: 'hot' },
  { day: 13, dot: 'warm' },
  { day: 14, active: true, dot: 'hot' },
  { day: 15 },
  { day: 16 },
  { day: 17 },
  { day: 18 },
  { day: 19 },
  { day: 20 },
  { day: 21, muted: true },
  { day: 22, muted: true },
  { day: 23, muted: true },
  { day: 24, muted: true },
  { day: 25, muted: true },
  { day: 26, muted: true },
  { day: 27, muted: true },
]

type Guess = {
  word: string
  temperature: number
  result: Array<'correct' | 'present' | 'absent'>
  createdAt: string
}

type HomeFriend = {
  name: string
  status: string
  temperature: number
  label: string
  tone: 'hot' | 'warm' | 'cold'
}

type HomeData = {
  bestShot: {
    word: string
    temperature: number
    attempts: number
  } | null
  friends: HomeFriend[]
}

type LeaderboardEntry = {
  rank: number
  name: string
  temperature: number
  avgAttempts: number
}

type ArchiveEntry = {
  date: string
  day: string
  label: string
  word: string
  rank: string
  percent: string
  progress: number
  tone: 'hot' | 'warm' | 'cold'
}

type FriendSuggestion = {
  name: string
  info: string
}

type FriendsData = {
  suggestions: FriendSuggestion[]
  inviteLink: string
  inviteNote: string
}

type GameStartResponse = {
  sessionId: string
  guesses: Guess[]
  isWon: boolean
  attemptsLeft: number
  maxAttempts: number
}

type GameGuessResponse = GameStartResponse & {
  temperature: number
  result: Array<'correct' | 'present' | 'absent'>
}

type AuthUser = {
  id: number
  name: string
  email: string
}

type AuthResponse = {
  sessionId: string
  user: AuthUser
}

type AuthMeResponse = {
  user: AuthUser | null
}

type ApiResponse<T> = {
  data: T
}

const toneFromTemperature = (temperature: number): 'hot' | 'warm' | 'cold' => {
  if (temperature >= 50) return 'hot'
  if (temperature >= 0) return 'warm'
  return 'cold'
}

const formatTemperature = (temperature: number) => `${temperature}°C`

const formatAttempts = (attempts: number) => `${attempts} prób`

const getSessionId = () => {
  try {
    return localStorage.getItem('sessionId')
  } catch {
    return null
  }
}

const getAuthSessionId = () => {
  try {
    return localStorage.getItem('authSessionId')
  } catch {
    return null
  }
}

const setSessionId = (sessionId: string) => {
  try {
    localStorage.setItem('sessionId', sessionId)
  } catch {
    // Ignore write errors (e.g. private mode).
  }
}

const setAuthSessionId = (sessionId: string) => {
  try {
    localStorage.setItem('authSessionId', sessionId)
  } catch {
    // Ignore write errors (e.g. private mode).
  }
}

const clearAuthSessionId = () => {
  try {
    localStorage.removeItem('authSessionId')
  } catch {
    // Ignore write errors (e.g. private mode).
  }
}

const apiRequest = async <T,>(
  path: string,
  options: RequestInit & { json?: unknown } = {},
): Promise<T> => {
  const { json, headers, ...rest } = options
  const response = await fetch(`/api${path}`, {
    ...rest,
    headers: {
      ...(json ? { 'Content-Type': 'application/json' } : {}),
      ...headers,
    },
    body: json ? JSON.stringify(json) : rest.body,
  })

  if (!response.ok) {
    let message = 'Request failed'
    try {
      const payload = await response.json()
      if (payload?.error) {
        message = payload.error
      }
    } catch {
      const text = await response.text()
      if (text) message = text
    }
    throw new Error(message)
  }

  const payload = (await response.json()) as ApiResponse<T>
  return payload.data
}

function App() {
  return (
    <div className="app-shell">
      <div className="glow glow--hot" aria-hidden="true" />
      <div className="glow glow--cold" aria-hidden="true" />
      <div className="glow glow--ember" aria-hidden="true" />

      <Routes>
        <Route path="/" element={<Navigate to="/login" replace />} />
        <Route path="/login" element={<AuthScreen mode="login" />} />
        <Route path="/register" element={<AuthScreen mode="register" />} />
        <Route
          path="/home"
          element={
            <MainLayout>
              <HomeScreen />
            </MainLayout>
          }
        />
        <Route
          path="/game"
          element={
            <MainLayout>
              <GameScreen />
            </MainLayout>
          }
        />
        <Route
          path="/ranking"
          element={
            <MainLayout>
              <RankingScreen />
            </MainLayout>
          }
        />
        <Route
          path="/archive"
          element={
            <MainLayout>
              <ArchiveScreen />
            </MainLayout>
          }
        />
        <Route
          path="/calendar"
          element={
            <MainLayout>
              <CalendarScreen />
            </MainLayout>
          }
        />
        <Route
          path="/info"
          element={
            <MainLayout>
              <InfoScreen />
            </MainLayout>
          }
        />
        <Route
          path="/settings"
          element={
            <MainLayout>
              <SettingsScreen />
            </MainLayout>
          }
        />
        <Route
          path="/friends"
          element={
            <MainLayout>
              <FriendsScreen />
            </MainLayout>
          }
        />
        <Route
          path="/result"
          element={
            <MainLayout showHeader={false}>
              <ResultScreen />
            </MainLayout>
          }
        />
      </Routes>
    </div>
  )
}

export default App

function MainLayout({
  children,
  showHeader = true,
  showNav = true,
}: {
  children: ReactNode
  showHeader?: boolean
  showNav?: boolean
}) {
  return (
    <div className="screen">
      {showHeader ? <Header /> : null}
      <main className="main">{children}</main>
      {showNav ? <BottomNav /> : null}
    </div>
  )
}

function Header() {
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

function BottomNav() {
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

function Logo({ compact }: { compact?: boolean }) {
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

function AuthScreen({ mode }: { mode: 'login' | 'register' }) {
  const isRegister = mode === 'register'
  const navigate = useNavigate()
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [status, setStatus] = useState<'idle' | 'loading'>('idle')
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    setError(null)
  }, [mode])

  const isLoading = status === 'loading'

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    if (isLoading) return

    if (isRegister && !name.trim()) {
      setError('Podaj imię i nazwisko.')
      return
    }

    if (!email.trim()) {
      setError('Podaj adres e-mail.')
      return
    }

    if (!password) {
      setError('Podaj hasło.')
      return
    }

    if (isRegister && password !== confirmPassword) {
      setError('Hasła nie są takie same.')
      return
    }

    setStatus('loading')
    setError(null)
    try {
      const payload: Record<string, string> = {
        email: email.trim(),
        password,
      }
      if (isRegister) {
        payload.name = name.trim()
      }

      const data = await apiRequest<AuthResponse>(
        isRegister ? '/auth/register' : '/auth/login',
        {
          method: 'POST',
          json: payload,
        },
      )
      setAuthSessionId(data.sessionId)
      navigate('/game')
    } catch (submitError) {
      const message =
        submitError instanceof Error
          ? submitError.message
          : 'Nie udało się zalogować. Spróbuj ponownie.'
      setError(message)
    } finally {
      setStatus('idle')
    }
  }

  return (
    <div className="screen auth-screen">
      <div className="auth-hero">
        <Logo />
        <p className="auth-tagline">ODNAJDŹ UKRYTE ZNACZENIE</p>
      </div>

      <div className="card auth-card reveal" style={withDelay('0.1s')}>
        <h2 className="auth-title">
          {isRegister ? 'UTWÓRZ KONTO' : 'LOGOWANIE'}
        </h2>
        <div className="mini-gradient" aria-hidden="true" />
        <form className="auth-form" onSubmit={handleSubmit}>
          {error ? (
            <div className="game-status game-status--error">{error}</div>
          ) : null}
          {isRegister ? (
            <div className="field">
              <span className="field-label">IMIĘ I NAZWISKO</span>
              <label className="field-control">
                <span className="field-icon">
                  <UserIcon />
                </span>
                <input
                  placeholder="Jan Kowalski"
                  value={name}
                  onChange={(event) => setName(event.target.value)}
                  disabled={isLoading}
                />
              </label>
            </div>
          ) : null}
          <div className="field">
            <span className="field-label">EMAIL</span>
            <label className="field-control">
              <span className="field-icon">
                <MailIcon />
              </span>
              <input
                placeholder="jan@example.com"
                value={email}
                onChange={(event) => setEmail(event.target.value)}
                disabled={isLoading}
              />
            </label>
          </div>
          <div className="field">
            <span className="field-label">HASŁO</span>
            <label className="field-control">
              <span className="field-icon">
                <LockIcon />
              </span>
              <input
                type="password"
                placeholder="••••••••"
                value={password}
                onChange={(event) => setPassword(event.target.value)}
                disabled={isLoading}
              />
              <span className="field-trailing" aria-hidden="true">
                <EyeIcon />
              </span>
            </label>
          </div>
          {isRegister ? (
            <div className="field">
              <span className="field-label">POWTÓRZ HASŁO</span>
              <label className="field-control">
                <span className="field-icon">
                  <LockIcon />
                </span>
                <input
                  type="password"
                  placeholder="••••••••"
                  value={confirmPassword}
                  onChange={(event) => setConfirmPassword(event.target.value)}
                  disabled={isLoading}
                />
                <span className="field-trailing" aria-hidden="true">
                  <EyeIcon />
                </span>
              </label>
            </div>
          ) : null}
          <button className="primary-btn" type="submit" disabled={isLoading}>
            {isLoading
              ? 'Przetwarzanie...'
              : isRegister
                ? 'Zarejestruj się'
                : 'Zaloguj się'}
            <ArrowRightIcon />
          </button>
        </form>
      </div>

      <p className="auth-switch">
        {isRegister ? 'Masz już konto? ' : 'Nie masz konta? '}
        <Link className="link-accent" to={isRegister ? '/login' : '/register'}>
          {isRegister ? 'ZALOGUJ SIĘ' : 'ZAREJESTRUJ SIĘ'}
        </Link>
      </p>
    </div>
  )
}

function HomeScreen() {
  const [homeData, setHomeData] = useState<HomeData | null>(null)
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    const loadHome = async () => {
      try {
        const sessionId = getSessionId()
        const query = sessionId ? `?sessionId=${sessionId}` : ''
        const data = await apiRequest<HomeData>(`/home${query}`)
        setHomeData(data)
      } catch (error) {
        console.error(error)
      } finally {
        setIsLoading(false)
      }
    }

    void loadHome()
  }, [])

  const bestShot = homeData?.bestShot
  const friends = homeData?.friends ?? []
  const bestTemp = bestShot ? formatTemperature(bestShot.temperature) : '--'
  const bestMeta = bestShot
    ? `Najlepsza temperatura: ${formatAttempts(bestShot.attempts)}`
    : 'Zagraj pierwszą rundę, by zobaczyć wynik.'

  return (
    <>
      <div className="page-head">
        <div>
          <h1 className="page-title">PAŹDZIERNIK 2024</h1>
          <p className="page-subtitle">Twoja kalendarzowa mapa gry.</p>
        </div>
        <div className="pager">
          <button className="icon-button" type="button" aria-label="Poprzedni">
            <ChevronLeftIcon />
          </button>
          <button className="icon-button" type="button" aria-label="Następny">
            <ChevronRightIcon />
          </button>
        </div>
      </div>

      <CalendarCard compact />

      <section className="stack">
        <div className="section-title">Twoja Próba</div>
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
                <div className="avatar" aria-hidden="true"></div>
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

function GameScreen() {
  const [sessionId, setSessionIdState] = useState<string | null>(null)
  const [guesses, setGuesses] = useState<Guess[]>([])
  const [input, setInput] = useState('')
  const [status, setStatus] = useState<'loading' | 'ready' | 'submitting'>(
    'loading',
  )
  const [error, setError] = useState<string | null>(null)
  const [isWon, setIsWon] = useState(false)
  const [attemptsLeft, setAttemptsLeft] = useState(6)
  const [maxAttempts, setMaxAttempts] = useState(6)

  const bestGuess = useMemo(() => {
    if (guesses.length === 0) return null
    return guesses.reduce((best, guess) =>
      guess.temperature > best.temperature ? guess : best,
    )
  }, [guesses])

  useEffect(() => {
    const loadGame = async () => {
      try {
        const stored = getSessionId()
        const payload = await apiRequest<GameStartResponse>('/game/start', {
          method: 'POST',
          json: stored ? { sessionId: stored } : {},
        })
        setSessionIdState(payload.sessionId)
        setSessionId(payload.sessionId)
        setGuesses(payload.guesses)
        setIsWon(payload.isWon)
        setAttemptsLeft(payload.attemptsLeft)
        setMaxAttempts(payload.maxAttempts)
      } catch (loadError) {
        console.error(loadError)
        setError('Nie udało się załadować gry. Spróbuj ponownie.')
      } finally {
        setStatus('ready')
      }
    }

    void loadGame()
  }, [])

  const attemptNumber = Math.min(guesses.length + 1, maxAttempts)
  const isGameOver = isWon || attemptsLeft <= 0
  const isBusy = status !== 'ready'

  const submitGuess = async () => {
    if (!sessionId || status === 'submitting') return
    const trimmed = input.trim()
    if (!trimmed) return
    setStatus('submitting')
    setError(null)
    try {
      const payload = await apiRequest<GameGuessResponse>('/game/guess', {
        method: 'POST',
        json: { sessionId, guess: trimmed },
      })
      setGuesses(payload.guesses)
      setIsWon(payload.isWon)
      setAttemptsLeft(payload.attemptsLeft)
      setInput('')
    } catch (submitError) {
      console.error(submitError)
      const message =
        submitError instanceof Error
          ? submitError.message
          : 'Coś poszło nie tak. Spróbuj ponownie.'
      setError(message)
    } finally {
      setStatus('ready')
    }
  }

  return (
    <>
      <div className="section-title">Twój najlepszy strzał</div>
      <div className="card best-card reveal" style={withDelay('0.05s')}>
        <div className="best-left">
          <div className="best-icon">
            <FlameIcon />
          </div>
          <div>
            <div className="best-title">{bestGuess?.word ?? 'Brak prób'}</div>
            <div className="best-sub">
              {bestGuess
                ? `Najwyższa temperatura z ${guesses.length} prób`
                : 'Zacznij zgadywać, aby zobaczyć wynik.'}
            </div>
          </div>
        </div>
        <div className="best-temp">
          <div className="best-label">Temperatura</div>
          <div className="best-value">
            {bestGuess ? formatTemperature(bestGuess.temperature) : '--'}
          </div>
        </div>
      </div>

      <section className="stack">
        <div className="section-title muted">Historia prób</div>
        {guesses.length === 0 ? (
          <div className="empty-state">Brak prób. Zgadnij pierwsze słowo.</div>
        ) : (
          [...guesses]
            .reverse()
            .map((guess, index) => (
              <div
                key={`${guess.word}-${guess.createdAt}`}
                className={`card history-card temp-${toneFromTemperature(
                  guess.temperature,
                )} reveal`}
                style={withDelay(`${0.1 + index * 0.06}s`)}
              >
                <div>
                  <div className="history-word">{guess.word}</div>
                  <div className="history-meta">
                    Znaczenie: {guess.temperature >= 50 ? 'Bliskie' : guess.temperature >= 0 ? 'Powiązane' : 'Odległe'}
                  </div>
                </div>
                <div className="history-temp">
                  {formatTemperature(guess.temperature)}
                </div>
              </div>
            ))
        )}
      </section>

      <div className="try-pill">
        Próba: {attemptNumber}/{maxAttempts}
      </div>

      {isBusy && status === 'loading' ? (
        <div className="game-status">Ładuję grę...</div>
      ) : null}
      {error ? <div className="game-status game-status--error">{error}</div> : null}
      {isWon ? (
        <div className="game-status game-status--success">
          Brawo! Osiągnąłeś 100°C.
        </div>
      ) : null}
      {!isWon && attemptsLeft === 0 ? (
        <div className="game-status">Koniec prób na dziś. Spróbuj jutro!</div>
      ) : null}

      <div className="card input-card">
        <input
          className="input-field"
          placeholder="Wpisz słowo..."
          value={input}
          onChange={(event) => setInput(event.target.value)}
          onKeyDown={(event) => {
            if (event.key === 'Enter') {
              void submitGuess()
            }
          }}
          disabled={isBusy || isGameOver}
        />
        <button
          className="primary-btn"
          type="button"
          onClick={() => void submitGuess()}
          disabled={isBusy || isGameOver}
        >
          Sprawdź
        </button>
      </div>
    </>
  )
}

function RankingScreen() {
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
              <div className="ranking-avatar">
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
            <div>
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

function ArchiveScreen() {
  const [entries, setEntries] = useState<ArchiveEntry[]>([])
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    const loadArchive = async () => {
      try {
        const sessionId = getSessionId()
        const query = sessionId ? `?sessionId=${sessionId}` : ''
        const data = await apiRequest<ArchiveEntry[]>(`/archive${query}`)
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

      <Link className="card action-card" to="/calendar">
        <div className="action-icon">
          <CalendarIcon />
        </div>
        <span>Zobacz pełny kalendarz</span>
        <ChevronRightIcon />
      </Link>
    </>
  )
}

function CalendarScreen() {
  return (
    <>
      <div className="page-head">
        <div>
          <h1 className="page-title">PAŹDZIERNIK 2024</h1>
          <p className="page-subtitle">Mapa temperatur dla każdego dnia.</p>
        </div>
        <div className="pager">
          <button className="icon-button" type="button" aria-label="Poprzedni">
            <ChevronLeftIcon />
          </button>
          <button className="icon-button" type="button" aria-label="Następny">
            <ChevronRightIcon />
          </button>
        </div>
      </div>

      <CalendarCard />
    </>
  )
}

function CalendarCard({ compact }: { compact?: boolean }) {
  return (
    <div className={`card calendar-card${compact ? ' calendar-card--compact' : ''}`}>
      <div className="calendar-week">
        {weekDays.map((day) => (
          <span key={day}>{day}</span>
        ))}
      </div>
      <div className="calendar-grid">
        {calendarDays.map((entry) => (
          <div
            key={entry.day}
            className={`day${entry.muted ? ' day--muted' : ''}${entry.active ? ' day--active' : ''
              }`}
          >
            {entry.day}
            {entry.dot ? (
              <span className={`day-dot dot-${entry.dot}`} />
            ) : null}
          </div>
        ))}
      </div>
    </div>
  )
}

function InfoScreen() {
  const items = [
    {
      title: 'Gorąco',
      desc: 'Powyżej 50°C. Jesteś bardzo blisko. Słowo jest synonimem lub ściśle powiązane z hasłem.',
      tone: 'hot',
      value: 92,
      icon: <FlameIcon />,
    },
    {
      title: 'Ciepło',
      desc: 'Od 0°C do 50°C. Dobry kierunek. Słowo należy do tej samej kategorii tematycznej.',
      tone: 'warm',
      value: 58,
      icon: <ThermoIcon />,
    },
    {
      title: 'Zimno',
      desc: 'Poniżej 0°C. Zupełnie inny temat. Spróbuj poszukać w innym obszarze skojarzeń.',
      tone: 'cold',
      value: 18,
      icon: <SnowIcon />,
    },
  ]

  const samples = [
    { word: 'KOT', temp: '85°C', tone: 'hot' },
    { word: 'ZWIERZĘ', temp: '55°C', tone: 'warm' },
    { word: 'KRZESŁO', temp: '-15°C', tone: 'cold' },
  ]

  return (
    <>
      <div>
        <h1 className="page-title">INFORMACJE</h1>
        <p className="page-subtitle">
          Twoim celem jest odgadnięcie ukrytego słowa. Im bliżej
          znaczeniowo jest Twoje słowo, tym wyższa temperatura.
        </p>
      </div>

      <div className="stack">
        {items.map((item, index) => (
          <div
            key={item.title}
            className="card info-card reveal"
            style={withDelay(`${0.08 + index * 0.08}s`)}
          >
            <div className="info-row">
              <span className={`info-icon tone-${item.tone}`}>{item.icon}</span>
              <div>
                <div className="card-title">{item.title}</div>
                <p className="card-desc">{item.desc}</p>
              </div>
            </div>
            <div
              className={`progress progress-${item.tone}`}
              style={{ '--progress': `${item.value}%` } as CSSProperties}
            />
          </div>
        ))}
      </div>

      <div className="card info-block">
        <div className="card-title">Mechanika Semantyczna</div>
        <p className="card-desc">
          Gra nie ocenia podobieństwa liter (jak w Wordle), ale
          podobieństwo znaczeniowe. System AI analizuje miliony tekstów, aby
          zrozumieć kontekst słów.
        </p>
        <p className="card-desc">
          Jeśli ukrytym słowem jest "PIES", to słowo "KOT" będzie miało
          wysoką temperaturę, a słowo "KRZESŁO" bardzo niską.
        </p>
        <div className="score-table">
          <div className="score-head">
            <span>TWÓJ STRZAŁ</span>
            <span>TEMPERATURA</span>
          </div>
          {samples.map((sample) => (
            <div key={sample.word} className="score-row">
              <span>{sample.word}</span>
              <span className={`score-temp temp-${sample.tone}`}>
                {sample.temp}
              </span>
            </div>
          ))}
        </div>
      </div>

      <div className="card info-block">
        <div className="card-title">O nas</div>
        <p className="card-desc">
          Projekt "Ciepło-Zimno" to eksperyment łączący zabawę słowem z
          nowoczesnymi modelami językowymi (NLP). Chcemy pokazać, jak maszyny
          "rozumieją" język na poziomie semantycznym.
        </p>
      </div>

      <div className="card info-block">
        <div className="card-title">Kontakt</div>
        <p className="card-desc">
          Masz pytania, znalazłeś błąd lub chcesz po prostu powiedzieć cześć?
        </p>
        <button className="secondary-btn" type="button">
          Napisz do nas
        </button>
      </div>
    </>
  )
}

function SettingsScreen() {
  const [user, setUser] = useState<AuthUser | null>(null)
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    const loadUser = async () => {
      const sessionId = getAuthSessionId()
      if (!sessionId) {
        setIsLoading(false)
        return
      }

      try {
        const data = await apiRequest<AuthMeResponse>(
          `/auth/me?sessionId=${sessionId}`,
        )
        setUser(data.user)
      } catch (error) {
        console.error(error)
      } finally {
        setIsLoading(false)
      }
    }

    void loadUser()
  }, [])

  const handleLogout = async () => {
    const sessionId = getAuthSessionId()
    if (!sessionId) return
    try {
      await apiRequest<{ ok: boolean }>('/auth/logout', {
        method: 'POST',
        json: { sessionId },
      })
    } catch (error) {
      console.error(error)
    } finally {
      clearAuthSessionId()
      setUser(null)
    }
  }

  return (
    <>
      <div>
        <h1 className="page-title">Ustawienia</h1>
        <p className="page-subtitle">Dostosuj swoje wrażenia z gry.</p>
      </div>

      <div className="card settings-card">
        <div className="settings-header">
          <span className="info-icon tone-warm">
            <UserIcon />
          </span>
          <div>
            <div className="card-title">Konto</div>
            {isLoading ? (
              <div className="card-desc">Ładuję konto...</div>
            ) : user ? (
              <>
                <div className="card-desc">{user.email}</div>
                <div className="card-desc">Zalogowano</div>
              </>
            ) : (
              <>
                <div className="card-desc">Brak aktywnego konta</div>
                <div className="card-desc">
                  Zaloguj się, aby zapisać postępy.
                </div>
              </>
            )}
          </div>
        </div>
        <div className="settings-actions">
          {user ? (
            <>
              <button className="secondary-btn" type="button" disabled>
                Zmień hasło
              </button>
              <button className="ghost-btn" type="button" onClick={handleLogout}>
                Wyloguj
              </button>
            </>
          ) : (
            <Link className="secondary-btn" to="/login">
              Zaloguj się
            </Link>
          )}
        </div>
      </div>

      <div className="card settings-card">
        <div className="settings-header">
          <span className="info-icon tone-hot">
            <GamepadIcon />
          </span>
          <div className="card-title">Gra</div>
        </div>
        <div className="settings-list">
          <div className="settings-item">
            <div>
              <div className="list-title">Efekty Dźwiękowe</div>
              <div className="list-sub">KLAWIATURA I WYNIKI</div>
            </div>
            <Toggle defaultChecked />
          </div>
          <div className="settings-item">
            <div>
              <div className="list-title">Wibracje (Haptics)</div>
              <div className="list-sub">DLA TEMPERATURY</div>
            </div>
            <Toggle defaultChecked />
          </div>
          <div className="settings-item">
            <div>
              <div className="list-title">Tryb Ciemny</div>
              <div className="list-sub">WYMAGANY DO GRY</div>
            </div>
            <Toggle />
          </div>
        </div>
      </div>

      <div className="card settings-card">
        <div className="settings-header">
          <span className="info-icon tone-cold">
            <BellIcon />
          </span>
          <div className="card-title">Powiadomienia</div>
        </div>
        <div className="settings-list">
          <div className="settings-item">
            <div>
              <div className="list-title">Codzienne Słowo</div>
              <div className="list-sub">PRZYPOMNIENIE</div>
            </div>
            <Toggle />
          </div>
          <div className="settings-item">
            <div>
              <div className="list-title">Zmiany w Rankingu</div>
              <div className="list-sub">ZAWODY</div>
            </div>
            <Toggle defaultChecked />
          </div>
        </div>
      </div>
    </>
  )
}

function FriendsScreen() {
  const [friendsData, setFriendsData] = useState<FriendsData | null>(null)
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    const loadFriends = async () => {
      try {
        const data = await apiRequest<FriendsData>('/friends')
        setFriendsData(data)
      } catch (error) {
        console.error(error)
      } finally {
        setIsLoading(false)
      }
    }

    void loadFriends()
  }, [])

  const suggestions = friendsData?.suggestions ?? []
  const inviteLink = friendsData?.inviteLink ?? 'cieplo-zimno.io/invite/u_492'
  const inviteNote =
    friendsData?.inviteNote ??
    'Zaproś znajomych do gry i odbierz bonusowe podpowiedzi za każdego nowego gracza, który dołączy z Twojego polecenia.'

  return (
    <>
      <div className="page-head">
        <div>
          <h1 className="page-title">Dodaj Znajomych</h1>
          <p className="page-subtitle">Zaproś lub znajdź nowych graczy.</p>
        </div>
        <button className="icon-button" type="button" aria-label="Termometr">
          <ThermoIcon />
        </button>
      </div>

      <div className="card search-bar">
        <SearchIcon />
        <input placeholder="Szukaj po nazwie użytkownika lub e-mailu" />
      </div>

      <div className="section-title">Sugerowani</div>
      <div className="stack">
        {isLoading ? (
          <div className="empty-state">Ładuję sugestie...</div>
        ) : suggestions.length === 0 ? (
          <div className="empty-state">Brak sugestii znajomych.</div>
        ) : (
          suggestions.map((item, index) => (
            <div
              key={item.name}
              className="card friend-card reveal"
              style={withDelay(`${0.1 + index * 0.08}s`)}
            >
              <div className="friend-left">
                <div className="avatar" />
                <div>
                  <div className="list-title">{item.name}</div>
                  <div className="list-sub">{item.info}</div>
                </div>
              </div>
              <button className="primary-btn" type="button">
                Dodaj
              </button>
            </div>
          ))
        )}
      </div>

      <div className="card invite-card">
        <div className="card-title">Twój link zaproszenia</div>
        <div className="invite-link">
          {inviteLink}
          <button className="icon-button" type="button" aria-label="Skopiuj">
            <CopyIcon />
          </button>
        </div>
        <p className="card-desc">{inviteNote}</p>
      </div>
    </>
  )
}

function ResultScreen() {
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

function Toggle({ defaultChecked }: { defaultChecked?: boolean }) {
  return (
    <label className="toggle">
      <input type="checkbox" defaultChecked={defaultChecked} />
      <span className="toggle-slider" />
    </label>
  )
}

function ThermoIcon() {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true" fill="none">
      <path
        d="M10 4a2 2 0 1 1 4 0v8.2a4.5 4.5 0 1 1-4 0V4Z"
        stroke="currentColor"
        strokeWidth="1.6"
      />
      <circle cx="12" cy="17.5" r="2.2" fill="currentColor" />
    </svg>
  )
}

function InfoIcon() {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true" fill="none">
      <circle cx="12" cy="12" r="8" stroke="currentColor" strokeWidth="1.6" />
      <path d="M12 10v6" stroke="currentColor" strokeWidth="1.6" />
      <circle cx="12" cy="7" r="1" fill="currentColor" />
    </svg>
  )
}

function UserPlusIcon() {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true" fill="none">
      <circle cx="9" cy="9" r="3.2" stroke="currentColor" strokeWidth="1.6" />
      <path
        d="M4 19c1.5-3.2 8.5-3.2 10 0"
        stroke="currentColor"
        strokeWidth="1.6"
      />
      <path d="M17 8v6" stroke="currentColor" strokeWidth="1.6" />
      <path d="M14 11h6" stroke="currentColor" strokeWidth="1.6" />
    </svg>
  )
}

function SettingsIcon() {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true" fill="none">
      <path
        d="M12 4.5 13.4 7h3l-2.2 2.2 1 3L12 10.7 8.8 12.2l1-3L7.6 7h3L12 4.5Z"
        stroke="currentColor"
        strokeWidth="1.4"
      />
      <circle cx="12" cy="12" r="7.2" stroke="currentColor" strokeWidth="1.2" />
    </svg>
  )
}

function PlayIcon() {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true" fill="none">
      <path d="M7 5.5 18 12 7 18.5Z" stroke="currentColor" strokeWidth="1.6" />
    </svg>
  )
}

function RankingIcon() {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true" fill="none">
      <path d="M6 19V9" stroke="currentColor" strokeWidth="1.6" />
      <path d="M12 19V5" stroke="currentColor" strokeWidth="1.6" />
      <path d="M18 19v-6" stroke="currentColor" strokeWidth="1.6" />
    </svg>
  )
}

function ArchiveIcon() {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true" fill="none">
      <path d="M12 7v6l3.5 2" stroke="currentColor" strokeWidth="1.6" />
      <circle cx="12" cy="12" r="8" stroke="currentColor" strokeWidth="1.6" />
    </svg>
  )
}

function ArrowRightIcon() {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true" fill="none">
      <path d="M6 12h12" stroke="currentColor" strokeWidth="1.6" />
      <path d="m13 7 5 5-5 5" stroke="currentColor" strokeWidth="1.6" />
    </svg>
  )
}

function UserIcon() {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true" fill="none">
      <circle cx="12" cy="8" r="3" stroke="currentColor" strokeWidth="1.6" />
      <path d="M5 19c2-4 12-4 14 0" stroke="currentColor" strokeWidth="1.6" />
    </svg>
  )
}

function MailIcon() {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true" fill="none">
      <rect x="4" y="6" width="16" height="12" rx="2" stroke="currentColor" strokeWidth="1.6" />
      <path d="m5 7 7 5 7-5" stroke="currentColor" strokeWidth="1.6" />
    </svg>
  )
}

function LockIcon() {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true" fill="none">
      <rect x="6" y="11" width="12" height="9" rx="2" stroke="currentColor" strokeWidth="1.6" />
      <path d="M9 11V8a3 3 0 1 1 6 0v3" stroke="currentColor" strokeWidth="1.6" />
    </svg>
  )
}

function EyeIcon() {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true" fill="none">
      <path
        d="M3 12s3.5-5 9-5 9 5 9 5-3.5 5-9 5-9-5-9-5Z"
        stroke="currentColor"
        strokeWidth="1.6"
      />
      <circle cx="12" cy="12" r="2" fill="currentColor" />
    </svg>
  )
}

function FlameIcon() {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true" fill="none">
      <path
        d="M12 4c2 3-1 4 1 7 1.2 1.7 3.5 1.5 3.5 4.2A4.5 4.5 0 0 1 12 20a4.5 4.5 0 0 1-4.5-4.8C7.5 11.5 11 10.5 12 4Z"
        stroke="currentColor"
        strokeWidth="1.6"
      />
    </svg>
  )
}

function SnowIcon() {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true" fill="none">
      <path d="M12 4v16" stroke="currentColor" strokeWidth="1.6" />
      <path d="m6 7 12 10" stroke="currentColor" strokeWidth="1.6" />
      <path d="m6 17 12-10" stroke="currentColor" strokeWidth="1.6" />
    </svg>
  )
}

function ChevronLeftIcon() {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true" fill="none">
      <path d="m14 7-5 5 5 5" stroke="currentColor" strokeWidth="1.6" />
    </svg>
  )
}

function ChevronRightIcon() {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true" fill="none">
      <path d="m10 7 5 5-5 5" stroke="currentColor" strokeWidth="1.6" />
    </svg>
  )
}

function CalendarIcon() {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true" fill="none">
      <rect x="4" y="6" width="16" height="14" rx="2" stroke="currentColor" strokeWidth="1.6" />
      <path d="M8 4v4" stroke="currentColor" strokeWidth="1.6" />
      <path d="M16 4v4" stroke="currentColor" strokeWidth="1.6" />
    </svg>
  )
}

function GamepadIcon() {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true" fill="none">
      <rect x="4" y="9" width="16" height="8" rx="4" stroke="currentColor" strokeWidth="1.6" />
      <path d="M8 13h4" stroke="currentColor" strokeWidth="1.6" />
      <path d="M10 11v4" stroke="currentColor" strokeWidth="1.6" />
      <circle cx="16.5" cy="12" r="1" fill="currentColor" />
      <circle cx="18.5" cy="14" r="1" fill="currentColor" />
    </svg>
  )
}

function BellIcon() {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true" fill="none">
      <path
        d="M18 16H6c1.5-1.2 2-3 2-5a4 4 0 1 1 8 0c0 2 0.5 3.8 2 5Z"
        stroke="currentColor"
        strokeWidth="1.6"
      />
      <path d="M10 18a2 2 0 0 0 4 0" stroke="currentColor" strokeWidth="1.6" />
    </svg>
  )
}

function SearchIcon() {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true" fill="none">
      <circle cx="11" cy="11" r="6" stroke="currentColor" strokeWidth="1.6" />
      <path d="m16.5 16.5 4 4" stroke="currentColor" strokeWidth="1.6" />
    </svg>
  )
}

function CopyIcon() {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true" fill="none">
      <rect x="9" y="9" width="10" height="10" rx="2" stroke="currentColor" strokeWidth="1.6" />
      <rect x="5" y="5" width="10" height="10" rx="2" stroke="currentColor" strokeWidth="1.6" />
    </svg>
  )
}

function CloseIcon() {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true" fill="none">
      <path d="M6 6l12 12" stroke="currentColor" strokeWidth="1.6" />
      <path d="M18 6 6 18" stroke="currentColor" strokeWidth="1.6" />
    </svg>
  )
}

function RefreshIcon() {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true" fill="none">
      <path d="M20 12a8 8 0 1 1-2-5.3" stroke="currentColor" strokeWidth="1.6" />
      <path d="M20 4v5h-5" stroke="currentColor" strokeWidth="1.6" />
    </svg>
  )
}

function ShareIcon() {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true" fill="none">
      <path d="M4 12v6a2 2 0 0 0 2 2h12" stroke="currentColor" strokeWidth="1.6" />
      <path d="M12 5v10" stroke="currentColor" strokeWidth="1.6" />
      <path d="m8 9 4-4 4 4" stroke="currentColor" strokeWidth="1.6" />
    </svg>
  )
}
