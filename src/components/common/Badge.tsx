import React from 'react';
import { View, Text, StyleSheet, ViewStyle } from 'react-native';
import { Colors, Spacing, Typography, BorderRadius } from '../../theme';

type BadgeSize = 'sm' | 'md';

interface BadgeProps {
  label: string;
  color?: string;
  textColor?: string;
  size?: BadgeSize;
  style?: ViewStyle;
}

const Badge: React.FC<BadgeProps> = ({
  label,
  color,
  textColor,
  size = 'md',
  style,
}) => {
  const bgColor = color ?? Colors.primaryFade;
  const fgColor = textColor ?? Colors.primary;

  return (
    <View
      style={[
        styles.badge,
        size === 'sm' ? styles.badgeSm : styles.badgeMd,
        { backgroundColor: bgColor },
        style,
      ]}
    >
      <Text
        style={[
          size === 'sm' ? styles.textSm : styles.textMd,
          { color: fgColor },
        ]}
        numberOfLines={1}
      >
        {label}
      </Text>
    </View>
  );
};

const styles = StyleSheet.create({
  badge: {
    borderRadius: BorderRadius.round,
    alignSelf: 'flex-start',
    alignItems: 'center',
    justifyContent: 'center',
  },
  badgeSm: {
    paddingHorizontal: Spacing.xs,
    paddingVertical: 2,
  },
  badgeMd: {
    paddingHorizontal: Spacing.sm,
    paddingVertical: Spacing.xs,
  },
  textSm: {
    ...Typography.caption,
    fontSize: 10,
    fontWeight: '600',
    lineHeight: 14,
  },
  textMd: {
    ...Typography.label,
    lineHeight: 16,
  },
});

export default Badge;
