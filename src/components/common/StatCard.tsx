import React from 'react';
import { View, Text, StyleSheet, ViewStyle } from 'react-native';
import { Colors, Spacing, Typography, BorderRadius, Shadows } from '../../theme';

interface StatCardProps {
  label: string;
  value: string;
  subValue?: string;
  color?: string;
  icon?: string;
  style?: ViewStyle;
}

const StatCard: React.FC<StatCardProps> = ({
  label,
  value,
  subValue,
  color,
  icon,
  style,
}) => {
  const accentColor = color ?? Colors.primary;

  return (
    <View style={[styles.card, style]}>
      {icon ? (
        <Text style={styles.icon}>{icon}</Text>
      ) : null}
      <Text style={[styles.value, { color: accentColor }]}>{value}</Text>
      <Text style={styles.label}>{label}</Text>
      {subValue ? (
        <Text style={styles.subValue}>{subValue}</Text>
      ) : null}
    </View>
  );
};

const styles = StyleSheet.create({
  card: {
    backgroundColor: Colors.surface,
    borderRadius: BorderRadius.lg,
    padding: Spacing.md,
    alignItems: 'center',
    justifyContent: 'center',
    ...Shadows.sm,
  },
  icon: {
    fontSize: 24,
    marginBottom: Spacing.xs,
    textAlign: 'center',
  },
  value: {
    ...Typography.number,
    textAlign: 'center',
    marginBottom: 2,
  },
  label: {
    ...Typography.caption,
    color: Colors.textSecondary,
    textAlign: 'center',
  },
  subValue: {
    ...Typography.caption,
    color: Colors.textMuted,
    textAlign: 'center',
    marginTop: 2,
  },
});

export default StatCard;
