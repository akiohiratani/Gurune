import type { GameStatus } from '../../domain/game/Game'
import type { WinMovieSelector } from '../ports/WinMovieSelector'

// 大当たり演出から動画演出へ移るときに、呼び出し側へ適用してもらう状態と動画パスです。
export type StartWinMovieTransition = {
  status: 'playingWinMovie'
  moviePath: string
}

/**
 * 「大当たり演出 → 動画再生」への遷移を管理するApplication層のユースケースです。
 * 動画終了後はWinBreakdownFlowUseCaseが引き継ぐため、ここでは次抽選へ直接戻しません。
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
}
