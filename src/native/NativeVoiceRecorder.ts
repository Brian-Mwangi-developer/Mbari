import type {TurboModule} from 'react-native';
import {TurboModuleRegistry} from 'react-native';

/**
 * Records a voice message with Android's MediaRecorder and plays it back with
 * MediaPlayer (android/app/src/main/java/com/mbari/app/VoiceRecorderModule.kt).
 * AAC in an .m4a file, mono, in the app's cache directory.
 */
export interface Spec extends TurboModule {
  /**
   * Starts recording. Needs RECORD_AUDIO already granted. Rejects with code
   * `permission`, `busy` or `failed`.
   */
  start(): Promise<void>;
  /** Stops and keeps the file. Rejects `idle` when not recording, `too_short` when nothing was captured. */
  stop(): Promise<{uri: string; durationMs: number}>;
  /** Stops and deletes the file. Safe to call at any time. */
  cancel(): void;
  /** Loudness since the last call, 0 to 1. 0 when not recording. */
  level(): number;
  /** Plays a recording. Resolves when it ends or stopPlayback() is called. */
  play(uri: string): Promise<void>;
  stopPlayback(): void;
  /** Playback position in ms; 0 when nothing is playing. */
  position(): number;
}

// `get`, not `getEnforcing`: null off Android, in tests, and in builds made
// before this module existed, so the screen can say so instead of crashing.
export default TurboModuleRegistry.get<Spec>('NativeVoiceRecorder');
