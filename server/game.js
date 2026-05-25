import { pipeline } from '@xenova/transformers'

export const MAX_ATTEMPTS = 10

const MODEL_ID = 'Xenova/paraphrase-multilingual-MiniLM-L12-v2'
let extractorPromise
const embeddingCache = new Map()

export const sanitizeGuess = (guess) => {
    if (!guess) return ''
    return guess.toString().trim().normalize('NFC').replace(/\s+/g, ' ')
}

const getExtractor = async () => {
    if (!extractorPromise) {
        extractorPromise = pipeline('feature-extraction', MODEL_ID)
    }
    return extractorPromise
}

const toVector = (output) => {
    if (output?.data) return output.data
    if (Array.isArray(output)) return new Float32Array(output.flat(Infinity))
    return new Float32Array()
}

const getEmbedding = async (text) => {
    const key = text.toLowerCase()
    if (embeddingCache.has(key)) {
        return embeddingCache.get(key)
    }

    const extractor = await getExtractor()
    const output = await extractor(text, { pooling: 'mean', normalize: true })
    const vector = toVector(output)
    embeddingCache.set(key, vector)
    return vector
}

const cosineSimilarity = (a, b) => {
    if (!a.length || !b.length) return 0
    const length = Math.min(a.length, b.length)
    let dot = 0
    let normA = 0
    let normB = 0
    for (let i = 0; i < length; i += 1) {
        const ai = a[i]
        const bi = b[i]
        dot += ai * bi
        normA += ai * ai
        normB += bi * bi
    }
    if (!normA || !normB) return 0
    return dot / Math.sqrt(normA * normB)
}

export const scoreGuess = async (secretWord, guess) => {
    const normalizedSecret = sanitizeGuess(secretWord)
    const normalizedGuess = sanitizeGuess(guess)

    if (!normalizedGuess) {
        return {
            temperature: -100,
            result: [],
            isCorrect: false,
        }
    }

    if (normalizedSecret.toLowerCase() === normalizedGuess.toLowerCase()) {
        return {
            temperature: 100,
            result: Array(normalizedGuess.length).fill('correct'),
            isCorrect: true,
        }
    }

    const [secretEmbedding, guessEmbedding] = await Promise.all([
        getEmbedding(normalizedSecret),
        getEmbedding(normalizedGuess),
    ])
    const similarity = cosineSimilarity(secretEmbedding, guessEmbedding)
    const clamped = Math.max(-1, Math.min(1, similarity))
    const temperature = Math.round(clamped * 100)

    return {
        temperature,
        result: Array(normalizedGuess.length).fill('absent'),
        isCorrect: false,
    }
}