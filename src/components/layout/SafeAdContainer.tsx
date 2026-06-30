import React from 'react';
import { View, StyleSheet, ViewStyle } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Colors } from '../../theme';

interface SafeAdContainerProps {
  children?: React.ReactNode;
  style?: ViewStyle;
}

const SafeAdContainer: React.FC<SafeAdContainerProps> = ({ children, style }) => {
  const insets = useSafeAreaInsets();

  if (!children) {
    return null;
  }

  return (
    <View
      style={[
        styles.container,
        { paddingBottom: insets.bottom },
        style,
      ]}
    >
      {children}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    width: '100%',
    alignItems: 'center',
    backgroundColor: Colors.surface,
  },
});

export default SafeAdContainer;
