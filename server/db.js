import fs from 'fs'
import path from 'path'
import initSqlJs from 'sql.js'
import {
    archiveEntries,
    friendSuggestions,
    homeFriends,
    inviteInfo,
    leaderboard,
    words,
} from './seedData.js'

const isVercel = process.env.VERCEL || process.env.NOW_BUILDER;
const DB_DIR = isVercel ? '/tmp/data' : path.resolve(process.cwd(), 'data')
const DB_PATH = path.join(DB_DIR, 'cieplo-zimno.sqlite')

const loadDatabase = async () => {
    const SQL = await initSqlJs({
        locateFile: (file) =>
            path.resolve(process.cwd(), 'node_modules', 'sql.js', 'dist', file),
    })

    if (fs.existsSync(DB_PATH)) {
        const buffer = fs.readFileSync(DB_PATH)
        return new SQL.Database(buffer)
    }

    return new SQL.Database()
}

const createWrapper = (sqlDb) => {
    let inTransaction = 0
    let dirty = false

    const persist = () => {
        if (!dirty) return
        const data = sqlDb.export()
        fs.writeFileSync(DB_PATH, Buffer.from(data))
        dirty = false
    }

    const markDirty = () => {
        dirty = true
        if (inTransaction === 0) {
            persist()
        }
    }

    const prepare = (sql) => ({
        get: (...params) => {
            const stmt = sqlDb.prepare(sql)
            const args = params.length === 1 && Array.isArray(params[0]) ? params[0] : params
            if (args.length > 0) stmt.bind(args)
            let row
            if (stmt.step()) {
                row = stmt.getAsObject()
            }
            stmt.free()
            return row
        },
        all: (...params) => {
            const stmt = sqlDb.prepare(sql)
            const args = params.length === 1 && Array.isArray(params[0]) ? params[0] : params
            if (args.length > 0) stmt.bind(args)
            const rows = []
            while (stmt.step()) {
                rows.push(stmt.getAsObject())
            }
            stmt.free()
            return rows
        },
        run: (...params) => {
            const stmt = sqlDb.prepare(sql)
            const args = params.length === 1 && Array.isArray(params[0]) ? params[0] : params
            if (args.length > 0) stmt.bind(args)
            stmt.step()
            stmt.free()
            const result = sqlDb.exec('SELECT last_insert_rowid() AS id')
            const lastInsertRowid = result?.[0]?.values?.[0]?.[0] ?? 0
            markDirty()
            return { lastInsertRowid }
        },
    })

    const exec = (sql) => {
        sqlDb.exec(sql)
        markDirty()
    }

    const transaction = (fn) => (...args) => {
        inTransaction += 1
        sqlDb.exec('BEGIN')
        try {
            const result = fn(...args)
            sqlDb.exec('COMMIT')
            inTransaction -= 1
            markDirty()
            return result
        } catch (error) {
            sqlDb.exec('ROLLBACK')
            inTransaction -= 1
            throw error
        }
    }

    return {
        exec,
        prepare,
        transaction,
    }
}

