import { useMemo } from 'react'
import { GameAudioService } from './application/audio/GameAudioService'
import { BrowserAudioPlayer } from './infrastructure/audio/BrowserAudioPlayer'
import { RandomLotteryFactory } from './infrastructure/lottery/RandomLotteryFactory'
import { RandomWinPatternSelector } from './infrastructure/lottery/RandomWinPatternSelector'
import { RandomWinMovieSelector } from './infrastructure/movie/RandomWinMovieSelector'
import { GameSettingsModal } from './presentation/components/GameSettingsModal/GameSettingsModal'
import { ResultScreen } from './presentation/components/ResultScreen/ResultScreen'
import { WinPatternOverlay } from './presentation/components/WinPatternOverlay/WinPatternOverlay'
import { WinMovieOverlay } from './presentation/components/WinMovieOverlay/WinMovieOverlay'
import { useLotteryGame } from './presentation/hooks/useLotteryGame'
import './App.css'

function App() {
  const lotteryFactory = useMemo(() => new RandomLotteryFactory(), [])
  const winPatternSelector = useMemo(() => new RandomWinPatternSelector(), [])
  // 動画候補の選択とパス解決を行うInfrastructure実装を、ゲーム進行へ注入します。
  const winMovieSelector = useMemo(() => new RandomWinMovieSelector(), [])
  const gameAudio = useMemo(() => new GameAudioService(new BrowserAudioPlayer()), [])
  const game = useLotteryGame(lotteryFactory, winPatternSelector, winMovieSelector, gameAudio)
  const isIdle = game.status === 'idle'
  const countdownImagePath = game.isCountdownVisible && game.currentIndex >= 0
    ? `/count/img/${game.holds.length - game.currentIndex}.png`
    : null

  if (game.status === 'finished') {
    return <ResultScreen records={game.winRecords} onReplay={game.reset} />
  }

  return (
    <main className="game-shell">
      {isIdle && (
        <GameSettingsModal
          probabilityPercent={game.probabilityPercent}
          continuationRatePercent={game.continuationRatePercent}
          error={game.error}
          canStart={game.canStart}
          onProbabilityChange={game.updateProbability}
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

      <header className="game-header">
        <div>
          <p className="eyebrow">THREE DRAW / LIVE LOTTERY</p>
          <h1>LUCK CIRCUIT</h1>
        </div>
        <div className={`status-badge status-badge--${game.status}`}>
          <span className="status-dot" aria-hidden="true" />
          {isIdle ? 'READY' : game.status === 'running' ? 'DRAWING' : game.status === 'playingWinMovie' ? 'MOVIE' : 'WIN'}
        </div>
      </header>

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
