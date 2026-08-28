export type LotteryDrawContext = {
  holdId: string
  holdIndex: number
}

export interface Lottery {
  draw(context: LotteryDrawContext): boolean
}