export const initDb = async () => {
    fs.mkdirSync(DB_DIR, { recursive: true })
    const sqlDb = await loadDatabase()
    const db = createWrapper(sqlDb)

    db.exec(`
    CREATE TABLE IF NOT EXISTS words (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      word TEXT UNIQUE NOT NULL
    );
    CREATE TABLE IF NOT EXISTS puzzles (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      date TEXT UNIQUE NOT NULL,
      word_id INTEGER NOT NULL,
      FOREIGN KEY (word_id) REFERENCES words (id)
    );
    CREATE TABLE IF NOT EXISTS sessions (
      id TEXT PRIMARY KEY,
      puzzle_id INTEGER NOT NULL,
            user_id INTEGER,
      attempts INTEGER NOT NULL DEFAULT 0,
      is_won INTEGER NOT NULL DEFAULT 0,
      created_at TEXT NOT NULL,
      FOREIGN KEY (puzzle_id) REFERENCES puzzles (id)
    );
    CREATE TABLE IF NOT EXISTS users (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      email TEXT UNIQUE NOT NULL,
      password_hash TEXT NOT NULL,
      created_at TEXT NOT NULL
    );
    CREATE UNIQUE INDEX IF NOT EXISTS idx_users_email ON users (email);
    CREATE TABLE IF NOT EXISTS auth_sessions (
      id TEXT PRIMARY KEY,
      user_id INTEGER NOT NULL,
      created_at TEXT NOT NULL,
      FOREIGN KEY (user_id) REFERENCES users (id)
    );
    CREATE TABLE IF NOT EXISTS guesses (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      session_id TEXT NOT NULL,
      word TEXT NOT NULL,
      temperature INTEGER NOT NULL,
      rank INTEGER,
      result TEXT NOT NULL,
      created_at TEXT NOT NULL,
      FOREIGN KEY (session_id) REFERENCES sessions (id)
    );
    CREATE TABLE IF NOT EXISTS leaderboard (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      rank INTEGER NOT NULL,
      name TEXT NOT NULL,
      temperature INTEGER NOT NULL,
      avg_attempts INTEGER NOT NULL
    );
    CREATE TABLE IF NOT EXISTS home_friends (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      status TEXT NOT NULL,
      temperature REAL NOT NULL,
      label TEXT NOT NULL,
      tone TEXT NOT NULL
    );
    CREATE TABLE IF NOT EXISTS archive_entries (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      date TEXT NOT NULL,
      day TEXT NOT NULL,
      label TEXT NOT NULL,
      word TEXT NOT NULL,
      rank TEXT NOT NULL,
      percent TEXT NOT NULL,
      progress INTEGER NOT NULL,
      tone TEXT NOT NULL
    );
    CREATE TABLE IF NOT EXISTS friend_suggestions (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      info TEXT NOT NULL
    );
    CREATE TABLE IF NOT EXISTS invite_info (
      id INTEGER PRIMARY KEY CHECK (id = 1),
      link TEXT NOT NULL,
      note TEXT NOT NULL
    );
  `)

    ensureSessionUserColumn(db)
    ensureGuessesRankColumn(db)

    seedData(db)
    return db
}

const ensureSessionUserColumn = (db) => {
    const columns = db.prepare('PRAGMA table_info(sessions)').all()
    const hasUserId = columns.some((column) => column.name === 'user_id')
    if (!hasUserId) {
        db.exec('ALTER TABLE sessions ADD COLUMN user_id INTEGER')
    }

    const indexes = db.prepare('PRAGMA index_list(sessions)').all()
    const hasIndex = indexes.some((index) => index.name === 'idx_sessions_user_id')
    if (!hasIndex) {
        db.exec('CREATE INDEX IF NOT EXISTS idx_sessions_user_id ON sessions (user_id)')
    }
}

const ensureGuessesRankColumn = (db) => {
    const columns = db.prepare('PRAGMA table_info(guesses)').all()
    const hasRank = columns.some((column) => column.name === 'rank')
    if (!hasRank) {
        db.exec('ALTER TABLE guesses ADD COLUMN rank INTEGER')
    }
}

const seedData = (db) => {
    // Automatycznie dodaje nowe słowa z seedData.js, pomijając te już istniejące
    const insertWord = db.prepare('INSERT OR IGNORE INTO words (word) VALUES (?)')
    const insertManyWords = db.transaction((items) => {
        for (const word of items) insertWord.run(word)
    })
    insertManyWords(words)

    const leaderboardCount = db
        .prepare('SELECT COUNT(*) as count FROM leaderboard')
        .get().count
    if (leaderboardCount === 0) {
        const insert = db.prepare(
            'INSERT INTO leaderboard (rank, name, temperature, avg_attempts) VALUES (?, ?, ?, ?)',
        )
        const insertMany = db.transaction((items) => {
            for (const item of items) {
                insert.run(item.rank, item.name, item.temperature, item.avgAttempts)
            }
        })
        insertMany(leaderboard)
    }

    const friendsCount = db
        .prepare('SELECT COUNT(*) as count FROM home_friends')
        .get().count
    if (friendsCount === 0) {
        const insert = db.prepare(
            'INSERT INTO home_friends (name, status, temperature, label, tone) VALUES (?, ?, ?, ?, ?)',
        )
        const insertMany = db.transaction((items) => {
            for (const item of items) {
                insert.run(item.name, item.status, item.temperature, item.label, item.tone)
            }
        })
        insertMany(homeFriends)
    }

    const archiveCount = db
        .prepare('SELECT COUNT(*) as count FROM archive_entries')
        .get().count
    if (archiveCount === 0) {
        const insert = db.prepare(
            'INSERT INTO archive_entries (date, day, label, word, rank, percent, progress, tone) VALUES (?, ?, ?, ?, ?, ?, ?, ?)',
        )
        const insertMany = db.transaction((items) => {
            for (const item of items) {
                insert.run(
                    item.date,
                    item.day,
                    item.label,
                    item.word,
                    item.rank,
                    item.percent,
                    item.progress,
                    item.tone,
                )
            }
        })
        insertMany(archiveEntries)
    }

    const suggestionsCount = db
        .prepare('SELECT COUNT(*) as count FROM friend_suggestions')
        .get().count
    if (suggestionsCount === 0) {
        const insert = db.prepare('INSERT INTO friend_suggestions (name, info) VALUES (?, ?)')
        const insertMany = db.transaction((items) => {
            for (const item of items) {
                insert.run(item.name, item.info)
            }
        })
        insertMany(friendSuggestions)
    }

    const inviteCount = db
        .prepare('SELECT COUNT(*) as count FROM invite_info')
        .get().count
    if (inviteCount === 0) {
        db.prepare('INSERT INTO invite_info (id, link, note) VALUES (1, ?, ?)').run(
            inviteInfo.link,
            inviteInfo.note,
        )
    }
}

