import  { useCallback, useEffect, useMemo, useReducer, useRef, useState } from 'react';
import {
  FlatList,
  Image,
  ListRenderItem,
  NativeScrollEvent,
  NativeSyntheticEvent,
  Pressable,
  StyleSheet,
  useWindowDimensions,
  View,
} from 'react-native';
import { Gesture, GestureDetector, GestureHandlerRootView } from 'react-native-gesture-handler';
import { Navigation } from 'react-native-navigation';
import { runOnJS, useSharedValue, withSpring } from 'react-native-reanimated';
import type {
  NavigationFunctionComponent,
  NavigationProps,
} from 'react-native-navigation';
import { SafeAreaProvider, useSafeAreaInsets } from 'react-native-safe-area-context';

import { AnimatedTitleCrossfade } from '../components/AnimatedTitleCrossfade';
import { LeaderboardDragLayer } from '../components/LeaderboardDragLayer';
import {
  LEADERBOARD_DRAG_DISTANCE_RATIO,
  LEADERBOARD_OPEN_SNAP_THRESHOLD,
  LEADERBOARD_OPEN_SPRING,
  LEADERBOARD_OPEN_VELOCITY_THRESHOLD,
} from '../constants/leaderboard';
import {
  GRID_GAP,
  GRID_HORIZONTAL_PADDING,
  GRID_IMAGE_ASPECT,
  GRID_HEADER_CONTENT_OFFSET,
  GRID_NUM_COLUMNS,
} from '../constants/grid';
import { getFullImageUri, IMAGE_DATA, type ImageItem } from '../data/images';
import { homeScreenOptions } from '../navigation/homeScreenOptions';
import { leaderboardScreenOptions } from '../navigation/leaderboardScreenOptions';
import { ScreenNames } from '../navigation/screenNames';
import { secondScreenOptions } from '../navigation/secondScreenOptions';
import { viewerState } from '../state/viewerState';
import type { ImageLayoutBounds } from '../types/imageLayout';
import { getGridImageSize } from '../utils/getGridItemBounds';

type GridImageItemProps = {
  item: ImageItem;
  imageSize: number;
  isHidden: boolean;
  onOpen: (item: ImageItem, bounds: ImageLayoutBounds) => void;
};

const GridImageItem = ({ item, imageSize, isHidden, onOpen }: GridImageItemProps) => {
  const cardRef = useRef<View>(null);
  const imageHeight = imageSize * GRID_IMAGE_ASPECT;

  const handlePress = () => {
    cardRef.current?.measureInWindow((x, y, width, height) => {
      if (!width || !height) {
        return;
      }

      onOpen(item, { x, y, width, height });
    });
  };

  return (
    <View
      ref={cardRef}
      collapsable={false}
      style={[
        styles.card,
        { width: imageSize },
        isHidden && styles.cardWithoutImage,
      ]}>
      <Pressable onPress={handlePress} disabled={isHidden}>
        {!isHidden ? (
          <Image
            key={item.id}
            source={{ uri: item.uri }}
            style={[styles.image, { width: imageSize, height: imageHeight }]}
            resizeMode="cover"
          />
        ) : (
          <View style={{ width: imageSize, height: imageHeight }} />
        )}
      </Pressable>
    </View>
  );
};

