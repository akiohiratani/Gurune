import {
  WIN_UPGRADE_PROBABILITIES,
  validatePatternColorSelection,
  type ColorUpgradeProbabilities,
  type GameSession,
  type PatternColorSelection,
  type WinUpgradeProbability,
} from '../../domain/game/Game'
import type { LotteryFactory } from '../ports/LotteryFactory'
import type { RandomSource } from '../ports/RandomSource'
import { parseProbabilityPercent } from '../probabilityPercent'

export type StartGameResult =
  | { ok: true; session: GameSession }
  | { ok: false; message: string }

export class StartGameUseCase {
  private readonly lotteryFactory: LotteryFactory
  private readonly randomSource: RandomSource

  constructor(lotteryFactory: LotteryFactory, randomSource: RandomSource) {
    this.lotteryFactory = lotteryFactory
    this.randomSource = randomSource
  }

  execute(
    probabilityPercent: string,
    patternColorSelection: Readonly<PatternColorSelection>,
  ): StartGameResult {
    const parsed = parseProbabilityPercent(probabilityPercent)
    if (!parsed.valid) {
      return { ok: false, message: parsed.message }
    }

    const colorValidation = validatePatternColorSelection(patternColorSelection)
    if (!colorValidation.valid) {
      return { ok: false, message: '全図柄を割り当て、赤・青・黄をすべて使用してください' }
    }

    // Fisher-Yates法で50%・30%・20%を重複なく並べ替えます。
    // このユースケースはゲーム開始時に一度だけ実行されるため、割り当てはゲーム中固定です。
    const shuffledProbabilities: WinUpgradeProbability[] = [...WIN_UPGRADE_PROBABILITIES]
    for (let index = shuffledProbabilities.length - 1; index > 0; index -= 1) {
      const swapIndex = Math.floor(this.randomSource.next() * (index + 1))
      const current = shuffledProbabilities[index]
      shuffledProbabilities[index] = shuffledProbabilities[swapIndex]
      shuffledProbabilities[swapIndex] = current
    }

    const colorUpgradeProbabilities = Object.freeze({
      red: shuffledProbabilities[0],
      blue: shuffledProbabilities[1],
      yellow: shuffledProbabilities[2],
    }) as Readonly<ColorUpgradeProbabilities>
    const settings = Object.freeze({
      hitProbability: parsed.probability,
      patternColors: Object.freeze({ ...colorValidation.assignments }),
      colorUpgradeProbabilities,
    })

    return {
      ok: true,
      session: {
        settings,
        lottery: this.lotteryFactory.create(settings.hitProbability),
      },
    }
  }
}
