import { makeMutable } from 'react-native-reanimated';

/** 0 = closed, 1 = fully open — shared by Home drag layer and Leaderboard overlay. */
export const leaderboardOpenProgress = makeMutable(0);

/** 1 when overlay is active and drives the visible panel/title. */
export const isLeaderboardOverlayOpen = makeMutable(0);

/** 1 between showOverlay and componentDidAppear. */
export const isLeaderboardOpening = makeMutable(0);

export const resetLeaderboardTransition = () => {
  isLeaderboardOverlayOpen.value = 0;
  isLeaderboardOpening.value = 0;
  leaderboardOpenProgress.value = 0;
};
