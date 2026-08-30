import {
  applyWinMultiplier,
  determineWinMultiplier,
  getUpgradeProbabilityForPattern,
  type GameSettings,
  type GameStatus,
  type PendingWin,
  type WinMultiplier,
  type WinRecord,
} from '../../domain/game/Game'
import type { RandomSource } from '../ports/RandomSource'

/** 動画終了時にPresentationへ返す、倍率確定済みの内訳開始結果です。 */
export type StartWinBreakdownTransition = {
  status: 'revealingWinBreakdown'
  multiplier: WinMultiplier
  records: WinRecord[]
}

/** 内訳演出完了後に、新しい保留の先頭から抽選を再開する指示です。 */
export type CompleteWinBreakdownTransition = {
  status: 'running'
  currentIndex: 0
}

/**
 * 動画終了後の色別確率抽選、倍率確定、履歴反映データ生成、次抽選への遷移を管理します。
 * Reactや画像・音声を参照しないため、ゲーム進行ルールをPresentation層から分離できます。
 */
export class WinBreakdownFlowUseCase {
  private readonly randomSource: RandomSource

  constructor(randomSource: RandomSource) {
    this.randomSource = randomSource
  }

  start(
    currentStatus: GameStatus,
    pendingWin: PendingWin | null,
    currentRecords: readonly WinRecord[],
    settings: Readonly<GameSettings> | null,
  ): StartWinBreakdownTransition | null {
    // 動画終了状態、未確定の当選、開始時設定がすべて揃う場合だけ進めます。
    if (currentStatus !== 'playingWinMovie' || !pendingWin || !settings) return null

    // 元図柄に設定された色を経由して、そのゲーム中固定の昇格確率を解決します。
    const upgradeProbability = getUpgradeProbabilityForPattern(settings, pendingWin.patternNumber)
    // 乱数取得はポートへ、確率境界と倍率決定はDomain層へ委譲します。
    const multiplier = determineWinMultiplier(this.randomSource.next(), upgradeProbability)
    return {
      status: 'revealingWinBreakdown',
      multiplier,
      // 既存履歴を破壊せず、元図柄へ確定倍率を付けたレコードを末尾へ追加します。
      records: [...currentRecords, applyWinMultiplier(pendingWin, multiplier)],
    }
  }

  complete(currentStatus: GameStatus): CompleteWinBreakdownTransition | null {
    // 内訳開示中以外からの完了通知では、次抽選を開始しません。
    if (currentStatus !== 'revealingWinBreakdown') return null

    return { status: 'running', currentIndex: 0 }
  }
}
