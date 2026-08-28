import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import type { LotteryFactory } from '../../application/ports/LotteryFactory'
import type { WinPatternSelector } from '../../application/ports/WinPatternSelector'
import { probabilityToPercent } from '../../application/probabilityPercent'
import { DrawHoldUseCase } from '../../application/usecases/DrawHoldUseCase'
import { SelectWinPatternUseCase } from '../../application/usecases/SelectWinPatternUseCase'
import { StartGameUseCase } from '../../application/usecases/StartGameUseCase'
import { gameConfig } from '../../config/gameConfig'
import type { GameSession, GameStatus, Hold } from '../../domain/game/Game'

function createHolds(): Hold[] {
  return Array.from({ length: gameConfig.initialCount }, (_, index) => ({
    id: `hold-${index + 1}`,
    result: 'pending',
  }))
}

// 抽選進行と当選演出の状態をまとめて管理し、画面には表示に必要な値だけを返します。
export function useLotteryGame(lotteryFactory: LotteryFactory, winPatternSelector: WinPatternSelector) {
  const [status, setStatus] = useState<GameStatus>('idle')
  const [probabilityPercent, setProbabilityPercent] = useState(() =>
    probabilityToPercent(gameConfig.defaultHitProbability),
  )
  const [error, setError] = useState<string | null>(null)
  const [holds, setHolds] = useState<Hold[]>(createHolds)
  const [currentIndex, setCurrentIndex] = useState(-1)
  const [lockedProbability, setLockedProbability] = useState<number | null>(null)
  // nullは通常画面、文字列は当選演出に使用する画像パスを表します。
  const [winPatternPath, setWinPatternPath] = useState<string | null>(null)
  const sessionRef = useRef<GameSession | null>(null)

  const startGame = useMemo(() => new StartGameUseCase(lotteryFactory), [lotteryFactory])
  const drawHold = useMemo(() => new DrawHoldUseCase(), [])
  const selectWinPattern = useMemo(
    () => new SelectWinPatternUseCase(winPatternSelector),
    [winPatternSelector],
  )

  const start = useCallback(() => {
    if (status !== 'idle') return
    const result = startGame.execute(probabilityPercent)
    if (!result.ok) {
      setError(result.message)
      return
    }

    sessionRef.current = result.session
    setLockedProbability(result.session.settings.hitProbability)
    setError(null)
    // 前回の当選演出を消してから、新しい抽選を開始します。
    setWinPatternPath(null)
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
    setLockedProbability(null)
    // オーバーレイからリセットされた場合も通常画面へ戻します。
    setWinPatternPath(null)
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

      if (hit || currentIndex === holds.length - 1) {
        // いずれかの保留が当選した時点で、候補画像を一度だけ選びます。
        if (hit) setWinPatternPath(selectWinPattern.execute())
        setCurrentIndex(-1)
        setStatus('finished')
      } else {
        setCurrentIndex((index) => index + 1)
      }
    }, gameConfig.countdownIntervalMs)

    return () => window.clearTimeout(timer)
  }, [currentIndex, drawHold, holds, selectWinPattern, status])

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
    lockedProbability,
    winPatternPath,
    updateProbability,
    start,
    reset,
  }
}
