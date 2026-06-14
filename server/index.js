import express from 'express'
import { randomBytes, randomUUID, scryptSync, timingSafeEqual } from 'crypto'
import {
    addGuess,
    createAuthSession,
    createSession,
    createUser,
    deleteAuthSession,
    getSessionForUserAndPuzzle,
    getFriendSuggestions,
    getGuesses,
    getHomeFriends,
    getInviteInfo,
    getLeaderboard,
    getOrCreatePuzzle,
    getSessionWithPuzzle,
    getSessionsForUser,
    getUserByEmail,
    getUserBySessionId,
    getUserWithPasswordBySessionId,
    initDb,
    resetUserAttemptsForDate,
    setSessionUser,
    updateUserPassword,
    updateSession,
} from './db.js'
import { MAX_ATTEMPTS, sanitizeGuess, scoreGuess, getRankOfWord } from './game.js'
import { words } from './seedData.js'

const PORT = process.env.PORT || 4000
const db = await initDb()
const app = express()

app.use(express.json())

const respond = (res, data) => res.json({ data })

const getToday = () => {
    const date = new Date()
    const offset = date.getTimezoneOffset()
    const localDate = new Date(date.getTime() - offset * 60 * 1000)
    return localDate.toISOString().slice(0, 10)
}

const buildSessionResponse = (session, guesses) => {
    const activeGuesses = session.attempts < guesses.length ? guesses.slice(guesses.length - session.attempts) : guesses
    const guessesWithRank = activeGuesses.map((g) => {
        if (g.rank === null || g.rank === undefined) {
            return {
                ...g,
                rank: getRankOfWord(session.secretWord, g.word),
            }
        }
        return g
    })
    return {
        sessionId: session.id,
        guesses: guessesWithRank,
        isWon: Boolean(session.is_won),
        attemptsLeft: Math.max(MAX_ATTEMPTS - session.attempts, 0),
        maxAttempts: MAX_ATTEMPTS,
    }
}

const normalizeEmail = (email) => email?.trim().toLowerCase()

const getAuthSessionIdFromRequest = (req) => {
    if (req.body?.authSessionId) return req.body.authSessionId
    if (typeof req.query.authSessionId === 'string') return req.query.authSessionId
    return null
}

const requireAuthUser = (req, res) => {
    const authSessionId = getAuthSessionIdFromRequest(req)
    if (!authSessionId) {
        res.status(401).json({ error: 'Zaloguj się, aby kontynuować.' })
        return null
    }
    const user = getUserBySessionId(db, authSessionId)
    if (!user) {
        res.status(401).json({ error: 'Sesja wygasła. Zaloguj się ponownie.' })
        return null
    }
    return { user, authSessionId }
}

const hashPassword = (password) => {
    const salt = randomBytes(16).toString('hex')
    const hash = scryptSync(password, salt, 64).toString('hex')
    return `${salt}:${hash}`
}

const verifyPassword = (password, storedHash) => {
    if (!storedHash) return false
    const [salt, hash] = storedHash.split(':')
    if (!salt || !hash) return false
    const derived = scryptSync(password, salt, 64)
    const storedBuffer = Buffer.from(hash, 'hex')
    return storedBuffer.length === derived.length &&
        timingSafeEqual(storedBuffer, derived)
}

const toLocalDate = (dateString) => new Date(`${dateString}T00:00:00`)

const dayNumber = (date) =>
    Math.floor(Date.UTC(date.getFullYear(), date.getMonth(), date.getDate()) / 86400000)

const capitalize = (value) =>
    value ? value.charAt(0).toUpperCase() + value.slice(1) : value

const formatArchiveDate = (dateString) => {
    const formatted = new Intl.DateTimeFormat('pl-PL', {
        day: '2-digit',
        month: 'short',
    }).format(toLocalDate(dateString))
    const clean = formatted.replace('.', '')
    const [day, month] = clean.split(' ')
    if (!day || !month) return clean
    return `${day} ${capitalize(month)}`
}

const formatArchiveDay = (dateString) =>
    capitalize(
        new Intl.DateTimeFormat('pl-PL', { weekday: 'long' }).format(
            toLocalDate(dateString),
        ),
    )

const toneFromTemperature = (temperature) => {
    if (temperature >= 50) return 'hot'
    if (temperature >= 0) return 'warm'
    return 'cold'
}

app.get('/api/health', (_req, res) => {
    respond(res, { status: 'ok' })
})

app.post('/api/auth/register', (req, res) => {
    const { name, email, password } = req.body || {}
    if (!name?.trim()) {
        return res.status(400).json({ error: 'Podaj imię i nazwisko.' })
    }
    if (!email?.trim()) {
        return res.status(400).json({ error: 'Podaj adres e-mail.' })
    }
    if (!password) {
        return res.status(400).json({ error: 'Podaj hasło.' })
    }

    const normalizedEmail = normalizeEmail(email)
    const existing = getUserByEmail(db, normalizedEmail)
    if (existing) {
        return res.status(409).json({ error: 'Taki adres e-mail już istnieje.' })
    }

    const passwordHash = hashPassword(password)
    const user = createUser(db, name.trim(), normalizedEmail, passwordHash)
    const sessionId = randomUUID()
    createAuthSession(db, sessionId, user.id)

    return respond(res, { sessionId, user })
})

