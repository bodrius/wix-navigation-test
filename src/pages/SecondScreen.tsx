import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  FlatList,
  Image,
  ListRenderItem,
  NativeScrollEvent,
  NativeSyntheticEvent,
  StyleSheet,
  useWindowDimensions,
  View,
} from 'react-native';
import { Gesture, GestureDetector, GestureHandlerRootView } from 'react-native-gesture-handler';
import { Navigation } from 'react-native-navigation';
import type { NavigationFunctionComponent } from 'react-native-navigation';
import Animated, {
  Easing,
  interpolate,
  runOnJS,
  useAnimatedStyle,
  useSharedValue,
  withSpring,
  withTiming,
} from 'react-native-reanimated';

import { getFullImageUri, type ImageItem } from '../data/images';
import { secondScreenOptions } from '../navigation/secondScreenOptions';
import { viewerState } from '../state/viewerState';
import type { ImageLayoutBounds } from '../types/imageLayout';
import { getGridItemBounds } from '../utils/getGridItemBounds';
import { getImageTargetBounds } from '../utils/getImageTargetBounds';

type SecondScreenProps = {
  images: ImageItem[];
  initialIndex: number;
  thumbnailUri: string;
  sourceBounds: ImageLayoutBounds;
  listTopY: number;
  scrollY: number;
  imageSize: number;
};

const DISMISS_DRAG_THRESHOLD = 120;
const DISMISS_VELOCITY_THRESHOLD = 900;
const OPEN_DURATION_MS = 320;
const HANDOFF_DURATION_MS = 160;

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
  thumbnailUri,
  sourceBounds,
  listTopY,
  scrollY,
  imageSize,
}) => {
  const { width: screenWidth, height: screenHeight } = useWindowDimensions();
  const [currentIndex, setCurrentIndex] = useState(initialIndex);
  const [handoffDone, setHandoffDone] = useState(false);
  const [isClosingState, setIsClosingState] = useState(false);
  const currentIndexRef = useRef(initialIndex);

  const openProgress = useSharedValue(0);
  const morphProgress = useSharedValue(0);
  const backdropOpacity = useSharedValue(0);
  const handoffProgress = useSharedValue(0);
  const dragX = useSharedValue(0);
  const dragY = useSharedValue(0);
  const isClosing = useSharedValue(0);
  const activeSourceBounds = useSharedValue(sourceBounds);

  const targetBounds = useMemo(
    () =>
      getImageTargetBounds(
        screenWidth,
        screenHeight,
        sourceBounds.width / sourceBounds.height,
      ),
    [screenWidth, screenHeight, sourceBounds.height, sourceBounds.width],
  );

  const resolveSourceBounds = useCallback(
    (index: number): ImageLayoutBounds => {
      if (index === initialIndex) {
        return sourceBounds;
      }

      return getGridItemBounds(index, screenWidth, imageSize, listTopY, scrollY);
    },
    [imageSize, initialIndex, listTopY, screenWidth, scrollY, sourceBounds],
  );

  const currentItem = images[currentIndex] ?? images[0];
  const transitionUri =
    isClosingState || handoffDone
      ? getFullImageUri(currentItem.uri)
      : currentItem.uri;

  useEffect(() => {
    Navigation.mergeOptions(componentId, secondScreenOptions);
    activeSourceBounds.value = sourceBounds;
    viewerState.setHiddenImageId(images[initialIndex]?.id ?? null);

    const disappearSubscription = Navigation.events().registerComponentDidDisappearListener(
      event => {
        if (event.componentId === componentId) {
          viewerState.clearHiddenImage();
        }
      },
    );

    images.forEach(item => {
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
    images,
    backdropOpacity,
    morphProgress,
    openProgress,
    handoffProgress,
    sourceBounds,
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
    resolveSourceBounds,
  ]);

  const panGesture = Gesture.Pan()
    .activeOffsetY(8)
    .onUpdate(event => {
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

      if (index < 0 || index >= images.length) {
        return;
      }

      setCurrentIndex(index);
      currentIndexRef.current = index;
      activeSourceBounds.value = resolveSourceBounds(index);
      viewerState.setHiddenImageId(images[index].id);
    },
    [activeSourceBounds, images, resolveSourceBounds, screenWidth],
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

  const imageStyle = useAnimatedStyle(() => {
    const m = morphProgress.value;
    const source = activeSourceBounds.value;

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
              data={images}
              renderItem={renderGalleryItem}
              keyExtractor={item => item.id}
              initialScrollIndex={initialIndex}
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
});

export default SecondScreen;
