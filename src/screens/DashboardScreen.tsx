import React, { useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ActivityIndicator,
  RefreshControl,
  Alert,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';

import { useApp } from '../context/AppContext';
import { Colors, Spacing, Typography, BorderRadius } from '../theme';
import { computeDashboardStats } from '../utils/calculations';
import { formatCurrency, formatPercent } from '../utils/formatters';
import { exportTextSummary } from '../utils/exports';

import Card from '../components/common/Card';
import Button from '../components/common/Button';
import ProgressBar from '../components/common/ProgressBar';
import EmptyState from '../components/common/EmptyState';
import SectionHeader from '../components/common/SectionHeader';
import StatCard from '../components/common/StatCard';
import ActivityFeed from '../components/common/ActivityFeed';
import Disclaimer from '../components/common/Disclaimer';
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

const DashboardScreen: React.FC = () => {
  const insets = useSafeAreaInsets();
  const navigation = useNavigation<NavProp>();
  const { data, loading, error, refreshData } = useApp();
  const [exportingText, setExportingText] = React.useState(false);

  const stats = React.useMemo(
    () =>
      computeDashboardStats(
        data.savingsGoals,
        data.contributions,
        data.debtAccounts,
        data.debtPayments,
      ),
    [data.savingsGoals, data.contributions, data.debtAccounts, data.debtPayments],
  );

  const currency = data.preferences.currency;
  const hasAnyData =
    data.savingsGoals.length > 0 || data.debtAccounts.length > 0;

  const overallProgress =
    stats.totalTarget > 0
      ? Math.min(100, (stats.totalSaved / stats.totalTarget) * 100)
      : 0;

  const handleExportSummary = useCallback(async () => {
    setExportingText(true);
    try {
      await exportTextSummary(data, data.preferences);
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Export failed.';
      Alert.alert('Export Error', msg);
    } finally {
      setExportingText(false);
    }
  }, [data]);

  if (loading) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator size="large" color={Colors.primary} />
        <Text style={styles.loadingText}>Loading your data...</Text>
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
      <View style={[styles.header, { paddingTop: insets.top + 16 }]}>
        <Text style={styles.headerTitle}>Savings Tracker</Text>
        <Text style={styles.headerSubtitle}>Your personal finance planner</Text>
      </View>

      <BannerAdComponent />

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
        {!hasAnyData ? (
          <EmptyState
            icon="$"
            title="Welcome to Savings Tracker"
            description="Add your first savings goal or debt to get started."
            actionLabel="Add Savings Goal"
            onAction={() => navigation.navigate('AddSavingsGoal')}
          />
        ) : (
          <View style={styles.content}>
            <View style={styles.section}>
              <SectionHeader title="Overview" style={styles.sectionHeader} />
              <View style={styles.statGrid}>
                <View style={styles.statRow}>
                  <StatCard
                    label="Total Saved"
                    value={formatCurrency(stats.totalSaved, currency)}
                    color={Colors.success}
                    style={styles.statCardHalf}
                  />
                  <StatCard
                    label="Goals"
                    value={String(stats.activeGoalsCount)}
                    color={Colors.primary}
                    style={styles.statCardHalf}
                  />
                </View>
                <View style={styles.statRow}>
                  <StatCard
                    label="Total Debt"
                    value={formatCurrency(stats.totalDebt, currency)}
                    color={stats.totalDebt > 0 ? Colors.error : Colors.success}
                    style={styles.statCardHalf}
                  />
                  <StatCard
                    label="Debt Paid"
                    value={formatCurrency(stats.totalDebtPaid, currency)}
                    color={Colors.success}
                    style={styles.statCardHalf}
                  />
                </View>
              </View>
            </View>

            {stats.totalTarget > 0 && (
              <View style={styles.section}>
                <SectionHeader
                  title="Overall Savings Progress"
                  style={styles.sectionHeader}
                />
                <Card style={styles.progressCard}>
                  <View style={styles.progressRow}>
                    <Text style={styles.progressPercent}>
                      {formatPercent(overallProgress)}
                    </Text>
                    <Text style={styles.progressAmounts}>
                      {formatCurrency(stats.totalSaved, currency)}
                      {' / '}
                      {formatCurrency(stats.totalTarget, currency)}
                    </Text>
                  </View>
                  <ProgressBar
                    progress={overallProgress}
                    height={10}
                    showPercent={false}
                    animated
                    style={styles.progressBar}
                  />
                </Card>
              </View>
            )}

            <View style={styles.section}>
              <SectionHeader title="Quick Actions" style={styles.sectionHeader} />
              <View style={styles.actionsGrid}>
                <View style={styles.actionCol}>
                  <Button
                    title="Add Goal"
                    onPress={() => navigation.navigate('AddSavingsGoal')}
                    variant="primary"
                    size="md"
                    style={styles.actionButton}
                  />
                  <Button
                    title="Log Savings"
                    onPress={() => navigation.navigate('LogContribution', {})}
                    variant="outline"
                    size="md"
                    style={styles.actionButton}
                  />
                  <Button
                    title="Compare Strategies"
                    onPress={() => navigation.navigate('DebtStrategy')}
                    variant="secondary"
                    size="md"
                    style={styles.actionButton}
                  />
                </View>
                <View style={styles.actionCol}>
                  <Button
                    title="Add Debt"
                    onPress={() => navigation.navigate('AddDebt')}
                    variant="primary"
                    size="md"
                    style={styles.actionButton}
                  />
                  <Button
                    title="Log Payment"
                    onPress={() => navigation.navigate('LogDebtPayment', {})}
                    variant="outline"
                    size="md"
                    style={styles.actionButton}
                  />
                  <Button
                    title="Export Summary"
                    onPress={handleExportSummary}
                    variant="ghost"
                    size="md"
                    loading={exportingText}
                    style={styles.actionButton}
                  />
                </View>
              </View>
            </View>

            <View style={styles.section}>
              <SectionHeader title="Recent Activity" style={styles.sectionHeader} />
              <Card style={styles.activityCard}>
                <ActivityFeed
                  items={stats.recentActivity.slice(0, 5)}
                  currency={currency}
                />
              </Card>
            </View>

            <Disclaimer compact style={styles.disclaimer} />
          </View>
        )}
      </SafeScrollView>
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
    backgroundColor: Colors.background,
  },
  loadingText: {
    ...Typography.body,
    color: Colors.textMuted,
    marginTop: Spacing.md,
  },
  errorText: {
    ...Typography.body,
    color: Colors.error,
    textAlign: 'center',
    marginBottom: Spacing.md,
  },
  header: {
    backgroundColor: Colors.primary,
    paddingBottom: 16,
    paddingHorizontal: Spacing.md,
  },
  headerTitle: {
    ...Typography.h2,
    color: Colors.textInverse,
  },
  headerSubtitle: {
    ...Typography.caption,
    color: '#A5D6A7',
    marginTop: 2,
  },
  content: {
    paddingHorizontal: Spacing.md,
    paddingTop: Spacing.md,
  },
  section: {
    marginBottom: Spacing.lg,
  },
  sectionHeader: {
    marginBottom: Spacing.sm,
  },
  statGrid: {
    gap: Spacing.sm,
  },
  statRow: {
    flexDirection: 'row',
    gap: Spacing.sm,
  },
  statCardHalf: {
    flex: 1,
    minHeight: 116,
  },
  progressCard: {
    padding: Spacing.md,
  },
  progressRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'baseline',
    marginBottom: Spacing.sm,
  },
  progressPercent: {
    ...Typography.h3,
    color: Colors.primary,
  },
  progressAmounts: {
    ...Typography.caption,
    color: Colors.textMuted,
  },
  progressBar: {
    marginTop: 0,
  },
  actionsGrid: {
    flexDirection: 'row',
    gap: Spacing.sm,
  },
  actionCol: {
    flex: 1,
    gap: Spacing.sm,
  },
  actionButton: {
    width: '100%',
  },
  activityCard: {
    padding: Spacing.sm,
  },
  disclaimer: {
    marginBottom: Spacing.lg,
  },
});

export default DashboardScreen;
