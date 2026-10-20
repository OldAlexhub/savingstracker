import React, { useState, useMemo } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Alert,
} from 'react-native';
import { useNavigation, useRoute, RouteProp } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useApp } from '../../context/AppContext';
import {useUnsavedChanges} from '../../hooks/useUnsavedChanges';
import {useCompletionInterstitial} from '../../hooks/useCompletionInterstitial';
import { Colors, Spacing, Typography, BorderRadius } from '../../theme';
import { formatCurrency, parseNumberSafe } from '../../utils/formatters';
import { calculateSavingsProgress } from '../../utils/calculations';
import Card from '../../components/common/Card';
import Button from '../../components/common/Button';
import AppTextInput from '../../components/common/TextInput';
import DateField from '../../components/common/DateField';
import KeyboardSafeScreen from '../../components/layout/KeyboardSafeScreen';
import StickyActionBar from '../../components/layout/StickyActionBar';
import type { RootStackParamList } from '../../types/index';

type Nav = NativeStackNavigationProp<RootStackParamList>;
type Route = RouteProp<RootStackParamList, 'LogContribution'>;

interface FormErrors {
  goal?: string;
  amount?: string;
  date?: string;
  notes?: string;
}

function todayISO(): string {
  return new Date().toISOString().split('T')[0];
}

function isValidDate(v: string): boolean {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(v)) return false;
  const d = new Date(v + 'T00:00:00');
  return !isNaN(d.getTime());
}

export default function LogContributionScreen(): React.JSX.Element {
  const navigation = useNavigation<Nav>();
  const route = useRoute<Route>();
  const preselectedGoalId = route.params?.goalId;
  const { data, addContribution } = useApp();
  const {showIfEligible} = useCompletionInterstitial();

  const activeGoals = useMemo(
    () => data.savingsGoals.filter(g => g.status === 'active'),
    [data.savingsGoals],
  );

  const [selectedGoalId, setSelectedGoalId] = useState<string | null>(preselectedGoalId ?? (activeGoals.length === 1 ? activeGoals[0].id : null));
  const [amount, setAmount] = useState('');
  const [date, setDate] = useState(todayISO());
  const [notes, setNotes] = useState('');
  const [errors, setErrors] = useState<FormErrors>({});
  const [saving, setSaving] = useState(false);
  useUnsavedChanges(!saving && Boolean(amount || notes || date !== todayISO()));

  const currency = data.preferences.currency;
  const selectedGoal = activeGoals.find(g => g.id === selectedGoalId);
  const calc = selectedGoal ? calculateSavingsProgress(selectedGoal) : null;
  const parsedAmount = parseNumberSafe(amount);
  const newTotalIfApplied = selectedGoal ? selectedGoal.savedAmount + parsedAmount : 0;

  function validate(): boolean {
    const errs: FormErrors = {};
    if (!selectedGoalId) errs.goal = 'Please select a goal.';
    if (!amount.trim() || parsedAmount <= 0) errs.amount = 'Amount must be greater than 0.';
    if (!date.trim()) errs.date = 'Date is required.';
    else if (!isValidDate(date)) errs.date = 'Date must be in YYYY-MM-DD format.';
    if (notes.length > 500) errs.notes = 'Notes must be 500 characters or fewer.';
    setErrors(errs);
    return Object.keys(errs).length === 0;
  }

  async function handleSave(): Promise<void> {
    if (!validate() || !selectedGoalId) return;
    setSaving(true);
    try {
      await addContribution({
        goalId: selectedGoalId,
        amount: parsedAmount,
        date: date.trim(),
        notes: notes.trim(),
      });
      Alert.alert(
        'Contribution Logged!',
        `${formatCurrency(parsedAmount, currency)} added to ${selectedGoal?.name ?? 'goal'}.`,
        [{text: 'Done', onPress: () => { showIfEligible(); navigation.goBack(); }}],
      );
    } catch {
      Alert.alert('Error', 'Failed to log contribution. Please try again.');
    } finally {
      setSaving(false);
    }
  }

  return (
    <KeyboardSafeScreen>
      <View style={styles.container}>
        {/* Goal Selector */}
        <View style={styles.section}>
          <Text style={styles.sectionLabel}>SELECT GOAL *</Text>
          {errors.goal ? <Text style={styles.errorText}>{errors.goal}</Text> : null}
          {activeGoals.length === 0 ? (
            <Card style={styles.noGoalsCard}>
              <Text style={styles.noGoalsText}>No active savings goals. Create a goal first.</Text>
            </Card>
          ) : (
            <Card style={styles.pickerCard}>
              {activeGoals.map((goal, index) => {
                const isSelected = selectedGoalId === goal.id;
                const isLast = index === activeGoals.length - 1;
                const goalCalc = calculateSavingsProgress(goal);
                return (
                  <TouchableOpacity
                    key={goal.id}
                    style={[
                      styles.goalRow,
                      isSelected && styles.goalRowSelected,
                      !isLast && styles.goalRowBorder,
                    ]}
                    onPress={() => { setSelectedGoalId(goal.id); setErrors(p => ({ ...p, goal: undefined })); }}
                    activeOpacity={0.75}
                  >
                    <View style={[styles.radioCircle, isSelected && styles.radioCircleSelected]}>
                      {isSelected ? <View style={styles.radioDot} /> : null}
                    </View>
                    <View style={styles.goalInfo}>
                      <Text style={[styles.goalName, isSelected && styles.goalNameSelected]}>{goal.name}</Text>
                      <Text style={styles.goalSub}>
                        {formatCurrency(goal.savedAmount, currency)} / {formatCurrency(goal.targetAmount, currency)} ({goalCalc.progressPercent.toFixed(0)}%)
                      </Text>
                    </View>
                  </TouchableOpacity>
                );
              })}
            </Card>
          )}
        </View>

        {/* Amount */}
        <View style={styles.section}>
          <AppTextInput
            label="Contribution Amount *"
            value={amount}
            onChangeText={v => { setAmount(v); setErrors(p => ({ ...p, amount: undefined })); }}
            placeholder="0.00"
            keyboardType="decimal-pad"
            prefix="$"
            error={errors.amount}
          />

          {/* Live preview */}
          {selectedGoal && parsedAmount > 0 ? (
            <View style={styles.previewCard}>
              <Text style={styles.previewText}>
                After this contribution: {formatCurrency(newTotalIfApplied, currency)} saved
                {selectedGoal.targetAmount > 0 ? ` (${Math.min(100, (newTotalIfApplied / selectedGoal.targetAmount) * 100).toFixed(1)}% of goal)` : ''}
              </Text>
              {calc && calc.remainingAmount > 0 ? (
                <Text style={styles.previewRemaining}>
                  Still needed: {formatCurrency(Math.max(0, calc.remainingAmount - parsedAmount), currency)}
                </Text>
              ) : null}
            </View>
          ) : null}
        </View>

        {/* Date */}
        <View style={styles.section}>
          <DateField
            label="Date"
            value={date}
            onChange={v => { setDate(v); setErrors(p => ({ ...p, date: undefined })); }}
            error={errors.date}
            helperText="Contribution date"
            maximumDate={new Date()}
          />
        </View>

        {/* Notes */}
        <View style={styles.section}>
          <AppTextInput
            label="Notes"
            value={notes}
            onChangeText={v => { setNotes(v); setErrors(p => ({ ...p, notes: undefined })); }}
            placeholder="Optional note..."
            multiline
            numberOfLines={3}
            maxLength={500}
            error={errors.notes}
            helperText="Uploaded unchanged. Do not include personal or account information."
          />
        </View>
      </View>

      <StickyActionBar>
        <Button
          title={saving ? 'Saving...' : 'Log Contribution'}
          onPress={handleSave}
          disabled={saving || activeGoals.length === 0}
          loading={saving}
          size="lg"
        />
      </StickyActionBar>
    </KeyboardSafeScreen>
  );
}

