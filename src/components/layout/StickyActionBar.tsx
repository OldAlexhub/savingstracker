import React from 'react';
import { View, StyleSheet } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Colors, Spacing } from '../../theme';
import { bottomInsetWithFallback } from '../../utils/safeArea';

interface StickyActionBarProps {
  children: React.ReactNode;
}

const StickyActionBar: React.FC<StickyActionBarProps> = ({ children }) => {
  const insets = useSafeAreaInsets();
  const bottomOffset = Math.max(bottomInsetWithFallback(insets.bottom), Spacing.sm);

  return (
    <View style={[styles.container, { bottom: bottomOffset }]}>
      {children}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    left: 0,
    right: 0,
    backgroundColor: Colors.surface,
    borderTopWidth: 1,
    borderTopColor: Colors.border,
    paddingHorizontal: Spacing.md,
    paddingVertical: 12,
  },
});

export default StickyActionBar;
