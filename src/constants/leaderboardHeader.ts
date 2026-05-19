export const LEADERBOARD_HEADER_CONTENT_OFFSET = 52;
export const LEADERBOARD_HEADER_TITLE_TOP_PADDING = 8;

export const getLeaderboardListTopInset = (safeAreaTop: number): number =>
  safeAreaTop + LEADERBOARD_HEADER_CONTENT_OFFSET;
