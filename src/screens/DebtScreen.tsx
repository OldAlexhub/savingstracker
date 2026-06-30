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
import { formatCurrency, formatPercent, formatDebtType } from '../utils/formatters';

import Card from '../components/common/Card';
import Button from '../components/common/Button';
import ProgressBar from '../components/common/ProgressBar';
import EmptyState from '../components/common/EmptyState';
import ConfirmDialog from '../components/common/ConfirmDialog';
import SectionHeader from '../components/common/SectionHeader';
import Badge from '../components/common/Badge';
import BannerAdComponent from '../components/ads/BannerAdComponent';
import SafeScrollView from '../components/layout/SafeScrollView';

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

type DebtFilter = 'all' | 'active' | 'paid_off' | 'archived';

const FILTERS: { key: DebtFilter; label: string }[] = [
  { key: 'all', label: 'All' },
  { key: 'active', label: 'Active' },
  { key: 'paid_off', label: 'Paid Off' },
  { key: 'archived', label: 'Archived' },
];

function getStatusBadgeProps(status: string): { color: string; textColor: string; label: string } {
  switch (status) {
    case 'active':
      return { color: Colors.errorLight, textColor: Colors.error, label: 'Active' };
    case 'paid_off':
      return { color: Colors.successLight, textColor: Colors.success, label: 'Paid Off' };
    case 'archived':
      return { color: Colors.surfaceVariant, textColor: Colors.textMuted, label: 'Archived' };
    default:
      return { color: Colors.primaryFade, textColor: Colors.primary, label: status };
  }
}

function getDebtTypeColor(debtType: string): { color: string; textColor: string } {
  switch (debtType) {
    case 'credit_card':
      return { color: Colors.errorLight, textColor: Colors.error };
    case 'mortgage':
      return { color: Colors.secondaryFade, textColor: Colors.secondary };
    case 'student_loan':
      return { color: Colors.accentFade, textColor: Colors.accent };
    case 'auto_loan':
      return { color: Colors.infoLight, textColor: Colors.info };
    default:
      return { color: Colors.primaryFade, textColor: Colors.primary };
  }
}

