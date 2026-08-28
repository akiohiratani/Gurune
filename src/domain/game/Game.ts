import type { Lottery } from '../lottery/Lottery'
import type { Probability } from '../probability'

export type GameSettings = {
  hitProbability: Probability
}

export type GameSession = {
  settings: Readonly<GameSettings>
  lottery: Lottery
}

export type GameStatus = 'idle' | 'running' | 'celebrating' | 'finished'
export type HoldResult = 'pending' | 'hit' | 'miss'

export type Hold = {
  id: string
  result: HoldResult
}

export type WinRecord = {
  patternNumber: number
  holdNumber: number
}
