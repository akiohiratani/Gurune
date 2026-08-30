export const countdownVoiceSources = [
  '/count/voice/3/1.mp3',
  '/count/voice/3/2.mp3',
  '/count/voice/3/3.mp3',
  '/count/voice/2/1.mp3',
  '/count/voice/2/2.mp3',
  '/count/voice/2/3.mp3',
  '/count/voice/1/1.mp3',
  '/count/voice/1/2.mp3',
  '/count/voice/1/3.mp3',
] as const

export const winVoiceSource = '/pattern/voice/1.mp3' as const

// 777の襖・フラッシュ演出中に再生する音源です。
export const winBreakdownVoiceSource = '/pattern/breakdown/vocie/1.mp3' as const

// 4.pngの×3登場演出開始から3回連続再生する音源です。
export const winMultiplierVoiceSource = '/pattern/breakdown/vocie/2.mp3' as const

export const bgmSource = '/bgm/1.mp3' as const

// ゲーム開始時にまとめて読み込み、演出開始時の通信待ちを避けます。
export const gameAudioSources = [
  ...countdownVoiceSources,
  winVoiceSource,
  winBreakdownVoiceSource,
  winMultiplierVoiceSource,
  bgmSource,
] as const
