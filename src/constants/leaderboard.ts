import type { ListRowAnimationConfig } from '../types/listRowAnimation';

/** Crossfade titles when the panel is halfway on screen (openProgress 0.5). */
export const LEADERBOARD_TITLE_CROSSFADE_MIDPOINT = 0.5;

/** Black overlay animates 0 → 80% opacity (open) and 80% → 0 (close swipe) */
export const LEADERBOARD_BACKDROP_MAX_OPACITY = 0.9;
export const LEADERBOARD_OPEN_SNAP_THRESHOLD = 0.35;
export const LEADERBOARD_OPEN_VELOCITY_THRESHOLD = 650;
export const LEADERBOARD_DRAG_DISTANCE_RATIO = 0.55;
export const LEADERBOARD_OPEN_SPRING = { damping: 22, stiffness: 280 };

export const LEADERBOARD_ROW_ANIMATION_CONFIG: ListRowAnimationConfig = {
  openThreshold: 0.25,
  openDistancePx: 100,
  openVelocityThreshold: LEADERBOARD_OPEN_VELOCITY_THRESHOLD,
  springConfig: LEADERBOARD_OPEN_SPRING,
};
