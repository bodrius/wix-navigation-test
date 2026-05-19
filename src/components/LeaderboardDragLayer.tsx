import React from 'react';
import { StyleSheet, useWindowDimensions } from 'react-native';
import Animated, {
  Extrapolation,
  interpolate,
  useAnimatedStyle,
  type SharedValue,
} from 'react-native-reanimated';

import { LEADERBOARD_BACKDROP_MAX_OPACITY } from '../constants/leaderboard';
import { LeaderboardPanel } from './LeaderboardPanel';

type LeaderboardDragLayerProps = {
  openProgress: SharedValue<number>;
  safeAreaTop: number;
};

export const LeaderboardDragLayer = ({
  openProgress,
  safeAreaTop,
}: LeaderboardDragLayerProps) => {
  const { width: screenWidth } = useWindowDimensions();

  const overlayStyle = useAnimatedStyle(() => {
    const opacity = openProgress.value * LEADERBOARD_BACKDROP_MAX_OPACITY;

    return { opacity };
  });

  const panelStyle = useAnimatedStyle(() => {
    const translateX = interpolate(
      openProgress.value,
      [0, 1],
      [-screenWidth, 0],
      Extrapolation.CLAMP,
    );

    return { transform: [{ translateX }] };
  });

  const layerStyle = useAnimatedStyle(() => {
    return {
      opacity: openProgress.value > 0 ? 1 : 0,
    };
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
