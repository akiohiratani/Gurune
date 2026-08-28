import type { Lottery } from '../../domain/lottery/Lottery'
import type { Probability } from '../../domain/probability'

export interface LotteryFactory {
  create(probability: Probability): Lottery
}
