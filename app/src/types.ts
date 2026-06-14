export type Tone = 'hot' | 'warm' | 'cold'

export type Guess = {
  word: string
  temperature: number
  rank?: number | null
  result: Array<'correct' | 'present' | 'absent'>
  createdAt: string
}

export type HomeFriend = {
  name: string
  status: string
  temperature: number
  label: string
  tone: Tone
}

export type HomeData = {
  bestShot: {
    word: string
    temperature: number
    attempts: number
  } | null
  friends: HomeFriend[]
}

export type LeaderboardEntry = {
  rank: number
  name: string
  temperature: number
  attempts: number
  avgTemp: number
}

export type ArchiveEntry = {
  rawDate: string
  date: string
  day: string
  label: string
  word: string
  rank: string
  percent: string
  progress: number
  temperature: number
  attempts: number
  tone: Tone
}

export type FriendSuggestion = {
  name: string
  info: string
}

export type FriendsData = {
  suggestions: FriendSuggestion[]
  inviteLink: string
  inviteNote: string
}

export type GameStartResponse = {
  sessionId: string
  guesses: Guess[]
  isWon: boolean
  attemptsLeft: number
  maxAttempts: number
}

export type GameGuessResponse = GameStartResponse & {
  temperature: number
  result: Array<'correct' | 'present' | 'absent'>
}

export type AuthUser = {
  id: number
  name: string
  email: string
}

export type AuthResponse = {
  sessionId: string
  user: AuthUser
}

export type AuthMeResponse = {
  user: AuthUser | null
}
