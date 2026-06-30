import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Colors, Spacing, Typography, BorderRadius } from '../../theme';
import { ActivityItem, Currency } from '../../types';
import { formatCurrency } from '../../utils/formatters';

function formatRelativeDate(dateString: string): string {
  const now = new Date();
  const date = new Date(dateString);
  const diffMs = now.getTime() - date.getTime();
  const diffSeconds = Math.floor(diffMs / 1000);
  const diffMinutes = Math.floor(diffSeconds / 60);
  const diffHours = Math.floor(diffMinutes / 60);
  const diffDays = Math.floor(diffHours / 24);

  if (diffSeconds < 60) return 'Just now';
  if (diffMinutes < 60) return `${diffMinutes}m ago`;
  if (diffHours < 24) return `${diffHours}h ago`;
  if (diffDays === 1) return 'Yesterday';
  if (diffDays < 7) return `${diffDays}d ago`;
  if (diffDays < 30) return `${Math.floor(diffDays / 7)}w ago`;
  if (diffDays < 365) return `${Math.floor(diffDays / 30)}mo ago`;
  return `${Math.floor(diffDays / 365)}y ago`;
}

function getActivityIcon(type: ActivityItem['type']): string {
  switch (type) {
    case 'contribution':
      return '💰';
    case 'debt_payment':
      return '💳';
    case 'goal_created':
      return '🎯';
    case 'debt_created':
      return '📋';
    case 'goal_completed':
      return '🏆';
    case 'debt_paid_off':
      return '✅';
    default:
      return '📌';
  }
}

// ─── Component ───────────────────────────────────────────────────────────────

interface ActivityFeedProps {
  items: ActivityItem[];
  currency: Currency;
  onEmpty?: React.ReactNode;
}

const ActivityFeed: React.FC<ActivityFeedProps> = ({
  items,
  currency,
  onEmpty,
}) => {
  if (!items || items.length === 0) {
    if (onEmpty) {
      return <>{onEmpty}</>;
    }
    return (
      <View style={styles.emptyContainer}>
        <Text style={styles.emptyText}>No recent activity</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {items.map((item, index) => {
        const isLast = index === items.length - 1;
        return (
          <View key={item.id} style={[styles.row, !isLast && styles.rowBorder]}>
            <View style={styles.iconContainer}>
              <Text style={styles.icon}>{getActivityIcon(item.type)}</Text>
            </View>
            <View style={styles.info}>
              <Text style={styles.description} numberOfLines={2}>
                {item.description}
              </Text>
              <Text style={styles.date}>{formatRelativeDate(item.date)}</Text>
            </View>
            {item.amount !== null && (
              <View style={styles.amountContainer}>
                <Text
                  style={[
                    styles.amount,
                    item.type === 'debt_payment'
                      ? styles.amountDebt
                      : styles.amountPositive,
                  ]}
                >
                  {item.type === 'debt_payment' ? '-' : '+'}
                  {formatCurrency(item.amount, currency)}
                </Text>
              </View>
            )}
          </View>
        );
      })}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    width: '100%',
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: Spacing.sm,
    paddingHorizontal: Spacing.xs,
  },
  rowBorder: {
    borderBottomWidth: 1,
    borderBottomColor: Colors.divider,
  },
  iconContainer: {
    width: 36,
    height: 36,
    borderRadius: BorderRadius.round,
    backgroundColor: Colors.primaryFade,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: Spacing.sm,
    flexShrink: 0,
  },
  icon: {
    fontSize: 16,
  },
  info: {
    flex: 1,
    marginRight: Spacing.sm,
  },
  description: {
    ...Typography.body,
    color: Colors.text,
    marginBottom: 2,
  },
  date: {
    ...Typography.caption,
    color: Colors.textMuted,
  },
  amountContainer: {
    alignItems: 'flex-end',
    flexShrink: 0,
  },
  amount: {
    ...Typography.buttonSmall,
  },
  amountPositive: {
    color: Colors.success,
  },
  amountDebt: {
    color: Colors.error,
  },
  emptyContainer: {
    paddingVertical: Spacing.lg,
    alignItems: 'center',
  },
  emptyText: {
    ...Typography.body,
    color: Colors.textMuted,
    fontStyle: 'italic',
  },
});

export default ActivityFeed;
