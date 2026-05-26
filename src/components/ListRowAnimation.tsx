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
  type WithSpringConfig,
} from 'react-native-reanimated';

type ListRowAnimationProps = {
  children: React.ReactNode;
  isActive: boolean;
  progress: SharedValue<number>;
  screenWidth: number;
  travelDistance: number;
  openVelocityThreshold: number;
  springConfig: WithSpringConfig;
  onPressIn: () => void;
  onPress: () => void;
  onDragOpen: () => void;
  onSwipeCancel: () => void;
  activeOffsetX?: number;
  openThreshold?: number;
  dragOpenTriggerOffset?: number;
  failOffsetY?: [number, number];
  rowStyle?: StyleProp<ViewStyle>;
  rowHostStyle?: StyleProp<ViewStyle>;
};

export const ListRowAnimation = ({
  children,
  isActive,
  progress,
  screenWidth,
  travelDistance,
  openVelocityThreshold,
  springConfig,
  onPressIn,
  onPress,
  onDragOpen,
  onSwipeCancel,
  activeOffsetX = 8,
  openThreshold = 0.25,
  dragOpenTriggerOffset = 6,
  failOffsetY = [-14, 14],
  rowStyle,
  rowHostStyle,
}: ListRowAnimationProps) => {
  const didTriggerOpen = useSharedValue(false);
  const didTriggerDragOpen = useSharedValue(false);

  const animatedRowStyle = useAnimatedStyle(() => {
    const translateX = isActive
      ? interpolate(progress.value, [0, 1], [0, travelDistance], Extrapolation.CLAMP)
      : 0;

    return {
      transform: [{ translateX }],
      zIndex: isActive ? 20 : 1,
    };
  }, [isActive, progress, travelDistance]);

  const swipeToOpenGesture = Gesture.Pan()
    .activeOffsetX(activeOffsetX)
    .failOffsetY(failOffsetY)
    .onBegin(() => {
      didTriggerOpen.value = false;
      didTriggerDragOpen.value = false;
      runOnJS(onPressIn)();
    })
    .onUpdate(event => {
      if (event.translationX <= 0 || didTriggerOpen.value) {
        return;
      }

      if (!didTriggerDragOpen.value && event.translationX > dragOpenTriggerOffset) {
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
        progress.value >= openThreshold || event.velocityX >= openVelocityThreshold;

      if (shouldOpen) {
        didTriggerOpen.value = true;
        progress.value = withSpring(1, springConfig);
        runOnJS(onPress)();
        return;
      }

      progress.value = withSpring(0, springConfig, finished => {
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
