import { useCallback, useEffect, useState } from 'react';
import { useWindowDimensions } from 'react-native';
import { Gesture } from 'react-native-gesture-handler';
import { Navigation } from 'react-native-navigation';
import {
  Extrapolation,
  interpolate,
  runOnJS,
  useAnimatedStyle,
  useSharedValue,
  withSpring,
  type SharedValue,
} from 'react-native-reanimated';

import {
  LEADERBOARD_BACKDROP_MAX_OPACITY,
  LEADERBOARD_DRAG_DISTANCE_RATIO,
  LEADERBOARD_OPEN_SPRING,
} from '../constants/leaderboard';

const CLOSE_VELOCITY_THRESHOLD = 700;
const CLOSE_DISTANCE_RATIO = 0.25;

type UseSlideOverlayOptions = {
  componentId: string;
  /** Global mutable to keep in sync with internal openProgress (UI-thread). */
  externalProgress?: SharedValue<number>;
  backdropMaxOpacity?: number;
};

export const useSlideOverlay = ({
  componentId,
  externalProgress,
  backdropMaxOpacity = LEADERBOARD_BACKDROP_MAX_OPACITY,
}: UseSlideOverlayOptions) => {
  const { width: screenWidth } = useWindowDimensions();

  const internalOpenProgress = useSharedValue(externalProgress?.value ?? 0);
  const openProgress = externalProgress ?? internalOpenProgress;
  const gestureStart = useSharedValue(0);
  const [overlayReady, setOverlayReady] = useState(false);

  const closeScreen = useCallback(() => {
    Navigation.dismissOverlay(componentId);
  }, [componentId]);

  const animateClose = useCallback(() => {
    openProgress.value = withSpring(0, LEADERBOARD_OPEN_SPRING, finished => {
      if (finished) {
        runOnJS(closeScreen)();
      }
    });
  }, [closeScreen, openProgress]);

  useEffect(() => {
    const frame = requestAnimationFrame(() => {
      if (openProgress.value <= 0) {
        openProgress.value = withSpring(1, LEADERBOARD_OPEN_SPRING);
      }
      setOverlayReady(true);
    });

    return () => cancelAnimationFrame(frame);
  }, [openProgress]);

  const panGesture = Gesture.Pan()
    .activeOffsetX(-12)
    .failOffsetY([-18, 18])
    .onStart(() => {
      gestureStart.value = openProgress.value;
    })
    .onUpdate(event => {
      if (event.translationX >= 0) {
        return;
      }

      const dragProgress = Math.min(
        Math.abs(event.translationX) / (screenWidth * LEADERBOARD_DRAG_DISTANCE_RATIO),
        gestureStart.value,
      );

      openProgress.value = Math.max(0, gestureStart.value - dragProgress);
    })
    .onEnd(event => {
      const closeDistance = Math.abs(event.translationX);
      const shouldCloseByDistance = closeDistance >= screenWidth * CLOSE_DISTANCE_RATIO;
      const shouldClose =
        shouldCloseByDistance ||
        event.velocityX < -CLOSE_VELOCITY_THRESHOLD;

      if (shouldClose) {
        runOnJS(animateClose)();
        return;
      }

      openProgress.value = withSpring(1, LEADERBOARD_OPEN_SPRING);
    });

  const backdropStyle = useAnimatedStyle(() => ({
    opacity: openProgress.value * backdropMaxOpacity,
  }));

  const panelStyle = useAnimatedStyle(() => {
    const translateX = interpolate(
      openProgress.value,
      [0, 1],
      [-screenWidth, 0],
      Extrapolation.CLAMP,
    );

    return { transform: [{ translateX }] };
  });

  return {
    openProgress,
    panGesture,
    backdropStyle,
    panelStyle,
    animateClose,
    overlayReady,
  };
};
