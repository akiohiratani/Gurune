import type { AudioPlayback, AudioPlayer } from '../ports/AudioPlayer'
import { bgmSource, gameAudioSources, winVoiceSource } from './gameAudioSources'

const VOICE_VARIATION_COUNT = 3

export class GameAudioService {
  private readonly audioPlayer: AudioPlayer
  private readonly selectVariation: () => number
  private preloadPromise: Promise<void> | null = null
  private countdownVariation: number | null = null
  private currentCountdownSource: string | null = null
  private isWinVoicePlaying = false
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

  reset(): void {
    this.stopCountdown()
    this.stopWin()
    this.countdownVariation = null
  }
}
