/**
 * @format
 */

import {AppRegistry} from 'react-native';
import App from './src/App';
import {name as appName} from './app.json';
import {registerBackgroundHandler} from './src/lib/push';

// Before the app mounts: a notification can wake the app with no UI.
registerBackgroundHandler();

AppRegistry.registerComponent(appName, () => App);
