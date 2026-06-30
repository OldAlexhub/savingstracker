import React, { useState, useCallback, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  RefreshControl,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';

import { useApp } from '../context/AppContext';
import { Colors, Spacing, Typography, BorderRadius, Shadows } from '../theme';
import { calculateSavingsProgress } from '../utils/calculations';
import { formatCurrency, formatPercent, formatDate, formatRelativeDate } from '../utils/formatters';

import Card from '../components/common/Card';
import Button from '../components/common/Button';
import ProgressBar from '../components/common/ProgressBar';
import EmptyState from '../components/common/EmptyState';
import ConfirmDialog from '../components/common/ConfirmDialog';
import SectionHeader from '../components/common/SectionHeader';
import Badge from '../components/common/Badge';
import BannerAdComponent from '../components/ads/BannerAdComponent';
import SafeScrollView from '../components/layout/SafeScrollView';
import StickyActionBar from '../components/layout/StickyActionBar';

type RootStackParamList = {
  MainTabs: undefined;
  AddSavingsGoal: undefined;
  EditSavingsGoal: { goalId: string };
  SavingsGoalDetail: { goalId: string };
  SavingsStrategy: undefined;
  AddDebt: undefined;
  EditDebt: { debtId: string };
  DebtDetail: { debtId: string };
  DebtStrategy: undefined;
  LogContribution: { goalId?: string };
  LogDebtPayment: { debtId?: string };
};

type NavProp = NativeStackNavigationProp<RootStackParamList>;

type FilterType = 'all' | 'active' | 'completed' | 'archived';

const FILTERS: { key: FilterType; label: string }[] = [
  { key: 'all', label: 'All' },
  { key: 'active', label: 'Active' },
  { key: 'completed', label: 'Completed' },
  { key: 'archived', label: 'Archived' },
];

function getStatusBadgeColor(status: string): { color: string; textColor: string } {
  switch (status) {
    case 'active':
      return { color: Colors.primaryFade, textColor: Colors.primary };
    case 'completed':
      return { color: Colors.successLight, textColor: Colors.success };
    case 'archived':
      return { color: Colors.surfaceVariant, textColor: Colors.textMuted };
    default:
      return { color: Colors.primaryFade, textColor: Colors.primary };
  }
}

function getStrategyLabel(strategyId: string): string {
  const map: Record<string, string> = {
    fixed_weekly: 'Fixed Weekly',
    fixed_monthly: 'Fixed Monthly',
    pay_yourself_first: 'Pay Yourself First',
    emergency_fund: 'Emergency Fund',
    sinking_fund: 'Sinking Fund',
    challenge_52week: '52-Week Challenge',
    reverse_52week: 'Reverse 52-Week',
    envelope_buckets: 'Envelope Buckets',
    no_spend_day: 'No-Spend Days',
    custom: 'Custom Plan',
  };
  return map[strategyId] ?? strategyId;
}

const SavingsScreen: React.FC = () => {
  const insets = useSafeAreaInsets();
  const navigation = useNavigation<NavProp>();
  const {
    data,
    loading,
    error,
    refreshData,
    deleteSavingsGoal,
    archiveSavingsGoal,
    completeSavingsGoal,
  } = useApp();

  const [filter, setFilter] = useState<FilterType>('active');
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [deleteTargetId, setDeleteTargetId] = useState<string | null>(null);
  const [actionLoading, setActionLoading] = useState<string | null>(null);

  const currency = data.preferences.currency;

  const filteredGoals = useMemo(() => {
    const goals =
      filter === 'all'
        ? data.savingsGoals
        : data.savingsGoals.filter(g => g.status === filter);
    return [...goals].sort((a, b) => a.name.localeCompare(b.name));
  }, [data.savingsGoals, filter]);

  const handleToggleExpand = useCallback((id: string) => {
    setExpandedId(prev => (prev === id ? null : id));
  }, []);

  const handleDelete = useCallback(async () => {
    if (!deleteTargetId) return;
    setActionLoading(deleteTargetId);
    try {
      await deleteSavingsGoal(deleteTargetId);
    } catch {
      Alert.alert('Error', 'Failed to delete goal. Please try again.');
    } finally {
      setActionLoading(null);
      setDeleteTargetId(null);
      setExpandedId(null);
    }
  }, [deleteTargetId, deleteSavingsGoal]);

  const handleArchive = useCallback(
    async (id: string) => {
      setActionLoading(id);
      try {
        await archiveSavingsGoal(id);
        setExpandedId(null);
      } catch {
        Alert.alert('Error', 'Failed to archive goal. Please try again.');
      } finally {
        setActionLoading(null);
      }
    },
    [archiveSavingsGoal],
  );

  const handleComplete = useCallback(
    async (id: string) => {
      setActionLoading(id);
      try {
        await completeSavingsGoal(id);
        setExpandedId(null);
      } catch {
        Alert.alert('Error', 'Failed to complete goal. Please try again.');
      } finally {
        setActionLoading(null);
      }
    },
    [completeSavingsGoal],
  );

  const emptyMessages: Record<FilterType, string> = {
    all: 'No savings goals yet. Tap "Add Goal" to create your first goal.',
    active: 'No active goals. Tap "Add Goal" to create one.',
    completed: 'No completed goals yet. Keep saving!',
    archived: 'No archived goals.',
  };

  if (loading && data.savingsGoals.length === 0) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator size="large" color={Colors.primary} />
      </View>
    );
  }

  if (error) {
    return (
      <View style={styles.centered}>
        <Text style={styles.errorText}>{error}</Text>
        <Button title="Retry" onPress={refreshData} variant="primary" />
      </View>
    );
  }

  return (
    <View style={styles.screen}>
      {/* Header */}
      <View style={[styles.header, { paddingTop: insets.top + Spacing.md }]}>
        <Text style={styles.headerTitle}>Savings Goals</Text>
        <Button
          title="Add Goal"
          onPress={() => navigation.navigate('AddSavingsGoal')}
          variant="primary"
          size="sm"
          icon="+"
        />
      </View>

      <BannerAdComponent />

      {/* Filter Pills */}
      <View style={styles.filterRow}>
        {FILTERS.map(f => (
          <TouchableOpacity
            key={f.key}
            style={[styles.filterPill, filter === f.key && styles.filterPillActive]}
            onPress={() => setFilter(f.key)}
            activeOpacity={0.7}
          >
            <Text
              style={[styles.filterPillText, filter === f.key && styles.filterPillTextActive]}
            >
              {f.label}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      <SafeScrollView
        refreshControl={
          <RefreshControl
            refreshing={loading}
            onRefresh={refreshData}
            colors={[Colors.primary]}
            tintColor={Colors.primary}
          />
        }
      >
        <View style={styles.content}>
          {filteredGoals.length === 0 ? (
            <EmptyState
              icon="🎯"
              title="No Goals Found"
              description={emptyMessages[filter]}
              actionLabel={filter === 'all' || filter === 'active' ? 'Add Goal' : undefined}
              onAction={
                filter === 'all' || filter === 'active'
                  ? () => navigation.navigate('AddSavingsGoal')
                  : undefined
              }
            />
          ) : (
            filteredGoals.map(goal => {
              const calc = calculateSavingsProgress(goal);
              const progress = calc.progressPercent;
              const isExpanded = expandedId === goal.id;
              const isLoading = actionLoading === goal.id;
              const statusColors = getStatusBadgeColor(goal.status);
              const remaining = Math.max(0, goal.targetAmount - goal.savedAmount);

              return (
                <TouchableOpacity
                  key={goal.id}
                  activeOpacity={0.95}
                  onLongPress={() => handleToggleExpand(goal.id)}
                >
                  <Card style={styles.goalCard}>
                    {/* Goal Header */}
                    <View style={styles.goalHeader}>
                      <Text style={styles.goalName} numberOfLines={1}>
                        {goal.name}
                      </Text>
                      <Badge
                        label={goal.status.charAt(0).toUpperCase() + goal.status.slice(1)}
                        color={statusColors.color}
                        textColor={statusColors.textColor}
                        size="sm"
                      />
                    </View>

                    {/* Strategy */}
                    <Text style={styles.strategyLabel}>
                      {getStrategyLabel(goal.strategyId)}
                    </Text>

                    {/* Progress Bar */}
                    <ProgressBar
                      progress={progress}
                      height={8}
                      showPercent={false}
                      animated
                      style={styles.progressBar}
                    />

                    {/* Amounts */}
                    <View style={styles.amountRow}>
                      <Text style={styles.savedAmount}>
                        {formatCurrency(goal.savedAmount, currency)}
                        <Text style={styles.targetLabel}>
                          {' '}/ {formatCurrency(goal.targetAmount, currency)}
                        </Text>
                      </Text>
                      <Text style={styles.progressPercent}>
                        {formatPercent(progress)}
                      </Text>
                    </View>

                    {/* Remaining */}
                    {remaining > 0 && (
                      <Text style={styles.remainingText}>
                        {formatCurrency(remaining, currency)} remaining
                      </Text>
                    )}

                    {/* Target Date */}
                    {goal.targetDate ? (
                      <Text style={styles.dateText}>
                        Target: {formatDate(goal.targetDate)}
                        {calc.daysRemaining !== null && calc.daysRemaining > 0
                          ? ` · ${calc.daysRemaining} days left`
                          : calc.daysRemaining === 0
                          ? ' · Due today!'
                          : ''}
                      </Text>
                    ) : null}

                    {/* Action Buttons */}
                    <View style={styles.actionRow}>
                      <Button
                        title="View"
                        onPress={() =>
                          navigation.navigate('SavingsGoalDetail', { goalId: goal.id })
                        }
                        variant="ghost"
                        size="sm"
                        style={styles.actionBtn}
                      />
                      <Button
                        title="Edit"
                        onPress={() =>
                          navigation.navigate('EditSavingsGoal', { goalId: goal.id })
                        }
                        variant="outline"
                        size="sm"
                        style={styles.actionBtn}
                      />
                      <Button
                        title="Log"
                        onPress={() =>
                          navigation.navigate('LogContribution', { goalId: goal.id })
                        }
                        variant="primary"
                        size="sm"
                        style={styles.actionBtn}
                      />
                      <Button
                        title={isExpanded ? '▲' : '▼'}
                        onPress={() => handleToggleExpand(goal.id)}
                        variant="ghost"
                        size="sm"
                        style={styles.moreBtn}
                      />
                    </View>

                    {/* Expanded Section */}
                    {isExpanded && (
                      <View style={styles.expandedSection}>
                        <View style={styles.expandedDivider} />
                        <View style={styles.expandedRow}>
                          {goal.status !== 'completed' && (
                            <Button
                              title="Mark Complete"
                              onPress={() => handleComplete(goal.id)}
                              variant="secondary"
                              size="sm"
                              loading={isLoading}
                              style={styles.expandedBtn}
                            />
                          )}
                          {goal.status !== 'archived' && (
                            <Button
                              title="Archive"
                              onPress={() => handleArchive(goal.id)}
                              variant="outline"
                              size="sm"
                              loading={isLoading}
                              style={styles.expandedBtn}
                            />
                          )}
                          <Button
                            title="Delete"
                            onPress={() => setDeleteTargetId(goal.id)}
                            variant="danger"
                            size="sm"
                            loading={isLoading}
                            style={styles.expandedBtn}
                          />
                        </View>
                      </View>
                    )}
                  </Card>
                </TouchableOpacity>
              );
            })
          )}
        </View>
      </SafeScrollView>

      {/* Confirm Delete Dialog */}
      <ConfirmDialog
        visible={deleteTargetId !== null}
        title="Delete Goal?"
        message="Delete this goal and all its contributions? This cannot be undone."
        confirmLabel="Delete"
        cancelLabel="Cancel"
        destructive
        onConfirm={handleDelete}
        onCancel={() => setDeleteTargetId(null)}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  centered: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: Spacing.xl,
  },
  errorText: {
    ...Typography.body,
    color: Colors.error,
    textAlign: 'center',
    marginBottom: Spacing.md,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.md,
    backgroundColor: Colors.surface,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  headerTitle: {
    ...Typography.h3,
    color: Colors.text,
  },
  filterRow: {
    flexDirection: 'row',
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    backgroundColor: Colors.surface,
    gap: Spacing.xs,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  filterPill: {
    paddingHorizontal: Spacing.md,
    paddingVertical: 6,
    borderRadius: BorderRadius.round,
    backgroundColor: Colors.surfaceVariant,
  },
  filterPillActive: {
    backgroundColor: Colors.primary,
  },
  filterPillText: {
    ...Typography.caption,
    fontWeight: '600',
    color: Colors.textSecondary,
  },
  filterPillTextActive: {
    color: Colors.textInverse,
  },
  content: {
    padding: Spacing.md,
    gap: Spacing.md,
  },
  goalCard: {
    padding: Spacing.md,
  },
  goalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: Spacing.xs,
  },
  goalName: {
    ...Typography.h4,
    color: Colors.text,
    flex: 1,
    marginRight: Spacing.sm,
  },
  strategyLabel: {
    ...Typography.caption,
    color: Colors.textMuted,
    marginBottom: Spacing.sm,
  },
  progressBar: {
    marginBottom: Spacing.sm,
  },
  amountRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'baseline',
    marginBottom: 4,
  },
  savedAmount: {
    ...Typography.body,
    color: Colors.text,
    fontWeight: '600',
  },
  targetLabel: {
    fontWeight: '400',
    color: Colors.textMuted,
  },
  progressPercent: {
    ...Typography.caption,
    color: Colors.textSecondary,
    fontWeight: '600',
  },
  remainingText: {
    ...Typography.caption,
    color: Colors.textMuted,
    marginBottom: 4,
  },
  dateText: {
    ...Typography.caption,
    color: Colors.textMuted,
    marginBottom: Spacing.sm,
  },
  actionRow: {
    flexDirection: 'row',
    gap: Spacing.xs,
    marginTop: Spacing.xs,
  },
  actionBtn: {
    flex: 1,
  },
  moreBtn: {
    minWidth: 36,
  },
  expandedSection: {
    marginTop: Spacing.sm,
  },
  expandedDivider: {
    height: 1,
    backgroundColor: Colors.divider,
    marginBottom: Spacing.sm,
  },
  expandedRow: {
    flexDirection: 'row',
    gap: Spacing.xs,
  },
  expandedBtn: {
    flex: 1,
  },
});

export default SavingsScreen;
