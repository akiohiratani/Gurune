import type { AudioPlayback, AudioPlayer } from '../ports/AudioPlayer'
import { gameAudioSources } from './gameAudioSources'

const VOICE_VARIATION_COUNT = 3

export class GameAudioService {
  private readonly audioPlayer: AudioPlayer
  private readonly selectVariation: () => number
  private preloadPromise: Promise<void> | null = null
  private countdownVariation: number | null = null
  private currentCountdownSource: string | null = null

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

  stopCountdown(): void {
    if (this.currentCountdownSource) {
      this.audioPlayer.stop(this.currentCountdownSource)
      this.currentCountdownSource = null
    }
  }

  reset(): void {
    this.stopCountdown()
    this.countdownVariation = null
  }
}
