import { useMemo } from 'react'
import { parseProbabilityPercent } from './application/probabilityPercent'
import { RandomLotteryFactory } from './infrastructure/lottery/RandomLotteryFactory'
import { RandomWinPatternSelector } from './infrastructure/lottery/RandomWinPatternSelector'
import { ProbabilitySetting } from './presentation/components/ProbabilitySetting/ProbabilitySetting'
import { ResultScreen } from './presentation/components/ResultScreen/ResultScreen'
import { WinPatternOverlay } from './presentation/components/WinPatternOverlay/WinPatternOverlay'
import { useLotteryGame } from './presentation/hooks/useLotteryGame'
import './App.css'

function App() {
  const lotteryFactory = useMemo(() => new RandomLotteryFactory(), [])
  const winPatternSelector = useMemo(() => new RandomWinPatternSelector(), [])
  const game = useLotteryGame(lotteryFactory, winPatternSelector)
  const isIdle = game.status === 'idle'
  const canStart = isIdle && parseProbabilityPercent(game.probabilityPercent).valid
  const countdownImagePath = game.currentIndex >= 0
    ? `/count/img/${game.holds.length - game.currentIndex}.png`
    : null

  if (game.status === 'finished') {
    return <ResultScreen records={game.winRecords} onReset={game.reset} />
  }

  return (
    <main className="game-shell">
      {game.presentationPath && game.presentationResult && (
        <WinPatternOverlay imagePath={game.presentationPath} result={game.presentationResult} />
      )}

      <header className="game-header">
        <div>
          <p className="eyebrow">THREE DRAW / LIVE LOTTERY</p>
          <h1>LUCK CIRCUIT</h1>
        </div>
        <div className={`status-badge status-badge--${game.status}`}>
          <span className="status-dot" aria-hidden="true" />
          {isIdle ? 'READY' : game.status === 'running' ? 'DRAWING' : 'WIN'}
        </div>
      </header>

      <section className="game-stage" aria-label="抽選ゲーム">
        <div className="stage-heading">
          <div>
            <p className="section-index">01 / DRAW</p>
            <h2>{isIdle ? '抽選待機中' : '抽選中'}</h2>
          </div>
          {!isIdle && <p className="running-win-count">WIN {game.winRecords.length}</p>}
        </div>

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

      <aside className="control-panel" aria-label="ゲーム設定">
        <div className="panel-heading">
          <p className="section-index">02 / GAME SETTINGS</p>
          <h2>抽選設定</h2>
        </div>

        <ProbabilitySetting
          value={game.probabilityPercent}
          disabled={!isIdle}
          error={game.error}
          onChange={game.updateProbability}
        />

        <div className="locked-setting">
          <span>今回の設定</span>
          <strong>
            {game.lockedProbability === null
              ? '未確定'
              : `${Number((game.lockedProbability * 100).toFixed(10))}%`}
          </strong>
        </div>

        {isIdle ? (
          <button type="button" className="primary-action" disabled={!canStart} onClick={game.start}>
            <span>START</span>
            <span aria-hidden="true">→</span>
          </button>
        ) : (
          <button type="button" className="secondary-action" onClick={game.reset}>
            RESET
          </button>
        )}
      </aside>
    </main>
  )
}

export default App
