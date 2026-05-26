import React, { useMemo } from 'react';
import { Image, StyleSheet, Text, View } from 'react-native';
import type { NavigationFunctionComponent } from 'react-native-navigation';
import { SafeAreaProvider, useSafeAreaInsets } from 'react-native-safe-area-context';

import { SlideOverlayShell } from '../components/SlideOverlayShell';
import {
  getLeaderboardListTopInset,
  LEADERBOARD_HEADER_TITLE_TOP_PADDING,
} from '../constants/leaderboardHeader';
import { slideOverlayOptions } from '../navigation/slideOverlayOptions';
import { profileOpenProgress } from '../state/profileTransitionState';

type SelectedLeaderBoardProps = {
  componentId: string;
  name: string;
  score: number;
  image: string;
};

const SelectedLeaderBoardContent: React.FC<SelectedLeaderBoardProps> = ({
  componentId,
  name,
  score,
  image,
}) => {
  const { top: safeAreaTop } = useSafeAreaInsets();
  const headerHeight = useMemo(() => getLeaderboardListTopInset(safeAreaTop), [safeAreaTop]);

  const headerElement = (
    <View style={[styles.headerHost, { height: headerHeight }]} pointerEvents="none">
      <Text
        style={[
          styles.title,
          { marginTop: safeAreaTop + LEADERBOARD_HEADER_TITLE_TOP_PADDING },
        ]}
      >
        User Profile
      </Text>
    </View>
  );

  return (
    <SlideOverlayShell
      componentId={componentId}
      header={headerElement}
      backdropMaxOpacity={0.35}
      externalProgress={profileOpenProgress}
    >
      <View style={styles.content}>
        <Image source={{ uri: image }} style={styles.avatar} />
        <Text style={styles.name}>{name}</Text>
        <Text style={styles.score}>{score} pts</Text>
      </View>
    </SlideOverlayShell>
  );
};

const SelectedLeaderBoardScreen: NavigationFunctionComponent<
  Omit<SelectedLeaderBoardProps, 'componentId'>
> = props => (
  <SafeAreaProvider>
    <SelectedLeaderBoardContent {...props} />
  </SafeAreaProvider>
);

SelectedLeaderBoardScreen.options = slideOverlayOptions;

const styles = StyleSheet.create({
  headerHost: {
    alignItems: 'center',
  },
  title: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#ffffff',
    textAlign: 'center',
    textShadowColor: 'rgba(0, 0, 0, 0.85)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 6,
  },
  content: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 16,
  },
  avatar: {
    width: 120,
    height: 120,
    borderRadius: 60,
    backgroundColor: 'rgba(255, 255, 255, 0.12)',
  },
  name: {
    fontSize: 28,
    fontWeight: '700',
    color: '#ffffff',
  },
  score: {
    fontSize: 20,
    fontWeight: '600',
    color: 'rgba(255, 255, 255, 0.65)',
  },
});

export default SelectedLeaderBoardScreen;
