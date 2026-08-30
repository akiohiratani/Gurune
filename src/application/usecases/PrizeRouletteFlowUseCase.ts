import type { GameSettings, GameStatus } from '../../domain/game/Game'
import { drawPrize, type PrizeResult } from '../../domain/prize/Prize'
import type { RandomSource } from '../ports/RandomSource'

export type StartPrizeRouletteTransition = {
  status: 'prizeRoulette'
  result: PrizeResult
}

export type RevealPrizeTransition = {
  status: 'prizeResult'
}

export type CompletePrizeRouletteTransition = {
  status: 'finished'
}

/** 全ゲーム抽選の終了後に、景品抽選とResultまでの状態遷移を管理します。 */
export class PrizeRouletteFlowUseCase {
  private readonly randomSource: RandomSource

  constructor(randomSource: RandomSource) {
    this.randomSource = randomSource
  }

  start(
    currentStatus: GameStatus,
    settings: Readonly<GameSettings> | null,
  ): StartPrizeRouletteTransition | null {
    if (currentStatus !== 'celebrating' || !settings) return null

    return {
      status: 'prizeRoulette',
      // 結果を先に確定し、Presentationはこの結果へ向けてルーレットを停止させます。
      result: drawPrize(this.randomSource.next(), settings.prizes),
    }
  }

  reveal(currentStatus: GameStatus): RevealPrizeTransition | null {
    if (currentStatus !== 'prizeRoulette') return null
    return { status: 'prizeResult' }
  }

  complete(currentStatus: GameStatus): CompletePrizeRouletteTransition | null {
    if (currentStatus !== 'prizeResult') return null
    return { status: 'finished' }
  }
}
