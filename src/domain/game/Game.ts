import type { Lottery } from '../lottery/Lottery'
import type { Probability } from '../probability'

export type GameSettings = {
  hitProbability: Probability
}

export type GameSession = {
  settings: Readonly<GameSettings>
  lottery: Lottery
}

// playingWinMovieとrevealingWinBreakdownをrunningから分離し、
// 動画・内訳演出中に次の抽選用Effectが誤って動き出すことを防ぎます。
export type GameStatus =
  | 'idle'
  | 'running'
  | 'celebrating'
  | 'playingWinMovie'
  | 'revealingWinBreakdown'
  | 'finished'
export type HoldResult = 'pending' | 'hit' | 'miss'

export type Hold = {
  id: string
  result: HoldResult
}

export type WinRecord = {
  // ×3演出で7を表示しても、ここには最初に当選した図柄番号を保持します。
  patternNumber: number
  holdNumber: number
  // この1回の大当たりをResult上で何回分として加算するかを表します。
  multiplier: WinMultiplier
}

// 倍率と確率をDomain定数として集約し、UI側へ業務ルールを漏らしません。
export const NORMAL_WIN_MULTIPLIER = 1 as const
export const SPECIAL_WIN_MULTIPLIER = 3 as const
export const SPECIAL_WIN_PROBABILITY = 0.2

export type WinMultiplier =
  | typeof NORMAL_WIN_MULTIPLIER
  | typeof SPECIAL_WIN_MULTIPLIER

// 動画終了までは倍率が未確定なので、元図柄と保留位置だけを一時保持します。
export type PendingWin = Omit<WinRecord, 'multiplier'>

/**
 * 0以上1未満の抽選値から、今回の大当たりを何回分として数えるか決定します。
 * 0.2未満だけを特別倍率とするため、確率境界の0.2は通常倍率になります。
 */
export function determineWinMultiplier(randomValue: number): WinMultiplier {
  if (!Number.isFinite(randomValue) || randomValue < 0 || randomValue >= 1) {
    throw new RangeError('randomValue must be between 0 (inclusive) and 1 (exclusive).')
  }

  return randomValue < SPECIAL_WIN_PROBABILITY
    ? SPECIAL_WIN_MULTIPLIER
    : NORMAL_WIN_MULTIPLIER
}

/**
 * 元の当選図柄を変えずに確定倍率を付加します。
 * 特別演出で表示する7は履歴へ書き込まず、元図柄に+3する要件を保証します。
 */
export function applyWinMultiplier(pendingWin: PendingWin, multiplier: WinMultiplier): WinRecord {
  return { ...pendingWin, multiplier }
}

/** レコード件数ではなく各倍率を足し、Result用の実当選回数を算出します。 */
export function countWins(records: readonly WinRecord[]): number {
  return records.reduce((total, record) => total + record.multiplier, 0)
}

export function countPatternWins(
  records: readonly WinRecord[],
  patternNumber: number,
): number {
  // 対象図柄だけへ絞った後も共通の倍率加算ルールを利用します。
  return countWins(records.filter((record) => record.patternNumber === patternNumber))
}
