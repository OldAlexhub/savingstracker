import React, {useEffect} from 'react';
import {BackHandler, Linking, StyleSheet, Text, TouchableOpacity, View} from 'react-native';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import {SafeAreaView} from 'react-native-safe-area-context';

import {BorderRadius, Colors, Spacing, Typography} from '../theme';

interface Props {
  playStoreUrl: string;
  latestVersionCode: number;
}

export default function ForceUpdateScreen({playStoreUrl, latestVersionCode}: Props): React.JSX.Element {
  useEffect(() => {
    const subscription = BackHandler.addEventListener('hardwareBackPress', () => true);
    return () => subscription.remove();
  }, []);

  return (
    <SafeAreaView style={styles.safe} edges={['top', 'bottom']}>
      <View style={styles.content}>
        <View style={styles.orbit}>
          <View style={styles.iconWrap}>
            <Icon name="rocket-launch" size={42} color={Colors.primaryLight} />
          </View>
        </View>
        <Text style={styles.eyebrow}>UPDATE REQUIRED</Text>
        <Text style={styles.title}>A better Savings Tracker is ready.</Text>
        <Text style={styles.body}>
          This version is no longer supported. Update through Google Play to keep your encrypted local records and continue syncing safely.
        </Text>
        <TouchableOpacity
          accessibilityRole="link"
          style={styles.button}
          activeOpacity={0.86}
          onPress={() => void Linking.openURL(playStoreUrl)}>
          <Icon name="google-play" size={22} color={Colors.textInverse} />
          <Text style={styles.buttonText}>Update on Google Play</Text>
        </TouchableOpacity>
        <Text style={styles.version}>Release {latestVersionCode} or newer</Text>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: {flex: 1, backgroundColor: '#081C18'},
  content: {flex: 1, justifyContent: 'center', padding: Spacing.xl},
  orbit: {
    width: 112,
    height: 112,
    borderRadius: 56,
    borderWidth: 1,
    borderColor: '#31584E',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: Spacing.xl,
  },
  iconWrap: {width: 82, height: 82, borderRadius: 41, backgroundColor: '#103D32', alignItems: 'center', justifyContent: 'center'},
  eyebrow: {...Typography.label, color: '#65D8AD', letterSpacing: 1.6, marginBottom: 10},
  title: {fontSize: 36, lineHeight: 42, fontWeight: '800', letterSpacing: -1.2, color: '#F4FFF9'},
  body: {...Typography.bodyLarge, color: '#A9C9BE', lineHeight: 25, marginTop: Spacing.md},
  button: {
    height: 56,
    borderRadius: BorderRadius.round,
    backgroundColor: Colors.primary,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
    marginTop: Spacing.xl,
  },
  buttonText: {fontSize: 16, fontWeight: '700', color: Colors.textInverse},
  version: {...Typography.caption, color: '#71988B', textAlign: 'center', marginTop: 12},
});
