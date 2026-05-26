import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  FlatList,
  Image,
  ListRenderItem,
  StyleSheet,
  Text,
  useWindowDimensions,
  View,
  type StyleProp,
  type ViewStyle,
} from 'react-native';
import { Navigation } from 'react-native-navigation';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import {
  LEADERBOARD_OPEN_SPRING,
  LEADERBOARD_OPEN_VELOCITY_THRESHOLD,
} from '../constants/leaderboard';
import { getLeaderboardListTopInset } from '../constants/leaderboardHeader';
import { LEADERBOARD_DATA, type LeaderboardEntry } from '../data/leaderboard';
import { ListRowAnimation } from './ListRowAnimation';
import { ScreenNames } from '../navigation/screenNames';
import { slideOverlayOptions } from '../navigation/slideOverlayOptions';
import { profileOpenProgress } from '../state/profileTransitionState';

/** ScrollView prop; FlatList types omit it but runtime supports it. */
const scrollUnderHeaderProps = { clipToPadding: false } as const;

type LeaderboardPanelProps = {
  safeAreaTop: number;
  style?: StyleProp<ViewStyle>;
};

type LeaderboardRowProps = {
  item: LeaderboardEntry;
  isActive: boolean;
  screenWidth: number;
  travelDistance: number;
  onPressIn: (item: LeaderboardEntry) => void;
  onDragOpen: (item: LeaderboardEntry) => void;
  onPress: (item: LeaderboardEntry) => void;
  onSwipeCancel: () => void;
};

const LeaderboardRow = ({
  item,
  isActive,
  screenWidth,
  travelDistance,
  onPressIn,
  onDragOpen,
  onPress,
  onSwipeCancel,
}: LeaderboardRowProps) => {
  return (
    <ListRowAnimation
      isActive={isActive}
      progress={profileOpenProgress}
      screenWidth={screenWidth}
      travelDistance={travelDistance}
      openVelocityThreshold={LEADERBOARD_OPEN_VELOCITY_THRESHOLD}
      springConfig={LEADERBOARD_OPEN_SPRING}
      onPressIn={() => onPressIn(item)}
      onDragOpen={() => onDragOpen(item)}
      onPress={() => onPress(item)}
      onSwipeCancel={onSwipeCancel}
      rowStyle={styles.row}>
      <Image source={{ uri: item.image }} style={styles.avatar} />
      
      <View style={styles.info}>
        <Text style={styles.name}>{item.name}</Text>
        <Text style={styles.score}>{item.score}</Text>
      </View>
    </ListRowAnimation>
  );
};

export const LeaderboardPanel = ({
  safeAreaTop,
  style,
}: LeaderboardPanelProps) => {
  const { bottom: safeAreaBottom } = useSafeAreaInsets();
  const { width: screenWidth } = useWindowDimensions();
  const [activeEntryId, setActiveEntryId] = useState<string | null>(null);
  const activeOverlayIdRef = useRef<string | null>(null);
  const listTopInset = useMemo(() => getLeaderboardListTopInset(safeAreaTop), [safeAreaTop]);

  const listContentStyle = useMemo(
    () => [styles.listContent, { paddingTop: listTopInset, paddingBottom: safeAreaBottom + 24 }],
    [listTopInset, safeAreaBottom],
  );

  const scrollIndicatorInsets = useMemo(
    () => ({ top: listTopInset, bottom: safeAreaBottom }),
    [listTopInset, safeAreaBottom],
  );

  const openSelectedOverlay = useCallback((item: LeaderboardEntry) => {
    if (activeOverlayIdRef.current) {
      return;
    }

    Navigation.showOverlay({
      component: {
        name: ScreenNames.SelectedLeaderBoard,
        passProps: {
          name: item.name,
          score: item.score,
          image: item.image,
        },
        options: slideOverlayOptions,
      },
    })
      .then(componentId => {
        activeOverlayIdRef.current = componentId;
      })
      .catch(() => {
        activeOverlayIdRef.current = null;
      });
  }, []);

  useEffect(() => {
    const disappearSubscription = Navigation.events().registerComponentDidDisappearListener(
      ({ componentName, componentId }) => {
        if (componentName !== ScreenNames.SelectedLeaderBoard) {
          return;
        }

        if (!activeOverlayIdRef.current || activeOverlayIdRef.current === componentId) {
          activeOverlayIdRef.current = null;
          setActiveEntryId(null);
          profileOpenProgress.value = 0;
        }
      },
    );

    return () => {
      disappearSubscription.remove();
    };
  }, []);

  const handleItemPress = useCallback(
    (item: LeaderboardEntry) => {
      setActiveEntryId(item.id);
      openSelectedOverlay(item);
    },
    [openSelectedOverlay],
  );

  const handleItemPressIn = useCallback((item: LeaderboardEntry) => {
    setActiveEntryId(item.id);
    profileOpenProgress.value = 0;
  }, []);

  const handleDragOpen = useCallback(
    (item: LeaderboardEntry) => {
      setActiveEntryId(item.id);
      openSelectedOverlay(item);
    },
    [openSelectedOverlay],
  );

  const handleSwipeCancel = useCallback(() => {
    const overlayId = activeOverlayIdRef.current;
    if (overlayId) {
      activeOverlayIdRef.current = null;
      Navigation.dismissOverlay(overlayId).catch(() => undefined);
    }

    setActiveEntryId(null);
  }, []);

  const renderItem: ListRenderItem<LeaderboardEntry> = useCallback(
    ({ item }) => (
      <LeaderboardRow
        item={item}
        isActive={activeEntryId === item.id}
        screenWidth={screenWidth}
        travelDistance={screenWidth + 64}
        onPressIn={handleItemPressIn}
        onDragOpen={handleDragOpen}
        onPress={handleItemPress}
        onSwipeCancel={handleSwipeCancel}
      />
    ),
    [
      activeEntryId,
      handleDragOpen,
      handleItemPress,
      handleItemPressIn,
      handleSwipeCancel,
      screenWidth,
    ],
  );

  const keyExtractor = useCallback((item: LeaderboardEntry) => item.id, []);

  return (
    <View style={[styles.panel, style]}>
      <FlatList
        data={LEADERBOARD_DATA}
        renderItem={renderItem}
        keyExtractor={keyExtractor}
        showsVerticalScrollIndicator={false}
        scrollIndicatorInsets={scrollIndicatorInsets}
        contentContainerStyle={listContentStyle}
        style={styles.list}
        {...scrollUnderHeaderProps}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  panel: {
    flex: 1,
    backgroundColor: 'transparent',
  },
  list: {
    flex: 1,
  },
  listContent: {
    paddingHorizontal: 24,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 14,
  },
  avatar: {
    width: 60,
    height: 60,
    borderRadius: 30,
    marginRight: 12,
    backgroundColor: 'rgba(255, 255, 255, 0.12)',
  },
  info: {
    flex: 1,
    justifyContent: 'center',
    gap: 4,
  },
  name: {
    fontSize: 17,
    fontWeight: '600',
    color: '#ffffff',
  },
  score: {
    fontSize: 15,
    fontWeight: '600',
    color: 'rgba(255, 255, 255, 0.65)',
  },
});
