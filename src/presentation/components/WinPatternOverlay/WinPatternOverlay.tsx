// 当選画像、フラッシュ、WIN表示を重ねて全画面に表示するプレゼンテーション部品です。
type WinPatternOverlayProps = {
  // アプリケーション層で選ばれた画像パスを表示だけに利用します。
  imagePath: string
  // 演出画面からゲームを初期状態へ戻すための操作です。
  onReset: () => void
}

export function WinPatternOverlay({ imagePath, onReset }: WinPatternOverlayProps) {
  return (
    <div
      className="win-pattern-overlay"
      // 演出中はゲーム画面を覆い、支援技術にも当選状態を通知します。
      role="dialog"
      aria-label="当選演出"
      aria-live="assertive"
      aria-modal="true"
    >
      {/* 短い白フラッシュで大当たり開始時の視覚的な勢いを表現します。 */}
      <div className="win-pattern-flash" aria-hidden="true" />
      {/* 画像自体を奥から拡大し、表示後は小さく揺らし続けます。 */}
      <img className="win-pattern-image" src={imagePath} alt="当選" />
      {/* 画像の上に結果を明示する文字を配置します。 */}
      <p className="win-pattern-label">WIN</p>
      {/* 全画面表示で背後のリセットボタンを操作できないため、専用ボタンを置きます。 */}
      <button type="button" className="win-pattern-reset" onClick={onReset}>
        RESET
      </button>
    </div>
  )
}