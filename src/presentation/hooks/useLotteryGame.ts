import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import type { GameAudioService } from '../../application/audio/GameAudioService'
import type { AudioPlayback } from '../../application/ports/AudioPlayer'
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

export function useLotteryGame(
  lotteryFactory: LotteryFactory,
  winPatternSelector: WinPatternSelector,
  gameAudio: GameAudioService,
) {
  const [status, setStatus] = useState<GameStatus>('idle')
  const [probabilityPercent, setProbabilityPercent] = useState(() =>
    probabilityToPercent(gameConfig.defaultHitProbability),
  )
  const [error, setError] = useState<string | null>(null)
  const [holds, setHolds] = useState<Hold[]>(createHolds)
  const [currentIndex, setCurrentIndex] = useState(-1)
  const [countdownVisibleIndex, setCountdownVisibleIndex] = useState(-1)
  const [presentationPath, setPresentationPath] = useState<string | null>(null)
  const [presentationResult, setPresentationResult] = useState<'hit' | 'miss' | null>(null)
  const [winRecords, setWinRecords] = useState<WinRecord[]>([])
  const sessionRef = useRef<GameSession | null>(null)
  const startingRef = useRef(false)

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

  useEffect(() => {
    void gameAudio.preload().catch(() => {
      // Start will surface a retryable error if preloading is still unsuccessful.
    })

    return () => gameAudio.reset()
  }, [gameAudio])

  const start = useCallback(async () => {
    if (status !== 'idle' || startingRef.current) return
    const result = startGame.execute(probabilityPercent)
    if (!result.ok) {
      setError(result.message)
      return
    }

    startingRef.current = true
    setError(null)
    try {
      // This begins synchronously in the click event, which is required by Safari/iOS.
      await gameAudio.enable()
    } catch (audioError) {
      console.error('[Game] Audio initialization failed.', audioError)
      setError('音声を準備できませんでした。もう一度「ゲーム開始」を押してください。')
      startingRef.current = false
      return
    }

    sessionRef.current = result.session
    gameAudio.beginCountdownSequence()
    setPresentationPath(null)
    setPresentationResult(null)
    setWinRecords([])
    setHolds(createHolds())
    setCountdownVisibleIndex(-1)
    setCurrentIndex(0)
    setStatus('running')
    startingRef.current = false
  }, [gameAudio, probabilityPercent, startGame, status])

  const reset = useCallback(() => {
    gameAudio.reset()
    startingRef.current = false
    sessionRef.current = null
    setStatus('idle')
    setError(null)
    setHolds(createHolds())
    setCurrentIndex(-1)
    setCountdownVisibleIndex(-1)
    setPresentationPath(null)
    setPresentationResult(null)
    setWinRecords([])
  }, [gameAudio])

  useEffect(() => {
    if (status !== 'running' || currentIndex < 0) return

    let cancelled = false
    const runDraw = async () => {
      const remainingDraws = holds.length - currentIndex
      let playback: AudioPlayback | null = null
      try {
        playback = await gameAudio.playCountdown(remainingDraws)
      } catch (audioError) {
        // Do not leave the game stuck if playback fails after a successful unlock.
        console.error('[Game] Countdown audio playback failed.', audioError)
      }
      if (cancelled) return

      // Keep the visual countdown visible for the actual duration of the voice file.
      setCountdownVisibleIndex(currentIndex)
      if (playback) await playback.ended
      if (cancelled) return

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
        gameAudio.stopCountdown()
        const imagePath = selectWinPattern.execute()
        setWinRecords((records) => [
          ...records,
          { patternNumber: getPatternNumber(imagePath), holdNumber: currentIndex + 1 },
        ])
        setPresentationPath(imagePath)
        setPresentationResult('hit')
        setCountdownVisibleIndex(-1)
        setCurrentIndex(-1)
        setStatus('celebrating')
      } else if (currentIndex === holds.length - 1) {
        setPresentationPath('/pattern/win/0.png')
        setPresentationResult('miss')
        setCountdownVisibleIndex(-1)
        setCurrentIndex(-1)
        setStatus('celebrating')
      } else {
        setCountdownVisibleIndex(-1)
        setCurrentIndex((index) => index + 1)
      }
    }

    void runDraw()

    return () => {
      cancelled = true
    }
  }, [currentIndex, drawHold, gameAudio, holds, selectWinPattern, status])

  useEffect(() => {
    if (status !== 'celebrating' || !presentationResult) return

    const timer = window.setTimeout(() => {
      setPresentationPath(null)
      if (presentationResult === 'hit') {
        gameAudio.beginCountdownSequence()
        setPresentationResult(null)
        setHolds(createHolds())
        setCountdownVisibleIndex(-1)
        setCurrentIndex(0)
        setStatus('running')
      } else {
        setPresentationResult(null)
        setStatus('finished')
      }
    }, gameConfig.resultPresentationMs)

    return () => window.clearTimeout(timer)
  }, [gameAudio, presentationResult, status])

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
    isCountdownVisible: countdownVisibleIndex === currentIndex,
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
