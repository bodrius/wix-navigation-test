import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import type { NavigationFunctionComponent } from 'react-native-navigation';

export const ProfileContent = () => {
  return (
    <View style={styles.container}>
      <View style={styles.avatar} />
      <Text style={styles.name}>Profile</Text>
      <Text style={styles.subtitle}>Swipe down to close</Text>
    </View>
  );
};

const ProfileScreen: NavigationFunctionComponent = () => <ProfileContent />;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: 'transparent',
    paddingHorizontal: 24,
    paddingBottom: 34,
    alignItems: 'center',
  },

  avatar: {
    width: 96,
    height: 96,
    borderRadius: 48,
    backgroundColor: '#e8e8e8',
    marginBottom: 16,
  },
  name: {
    fontSize: 24,
    fontWeight: '600',
    color: 'white',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 15,
    color: 'white',
  },
});

export default ProfileScreen;
