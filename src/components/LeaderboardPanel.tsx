import React, { useCallback } from 'react';
import {
  FlatList,
  ListRenderItem,
  StyleSheet,
  Text,
  View,
  type StyleProp,
  type ViewStyle,
} from 'react-native';

import { LEADERBOARD_DATA, type LeaderboardEntry } from '../data/leaderboard';

const TOP_BAR_CONTENT_OFFSET = 52;

type LeaderboardPanelProps = {
  safeAreaTop: number;
  style?: StyleProp<ViewStyle>;
};

export const LeaderboardPanel = ({
  safeAreaTop,
  style,
}: LeaderboardPanelProps) => {
  const renderItem: ListRenderItem<LeaderboardEntry> = useCallback(
    ({ item, index }) => (
      <View style={styles.row}>
        <Text style={styles.rank}>{index + 1}</Text>
        <Text style={styles.name}>{item.name}</Text>
        <Text style={styles.score}>{item.score}</Text>
      </View>
    ),
    [],
  );

  const keyExtractor = useCallback((item: LeaderboardEntry) => item.id, []);

  return (
    <View
      style={[
        styles.panel,
        { paddingTop: safeAreaTop + TOP_BAR_CONTENT_OFFSET },
        style,
      ]}>
      <FlatList
        data={LEADERBOARD_DATA}
        renderItem={renderItem}
        keyExtractor={keyExtractor}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.listContent}
      />
      <Text style={styles.hint}>Swipe left to close</Text>
    </View>
  );
};

const styles = StyleSheet.create({
  panel: {
    flex: 1,
    backgroundColor: 'transparent',
  },
  listContent: {
    paddingHorizontal: 24,
    paddingBottom: 24,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 14,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: 'rgba(255, 255, 255, 0.2)',
  },
  rank: {
    width: 32,
    fontSize: 17,
    fontWeight: '700',
    color: 'rgba(255, 255, 255, 0.65)',
  },
  name: {
    flex: 1,
    fontSize: 17,
    fontWeight: '600',
    color: '#ffffff',
  },
  score: {
    fontSize: 17,
    fontWeight: '700',
    color: '#ffffff',
  },
  hint: {
    textAlign: 'center',
    fontSize: 14,
    color: 'rgba(255, 255, 255, 0.55)',
    paddingVertical: 16,
  },
});
