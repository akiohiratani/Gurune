export type AudioPlayback = {
  ended: Promise<void>
  durationSeconds: number
}

export interface AudioPlayer {
  preload(sources: readonly string[]): Promise<void>
  enable(): Promise<void>
  play(source: string, options?: { loop?: boolean }): Promise<AudioPlayback>
  isPlaying(source: string): boolean
  stop(source: string): void
  stopAll(): void
}
