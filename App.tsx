import React, { useEffect } from 'react';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { AppProvider } from './src/context/AppContext';
import AppNavigation from './src/navigation';
import MobileAds from 'react-native-google-mobile-ads';
import { StatusBar } from 'react-native';

export default function App() {
  useEffect(() => {
    MobileAds().initialize().catch(() => {});
  }, []);

  return (
    <SafeAreaProvider>
      <StatusBar translucent backgroundColor="transparent" barStyle="dark-content" />
      <AppProvider>
        <AppNavigation />
      </AppProvider>
    </SafeAreaProvider>
  );
}
