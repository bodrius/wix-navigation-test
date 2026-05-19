import React, { useCallback, useEffect, useMemo, useReducer, useRef } from 'react';
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
import { Navigation } from 'react-native-navigation';
import type { NavigationFunctionComponent } from 'react-native-navigation';

import {
  GRID_GAP,
  GRID_HORIZONTAL_PADDING,
  GRID_IMAGE_ASPECT,
  GRID_LIST_PADDING_TOP,
  GRID_NUM_COLUMNS,
} from '../constants/grid';
import { getFullImageUri, IMAGE_DATA, type ImageItem } from '../data/images';
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

const HomeScreen: NavigationFunctionComponent = () => {
  const { width: screenWidth } = useWindowDimensions();
  const listRef = useRef<View>(null);
  const scrollYRef = useRef(0);
  const [, refreshHiddenState] = useReducer((count: number) => count + 1, 0);

  const imageSize = useMemo(() => getGridImageSize(screenWidth), [screenWidth]);
  const hiddenImageId = viewerState.getHiddenImageId();

  useEffect(() => {
    return viewerState.subscribe(refreshHiddenState);
  }, []);

  useEffect(() => {
    const commandSubscription = Navigation.events().registerCommandCompletedListener(
      ({ commandName }) => {
        if (commandName === 'dismissOverlay') {
          viewerState.clearHiddenImage();
        }
      },
    );

    const disappearSubscription = Navigation.events().registerComponentDidDisappearListener(
      ({ componentName }) => {
        if (componentName === ScreenNames.Second) {
          viewerState.clearHiddenImage();
        }
      },
    );

    return () => {
      commandSubscription.remove();
      disappearSubscription.remove();
    };
  }, []);

  const handleScroll = useCallback((event: NativeSyntheticEvent<NativeScrollEvent>) => {
    scrollYRef.current = event.nativeEvent.contentOffset.y;
  }, []);

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
    <View style={styles.container}>
      <View ref={listRef} style={styles.listWrapper}>
        <FlatList
          data={IMAGE_DATA}
          renderItem={renderItem}
          keyExtractor={keyExtractor}
          numColumns={GRID_NUM_COLUMNS}
          columnWrapperStyle={styles.row}
          contentContainerStyle={styles.listContent}
          showsVerticalScrollIndicator={false}
          onScroll={handleScroll}
          scrollEventThrottle={16}
          extraData={hiddenImageId}
        />
      </View>
    </View>
  );
};

HomeScreen.options = {
  topBar: {
    title: {
      text: 'Home',
    },
  },
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#ffffff',
  },
  listWrapper: {
    flex: 1,
  },
  listContent: {
    paddingHorizontal: GRID_HORIZONTAL_PADDING,
    paddingTop: GRID_LIST_PADDING_TOP,
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
    backgroundColor: '#ffffff',
  },
  image: {
    borderRadius: 8,
  },
});

export default HomeScreen;
