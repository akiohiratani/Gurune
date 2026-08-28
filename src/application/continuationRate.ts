import { parseProbabilityPercent } from './probabilityPercent'

export type ContinuationRateResult =
  | { valid: true; percent: number }
  | { valid: false }

/**
 * 1回あたりの当選確率から、指定回数以内に1回以上当選する確率を求めます。
 */
export function calculateContinuationRate(
  probabilityPercent: string,
  drawCount: number,
): ContinuationRateResult {
  const parsed = parseProbabilityPercent(probabilityPercent)
  if (!parsed.valid || !Number.isInteger(drawCount) || drawCount < 1) {
    return { valid: false }
  }

  const probability = 1 - (1 - parsed.probability) ** drawCount
  return {
    valid: true,
    percent: Number((probability * 100).toFixed(1)),
  }
}
