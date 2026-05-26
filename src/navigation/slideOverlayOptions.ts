import type { Options } from 'react-native-navigation';

/** Reusable options for overlay screens that animate via Reanimated (no native animation). */
export const slideOverlayOptions: Options = {
  topBar: {
    visible: false,
  },
  statusBar: {
    style: 'light',
    drawBehind: true,
    backgroundColor: 'transparent',
  },
  layout: {
    backgroundColor: 'transparent',
    componentBackgroundColor: 'transparent',
  },
  window: {
    backgroundColor: 'transparent',
  },
  overlay: {
    interceptTouchOutside: false,
  },
  animations: {
    showOverlay: {
      alpha: { from: 0, to: 0, duration: 0 },
      translationX: { from: 0, to: 0, duration: 0 },
    },
    dismissOverlay: {
      alpha: { from: 0, to: 0, duration: 0 },
      translationX: { from: 0, to: 0, duration: 0 },
    },
  },
};