const HomeScreenContent: React.FC<NavigationProps> = ({ componentId }) => {
  const { width: screenWidth } = useWindowDimensions();
  const listRef = useRef<View>(null);
  const scrollYRef = useRef(0);
  const [, refreshHiddenState] = useReducer((count: number) => count + 1, 0);
  const { top: safeAreaTop } = useSafeAreaInsets();
  const [isLeaderboardPushed, setIsLeaderboardPushed] = useState(false);

  const leaderboardOpenProgress = useSharedValue(0);
  const leaderboardGestureStart = useSharedValue(0);
  const isLeaderboardPushedSv = useSharedValue(0);

  const imageSize = useMemo(() => getGridImageSize(screenWidth), [screenWidth]);
  const leaderboardDragDistance = screenWidth * LEADERBOARD_DRAG_DISTANCE_RATIO;
  const hiddenImageId = viewerState.getHiddenImageId();
  const listTopPadding = useMemo(
    () => safeAreaTop + GRID_HEADER_CONTENT_OFFSET,
    [safeAreaTop],
  );

  useEffect(() => {
    Navigation.mergeOptions(componentId, homeScreenOptions);
  }, [componentId]);

  useEffect(() => {
    return viewerState.subscribe(refreshHiddenState);
  }, []);

  useEffect(() => {
    const commandSubscription = Navigation.events().registerCommandCompletedListener(
      ({ commandName }) => {
        if (commandName === 'dismissOverlay') {
          viewerState.clearHiddenImage();

          if (isLeaderboardPushedSv.value === 1) {
            isLeaderboardPushedSv.value = 0;
            setIsLeaderboardPushed(false);
            leaderboardOpenProgress.value = 0;
          }
        }
      },
    );

    const appearSubscription = Navigation.events().registerComponentDidAppearListener(
      ({ componentName }) => {
        if (componentName === ScreenNames.Leaderboard) {
          isLeaderboardPushedSv.value = 1;
          requestAnimationFrame(() => {
            setIsLeaderboardPushed(true);
          });
        }
      },
    );

    const disappearSubscription = Navigation.events().registerComponentDidDisappearListener(
      ({ componentName }) => {
        if (componentName === ScreenNames.Second) {
          viewerState.clearHiddenImage();
        }

        if (componentName === ScreenNames.Leaderboard) {
          isLeaderboardPushedSv.value = 0;
          setIsLeaderboardPushed(false);
          leaderboardOpenProgress.value = 0;
        }
      },
    );

    return () => {
      commandSubscription.remove();
      appearSubscription.remove();
      disappearSubscription.remove();
    };
  }, [isLeaderboardPushedSv, leaderboardOpenProgress]);

  const handleScroll = useCallback((event: NativeSyntheticEvent<NativeScrollEvent>) => {
    scrollYRef.current = event.nativeEvent.contentOffset.y;
  }, []);

  const openLeaderboard = useCallback((progress: number) => {
    isLeaderboardPushedSv.value = 1;
    setIsLeaderboardPushed(true);

    Navigation.showOverlay({
      component: {
        name: ScreenNames.Leaderboard,
        passProps: { initialProgress: progress },
        options: leaderboardScreenOptions,
      },
    });
  }, [isLeaderboardPushedSv]);

  const leaderboardOpenGesture = useMemo(
    () =>
      Gesture.Pan()
        .activeOffsetX(15)
        .failOffsetY([-18, 18])
        .onStart(() => {
          if (isLeaderboardPushedSv.value === 1) {
            return;
          }

          leaderboardGestureStart.value = leaderboardOpenProgress.value;
        })
        .onUpdate(event => {
          if (isLeaderboardPushedSv.value === 1 || event.translationX <= 0) {
            return;
          }

          const nextProgress =
            leaderboardGestureStart.value +
            Math.min(
              event.translationX / leaderboardDragDistance,
              1 - leaderboardGestureStart.value,
            );

          leaderboardOpenProgress.value = Math.min(1, nextProgress);
        })
        .onEnd(event => {
          if (isLeaderboardPushedSv.value === 1) {
            return;
          }

          const shouldOpen =
            leaderboardOpenProgress.value > LEADERBOARD_OPEN_SNAP_THRESHOLD ||
            event.velocityX > LEADERBOARD_OPEN_VELOCITY_THRESHOLD;

          if (shouldOpen) {
            if (leaderboardOpenProgress.value < 1) {
              leaderboardOpenProgress.value = 1;
            }

            runOnJS(openLeaderboard)(leaderboardOpenProgress.value);
            return;
          }

          leaderboardOpenProgress.value = withSpring(0, LEADERBOARD_OPEN_SPRING);
        }),
    [
      isLeaderboardPushedSv,
      leaderboardDragDistance,
      leaderboardGestureStart,
      leaderboardOpenProgress,
      openLeaderboard,
    ],
  );

  const openImageScreen = useCallback(
    (item: ImageItem, sourceBounds: ImageLayoutBounds) => {
      const initialIndex = IMAGE_DATA.findIndex(image => image.id === item.id);

      const resolvedIndex = initialIndex >= 0 ? initialIndex : 0;
      const thumbnailUri = item.uri;
      const fullUri = getFullImageUri(thumbnailUri);

      viewerState.setHiddenImageId(item.id);

      void Image.prefetch(fullUri);

      listRef.current?.measureInWindow((_x, listTopY) => {
        Navigation.showOverlay({
          component: {
            name: ScreenNames.Second,
            passProps: {
              images: IMAGE_DATA,
              initialIndex: resolvedIndex,
              thumbnailUri,
              sourceBounds,
              listTopY,
              scrollY: scrollYRef.current,
              imageSize,
            },
            options: secondScreenOptions,
          },
        });
      });
    },
    [imageSize],
  );

  const keyExtractor = useCallback((item: ImageItem) => item.id, []);

  const renderItem: ListRenderItem<ImageItem> = useCallback(
    ({ item }) => (
      <GridImageItem
        item={item}
        imageSize={imageSize}
        isHidden={hiddenImageId === item.id}
        onOpen={openImageScreen}
      />
    ),
    [hiddenImageId, imageSize, openImageScreen],
  );

  return (
    <GestureHandlerRootView style={styles.container}>
      <GestureDetector gesture={leaderboardOpenGesture}>
        <View style={styles.container}>
          {!isLeaderboardPushed ? (
            <AnimatedTitleCrossfade
              openProgress={leaderboardOpenProgress}
              safeAreaTop={safeAreaTop}
            />
          ) : null}

          <View ref={listRef} style={styles.listWrapper}>
            <FlatList
              data={IMAGE_DATA}
              renderItem={renderItem}
              keyExtractor={keyExtractor}
              numColumns={GRID_NUM_COLUMNS}
              columnWrapperStyle={styles.row}
              contentContainerStyle={[styles.listContent, { paddingTop: listTopPadding }]}
              contentInsetAdjustmentBehavior="never"
              showsVerticalScrollIndicator={false}
              onScroll={handleScroll}
              scrollEventThrottle={16}
              extraData={hiddenImageId}
            />
          </View>

          {!isLeaderboardPushed ? (
            <LeaderboardDragLayer
              openProgress={leaderboardOpenProgress}
              safeAreaTop={safeAreaTop}
            />
          ) : null}
        </View>
      </GestureDetector>
    </GestureHandlerRootView>
  );
};

const HomeScreen: NavigationFunctionComponent = props => (
  <SafeAreaProvider>
    <HomeScreenContent {...props} />
  </SafeAreaProvider>
);

HomeScreen.options = homeScreenOptions;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: 'black',
  },
  listWrapper: {
    flex: 1,
  },
  listContent: {
    paddingHorizontal: GRID_HORIZONTAL_PADDING,
    paddingBottom: 16,
  },
  row: {
    justifyContent: 'space-between',
    marginBottom: GRID_GAP,
  },
  card: {
    borderRadius: 8,
    overflow: 'hidden',
    backgroundColor: '#eeeeee',
  },
  cardWithoutImage: {
    backgroundColor: 'black',
  },
  image: {
    borderRadius: 8,
  },
});

export default HomeScreen;