const DebtScreen: React.FC = () => {
  const insets = useSafeAreaInsets();
  const navigation = useNavigation<NavProp>();
  const {
    data,
    loading,
    error,
    refreshData,
    deleteDebtAccount,
    archiveDebtAccount,
  } = useApp();

  const [filter, setFilter] = useState<DebtFilter>('active');
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [deleteTargetId, setDeleteTargetId] = useState<string | null>(null);
  const [actionLoading, setActionLoading] = useState<string | null>(null);

  const currency = data.preferences.currency;

  const filteredDebts = useMemo(() => {
    const debts =
      filter === 'all'
        ? data.debtAccounts
        : data.debtAccounts.filter(d => d.status === filter);
    return [...debts].sort((a, b) => a.name.localeCompare(b.name));
  }, [data.debtAccounts, filter]);

  const handleToggleExpand = useCallback((id: string) => {
    setExpandedId(prev => (prev === id ? null : id));
  }, []);

  const handleDelete = useCallback(async () => {
    if (!deleteTargetId) return;
    setActionLoading(deleteTargetId);
    try {
      await deleteDebtAccount(deleteTargetId);
    } catch {
      Alert.alert('Error', 'Failed to delete debt. Please try again.');
    } finally {
      setActionLoading(null);
      setDeleteTargetId(null);
      setExpandedId(null);
    }
  }, [deleteTargetId, deleteDebtAccount]);

  const handleArchive = useCallback(
    async (id: string) => {
      setActionLoading(id);
      try {
        await archiveDebtAccount(id);
        setExpandedId(null);
      } catch {
        Alert.alert('Error', 'Failed to archive debt. Please try again.');
      } finally {
        setActionLoading(null);
      }
    },
    [archiveDebtAccount],
  );

  const emptyMessages: Record<DebtFilter, string> = {
    all: 'No debts added yet. Tap "Add Debt" to track your debts.',
    active: 'No active debts. Great work staying debt-free!',
    paid_off: 'No paid off debts yet. Keep making payments!',
    archived: 'No archived debts.',
  };

  if (loading && data.debtAccounts.length === 0) {
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
        <Text style={styles.headerTitle}>Debt Tracker</Text>
        <Button
          title="Add Debt"
          onPress={() => navigation.navigate('AddDebt')}
          variant="primary"
          size="sm"
          icon="+"
        />
      </View>

      <BannerAdComponent />

      {/* Compare Strategies Banner */}
      <Card
        style={styles.strategyBanner}
        onPress={() => navigation.navigate('DebtStrategy')}
      >
        <View style={styles.strategyBannerContent}>
          <Text style={styles.strategyBannerIcon}>📊</Text>
          <View style={styles.strategyBannerText}>
            <Text style={styles.strategyBannerTitle}>Compare Debt Strategies</Text>
            <Text style={styles.strategyBannerSubtitle}>
              Avalanche, Snowball, Hybrid &amp; more
            </Text>
          </View>
          <Text style={styles.strategyBannerArrow}>›</Text>
        </View>
      </Card>

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
              style={[
                styles.filterPillText,
                filter === f.key && styles.filterPillTextActive,
              ]}
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
          {filteredDebts.length === 0 ? (
            <EmptyState
              icon="💳"
              title="No Debts Found"
              description={emptyMessages[filter]}
              actionLabel={filter === 'all' || filter === 'active' ? 'Add Debt' : undefined}
              onAction={
                filter === 'all' || filter === 'active'
                  ? () => navigation.navigate('AddDebt')
                  : undefined
              }
            />
          ) : (
            filteredDebts.map(debt => {
              const paidAmount = Math.max(
                0,
                debt.originalBalance - debt.currentBalance,
              );
              const paidPercent =
                debt.originalBalance > 0
                  ? Math.min(100, (paidAmount / debt.originalBalance) * 100)
                  : 0;
              const remainingRatio =
                debt.originalBalance > 0
                  ? debt.currentBalance / debt.originalBalance
                  : 0;
              const balanceIsHigh = remainingRatio > 0.5;
              const isExpanded = expandedId === debt.id;
              const isLoading = actionLoading === debt.id;
              const statusBadge = getStatusBadgeProps(debt.status);
              const debtTypeColors = getDebtTypeColor(debt.debtType);

              return (
                <TouchableOpacity
                  key={debt.id}
                  activeOpacity={0.95}
                  onLongPress={() => handleToggleExpand(debt.id)}
                >
                  <Card style={styles.debtCard}>
                    {/* Debt Header */}
                    <View style={styles.debtHeader}>
                      <Text style={styles.debtName} numberOfLines={1}>
                        {debt.name}
                      </Text>
                      <View style={styles.badgeRow}>
                        <Badge
                          label={formatDebtType(debt.debtType)}
                          color={debtTypeColors.color}
                          textColor={debtTypeColors.textColor}
                          size="sm"
                          style={styles.badgeSpacing}
                        />
                        <Badge
                          label={statusBadge.label}
                          color={statusBadge.color}
                          textColor={statusBadge.textColor}
                          size="sm"
                        />
                      </View>
                    </View>

                    {/* Balance */}
                    <View style={styles.balanceRow}>
                      <Text
                        style={[
                          styles.currentBalance,
                          { color: balanceIsHigh ? Colors.error : Colors.warning },
                        ]}
                      >
                        {formatCurrency(debt.currentBalance, currency)}
                      </Text>
                      <Text style={styles.originalBalance}>
                        of {formatCurrency(debt.originalBalance, currency)}
                      </Text>
                    </View>

                    {/* APR and Min Payment */}
                    <View style={styles.metaRow}>
                      {debt.apr !== null && (
                        <Badge
                          label={`APR: ${debt.apr.toFixed(2)}%`}
                          color={
                            debt.apr > 20 ? Colors.errorLight : Colors.accentFade
                          }
                          textColor={debt.apr > 20 ? Colors.error : Colors.accent}
                          size="sm"
                          style={styles.metaBadge}
                        />
                      )}
                      {debt.minimumPayment !== null && (
                        <Badge
                          label={`Min: ${formatCurrency(debt.minimumPayment, currency)}/mo`}
                          color={Colors.infoLight}
                          textColor={Colors.info}
                          size="sm"
                          style={styles.metaBadge}
                        />
                      )}
                      {debt.dueDayOfMonth !== null && (
                        <Badge
                          label={`Due: Day ${debt.dueDayOfMonth}`}
                          color={Colors.surfaceVariant}
                          textColor={Colors.textSecondary}
                          size="sm"
                          style={styles.metaBadge}
                        />
                      )}
                    </View>

                    {/* Progress Bar */}
                    <View style={styles.progressSection}>
                      <View style={styles.progressLabelRow}>
                        <Text style={styles.progressLabel}>Paid off</Text>
                        <Text style={styles.progressLabel}>
                          {formatPercent(paidPercent)}
                        </Text>
                      </View>
                      <ProgressBar
                        progress={paidPercent}
                        height={8}
                        color={Colors.success}
                        animated
                      />
                      <Text style={styles.paidText}>
                        {formatCurrency(paidAmount, currency)} paid down
                      </Text>
                    </View>

                    {/* Action Buttons */}
                    <View style={styles.actionRow}>
                      <Button
                        title="View"
                        onPress={() =>
                          navigation.navigate('DebtDetail', { debtId: debt.id })
                        }
                        variant="ghost"
                        size="sm"
                        style={styles.actionBtn}
                      />
                      <Button
                        title="Edit"
                        onPress={() =>
                          navigation.navigate('EditDebt', { debtId: debt.id })
                        }
                        variant="outline"
                        size="sm"
                        style={styles.actionBtn}
                      />
                      <Button
                        title="Pay"
                        onPress={() =>
                          navigation.navigate('LogDebtPayment', { debtId: debt.id })
                        }
                        variant="primary"
                        size="sm"
                        style={styles.actionBtn}
                      />
                      <Button
                        title={isExpanded ? '▲' : '▼'}
                        onPress={() => handleToggleExpand(debt.id)}
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
                          {debt.status !== 'archived' && (
                            <Button
                              title="Archive"
                              onPress={() => handleArchive(debt.id)}
                              variant="outline"
                              size="sm"
                              loading={isLoading}
                              style={styles.expandedBtn}
                            />
                          )}
                          <Button
                            title="Delete"
                            onPress={() => setDeleteTargetId(debt.id)}
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
        title="Delete Debt?"
        message="Delete this debt account and all its payment history? This cannot be undone."
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
  strategyBanner: {
    marginHorizontal: Spacing.md,
    marginTop: Spacing.sm,
    marginBottom: 0,
    padding: Spacing.md,
    backgroundColor: Colors.primaryFade,
  },
  strategyBannerContent: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  strategyBannerIcon: {
    fontSize: 24,
    marginRight: Spacing.sm,
  },
  strategyBannerText: {
    flex: 1,
  },
  strategyBannerTitle: {
    ...Typography.h4,
    color: Colors.primaryDark,
  },
  strategyBannerSubtitle: {
    ...Typography.caption,
    color: Colors.primary,
  },
  strategyBannerArrow: {
    fontSize: 22,
    color: Colors.primary,
    fontWeight: '700',
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
  debtCard: {
    padding: Spacing.md,
  },
  debtHeader: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    marginBottom: Spacing.xs,
  },
  debtName: {
    ...Typography.h4,
    color: Colors.text,
    flex: 1,
    marginRight: Spacing.sm,
  },
  badgeRow: {
    flexDirection: 'row',
    flexShrink: 0,
    gap: 4,
  },
  badgeSpacing: {
    marginRight: 4,
  },
  balanceRow: {
    flexDirection: 'row',
    alignItems: 'baseline',
    gap: Spacing.sm,
    marginBottom: Spacing.xs,
  },
  currentBalance: {
    ...Typography.h3,
    fontWeight: '700',
  },
  originalBalance: {
    ...Typography.caption,
    color: Colors.textMuted,
  },
  metaRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 4,
    marginBottom: Spacing.sm,
  },
  metaBadge: {
    marginBottom: 0,
  },
  progressSection: {
    marginBottom: Spacing.sm,
  },
  progressLabelRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 4,
  },
  progressLabel: {
    ...Typography.caption,
    color: Colors.textMuted,
  },
  paidText: {
    ...Typography.caption,
    color: Colors.success,
    marginTop: 4,
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

export default DebtScreen;
