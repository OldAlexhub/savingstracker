import React, {useCallback, useMemo} from 'react';
import {
  ActivityIndicator,
  RefreshControl,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import {useNavigation} from '@react-navigation/native';
import type {NativeStackNavigationProp} from '@react-navigation/native-stack';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import {useSafeAreaInsets} from 'react-native-safe-area-context';

import BannerAdComponent from '../components/ads/BannerAdComponent';
import ProgressBar from '../components/common/ProgressBar';
import SafeScrollView from '../components/layout/SafeScrollView';
import {useApp} from '../context/AppContext';
import {BorderRadius, Colors, Shadows, Spacing, Typography} from '../theme';
import type {RootStackParamList} from '../types';
import {computeDashboardStats} from '../utils/calculations';
import {formatCurrency} from '../utils/formatters';

type Navigation = NativeStackNavigationProp<RootStackParamList>;

interface QuickActionProps {
  icon: string;
  label: string;
  color: string;
  onPress: () => void;
}

function QuickAction({icon, label, color, onPress}: QuickActionProps) {
  return (
    <TouchableOpacity
      accessibilityRole="button"
      style={styles.quickAction}
      activeOpacity={0.78}
      onPress={onPress}>
      <View style={[styles.quickIcon, {backgroundColor: color}]}>
        <Icon name={icon} color={Colors.textInverse} size={22} />
      </View>
      <Text style={styles.quickLabel}>{label}</Text>
    </TouchableOpacity>
  );
}

export default function DashboardScreen(): React.JSX.Element {
  const insets = useSafeAreaInsets();
  const navigation = useNavigation<Navigation>();
  const {
    data,
    loading,
    error,
    refreshData,
    refreshInsights,
    insights,
    syncStatus,
    pendingSyncCount,
  } = useApp();

  const stats = useMemo(() => computeDashboardStats(
    data.savingsGoals,
    data.contributions,
    data.debtAccounts,
    data.debtPayments,
  ), [data]);
  const activeGoals = data.savingsGoals.filter(item => item.status === 'active');
  const activeDebts = data.debtAccounts.filter(item => item.status === 'active');
  const leadGoal = [...activeGoals].sort((a, b) => {
    const aProgress = a.targetAmount > 0 ? a.savedAmount / a.targetAmount : 0;
    const bProgress = b.targetAmount > 0 ? b.savedAmount / b.targetAmount : 0;
    return bProgress - aProgress;
  })[0];
  const highestAprDebt = [...activeDebts].sort((a, b) => (b.apr ?? 0) - (a.apr ?? 0))[0];
  const currency = data.preferences.currency;
  const netPosition = stats.totalSaved - stats.totalDebt;
  const savingsProgress = stats.totalTarget > 0
    ? Math.min(100, stats.totalSaved / stats.totalTarget * 100)
    : 0;
  const nextAction = insights?.nextActions[0];

  const refresh = useCallback(async () => {
    await refreshData();
    await refreshInsights();
  }, [refreshData, refreshInsights]);

  const syncLabel = syncStatus === 'synced'
    ? 'Synced'
    : syncStatus === 'offline'
      ? 'Offline'
      : syncStatus === 'syncing'
        ? 'Syncing'
        : pendingSyncCount > 0
          ? `${pendingSyncCount} pending`
          : 'Ready';

  if (loading && !data.preferences.dataCollectionAcceptedAt) {
    return <View style={styles.centered}><ActivityIndicator size="large" color={Colors.primary} /></View>;
  }
  if (error) {
    return (
      <View style={styles.centered}>
        <Text style={styles.error}>{error}</Text>
        <TouchableOpacity style={styles.retry} onPress={() => void refresh()}>
          <Text style={styles.retryText}>Try again</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <View style={styles.screen}>
      <View style={[styles.header, {paddingTop: insets.top + 12}]}>
        <View style={styles.headerRow}>
          <View>
            <Text style={styles.eyebrow}>MONDAY MOMENTUM</Text>
            <Text style={styles.title}>Money, moving forward.</Text>
          </View>
          <View style={styles.avatar}>
            <Icon name="chart-timeline-variant-shimmer" color="#92E9C7" size={24} />
          </View>
        </View>
        <View style={styles.syncRow}>
          <View style={styles.syncDot} />
          <Text style={styles.syncText}>{syncLabel}</Text>
          <Text style={styles.syncHint}>• encrypted on this device</Text>
        </View>
      </View>

      <SafeScrollView
        refreshControl={<RefreshControl refreshing={loading} onRefresh={() => void refresh()} colors={[Colors.primary]} />}>
        <View style={styles.content}>
          <View style={styles.momentumCard}>
            <View style={styles.cardTopRow}>
              <Text style={styles.momentumLabel}>Financial momentum</Text>
              <View style={styles.estimatedPill}><Text style={styles.estimatedText}>LIVE</Text></View>
            </View>
            <Text style={styles.netLabel}>Saved minus debt</Text>
            <Text style={[styles.netValue, netPosition < 0 && styles.netNegative]}>
              {netPosition < 0 ? '−' : '+'}{formatCurrency(Math.abs(netPosition), currency)}
            </Text>
            <View style={styles.metricDivider} />
            <View style={styles.metricRow}>
              <View style={styles.metricBlock}>
                <Text style={styles.metricLabel}>SAVED</Text>
                <Text style={styles.metricValue}>{formatCurrency(stats.totalSaved, currency)}</Text>
              </View>
              <View style={styles.metricBlock}>
                <Text style={styles.metricLabel}>DEBT LEFT</Text>
                <Text style={styles.metricValue}>{formatCurrency(stats.totalDebt, currency)}</Text>
              </View>
              <View style={styles.metricBlock}>
                <Text style={styles.metricLabel}>GOALS</Text>
                <Text style={styles.metricValue}>{stats.activeGoalsCount}</Text>
              </View>
            </View>
          </View>

          <Text style={styles.sectionTitle}>Quick log</Text>
          <View style={styles.quickRow}>
            <QuickAction icon="plus" label="New goal" color={Colors.primary} onPress={() => navigation.navigate('AddSavingsGoal')} />
            <QuickAction icon="bank-transfer-in" label="Save" color="#3975D6" onPress={() => navigation.navigate('LogContribution', {})} />
            <QuickAction icon="credit-card-check-outline" label="Pay debt" color="#9B55C3" onPress={() => navigation.navigate('LogDebtPayment', {})} />
            <QuickAction icon="plus-circle-outline" label="New debt" color="#D97706" onPress={() => navigation.navigate('AddDebt')} />
          </View>

          <Text style={styles.sectionTitle}>Your next move</Text>
          <TouchableOpacity
            style={styles.nextCard}
            activeOpacity={0.82}
            onPress={() => nextAction?.recordId
              ? navigation.navigate('LogContribution', {goalId: nextAction.recordId})
              : leadGoal
                ? navigation.navigate('LogContribution', {goalId: leadGoal.id})
                : navigation.navigate('AddSavingsGoal')}>
            <View style={styles.nextIcon}>
              <Icon name="arrow-top-right-thick" color={Colors.primaryDark} size={23} />
            </View>
            <View style={styles.nextCopy}>
              <View style={styles.nextTitleRow}>
                <Text style={styles.nextTitle} numberOfLines={2}>
                  {nextAction?.title ?? (leadGoal ? `Keep ${leadGoal.name} moving` : 'Create your first savings goal')}
                </Text>
                <Text style={styles.estimateTag}>Estimated</Text>
              </View>
              <Text style={styles.nextReason} numberOfLines={3}>
                {nextAction?.reason ?? (leadGoal
                  ? 'A contribution today keeps your plan current and improves your next forecast.'
                  : 'Start with a goal, target amount, and date. You can adjust everything later.')}
              </Text>
            </View>
            <Icon name="chevron-right" size={24} color={Colors.textMuted} />
          </TouchableOpacity>

          {leadGoal ? (
            <>
              <View style={styles.sectionHeadingRow}>
                <Text style={styles.sectionTitle}>Closest goal</Text>
                <TouchableOpacity onPress={() => navigation.navigate('SavingsGoalDetail', {goalId: leadGoal.id})}>
                  <Text style={styles.link}>Open</Text>
                </TouchableOpacity>
              </View>
              <TouchableOpacity
                style={styles.focusCard}
                activeOpacity={0.86}
                onPress={() => navigation.navigate('SavingsGoalDetail', {goalId: leadGoal.id})}>
                <View style={styles.focusTop}>
                  <View style={styles.goalGlyph}><Icon name="flag-variant" size={22} color={Colors.primaryDark} /></View>
                  <View style={styles.focusCopy}>
                    <Text style={styles.focusName}>{leadGoal.name}</Text>
                    <Text style={styles.focusMeta}>
                      {formatCurrency(leadGoal.savedAmount, currency)} of {formatCurrency(leadGoal.targetAmount, currency)}
                    </Text>
                  </View>
                  <Text style={styles.focusPercent}>{Math.round(leadGoal.targetAmount > 0 ? leadGoal.savedAmount / leadGoal.targetAmount * 100 : 0)}%</Text>
                </View>
                <ProgressBar progress={leadGoal.targetAmount > 0 ? leadGoal.savedAmount / leadGoal.targetAmount * 100 : 0} height={8} showPercent={false} />
              </TouchableOpacity>
            </>
          ) : null}

          {highestAprDebt ? (
            <TouchableOpacity
              style={styles.debtNudge}
              activeOpacity={0.84}
              onPress={() => navigation.navigate('DebtDetail', {debtId: highestAprDebt.id})}>
              <Icon name="shield-alert-outline" size={22} color={Colors.warning} />
              <View style={styles.nextCopy}>
                <Text style={styles.debtNudgeTitle}>Debt focus: {highestAprDebt.name}</Text>
                <Text style={styles.debtNudgeBody}>{highestAprDebt.apr?.toFixed(2) ?? '—'}% APR • {formatCurrency(highestAprDebt.currentBalance, currency)} remaining</Text>
              </View>
              <Icon name="chevron-right" size={22} color={Colors.textMuted} />
            </TouchableOpacity>
          ) : null}

          {!leadGoal && !highestAprDebt ? (
            <View style={styles.emptyCard}>
              <Icon name="sprout-outline" size={34} color={Colors.primary} />
              <Text style={styles.emptyTitle}>Start with one clear target</Text>
              <Text style={styles.emptyBody}>Your home screen will turn activity into progress, forecasts, streaks, and focused next actions.</Text>
              <TouchableOpacity style={styles.emptyButton} onPress={() => navigation.navigate('AddSavingsGoal')}>
                <Text style={styles.emptyButtonText}>Add a savings goal</Text>
              </TouchableOpacity>
            </View>
          ) : null}

          <View style={styles.totalProgressRow}>
            <Text style={styles.totalProgressLabel}>Across active savings goals</Text>
            <Text style={styles.totalProgressValue}>{Math.round(savingsProgress)}%</Text>
          </View>
          <ProgressBar progress={savingsProgress} height={6} showPercent={false} />

          <BannerAdComponent style={styles.ad} />
        </View>
      </SafeScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: {flex: 1, backgroundColor: Colors.background},
  centered: {flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: Colors.background, padding: Spacing.lg},
  error: {...Typography.body, color: Colors.error, textAlign: 'center', marginBottom: 16},
  retry: {backgroundColor: Colors.primary, paddingHorizontal: 22, paddingVertical: 12, borderRadius: 99},
  retryText: {color: Colors.textInverse, fontWeight: '700'},
  header: {backgroundColor: '#092A23', paddingHorizontal: Spacing.lg, paddingBottom: 24, borderBottomLeftRadius: 28, borderBottomRightRadius: 28},
  headerRow: {flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between'},
  eyebrow: {...Typography.label, color: '#65D8AD', letterSpacing: 1.2},
  title: {fontSize: 24, fontWeight: '800', letterSpacing: -0.7, color: '#F4FFF9', marginTop: 4},
  avatar: {width: 44, height: 44, borderRadius: 15, backgroundColor: '#123F34', alignItems: 'center', justifyContent: 'center'},
  syncRow: {flexDirection: 'row', alignItems: 'center', marginTop: 14},
  syncDot: {width: 7, height: 7, borderRadius: 4, backgroundColor: '#63E6B5', marginRight: 7},
  syncText: {...Typography.caption, color: '#D4F3E7', fontWeight: '600'},
  syncHint: {...Typography.caption, color: '#7EA99B', marginLeft: 4},
  content: {padding: Spacing.md, paddingTop: 18},
  momentumCard: {backgroundColor: Colors.surface, borderRadius: BorderRadius.xl, padding: Spacing.lg, borderWidth: 1, borderColor: Colors.border, ...Shadows.sm},
  cardTopRow: {flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center'},
  momentumLabel: {...Typography.h3, color: Colors.text},
  estimatedPill: {backgroundColor: Colors.primaryFade, borderRadius: 99, paddingHorizontal: 9, paddingVertical: 4},
  estimatedText: {fontSize: 9, fontWeight: '800', letterSpacing: 1, color: Colors.primaryDark},
  netLabel: {...Typography.caption, color: Colors.textMuted, marginTop: 18},
  netValue: {fontSize: 37, lineHeight: 44, fontWeight: '800', letterSpacing: -1.2, color: Colors.primaryDark},
  netNegative: {color: Colors.error},
  metricDivider: {height: 1, backgroundColor: Colors.divider, marginVertical: 17},
  metricRow: {flexDirection: 'row'},
  metricBlock: {flex: 1},
  metricLabel: {fontSize: 9, fontWeight: '700', letterSpacing: 0.9, color: Colors.textMuted, marginBottom: 4},
  metricValue: {fontSize: 14, fontWeight: '700', color: Colors.text},
  sectionTitle: {...Typography.h3, color: Colors.text, marginTop: 24, marginBottom: 12},
  sectionHeadingRow: {flexDirection: 'row', alignItems: 'baseline', justifyContent: 'space-between'},
  link: {...Typography.body, fontWeight: '700', color: Colors.primary},
  quickRow: {flexDirection: 'row', justifyContent: 'space-between'},
  quickAction: {width: '23%', alignItems: 'center'},
  quickIcon: {width: 48, height: 48, borderRadius: 17, alignItems: 'center', justifyContent: 'center', marginBottom: 7},
  quickLabel: {fontSize: 11, fontWeight: '600', color: Colors.textSecondary, textAlign: 'center'},
  nextCard: {flexDirection: 'row', alignItems: 'center', backgroundColor: Colors.successLight, borderRadius: BorderRadius.lg, padding: 15, borderWidth: 1, borderColor: Colors.border},
  nextIcon: {width: 42, height: 42, borderRadius: 14, backgroundColor: Colors.primaryFade, alignItems: 'center', justifyContent: 'center', marginRight: 12},
  nextCopy: {flex: 1},
  nextTitleRow: {flexDirection: 'row', alignItems: 'center', gap: 7},
  nextTitle: {...Typography.h4, color: Colors.text, flexShrink: 1},
  estimateTag: {fontSize: 9, fontWeight: '700', color: Colors.primaryDark, backgroundColor: Colors.primaryFade, borderRadius: 99, paddingHorizontal: 6, paddingVertical: 3},
  nextReason: {...Typography.caption, color: Colors.textSecondary, marginTop: 3},
  focusCard: {backgroundColor: Colors.surface, borderRadius: BorderRadius.lg, padding: 16, borderWidth: 1, borderColor: Colors.border, ...Shadows.sm},
  focusTop: {flexDirection: 'row', alignItems: 'center', marginBottom: 13},
  goalGlyph: {width: 42, height: 42, borderRadius: 14, backgroundColor: Colors.primaryFade, alignItems: 'center', justifyContent: 'center', marginRight: 12},
  focusCopy: {flex: 1},
  focusName: {...Typography.h4, color: Colors.text},
  focusMeta: {...Typography.caption, color: Colors.textMuted, marginTop: 2},
  focusPercent: {fontSize: 17, fontWeight: '800', color: Colors.primaryDark},
  debtNudge: {flexDirection: 'row', alignItems: 'center', gap: 11, marginTop: 12, backgroundColor: Colors.surface, borderWidth: 1, borderColor: Colors.border, borderRadius: BorderRadius.lg, padding: 15},
  debtNudgeTitle: {...Typography.body, color: Colors.text, fontWeight: '700'},
  debtNudgeBody: {...Typography.caption, color: Colors.textMuted, marginTop: 2},
  emptyCard: {alignItems: 'center', backgroundColor: Colors.surface, borderRadius: BorderRadius.xl, padding: 28, borderWidth: 1, borderColor: Colors.border, marginTop: 24},
  emptyTitle: {...Typography.h2, color: Colors.text, textAlign: 'center', marginTop: 12},
  emptyBody: {...Typography.body, color: Colors.textSecondary, textAlign: 'center', marginTop: 7},
  emptyButton: {marginTop: 18, backgroundColor: Colors.primary, borderRadius: 99, paddingHorizontal: 22, paddingVertical: 12},
  emptyButtonText: {color: Colors.textInverse, fontWeight: '700'},
  totalProgressRow: {flexDirection: 'row', justifyContent: 'space-between', marginTop: 24, marginBottom: 7},
  totalProgressLabel: {...Typography.caption, color: Colors.textMuted},
  totalProgressValue: {...Typography.caption, color: Colors.text, fontWeight: '700'},
  ad: {marginTop: 20},
});
