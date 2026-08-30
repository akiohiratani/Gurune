import {
  PATTERN_NUMBERS,
  countPatternWins,
  countWins,
  type GameSettings,
  type WinColor,
  type WinRecord,
} from '../../../domain/game/Game'
import type { PrizeResult } from '../../../domain/prize/Prize'
import { getGameDurationParts } from '../../gameTime'

type ResultScreenProps = {
  records: WinRecord[]
  settings: Readonly<GameSettings> | null
  elapsedSeconds: number
  prizeResult: PrizeResult | null
  onReplay: () => void
}

const colorLabels: Record<WinColor, string> = {
  red: '赤',
  blue: '青',
  yellow: '黄',
}

export function ResultScreen({
  records,
  settings,
  elapsedSeconds,
  prizeResult,
  onReplay,
}: ResultScreenProps) {
  const duration = getGameDurationParts(elapsedSeconds)

  return (
    <section className="result-screen" aria-labelledby="result-title">
      <div className="result-heading">
        <p className="section-index">RESULT / WIN SUMMARY</p>
        <h2 id="result-title">抽選結果</h2>
        <p>当選した図柄ごとの回数</p>
      </div>

      {prizeResult && (
        <div className="result-prize">
          <span>今回獲得した景品</span>
          <strong>{prizeResult.name}</strong>
          <small>PRIZE {prizeResult.prizeNumber}</small>
        </div>
      )}

      <div className="result-grid">
        {PATTERN_NUMBERS.map((patternNumber) => {
          const recordsForPattern = records.filter(
            (record) => record.patternNumber === patternNumber,
          )
          // レコード件数ではなく倍率を合計し、×3を3回分として表示します。
          const winCount = countPatternWins(records, patternNumber)
          // ゲーム開始時に固定された設定を参照し、Result表示で再抽選しません。
          const color = settings?.patternColors[patternNumber]
          const upgradeProbability = color
            ? settings.colorUpgradeProbabilities[color]
            : null
          return (
            <article className="result-card" key={patternNumber}>
              <img
                className="member-number-image"
                src={`/pattern/member/${patternNumber}.png`}
                alt={`図柄 ${patternNumber}`}
              />
              <div className="result-count">
                <span className="result-pattern-name">図柄 {patternNumber}</span>
                <strong>{winCount}</strong>
                <span>回当選</span>
              </div>
              {color && upgradeProbability !== null && (
                <p className={`result-pattern-setting result-pattern-setting--${color}`}>
                  <span>{colorLabels[color]}</span>
                  <strong>×3昇格 {upgradeProbability * 100}%</strong>
                </p>
              )}
              {recordsForPattern.length > 0 && (
                <p className="hit-positions">
                  保留位置: {recordsForPattern.map((record) => record.holdNumber).join('・')}
                </p>
              )}
            </article>
          )
        })}
      </div>

      <p className="result-total">
        {/* TOTALも図柄別表示と同じDomainルールで倍率合計します。 */}
        TOTAL WINS <strong>{countWins(records)}</strong>
      </p>
      <p className="result-time">
        <span>PLAY TIME</span>
        <strong>{duration.minutes}分 {duration.seconds}秒</strong>
      </p>
      <button type="button" className="primary-action result-reset" onClick={onReplay}>
        <span>もう一度プレイ</span>
        <span aria-hidden="true">→</span>
      </button>
    </section>
  )
}
