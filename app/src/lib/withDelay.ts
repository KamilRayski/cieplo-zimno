import type { CSSProperties } from 'react'

type DelayStyle = CSSProperties & { '--delay'?: string }

export const withDelay = (delay: string): DelayStyle => ({ '--delay': delay })
