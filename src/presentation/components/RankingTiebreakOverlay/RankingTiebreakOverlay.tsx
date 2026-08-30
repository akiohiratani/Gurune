import { useEffect, useMemo, useState } from 'react'
import type { PatternNumber } from '../../../domain/game/Game'
import type { TiebreakKind } from '../../../application/usecases/RankingFlowUseCase'

type RankingTiebreakOverlayProps = {
  kind: TiebreakKind
  candidates: readonly PatternNumber[]
  selectedPattern: PatternNumber
  onComplete: () => void
}

const minimumFocusMoves = 12
const resultDisplayMs = 1500

function createFocusSequence(
  candidates: readonly PatternNumber[],
  selectedPattern: PatternNumber,
): PatternNumber[] {
  const sequence: PatternNumber[] = []
  let candidateIndex = -1

  for (let move = 0; move < minimumFocusMoves; move += 1) {
    candidateIndex = (candidateIndex + 1) % candidates.length
    sequence.push(candidates[candidateIndex])
  }

  while (sequence.at(-1) !== selectedPattern) {
    candidateIndex = (candidateIndex + 1) % candidates.length
    sequence.push(candidates[candidateIndex])
  }

  return sequence
}

function getStepDelay(stepIndex: number, stepCount: number): number {
  const progress = stepIndex / Math.max(stepCount - 1, 1)
  return Math.round(90 + 500 * progress ** 2.35)
}

export function RankingTiebreakOverlay({
  kind,
  candidates,
  selectedPattern,
  onComplete,
}: RankingTiebreakOverlayProps) {
  const focusSequence = useMemo(
    () => createFocusSequence(candidates, selectedPattern),
    [candidates, selectedPattern],
  )
  const [focusedPattern, setFocusedPattern] = useState<PatternNumber | null>(null)
  const [isDecided, setIsDecided] = useState(false)

  useEffect(() => {
    let timeoutId: number | undefined
    let stepIndex = 0

    const focusNext = () => {
      setFocusedPattern(focusSequence[stepIndex])
      stepIndex += 1

      if (stepIndex < focusSequence.length) {
        timeoutId = window.setTimeout(
          focusNext,
          getStepDelay(stepIndex, focusSequence.length),
        )
        return
      }

      setIsDecided(true)
      timeoutId = window.setTimeout(onComplete, resultDisplayMs)
    }

    timeoutId = window.setTimeout(focusNext, getStepDelay(0, focusSequence.length))
    return () => window.clearTimeout(timeoutId)
  }, [focusSequence, onComplete])

  const title = kind === 'first' ? '1位決定' : '最下位決定'

  return (
    <section className="ranking-tiebreak-overlay" aria-labelledby="ranking-tiebreak-title">
      <div className="ranking-tiebreak-heading">
        <p>{kind === 'first' ? 'CHAMPION TIEBREAK' : 'LAST PLACE TIEBREAK'}</p>
        <h2 id="ranking-tiebreak-title">{title}</h2>
      </div>

      <div className="ranking-tiebreak-candidates" aria-live="polite">
        {candidates.map((patternNumber) => {
          const isFocused = focusedPattern === patternNumber
          const isWinner = isDecided && patternNumber === selectedPattern
          return (
            <figure
              className={`ranking-tiebreak-candidate${isFocused ? ' is-focused' : ''}${isWinner ? ' is-decided' : ''}`}
              key={patternNumber}
            >
              <img
                src={`/pattern/member/${patternNumber}.png`}
                alt={`図柄${patternNumber}`}
              />
            </figure>
          )
        })}
      </div>

      <div
        className={`ranking-tiebreak-result${isDecided ? ' is-visible' : ''}`}
        aria-live="polite"
      >
        {isDecided ? `${title}：図柄${selectedPattern}` : '\u00a0'}
      </div>
    </section>
  )
}
