import React, {useEffect, useMemo, useState} from 'react';
import {
  ActivityIndicator,
  RefreshControl,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import {useSafeAreaInsets} from 'react-native-safe-area-context';

import BannerAdComponent from '../components/ads/BannerAdComponent';
import NativeAdPlaceholder from '../components/ads/NativeAdPlaceholder';
import SafeScrollView from '../components/layout/SafeScrollView';
import {useApp} from '../context/AppContext';
import {BorderRadius, Colors, Shadows, Spacing, Typography} from '../theme';
import {formatCurrency, formatDate} from '../utils/formatters';

function riskColor(risk: string): string {
  if (risk === 'low') return Colors.success;
  if (risk === 'medium') return Colors.warning;
  return Colors.error;
}

export default function InsightsScreen(): React.JSX.Element {
  const insets = useSafeAreaInsets();
  const {
    data,
    insights,
    loading,
    refreshInsights,
    runScenario,
    syncStatus,
    trackEvent,
  } = useApp();
  const [scenarioType, setScenarioType] = useState<'goal_contribution' | 'debt_extra_payment'>('goal_contribution');
  const [monthlyAmount, setMonthlyAmount] = useState('100');
  const [scenarioResult, setScenarioResult] = useState<Record<string, number | string | null> | null>(null);
  const [scenarioLoading, setScenarioLoading] = useState(false);
  const [scenarioMessage, setScenarioMessage] = useState<string | null>(null);

  const activeGoals = data.savingsGoals.filter(item => item.status === 'active');
  const activeDebts = data.debtAccounts.filter(item => item.status === 'active');
  const scenarioRecord = scenarioType === 'goal_contribution' ? activeGoals[0] : activeDebts[0];
  const currency = data.preferences.currency;

  const localAction = useMemo(() => {
    if (activeGoals[0]) {
      return {
        title: `Build consistency for ${activeGoals[0].name}`,
        reason: 'Log contributions as they happen to improve the forecast range and on-track estimate.',
      };
    }
    if (activeDebts[0]) {
      return {
        title: `Review ${activeDebts[0].name}`,
        reason: 'Adding the minimum payment and APR produces a more useful payoff estimate.',
      };
    }
    return {
      title: 'Create your first trackable target',
      reason: 'Insights appear as soon as you add a savings goal or debt account.',
    };
  }, [activeDebts, activeGoals]);

  useEffect(() => {
    void trackEvent('insight_viewed', 'Insights');
  }, [trackEvent]);

  const simulate = async () => {
    const amount = Number(monthlyAmount);
    if (!scenarioRecord || !Number.isFinite(amount) || amount <= 0) {
      setScenarioMessage('Choose a record and enter an amount above zero.');
      return;
    }
    setScenarioLoading(true);
    setScenarioMessage(null);
    try {
      const result = await runScenario({type: scenarioType, recordId: scenarioRecord.id, monthlyAmount: amount});
      setScenarioResult(result);
      if (!result) {
        throw new Error('No server result');
      }
    } catch {
      const estimatedMonths = scenarioType === 'goal_contribution'
        ? Math.ceil(Math.max(0, activeGoals[0].targetAmount - activeGoals[0].savedAmount) / amount)
        : Math.ceil(activeDebts[0].currentBalance / ((activeDebts[0].minimumPayment ?? 0) + amount));
      setScenarioResult({estimatedMonths});
      setScenarioMessage('Showing the offline deterministic estimate. It will refresh when the analysis server is available.');
    } finally {
      setScenarioLoading(false);
    }
  };

  return (
    <View style={styles.screen}>
      <View style={[styles.header, {paddingTop: insets.top + 12}]}>
        <View style={styles.headerTop}>
          <View>
            <Text style={styles.eyebrow}>EXPLAINABLE ANALYSIS</Text>
            <Text style={styles.title}>Insights</Text>
          </View>
          <TouchableOpacity
            accessibilityLabel="Refresh insights"
            style={styles.refreshButton}
            onPress={() => void refreshInsights()}>
            {syncStatus === 'syncing' ? (
              <ActivityIndicator color="#A5F0D2" />
            ) : (
              <Icon name="refresh" size={23} color="#A5F0D2" />
            )}
          </TouchableOpacity>
        </View>
        <Text style={styles.headerBody}>
          Deterministic math first. Pattern models only add context when their quality is proven.
        </Text>
      </View>

      <SafeScrollView
        refreshControl={<RefreshControl refreshing={loading} onRefresh={() => void refreshInsights()} colors={[Colors.primary]} />}>
        <View style={styles.content}>
          <View style={styles.freshnessRow}>
            <View style={[styles.statusDot, {backgroundColor: insights ? Colors.success : Colors.warning}]} />
            <Text style={styles.freshnessText}>
              {insights
                ? `Updated ${formatDate(insights.generatedAt)}`
                : 'Offline baseline active • server analysis pending'}
            </Text>
            <View style={styles.estimatedPill}><Text style={styles.estimatedText}>ESTIMATED</Text></View>
          </View>

          <Text style={styles.sectionTitle}>Next-best actions</Text>
          {(insights?.nextActions.length ? insights.nextActions : [{id: 'local', ...localAction, priority: 1}]).slice(0, 3).map((action, index) => (
            <View key={action.id} style={styles.actionCard}>
              <View style={styles.actionIndex}><Text style={styles.actionIndexText}>{index + 1}</Text></View>
              <View style={styles.actionCopy}>
                <Text style={styles.actionTitle}>{action.title}</Text>
                <Text style={styles.actionReason}>{action.reason}</Text>
              </View>
            </View>
          ))}

          <NativeAdPlaceholder style={styles.nativeAd} />

          {insights?.goals.length ? (
            <>
              <Text style={styles.sectionTitle}>Goal outlook</Text>
              {insights.goals.map(goal => (
                <View key={goal.goalId} style={styles.forecastCard}>
                  <View style={styles.forecastTop}>
                    <View style={styles.forecastCopy}>
                      <Text style={styles.forecastName}>{goal.label}</Text>
                      <Text style={styles.forecastCaption}>On-track probability</Text>
                    </View>
                    <Text style={[styles.probability, {color: riskColor(goal.risk)}]}>{goal.onTrackProbability}%</Text>
                  </View>
                  <View style={styles.barTrack}>
                    <View style={[styles.barFill, {width: `${goal.onTrackProbability}%`, backgroundColor: riskColor(goal.risk)}]} />
                  </View>
                  <Text style={styles.explanation}>{goal.explanation}</Text>
                  <Text style={styles.range}>
                    {goal.estimatedCompletionDate
                      ? `Estimated ${formatDate(goal.estimatedCompletionDate)} ± ${goal.estimatedRangeDays ?? 0} days`
                      : 'More contribution history is needed for a completion range.'}
                  </Text>
                </View>
              ))}
            </>
          ) : null}

          {insights?.debts.length ? (
            <>
              <Text style={styles.sectionTitle}>Debt outlook</Text>
              {insights.debts.map(debt => (
                <View key={debt.debtId} style={styles.forecastCard}>
                  <View style={styles.forecastTop}>
                    <View style={styles.forecastCopy}>
                      <Text style={styles.forecastName}>{debt.label}</Text>
                      <Text style={styles.forecastCaption}>Payment consistency</Text>
                    </View>
                    <Text style={[styles.probability, {color: riskColor(debt.risk)}]}>{debt.paymentConsistency}%</Text>
                  </View>
                  <View style={styles.barTrack}>
                    <View style={[styles.barFill, {width: `${debt.paymentConsistency}%`, backgroundColor: riskColor(debt.risk)}]} />
                  </View>
                  <Text style={styles.explanation}>{debt.explanation}</Text>
                </View>
              ))}
            </>
          ) : null}

          <Text style={styles.sectionTitle}>What-if studio</Text>
          <View style={styles.simulator}>
            <View style={styles.segmented}>
              <TouchableOpacity
                style={[styles.segment, scenarioType === 'goal_contribution' && styles.segmentActive]}
                onPress={() => {setScenarioType('goal_contribution'); setScenarioResult(null);}}>
                <Text style={[styles.segmentText, scenarioType === 'goal_contribution' && styles.segmentTextActive]}>Save more</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.segment, scenarioType === 'debt_extra_payment' && styles.segmentActive]}
                onPress={() => {setScenarioType('debt_extra_payment'); setScenarioResult(null);}}>
                <Text style={[styles.segmentText, scenarioType === 'debt_extra_payment' && styles.segmentTextActive]}>Pay extra</Text>
              </TouchableOpacity>
            </View>
            <Text style={styles.simLabel}>Monthly amount for {scenarioRecord?.name ?? 'your first record'}</Text>
            <View style={styles.amountRow}>
              <Text style={styles.currency}>{currency}</Text>
              <TextInput
                accessibilityLabel="Monthly scenario amount"
                style={styles.amountInput}
                keyboardType="decimal-pad"
                value={monthlyAmount}
                onChangeText={setMonthlyAmount}
                placeholder="100"
                placeholderTextColor={Colors.textDisabled}
              />
            </View>
            <TouchableOpacity
              style={[styles.simButton, (!scenarioRecord || scenarioLoading) && styles.disabled]}
              disabled={!scenarioRecord || scenarioLoading}
              onPress={() => void simulate()}>
              {scenarioLoading ? <ActivityIndicator color={Colors.textInverse} /> : <Text style={styles.simButtonText}>Run estimated scenario</Text>}
            </TouchableOpacity>
            {scenarioResult ? (
              <View style={styles.resultCard}>
                <Icon name="chart-timeline-variant" size={24} color={Colors.primaryDark} />
                <View style={styles.resultCopy}>
                  <Text style={styles.resultValue}>
                    {scenarioResult.estimatedMonths === null
                      ? 'No reliable payoff yet'
                      : `${scenarioResult.estimatedMonths} month${scenarioResult.estimatedMonths === 1 ? '' : 's'}`}
                  </Text>
                  <Text style={styles.resultLabel}>Estimated time at {formatCurrency(Number(monthlyAmount), currency)} per month</Text>
                </View>
              </View>
            ) : null}
            {scenarioMessage ? <Text style={styles.scenarioMessage}>{scenarioMessage}</Text> : null}
          </View>

          <BannerAdComponent style={styles.ad} />
        </View>
      </SafeScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: {flex: 1, backgroundColor: Colors.background},
  header: {backgroundColor: '#092A23', paddingHorizontal: Spacing.lg, paddingBottom: 22, borderBottomLeftRadius: 28, borderBottomRightRadius: 28},
  headerTop: {flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center'},
  eyebrow: {...Typography.label, color: '#65D8AD', letterSpacing: 1.3},
  title: {fontSize: 30, fontWeight: '800', letterSpacing: -1, color: '#F4FFF9', marginTop: 2},
  refreshButton: {width: 44, height: 44, borderRadius: 15, backgroundColor: '#123F34', alignItems: 'center', justifyContent: 'center'},
  headerBody: {...Typography.body, color: '#9DC5B8', marginTop: 9, maxWidth: 340},
  content: {padding: Spacing.md, paddingTop: 18},
  freshnessRow: {flexDirection: 'row', alignItems: 'center'},
  statusDot: {width: 8, height: 8, borderRadius: 4, marginRight: 7},
  freshnessText: {...Typography.caption, color: Colors.textSecondary, flex: 1},
  estimatedPill: {borderWidth: 1, borderColor: Colors.border, borderRadius: 99, paddingHorizontal: 8, paddingVertical: 4},
  estimatedText: {fontSize: 9, fontWeight: '800', letterSpacing: 0.8, color: Colors.textMuted},
  sectionTitle: {...Typography.h3, color: Colors.text, marginTop: 24, marginBottom: 11},
  actionCard: {flexDirection: 'row', backgroundColor: Colors.surface, borderRadius: BorderRadius.lg, borderWidth: 1, borderColor: Colors.border, padding: 15, marginBottom: 9, ...Shadows.sm},
  actionIndex: {width: 32, height: 32, borderRadius: 12, backgroundColor: Colors.primaryFade, alignItems: 'center', justifyContent: 'center', marginRight: 12},
  actionIndexText: {fontSize: 13, fontWeight: '800', color: Colors.primaryDark},
  actionCopy: {flex: 1},
  actionTitle: {...Typography.h4, color: Colors.text},
  actionReason: {...Typography.caption, color: Colors.textSecondary, marginTop: 3},
  forecastCard: {backgroundColor: Colors.surface, borderRadius: BorderRadius.lg, borderWidth: 1, borderColor: Colors.border, padding: 16, marginBottom: 10},
  forecastTop: {flexDirection: 'row', alignItems: 'center'},
  forecastCopy: {flex: 1},
  forecastName: {...Typography.h4, color: Colors.text},
  forecastCaption: {...Typography.caption, color: Colors.textMuted, marginTop: 2},
  probability: {fontSize: 24, fontWeight: '800'},
  barTrack: {height: 7, borderRadius: 7, backgroundColor: Colors.surfaceVariant, marginTop: 13, overflow: 'hidden'},
  barFill: {height: 7, borderRadius: 7},
  explanation: {...Typography.body, color: Colors.textSecondary, marginTop: 12},
  range: {...Typography.caption, color: Colors.textMuted, marginTop: 7},
  simulator: {backgroundColor: '#0A2B24', borderRadius: BorderRadius.xl, padding: 17},
  segmented: {flexDirection: 'row', backgroundColor: '#143B33', borderRadius: 14, padding: 4},
  segment: {flex: 1, paddingVertical: 10, alignItems: 'center', borderRadius: 11},
  segmentActive: {backgroundColor: Colors.surface},
  segmentText: {...Typography.body, fontWeight: '700', color: '#9DC5B8'},
  segmentTextActive: {color: Colors.text},
  simLabel: {...Typography.caption, color: '#A8C9BE', marginTop: 17, marginBottom: 7},
  amountRow: {height: 52, borderRadius: 14, backgroundColor: Colors.surface, flexDirection: 'row', alignItems: 'center', paddingHorizontal: 14},
  currency: {...Typography.label, color: Colors.textMuted, marginRight: 10},
  amountInput: {flex: 1, fontSize: 22, fontWeight: '700', color: Colors.text, paddingVertical: 0},
  simButton: {height: 48, borderRadius: 99, backgroundColor: Colors.primary, alignItems: 'center', justifyContent: 'center', marginTop: 12},
  simButtonText: {fontSize: 15, fontWeight: '700', color: Colors.textInverse},
  disabled: {opacity: 0.45},
  resultCard: {flexDirection: 'row', alignItems: 'center', backgroundColor: Colors.successLight, borderRadius: 14, padding: 13, marginTop: 13},
  resultCopy: {flex: 1, marginLeft: 11},
  resultValue: {...Typography.h3, color: Colors.primaryDark},
  resultLabel: {...Typography.caption, color: Colors.textSecondary, marginTop: 2},
  scenarioMessage: {...Typography.caption, color: '#A8C9BE', marginTop: 10},
  ad: {marginTop: 20},
  nativeAd: {marginTop: 12},
});
