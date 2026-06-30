import React from 'react';
import {
  RefreshControlProps,
  ScrollView,
  StyleProp,
  StyleSheet,
  ViewStyle,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Colors } from '../../theme';
import { bottomInsetWithFallback } from '../../utils/safeArea';

interface SafeScrollViewProps {
  children: React.ReactNode;
  style?: StyleProp<ViewStyle>;
  contentStyle?: StyleProp<ViewStyle>;
  showsVerticalScrollIndicator?: boolean;
  refreshControl?: React.ReactElement<RefreshControlProps>;
}

const SafeScrollView: React.FC<SafeScrollViewProps> = ({
  children,
  style,
  contentStyle,
  showsVerticalScrollIndicator = false,
  refreshControl,
}) => {
  const insets = useSafeAreaInsets();
  const bottomPadding = bottomInsetWithFallback(insets.bottom) + 100;

  return (
    <ScrollView
      style={[styles.scroll, style]}
      contentContainerStyle={[
        styles.content,
        { paddingBottom: bottomPadding },
        contentStyle,
      ]}
      showsVerticalScrollIndicator={showsVerticalScrollIndicator}
      keyboardShouldPersistTaps="handled"
      refreshControl={refreshControl}
    >
      {children}
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  scroll: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  content: {
    flexGrow: 1,
  },
});

export default SafeScrollView;
