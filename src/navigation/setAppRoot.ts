import { Navigation } from 'react-native-navigation';

import { ScreenNames } from './screenNames';

export function setAppRoot(): void {
  Navigation.setRoot({
    root: {
      stack: {
        children: [
          {
            component: {
              name: ScreenNames.Home,
            },
          },
        ],
      },
    },
  });
}
