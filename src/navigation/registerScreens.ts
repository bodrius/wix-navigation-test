import { Navigation } from 'react-native-navigation';

import HomeScreen from '../pages/HomeScreen';
import LeaderboardScreen from '../pages/LeaderboardScreen';
import ProfileScreen from '../pages/ProfileScreen';
import SecondScreen from '../pages/SecondScreen';
import SelectedLeaderBoardScreen from '../pages/SelectedLeaderBoardScreen';
import { ScreenNames } from './screenNames';

export function registerScreens(): void {
  Navigation.registerComponent(ScreenNames.Home, () => HomeScreen);
  Navigation.registerComponent(ScreenNames.Second, () => SecondScreen);
  Navigation.registerComponent(ScreenNames.Profile, () => ProfileScreen);
  Navigation.registerComponent(ScreenNames.Leaderboard, () => LeaderboardScreen);
  Navigation.registerComponent(ScreenNames.SelectedLeaderBoard, () => SelectedLeaderBoardScreen);
}
