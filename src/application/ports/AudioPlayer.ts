export type AudioPlayback = {
  ended: Promise<void>
}

export interface AudioPlayer {
  preload(sources: readonly string[]): Promise<void>
  enable(): Promise<void>
  play(source: string): Promise<AudioPlayback>
  stop(source: string): void
  stopAll(): void
}
