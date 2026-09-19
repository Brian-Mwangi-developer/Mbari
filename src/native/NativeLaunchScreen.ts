import type {TurboModule} from 'react-native';
import {TurboModuleRegistry} from 'react-native';

/**
 * The native splash (android/app/src/main/java/com/mbari/app/LaunchScreen.kt).
 * It stays up until `hide()`, so JavaScript can draw the same mark first.
 */
export interface Spec extends TurboModule {
  hide(): void;
}

// `get`, not `getEnforcing`: null off Android and in tests.
export default TurboModuleRegistry.get<Spec>('NativeLaunchScreen');
