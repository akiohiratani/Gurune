import type { GameSession } from '../../domain/game/Game'
import type { LotteryFactory } from '../ports/LotteryFactory'
import { parseProbabilityPercent } from '../probabilityPercent'

export type StartGameResult =
  | { ok: true; session: GameSession }
  | { ok: false; message: string }

export class StartGameUseCase {
  private readonly lotteryFactory: LotteryFactory

  constructor(lotteryFactory: LotteryFactory) {
    this.lotteryFactory = lotteryFactory
  }

  execute(probabilityPercent: string): StartGameResult {
    const parsed = parseProbabilityPercent(probabilityPercent)
    if (!parsed.valid) {
      return { ok: false, message: parsed.message }
    }

    const settings = Object.freeze({ hitProbability: parsed.probability })
    return {
      ok: true,
      session: {
        settings,
        lottery: this.lotteryFactory.create(settings.hitProbability),
      },
    }
  }
}
