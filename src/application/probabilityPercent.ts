import { createProbability, type Probability } from '../domain/probability'

export type ProbabilityPercentResult =
  | { valid: true; probability: Probability }
  | { valid: false; message: string }

export function parseProbabilityPercent(input: string): ProbabilityPercentResult {
  if (input.trim() === '') {
    return { valid: false, message: '当選確率を入力してください' }
  }

  const percent = Number(input)
  if (!Number.isFinite(percent)) {
    return { valid: false, message: '数値で入力してください' }
  }

  if (percent < 0 || percent > 100) {
    return { valid: false, message: '0〜100の範囲で入力してください' }
  }

  return { valid: true, probability: createProbability(percent / 100) }
}

export function probabilityToPercent(probability: Probability): string {
  return Number((probability * 100).toFixed(1)).toString()
}
