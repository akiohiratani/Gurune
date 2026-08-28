import type { GameSession } from '../../domain/game/Game'
import type { LotteryDrawContext } from '../../domain/lottery/Lottery'

export class DrawHoldUseCase {
  execute(session: GameSession, context: LotteryDrawContext): boolean {
    return session.lottery.draw(context)
  }
}