app.post('/api/auth/google', (req, res) => {
    const { email, name } = req.body || {}
    if (!email?.trim()) {
        return res.status(400).json({ error: 'Brak adresu e-mail z konta Google.' })
    }

    const normalizedEmail = normalizeEmail(email)
    const displayName = name?.trim() || normalizedEmail.split('@')[0]
    let user = getUserByEmail(db, normalizedEmail)

    if (!user) {
        const passwordHash = hashPassword(randomBytes(32).toString('hex'))
        user = createUser(db, displayName, normalizedEmail, passwordHash)
    }

    const sessionId = randomUUID()
    createAuthSession(db, sessionId, user.id)

    return respond(res, {
        sessionId,
        user: {
            id: user.id,
            name: user.name,
            email: user.email,
        },
    })
})

app.post('/api/auth/login', (req, res) => {
    const { email, password } = req.body || {}
    if (!email?.trim()) {
        return res.status(400).json({ error: 'Podaj adres e-mail.' })
    }
    if (!password) {
        return res.status(400).json({ error: 'Podaj hasło.' })
    }

    const normalizedEmail = normalizeEmail(email)
    const user = getUserByEmail(db, normalizedEmail)
    if (!user || !verifyPassword(password, user.passwordHash)) {
        return res.status(401).json({ error: 'Nieprawidłowy e-mail lub hasło.' })
    }

    const sessionId = randomUUID()
    createAuthSession(db, sessionId, user.id)

    return respond(res, {
        sessionId,
        user: {
            id: user.id,
            name: user.name,
            email: user.email,
        },
    })
})

app.post('/api/auth/change-password', (req, res) => {
    const { authSessionId, currentPassword, newPassword } = req.body || {}
    if (!authSessionId) {
        return res.status(401).json({ error: 'Brak sesji logowania.' })
    }
    if (!currentPassword) {
        return res.status(400).json({ error: 'Podaj obecne hasło.' })
    }
    if (!newPassword) {
        return res.status(400).json({ error: 'Podaj nowe hasło.' })
    }

    const user = getUserWithPasswordBySessionId(db, authSessionId)
    if (!user) {
        return res.status(401).json({ error: 'Sesja wygasła. Zaloguj się ponownie.' })
    }
    if (!verifyPassword(currentPassword, user.passwordHash)) {
        return res.status(401).json({ error: 'Nieprawidłowe obecne hasło.' })
    }

    const nextHash = hashPassword(newPassword)
    updateUserPassword(db, user.id, nextHash)

    return respond(res, { ok: true })
})

app.get('/api/auth/me', (req, res) => {
    const sessionId =
        typeof req.query.sessionId === 'string' ? req.query.sessionId : null
    if (!sessionId) {
        return respond(res, { user: null })
    }

    const user = getUserBySessionId(db, sessionId)
    return respond(res, { user: user ?? null })
})

app.post('/api/auth/logout', (req, res) => {
    const { sessionId } = req.body || {}
    if (sessionId) {
        const user = getUserBySessionId(db, sessionId)
        if (user) {
            resetUserAttemptsForDate(db, user.id, getToday())
        }
        deleteAuthSession(db, sessionId)
    }
    return respond(res, { ok: true })
})

app.post('/api/game/start', (req, res) => {
    const auth = requireAuthUser(req, res)
    if (!auth) return
    const { user } = auth
    const { sessionId, date } = req.body || {}
    const today = getToday()

    // Walidacja daty archiwalnej
    let targetDate = today
    if (date && typeof date === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(date)) {
        if (date > today) {
            return res.status(400).json({ error: 'Nie można grać w przyszłe dni.' })
        }
        targetDate = date
    }

    // Deterministyczny wybór hasła z puli na podstawie numeru dnia
    const wordIndex = dayNumber(new Date(targetDate)) % words.length
    const puzzle = getOrCreatePuzzle(db, targetDate, words[wordIndex])

    let session = sessionId ? getSessionWithPuzzle(db, sessionId) : null

    // Jeśli sesja istnieje, ale dotyczy innej zagadki, odpinamy ją
    if (session && session.puzzleId !== puzzle.id) {
        session = null
    }

    if (session && session.userId && session.userId !== user.id) {
        session = null
    }

    if (session && !session.userId) {
        setSessionUser(db, session.id, user.id)
        session = getSessionWithPuzzle(db, session.id)
    }

    if (!session) {
        session = getSessionForUserAndPuzzle(db, user.id, puzzle.id)
    }

    if (!session) {
        const newSessionId = randomUUID()
        createSession(db, newSessionId, puzzle.id, user.id)
        session = getSessionWithPuzzle(db, newSessionId)
    }

    console.log(`\n[DEBUG] Hasło (${targetDate}): ${session.secretWord}\n`)

    const guesses = getGuesses(db, session.id)
    respond(res, { ...buildSessionResponse(session, guesses), date: targetDate })
})

