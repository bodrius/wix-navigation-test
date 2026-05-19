import React from 'react';
import { StyleSheet, Text } from 'react-native';
import Animated, {
  useAnimatedStyle,
  type SharedValue,
} from 'react-native-reanimated';

import {
  getHomeTitleOpacity,
  getLeaderboardTitleOpacity,
} from '../utils/leaderboardTitleOpacity';

const HOME_TITLE = 'CAMERA';
const LEADERBOARD_TITLE = 'Leaderboard';
const TOP_BAR_TITLE_TOP_PADDING = 8;

type AnimatedTitleCrossfadeProps = {
  openProgress: SharedValue<number>;
  safeAreaTop: number;
};

/** Single header slot: CAMERA and Leaderboard crossfade in place (reverse on close). */
export const AnimatedTitleCrossfade = ({
  openProgress,
  safeAreaTop,
}: AnimatedTitleCrossfadeProps) => {
  const homeStyle = useAnimatedStyle(() => ({
    opacity: getHomeTitleOpacity(openProgress.value),
  }));

  const leaderboardStyle = useAnimatedStyle(() => ({
    opacity: getLeaderboardTitleOpacity(openProgress.value),
  }));

  return (
    <Animated.View
      style={[styles.host, { top: safeAreaTop + TOP_BAR_TITLE_TOP_PADDING }]}
      pointerEvents="none">
      <Animated.Text style={[styles.title, homeStyle]}>{HOME_TITLE}</Animated.Text>
      <Animated.Text style={[styles.title, styles.titleOverlay, leaderboardStyle]}>
        {LEADERBOARD_TITLE}
      </Animated.Text>
    </Animated.View>
  );
};

const styles = StyleSheet.create({
  host: {
    position: 'absolute',
    left: 0,
    right: 0,
    alignItems: 'center',
    zIndex: 25,
    elevation: 25,
  },
  title: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#ffffff',
    textAlign: 'center',
  },
  titleOverlay: {
    position: 'absolute',
  },
});
