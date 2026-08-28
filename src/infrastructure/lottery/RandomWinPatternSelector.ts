// public/pattern/win/ にある1.png〜6.pngを当選演出の候補として扱います。
// この実装は乱数とWeb公開パスを知りますが、上位層はWinPatternSelectorだけに依存します。
import type { WinPatternSelector } from '../../application/ports/WinPatternSelector'

// 画像ファイルの追加・変更時に候補数を一箇所で更新できるよう定数化しています。
const winPatternCount = 6

export class RandomWinPatternSelector implements WinPatternSelector {
  select(): string {
    // Math.random()の範囲は0以上1未満なので、結果は必ず1以上6以下になります。
    const patternNumber = Math.floor(Math.random() * winPatternCount) + 1
    // publicディレクトリはViteのルートとして配信されるため、先頭からのパスを返します。
    return `/pattern/win/${patternNumber}.png`
  }
}