app.post('/api/game/guess', async (req, res) => {
    const auth = requireAuthUser(req, res)
    if (!auth) return
    const { user } = auth
    const { sessionId, guess } = req.body || {}

    if (!sessionId) {
        return res.status(400).json({ error: 'Brak identyfikatora sesji.' })
    }

    const session = getSessionWithPuzzle(db, sessionId)
    if (!session) {
        return res.status(404).json({ error: 'Nie znaleziono sesji.' })
    }

    if (session.userId && session.userId !== user.id) {
        return res.status(403).json({ error: 'Brak dostępu do tej sesji.' })
    }

    if (!session.userId) {
        setSessionUser(db, session.id, user.id)
    }

    // attempts limit removed — allow unlimited guesses

    const normalizedGuess = sanitizeGuess(guess)
    if (!normalizedGuess) {
        return res.status(400).json({ error: 'Podaj słowo.' })
    }
    const { result, temperature, rank, isCorrect, error } = await scoreGuess(
        session.secretWord,
        normalizedGuess,
    )

    if (error) {
        return res.status(400).json({ error })
    }

    let adjustedTemp = temperature;
    if (!isCorrect) {
        if (temperature > 0) {
            adjustedTemp = Math.round(Math.pow(Math.min(temperature, 100) / 100, 0.5) * 100);
        }

        if (normalizedGuess.includes(session.secretWord) || session.secretWord.includes(normalizedGuess)) {
            adjustedTemp = Math.max(adjustedTemp, 95);
        }
    }

    addGuess(db, sessionId, normalizedGuess, adjustedTemp, rank, result)
    updateSession(db, sessionId, session.attempts + 1, isCorrect)

    const updatedSession = getSessionWithPuzzle(db, sessionId)
    const guesses = getGuesses(db, sessionId)

    return respond(res, {
        ...buildSessionResponse(updatedSession, guesses),
        temperature: adjustedTemp,
        rank,
        result,
    })
})

app.get('/api/home', (req, res) => {
    const sessionId =
        typeof req.query.sessionId === 'string' ? req.query.sessionId : null
    const guesses = sessionId ? getGuesses(db, sessionId) : []

    let bestShot = null
    if (guesses.length > 0) {
        const best = guesses.reduce((current, guess) =>
            guess.temperature > current.temperature ? guess : current,
        )
        bestShot = {
            word: best.word,
            temperature: best.temperature,
            attempts: guesses.length,
        }
    }

    respond(res, { bestShot, friends: getHomeFriends(db) })
})

app.get('/api/leaderboard', (req, res) => {
    const date = typeof req.query.date === 'string' ? req.query.date : getToday()
    respond(res, getLeaderboard(db, date))
})

app.get('/api/archive', (req, res) => {
    const auth = requireAuthUser(req, res)
    if (!auth) return
    const sessions = getSessionsForUser(db, auth.user.id)

    const leaderboard = getLeaderboard(db, 10000)
    const userRankEntry = leaderboard.find((entry) => entry.name === auth.user.name)
    const userRank = userRankEntry ? `#${userRankEntry.rank}` : '#-'

    const entries = sessions
        .map((session) => {
            const guesses = getGuesses(db, session.id)
            if (guesses.length === 0) return null
            const best = guesses.reduce((current, guess) =>
                guess.temperature > current.temperature ? guess : current,
            )
            const progress = Math.max(
                0,
                Math.min(100, Math.round((best.temperature + 100) / 2)),
            )
            const tone = toneFromTemperature(best.temperature)
            const label = tone === 'hot' ? 'GORĄCO' : tone === 'warm' ? 'CIEPŁO' : 'ZIMNO'

            return {
                rawDate: session.puzzleDate,
                date: formatArchiveDate(session.puzzleDate),
                day: formatArchiveDay(session.puzzleDate),
                label,
                word: best.word,
                rank: userRank,
                percent: `${progress}%`,
                progress,
                temperature: best.temperature,
                attempts: session.attempts,
                tone,
            }
        })
        .filter(Boolean)

    respond(res, entries)
})

app.get('/api/friends', (req, res) => {
    const auth = requireAuthUser(req, res)
    if (!auth) return

    const invite = getInviteInfo(db)
    const baseLink = invite?.link || 'cieplo-zimno.io/invite/u_492'
    const userLink = baseLink.replace(/u_\d+/, `u_${auth.user.id}`)

    respond(res, {
        suggestions: getFriendSuggestions(db),
        inviteLink: userLink,
        inviteNote: invite?.note,
    })
})

if (process.env.NODE_ENV !== 'production' || !process.env.VERCEL) {
    app.listen(PORT, () => {
        console.log(`Game server running on http://localhost:${PORT}`)
    })
}

export default app

