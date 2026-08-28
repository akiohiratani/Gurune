export type Probability = number

export function isValidProbability(value: number): value is Probability {
  return Number.isFinite(value) && value >= 0 && value <= 1
}

export function createProbability(value: number): Probability {
  if (!isValidProbability(value)) {
    throw new RangeError('Probability must be a finite number between 0 and 1.')
  }

  return value
}
