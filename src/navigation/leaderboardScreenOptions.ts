import type { Options } from 'react-native-navigation';

import { homeScreenOptions } from './homeScreenOptions';

export const leaderboardScreenOptions: Options = {
  ...homeScreenOptions,
  layout: {
    backgroundColor: 'transparent',
    componentBackgroundColor: 'transparent',
  },
  window: {
    backgroundColor: 'transparent',
  },
  topBar: {
    visible: false,
  },
  overlay: {
    interceptTouchOutside: false,
  },
};
