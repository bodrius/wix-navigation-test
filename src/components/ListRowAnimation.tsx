import React from 'react';
import { Pressable, StyleSheet, type StyleProp, type ViewStyle } from 'react-native';
import { Gesture, GestureDetector } from 'react-native-gesture-handler';
import Animated, {
  Extrapolation,
  interpolate,
  runOnJS,
  useAnimatedStyle,
  useSharedValue,
  withSpring,
  type SharedValue,
} from 'react-native-reanimated';
import type { ListRowAnimationConfig } from '../types/listRowAnimation';

type ListRowAnimationProps = {
  children: React.ReactNode;
  isActive: boolean;
  progress: SharedValue<number>;
  screenWidth: number;
  travelDistance: number;
  config: ListRowAnimationConfig;
  onPressIn: () => void;
  onPress: () => void;
  onDragOpen: () => void;
  onSwipeCancel: () => void;
  rowStyle?: StyleProp<ViewStyle>;
  rowHostStyle?: StyleProp<ViewStyle>;
};

export const ListRowAnimation = ({
  children,
  isActive,
  progress,
  screenWidth,
  travelDistance,
  config,
  onPressIn,
  onPress,
  onDragOpen,
  onSwipeCancel,
  rowStyle,
  rowHostStyle,
}: ListRowAnimationProps) => {
  const didTriggerOpen = useSharedValue(false);
  const didTriggerDragOpen = useSharedValue(false);
  const openDistance = config.openDistancePx ?? config.openThreshold * screenWidth;

  const animatedRowStyle = useAnimatedStyle(() => {
    const translateX = isActive
      ? interpolate(progress.value, [0, 1], [0, travelDistance], Extrapolation.CLAMP)
      : 0;
    const inactiveOpacity = interpolate(progress.value, [0, 1], [1, 0.32], Extrapolation.CLAMP);

    return {
      transform: [{ translateX }],
      opacity: isActive ? 1 : inactiveOpacity,
      zIndex: isActive ? 1000 : 1,
      elevation: isActive ? 1000 : 0,
    };
  }, [isActive, progress, travelDistance]);

  const swipeToOpenGesture = Gesture.Pan()
    .activeOffsetX(config.activeOffsetX ?? 8)
    .failOffsetY(config.failOffsetY ?? [-14, 14])
    .onBegin(() => {
      didTriggerOpen.value = false;
      didTriggerDragOpen.value = false;
      runOnJS(onPressIn)();
    })
    .onUpdate(event => {
      if (event.translationX <= 0 || didTriggerOpen.value) {
        return;
      }

      const dragOpenOffset = config.dragOpenTriggerOffset ?? openDistance;
      if (!didTriggerDragOpen.value && event.translationX >= dragOpenOffset) {
        didTriggerDragOpen.value = true;
        runOnJS(onDragOpen)();
      }

      const nextProgress = Math.max(0, Math.min(1, event.translationX / screenWidth));
      progress.value = nextProgress;
    })
    .onEnd(event => {
      if (didTriggerOpen.value) {
        return;
      }

      const shouldOpen =
        event.translationX >= openDistance ||
        event.velocityX >= config.openVelocityThreshold;

      if (shouldOpen) {
        didTriggerOpen.value = true;
        progress.value = withSpring(1, config.springConfig);
        runOnJS(onPress)();
        return;
      }

      progress.value = withSpring(0, config.springConfig, finished => {
        if (finished) {
          runOnJS(onSwipeCancel)();
        }
      });
    });

  return (
    <GestureDetector gesture={swipeToOpenGesture}>
      <Animated.View style={[styles.rowHost, animatedRowStyle, rowHostStyle]}>
        <Pressable style={rowStyle} onPressIn={onPressIn} onPress={onPress}>
          {children}
        </Pressable>
      </Animated.View>
    </GestureDetector>
  );
};

const styles = StyleSheet.create({
  rowHost: {
    overflow: 'visible',
  },
});
