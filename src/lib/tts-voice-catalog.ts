/** 内置离线音色目录 — 与 NativeThink SherpaTtsPlugin 模型表一致 */
export interface ILocalVoice {
  id: string;
  name: string;
  gender: 'female' | 'male';
  accent: '美音' | '英音';
  modelId: 'kokoro-v1_1' | 'piper-lessac';
  speakerId: number;
  note: string;
}

export const KOKORO_VOICES: ILocalVoice[] = [
  { id: 'kokoro:af_bella', name: 'Bella', gender: 'female', accent: '美音', modelId: 'kokoro-v1_1', speakerId: 2, note: '温暖亲切' },
  { id: 'kokoro:af_heart', name: 'Heart', gender: 'female', accent: '美音', modelId: 'kokoro-v1_1', speakerId: 3, note: '柔和自然' },
  { id: 'kokoro:af_nicole', name: 'Nicole', gender: 'female', accent: '美音', modelId: 'kokoro-v1_1', speakerId: 6, note: '轻柔低语' },
  { id: 'kokoro:af_sarah', name: 'Sarah', gender: 'female', accent: '美音', modelId: 'kokoro-v1_1', speakerId: 9, note: '清晰标准' },
  { id: 'kokoro:af_sky', name: 'Sky', gender: 'female', accent: '美音', modelId: 'kokoro-v1_1', speakerId: 10, note: '年轻活泼' },
  { id: 'kokoro:am_adam', name: 'Adam', gender: 'male', accent: '美音', modelId: 'kokoro-v1_1', speakerId: 11, note: '沉稳' },
  { id: 'kokoro:am_michael', name: 'Michael', gender: 'male', accent: '美音', modelId: 'kokoro-v1_1', speakerId: 16, note: '自然' },
  { id: 'kokoro:am_puck', name: 'Puck', gender: 'male', accent: '美音', modelId: 'kokoro-v1_1', speakerId: 18, note: '活泼' },
  { id: 'kokoro:am_santa', name: 'Santa', gender: 'male', accent: '美音', modelId: 'kokoro-v1_1', speakerId: 19, note: '低沉厚重' },
  { id: 'kokoro:bf_emma', name: 'Emma', gender: 'female', accent: '英音', modelId: 'kokoro-v1_1', speakerId: 21, note: '标准英音' },
  { id: 'kokoro:bm_george', name: 'George', gender: 'male', accent: '英音', modelId: 'kokoro-v1_1', speakerId: 26, note: '沉稳英音' },
];

export const FALLBACK_VOICE: ILocalVoice = {
  id: 'piper:lessac',
  name: 'Lessac',
  gender: 'female',
  accent: '美音',
  modelId: 'piper-lessac',
  speakerId: 0,
  note: '经典离线兜底',
};

export const DEFAULT_LOCAL_VOICE_ID = 'kokoro:af_sarah';

export function listLocalVoices(): ILocalVoice[] {
  return [...KOKORO_VOICES, FALLBACK_VOICE];
}

export function isLocalVoiceId(uri: string | null | undefined): boolean {
  return !!uri && (uri.startsWith('kokoro:') || uri.startsWith('piper:'));
}

export function findLocalVoice(uri: string | null | undefined): ILocalVoice | null {
  if (!uri) return null;
  return listLocalVoices().find((v) => v.id === uri) ?? null;
}
