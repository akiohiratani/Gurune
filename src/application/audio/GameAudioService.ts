import type { AudioPlayback, AudioPlayer } from '../ports/AudioPlayer'
import {
  bgmSource,
  gameAudioSources,
  winBreakdownVoiceSource,
  winMultiplierVoiceSource,
  winVoiceSource,
} from './gameAudioSources'

const VOICE_VARIATION_COUNT = 3

export class GameAudioService {
  private readonly audioPlayer: AudioPlayer
  private readonly selectVariation: () => number
  private preloadPromise: Promise<void> | null = null
  private countdownVariation: number | null = null
  private currentCountdownSource: string | null = null
  private isWinVoicePlaying = false
  // 内訳演出の2種類の音源を個別管理し、リセット時に確実に停止できるようにします。
  private isWinBreakdownVoicePlaying = false
  private isWinMultiplierVoicePlaying = false
  private bgmStartPromise: Promise<void> | null = null

  constructor(
    audioPlayer: AudioPlayer,
    selectVariation: () => number = () =>
      Math.floor(Math.random() * VOICE_VARIATION_COUNT) + 1,
  ) {
    this.audioPlayer = audioPlayer
    this.selectVariation = selectVariation
  }

  preload(): Promise<void> {
    this.preloadPromise ??= this.audioPlayer.preload(gameAudioSources).catch((error: unknown) => {
      this.preloadPromise = null
      throw error
    })
    return this.preloadPromise
  }

  async enable(): Promise<void> {
    // enable() is intentionally invoked first so resume happens in the user gesture.
    const enablePromise = this.audioPlayer.enable()
    await Promise.all([enablePromise, this.preload()])
  }

  async playBgm(): Promise<void> {
    if (this.audioPlayer.isPlaying(bgmSource)) return
    if (this.bgmStartPromise) return this.bgmStartPromise

    this.bgmStartPromise = this.audioPlayer
      .play(bgmSource, { loop: true })
      .then(() => undefined)
      .finally(() => {
        this.bgmStartPromise = null
      })
    return this.bgmStartPromise
  }

  stopBgm(): void {
    this.audioPlayer.stop(bgmSource)
  }

  isBgmPlaying(): boolean {
    return this.audioPlayer.isPlaying(bgmSource)
  }

  beginCountdownSequence(): void {
    this.stopCountdown()
    this.countdownVariation = this.selectVariation()
  }

  async playCountdown(remainingDraws: number): Promise<AudioPlayback> {
    if (this.countdownVariation === null) {
      throw new Error('Countdown sequence has not been initialized.')
    }

    this.stopCountdown()
    const source = `/count/voice/${remainingDraws}/${this.countdownVariation}.mp3`
    this.currentCountdownSource = source

    try {
      return await this.audioPlayer.play(source)
    } catch (error) {
      this.currentCountdownSource = null
      throw error
    }
  }

  async playWin(): Promise<AudioPlayback> {
    this.stopCountdown()
    this.stopWin()
    this.isWinVoicePlaying = true

    try {
      const playback = await this.audioPlayer.play(winVoiceSource)
      void playback.ended.then(() => {
        this.isWinVoicePlaying = false
      })
      return playback
    } catch (error) {
      this.isWinVoicePlaying = false
      throw error
    }
  }

  /** 777の襖・フラッシュ演出用音源を先頭から再生します。 */
  async playWinBreakdown(): Promise<AudioPlayback> {
    // 重複呼び出し時は旧再生を止め、同じ音源が重ならないようにします。
    this.stopWinBreakdown()
    this.isWinBreakdownVoicePlaying = true

    try {
      const playback = await this.audioPlayer.play(winBreakdownVoiceSource)
      // 自然終了時にも再生状態を戻し、後続の停止判定を正しく保ちます。
      void playback.ended.then(() => {
        this.isWinBreakdownVoicePlaying = false
      })
      return playback
    } catch (error) {
      this.isWinBreakdownVoicePlaying = false
      throw error
    }
  }

  /** ×3画像表示中の音源を1回再生します。3回の繰り返し制御はゲーム進行側が担います。 */
  async playWinMultiplier(): Promise<AudioPlayback> {
    this.stopWinMultiplier()
    this.isWinMultiplierVoicePlaying = true

    try {
      const playback = await this.audioPlayer.play(winMultiplierVoiceSource)
      void playback.ended.then(() => {
        this.isWinMultiplierVoicePlaying = false
      })
      return playback
    } catch (error) {
      this.isWinMultiplierVoicePlaying = false
      throw error
    }
  }

  stopCountdown(): void {
    if (this.currentCountdownSource) {
      this.audioPlayer.stop(this.currentCountdownSource)
      this.currentCountdownSource = null
    }
  }

  stopWin(): void {
    if (!this.isWinVoicePlaying) return
    this.audioPlayer.stop(winVoiceSource)
    this.isWinVoicePlaying = false
  }

  /** 777演出音が再生中の場合だけ停止し、停止済み音源への不要な操作を避けます。 */
  stopWinBreakdown(): void {
    if (!this.isWinBreakdownVoicePlaying) return
    this.audioPlayer.stop(winBreakdownVoiceSource)
    this.isWinBreakdownVoicePlaying = false
  }

  /** ×3演出音が再生中の場合だけ停止します。 */
  stopWinMultiplier(): void {
    if (!this.isWinMultiplierVoicePlaying) return
    this.audioPlayer.stop(winMultiplierVoiceSource)
    this.isWinMultiplierVoicePlaying = false
  }

  reset(): void {
    this.stopCountdown()
    this.stopWin()
    // ゲーム途中のリセットでも内訳演出音を残しません。
    this.stopWinBreakdown()
    this.stopWinMultiplier()
    this.countdownVariation = null
  }
}
