/**
 * @format
 */

import 'react-native-gesture-handler';
import { Navigation } from 'react-native-navigation';

import { registerScreens } from './src/navigation/registerScreens';
import { setAppRoot } from './src/navigation/setAppRoot';

registerScreens();

Navigation.events().registerAppLaunchedListener(() => {
  setAppRoot();
});
