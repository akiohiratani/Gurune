import type { LotteryFactory } from '../../application/ports/LotteryFactory'
import type { Lottery } from '../../domain/lottery/Lottery'
import type { Probability } from '../../domain/probability'
import { RandomLottery } from './RandomLottery'

export class RandomLotteryFactory implements LotteryFactory {
  create(probability: Probability): Lottery {
    return new RandomLottery(probability)
  }
}
