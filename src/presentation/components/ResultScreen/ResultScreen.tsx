import type { WinRecord } from '../../../domain/game/Game'

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
          return (
            <article className="result-card" key={patternNumber}>
              <img
                className="member-number-image"
                src={`/pattern/member/${patternNumber}.png`}
                alt={`図柄 ${patternNumber}`}
              />
              <div className="result-count">
                <strong>{recordsForPattern.length}</strong>
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

      <p className="result-total">TOTAL WINS <strong>{records.length}</strong></p>
      <button type="button" className="primary-action result-reset" onClick={onReplay}>
        <span>もう一度プレイ</span>
        <span aria-hidden="true">→</span>
      </button>
    </section>
  )
}
