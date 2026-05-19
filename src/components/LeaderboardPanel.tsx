import React, { useCallback, useMemo } from 'react';
import {
  FlatList,
  Image,
  ListRenderItem,
  StyleSheet,
  Text,
  View,
  type StyleProp,
  type ViewStyle,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { getLeaderboardListTopInset } from '../constants/leaderboardHeader';
import { LEADERBOARD_DATA, type LeaderboardEntry } from '../data/leaderboard';

/** ScrollView prop; FlatList types omit it but runtime supports it. */
const scrollUnderHeaderProps = { clipToPadding: false } as const;

type LeaderboardPanelProps = {
  safeAreaTop: number;
  style?: StyleProp<ViewStyle>;
};

export const LeaderboardPanel = ({
  safeAreaTop,
  style,
}: LeaderboardPanelProps) => {
  const { bottom: safeAreaBottom } = useSafeAreaInsets();
  const listTopInset = useMemo(() => getLeaderboardListTopInset(safeAreaTop), [safeAreaTop]);

  const listContentStyle = useMemo(
    () => [styles.listContent, { paddingTop: listTopInset, paddingBottom: safeAreaBottom + 24 }],
    [listTopInset, safeAreaBottom],
  );

  const scrollIndicatorInsets = useMemo(
    () => ({ top: listTopInset, bottom: safeAreaBottom }),
    [listTopInset, safeAreaBottom],
  );

  const renderItem: ListRenderItem<LeaderboardEntry> = useCallback(
    ({ item }) => (
      <View style={styles.row}>
        <Image source={{ uri: item.image }} style={styles.avatar} />
        <View style={styles.info}>
          <Text style={styles.name}>{item.name}</Text>
          <Text style={styles.score}>{item.score}</Text>
        </View>
      </View>
    ),
    [],
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
