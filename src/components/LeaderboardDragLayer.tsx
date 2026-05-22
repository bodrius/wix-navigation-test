import React from 'react';
import { StyleSheet, useWindowDimensions } from 'react-native';
import Animated, {
  Extrapolation,
  interpolate,
  useAnimatedStyle,
} from 'react-native-reanimated';

import { LEADERBOARD_BACKDROP_MAX_OPACITY } from '../constants/leaderboard';
import {
  isLeaderboardOverlayOpen,
  leaderboardOpenProgress,
} from '../state/leaderboardTransitionState';
import { LeaderboardPanel } from './LeaderboardPanel';

type LeaderboardDragLayerProps = {
  safeAreaTop: number;
};

export const LeaderboardDragLayer = ({ safeAreaTop }: LeaderboardDragLayerProps) => {
  const { width: screenWidth } = useWindowDimensions();

  const overlayStyle = useAnimatedStyle(() => ({
    opacity: leaderboardOpenProgress.value * LEADERBOARD_BACKDROP_MAX_OPACITY,
  }));

  const panelStyle = useAnimatedStyle(() => {
    const translateX = interpolate(
      leaderboardOpenProgress.value,
      [0, 1],
      [-screenWidth, 0],
      Extrapolation.CLAMP,
    );

    return { transform: [{ translateX }] };
  });

  const layerStyle = useAnimatedStyle(() => {
    const isVisible =
      leaderboardOpenProgress.value > 0 && isLeaderboardOverlayOpen.value === 0;

    return { opacity: isVisible ? 1 : 0 };
  });

  return (
    <Animated.View
      style={[styles.layer, { width: screenWidth }, layerStyle]}
      pointerEvents="box-none">
      <Animated.View style={[styles.overlay, overlayStyle]} pointerEvents="none" />
      <Animated.View style={[styles.panelHost, { width: screenWidth }, panelStyle]}>
        <LeaderboardPanel safeAreaTop={safeAreaTop} />
      </Animated.View>
    </Animated.View>
  );
};

const styles = StyleSheet.create({
  layer: {
    ...StyleSheet.absoluteFillObject,
    zIndex: 20,
    elevation: 20,
  },
  overlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: '#000000',
  },
  panelHost: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'transparent',
  },
});
