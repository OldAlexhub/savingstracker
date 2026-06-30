import React, { useState, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Alert,
  ScrollView,
} from 'react-native';
import { useNavigation, useRoute, RouteProp } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useApp } from '../../context/AppContext';
import { Colors, Spacing, Typography, BorderRadius, Shadows } from '../../theme';
import { formatCurrency, formatPercent, formatDate, formatRelativeDate, formatStrategyName } from '../../utils/formatters';
import { calculateSavingsProgress, calculate52WeekChallenge } from '../../utils/calculations';
import Card from '../../components/common/Card';
import Button from '../../components/common/Button';
import ProgressBar from '../../components/common/ProgressBar';
import ConfirmDialog from '../../components/common/ConfirmDialog';
import Badge from '../../components/common/Badge';
import Disclaimer from '../../components/common/Disclaimer';
import SafeScrollView from '../../components/layout/SafeScrollView';
import StickyActionBar from '../../components/layout/StickyActionBar';
import type { RootStackParamList } from '../../types/index';
import { SAVINGS_STRATEGIES } from '../../data/strategies';

type Nav = NativeStackNavigationProp<RootStackParamList>;
type Route = RouteProp<RootStackParamList, 'SavingsGoalDetail'>;

export default function SavingsGoalDetailScreen(): React.JSX.Element {
  const navigation = useNavigation<Nav>();
  const route = useRoute<Route>();
  const { goalId } = route.params;
  const { data, deleteSavingsGoal, archiveSavingsGoal, completeSavingsGoal, deleteContribution } = useApp();

  const goal = data.savingsGoals.find(g => g.id === goalId);
  const contributions = data.contributions.filter(c => c.goalId === goalId).sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
  const currency = data.preferences.currency;

  const [deleteGoalConfirm, setDeleteGoalConfirm] = useState(false);
  const [deleteContribId, setDeleteContribId] = useState<string | null>(null);
  const [actionLoading, setActionLoading] = useState(false);

  if (!goal) {
    return (
      <View style={styles.centered}>
        <Text style={styles.errorText}>Goal not found.</Text>
        <Button title="Go Back" onPress={() => navigation.goBack()} variant="primary" />
      </View>
    );
  }

  const calc = calculateSavingsProgress(goal);
  const strategyDef = SAVINGS_STRATEGIES.find(s => s.id === goal.strategyId);
  const show52Week = goal.strategyId === 'challenge_52week' || goal.strategyId === 'reverse_52week';
  const weeks52 = show52Week ? calculate52WeekChallenge(goal.createdAt, goal.strategyId === 'reverse_52week') : [];

  function getStatusBadge(status: string) {
    if (status === 'active') return { color: Colors.primaryFade, textColor: Colors.primary, label: 'Active' };
    if (status === 'completed') return { color: Colors.successLight, textColor: Colors.success, label: 'Completed' };
    return { color: Colors.surfaceVariant, textColor: Colors.textMuted, label: 'Archived' };
  }

  const badge = getStatusBadge(goal.status);

  const handleDeleteGoal = useCallback(async () => {
    setDeleteGoalConfirm(false);
    setActionLoading(true);
    try {
      await deleteSavingsGoal(goalId);
      navigation.goBack();
    } catch {
      Alert.alert('Error', 'Failed to delete goal.');
    } finally {
      setActionLoading(false);
    }
  }, [goalId, deleteSavingsGoal, navigation]);

  const handleDeleteContrib = useCallback(async () => {
    if (!deleteContribId) return;
    try {
      await deleteContribution(deleteContribId);
    } catch {
      Alert.alert('Error', 'Failed to delete contribution.');
    } finally {
      setDeleteContribId(null);
    }
  }, [deleteContribId, deleteContribution]);

  const handleArchive = useCallback(async () => {
    setActionLoading(true);
    try {
      await archiveSavingsGoal(goalId);
    } catch {
      Alert.alert('Error', 'Failed to archive goal.');
    } finally {
      setActionLoading(false);
    }
  }, [goalId, archiveSavingsGoal]);

  const handleComplete = useCallback(async () => {
    setActionLoading(true);
    try {
      await completeSavingsGoal(goalId);
    } catch {
      Alert.alert('Error', 'Failed to mark as complete.');
    } finally {
      setActionLoading(false);
    }
  }, [goalId, completeSavingsGoal]);

  return (
    <View style={styles.screen}>
      <SafeScrollView>
        {/* Goal Header */}
        <Card style={styles.headerCard}>
          <View style={styles.headerRow}>
            <Text style={styles.goalName}>{goal.name}</Text>
            <Badge label={badge.label} color={badge.color} textColor={badge.textColor} />
          </View>
          <Text style={styles.strategyLabel}>{formatStrategyName(goal.strategyId)}</Text>

          {/* Progress */}
          <View style={styles.progressSection}>
            <View style={styles.progressNumbers}>
              <View>
                <Text style={styles.savedValue}>{formatCurrency(goal.savedAmount, currency)}</Text>
                <Text style={styles.savedLabel}>saved</Text>
              </View>
              <View style={styles.progressCenter}>
                <Text style={styles.progressPct}>{formatPercent(calc.progressPercent)}</Text>
              </View>
              <View style={styles.alignRight}>
                <Text style={styles.targetValue}>{formatCurrency(goal.targetAmount, currency)}</Text>
                <Text style={styles.targetLabel}>target</Text>
              </View>
            </View>
            <ProgressBar progress={calc.progressPercent} height={12} showPercent={false} animated style={styles.progressBar} />
            {calc.remainingAmount > 0 && (
              <Text style={styles.remainingText}>
                {formatCurrency(calc.remainingAmount, currency)} remaining
              </Text>
            )}
          </View>

          <View style={styles.metaRow}>
            {goal.targetDate ? (
              <Text style={styles.metaText}>Target: {formatDate(goal.targetDate)}</Text>
            ) : null}
            {calc.daysRemaining !== null && calc.daysRemaining > 0 ? (
              <Text style={styles.metaText}>{calc.daysRemaining} days left</Text>
            ) : null}
          </View>
        </Card>

        {/* Calculations */}
        <Card style={styles.card}>
          <Text style={styles.cardTitle}>Required Contributions</Text>
          <View style={styles.calcGrid}>
            <View style={styles.calcItem}>
              <Text style={styles.calcValue}>{formatCurrency(calc.requiredDailyContribution, currency)}</Text>
              <Text style={styles.calcLabel}>Daily</Text>
            </View>
            <View style={styles.calcItem}>
              <Text style={styles.calcValue}>{formatCurrency(calc.requiredWeeklyContribution, currency)}</Text>
              <Text style={styles.calcLabel}>Weekly</Text>
            </View>
            <View style={styles.calcItem}>
              <Text style={styles.calcValue}>{formatCurrency(calc.requiredMonthlyContribution, currency)}</Text>
              <Text style={styles.calcLabel}>Monthly</Text>
            </View>
          </View>
          <View style={styles.onTrackRow}>
            <Badge
              label={calc.isOnTrack ? 'On Track' : 'Off Track'}
              color={calc.isOnTrack ? Colors.successLight : Colors.warningLight}
              textColor={calc.isOnTrack ? Colors.success : Colors.warning}
            />
            {calc.estimatedCompletionDate ? (
              <Text style={styles.estDate}>Est. completion: {formatDate(calc.estimatedCompletionDate)}</Text>
            ) : null}
          </View>
        </Card>

        {/* Strategy Info */}
        {strategyDef ? (
          <Card style={styles.card}>
            <Text style={styles.cardTitle}>Strategy: {strategyDef.name}</Text>
            <Text style={styles.strategyDesc}>{strategyDef.description}</Text>
            <Text style={styles.strategyNote}>{strategyDef.calculationDescription}</Text>
          </Card>
        ) : null}

        {/* 52-Week Schedule */}
        {show52Week && weeks52.length > 0 ? (
          <Card style={styles.card}>
            <Text style={styles.cardTitle}>Weekly Schedule (first 10 weeks)</Text>
            {weeks52.slice(0, 10).map(w => (
              <View key={w.week} style={styles.weekRow}>
                <Text style={styles.weekNum}>Week {w.week}</Text>
                <Text style={styles.weekAmount}>{formatCurrency(w.amount, currency)}</Text>
                <Text style={styles.weekCumulative}>Total: {formatCurrency(w.cumulativeAmount, currency)}</Text>
              </View>
            ))}
          </Card>
        ) : null}

        {/* Contributions */}
        <Card style={styles.card}>
          <View style={styles.contribHeader}>
            <Text style={styles.cardTitle}>Contributions ({contributions.length})</Text>
            <Button
              title="Log"
              onPress={() => navigation.navigate('LogContribution', { goalId })}
              variant="primary"
              size="sm"
            />
          </View>
          {contributions.length === 0 ? (
            <Text style={styles.emptyText}>No contributions yet. Tap "Log" to add one.</Text>
          ) : (
            contributions.map(c => (
              <View key={c.id} style={styles.contribRow}>
                <View style={styles.contribInfo}>
                  <Text style={styles.contribAmount}>{formatCurrency(c.amount, currency)}</Text>
                  <Text style={styles.contribDate}>{formatDate(c.date)}</Text>
                  {c.notes ? <Text style={styles.contribNote}>{c.notes}</Text> : null}
                </View>
                <Button
                  title="Del"
                  onPress={() => setDeleteContribId(c.id)}
                  variant="danger"
                  size="sm"
                />
              </View>
            ))
          )}
        </Card>

        {/* Notes */}
        {goal.notes ? (
          <Card style={styles.card}>
            <Text style={styles.cardTitle}>Notes</Text>
            <Text style={styles.notesText}>{goal.notes}</Text>
          </Card>
        ) : null}

        <Disclaimer compact style={styles.disclaimer} />
      </SafeScrollView>

      {/* Action Bar */}
      <StickyActionBar>
        <View style={styles.actionRow}>
          <Button
            title="Edit"
            onPress={() => navigation.navigate('EditSavingsGoal', { goalId })}
            variant="outline"
            size="md"
            style={styles.actionBtn}
          />
          {goal.status === 'active' ? (
            <Button
              title="Complete"
              onPress={handleComplete}
              variant="secondary"
              size="md"
              loading={actionLoading}
              style={styles.actionBtn}
            />
          ) : null}
          {goal.status !== 'archived' ? (
            <Button
              title="Archive"
              onPress={handleArchive}
              variant="ghost"
              size="md"
              loading={actionLoading}
              style={styles.actionBtn}
            />
          ) : null}
          <Button
            title="Delete"
            onPress={() => setDeleteGoalConfirm(true)}
            variant="danger"
            size="md"
            style={styles.actionBtn}
          />
        </View>
      </StickyActionBar>

      <ConfirmDialog
        visible={deleteGoalConfirm}
        title="Delete Goal?"
        message="This will permanently delete the goal and all its contributions. This cannot be undone."
        confirmLabel="Delete"
        cancelLabel="Cancel"
        destructive
        onConfirm={handleDeleteGoal}
        onCancel={() => setDeleteGoalConfirm(false)}
      />
      <ConfirmDialog
        visible={deleteContribId !== null}
        title="Delete Contribution?"
        message="This will remove this contribution and decrease your saved amount."
        confirmLabel="Delete"
        cancelLabel="Cancel"
        destructive
        onConfirm={handleDeleteContrib}
        onCancel={() => setDeleteContribId(null)}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: Colors.background },
  centered: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: Spacing.xl },
  errorText: { ...Typography.body, color: Colors.error, marginBottom: Spacing.md },
  headerCard: { margin: Spacing.md, padding: Spacing.md },
  headerRow: { flexDirection: 'row', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: Spacing.xs },
  goalName: { ...Typography.h2, color: Colors.text, flex: 1, marginRight: Spacing.sm },
  strategyLabel: { ...Typography.caption, color: Colors.textMuted, marginBottom: Spacing.md },
  progressSection: { marginBottom: Spacing.sm },
  progressNumbers: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-end', marginBottom: Spacing.sm },
  savedValue: { ...Typography.h3, color: Colors.primary },
  savedLabel: { ...Typography.caption, color: Colors.textMuted },
  progressCenter: { alignItems: 'center' },
  progressPct: { ...Typography.number, color: Colors.text },
  alignRight: { alignItems: 'flex-end' },
  targetValue: { ...Typography.body, color: Colors.textSecondary, fontWeight: '600' },
  targetLabel: { ...Typography.caption, color: Colors.textMuted },
  progressBar: { marginBottom: Spacing.sm },
  remainingText: { ...Typography.caption, color: Colors.textMuted, textAlign: 'center' },
  metaRow: { flexDirection: 'row', justifyContent: 'space-between', marginTop: Spacing.xs },
  metaText: { ...Typography.caption, color: Colors.textMuted },
  card: { margin: Spacing.md, marginTop: 0, padding: Spacing.md },
  cardTitle: { ...Typography.h4, color: Colors.text, marginBottom: Spacing.sm },
  calcGrid: { flexDirection: 'row', justifyContent: 'space-around', marginBottom: Spacing.sm },
  calcItem: { alignItems: 'center' },
  calcValue: { ...Typography.h4, color: Colors.primary },
  calcLabel: { ...Typography.caption, color: Colors.textMuted },
  onTrackRow: { flexDirection: 'row', alignItems: 'center', gap: Spacing.sm, marginTop: Spacing.xs },
  estDate: { ...Typography.caption, color: Colors.textMuted, flex: 1 },
  strategyDesc: { ...Typography.body, color: Colors.textSecondary, marginBottom: Spacing.xs, lineHeight: 22 },
  strategyNote: { ...Typography.caption, color: Colors.textMuted, fontStyle: 'italic' },
  weekRow: { flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 4, borderBottomWidth: 1, borderBottomColor: Colors.divider },
  weekNum: { ...Typography.caption, color: Colors.textSecondary, width: 60 },
  weekAmount: { ...Typography.caption, color: Colors.primary, fontWeight: '600' },
  weekCumulative: { ...Typography.caption, color: Colors.textMuted },
  contribHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: Spacing.sm },
  emptyText: { ...Typography.caption, color: Colors.textMuted, fontStyle: 'italic', textAlign: 'center', paddingVertical: Spacing.md },
  contribRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingVertical: Spacing.xs, borderBottomWidth: 1, borderBottomColor: Colors.divider },
  contribInfo: { flex: 1, marginRight: Spacing.sm },
  contribAmount: { ...Typography.body, color: Colors.primary, fontWeight: '600' },
  contribDate: { ...Typography.caption, color: Colors.textMuted },
  contribNote: { ...Typography.caption, color: Colors.textMuted, fontStyle: 'italic' },
  notesText: { ...Typography.body, color: Colors.textSecondary, lineHeight: 22 },
  disclaimer: { marginHorizontal: Spacing.md, marginBottom: Spacing.lg },
  actionRow: { flexDirection: 'row', gap: Spacing.sm },
  actionBtn: { flex: 1 },
});
