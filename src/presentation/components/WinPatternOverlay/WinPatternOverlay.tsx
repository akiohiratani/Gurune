import type { CSSProperties } from 'react'

type WinPatternOverlayProps = {
  imagePath: string
  result: 'hit' | 'miss'
  durationSeconds: number | null
}

type OverlayStyle = CSSProperties & {
  '--presentation-duration'?: string
}

export function WinPatternOverlay({
  imagePath,
  result,
  durationSeconds,
}: WinPatternOverlayProps) {
  const style: OverlayStyle = durationSeconds
    ? { '--presentation-duration': `${durationSeconds}s` }
    : {}

  return (
    <div
      className={`win-pattern-overlay win-pattern-overlay--${result}`}
      style={style}
      role="dialog"
      aria-label={result === 'hit' ? '当選演出' : '抽選終了演出'}
      aria-live="assertive"
      aria-modal="true"
    >
      <div className="win-pattern-flash" aria-hidden="true" />
      <img
        className="win-pattern-image"
        src={imagePath}
        alt={result === 'hit' ? '当選' : '今回は当選なし'}
      />
      <p className="win-pattern-label">{result === 'hit' ? 'WIN' : 'FINISH'}</p>
      <div className="presentation-progress" aria-hidden="true" />
    </div>
  )
}
