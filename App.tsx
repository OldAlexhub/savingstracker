import React, {useEffect, useRef, useState} from 'react';
import {ActivityIndicator, Appearance, StatusBar, StyleSheet, View} from 'react-native';
import {SafeAreaProvider} from 'react-native-safe-area-context';
import DeviceInfo from 'react-native-device-info';
import MobileAds, {AdsConsent} from 'react-native-google-mobile-ads';

import {AppProvider, useApp} from './src/context/AppContext';
import AppNavigation from './src/navigation';
import OnboardingScreen from './src/screens/OnboardingScreen';
import ForceUpdateScreen from './src/screens/ForceUpdateScreen';
import {Colors} from './src/theme';
import {isAndroidUpdateRequired} from './src/utils/versioning';

function ApplicationGate(): React.JSX.Element {
  const {data, loading, remoteConfig} = useApp();
  const adsInitialized = useRef(false);
  const accepted = Boolean(data.preferences.dataCollectionAcceptedAt);
  const themeMode = data.preferences.themeMode;
  const [readyThemeMode, setReadyThemeMode] = useState<typeof themeMode | null>(null);

  useEffect(() => {
    setReadyThemeMode(null);
    Appearance.setColorScheme(themeMode === 'system' ? 'unspecified' : themeMode);
    const timer = setTimeout(() => setReadyThemeMode(themeMode), 180);
    return () => clearTimeout(timer);
  }, [themeMode]);

  useEffect(() => {
    if (!accepted || adsInitialized.current) {
      return;
    }
    adsInitialized.current = true;
    const initializeAds = async () => {
      try {
        await AdsConsent.requestInfoUpdate();
        await AdsConsent.loadAndShowConsentFormIfRequired();
      } finally {
        await MobileAds().initialize();
      }
    };
    void initializeAds().catch(() => undefined);
  }, [accepted]);

  if (loading || readyThemeMode !== themeMode) {
    return (
      <View style={styles.loading}>
        <ActivityIndicator size="large" color={Colors.primary} />
      </View>
    );
  }
  if (!accepted) {
    return <OnboardingScreen />;
  }

  const currentVersionCode = Number(DeviceInfo.getBuildNumber());
  if (isAndroidUpdateRequired(currentVersionCode, remoteConfig.android.minSupportedVersionCode)) {
    return (
      <ForceUpdateScreen
        playStoreUrl={remoteConfig.android.playStoreUrl}
        latestVersionCode={remoteConfig.android.latestVersionCode}
      />
    );
  }
  return <AppNavigation />;
}

export default function App() {
  return (
    <SafeAreaProvider>
      <StatusBar translucent backgroundColor="transparent" barStyle="light-content" />
      <AppProvider>
        <ApplicationGate />
      </AppProvider>
    </SafeAreaProvider>
  );
}

const styles = StyleSheet.create({
  loading: {flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: '#081C18'},
});
