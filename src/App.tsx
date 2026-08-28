import { useMemo } from 'react'
import { parseProbabilityPercent } from './application/probabilityPercent'
import { RandomLotteryFactory } from './infrastructure/lottery/RandomLotteryFactory'
import { HoldList } from './presentation/components/HoldList/HoldList'
import { ProbabilitySetting } from './presentation/components/ProbabilitySetting/ProbabilitySetting'
import { useLotteryGame } from './presentation/hooks/useLotteryGame'
import './App.css'

function App() {
  const lotteryFactory = useMemo(() => new RandomLotteryFactory(), [])
  const game = useLotteryGame(lotteryFactory)
  const isIdle = game.status === 'idle'
  const canStart = isIdle && parseProbabilityPercent(game.probabilityPercent).valid
  const hitCount = game.holds.filter((hold) => hold.result === 'hit').length
  const completedCount = game.holds.filter((hold) => hold.result !== 'pending').length

  return (
    <main className="game-shell">
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
            <p className="section-index">01 / DRAW QUEUE</p>
            <h2>3つの保留を抽選</h2>
          </div>
          <div className="count-display" aria-live="polite">
            <span>COUNT</span>
            <strong>{game.holds.length - completedCount}</strong>
            <span>/ {game.holds.length}</span>
          </div>
        </div>

        <HoldList holds={game.holds} currentIndex={game.currentIndex} />

        <div className="result-strip" aria-live="polite">
          <span>RESULT</span>
          <strong>
            {isIdle
              ? '確率を設定してスタート'
              : game.status === 'running'
                ? `${game.currentIndex + 1}番を抽選しています`
                : hitCount > 0
                  ? `${hitCount}件 当選`
                  : '今回は当選なし'}
          </strong>
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
