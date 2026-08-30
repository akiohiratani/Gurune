import { formatGameClock } from '../../gameTime'

type GameTimerProps = {
  elapsedSeconds: number
}

export function GameTimer({ elapsedSeconds }: GameTimerProps) {
  return (
    <div
      className="game-timer"
      role="timer"
      aria-label={`経過時間 ${formatGameClock(elapsedSeconds)}`}
    >
      <span>TIME</span>
      <strong>{formatGameClock(elapsedSeconds)}</strong>
    </div>
  )
}
