export const PRIZE_COUNT = 6 as const
export const PRIZE_NAME_MAX_LENGTH = 20 as const

export type PrizeNumber = 1 | 2 | 3 | 4 | 5 | 6
export type PrizeInputValues = [string, string, string, string, string, string]
export type PrizeList = readonly [string, string, string, string, string, string]

export type PrizeResult = {
  prizeNumber: PrizeNumber
  name: string
}

export type PrizeValidationResult =
  | { valid: true; prizes: PrizeList }
  | { valid: false; emptyPrizeNumbers: PrizeNumber[]; overLimitPrizeNumbers: PrizeNumber[] }

export function createEmptyPrizeInputs(): PrizeInputValues {
  return ['', '', '', '', '', '']
}

export function validatePrizeInputs(values: readonly string[]): PrizeValidationResult {
  const prizeNumbers = [1, 2, 3, 4, 5, 6] as const
  const emptyPrizeNumbers = prizeNumbers.filter((number) => !values[number - 1]?.trim())
  const overLimitPrizeNumbers = prizeNumbers.filter(
    (number) => Array.from(values[number - 1] ?? '').length > PRIZE_NAME_MAX_LENGTH,
  )

  if (values.length !== PRIZE_COUNT || emptyPrizeNumbers.length > 0 || overLimitPrizeNumbers.length > 0) {
    return { valid: false, emptyPrizeNumbers, overLimitPrizeNumbers }
  }

  return {
    valid: true,
    prizes: [values[0], values[1], values[2], values[3], values[4], values[5]],
  }
}

/** 0以上1未満の乱数を6つの景品へ均等に割り当てます。 */
export function drawPrize(randomValue: number, prizes: PrizeList): PrizeResult {
  if (!Number.isFinite(randomValue) || randomValue < 0 || randomValue >= 1) {
    throw new RangeError('randomValue must be between 0 (inclusive) and 1 (exclusive).')
  }

  const prizeIndex = Math.floor(randomValue * PRIZE_COUNT)
  return {
    prizeNumber: (prizeIndex + 1) as PrizeNumber,
    name: prizes[prizeIndex],
  }
}
