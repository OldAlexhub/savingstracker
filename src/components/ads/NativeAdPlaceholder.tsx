import React from 'react';
import { View, Text, StyleSheet, ViewStyle } from 'react-native';
import { Colors, Spacing, Typography, BorderRadius, Shadows } from '../../theme';

interface NativeAdPlaceholderProps {
  style?: ViewStyle;
}

const NativeAdPlaceholder: React.FC<NativeAdPlaceholderProps> = ({ style }) => {
  return (
    <View style={[styles.card, style]}>
      <View style={styles.header}>
        <View style={styles.sponsoredBadge}>
          <Text style={styles.sponsoredText}>Sponsored</Text>
        </View>
      </View>
      <View style={styles.body}>
        <View style={styles.iconPlaceholder} />
        <View style={styles.textContent}>
          <View style={styles.titlePlaceholder} />
          <View style={styles.descriptionPlaceholder} />
          <View style={styles.descriptionPlaceholderShort} />
        </View>
      </View>
      <View style={styles.footer}>
        <Text style={styles.placeholderMessage}>Ad content loads here</Text>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  card: {
    backgroundColor: Colors.surface,
    borderRadius: BorderRadius.lg,
    padding: Spacing.md,
    marginHorizontal: Spacing.md,
    marginVertical: Spacing.sm,
    borderWidth: 1,
    borderColor: Colors.border,
    ...Shadows.sm,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: Spacing.sm,
  },
  sponsoredBadge: {
    backgroundColor: Colors.accentFade,
    borderRadius: BorderRadius.sm,
    paddingHorizontal: Spacing.xs,
    paddingVertical: 2,
    borderWidth: 1,
    borderColor: Colors.accent,
  },
  sponsoredText: {
    ...Typography.label,
    color: Colors.accent,
    fontSize: 10,
  },
  body: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: Spacing.sm,
  },
  iconPlaceholder: {
    width: 48,
    height: 48,
    borderRadius: BorderRadius.md,
    backgroundColor: Colors.surfaceVariant,
    marginRight: Spacing.sm,
  },
  textContent: {
    flex: 1,
  },
  titlePlaceholder: {
    height: 14,
    backgroundColor: Colors.surfaceVariant,
    borderRadius: BorderRadius.sm,
    marginBottom: Spacing.xs,
    width: '70%',
  },
  descriptionPlaceholder: {
    height: 10,
    backgroundColor: Colors.borderLight,
    borderRadius: BorderRadius.sm,
    marginBottom: 4,
    width: '100%',
  },
  descriptionPlaceholderShort: {
    height: 10,
    backgroundColor: Colors.borderLight,
    borderRadius: BorderRadius.sm,
    width: '50%',
  },
  footer: {
    alignItems: 'center',
    paddingTop: Spacing.xs,
    borderTopWidth: 1,
    borderTopColor: Colors.divider,
  },
  placeholderMessage: {
    ...Typography.caption,
    color: Colors.textMuted,
    fontStyle: 'italic',
  },
});

export default NativeAdPlaceholder;
