import type { Lottery, LotteryDrawContext } from '../../domain/lottery/Lottery'
import { createProbability, type Probability } from '../../domain/probability'

export class RandomLottery implements Lottery {
  private readonly probability: Probability

  constructor(probability: number) {
    this.probability = createProbability(probability)
  }

  draw(context: LotteryDrawContext): boolean {
    void context
    return Math.random() < this.probability
  }
}
