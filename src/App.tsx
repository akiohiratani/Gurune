import { useMemo } from 'react'
import { GameAudioService } from './application/audio/GameAudioService'
import { BrowserAudioPlayer } from './infrastructure/audio/BrowserAudioPlayer'
import { RandomLotteryFactory } from './infrastructure/lottery/RandomLotteryFactory'
import { RandomWinPatternSelector } from './infrastructure/lottery/RandomWinPatternSelector'
import { RandomWinMovieSelector } from './infrastructure/movie/RandomWinMovieSelector'
import { MathRandomSource } from './infrastructure/random/MathRandomSource'
import { GameSettingsModal } from './presentation/components/GameSettingsModal/GameSettingsModal'
import { GameTimer } from './presentation/components/GameTimer/GameTimer'
import { ResultScreen } from './presentation/components/ResultScreen/ResultScreen'
import { WinPatternOverlay } from './presentation/components/WinPatternOverlay/WinPatternOverlay'
import { WinMovieOverlay } from './presentation/components/WinMovieOverlay/WinMovieOverlay'
import { WinBreakdownOverlay } from './presentation/components/WinBreakdownOverlay/WinBreakdownOverlay'
import { useLotteryGame } from './presentation/hooks/useLotteryGame'
import './App.css'

function App() {
  const lotteryFactory = useMemo(() => new RandomLotteryFactory(), [])
  const winPatternSelector = useMemo(() => new RandomWinPatternSelector(), [])
  // 動画候補の選択とパス解決を行うInfrastructure実装を、ゲーム進行へ注入します。
  const winMovieSelector = useMemo(() => new RandomWinMovieSelector(), [])
  // ゲーム開始時の確率シャッフルと、大当たり後の倍率抽選で共有する乱数実装です。
  const randomSource = useMemo(() => new MathRandomSource(), [])
  const gameAudio = useMemo(() => new GameAudioService(new BrowserAudioPlayer()), [])
  const game = useLotteryGame(
    lotteryFactory,
    winPatternSelector,
    winMovieSelector,
    randomSource,
    gameAudio,
  )
  const isIdle = game.status === 'idle'
  const countdownImagePath = game.isCountdownVisible && game.currentIndex >= 0
    ? `/count/img/${game.holds.length - game.currentIndex}.png`
    : null

  if (game.status === 'finished') {
    return (
      <ResultScreen
        records={game.winRecords}
        settings={game.gameSettings}
        elapsedSeconds={game.elapsedSeconds}
        onReplay={game.reset}
      />
    )
  }

  return (
    <main className="game-shell">
      {!isIdle && <GameTimer elapsedSeconds={game.elapsedSeconds} />}
      {isIdle && (
        <GameSettingsModal
          probabilityPercent={game.probabilityPercent}
          continuationRatePercent={game.continuationRatePercent}
          patternColorSelection={game.patternColorSelection}
          patternColorError={game.patternColorError}
          error={game.error}
          canStart={game.canStart}
          onProbabilityChange={game.updateProbability}
          onPatternColorChange={game.updatePatternColor}
          onStart={game.start}
        />
      )}
      {game.presentationPath && game.presentationResult && (
        <WinPatternOverlay
          imagePath={game.presentationPath}
          result={game.presentationResult}
          durationSeconds={game.presentationDurationSeconds}
        />
      )}
      {game.winMoviePath && (
        /* Appは動画を表示し、ended通知をゲーム進行へ渡すだけです。
         * 次の抽選を始める判断や保留の再作成はコンポーネント内では行いません。 */
        <WinMovieOverlay moviePath={game.winMoviePath} onEnded={game.completeWinMovie} />
      )}
      {/* ×1はUIを表示せず、×3が確定した場合だけ内訳演出をマウントします。 */}
      {game.winMultiplier === 3 && (
        <WinBreakdownOverlay
          isSpecialAudioComplete={game.isWinBreakdownAudioComplete}
          onMultiplierStarted={game.startWinMultiplierPresentation}
        />
      )}

      <section className="game-stage" aria-label="抽選ゲーム">
        <div className="countdown-display" aria-live="polite" aria-label="抽選カウントダウン">
          {countdownImagePath && (
            <img
              key={`${countdownImagePath}-${game.winRecords.length}`}
              className="countdown-image"
              src={countdownImagePath}
              alt={`残り保留 ${game.holds.length - game.currentIndex}`}
            />
          )}
        </div>
      </section>

    </main>
  )
}

export default App
