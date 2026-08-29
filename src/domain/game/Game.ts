import type { Lottery } from '../lottery/Lottery'
import type { Probability } from '../probability'

export type GameSettings = {
  hitProbability: Probability
}

export type GameSession = {
  settings: Readonly<GameSettings>
  lottery: Lottery
}

// playingWinMovieを独立した状態にすることで、動画再生中にrunningの抽選処理が動くことを防ぎます。
export type GameStatus = 'idle' | 'running' | 'celebrating' | 'playingWinMovie' | 'finished'
export type HoldResult = 'pending' | 'hit' | 'miss'

export type Hold = {
  id: string
  result: HoldResult
}

export type WinRecord = {
  patternNumber: number
  holdNumber: number
}
