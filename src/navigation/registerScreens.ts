import { Navigation } from 'react-native-navigation';

import HomeScreen from '../pages/HomeScreen';
import SecondScreen from '../pages/SecondScreen';
import { ScreenNames } from './screenNames';

export function registerScreens(): void {
  Navigation.registerComponent(ScreenNames.Home, () => HomeScreen);
  Navigation.registerComponent(ScreenNames.Second, () => SecondScreen);
}
