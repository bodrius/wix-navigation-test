import type { Options } from 'react-native-navigation';

export const secondScreenOptions: Options = {
  layout: {
    backgroundColor: 'transparent',
    componentBackgroundColor: 'transparent',
  },
  topBar: {
    visible: false,
    height: 0,
  },
  statusBar: {
    drawBehind: true,
  },
  window: {
    backgroundColor: 'transparent',
  },
  overlay: {
    interceptTouchOutside: false,
  },
};
