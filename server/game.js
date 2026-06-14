import fs from 'fs'
import path from 'path'

export const MAX_ATTEMPTS = 10

// Wczytywanie ranking.json przy starcie
const RANKING_PATH = path.resolve(process.cwd(), 'data', 'ranking.json')
let rankings = {}

try {
    if (fs.existsSync(RANKING_PATH)) {
        rankings = JSON.parse(fs.readFileSync(RANKING_PATH, 'utf-8'))
    } else {
        // Fallback w razie uruchomienia w innym katalogu (np. na Vercelu)
        const alternativePath = path.resolve(process.cwd(), 'server', 'data', 'ranking.json')
        if (fs.existsSync(alternativePath)) {
            rankings = JSON.parse(fs.readFileSync(alternativePath, 'utf-8'))
        }
    }
} catch (error) {
    console.error('Failed to load ranking.json:', error)
}

export const sanitizeGuess = (guess) => {
    if (!guess) return ''
    return guess.toString().trim().normalize('NFC').replace(/\s+/g, ' ')
}

export const scoreGuess = async (secretWord, guess) => {
    const normalizedSecret = sanitizeGuess(secretWord).toLowerCase()
    const normalizedGuess = sanitizeGuess(guess).toLowerCase()

    if (!normalizedGuess) {
        return {
            temperature: -100,
            result: [],
            isCorrect: false,
        }
    }

    if (normalizedSecret === normalizedGuess) {
        return {
            temperature: 100,
            result: Array(guess.length).fill('correct'),
            isCorrect: true,
        }
    }

    // Sprawdzenie w rankingu dla danego hasła dnia
    const secretWordRankings = rankings[normalizedSecret]
    let temperature = 15 // Domyślna niska temperatura (Zimno)

    if (secretWordRankings && secretWordRankings[normalizedGuess] !== undefined) {
        temperature = secretWordRankings[normalizedGuess]
    }

    return {
        temperature,
        result: Array(guess.length).fill('absent'),
        isCorrect: false,
    }
}