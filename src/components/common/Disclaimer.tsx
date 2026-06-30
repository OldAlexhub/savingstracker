import React from 'react';
import { View, Text, StyleSheet, ViewStyle } from 'react-native';
import { Colors, Spacing, Typography, BorderRadius } from '../../theme';

interface DisclaimerProps {
  compact?: boolean;
  style?: ViewStyle;
}

const FULL_DISCLAIMER =
  'This app is for educational planning purposes only. It is not financial advice. All results are estimates based on your manual entries. Always consult a qualified financial professional before making financial decisions.';

const COMPACT_DISCLAIMER = 'For educational purposes only. Not financial advice.';

const Disclaimer: React.FC<DisclaimerProps> = ({ compact = false, style }) => {
  const text = compact ? COMPACT_DISCLAIMER : FULL_DISCLAIMER;

  if (compact) {
    return (
      <View style={[styles.compactContainer, style]}>
        <Text style={styles.compactIcon}>ℹ️</Text>
        <Text style={styles.compactText}>{text}</Text>
      </View>
    );
  }

  return (
    <View style={[styles.container, style]}>
      <View style={styles.header}>
        <Text style={styles.icon}>ℹ️</Text>
        <Text style={styles.heading}>Disclaimer</Text>
      </View>
      <Text style={styles.text}>{text}</Text>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: Colors.infoLight,
    borderRadius: BorderRadius.md,
    padding: Spacing.md,
    borderLeftWidth: 3,
    borderLeftColor: Colors.info,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: Spacing.xs,
  },
  icon: {
    fontSize: 14,
    marginRight: Spacing.xs,
  },
  heading: {
    ...Typography.label,
    color: Colors.info,
    textTransform: 'uppercase',
  },
  text: {
    ...Typography.caption,
    color: Colors.textMuted,
    fontStyle: 'italic',
    lineHeight: 18,
  },

  // Compact styles
  compactContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: Spacing.xs,
    paddingHorizontal: Spacing.sm,
  },
  compactIcon: {
    fontSize: 11,
    marginRight: 4,
  },
  compactText: {
    ...Typography.caption,
    color: Colors.textMuted,
    fontStyle: 'italic',
    flex: 1,
    fontSize: 11,
    lineHeight: 16,
  },
});

export default Disclaimer;
