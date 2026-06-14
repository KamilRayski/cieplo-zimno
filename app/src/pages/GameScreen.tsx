import { useEffect, useMemo, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { apiRequest } from '../lib/api'
import { formatTemperature, toneFromTemperature } from '../lib/format'
import { getAuthSessionId, getSessionId, setSessionId } from '../lib/session'
import type { GameGuessResponse, GameStartResponse, Guess } from '../types'
import { FlameIcon } from '../components/icons'
import { withDelay } from '../lib/withDelay'

export default function GameScreen() {
  const navigate = useNavigate()
  const { date } = useParams<{ date?: string }>()
  const [sessionId, setSessionIdState] = useState<string | null>(null)
  const [guesses, setGuesses] = useState<Guess[]>([])
  const [input, setInput] = useState('')
  const [status, setStatus] = useState<'loading' | 'ready' | 'submitting'>(
    'loading',
  )
  const [error, setError] = useState<string | null>(null)
  const [isWon, setIsWon] = useState(false)
  const [isWonModalClosed, setIsWonModalClosed] = useState(false)

  const bestGuess = useMemo(() => {
    if (guesses.length === 0) return null
    return guesses.reduce((best, guess) =>
      guess.temperature > best.temperature ? guess : best,
    )
  }, [guesses])

  const avgTemp = useMemo(() => {
    if (guesses.length === 0) return null
    const sum = guesses.reduce((acc, g) => acc + g.temperature, 0)
    return Number((sum / guesses.length).toFixed(1))
  }, [guesses])

  const winningWord = useMemo(() => {
    const win = guesses.find((g) => g.temperature === 100)
    return win ? win.word.toUpperCase() : ''
  }, [guesses])

  useEffect(() => {
    setIsWonModalClosed(false)
    const loadGame = async () => {
      setStatus('loading')
      setError(null)
      try {
        const stored = date ? null : getSessionId()
        const authSessionId = getAuthSessionId()
        if (!authSessionId) {
          setError('Zaloguj się, aby rozpocząć grę.')
          return
        }
        const payload = await apiRequest<GameStartResponse>('/game/start', {
          method: 'POST',
          json: {
            authSessionId,
            ...(stored ? { sessionId: stored } : {}),
            ...(date ? { date } : {}),
          },
        })
        setSessionIdState(payload.sessionId)
        if (!date) {
          setSessionId(payload.sessionId)
        }
        setGuesses(payload.guesses)
        setIsWon(payload.isWon)
      } catch (loadError) {
        console.error(loadError)
        setError('Nie udało się załadować gry. Spróbuj ponownie.')
      } finally {
        setStatus('ready')
      }
    }

    void loadGame()
  }, [date])

  const isGameOver = isWon
  const isBusy = status !== 'ready'

  const submitGuess = async () => {
    if (!sessionId || status === 'submitting') return
    if (isGameOver) return
    const trimmed = input.trim()
    if (!trimmed) return
    const authSessionId = getAuthSessionId()
    if (!authSessionId) {
      setError('Zaloguj się, aby kontynuować grę.')
      return
    }
    setStatus('submitting')
    setError(null)
    try {
      const payload = await apiRequest<GameGuessResponse>('/game/guess', {
        method: 'POST',
        json: { sessionId, guess: trimmed, authSessionId },
      })
      setGuesses(payload.guesses)
      setIsWon(payload.isWon)
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
      {date ? (
        <div className="card reveal" style={{ ...withDelay('0.02s'), background: 'rgba(255, 255, 255, 0.03)', border: '1px dashed rgba(255, 255, 255, 0.15)', marginBottom: '16px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div>
            <div style={{ fontSize: '11px', textTransform: 'uppercase', letterSpacing: '0.15em', color: 'var(--accent-rose)', fontWeight: 600 }}>Gra Archiwalna</div>
            <div style={{ fontSize: '13px', color: 'rgba(255, 255, 255, 0.7)', marginTop: '2px' }}>Dzień: {date}</div>
          </div>
          <button
            className="secondary-btn"
            style={{ padding: '6px 12px', fontSize: '10px' }}
            onClick={() => navigate('/game')}
          >
            Powrót
          </button>
        </div>
      ) : null}

      <div className="reveal" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', marginBottom: '16px', ...withDelay('0.03s') }}>
        <div className="card" style={{ padding: '10px 14px' }}>
          <div style={{ fontSize: '9px', textTransform: 'uppercase', letterSpacing: '0.12em', color: 'rgba(255, 255, 255, 0.5)' }}>Liczba prób</div>
          <div style={{ fontSize: '18px', fontWeight: 'bold', color: 'var(--accent-rose)', marginTop: '2px' }}>{guesses.length}</div>
        </div>
        <div className="card" style={{ padding: '10px 14px' }}>
          <div style={{ fontSize: '9px', textTransform: 'uppercase', letterSpacing: '0.12em', color: 'rgba(255, 255, 255, 0.5)' }}>Średnia temp.</div>
          <div style={{ fontSize: '18px', fontWeight: 'bold', color: 'var(--text)', marginTop: '2px' }}>{avgTemp !== null ? `${avgTemp}°C` : '--'}</div>
        </div>
      </div>

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
        <div className="best-temp" style={{ display: 'flex', gap: '16px', alignItems: 'center' }}>
          <div>
            <div className="best-label">Temperatura</div>
            <div className="best-value">
              {bestGuess ? formatTemperature(bestGuess.temperature) : '--'}
            </div>
          </div>
          {bestGuess && bestGuess.rank !== undefined && bestGuess.rank !== null && (
            <div style={{ borderLeft: '1px solid rgba(255, 255, 255, 0.1)', paddingLeft: '16px' }}>
              <div className="best-label">Miejsce</div>
              <div className="best-value" style={{ color: 'var(--accent-rose)' }}>
                #{bestGuess.rank}
              </div>
            </div>
          )}
        </div>
      </div>

      <section className="stack">
        <div className="section-title muted">Historia prób</div>
        <div className="history-list">
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
                      Próba #{guesses.length - index} • Znaczenie: {guess.temperature >= 50 ? 'Bliskie' : guess.temperature >= 0 ? 'Powiązane' : 'Odległe'}
                    </div>
                  </div>
                  <div className="history-temp" style={{ textAlign: 'right' }}>
                    <div>{formatTemperature(guess.temperature)}</div>
                    {guess.rank !== undefined && guess.rank !== null && (
                      <div style={{ fontSize: '11px', color: 'rgba(255, 255, 255, 0.4)', fontWeight: 'normal', marginTop: '2px' }}>
                        Miejsce: {guess.rank}
                      </div>
                    )}
                  </div>
                </div>
              ))
          )}
        </div>
      </section>

      {/* licznik prób usunięty */}

      {isBusy && status === 'loading' ? (
        <div className="game-status">Ładuję grę...</div>
      ) : null}
      {error ? <div className="game-status game-status--error">{error}</div> : null}
      {isWon && !isWonModalClosed ? (
        <div className="modal-overlay" style={{ position: 'fixed', inset: 0, backgroundColor: 'rgba(0, 0, 0, 0.45)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 100, padding: '16px' }}>
          <div className="card victory-card reveal" style={{ display: 'flex', flexDirection: 'column', gap: '12px', alignItems: 'center', textAlign: 'center', padding: '32px 24px', maxWidth: '360px', width: '100%', position: 'relative' }}>
            <button
              onClick={() => setIsWonModalClosed(true)}
              style={{
                position: 'absolute',
                top: '12px',
                right: '12px',
                background: 'transparent',
                border: 'none',
                color: 'rgba(255, 255, 255, 0.6)',
                fontSize: '18px',
                cursor: 'pointer',
                zIndex: 3,
                lineHeight: 1,
                padding: '4px'
              }}
              aria-label="Zamknij"
            >
              ✕
            </button>

            <div style={{ fontSize: '22px', fontWeight: 'bold', color: '#ffb7a2', letterSpacing: '0.05em' }}>
              GRATULACJE!
            </div>
            <div style={{ fontSize: '13px', color: 'rgba(255, 255, 255, 0.7)', zIndex: 2 }}>
              Odgadłeś dzisiejsze hasło!
            </div>

            {winningWord && (
              <div style={{ margin: '8px 0', padding: '8px 16px', background: 'rgba(255, 90, 70, 0.15)', borderRadius: '12px', border: '1px solid rgba(255, 90, 70, 0.3)', position: 'relative', zIndex: 2 }}>
                <div style={{ fontSize: '9px', textTransform: 'uppercase', letterSpacing: '0.12em', color: 'rgba(255, 255, 255, 0.5)' }}>Hasło dnia</div>
                <div style={{ fontSize: '24px', fontWeight: '900', color: '#fff', letterSpacing: '0.15em', marginTop: '4px', textShadow: '0 0 15px #ff5a4f' }}>
                  {winningWord}
                </div>
              </div>
            )}

            <div style={{ display: 'flex', gap: '24px', margin: '8px 0', position: 'relative', zIndex: 2 }}>
              <div>
                <div style={{ fontSize: '9px', textTransform: 'uppercase', letterSpacing: '0.12em', color: 'rgba(255,255,255,0.5)' }}>Liczba prób</div>
                <div style={{ fontSize: '24px', fontWeight: 'bold', color: 'var(--text)', marginTop: '2px' }}>{guesses.length}</div>
              </div>
              <div style={{ borderLeft: '1px solid rgba(255,255,255,0.1)', paddingLeft: '24px' }}>
                <div style={{ fontSize: '9px', textTransform: 'uppercase', letterSpacing: '0.12em', color: 'rgba(255,255,255,0.5)' }}>Średnia temp.</div>
                <div style={{ fontSize: '24px', fontWeight: 'bold', color: '#ff5a4f', marginTop: '2px' }}>{avgTemp !== null ? `${avgTemp}°C` : '--'}</div>
              </div>
            </div>

            {/* Mock Share Block */}
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '8px', marginTop: '4px', width: '100%', borderTop: '1px solid rgba(255,255,255,0.1)', paddingTop: '12px', position: 'relative', zIndex: 2 }}>
              <button
                className="secondary-btn"
                style={{ padding: '8px 24px', fontSize: '11px', textTransform: 'uppercase', letterSpacing: '0.05em' }}
                onClick={() => alert('Wynik skopiowany do schowka! (Symulacja)')}
              >
                Udostępnij wynik
              </button>
            </div>
            
            <button
              className="primary-btn"
              style={{ marginTop: '8px', width: '100%', padding: '10px 24px', position: 'relative', zIndex: 2, boxShadow: '0 8px 20px rgba(255, 90, 70, 0.4)' }}
              onClick={() => navigate('/ranking')}
            >
              Zobacz ranking graczy
            </button>
          </div>
        </div>
      ) : null}

      <div className="card input-card">
        <input
          className="input-field"
          placeholder={`Wpisz słowo (Próba ${guesses.length + 1})...`}
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
