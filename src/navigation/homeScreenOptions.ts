import type { Options } from 'react-native-navigation';

export const homeScreenOptions: Options = {
  topBar: {
    visible: false,
    title: {
      text: '',
    },
    largeTitle: {
      visible: false,
    },
    background: {
      color: 'transparent',
    },
    scrollEdgeAppearance: {
      active: true,
      background: {
        color: 'transparent',
      },
      noBorder: true,
    },
    drawBehind: true,
    noBorder: true,
    elevation: 0,
    borderHeight: 0,
  },
  statusBar: {
    style: 'dark',
    backgroundColor: 'transparent',
    drawBehind: true,
  },
};
