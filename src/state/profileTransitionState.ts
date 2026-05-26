import { makeMutable } from 'react-native-reanimated';

/** 0 = closed, 1 = fully open — drives crossfade between Leaderboard ↔ User Profile titles. */
export const profileOpenProgress = makeMutable(0);
