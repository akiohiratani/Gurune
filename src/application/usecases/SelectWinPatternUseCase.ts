// 当選演出用の画像選択をアプリケーションのユースケースとして表現します。
// UIやインフラストラクチャが直接セレクターを呼び出さないようにし、依存方向を保ちます。
import type { WinPatternSelector } from '../ports/WinPatternSelector'

export class SelectWinPatternUseCase {
  private readonly selector: WinPatternSelector

  constructor(selector: WinPatternSelector) {
    this.selector = selector
  }

  execute(): string {
    // 選択方法はポートへ委譲し、ユースケースは処理の入口だけを担当します。
    return this.selector.select()
  }
}