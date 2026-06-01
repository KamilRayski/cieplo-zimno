export const getSessionId = () => {
  try {
    return localStorage.getItem('sessionId')
  } catch {
    return null
  }
}

export const getAuthSessionId = () => {
  try {
    return localStorage.getItem('authSessionId')
  } catch {
    return null
  }
}

export const setSessionId = (sessionId: string) => {
  try {
    localStorage.setItem('sessionId', sessionId)
  } catch {
    // Ignore write errors (e.g. private mode).
  }
}

export const clearSessionId = () => {
  try {
    localStorage.removeItem('sessionId')
  } catch {
    // Ignore write errors (e.g. private mode).
  }
}

export const setAuthSessionId = (sessionId: string) => {
  try {
    localStorage.setItem('authSessionId', sessionId)
  } catch {
    // Ignore write errors (e.g. private mode).
  }
}

export const clearAuthSessionId = () => {
  try {
    localStorage.removeItem('authSessionId')
  } catch {
    // Ignore write errors (e.g. private mode).
  }
}
