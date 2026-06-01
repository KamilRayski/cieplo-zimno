import type { Tone } from '../types'

export const toneFromTemperature = (temperature: number): Tone => {
  if (temperature >= 50) return 'hot'
  if (temperature >= 0) return 'warm'
  return 'cold'
}

export const formatTemperature = (temperature: number) => `${temperature}°C`

export const formatAttempts = (attempts: number) => `${attempts} prób`

export const getAvatarUrl = (seed: string) =>
  `https://api.dicebear.com/9.x/micah/svg?seed=${encodeURIComponent(seed)}&backgroundColor=transparent`
