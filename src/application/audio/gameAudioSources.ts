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

export const gameAudioSources = [...countdownVoiceSources, winVoiceSource] as const
