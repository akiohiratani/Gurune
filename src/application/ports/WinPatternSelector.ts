// 当選時に表示する演出画像を選択するためのアプリケーション層の契約です。
// 具体的な乱数生成やファイルパスの形式は、このポートを実装するインフラ層に隠蔽します。
export interface WinPatternSelector {
  select(): string
}