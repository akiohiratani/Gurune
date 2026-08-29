import type { WinMovieSelector } from '../../application/ports/WinMovieSelector'

// public/movie/win/ に配置する動画は1.mp4から7.mp4までの7本です。
// 候補数やファイルパスというリソース固有の知識はInfrastructure層にまとめています。
const winMovieCount = 7

/** public/movie/win/1.mp4～7.mp4から、毎回ランダムに1本を選択します。 */
export class RandomWinMovieSelector implements WinMovieSelector {
  select(): string {
    // Math.random()は0以上1未満なので、切り捨て後に1を加えると必ず1～7の整数になります。
    const movieNumber = Math.floor(Math.random() * winMovieCount) + 1

    // Viteではpublic配下がWebルートとして公開されるため、publicを含めない絶対パスを返します。
    return `/movie/win/${movieNumber}.mp4`
  }
}
