import { useCallback, useEffect, useRef, useState, type CSSProperties } from 'react'
import { gameConfig } from '../../../config/gameConfig'
import type { PrizeList, PrizeResult } from '../../../domain/prize/Prize'

type PrizeRouletteOverlayProps = {
  prizes: PrizeList
  result: PrizeResult
  phase: 'prizeRoulette' | 'prizeResult'
  onStopped: () => void
}

const sectorAngles = [0, 60, 120, 180, 240, 300] as const

export function PrizeRouletteOverlay({
  prizes,
  result,
  phase,
  onStopped,
}: PrizeRouletteOverlayProps) {
  const [isSpinning, setIsSpinning] = useState(false)
  const hasCompletedRef = useRef(false)
  const selectedIndex = result.prizeNumber - 1
  const targetRotation = 3600 - selectedIndex * 60

  const completeSpin = useCallback(() => {
    if (phase !== 'prizeRoulette' || hasCompletedRef.current) return
    hasCompletedRef.current = true
    onStopped()
  }, [onStopped, phase])

  useEffect(() => {
    if (phase !== 'prizeRoulette') return

    const frame = window.requestAnimationFrame(() => setIsSpinning(true))
    const fallback = window.setTimeout(completeSpin, gameConfig.prizeRouletteDurationMs + 300)
    return () => {
      window.cancelAnimationFrame(frame)
      window.clearTimeout(fallback)
    }
  }, [completeSpin, phase])

  const wheelStyle = {
    '--roulette-duration': `${gameConfig.prizeRouletteDurationMs}ms`,
    transform: `rotate(${isSpinning ? targetRotation : 0}deg)`,
  } as CSSProperties

  return (
    <section className={`prize-roulette-overlay prize-roulette-overlay--${phase}`} aria-label="景品抽選">
      <div className="prize-roulette-heading">
        <p className="section-index">PRIZE ROULETTE</p>
        <h2>{phase === 'prizeRoulette' ? '景品抽選中' : '景品決定！'}</h2>
      </div>

      {phase === 'prizeResult' && (
        <div className="prize-winner" role="status" aria-live="assertive">
          <span>今回獲得した景品</span>
          <strong>景品：{result.name}</strong>
        </div>
      )}

      <div className="prize-roulette-viewport" aria-hidden="true">
        <div className="prize-roulette-pointer" />
        <div
          className="prize-roulette-wheel"
          style={wheelStyle}
          onTransitionEnd={(event) => {
            if (event.propertyName === 'transform') completeSpin()
          }}
        >
          {prizes.map((prize, index) => (
            <div
              className="prize-roulette-sector-label"
              style={{ transform: `rotate(${sectorAngles[index]}deg)` }}
              key={`${index}-${prize}`}
            >
              <span className={phase === 'prizeResult' && index === selectedIndex ? 'is-winner' : ''}>
                <small>景品{index + 1}</small>
                {prize}
              </span>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}
