import React, { useMemo } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import Animated, {
  useAnimatedStyle,
  type SharedValue,
} from 'react-native-reanimated';

import {
  getLeaderboardListTopInset,
  LEADERBOARD_HEADER_TITLE_TOP_PADDING,
} from '../constants/leaderboardHeader';
import {
  getHomeTitleOpacity,
  getLeaderboardTitleOpacity,
} from '../utils/leaderboardTitleOpacity';

const HOME_TITLE = 'CAMERA';
const LEADERBOARD_TITLE = 'Leaderboard';

type AnimatedTitleCrossfadeProps = {
  openProgress: SharedValue<number>;
  safeAreaTop: number;
};

/** Single header slot: CAMERA and Leaderboard crossfade in place (reverse on close). */
export const AnimatedTitleCrossfade = ({
  openProgress,
  safeAreaTop,
}: AnimatedTitleCrossfadeProps) => {
  const headerHeight = useMemo(() => getLeaderboardListTopInset(safeAreaTop), [safeAreaTop]);

  const homeStyle = useAnimatedStyle(() => ({
    opacity: getHomeTitleOpacity(openProgress.value),
  }));

  const leaderboardStyle = useAnimatedStyle(() => ({
    opacity: getLeaderboardTitleOpacity(openProgress.value),
  }));

  return (
    <View
      style={[styles.host, { height: headerHeight }]}
      pointerEvents="box-none">
      <View style={styles.backdrop} pointerEvents="none">
        <View style={styles.backdropStrong} />
        <View style={styles.backdropFade} />
      </View>
      <Animated.Text
        style={[
          styles.title,
          { marginTop: safeAreaTop + LEADERBOARD_HEADER_TITLE_TOP_PADDING },
          homeStyle,
        ]}>
        {HOME_TITLE}
      </Animated.Text>
      <Animated.Text
        style={[
          styles.title,
          styles.titleOverlay,
          { top: safeAreaTop + LEADERBOARD_HEADER_TITLE_TOP_PADDING },
          leaderboardStyle,
        ]}>
        {LEADERBOARD_TITLE}
      </Animated.Text>
    </View>
  );
};

const styles = StyleSheet.create({
  host: {
    position: 'absolute',
    left: 0,
    right: 0,
    top: 0,
    alignItems: 'center',
    zIndex: 25,
    elevation: 25,
  },
  backdrop: {
    ...StyleSheet.absoluteFillObject,
  },
  backdropStrong: {
    flex: 0.55,
  },
  backdropFade: {
    flex: 0.45,
    backgroundColor: 'rgba(0, 0, 0, 0)',
  },
  title: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#ffffff',
    textAlign: 'center',
    textShadowColor: 'rgba(0, 0, 0, 0.85)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 6,
  },
  titleOverlay: {
    position: 'absolute',
    left: 0,
    right: 0,
  },
});
