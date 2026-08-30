import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import type { GameAudioService } from '../../application/audio/GameAudioService'
import type { AudioPlayback } from '../../application/ports/AudioPlayer'
import type { LotteryFactory } from '../../application/ports/LotteryFactory'
import type { RandomSource } from '../../application/ports/RandomSource'
import type { WinPatternSelector } from '../../application/ports/WinPatternSelector'
import type { WinMovieSelector } from '../../application/ports/WinMovieSelector'
import { calculateContinuationRate } from '../../application/continuationRate'
import { parseProbabilityPercent, probabilityToPercent } from '../../application/probabilityPercent'
import { DrawHoldUseCase } from '../../application/usecases/DrawHoldUseCase'
import { SelectWinPatternUseCase } from '../../application/usecases/SelectWinPatternUseCase'
import { StartGameUseCase } from '../../application/usecases/StartGameUseCase'
import { WinMovieFlowUseCase } from '../../application/usecases/WinMovieFlowUseCase'
import { WinBreakdownFlowUseCase } from '../../application/usecases/WinBreakdownFlowUseCase'
import { gameConfig } from '../../config/gameConfig'
import {
  PATTERN_NUMBERS,
  SPECIAL_WIN_MULTIPLIER,
  createEmptyPatternColorSelection,
  validatePatternColorSelection,
  type GameSession,
  type GameSettings,
  type GameStatus,
  type Hold,
  type PendingWin,
  type PatternColorSelection,
  type PatternNumber,
  type WinColor,
  type WinMultiplier,
  type WinRecord,
} from '../../domain/game/Game'

function createHolds(): Hold[] {
  return Array.from({ length: gameConfig.initialCount }, (_, index) => ({
    id: `hold-${index + 1}`,
    result: 'pending',
  }))
}

function getPatternNumber(imagePath: string): PatternNumber {
  const match = imagePath.match(/\/(\d+)\.png$/)
  const patternNumber = match ? Number(match[1]) : Number.NaN
  if (PATTERN_NUMBERS.includes(patternNumber as PatternNumber)) {
    return patternNumber as PatternNumber
  }
  throw new Error(`Unknown win pattern image path: ${imagePath}`)
}

const colorLabels: Record<WinColor, string> = { red: '赤', blue: '青', yellow: '黄' }

