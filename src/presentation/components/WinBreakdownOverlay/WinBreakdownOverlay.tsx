import { useState } from 'react'

type WinBreakdownOverlayProps = {
  // 777用音源が実際に終了したことをゲーム進行側から受け取ります。
  isSpecialAudioComplete: boolean
  // 4.pngの登場開始を通知し、音声再生自体はApplication側へ委譲します。
  onMultiplierStarted: () => void
}

export function WinBreakdownOverlay({
  isSpecialAudioComplete,
  onMultiplierStarted,
}: WinBreakdownOverlayProps) {
  const [areShuttersClosed, setAreShuttersClosed] = useState(false)
  // 音源が極端に短い場合でも、最低1回は1.png/2.pngを切り替えてから次へ進みます。
  const [hasFlashed, setHasFlashed] = useState(false)
  // 固定タイマーを使わず、CSSアニメーションと音源の完了状態から表示段階を導出します。
  const step = !areShuttersClosed
    ? 'shutters'
    : !isSpecialAudioComplete || !hasFlashed
      ? 'flash'
      : 'multiplier'

  const accessibleLabel = step === 'shutters'
    ? '襖が閉じる特別演出'
    : step === 'flash'
      ? '7図柄が3つ揃ったフラッシュ演出'
      : '当選倍率 ×3'

  return (
    <section
      className={`win-breakdown-overlay win-breakdown-overlay--${step}`}
      role="dialog"
      aria-modal="true"
      aria-label={accessibleLabel}
    >
      {/* 同じ3.pngを左右50%の領域でクリップし、中央で絵がつながる襖として扱います。 */}
      {step === 'shutters' && (
        <div className="win-breakdown-shutters" aria-hidden="true">
          <div className="win-breakdown-shutter win-breakdown-shutter--left">
            <img src="/pattern/breakdown/img/3.png" alt="" />
          </div>
          {/* 左右は同じ時間で動くため、右側の終了を襖全体の完了通知として使います。 */}
          <div
            className="win-breakdown-shutter win-breakdown-shutter--right"
            onAnimationEnd={() => setAreShuttersClosed(true)}
          >
            <img src="/pattern/breakdown/img/3.png" alt="" />
          </div>
        </div>
      )}

      {/* CSSで2枚のopacityを反転させ、777音源の終了まで交互表示を継続します。 */}
      {step === 'flash' && (
        <div className="win-breakdown-flash" aria-hidden="true">
          <img src="/pattern/breakdown/img/1.png" alt="" />
          {/* 通常環境はiteration、視差軽減設定で1回終了する環境はendで完了を記録します。 */}
          <img
            src="/pattern/breakdown/img/2.png"
            alt=""
            onAnimationIteration={() => setHasFlashed(true)}
            onAnimationEnd={() => setHasFlashed(true)}
          />
        </div>
      )}

      {/* animationstartと音声開始を同期し、音声3回分が終わるまで親がこの要素を保持します。 */}
      {step === 'multiplier' && (
        <img
          className="win-breakdown-multiplier-image"
          src="/pattern/breakdown/img/4.png"
          alt="×3"
          onAnimationStart={onMultiplierStarted}
        />
      )}
    </section>
  )
}
