import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  FlatList,
  Image,
  ListRenderItem,
  NativeScrollEvent,
  NativeSyntheticEvent,
  Pressable,
  StyleSheet,
  Text,
  useWindowDimensions,
  View,
} from 'react-native';
import { Gesture, GestureDetector, GestureHandlerRootView } from 'react-native-gesture-handler';
import { Navigation } from 'react-native-navigation';
import type { NavigationFunctionComponent } from 'react-native-navigation';
import Animated, {
  Easing,
  Extrapolation,
  interpolate,
  runOnJS,
  useAnimatedStyle,
  useSharedValue,
  withSpring,
  withTiming,
} from 'react-native-reanimated';

import { getFullImageUri, IMAGE_DATA, type ImageItem } from '../data/images';
import { PROFILE_BACKDROP_MAX_OPACITY } from '../constants/profile';
import { ProfileContent } from './ProfileScreen';
import { secondScreenOptions } from '../navigation/secondScreenOptions';
import { viewerState } from '../state/viewerState';
import type { ImageLayoutBounds } from '../types/imageLayout';
import { getGridImageSize, getGridItemBounds } from '../utils/getGridItemBounds';
import { getImageTargetBounds } from '../utils/getImageTargetBounds';

type SecondScreenProps = {
  images?: ImageItem[];
  initialIndex?: number;
  thumbnailUri?: string;
  sourceBounds?: ImageLayoutBounds;
  listTopY?: number;
  scrollY?: number;
  imageSize?: number;
};

const DISMISS_DRAG_THRESHOLD = 120;
const DISMISS_VELOCITY_THRESHOLD = 900;
const OPEN_DURATION_MS = 320;
const HANDOFF_DURATION_MS = 160;
const PROFILE_SHEET_HEIGHT_RATIO = 0.88;
const PROFILE_SNAP_THRESHOLD = 0.35;
const PROFILE_OPEN_VELOCITY_THRESHOLD = -700;
const PROFILE_SPRING = { damping: 22, stiffness: 280 };
const FOOTER_HEIGHT = 100;

const getDragFactor = (x: number, y: number, screenHeight: number) => {
  'worklet';
  return Math.min(Math.hypot(x, y) / (screenHeight * 0.45), 1);
};

const isDismissDragging = (x: number, y: number) => {
  'worklet';
  return y > 0 || Math.abs(x) > 2;
};

const getBackdropOpacityFromDrag = (dragFactor: number) => {
  'worklet';
  return Math.max(0, 1 - dragFactor * 1.4);
};