const hashDate = (dateString) =>
    [...dateString].reduce((acc, char) => acc + char.charCodeAt(0), 0)

const findWordRow = (db, wordText) => {
    const normalized = wordText.trim().toUpperCase()
    return db
        .prepare('SELECT id, word FROM words WHERE UPPER(word) = ?')
        .get(normalized)
}

export const getOrCreatePuzzle = (db, dateString, wordText = null) => {
    const existing = db
        .prepare(
            `
      SELECT puzzles.id, puzzles.date, puzzles.word_id as wordId, words.word
      FROM puzzles
      JOIN words ON words.id = puzzles.word_id
      WHERE puzzles.date = ?
      `,
        )
        .get(dateString)

    if (existing) return existing

    let word = wordText ? findWordRow(db, wordText) : null

    if (!word) {
        const count = db.prepare('SELECT COUNT(*) as count FROM words').get().count
        const offset = hashDate(dateString) % count
        word = db
            .prepare('SELECT id, word FROM words ORDER BY word LIMIT 1 OFFSET ?')
            .get(offset)
    }

    if (!word) {
        throw new Error('Brak hasel w bazie gry.')
    }

    const result = db
        .prepare('INSERT INTO puzzles (date, word_id) VALUES (?, ?)')
        .run(dateString, word.id)

    return {
        id: result.lastInsertRowid,
        date: dateString,
        wordId: word.id,
        word: word.word,
    }
}

export const createSession = (db, sessionId, puzzleId, userId = null) => {
    db.prepare(
        'INSERT INTO sessions (id, puzzle_id, user_id, attempts, is_won, created_at) VALUES (?, ?, ?, 0, 0, ?)')
        .run(sessionId, puzzleId, userId, new Date().toISOString())
}

export const getSessionWithPuzzle = (db, sessionId) =>
    db
        .prepare(
            `
      SELECT sessions.id, sessions.user_id as userId, sessions.attempts, sessions.is_won, puzzles.id as puzzleId,
             words.word as secretWord
      FROM sessions
      JOIN puzzles ON puzzles.id = sessions.puzzle_id
      JOIN words ON words.id = puzzles.word_id
      WHERE sessions.id = ?
      `,
        )
        .get(sessionId)

export const getSessionForUserAndPuzzle = (db, userId, puzzleId) =>
    db
        .prepare(
            `
      SELECT sessions.id, sessions.user_id as userId, sessions.attempts, sessions.is_won,
             puzzles.id as puzzleId, words.word as secretWord
      FROM sessions
      JOIN puzzles ON puzzles.id = sessions.puzzle_id
      JOIN words ON words.id = puzzles.word_id
      WHERE sessions.user_id = ? AND sessions.puzzle_id = ?
      ORDER BY sessions.created_at DESC
      LIMIT 1
      `,
        )
        .get(userId, puzzleId)

export const getSessionsForUser = (db, userId) =>
    db
        .prepare(
            `
      SELECT sessions.id, sessions.user_id as userId, sessions.attempts, sessions.is_won,
             sessions.created_at as createdAt, puzzles.date as puzzleDate,
             words.word as secretWord
      FROM sessions
      JOIN puzzles ON puzzles.id = sessions.puzzle_id
      JOIN words ON words.id = puzzles.word_id
      WHERE sessions.user_id = ?
      ORDER BY puzzles.date DESC, sessions.created_at DESC
      `,
        )
        .all(userId)

export const getGuesses = (db, sessionId) =>
    db
        .prepare(
            'SELECT word, temperature, rank, result, created_at as createdAt FROM guesses WHERE session_id = ? ORDER BY id ASC',
        )
        .all(sessionId)
        .map((row) => ({
            ...row,
            result: JSON.parse(row.result),
        }))

