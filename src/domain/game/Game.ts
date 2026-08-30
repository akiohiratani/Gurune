import type { Lottery } from '../lottery/Lottery'
import type { Probability } from '../probability'
import type { PrizeList } from '../prize/Prize'

export type GameSettings = {
  hitProbability: Probability
  /** ゲーム開始前に確定した、各図柄の色分類です。 */
  patternColors: Readonly<PatternColorAssignments>
  /** ゲーム開始時に一度だけシャッフルされた、色ごとの×3昇格確率です。 */
  colorUpgradeProbabilities: Readonly<ColorUpgradeProbabilities>
  /** 開始時に検証・固定された、均等抽選対象の6景品です。 */
  prizes: PrizeList
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
  | 'prizeRoulette'
  | 'prizeResult'
  | 'finished'
export type HoldResult = 'pending' | 'hit' | 'miss'

export type Hold = {
  id: string
  result: HoldResult
}

export type WinRecord = {
  // ×3演出で7を表示しても、ここには最初に当選した図柄番号を保持します。
  patternNumber: PatternNumber
  holdNumber: number
  // この1回の大当たりをResult上で何回分として加算するかを表します。
  multiplier: WinMultiplier
}

// 倍率、色、昇格確率候補をDomain定数として集約し、UI側へ業務ルールを漏らしません。
export const NORMAL_WIN_MULTIPLIER = 1 as const
export const SPECIAL_WIN_MULTIPLIER = 3 as const
export const PATTERN_NUMBERS = [1, 2, 3, 4, 5, 6] as const
export const WIN_COLORS = ['red', 'blue', 'yellow'] as const
export const WIN_UPGRADE_PROBABILITIES = [0.5, 0.3, 0.2] as const

export type WinMultiplier =
  | typeof NORMAL_WIN_MULTIPLIER
  | typeof SPECIAL_WIN_MULTIPLIER

export type PatternNumber = (typeof PATTERN_NUMBERS)[number]
export type WinColor = (typeof WIN_COLORS)[number]
export type WinUpgradeProbability = (typeof WIN_UPGRADE_PROBABILITIES)[number]
export type PatternColorSelection = Record<PatternNumber, WinColor | null>
export type PatternColorAssignments = Record<PatternNumber, WinColor>
export type ColorUpgradeProbabilities = Record<WinColor, WinUpgradeProbability>

export type PatternColorValidationResult =
  | { valid: true; assignments: PatternColorAssignments }
  | {
      valid: false
      unassignedPatterns: PatternNumber[]
      colorsWithoutPatterns: WinColor[]
    }

// 動画終了までは倍率が未確定なので、元図柄と保留位置だけを一時保持します。
export type PendingWin = Omit<WinRecord, 'multiplier'>

/**
 * 0以上1未満の抽選値と、当選図柄の色に割り当てられた確率から倍率を決定します。
 * 確率値未満だけを特別倍率とするため、確率と等しい境界値は通常倍率になります。
 */
export function determineWinMultiplier(
  randomValue: number,
  upgradeProbability: WinUpgradeProbability,
): WinMultiplier {
  if (!Number.isFinite(randomValue) || randomValue < 0 || randomValue >= 1) {
    throw new RangeError('randomValue must be between 0 (inclusive) and 1 (exclusive).')
  }

  return randomValue < upgradeProbability
    ? SPECIAL_WIN_MULTIPLIER
    : NORMAL_WIN_MULTIPLIER
}

/** 初期表示用に、全図柄が未割り当ての選択状態を生成します。 */
export function createEmptyPatternColorSelection(): PatternColorSelection {
  return { 1: null, 2: null, 3: null, 4: null, 5: null, 6: null }
}

/**
 * 全図柄がいずれか1色へ割り当て済みで、かつ全3色が1図柄以上を持つことを検証します。
 * Recordで図柄ごとの色を1つだけ保持するため、同一図柄の色重複は構造上発生しません。
 */
export function validatePatternColorSelection(
  selection: Readonly<PatternColorSelection>,
): PatternColorValidationResult {
  const unassignedPatterns = PATTERN_NUMBERS.filter(
    (patternNumber) => selection[patternNumber] === null,
  )
  const colorsWithoutPatterns = WIN_COLORS.filter(
    (color) => !PATTERN_NUMBERS.some((patternNumber) => selection[patternNumber] === color),
  )

  if (unassignedPatterns.length > 0 || colorsWithoutPatterns.length > 0) {
    return { valid: false, unassignedPatterns, colorsWithoutPatterns }
  }

  return {
    valid: true,
    assignments: { ...selection } as PatternColorAssignments,
  }
}

/** 当選した元図柄から色を引き、そのゲームで固定された×3昇格確率を返します。 */
export function getUpgradeProbabilityForPattern(
  settings: Readonly<GameSettings>,
  patternNumber: PatternNumber,
): WinUpgradeProbability {
  const color = settings.patternColors[patternNumber]
  return settings.colorUpgradeProbabilities[color]
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
