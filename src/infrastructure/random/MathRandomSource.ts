import type { RandomSource } from '../../application/ports/RandomSource'

/** ブラウザ標準のMath.randomをApplication層のRandomSource契約へ適合させます。 */
export class MathRandomSource implements RandomSource {
  next(): number {
    // Math.randomの戻り値域はDomain層が要求する0以上1未満と一致します。
    return Math.random()
  }
}
