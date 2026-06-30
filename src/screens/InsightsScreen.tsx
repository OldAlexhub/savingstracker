import React, { useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ActivityIndicator,
  RefreshControl,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';

import { useApp } from '../context/AppContext';
import { Colors, Spacing, Typography, BorderRadius } from '../theme';
import { calculateSavingsProgress } from '../utils/calculations';
import { formatCurrency, formatPercent, formatDate, formatMonths } from '../utils/formatters';

import Card from '../components/common/Card';
import Button from '../components/common/Button';
import SectionHeader from '../components/common/SectionHeader';
import StatCard from '../components/common/StatCard';
import ActivityFeed from '../components/common/ActivityFeed';
import Badge from '../components/common/Badge';
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

// Inline payoff months calculation to avoid import drift
function calcDebtPayoffMonths(
  balance: number,
  apr: number | null,
  minimumPayment: number | null,
): number | null {
  if (balance <= 0) return 0;
  if (!minimumPayment || minimumPayment <= 0) return null;

  if (!apr || apr <= 0) {
    return Math.ceil(balance / minimumPayment);
  }

  const monthlyRate = apr / 100 / 12;
  const monthlyInterest = balance * monthlyRate;
  if (minimumPayment <= monthlyInterest) return null;

  const n =
    -Math.log(1 - (monthlyRate * balance) / minimumPayment) /
    Math.log(1 + monthlyRate);

  if (!isFinite(n) || isNaN(n) || n < 0) return null;
  return Math.min(Math.ceil(n), 600);
}

function isoDateNDaysAgo(n: number): Date {
  const d = new Date();
  d.setDate(d.getDate() - n);
  d.setHours(0, 0, 0, 0);
  return d;
}

const InsightsScreen: React.FC = () => {
  const insets = useSafeAreaInsets();
  const navigation = useNavigation<NavProp>();
  const { data, loading, error, refreshData } = useApp();

  const currency = data.preferences.currency;

  const sevenDaysAgo = useMemo(() => isoDateNDaysAgo(7), []);
  const thirtyDaysAgo = useMemo(() => isoDateNDaysAgo(30), []);

  const savedThisWeek = useMemo(() => {
    return data.contributions
      .filter(c => new Date(c.date) >= sevenDaysAgo)
      .reduce((sum, c) => sum + c.amount, 0);
  }, [data.contributions, sevenDaysAgo]);

  const savedThisMonth = useMemo(() => {
    return data.contributions
      .filter(c => new Date(c.date) >= thirtyDaysAgo)
      .reduce((sum, c) => sum + c.amount, 0);
  }, [data.contributions, thirtyDaysAgo]);

  const debtPaidThisMonth = useMemo(() => {
    return data.debtPayments
      .filter(p => new Date(p.date) >= thirtyDaysAgo)
      .reduce((sum, p) => sum + p.amount, 0);
  }, [data.debtPayments, thirtyDaysAgo]);

  const totalSaved = useMemo(() => {
    return data.savingsGoals
      .filter(g => g.status === 'active')
      .reduce((sum, g) => sum + g.savedAmount, 0);
  }, [data.savingsGoals]);

  const totalDebt = useMemo(() => {
    return data.debtAccounts
      .filter(d => d.status === 'active')
      .reduce((sum, d) => sum + d.currentBalance, 0);
  }, [data.debtAccounts]);

  const netPosition = totalSaved - totalDebt;

  const activeGoals = useMemo(
    () => data.savingsGoals.filter(g => g.status === 'active'),
    [data.savingsGoals],
  );

  const activeDebts = useMemo(
    () => data.debtAccounts.filter(d => d.status === 'active'),
    [data.debtAccounts],
  );

  // Build recent activity from all data
  const recentActivity = useMemo(() => {
    type ActivityItem = {
      id: string;
      type: 'contribution' | 'debt_payment' | 'goal_created' | 'debt_created' | 'goal_completed' | 'debt_paid_off';
      description: string;
      amount: number | null;
      date: string;
    };

    const items: ActivityItem[] = [];

    for (const c of data.contributions) {
      const goal = data.savingsGoals.find(g => g.id === c.goalId);
      items.push({
        id: `contrib-${c.id}`,
        type: 'contribution',
        description: `Saved${goal ? ` to "${goal.name}"` : ''}`,
        amount: c.amount,
        date: c.date,
      });
    }

    for (const p of data.debtPayments) {
      const debt = data.debtAccounts.find(d => d.id === p.debtId);
      items.push({
        id: `pay-${p.id}`,
        type: 'debt_payment',
        description: `Payment on${debt ? ` "${debt.name}"` : ' debt'}`,
        amount: p.amount,
        date: p.date,
      });
    }

    items.sort(
      (a, b) => new Date(b.date).getTime() - new Date(a.date).getTime(),
    );
    return items.slice(0, 10);
  }, [data.contributions, data.debtPayments, data.savingsGoals, data.debtAccounts]);

  if (loading && activeGoals.length === 0 && activeDebts.length === 0) {
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
        <Text style={styles.headerTitle}>Insights &amp; Progress</Text>
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
        <View style={styles.content}>
          {/* This Period */}
          <View style={styles.section}>
            <SectionHeader title="This Period" style={styles.sectionHeader} />
            <View style={styles.statGrid}>
              <View style={styles.statRow}>
                <StatCard
                  label="Saved This Week"
                  value={formatCurrency(savedThisWeek, currency)}
                  color={Colors.success}
                  style={styles.statCardHalf}
                />
                <StatCard
                  label="Saved This Month"
                  value={formatCurrency(savedThisMonth, currency)}
                  color={Colors.primary}
                  style={styles.statCardHalf}
                />
              </View>
              <View style={styles.statRow}>
                <StatCard
                  label="Debt Paid (30d)"
                  value={formatCurrency(debtPaidThisMonth, currency)}
                  color={debtPaidThisMonth > 0 ? Colors.success : Colors.textMuted}
                  style={styles.statCardHalf}
                />
                <StatCard
                  label="Net Position"
                  value={
                    (netPosition >= 0 ? '+' : '') +
                    formatCurrency(Math.abs(netPosition), currency)
                  }
                  color={netPosition >= 0 ? Colors.success : Colors.error}
                  style={styles.statCardHalf}
                />
              </View>
            </View>
          </View>

          {/* Savings Goals Status */}
          <View style={styles.section}>
            <SectionHeader
              title="Savings Goals Status"
              style={styles.sectionHeader}
            />
            {activeGoals.length === 0 ? (
              <Card style={styles.emptyCard}>
                <Text style={styles.emptyCardText}>
                  No active savings goals. Add a goal to track progress here.
                </Text>
              </Card>
            ) : (
              activeGoals.map(goal => {
                const calc = calculateSavingsProgress(goal);
                const onTrack = calc.isOnTrack;

                return (
                  <Card key={goal.id} style={styles.itemCard}>
                    <View style={styles.itemRow}>
                      <View style={styles.itemInfo}>
                        <Text style={styles.itemName} numberOfLines={1}>
                          {goal.name}
                        </Text>
                        <Text style={styles.itemSub}>
                          {formatPercent(calc.progressPercent)} complete
                          {calc.estimatedCompletionDate
                            ? ` - Est. ${formatDate(calc.estimatedCompletionDate)}`
                            : ''}
                        </Text>
                      </View>
                      <Badge
                        label={onTrack ? 'On Track' : 'Off Track'}
                        color={onTrack ? Colors.successLight : Colors.warningLight}
                        textColor={onTrack ? Colors.success : Colors.warning}
                        size="sm"
                      />
                    </View>
                    <View style={styles.progressTrack}>
                      <View
                        style={[
                          styles.progressFill,
                          {
                            width: `${Math.min(100, calc.progressPercent)}%`,
                            backgroundColor: onTrack
                              ? Colors.success
                              : Colors.warning,
                          },
                        ]}
                      />
                    </View>
                  </Card>
                );
              })
            )}
          </View>

          {/* Debt Payoff Timeline */}
          <View style={styles.section}>
            <SectionHeader
              title="Debt Payoff Timeline"
              style={styles.sectionHeader}
            />
            {activeDebts.length === 0 ? (
              <Card style={styles.emptyCard}>
                <Text style={styles.emptyCardText}>
                  No active debts. You&apos;re debt-free or add a debt to track it.
                </Text>
              </Card>
            ) : (
              activeDebts.map(debt => {
                const missingInfo =
                  debt.apr === null || debt.minimumPayment === null;
                const months = missingInfo
                  ? null
                  : calcDebtPayoffMonths(
                      debt.currentBalance,
                      debt.apr,
                      debt.minimumPayment,
                    );

                return (
                  <Card key={debt.id} style={styles.itemCard}>
                    <View style={styles.itemRow}>
                      <View style={styles.itemInfo}>
                        <Text style={styles.itemName} numberOfLines={1}>
                          {debt.name}
                        </Text>
                        <Text style={styles.itemSub}>
                          Balance: {formatCurrency(debt.currentBalance, currency)}
                          {debt.apr !== null ? ` - ${debt.apr.toFixed(2)}% APR` : ''}
                        </Text>
                      </View>
                      <View style={styles.payoffBadge}>
                        {missingInfo ? (
                          <Badge
                            label="Info needed"
                            color={Colors.warningLight}
                            textColor={Colors.warning}
                            size="sm"
                          />
                        ) : months === null ? (
                          <Badge
                            label="Payment low"
                            color={Colors.errorLight}
                            textColor={Colors.error}
                            size="sm"
                          />
                        ) : (
                          <Badge
                            label={formatMonths(months)}
                            color={Colors.primaryFade}
                            textColor={Colors.primary}
                            size="sm"
                          />
                        )}
                      </View>
                    </View>
                    {missingInfo && (
                      <Text style={styles.warningText}>
                        Add APR and minimum payment for payoff estimate.
                      </Text>
                    )}
                    {!missingInfo && months === null && (
                      <Text style={styles.warningText}>
                        Minimum payment doesn&apos;t cover monthly interest. Increase payment.
                      </Text>
                    )}
                  </Card>
                );
              })
            )}
          </View>

          {/* Strategy Comparison Notes */}
          <View style={styles.section}>
            <SectionHeader
              title="Strategy Comparison"
              style={styles.sectionHeader}
            />
            <Card style={styles.strategyCard}>
              <Text style={styles.strategyTitle}>Avalanche Method</Text>
              <Text style={styles.strategyDesc}>
                Pay off the highest APR debt first. Minimizes total interest
                paid - the mathematically optimal approach.
              </Text>

              <View style={styles.strategyDivider} />

              <Text style={styles.strategyTitle}>Snowball Method</Text>
              <Text style={styles.strategyDesc}>
                Pay off the smallest balance first. Provides quick psychological
                wins and keeps motivation high.
              </Text>

              <View style={styles.strategyDivider} />

              <Text style={[styles.strategyDesc, styles.strategyNote]}>
                The best strategy is the one you&apos;ll stick with. Compare
                both to see which fits your situation.
              </Text>

              <Button
                title="View Debt Strategies"
                onPress={() => navigation.navigate('DebtStrategy')}
                variant="primary"
                size="md"
                style={styles.strategyButton}
              />
            </Card>
          </View>

          {/* Recent Activity */}
          <View style={styles.section}>
            <SectionHeader title="Recent Activity" style={styles.sectionHeader} />
            <Card style={styles.activityCard}>
              <ActivityFeed items={recentActivity} currency={currency} />
            </Card>
          </View>

          <Disclaimer compact style={styles.disclaimer} />
        </View>
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
  content: {
    padding: Spacing.md,
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
  emptyCard: {
    padding: Spacing.md,
    alignItems: 'center',
  },
  emptyCardText: {
    ...Typography.body,
    color: Colors.textMuted,
    textAlign: 'center',
    fontStyle: 'italic',
  },
  itemCard: {
    padding: Spacing.md,
    marginBottom: Spacing.sm,
  },
  itemRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: Spacing.sm,
  },
  itemInfo: {
    flex: 1,
    marginRight: Spacing.sm,
  },
  itemName: {
    ...Typography.h4,
    color: Colors.text,
    marginBottom: 2,
  },
  itemSub: {
    ...Typography.caption,
    color: Colors.textMuted,
  },
  payoffBadge: {
    flexShrink: 0,
  },
  progressTrack: {
    height: 6,
    backgroundColor: Colors.border,
    borderRadius: BorderRadius.round,
    overflow: 'hidden',
  },
  progressFill: {
    height: 6,
    borderRadius: BorderRadius.round,
  },
  warningText: {
    ...Typography.caption,
    color: Colors.warning,
    marginTop: Spacing.xs,
  },
  strategyCard: {
    padding: Spacing.md,
  },
  strategyTitle: {
    ...Typography.h4,
    color: Colors.text,
    marginBottom: Spacing.xs,
  },
  strategyDesc: {
    ...Typography.body,
    color: Colors.textSecondary,
    lineHeight: 22,
  },
  strategyNote: {
    fontStyle: 'italic',
    color: Colors.textMuted,
  },
  strategyDivider: {
    height: 1,
    backgroundColor: Colors.divider,
    marginVertical: Spacing.md,
  },
  strategyButton: {
    marginTop: Spacing.md,
  },
  activityCard: {
    padding: Spacing.sm,
  },
  disclaimer: {
    marginBottom: Spacing.lg,
  },
});

export default InsightsScreen;
