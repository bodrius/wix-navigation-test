import { Extrapolation, interpolate } from 'react-native-reanimated';

import { LEADERBOARD_TITLE_CROSSFADE_MIDPOINT } from '../constants/leaderboard';

export const getHomeTitleOpacity = (openProgress: number): number => {
  'worklet';
  return interpolate(
    openProgress,
    [0, LEADERBOARD_TITLE_CROSSFADE_MIDPOINT],
    [1, 0],
    Extrapolation.CLAMP,
  );
};

export const getLeaderboardTitleOpacity = (openProgress: number): number => {
  'worklet';
  return interpolate(
    openProgress,
    [LEADERBOARD_TITLE_CROSSFADE_MIDPOINT, 1],
    [0, 1],
    Extrapolation.CLAMP,
  );
};
