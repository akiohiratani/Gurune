import type { Hold } from '../../../domain/game/Game'

type HoldListProps = { holds: Hold[]; currentIndex: number }

const resultLabel = { pending: '待機', hit: '当選', miss: 'はずれ' } as const

export function HoldList({ holds, currentIndex }: HoldListProps) {
  return (
    <ol className="hold-list" aria-label="抽選保留">
      {holds.map((hold, index) => (
        <li key={hold.id} className={`hold hold--${hold.result}${currentIndex === index ? ' hold--active' : ''}`}>
          <span className="hold-number">{String(index + 1).padStart(2, '0')}</span>
          <span className="hold-symbol" aria-hidden="true">
            {hold.result === 'pending' ? '◆' : hold.result === 'hit' ? '◎' : '—'}
          </span>
          <span className="hold-result">{currentIndex === index ? '抽選中' : resultLabel[hold.result]}</span>
        </li>
      ))}
    </ol>
  )
}
