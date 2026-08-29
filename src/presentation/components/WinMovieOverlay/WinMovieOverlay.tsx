type WinMovieOverlayProps = {
  // Infrastructure層で解決され、Application層の遷移を経由して渡される動画パスです。
  moviePath: string
  // video要素が最後まで再生されたときだけApplication層へ終了を通知します。
  onEnded: () => void
}

/**
 * 大当たり後の動画を表示するPresentation層のコンポーネントです。
 * 抽選や保留の更新は行わず、video要素の管理と再生終了の通知だけを担当します。
 */
export function WinMovieOverlay({ moviePath, onEnded }: WinMovieOverlayProps) {
  return (
    <div
      className="win-movie-overlay"
      role="dialog"
      aria-label="当選後の動画演出"
      aria-modal="true"
    >
      <video
        /* 動画が選び直された場合にvideo要素も作り直し、必ず先頭から再生させます。 */
        key={moviePath}
        className="win-movie"
        src={moviePath}
        /* 表示直後に再生を開始します。mutedとの組み合わせによりブラウザの自動再生条件も満たします。 */
        autoPlay
        /* 動画ファイル内の音声は一切使わず、既存の音声管理だけを利用します。 */
        muted
        /* モバイル端末でもOS標準プレイヤーへ切り替えず、演出レイヤー内で再生します。 */
        playsInline
        /* 表示後すぐ再生できるよう、ブラウザへ動画データの事前取得を指示します。 */
        preload="auto"
        /* 固定秒数のタイマーではなく、動画が実際に末尾へ到達したことを基準に通知します。 */
        onEnded={onEnded}
      />
    </div>
  )
}
