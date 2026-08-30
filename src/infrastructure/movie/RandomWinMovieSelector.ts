import type { WinMovieSelector } from '../../application/ports/WinMovieSelector'
import winMoviePaths from 'virtual:win-movies'

/** public/movie/win/ 内のmp4ファイルから、毎回ランダムに1本を選択します。 */
export class RandomWinMovieSelector implements WinMovieSelector {
  select(): string {
    if (winMoviePaths.length === 0) {
      throw new Error('public/movie/win にmp4ファイルがありません。')
    }

    const movieIndex = Math.floor(Math.random() * winMoviePaths.length)
    return winMoviePaths[movieIndex]
  }
}
