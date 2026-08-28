import type { AudioPlayback, AudioPlayer } from '../../application/ports/AudioPlayer'

type WebkitAudioWindow = Window & {
  webkitAudioContext?: typeof AudioContext
}

type ActivePlayback = {
  node: AudioBufferSourceNode
  dispose: () => void
}

export class BrowserAudioPlayer implements AudioPlayer {
  private context: AudioContext | null = null
  private readonly buffers = new Map<string, AudioBuffer>()
  private readonly preloadPromises = new Map<string, Promise<void>>()
  private readonly activePlaybacks = new Map<string, Set<ActivePlayback>>()

  async preload(sources: readonly string[]): Promise<void> {
    await Promise.all(sources.map((source) => this.preloadOne(source)))
  }

  async enable(): Promise<void> {
    const context = this.getContext()
    if (context.state === 'suspended') {
      await context.resume()
    }

    if (context.state !== 'running') {
      throw new Error(`AudioContext could not be enabled (state: ${context.state}).`)
    }

    // Starting a silent buffer from the click handler unlocks Web Audio on iOS/Safari.
    const silentBuffer = context.createBuffer(1, 1, context.sampleRate)
    const silentSource = context.createBufferSource()
    silentSource.buffer = silentBuffer
    silentSource.connect(context.destination)
    silentSource.onended = () => silentSource.disconnect()
    silentSource.start(0)
  }

  async play(source: string): Promise<AudioPlayback> {
    await this.preloadOne(source)

    const context = this.getContext()
    if (context.state === 'suspended') {
      await context.resume()
    }
    if (context.state !== 'running') {
      throw new Error(`Audio is not enabled; cannot play ${source}.`)
    }

    const buffer = this.buffers.get(source)
    if (!buffer) {
      throw new Error(`Audio buffer is unavailable: ${source}`)
    }

    const node = context.createBufferSource()
    node.buffer = buffer
    node.connect(context.destination)

    const playbacks = this.activePlaybacks.get(source) ?? new Set<ActivePlayback>()
    this.activePlaybacks.set(source, playbacks)
    let resolveEnded: () => void = () => undefined
    const ended = new Promise<void>((resolve) => {
      resolveEnded = resolve
    })
    let disposed = false
    const playback: ActivePlayback = {
      node,
      dispose: () => {
        if (disposed) return
        disposed = true
        node.onended = null
        node.disconnect()
        playbacks.delete(playback)
        if (playbacks.size === 0) this.activePlaybacks.delete(source)
        resolveEnded()
      },
    }
    node.onended = playback.dispose
    playbacks.add(playback)

    try {
      node.start(0)
    } catch (error) {
      playback.dispose()
      console.error(`[AudioPlayer] Failed to play ${source}.`, error)
      throw error
    }

    return { ended, durationSeconds: buffer.duration }
  }

  stop(source: string): void {
    const playbacks = this.activePlaybacks.get(source)
    if (!playbacks) return

    for (const playback of [...playbacks]) {
      try {
        playback.node.stop(0)
      } catch (error) {
        console.warn(`[AudioPlayer] Failed to stop ${source}.`, error)
      } finally {
        playback.dispose()
      }
    }
  }

  stopAll(): void {
    for (const source of [...this.activePlaybacks.keys()]) {
      this.stop(source)
    }
  }

  private getContext(): AudioContext {
    if (this.context && this.context.state !== 'closed') return this.context

    const AudioContextClass =
      window.AudioContext ?? (window as WebkitAudioWindow).webkitAudioContext
    if (!AudioContextClass) {
      throw new Error('Web Audio API is not supported by this browser.')
    }

    this.context = new AudioContextClass()
    return this.context
  }

  private preloadOne(source: string): Promise<void> {
    if (this.buffers.has(source)) return Promise.resolve()

    const existing = this.preloadPromises.get(source)
    if (existing) return existing

    const promise = this.loadBuffer(source).catch((error: unknown) => {
      this.preloadPromises.delete(source)
      console.error(`[AudioPlayer] Failed to preload ${source}.`, error)
      throw error
    })
    this.preloadPromises.set(source, promise)
    return promise
  }

  private async loadBuffer(source: string): Promise<void> {
    const response = await fetch(source)
    if (!response.ok) {
      throw new Error(`Failed to fetch ${source} (${response.status}).`)
    }

    const encodedAudio = await response.arrayBuffer()
    const buffer = await this.getContext().decodeAudioData(encodedAudio)
    this.buffers.set(source, buffer)
  }
}
