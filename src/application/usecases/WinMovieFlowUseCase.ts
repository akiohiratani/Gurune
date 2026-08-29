import type { GameStatus } from '../../domain/game/Game'
import type { WinMovieSelector } from '../ports/WinMovieSelector'

// 大当たり演出から動画演出へ移るときに、呼び出し側へ適用してもらう状態と動画パスです。
export type StartWinMovieTransition = {
  status: 'playingWinMovie'
  moviePath: string
}

// 動画終了後に次の抽選へ移るときの状態です。
// currentIndex: 0 は、3つ作り直した保留の先頭から抽選を再開することを表します。
export type CompleteWinMovieTransition = {
  status: 'running'
  currentIndex: 0
}

/**
 * 「大当たり演出 → 動画再生 → 次の抽選」という遷移を管理するApplication層のユースケースです。
 * Reactコンポーネントがゲーム状態を独自判断しないように、遷移可能かどうかもここで判定します。
 */
export class WinMovieFlowUseCase {
  private readonly selector: WinMovieSelector

  constructor(selector: WinMovieSelector) {
    this.selector = selector
  }

  start(currentStatus: GameStatus): StartWinMovieTransition | null {
    // 大当たり演出中からのみ動画へ進めます。
    // ほかの状態から誤って呼ばれた場合は何も返さず、抽選の二重進行を防ぎます。
    if (currentStatus !== 'celebrating') return null

    return {
      status: 'playingWinMovie',
      // このタイミングで選択するため、大当たりが発生するたびに新しい乱数で動画が決まります。
      moviePath: this.selector.select(),
    }
  }

  complete(currentStatus: GameStatus): CompleteWinMovieTransition | null {
    // 実際に動画再生中である場合だけ、次の抽選への遷移を許可します。
    // endedイベントが重複して通知されても、runningへ移った後の呼び出しは無視されます。
    if (currentStatus !== 'playingWinMovie') return null

    return {
      status: 'running',
      currentIndex: 0,
    }
  }
}
