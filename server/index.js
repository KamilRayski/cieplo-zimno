import express from 'express'
import { randomBytes, randomUUID, scryptSync, timingSafeEqual } from 'crypto'
import {
    addGuess,
    createAuthSession,
    createSession,
    createUser,
    deleteAuthSession,
    getArchiveEntries,
    getFriendSuggestions,
    getGuesses,
    getHomeFriends,
    getInviteInfo,
    getLeaderboard,
    getOrCreatePuzzle,
    getSessionWithPuzzle,
    getUserByEmail,
    getUserBySessionId,
    initDb,
    updateSession,
} from './db.js'
import { MAX_ATTEMPTS, sanitizeGuess, scoreGuess } from './game.js'

const PORT = process.env.PORT || 4000
const db = await initDb()
const app = express()

app.use(express.json())

const respond = (res, data) => res.json({ data })

const getToday = () => new Date().toISOString().slice(0, 10)

const buildSessionResponse = (session, guesses) => ({
    sessionId: session.id,
    guesses,
    isWon: Boolean(session.is_won),
    attemptsLeft: Math.max(MAX_ATTEMPTS - session.attempts, 0),
    maxAttempts: MAX_ATTEMPTS,
})

const normalizeEmail = (email) => email?.trim().toLowerCase()

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
        deleteAuthSession(db, sessionId)
    }
    return respond(res, { ok: true })
})

app.post('/api/game/start', (req, res) => {
    const { sessionId } = req.body || {}
    const today = getToday()
    const puzzle = getOrCreatePuzzle(db, today)

    let session = sessionId ? getSessionWithPuzzle(db, sessionId) : null

    // Jeśli sesja istnieje, ale dotyczy innej zagadki (z poprzednich dni), odpinamy ją
    if (session && session.puzzleId !== puzzle.id) {
        session = null
    }

    if (!session) {
        const newSessionId = randomUUID()
        createSession(db, newSessionId, puzzle.id)
        session = getSessionWithPuzzle(db, newSessionId)
    }

    const guesses = getGuesses(db, session.id)
    respond(res, buildSessionResponse(session, guesses))
})

app.post('/api/game/guess', async (req, res) => {
    const { sessionId, guess } = req.body || {}

    if (!sessionId) {
        return res.status(400).json({ error: 'Brak identyfikatora sesji.' })
    }

    const session = getSessionWithPuzzle(db, sessionId)
    if (!session) {
        return res.status(404).json({ error: 'Nie znaleziono sesji.' })
    }

    if (session.is_won || session.attempts >= MAX_ATTEMPTS) {
        return res.status(409).json({ error: 'Brak prób na dziś.' })
    }

    const normalizedGuess = sanitizeGuess(guess)
    const { result, temperature, isCorrect } = await scoreGuess(
        session.secretWord,
        normalizedGuess,
    )

    addGuess(db, sessionId, normalizedGuess, temperature, result)
    updateSession(db, sessionId, session.attempts + 1, isCorrect)

    const updatedSession = getSessionWithPuzzle(db, sessionId)
    const guesses = getGuesses(db, sessionId)

    return respond(res, {
        ...buildSessionResponse(updatedSession, guesses),
        temperature,
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

app.get('/api/leaderboard', (_req, res) => {
    respond(res, getLeaderboard(db))
})

app.get('/api/archive', (_req, res) => {
    respond(res, getArchiveEntries(db))
})

app.get('/api/friends', (_req, res) => {
    const invite = getInviteInfo(db)
    respond(res, {
        suggestions: getFriendSuggestions(db),
        inviteLink: invite?.link,
        inviteNote: invite?.note,
    })
})

app.listen(PORT, () => {
    console.log(`Game server running on http://localhost:${PORT}`)
})
