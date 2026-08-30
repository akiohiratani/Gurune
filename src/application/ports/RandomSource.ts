/**
 * 0以上1未満の乱数を供給するApplication層のポートです。
 * 倍率判定からMath.randomを分離し、Domain/Applicationの抽選処理を差し替え可能にします。
 */
export interface RandomSource {
  next(): number
}
