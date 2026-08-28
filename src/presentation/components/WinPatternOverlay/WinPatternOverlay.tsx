type WinPatternOverlayProps = {
  imagePath: string
  result: 'hit' | 'miss'
}

export function WinPatternOverlay({ imagePath, result }: WinPatternOverlayProps) {
  return (
    <div
      className={`win-pattern-overlay win-pattern-overlay--${result}`}
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
