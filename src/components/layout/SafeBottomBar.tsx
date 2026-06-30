import React from 'react';
import { View, StyleSheet } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { bottomInsetWithFallback } from '../../utils/safeArea';

const SafeBottomBar: React.FC = () => {
  const insets = useSafeAreaInsets();

  return <View style={[styles.bar, { height: bottomInsetWithFallback(insets.bottom) }]} />;
};

const styles = StyleSheet.create({
  bar: {
    width: '100%',
  },
});

export default SafeBottomBar;
