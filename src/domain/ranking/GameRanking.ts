import {
  PATTERN_NUMBERS,
  countPatternWins,
  type PatternNumber,
  type WinRecord,
} from '../game/Game'

export type PatternWinTotal = {
  patternNumber: PatternNumber
  total: number
}

export type GameRanking = {
  totals: readonly PatternWinTotal[]
  firstPlaceCandidates: readonly PatternNumber[]
  lastPlaceCandidates: readonly PatternNumber[]
}

export type PlaceResult = {
  patternNumber: PatternNumber
  total: number
  decidedByTiebreak: boolean
}

export type GameStanding = {
  firstPlace: PlaceResult
  lastPlace: PlaceResult
}

export function calculatePatternWinTotals(
  records: readonly WinRecord[],
): PatternWinTotal[] {
  return PATTERN_NUMBERS.map((patternNumber) => ({
    patternNumber,
    total: countPatternWins(records, patternNumber),
  }))
}

function findCandidates(
  totals: readonly PatternWinTotal[],
  targetTotal: number,
): PatternNumber[] {
  return totals
    .filter(({ total }) => total === targetTotal)
    .map(({ patternNumber }) => patternNumber)
}

export function calculateGameRanking(records: readonly WinRecord[]): GameRanking {
  const totals = calculatePatternWinTotals(records)
  const values = totals.map(({ total }) => total)
  const maximum = Math.max(...values)
  const minimum = Math.min(...values)

  return {
    totals,
    firstPlaceCandidates: findCandidates(totals, maximum),
    lastPlaceCandidates: findCandidates(totals, minimum),
  }
}

export function isTied(candidates: readonly PatternNumber[]): boolean {
  return candidates.length > 1
}

export function decideCandidate(
  candidates: readonly PatternNumber[],
  randomValue: number,
): PatternNumber {
  if (candidates.length === 0) {
    throw new Error('At least one ranking candidate is required.')
  }
  if (!Number.isFinite(randomValue) || randomValue < 0 || randomValue >= 1) {
    throw new RangeError('randomValue must be between 0 (inclusive) and 1 (exclusive).')
  }

  return candidates[Math.floor(randomValue * candidates.length)]
}

export function getPatternTotal(
  ranking: GameRanking,
  patternNumber: PatternNumber,
): number {
  const entry = ranking.totals.find((total) => total.patternNumber === patternNumber)
  if (!entry) throw new Error(`Pattern ${patternNumber} is not in the ranking.`)
  return entry.total
}