export const addGuess = (db, sessionId, word, temperature, rank, result) => {
    db.prepare(
        'INSERT INTO guesses (session_id, word, temperature, rank, result, created_at) VALUES (?, ?, ?, ?, ?, ?)')
        .run(sessionId, word, temperature, rank, JSON.stringify(result), new Date().toISOString())
}

export const updateSession = (db, sessionId, attempts, isWon) => {
    db.prepare('UPDATE sessions SET attempts = ?, is_won = ? WHERE id = ?').run(
        attempts,
        isWon ? 1 : 0,
        sessionId,
    )
}

export const setSessionUser = (db, sessionId, userId) => {
    db.prepare('UPDATE sessions SET user_id = ? WHERE id = ?').run(userId, sessionId)
}

export const getUserByEmail = (db, email) =>
    db
        .prepare('SELECT id, name, email, password_hash as passwordHash FROM users WHERE email = ?')
        .get(email)

export const createUser = (db, name, email, passwordHash) => {
    const result = db
        .prepare('INSERT INTO users (name, email, password_hash, created_at) VALUES (?, ?, ?, ?)')
        .run(name, email, passwordHash, new Date().toISOString())

    return db
        .prepare('SELECT id, name, email FROM users WHERE id = ?')
        .get(result.lastInsertRowid)
}

export const createAuthSession = (db, sessionId, userId) => {
    db.prepare('INSERT INTO auth_sessions (id, user_id, created_at) VALUES (?, ?, ?)').run(
        sessionId,
        userId,
        new Date().toISOString(),
    )
}

export const getUserBySessionId = (db, sessionId) =>
    db
        .prepare(
            `
      SELECT users.id, users.name, users.email
      FROM auth_sessions
      JOIN users ON users.id = auth_sessions.user_id
      WHERE auth_sessions.id = ?
      `,
        )
        .get(sessionId)

export const getUserWithPasswordBySessionId = (db, sessionId) =>
    db
        .prepare(
            `
      SELECT users.id, users.name, users.email, users.password_hash as passwordHash
      FROM auth_sessions
      JOIN users ON users.id = auth_sessions.user_id
      WHERE auth_sessions.id = ?
      `,
        )
        .get(sessionId)

export const updateUserPassword = (db, userId, passwordHash) => {
    db.prepare('UPDATE users SET password_hash = ? WHERE id = ?').run(
        passwordHash,
        userId,
    )
}

export const deleteAuthSession = (db, sessionId) => {
    db.prepare('DELETE FROM auth_sessions WHERE id = ?').run(sessionId)
}

export const resetUserAttemptsForDate = (db, userId, dateString) => {
    db.prepare(
        `
      UPDATE sessions
      SET attempts = 0
      WHERE user_id = ?
        AND puzzle_id = (SELECT id FROM puzzles WHERE date = ?)
      `,
    ).run(userId, dateString)
}

export const getLeaderboard = (db, dateString, limit = 50) => {
    const rows = db
        .prepare(
            `
            SELECT
                u.name AS name,
                MAX(g.temperature) AS maxTemp,
                COUNT(g.id) AS attempts,
                AVG(g.temperature) AS avgTemp
            FROM users u
            JOIN sessions s ON s.user_id = u.id
            JOIN puzzles p ON p.id = s.puzzle_id
            JOIN guesses g ON g.session_id = s.id
            WHERE p.date = ?
            GROUP BY u.id
            ORDER BY maxTemp DESC, attempts ASC, name ASC
            LIMIT ?
            `,
        )
        .all(dateString, limit)

    return rows.map((row, index) => ({
        rank: index + 1,
        name: row.name,
        temperature: Math.round(row.maxTemp ?? 0),
        attempts: row.attempts,
        avgTemp: row.avgTemp ? Number(row.avgTemp.toFixed(1)) : 0,
    }))
}

export const getHomeFriends = (db) =>
    db
        .prepare(
            'SELECT name, status, temperature, label, tone FROM home_friends ORDER BY id ASC',
        )
        .all()

export const getArchiveEntries = (db) =>
    db
        .prepare(
            'SELECT date, day, label, word, rank, percent, progress, tone FROM archive_entries ORDER BY id ASC',
        )
        .all()

export const getFriendSuggestions = (db) =>
    db.prepare('SELECT name, info FROM friend_suggestions ORDER BY id ASC').all()

export const getInviteInfo = (db) =>
    db.prepare('SELECT link, note FROM invite_info WHERE id = 1').get()
