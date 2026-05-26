import React, { useCallback, useMemo, useState } from 'react';
import {
  FlatList,
  Image,
  ListRenderItem,
  Pressable,
  StyleSheet,
  Text,
  useWindowDimensions,
  View,
  type StyleProp,
  type ViewStyle,
} from 'react-native';
import { Navigation } from 'react-native-navigation';
import Animated, {
  Extrapolation,
  interpolate,
  useAnimatedStyle,
} from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { getLeaderboardListTopInset } from '../constants/leaderboardHeader';
import { LEADERBOARD_DATA, type LeaderboardEntry } from '../data/leaderboard';
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
  travelDistance: number;
  onPress: (item: LeaderboardEntry) => void;
};

const LeaderboardRow = ({ item, isActive, travelDistance, onPress }: LeaderboardRowProps) => {
  const rowStyle = useAnimatedStyle(() => {
    const translateX = isActive
      ? interpolate(profileOpenProgress.value, [0, 1], [0, travelDistance], Extrapolation.CLAMP)
      : 0;

    return {
      transform: [{ translateX }],
      zIndex: isActive ? 20 : 1,
    };
  }, [isActive, travelDistance]);

  return (
    <Animated.View style={[styles.rowHost, rowStyle]}>
      <Pressable style={styles.row} onPress={() => onPress(item)}>
        <Image source={{ uri: item.image }} style={styles.avatar} />
        <View style={styles.info}>
          <Text style={styles.name}>{item.name}</Text>
          <Text style={styles.score}>{item.score}</Text>
        </View>
      </Pressable>
    </Animated.View>
  );
};

export const LeaderboardPanel = ({
  safeAreaTop,
  style,
}: LeaderboardPanelProps) => {
  const { bottom: safeAreaBottom } = useSafeAreaInsets();
  const { width: screenWidth } = useWindowDimensions();
  const [activeEntryId, setActiveEntryId] = useState<string | null>(null);
  const listTopInset = useMemo(() => getLeaderboardListTopInset(safeAreaTop), [safeAreaTop]);

  const listContentStyle = useMemo(
    () => [styles.listContent, { paddingTop: listTopInset, paddingBottom: safeAreaBottom + 24 }],
    [listTopInset, safeAreaBottom],
  );

  const scrollIndicatorInsets = useMemo(
    () => ({ top: listTopInset, bottom: safeAreaBottom }),
    [listTopInset, safeAreaBottom],
  );

  const handleItemPress = useCallback((item: LeaderboardEntry) => {
    setActiveEntryId(item.id);
    profileOpenProgress.value = 0;

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
    });
  }, []);

  const renderItem: ListRenderItem<LeaderboardEntry> = useCallback(
    ({ item }) => (
      <LeaderboardRow
        item={item}
        isActive={activeEntryId === item.id}
        travelDistance={screenWidth + 64}
        onPress={handleItemPress}
      />
    ),
    [activeEntryId, handleItemPress, screenWidth],
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
  rowHost: {
    overflow: 'visible',
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
