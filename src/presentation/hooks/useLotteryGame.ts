import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import type { LotteryFactory } from '../../application/ports/LotteryFactory'
import type { WinPatternSelector } from '../../application/ports/WinPatternSelector'
import { calculateContinuationRate } from '../../application/continuationRate'
import { parseProbabilityPercent, probabilityToPercent } from '../../application/probabilityPercent'
import { DrawHoldUseCase } from '../../application/usecases/DrawHoldUseCase'
import { SelectWinPatternUseCase } from '../../application/usecases/SelectWinPatternUseCase'
import { StartGameUseCase } from '../../application/usecases/StartGameUseCase'
import { gameConfig } from '../../config/gameConfig'
import type { GameSession, GameStatus, Hold, WinRecord } from '../../domain/game/Game'

function createHolds(): Hold[] {
  return Array.from({ length: gameConfig.initialCount }, (_, index) => ({
    id: `hold-${index + 1}`,
    result: 'pending',
  }))
}

function getPatternNumber(imagePath: string): number {
  const match = imagePath.match(/\/(\d+)\.png$/)
  return match ? Number(match[1]) : 0
}

export function useLotteryGame(lotteryFactory: LotteryFactory, winPatternSelector: WinPatternSelector) {
  const [status, setStatus] = useState<GameStatus>('idle')
  const [probabilityPercent, setProbabilityPercent] = useState(() =>
    probabilityToPercent(gameConfig.defaultHitProbability),
  )
  const [error, setError] = useState<string | null>(null)
  const [holds, setHolds] = useState<Hold[]>(createHolds)
  const [currentIndex, setCurrentIndex] = useState(-1)
  const [presentationPath, setPresentationPath] = useState<string | null>(null)
  const [presentationResult, setPresentationResult] = useState<'hit' | 'miss' | null>(null)
  const [winRecords, setWinRecords] = useState<WinRecord[]>([])
  const sessionRef = useRef<GameSession | null>(null)

  const startGame = useMemo(() => new StartGameUseCase(lotteryFactory), [lotteryFactory])
  const drawHold = useMemo(() => new DrawHoldUseCase(), [])
  const selectWinPattern = useMemo(
    () => new SelectWinPatternUseCase(winPatternSelector),
    [winPatternSelector],
  )
  const probabilityValidation = useMemo(
    () => parseProbabilityPercent(probabilityPercent),
    [probabilityPercent],
  )
  const continuationRate = useMemo(
    () => calculateContinuationRate(probabilityPercent, gameConfig.initialCount),
    [probabilityPercent],
  )

  const start = useCallback(() => {
    if (status !== 'idle') return
    const result = startGame.execute(probabilityPercent)
    if (!result.ok) {
      setError(result.message)
      return
    }

    sessionRef.current = result.session
    setError(null)
    setPresentationPath(null)
    setPresentationResult(null)
    setWinRecords([])
    setHolds(createHolds())
    setCurrentIndex(0)
    setStatus('running')
  }, [probabilityPercent, startGame, status])

  const reset = useCallback(() => {
    sessionRef.current = null
    setStatus('idle')
    setError(null)
    setHolds(createHolds())
    setCurrentIndex(-1)
    setPresentationPath(null)
    setPresentationResult(null)
    setWinRecords([])
  }, [])

  useEffect(() => {
    if (status !== 'running' || currentIndex < 0) return

    const timer = window.setTimeout(() => {
      const session = sessionRef.current
      const hold = holds[currentIndex]
      if (!session || !hold) return

      const hit = drawHold.execute(session, { holdId: hold.id, holdIndex: currentIndex })
      setHolds((current) =>
        current.map((item, index) =>
          index === currentIndex ? { ...item, result: hit ? 'hit' : 'miss' } : item,
        ),
      )

      if (hit) {
        const imagePath = selectWinPattern.execute()
        setWinRecords((records) => [
          ...records,
          { patternNumber: getPatternNumber(imagePath), holdNumber: currentIndex + 1 },
        ])
        setPresentationPath(imagePath)
        setPresentationResult('hit')
        setCurrentIndex(-1)
        setStatus('celebrating')
      } else if (currentIndex === holds.length - 1) {
        setPresentationPath('/pattern/win/0.png')
        setPresentationResult('miss')
        setCurrentIndex(-1)
        setStatus('celebrating')
      } else {
        setCurrentIndex((index) => index + 1)
      }
    }, gameConfig.countdownIntervalMs)

    return () => window.clearTimeout(timer)
  }, [currentIndex, drawHold, holds, selectWinPattern, status])

  useEffect(() => {
    if (status !== 'celebrating' || !presentationResult) return

    const timer = window.setTimeout(() => {
      setPresentationPath(null)
      if (presentationResult === 'hit') {
        setPresentationResult(null)
        setHolds(createHolds())
        setCurrentIndex(0)
        setStatus('running')
      } else {
        setPresentationResult(null)
        setStatus('finished')
      }
    }, gameConfig.resultPresentationMs)

    return () => window.clearTimeout(timer)
  }, [presentationResult, status])

  const updateProbability = useCallback((value: string) => {
    if (status !== 'idle') return
    setProbabilityPercent(value)
    setError(null)
  }, [status])

  return {
    status,
    probabilityPercent,
    error,
    holds,
    currentIndex,
    presentationPath,
    presentationResult,
    winRecords,
    canStart: status === 'idle' && probabilityValidation.valid,
    continuationRatePercent: continuationRate.valid ? continuationRate.percent : null,
    updateProbability,
    start,
    reset,
  }
}