const styles = StyleSheet.create({
  container: { paddingHorizontal: Spacing.md, paddingTop: Spacing.md },
  section: { marginBottom: Spacing.lg },
  sectionLabel: { ...Typography.label, color: Colors.textSecondary, marginBottom: Spacing.xs, textTransform: 'uppercase' },
  errorText: { ...Typography.caption, color: Colors.error, marginBottom: Spacing.xs },
  noGoalsCard: { padding: Spacing.md, alignItems: 'center' },
  noGoalsText: { ...Typography.body, color: Colors.textMuted, textAlign: 'center' },
  pickerCard: { overflow: 'hidden', padding: 0 },
  goalRow: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: Spacing.md, paddingVertical: Spacing.sm + 2, backgroundColor: Colors.surface },
  goalRowSelected: { backgroundColor: Colors.primaryFade },
  goalRowBorder: { borderBottomWidth: 1, borderBottomColor: Colors.border },
  radioCircle: { width: 20, height: 20, borderRadius: 10, borderWidth: 2, borderColor: Colors.border, alignItems: 'center', justifyContent: 'center', marginRight: Spacing.sm, flexShrink: 0 },
  radioCircleSelected: { borderColor: Colors.primary },
  radioDot: { width: 10, height: 10, borderRadius: 5, backgroundColor: Colors.primary },
  goalInfo: { flex: 1 },
  goalName: { ...Typography.body, color: Colors.text },
  goalNameSelected: { color: Colors.primary, fontWeight: '600' },
  goalSub: { ...Typography.caption, color: Colors.textMuted },
  previewCard: { backgroundColor: Colors.primaryFade, borderRadius: BorderRadius.md, padding: Spacing.sm, marginTop: Spacing.xs },
  previewText: { ...Typography.body, color: Colors.primary, fontWeight: '500' },
  previewRemaining: { ...Typography.caption, color: Colors.textSecondary, marginTop: 2 },
});
