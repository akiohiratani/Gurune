import { countPatternWins, countWins, type WinRecord } from '../../../domain/game/Game'

type ResultScreenProps = {
  records: WinRecord[]
  onReplay: () => void
}

const patternNumbers = [1, 2, 3, 4, 5, 6]

export function ResultScreen({ records, onReplay }: ResultScreenProps) {
  return (
    <section className="result-screen" aria-labelledby="result-title">
      <div className="result-heading">
        <p className="section-index">RESULT / WIN SUMMARY</p>
        <h2 id="result-title">抽選結果</h2>
        <p>当選した図柄ごとの回数</p>
      </div>

      <div className="result-grid">
        {patternNumbers.map((patternNumber) => {
          const recordsForPattern = records.filter(
            (record) => record.patternNumber === patternNumber,
          )
          // レコード件数ではなく倍率を合計し、×3を3回分として表示します。
          const winCount = countPatternWins(records, patternNumber)
          return (
            <article className="result-card" key={patternNumber}>
              <img
                className="member-number-image"
                src={`/pattern/member/${patternNumber}.png`}
                alt={`図柄 ${patternNumber}`}
              />
              <div className="result-count">
                <strong>{winCount}</strong>
                <span>回当選</span>
              </div>
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
      <button type="button" className="primary-action result-reset" onClick={onReplay}>
        <span>もう一度プレイ</span>
        <span aria-hidden="true">→</span>
      </button>
    </section>
  )
}