export function useLotteryGame(
  lotteryFactory: LotteryFactory,
  winPatternSelector: WinPatternSelector,
  winMovieSelector: WinMovieSelector,
  randomSource: RandomSource,
  gameAudio: GameAudioService,
) {
  const [status, setStatus] = useState<GameStatus>('idle')
  const [probabilityPercent, setProbabilityPercent] = useState(() =>
    probabilityToPercent(gameConfig.defaultHitProbability),
  )
  // モーダル上の編集値です。開始時に検証済みコピーをGameSessionへ保存します。
  const [patternColorSelection, setPatternColorSelection] = useState<PatternColorSelection>(
    createEmptyPatternColorSelection,
  )
  const [error, setError] = useState<string | null>(null)
  const [holds, setHolds] = useState<Hold[]>(createHolds)
  const [currentIndex, setCurrentIndex] = useState(-1)
  const [countdownVisibleIndex, setCountdownVisibleIndex] = useState(-1)
  const [presentationPath, setPresentationPath] = useState<string | null>(null)
  const [presentationResult, setPresentationResult] = useState<'hit' | 'miss' | null>(null)
  const [presentationDurationSeconds, setPresentationDurationSeconds] = useState<number | null>(null)
  const [winMoviePath, setWinMoviePath] = useState<string | null>(null)
  // nullは内訳UIなし、3は×3専用演出を表示中であることを表します（×1は表示しません）。
  const [winMultiplier, setWinMultiplier] = useState<WinMultiplier | null>(null)
  // 777音源の終了をPresentationへ通知し、固定秒数ではなく実再生終了で画面を進めます。
  const [isWinBreakdownAudioComplete, setIsWinBreakdownAudioComplete] = useState(true)
  const [winRecords, setWinRecords] = useState<WinRecord[]>([])
  // Result描画に使用するため、開始時に固定した設定をrefとは別の描画用stateにも保持します。
  const [gameSettings, setGameSettings] = useState<Readonly<GameSettings> | null>(null)
  const sessionRef = useRef<GameSession | null>(null)
  const winPlaybackRef = useRef<AudioPlayback | null>(null)
  const startingRef = useRef(false)
  // 大当たり直後は倍率をまだ決めず、動画終了まで元図柄と保留位置を保持します。
  const pendingWinRef = useRef<PendingWin | null>(null)
  // 非同期音源処理へ世代番号を付け、リセット後に古い完了通知が状態を更新するのを防ぎます。
  const winBreakdownSequenceRef = useRef(0)
  // animationstartの重複通知でも×3音源を複数系列で開始しないためのガードです。
  const isWinMultiplierAudioStartedRef = useRef(false)

  const startGame = useMemo(
    () => new StartGameUseCase(lotteryFactory, randomSource),
    [lotteryFactory, randomSource],
  )
  const drawHold = useMemo(() => new DrawHoldUseCase(), [])
  const selectWinPattern = useMemo(
    () => new SelectWinPatternUseCase(winPatternSelector),
    [winPatternSelector],
  )
  const winMovieFlow = useMemo(
    () => new WinMovieFlowUseCase(winMovieSelector),
    [winMovieSelector],
  )
  const winBreakdownFlow = useMemo(
    // 図柄の色に応じた昇格抽選と状態遷移はApplicationユースケースへ集約します。
    () => new WinBreakdownFlowUseCase(randomSource),
    [randomSource],
  )
  const probabilityValidation = useMemo(
    () => parseProbabilityPercent(probabilityPercent),
    [probabilityPercent],
  )
  const patternColorValidation = useMemo(
    () => validatePatternColorSelection(patternColorSelection),
    [patternColorSelection],
  )
  const patternColorError = useMemo(() => {
    if (patternColorValidation.valid) return null

    const messages: string[] = []
    if (patternColorValidation.unassignedPatterns.length > 0) {
      messages.push(`未割り当ての図柄: ${patternColorValidation.unassignedPatterns.join('・')}`)
    }
    if (patternColorValidation.colorsWithoutPatterns.length > 0) {
      messages.push(
        `図柄がない色: ${patternColorValidation.colorsWithoutPatterns.map((color) => colorLabels[color]).join('・')}`,
      )
    }
    return messages.join(' / ')
  }, [patternColorValidation])
  const continuationRate = useMemo(
    () => calculateContinuationRate(probabilityPercent, gameConfig.initialCount),
    [probabilityPercent],
  )

  useEffect(() => {
    void gameAudio.preload().catch(() => {
      // Start will surface a retryable error if preloading is still unsuccessful.
    })

    return () => {
      gameAudio.reset()
      gameAudio.stopBgm()
    }
  }, [gameAudio])

  const start = useCallback(async () => {
    if (status !== 'idle' || startingRef.current) return
    const result = startGame.execute(probabilityPercent, patternColorSelection)
    if (!result.ok) {
      setError(result.message)
      return
    }

    startingRef.current = true
    setError(null)
    try {
      // This begins synchronously in the click event, which is required by Safari/iOS.
      await gameAudio.enable()
      await gameAudio.playBgm()
    } catch (audioError) {
      console.error('[Game] Audio initialization failed.', audioError)
      setError('音声を準備できませんでした。もう一度「ゲーム開始」を押してください。')
      startingRef.current = false
      return
    }

    sessionRef.current = result.session
    setGameSettings(result.session.settings)
    gameAudio.beginCountdownSequence()
    setPresentationPath(null)
    setPresentationResult(null)
    setPresentationDurationSeconds(null)
    setWinMoviePath(null)
    // 新しいゲームへ前回の内訳状態や非同期完了通知を持ち越しません。
    setWinMultiplier(null)
    setIsWinBreakdownAudioComplete(true)
    winBreakdownSequenceRef.current += 1
    isWinMultiplierAudioStartedRef.current = false
    pendingWinRef.current = null
    setWinRecords([])
    setHolds(createHolds())
    setCountdownVisibleIndex(-1)
    setCurrentIndex(0)
    setStatus('running')
    startingRef.current = false
  }, [gameAudio, patternColorSelection, probabilityPercent, startGame, status])

  const reset = useCallback(() => {
    gameAudio.reset()
    startingRef.current = false
    sessionRef.current = null
    setGameSettings(null)
    setStatus('idle')
    setError(null)
    setHolds(createHolds())
    setCurrentIndex(-1)
    setCountdownVisibleIndex(-1)
    setPresentationPath(null)
    setPresentationResult(null)
    setPresentationDurationSeconds(null)
    setWinMoviePath(null)
    // リセット時は画面状態に加え、進行中だった非同期系列も無効化します。
    setWinMultiplier(null)
    setIsWinBreakdownAudioComplete(true)
    winBreakdownSequenceRef.current += 1
    isWinMultiplierAudioStartedRef.current = false
    pendingWinRef.current = null
    winPlaybackRef.current = null
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

      if (hit) {
        // Stop any countdown source before starting the win voice.
        gameAudio.stopCountdown()
        let winPlayback: AudioPlayback | null = null
        try {
          winPlayback = await gameAudio.playWin()
        } catch (audioError) {
          console.error('[Game] Win audio playback failed.', audioError)
        }
        if (cancelled) {
          gameAudio.stopWin()
          return
        }

        const imagePath = selectWinPattern.execute()
        setHolds((current) =>
          current.map((item, index) =>
            index === currentIndex ? { ...item, result: 'hit' } : item,
          ),
        )
        winPlaybackRef.current = winPlayback
        setPresentationDurationSeconds(winPlayback?.durationSeconds ?? null)
        // 履歴への確定追加は動画終了後の倍率抽選まで延期します。
        // ここで保持するpatternNumberが、×3時にも加算対象となる元図柄です。
        pendingWinRef.current = {
          patternNumber: getPatternNumber(imagePath),
          holdNumber: currentIndex + 1,
        }
        setPresentationPath(imagePath)
        setPresentationResult('hit')
        setCountdownVisibleIndex(-1)
        setCurrentIndex(-1)
        setStatus('celebrating')
        return
      }

      setHolds((current) =>
        current.map((item, index) =>
          index === currentIndex ? { ...item, result: 'miss' } : item,
        ),
      )

      if (currentIndex === holds.length - 1) {
        setPresentationDurationSeconds(null)
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
    // このEffectは既存の当落演出を完了させ、その後の状態へ進める役割を持ちます。
    if (status !== 'celebrating' || !presentationResult) return

    if (presentationResult === 'hit') {
      let cancelled = false

      const continueAfterWinVoice = async () => {
        const playback = winPlaybackRef.current
        // 既存の大当たり画像・当選音声による演出が終わるまでは動画を表示しません。
        if (playback) await playback.ended
        if (cancelled) return

        // Application層へ遷移を依頼し、動画パスの選択もこの開始処理の中で一度だけ行います。
        const transition = winMovieFlow.start(status)
        if (!transition) return

        // 既存演出を片付けてから動画専用状態へ切り替えます。
        // currentIndexはここではまだ戻さないため、動画再生中に次の抽選は開始されません。
        winPlaybackRef.current = null
        setPresentationPath(null)
        setPresentationResult(null)
        setPresentationDurationSeconds(null)
        setWinMoviePath(transition.moviePath)
        setStatus(transition.status)
      }

      void continueAfterWinVoice()
      return () => {
        cancelled = true
      }
    }

    // 外れで全保留を消化した場合の既存処理です。
    // このタイマーは外れ結果の表示時間だけに使用し、大当たり後の動画終了判定には使用しません。
    const timer = window.setTimeout(() => {
      setPresentationPath(null)
      setPresentationResult(null)
      setStatus('finished')
    }, gameConfig.resultPresentationMs)

    return () => window.clearTimeout(timer)
  }, [presentationResult, status, winMovieFlow])

  const finishWinBreakdown = useCallback((currentStatus: GameStatus) => {
    // Application層に現在状態を検証させ、重複完了による二重抽選を防ぎます。
    const transition = winBreakdownFlow.complete(currentStatus)
    if (!transition) return

    setWinMultiplier(null)
    setIsWinBreakdownAudioComplete(true)
    // 進行中の音源・コールバックを無効化してから新しい3保留を準備します。
    winBreakdownSequenceRef.current += 1
    isWinMultiplierAudioStartedRef.current = false
    gameAudio.stopWinBreakdown()
    gameAudio.stopWinMultiplier()
    gameAudio.beginCountdownSequence()
    setHolds(createHolds())
    setCountdownVisibleIndex(-1)
    setCurrentIndex(transition.currentIndex)
    // 準備を終えた最後にrunningへ戻し、抽選Effectの早期実行を避けます。
    setStatus(transition.status)
  }, [gameAudio, winBreakdownFlow])

  const completeWinMovie = useCallback(() => {
    // 動画のendedイベントを起点に、ここで初めて色別確率による抽選と履歴反映を行います。
    const transition = winBreakdownFlow.start(
      status,
      pendingWinRef.current,
      winRecords,
      sessionRef.current?.settings ?? null,
    )
    if (!transition) return

    setWinMoviePath(null)
    setWinRecords(transition.records)
    pendingWinRef.current = null

    if (transition.multiplier !== SPECIAL_WIN_MULTIPLIER) {
      // ×1は内訳画像を表示せず、確定済み履歴を保ったまま次抽選へ進みます。
      finishWinBreakdown(transition.status)
      return
    }

    setWinMultiplier(transition.multiplier)
    // 777音源が終わるまでは襖・フラッシュ表示から×3画像へ進めません。
    setIsWinBreakdownAudioComplete(false)
    isWinMultiplierAudioStartedRef.current = false
    setStatus(transition.status)

    // この×3演出専用の世代番号を確保します。
    const sequence = winBreakdownSequenceRef.current + 1
    winBreakdownSequenceRef.current = sequence

    const playBreakdownVoice = async () => {
      try {
        // 音源の実際のended Promiseを待ち、再生時間をコードへ固定しません。
        const playback = await gameAudio.playWinBreakdown()
        await playback.ended
      } catch (audioError) {
        console.error('[Game] Win breakdown audio playback failed.', audioError)
      } finally {
        // リセットなどで世代が変わっていれば、古い完了通知は破棄します。
        if (winBreakdownSequenceRef.current === sequence) {
          setIsWinBreakdownAudioComplete(true)
        }
      }
    }

    void playBreakdownVoice()
  }, [finishWinBreakdown, gameAudio, status, winBreakdownFlow, winRecords])

  const startWinMultiplierPresentation = useCallback(() => {
    // 4.pngのanimationstartから呼ばれます。状態・倍率・開始済みフラグをすべて検証します。
    if (
      status !== 'revealingWinBreakdown'
      || winMultiplier !== SPECIAL_WIN_MULTIPLIER
      || isWinMultiplierAudioStartedRef.current
    ) return

    isWinMultiplierAudioStartedRef.current = true
    // 777演出から継続している同じ内訳系列であることを後から確認します。
    const sequence = winBreakdownSequenceRef.current

    const playMultiplierVoice = async () => {
      try {
        // 各再生の終了を待ってから次を開始し、同じ音源を重ねず3回連続再生します。
        for (let playCount = 0; playCount < 3; playCount += 1) {
          const playback = await gameAudio.playWinMultiplier()
          await playback.ended
        }
      } catch (audioError) {
        console.error('[Game] Win multiplier audio playback failed.', audioError)
      } finally {
        // 3回目の終了（または再生失敗）後も現系列なら、画像を閉じて次抽選へ進みます。
        if (winBreakdownSequenceRef.current === sequence) {
          finishWinBreakdown('revealingWinBreakdown')
        }
      }
    }

    void playMultiplierVoice()
  }, [finishWinBreakdown, gameAudio, status, winMultiplier])

  const updateProbability = useCallback((value: string) => {
    if (status !== 'idle') return
    setProbabilityPercent(value)
    setError(null)
  }, [status])

  const updatePatternColor = useCallback((
    patternNumber: PatternNumber,
    color: WinColor | null,
  ) => {
    if (status !== 'idle') return
    // 図柄番号をキーに1色だけ保持するため、別色の選択時は自動的に割り当て先が移ります。
    setPatternColorSelection((current) => ({ ...current, [patternNumber]: color }))
    setError(null)
  }, [status])

  return {
    status,
    probabilityPercent,
    patternColorSelection,
    patternColorError,
    error,
    holds,
    currentIndex,
    isCountdownVisible: countdownVisibleIndex === currentIndex,
    presentationPath,
    presentationResult,
    presentationDurationSeconds,
    winMoviePath,
    winMultiplier,
    isWinBreakdownAudioComplete,
    winRecords,
    // Resultにはゲーム開始時に固定した色・確率設定をそのまま渡します。
    gameSettings,
    canStart: status === 'idle' && probabilityValidation.valid && patternColorValidation.valid,
    continuationRatePercent: continuationRate.valid ? continuationRate.percent : null,
    updateProbability,
    updatePatternColor,
    start,
    reset,
    completeWinMovie,
    startWinMultiplierPresentation,
  }
}
