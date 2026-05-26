import React, { useCallback, useEffect, useState } from 'react';
import { Pressable, StyleSheet, useWindowDimensions } from 'react-native';
import { Gesture, GestureDetector, GestureHandlerRootView } from 'react-native-gesture-handler';
import { Navigation } from 'react-native-navigation';
import type {
  NavigationFunctionComponent,
  NavigationProps,
} from 'react-native-navigation';
import Animated, {
  Extrapolation,
  interpolate,
  runOnJS,
  useAnimatedStyle,
  useSharedValue,
  withSpring,
} from 'react-native-reanimated';
import { SafeAreaProvider, useSafeAreaInsets } from 'react-native-safe-area-context';

import { AnimatedTitleCrossfade } from '../components/AnimatedTitleCrossfade';
import { LeaderboardPanel } from '../components/LeaderboardPanel';
import {
  LEADERBOARD_BACKDROP_MAX_OPACITY,
  LEADERBOARD_DRAG_DISTANCE_RATIO,
  LEADERBOARD_OPEN_SNAP_THRESHOLD,
  LEADERBOARD_OPEN_SPRING,
} from '../constants/leaderboard';
import { leaderboardScreenOptions } from '../navigation/leaderboardScreenOptions';
import {
  isLeaderboardOpening,
  isLeaderboardOverlayOpen,
  leaderboardOpenProgress,
} from '../state/leaderboardTransitionState';

const CLOSE_VELOCITY_THRESHOLD = 700;

const LeaderboardScreenContent: React.FC<NavigationProps> = ({ componentId }) => {
  const { width: screenWidth } = useWindowDimensions();
  const { top: safeAreaTop } = useSafeAreaInsets();

  const gestureStart = useSharedValue(0);
  const [overlayReady, setOverlayReady] = useState(false);

  const activateOverlay = useCallback(() => {
    isLeaderboardOpening.value = 0;
    isLeaderboardOverlayOpen.value = 1;
    setOverlayReady(true);
  }, []);

  useEffect(() => {
    Navigation.mergeOptions(componentId, leaderboardScreenOptions);

    const frame = requestAnimationFrame(() => {
      activateOverlay();
    });

    return () => cancelAnimationFrame(frame);
  }, [activateOverlay, componentId]);

  const closeScreen = useCallback(() => {
    isLeaderboardOverlayOpen.value = 0;
    Navigation.dismissOverlay(componentId);
  }, [componentId]);

  const animateClose = useCallback(() => {
    leaderboardOpenProgress.value = withSpring(0, LEADERBOARD_OPEN_SPRING, finished => {
      if (finished) {
        runOnJS(closeScreen)();
      }
    });
  }, [closeScreen]);

  const panGesture = Gesture.Pan()
    .activeOffsetX(-12)
    .failOffsetY([-18, 18])
    .onStart(() => {
      gestureStart.value = leaderboardOpenProgress.value;
    })
    .onUpdate(event => {
      if (event.translationX >= 0) {
        return;
      }

      const dragProgress = Math.min(
        Math.abs(event.translationX) / (screenWidth * LEADERBOARD_DRAG_DISTANCE_RATIO),
        gestureStart.value,
      );

      leaderboardOpenProgress.value = Math.max(0, gestureStart.value - dragProgress);
    })
    .onEnd(event => {
      const shouldClose =
        leaderboardOpenProgress.value < LEADERBOARD_OPEN_SNAP_THRESHOLD ||
        event.velocityX < -CLOSE_VELOCITY_THRESHOLD;

      if (shouldClose) {
        runOnJS(animateClose)();
        return;
      }

      leaderboardOpenProgress.value = withSpring(1, LEADERBOARD_OPEN_SPRING);
    });

  const overlayStyle = useAnimatedStyle(() => ({
    opacity:
      isLeaderboardOverlayOpen.value === 1
        ? leaderboardOpenProgress.value * LEADERBOARD_BACKDROP_MAX_OPACITY
        : 0,
  }));

  const panelStyle = useAnimatedStyle(() => {
    const translateX = interpolate(
      leaderboardOpenProgress.value,
      [0, 1],
      [-screenWidth, 0],
      Extrapolation.CLAMP,
    );

    return {
      opacity: isLeaderboardOverlayOpen.value,
      transform: [{ translateX }],
    };
  });

  return (
    <GestureHandlerRootView style={styles.root}>
      <GestureDetector gesture={panGesture}>
        <Animated.View style={styles.root} pointerEvents="box-none">
          <Animated.View
            style={[styles.overlay, overlayStyle]}
            pointerEvents="none"
          />

          <Pressable
            style={styles.dismissArea}
            onPress={animateClose}
            disabled={!overlayReady}
            pointerEvents={overlayReady ? 'auto' : 'none'}
          />

          <Animated.View style={[styles.panelHost, { width: screenWidth }, panelStyle]}>
            <LeaderboardPanel safeAreaTop={safeAreaTop} />
          </Animated.View>

          <AnimatedTitleCrossfade safeAreaTop={safeAreaTop} showOnHomeLayer={false} />
        </Animated.View>
      </GestureDetector>
    </GestureHandlerRootView>
  );
};

const LeaderboardScreen: NavigationFunctionComponent = props => (
  <SafeAreaProvider>
    <LeaderboardScreenContent {...props} />
  </SafeAreaProvider>
);

LeaderboardScreen.options = leaderboardScreenOptions;

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: 'transparent',
  },
  overlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: '#000000',
    zIndex: 1,
  },
  dismissArea: {
    ...StyleSheet.absoluteFillObject,
    zIndex: 2,
  },
  panelHost: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'transparent',
    zIndex: 3,
  },
});

export default LeaderboardScreen;
