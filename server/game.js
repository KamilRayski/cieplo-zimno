export const MAX_ATTEMPTS = 6

export const sanitizeGuess = (guess) => guess.trim().toUpperCase()

/**
 * Funkcja oceniająca w 100% semantycznie (skala -100 do 100).
 * 
 * Docelowo powinieneś w tym miejscu wykonać zapytanie do API (np. OpenAI Embeddings)
 * lub odpytać lokalny model NLP (np. Python + FastText), aby obliczyć 
 * rzeczywiste "cosine similarity". Funkcja jest `async` w celu ułatwienia tej integracji.
 */
export const scoreGuess = async (secretWord, guess) => {
    const normalizedSecret = sanitizeGuess(secretWord)
    const normalizedGuess = sanitizeGuess(guess)

    if (normalizedSecret === normalizedGuess) {
        return {
            temperature: 100,
            result: Array(normalizedGuess.length).fill('correct'),
            isCorrect: true,
        }
    }

    // PONIŻEJ MOCK (Zastępcza logika na potrzeby testów):
    // Tworzymy pseudolosową, ale deterministyczną temperaturę na bazie słowa
    // aby frontend mógł reagować na RÓŻNE wartości z przedziału -100 do 99.
    let hash = 0;
    for (let i = 0; i < normalizedGuess.length; i++) {
        hash = ((hash << 5) - hash) + normalizedGuess.charCodeAt(i);
        hash |= 0;
    }

    // Skalujemy wynik do przedziału -100 ... 99
    const temperature = (Math.abs(hash) % 200) - 100;

    return {
        temperature,
        result: Array(normalizedGuess.length).fill('absent'), // Całkowicie pomijamy sprawdzanie liter
        isCorrect: false,
    }
}