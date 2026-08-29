/**
 * 大当たり後に再生する動画を1本選び、ブラウザから参照できるパスを返す契約です。
 *
 * Application層は「動画を選ぶ」という目的だけをこのインターフェース経由で依頼します。
 * 動画の保存場所や候補数、乱数の生成方法はInfrastructure層へ隠蔽することで、
 * ゲーム進行がpublicディレクトリの具体的な構成へ直接依存しないようにしています。
 */
export interface WinMovieSelector {
  select(): string
}
