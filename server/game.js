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

// Wczytywanie słownika do sprawdzania poprawności słów
const DICTIONARY_PATH = path.resolve(process.cwd(), 'data', 'dictionary.txt')
const dictionary = new Set()

try {
    let dictContent = ''
    if (fs.existsSync(DICTIONARY_PATH)) {
        dictContent = fs.readFileSync(DICTIONARY_PATH, 'utf-8')
    } else {
        const alternativePath = path.resolve(process.cwd(), 'server', 'data', 'dictionary.txt')
        if (fs.existsSync(alternativePath)) {
            dictContent = fs.readFileSync(alternativePath, 'utf-8')
        }
    }
    if (dictContent) {
        const lines = dictContent.split(/\r?\n/)
        for (const line of lines) {
            const w = line.trim().toLowerCase()
            if (w) dictionary.add(w)
        }
    }
} catch (error) {
    console.error('Failed to load dictionary.txt:', error)
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

    // Sprawdzenie czy słowo istnieje w słowniku lub rankingu
    const secretWordRankings = rankings[normalizedSecret]
    const isInRanking = secretWordRankings && secretWordRankings[normalizedGuess] !== undefined
    const isInDictionary = dictionary.has(normalizedGuess)

    if (normalizedSecret !== normalizedGuess && !isInRanking && !isInDictionary) {
        return {
            error: 'Nie znam tego rzeczownika.',
        }
    }

    if (normalizedSecret === normalizedGuess) {
        return {
            temperature: 100,
            rank: 1,
            result: Array(guess.length).fill('correct'),
            isCorrect: true,
        }
    }

    // Sprawdzenie w rankingu dla danego hasła dnia
    let temperature = -100 // Domyślna niska temperatura (Zimno)
    let rank = null

    if (secretWordRankings) {
        const val = secretWordRankings[normalizedGuess]
        if (val !== undefined) {
            if (Array.isArray(val)) {
                temperature = val[0]
                rank = val[1]
            } else {
                temperature = val
                // Szacowanie pozycji w rankingu na podstawie temperatury
                const totalCount = Object.keys(secretWordRankings).length || 10000
                rank = Math.max(2, Math.round(Math.pow(totalCount, (100 - temperature) / 200)))
            }
        } else {
            const totalCount = Object.keys(secretWordRankings).length || 10000
            rank = totalCount + 1000 // Wyraźnie poza rankingiem
        }
    }

    return {
        temperature,
        rank,
        result: Array(guess.length).fill('absent'),
        isCorrect: false,
    }
}

export const getRankOfWord = (secretWord, word) => {
    const normalizedSecret = sanitizeGuess(secretWord).toLowerCase()
    const normalizedGuess = sanitizeGuess(word).toLowerCase()
    if (normalizedSecret === normalizedGuess) return 1
    const secretWordRankings = rankings[normalizedSecret]
    if (secretWordRankings) {
        const val = secretWordRankings[normalizedGuess]
        if (val !== undefined) {
            return Array.isArray(val) ? val[1] : Math.max(2, Math.round(Math.pow(Object.keys(secretWordRankings).length || 10000, (100 - val) / 200)))
        }
        return (Object.keys(secretWordRankings).length || 10000) + 1000
    }
    return null
}