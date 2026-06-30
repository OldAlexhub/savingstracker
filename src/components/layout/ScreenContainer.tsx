import React from 'react';
import { View, StyleSheet, ViewStyle } from 'react-native';
import { Colors } from '../../theme';

interface ScreenContainerProps {
  children: React.ReactNode;
  style?: ViewStyle;
  testID?: string;
}

const ScreenContainer: React.FC<ScreenContainerProps> = ({ children, style, testID }) => {
  return (
    <View style={[styles.container, style]} testID={testID}>
      {children}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
  },
});

export default ScreenContainer;
