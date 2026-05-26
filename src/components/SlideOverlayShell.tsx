import React from 'react';
import { Pressable, StyleSheet, useWindowDimensions } from 'react-native';
import { GestureDetector, GestureHandlerRootView } from 'react-native-gesture-handler';
import Animated, { Extrapolation, interpolate, useAnimatedStyle, type SharedValue } from 'react-native-reanimated';

import { useSlideOverlay } from '../hooks/useSlideOverlay';

type SlideOverlayShellProps = {
  componentId: string;
  children: React.ReactNode;
  header?: React.ReactNode;
  /** Global mutable to keep in sync with open progress (for cross-overlay crossfade). */
  externalProgress?: SharedValue<number>;
};

export const SlideOverlayShell: React.FC<SlideOverlayShellProps> = ({
  componentId,
  children,
  header,
  externalProgress,
}) => {
  const { width: screenWidth } = useWindowDimensions();

  const {
    openProgress,
    panGesture,
    backdropStyle,
    panelStyle,
    animateClose,
    overlayReady,
  } = useSlideOverlay({ componentId, externalProgress });

  const headerStyle = useAnimatedStyle(() => ({
    opacity: interpolate(openProgress.value, [0.5, 1], [0, 1], Extrapolation.CLAMP),
  }));

  return (
    <GestureHandlerRootView style={styles.root}>
      <GestureDetector gesture={panGesture}>
        <Animated.View style={styles.root} pointerEvents="box-none">
          <Animated.View
            style={[styles.overlay, backdropStyle]}
            pointerEvents="none"
          />

          <Pressable
            style={styles.dismissArea}
            onPress={animateClose}
            disabled={!overlayReady}
            pointerEvents={overlayReady ? 'auto' : 'none'}
          />

          <Animated.View style={[styles.panelHost, { width: screenWidth }, panelStyle]}>
            {children}
          </Animated.View>

          {header ? (
            <Animated.View style={[styles.headerWrapper, headerStyle]} pointerEvents="box-none">
              {header}
            </Animated.View>
          ) : null}
        </Animated.View>
      </GestureDetector>
    </GestureHandlerRootView>
  );
};

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
  headerWrapper: {
    position: 'absolute',
    left: 0,
    right: 0,
    top: 0,
    zIndex: 25,
    elevation: 25,
  },
});
