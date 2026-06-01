import { useEffect, useMemo, useState } from 'react'
import { apiRequest } from '../lib/api'
import { formatTemperature, toneFromTemperature } from '../lib/format'
import { getAuthSessionId, getSessionId, setSessionId } from '../lib/session'
import type { GameGuessResponse, GameStartResponse, Guess } from '../types'
import { FlameIcon } from '../components/icons'
import { withDelay } from '../lib/withDelay'

export default function GameScreen() {
  const [sessionId, setSessionIdState] = useState<string | null>(null)
  const [guesses, setGuesses] = useState<Guess[]>([])
  const [input, setInput] = useState('')
  const [status, setStatus] = useState<'loading' | 'ready' | 'submitting'>(
    'loading',
  )
  const [error, setError] = useState<string | null>(null)
  const [isWon, setIsWon] = useState(false)

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
        const authSessionId = getAuthSessionId()
        if (!authSessionId) {
          setError('Zaloguj się, aby rozpocząć grę.')
          return
        }
        const payload = await apiRequest<GameStartResponse>('/game/start', {
          method: 'POST',
          json: stored
            ? { sessionId: stored, authSessionId }
            : { authSessionId },
        })
        setSessionIdState(payload.sessionId)
        setSessionId(payload.sessionId)
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
  }, [])

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

      {/* licznik prób usunięty */}

      {isBusy && status === 'loading' ? (
        <div className="game-status">Ładuję grę...</div>
      ) : null}
      {error ? <div className="game-status game-status--error">{error}</div> : null}
      {isWon ? (
        <div className="game-status game-status--success">
          Brawo! Osiągnąłeś 100°C.
        </div>
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
