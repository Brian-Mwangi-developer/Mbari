import {PermissionsAndroid, Platform} from 'react-native';

import NativeVoiceRecorder from '@/native/NativeVoiceRecorder';

/** A finished take, kept on the phone until it is sent. */
export type Recording = {uri: string; durationMs: number};

export type MicPermission = 'granted' | 'denied' | 'blocked';

/** False off Android, in tests, and in an APK built before the recorder existed. */
export function recorderAvailable(): boolean {
  return NativeVoiceRecorder != null;
}

export async function requestMic(): Promise<MicPermission> {
  if (Platform.OS !== 'android') {
    return 'denied';
  }
  const permission = PermissionsAndroid.PERMISSIONS.RECORD_AUDIO;
  if (await PermissionsAndroid.check(permission)) {
    return 'granted';
  }
  const result = await PermissionsAndroid.request(permission, {
    title: 'Use the microphone?',
    message: 'Mbarĩ records your voice so you can send the update to your community in their own language.',
    buttonPositive: 'Allow',
    buttonNegative: 'Not now',
  });
  if (result === PermissionsAndroid.RESULTS.GRANTED) {
    return 'granted';
  }
  return result === PermissionsAndroid.RESULTS.NEVER_ASK_AGAIN ? 'blocked' : 'denied';
}

function recorder() {
  if (!NativeVoiceRecorder) {
    throw new Error('Recording needs the latest build of the app.');
  }
  return NativeVoiceRecorder;
}

export const startRecording = () => recorder().start();
export const stopRecording = (): Promise<Recording> => recorder().stop();
export const cancelRecording = () => NativeVoiceRecorder?.cancel();

/**
 * Loudness 0..1 for the visual. MediaRecorder's peak amplitude is small for
 * normal speech, so it is lifted with a square root: talking fills the ring,
 * silence leaves it still.
 */
export function readLevel(): number {
  const raw = NativeVoiceRecorder?.level() ?? 0;
  return Math.min(1, Math.sqrt(raw) * 1.25);
}

export const playRecording = (uri: string) => recorder().play(uri);
export const stopPlayback = () => NativeVoiceRecorder?.stopPlayback();
export const playbackPosition = () => NativeVoiceRecorder?.position() ?? 0;

/** "0:07", "2:30". */
export function formatClock(ms: number): string {
  const s = Math.max(0, Math.floor(ms / 1000));
  return `${Math.floor(s / 60)}:${String(s % 60).padStart(2, '0')}`;
}