const SecondScreen: NavigationFunctionComponent<SecondScreenProps> = ({
  componentId,
  images,
  initialIndex,
  sourceBounds,
  listTopY,
  scrollY,
  imageSize,
}) => {
  const { width: screenWidth, height: screenHeight } = useWindowDimensions();
  const resolvedImages = images?.length ? images : IMAGE_DATA;
  const resolvedInitialIndex = initialIndex ?? 0;
  const resolvedImageSize = imageSize ?? getGridImageSize(screenWidth);
  const resolvedListTopY = listTopY ?? 0;
  const resolvedScrollY = scrollY ?? 0;

  const resolvedSourceBounds = useMemo((): ImageLayoutBounds => {
    if (sourceBounds?.width && sourceBounds?.height) {
      return sourceBounds;
    }

    return getGridItemBounds(
      resolvedInitialIndex,
      screenWidth,
      resolvedImageSize,
      resolvedListTopY,
      resolvedScrollY,
    );
  }, [
    resolvedImageSize,
    resolvedInitialIndex,
    resolvedListTopY,
    resolvedScrollY,
    screenWidth,
    sourceBounds,
  ]);

  const [currentIndex, setCurrentIndex] = useState(resolvedInitialIndex);
  const [handoffDone, setHandoffDone] = useState(false);
  const [isClosingState, setIsClosingState] = useState(false);
  const currentIndexRef = useRef(resolvedInitialIndex);

  const openProgress = useSharedValue(0);
  const morphProgress = useSharedValue(0);
  const backdropOpacity = useSharedValue(0);
  const handoffProgress = useSharedValue(0);
  const dragX = useSharedValue(0);
  const dragY = useSharedValue(0);
  const isClosing = useSharedValue(0);
  const activeSourceBounds = useSharedValue(resolvedSourceBounds);
  const profileProgress = useSharedValue(0);
  const profileBackdropOpacity = useSharedValue(0);
  const profileGestureStart = useSharedValue(0);

  const profileDragDistance = screenHeight * 0.38;
  const profileSheetHeight = screenHeight * PROFILE_SHEET_HEIGHT_RATIO;

  const targetBounds = useMemo(
    () =>
      getImageTargetBounds(
        screenWidth,
        screenHeight,
        resolvedSourceBounds.width / resolvedSourceBounds.height,
      ),
    [
      screenWidth,
      screenHeight,
      resolvedSourceBounds.height,
      resolvedSourceBounds.width,
    ],
  );

  const resolveSourceBounds = useCallback(
    (index: number): ImageLayoutBounds => {
      if (index === resolvedInitialIndex) {
        return resolvedSourceBounds;
      }

      return getGridItemBounds(
        index,
        screenWidth,
        resolvedImageSize,
        resolvedListTopY,
        resolvedScrollY,
      );
    },
    [
      resolvedImageSize,
      resolvedInitialIndex,
      resolvedListTopY,
      resolvedScrollY,
      resolvedSourceBounds,
      screenWidth,
    ],
  );

  const currentItem = resolvedImages[currentIndex] ?? resolvedImages[0];
  const transitionUri =
    isClosingState || handoffDone
      ? getFullImageUri(currentItem.uri)
      : currentItem.uri;

  useEffect(() => {
    Navigation.mergeOptions(componentId, secondScreenOptions);
    activeSourceBounds.value = resolvedSourceBounds;
    viewerState.setHiddenImageId(resolvedImages[resolvedInitialIndex]?.id ?? null);

    const disappearSubscription = Navigation.events().registerComponentDidDisappearListener(
      event => {
        if (event.componentId === componentId) {
          viewerState.clearHiddenImage();
        }
      },
    );

    resolvedImages.forEach(item => {
      Image.prefetch(getFullImageUri(item.uri));
    });

    const openConfig = {
      duration: OPEN_DURATION_MS,
      easing: Easing.out(Easing.cubic),
    };

    openProgress.value = withTiming(1, openConfig);
    backdropOpacity.value = withTiming(1, openConfig);
    morphProgress.value = withTiming(1, openConfig, finished => {
      if (!finished) {
        return;
      }

      handoffProgress.value = withTiming(
        1,
        { duration: HANDOFF_DURATION_MS, easing: Easing.inOut(Easing.quad) },
        handoffFinished => {
          if (handoffFinished) {
            runOnJS(setHandoffDone)(true);
          }
        },
      );
    });

    return () => {
      disappearSubscription.remove();
      viewerState.clearHiddenImage();
    };
  }, [
    activeSourceBounds,
    componentId,
    resolvedImages,
    resolvedInitialIndex,
    resolvedSourceBounds,
    backdropOpacity,
    morphProgress,
    openProgress,
    handoffProgress,
  ]);

  const restoreGridThumbnail = useCallback(() => {
    viewerState.clearHiddenImage();
  }, []);

  const closeOverlay = useCallback(() => {
    restoreGridThumbnail();
    Navigation.dismissOverlay(componentId);
  }, [componentId, restoreGridThumbnail]);

  const animateClose = useCallback(() => {
    const index = currentIndexRef.current;
    activeSourceBounds.value = resolveSourceBounds(index);
    isClosing.value = 1;
    handoffProgress.value = 0;
    runOnJS(setIsClosingState)(true);
    runOnJS(setHandoffDone)(false);

    const snapSpring = { damping: 26, stiffness: 300 };

    backdropOpacity.value = withSpring(0, snapSpring);
    morphProgress.value = withSpring(0, snapSpring, finished => {
      if (finished) {
        runOnJS(closeOverlay)();
      }
    });
    dragX.value = withSpring(0, snapSpring);
    dragY.value = withSpring(0, snapSpring);
    openProgress.value = withSpring(0, snapSpring);
    profileProgress.value = 0;
    profileBackdropOpacity.value = 0;
  }, [
    activeSourceBounds,
    backdropOpacity,
    closeOverlay,
    dragX,
    dragY,
    handoffProgress,
    isClosing,
    morphProgress,
    openProgress,
    profileBackdropOpacity,
    profileProgress,
    resolveSourceBounds,
  ]);

  const panGesture = Gesture.Pan()
    .activeOffsetY([-12, 12])
    .failOffsetX([-28, 28])
    .onStart(() => {
      profileGestureStart.value = profileProgress.value;
    })
    .onUpdate(event => {
      const isProfileGesture =
        profileGestureStart.value > 0 || event.translationY < 0;

      if (isProfileGesture) {
        let nextProgress = profileGestureStart.value;

        if (event.translationY < 0) {
          nextProgress =
            profileGestureStart.value +
            Math.min(Math.abs(event.translationY) / profileDragDistance, 1);
        } else {
          nextProgress =
            profileGestureStart.value -
            Math.min(event.translationY / profileDragDistance, 1);
        }

        profileProgress.value = Math.max(0, Math.min(1, nextProgress));
        profileBackdropOpacity.value =
          profileProgress.value * PROFILE_BACKDROP_MAX_OPACITY;
        return;
      }

      dragY.value = Math.max(0, event.translationY);
      dragX.value = event.translationX;

      if (morphProgress.value > 0 && isClosing.value === 0) {
        const dragFactor = getDragFactor(dragX.value, dragY.value, screenHeight);
        morphProgress.value = 1 - dragFactor;
        backdropOpacity.value = getBackdropOpacityFromDrag(dragFactor);
        openProgress.value = morphProgress.value;
      }
    })
    .onEnd(event => {
      const isProfileGesture =
        profileGestureStart.value > 0 ||
        event.translationY < -5 ||
        profileProgress.value > 0.01;

      if (isProfileGesture) {
        const shouldOpen =
          profileProgress.value > PROFILE_SNAP_THRESHOLD ||
          event.velocityY < PROFILE_OPEN_VELOCITY_THRESHOLD;

        if (shouldOpen) {
          profileProgress.value = withSpring(1, PROFILE_SPRING);
          profileBackdropOpacity.value = withSpring(
            PROFILE_BACKDROP_MAX_OPACITY,
            PROFILE_SPRING,
          );
        } else {
          profileProgress.value = withSpring(0, PROFILE_SPRING);
          profileBackdropOpacity.value = withSpring(0, PROFILE_SPRING);
        }
        return;
      }

      const shouldDismiss =
        event.translationY > DISMISS_DRAG_THRESHOLD ||
        event.velocityY > DISMISS_VELOCITY_THRESHOLD;

      if (shouldDismiss) {
        runOnJS(animateClose)();
        return;
      }

      morphProgress.value = withSpring(1, { damping: 20, stiffness: 260 });
      backdropOpacity.value = withSpring(1, { damping: 20, stiffness: 260 });
      openProgress.value = withSpring(1, { damping: 20, stiffness: 260 });
      dragX.value = withSpring(0, { damping: 20, stiffness: 260 });
      dragY.value = withSpring(0, { damping: 20, stiffness: 260 });
    });

  const handleGalleryScrollEnd = useCallback(
    (event: NativeSyntheticEvent<NativeScrollEvent>) => {
      const index = Math.round(event.nativeEvent.contentOffset.x / screenWidth);

      if (index < 0 || index >= resolvedImages.length) {
        return;
      }

      setCurrentIndex(index);
      currentIndexRef.current = index;
      activeSourceBounds.value = resolveSourceBounds(index);
      viewerState.setHiddenImageId(resolvedImages[index].id);
    },
    [activeSourceBounds, resolvedImages, resolveSourceBounds, screenWidth],
  );

  const backdropStyle = useAnimatedStyle(() => {
    return { opacity: backdropOpacity.value };
  });

  const galleryStyle = useAnimatedStyle(() => {
    if (isDismissDragging(dragX.value, dragY.value) || isClosing.value === 1) {
      return { opacity: 0 };
    }

    return { opacity: handoffProgress.value };
  });

  const transitionLayerStyle = useAnimatedStyle(() => {
    const isOpening = morphProgress.value < 0.999;

    if (isDismissDragging(dragX.value, dragY.value) || isOpening || isClosing.value === 1) {
      return { opacity: 1 };
    }

    return { opacity: 1 - handoffProgress.value };
  });

  const profileOverlayStyle = useAnimatedStyle(() => {
    const opacity =
      profileBackdropOpacity.value > 0
        ? profileBackdropOpacity.value
        : profileProgress.value * PROFILE_BACKDROP_MAX_OPACITY;

    return { opacity };
  });

  const footerStyle = useAnimatedStyle(() => {
    const isHidden =
      isDismissDragging(dragX.value, dragY.value) || isClosing.value === 1;

    return {
      opacity: isHidden ? 0 : handoffProgress.value,
    };
  });

  const profileSheetStyle = useAnimatedStyle(() => {
    const translateY = interpolate(
      profileProgress.value,
      [0, 1],
      [screenHeight, screenHeight - profileSheetHeight],
      Extrapolation.CLAMP,
    );

    return {
      transform: [{ translateY }],
    };
  });

  const imageStyle = useAnimatedStyle(() => {
    const m = morphProgress.value;
    const source = activeSourceBounds.value;

    if (!source?.width || !source?.height) {
      return { opacity: 0 };
    }

    const width = source.width + (targetBounds.width - source.width) * m;
    const height = source.height + (targetBounds.height - source.height) * m;
    const x = source.x + (targetBounds.x - source.x) * m;
    const y = source.y + (targetBounds.y - source.y) * m;

    return {
      position: 'absolute',
      left: x + dragX.value,
      top: y + dragY.value,
      width,
      height,
      borderRadius: interpolate(m, [0, 1], [8, 0]),
    };
  });

  const renderGalleryItem: ListRenderItem<ImageItem> = useCallback(
    ({ item }) => (
      <View style={[styles.page, { width: screenWidth, height: screenHeight }]}>
        <Image
          source={{ uri: getFullImageUri(item.uri) }}
          style={{
            width: targetBounds.width,
            height: targetBounds.height,
          }}
          resizeMode="contain"
        />
      </View>
    ),
    [screenHeight, screenWidth, targetBounds.height, targetBounds.width],
  );

  return (
    <GestureHandlerRootView style={styles.root}>
      <GestureDetector gesture={panGesture}>
        <Animated.View style={styles.root}>
          <Animated.View style={[styles.backdrop, backdropStyle]} />

          <Animated.View style={[styles.gallery, galleryStyle]} pointerEvents={handoffDone ? 'auto' : 'none'}>
            <FlatList
              horizontal
              pagingEnabled
              bounces={false}
              data={resolvedImages}
              renderItem={renderGalleryItem}
              keyExtractor={item => item.id}
              initialScrollIndex={resolvedInitialIndex}
              getItemLayout={(_, index) => ({
                length: screenWidth,
                offset: screenWidth * index,
                index,
              })}
              showsHorizontalScrollIndicator={false}
              onMomentumScrollEnd={handleGalleryScrollEnd}
              scrollEnabled={handoffDone}
            />
          </Animated.View>

          <Animated.Image
            source={{ uri: transitionUri }}
            style={[imageStyle, transitionLayerStyle, styles.transitionImage]}
            resizeMode="contain"
          />

          <Animated.View
            pointerEvents="none"
            collapsable={false}
            style={[
              styles.profileOverlay,
              { width: screenWidth, height: screenHeight },
              profileOverlayStyle,
            ]}
          />

          <Animated.View
            style={[
              styles.profileSheet,
              { height: profileSheetHeight },
              profileSheetStyle,
            ]}>
            <ProfileContent />
          </Animated.View>

          <Animated.View
            style={[styles.footer, { width: screenWidth }, footerStyle]}
            pointerEvents={handoffDone ? 'box-none' : 'none'}>
            <Pressable
              style={styles.closeButton}
              onPress={animateClose}
              accessibilityRole="button"
              accessibilityLabel="Close">
              <Text style={styles.closeButtonText}>Close</Text>
            </Pressable>
          </Animated.View>
        </Animated.View>
      </GestureDetector>
    </GestureHandlerRootView>
  );
};

SecondScreen.options = secondScreenOptions;

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: 'transparent',
  },
  backdrop: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: '#000000',
  },
  gallery: {
    ...StyleSheet.absoluteFillObject,
  },
  page: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  transitionImage: {
    zIndex: 2,
  },
  profileOverlay: {
    position: 'absolute',
    left: 0,
    top: 0,
    backgroundColor: '#000000',
    zIndex: 10,
    elevation: 10,
  },
  profileSheet: {
    position: 'absolute',
    left: 0,
    right: 0,
    top: 0,
    zIndex: 20,
    elevation: 20,
  },
  footer: {
    position: 'absolute',
    left: 0,
    bottom: 0,
    height: FOOTER_HEIGHT,
    zIndex: 30,
    elevation: 30,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'red',
  },
  closeButton: {
    paddingHorizontal: 28,
    paddingVertical: 12,
    borderRadius: 22,
    backgroundColor: 'rgba(255, 255, 255, 0.16)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.35)',
  },
  closeButtonText: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: '600',
  },
});

export default SecondScreen;
