import { useMemo } from 'react'
import { parseProbabilityPercent } from './application/probabilityPercent'
import { RandomLotteryFactory } from './infrastructure/lottery/RandomLotteryFactory'
import { RandomWinPatternSelector } from './infrastructure/lottery/RandomWinPatternSelector'
import { ProbabilitySetting } from './presentation/components/ProbabilitySetting/ProbabilitySetting'
import { WinPatternOverlay } from './presentation/components/WinPatternOverlay/WinPatternOverlay'
import { useLotteryGame } from './presentation/hooks/useLotteryGame'
import './App.css'

function App() {
  const lotteryFactory = useMemo(() => new RandomLotteryFactory(), [])
  // インフラ層の実装をここで生成し、フックへアプリケーションのポートとして渡します。
  const winPatternSelector = useMemo(() => new RandomWinPatternSelector(), [])
  const game = useLotteryGame(lotteryFactory, winPatternSelector)
  const isIdle = game.status === 'idle'
  const canStart = isIdle && parseProbabilityPercent(game.probabilityPercent).valid
  const countdownImagePath = game.currentIndex >= 0
    ? `/count/img/${game.holds.length - game.currentIndex}.png`
    : null

  return (
    <main className="game-shell">
      {/* 当選時だけ表示し、ゲーム画面全体を演出レイヤーで覆います。 */}
      {game.winPatternPath && (
        <WinPatternOverlay imagePath={game.winPatternPath} onReset={game.reset} />
      )}
      <header className="game-header">
        <div>
          <p className="eyebrow">THREE DRAW / LIVE LOTTERY</p>
          <h1>LUCK CIRCUIT</h1>
        </div>
        <div className={`status-badge status-badge--${game.status}`}>
          <span className="status-dot" aria-hidden="true" />
          {game.status === 'idle' ? 'READY' : game.status === 'running' ? 'DRAWING' : 'COMPLETE'}
        </div>
      </header>

      <section className="game-stage" aria-label="抽選ゲーム">
        <div className="stage-heading">
          <div>
            <p className="section-index">01 / DRAW</p>
            <h2>抽選中</h2>
          </div>
        </div>

        <div className="countdown-display" aria-live="polite" aria-label="抽選カウントダウン">
          {countdownImagePath && (
            <img
              key={countdownImagePath}
              className="countdown-image"
              src={countdownImagePath}
              alt={`${game.holds.length - game.currentIndex}番目の抽選`}
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
