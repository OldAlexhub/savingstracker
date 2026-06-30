import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Alert,
  Switch,
} from 'react-native';
import { useNavigation, useRoute, RouteProp } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useApp } from '../../context/AppContext';
import { Colors, Spacing, Typography, BorderRadius } from '../../theme';
import { parseNumberSafe } from '../../utils/formatters';
import { SAVINGS_STRATEGIES } from '../../data/strategies';
import Card from '../../components/common/Card';
import Button from '../../components/common/Button';
import AppTextInput from '../../components/common/TextInput';
import KeyboardSafeScreen from '../../components/layout/KeyboardSafeScreen';
import StickyActionBar from '../../components/layout/StickyActionBar';
import type {
  SavingsReminderFrequency,
  SavingsStrategyId,
  RootStackParamList,
} from '../../types/index';

type Nav = NativeStackNavigationProp<RootStackParamList>;
type Route = RouteProp<RootStackParamList, 'EditSavingsGoal'>;

interface FormErrors {
  name?: string;
  targetAmount?: string;
  startingAmount?: string;
  savedAmount?: string;
  targetDate?: string;
  strategy?: string;
  reminderTime?: string;
}

const REMINDER_FREQUENCIES: Array<{ label: string; value: SavingsReminderFrequency }> = [
  { label: 'Daily', value: 'daily' },
  { label: 'Weekly', value: 'weekly' },
  { label: 'Monthly', value: 'monthly' },
];

function isValidDateFormat(value: string): boolean {
  return /^\d{4}-\d{2}-\d{2}$/.test(value);
}

function isFutureDate(value: string): boolean {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const d = new Date(value + 'T00:00:00');
  return !isNaN(d.getTime()) && d > today;
}

function isValidReminderTime(value: string): boolean {
  return /^([01]\d|2[0-3]):[0-5]\d$/.test(value);
}

export default function EditSavingsGoalScreen(): React.JSX.Element {
  const navigation = useNavigation<Nav>();
  const route = useRoute<Route>();
  const { goalId } = route.params;
  const { data, updateSavingsGoal } = useApp();

  const goal = data.savingsGoals.find(g => g.id === goalId);
  const goalContributions = data.contributions.filter(c => c.goalId === goalId);
  const contributionTotal = goalContributions.reduce((s, c) => s + c.amount, 0);

  const [name, setName] = useState(goal?.name ?? '');
  const [targetAmount, setTargetAmount] = useState(goal?.targetAmount.toString() ?? '');
  const [startingAmount, setStartingAmount] = useState(goal?.startingAmount.toString() ?? '');
  const [savedAmount, setSavedAmount] = useState(goal?.savedAmount.toString() ?? '');
  const [targetDate, setTargetDate] = useState(goal?.targetDate ?? '');
  const [selectedStrategy, setSelectedStrategy] = useState<SavingsStrategyId | null>(goal?.strategyId ?? null);
  const [reminderEnabled, setReminderEnabled] = useState(goal?.reminderEnabled ?? false);
  const [reminderFrequency, setReminderFrequency] = useState<SavingsReminderFrequency>(
    goal?.reminderFrequency ?? 'weekly',
  );
  const [reminderTime, setReminderTime] = useState(goal?.reminderTime ?? '09:00');
  const [notes, setNotes] = useState(goal?.notes ?? '');
  const [errors, setErrors] = useState<FormErrors>({});
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!goal) {
      Alert.alert('Error', 'Goal not found.', [{ text: 'OK', onPress: () => navigation.goBack() }]);
    }
  }, [goal, navigation]);

  if (!goal) return <View style={{ flex: 1, backgroundColor: Colors.background }} />;

  const activeGoal = goal;

  function validate(): boolean {
    const newErrors: FormErrors = {};
    const trimmedName = name.trim();
    if (!trimmedName) newErrors.name = 'Goal name is required.';
    else if (trimmedName.length > 100) newErrors.name = 'Goal name must be 100 characters or less.';

    const parsedTarget = parseNumberSafe(targetAmount);
    if (!targetAmount.trim() || parsedTarget <= 0) newErrors.targetAmount = 'Target amount must be greater than 0.';

    const parsedStarting = parseNumberSafe(startingAmount);
    if (startingAmount.trim() && parsedStarting < 0) newErrors.startingAmount = 'Starting amount cannot be negative.';

    const parsedSaved = parseNumberSafe(savedAmount);
    if (savedAmount.trim() && parsedSaved < 0) newErrors.savedAmount = 'Saved amount cannot be negative.';
    else if (savedAmount.trim() && parsedSaved < contributionTotal) {
      newErrors.savedAmount = `Saved amount cannot be less than logged contributions (${contributionTotal.toFixed(2)}).`;
    } else if (savedAmount.trim() && parsedSaved > parsedTarget) {
      newErrors.savedAmount = 'Saved amount cannot exceed target amount.';
    }

    if (!targetDate.trim()) newErrors.targetDate = 'Target date is required.';
    else if (!isValidDateFormat(targetDate)) newErrors.targetDate = 'Date must be in YYYY-MM-DD format.';
    else if (!isFutureDate(targetDate)) newErrors.targetDate = 'Target date must be in the future.';

    if (!selectedStrategy) newErrors.strategy = 'Please select a savings strategy.';

    if (reminderEnabled && !isValidReminderTime(reminderTime.trim())) {
      newErrors.reminderTime = 'Reminder time must use 24-hour HH:MM format.';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  }

  async function handleSave(): Promise<void> {
    if (!validate()) return;
    setSaving(true);
    try {
      const parsedTarget = parseNumberSafe(targetAmount);
      const parsedStarting = startingAmount.trim() ? parseNumberSafe(startingAmount) : 0;
      const parsedSaved = savedAmount.trim() ? parseNumberSafe(savedAmount) : activeGoal.savedAmount;
      await updateSavingsGoal(goalId, {
        name: name.trim(),
        targetAmount: parsedTarget,
        startingAmount: parsedStarting,
        savedAmount: parsedSaved,
        targetDate: targetDate.trim(),
        strategyId: selectedStrategy as SavingsStrategyId,
        reminderEnabled,
        reminderFrequency: reminderEnabled ? reminderFrequency : undefined,
        reminderTime: reminderEnabled ? reminderTime.trim() : undefined,
        notes: notes.trim(),
      });
      Alert.alert('Updated!', 'Your savings goal has been updated.');
      navigation.goBack();
    } catch {
      Alert.alert('Error', 'Failed to update savings goal. Please try again.');
    } finally {
      setSaving(false);
    }
  }

  const selectedStrategyDef = SAVINGS_STRATEGIES.find(s => s.id === selectedStrategy);

  return (
    <KeyboardSafeScreen>
      <View style={styles.container}>
        {/* Info Card */}
        <View style={styles.infoCard}>
          <Text style={styles.infoText}>
            {goalContributions.length} contribution{goalContributions.length !== 1 ? 's' : ''} logged
            {' · '}Total contributed: ${contributionTotal.toFixed(2)}
          </Text>
        </View>

        <View style={styles.section}>
          <View style={styles.reminderHeader}>
            <View style={styles.reminderHeaderText}>
              <Text style={styles.sectionLabel}>Savings Reminder</Text>
              <Text style={styles.reminderHelper}>
                Optional local notification for this goal.
              </Text>
            </View>
            <Switch
              value={reminderEnabled}
              onValueChange={setReminderEnabled}
              trackColor={{ false: Colors.border, true: Colors.primaryFade }}
              thumbColor={reminderEnabled ? Colors.primary : Colors.surface}
              ios_backgroundColor={Colors.border}
            />
          </View>

          {reminderEnabled ? (
            <View>
              <View style={styles.frequencyRow}>
                {REMINDER_FREQUENCIES.map(option => {
                  const selected = reminderFrequency === option.value;
                  return (
                    <TouchableOpacity
                      key={option.value}
                      style={[
                        styles.frequencyPill,
                        selected && styles.frequencyPillSelected,
                      ]}
                      onPress={() => setReminderFrequency(option.value)}
                      activeOpacity={0.75}
                    >
                      <Text
                        style={[
                          styles.frequencyText,
                          selected && styles.frequencyTextSelected,
                        ]}
                      >
                        {option.label}
                      </Text>
                    </TouchableOpacity>
                  );
                })}
              </View>

              <AppTextInput
                label="Reminder Time"
                value={reminderTime}
                onChangeText={v => {
                  setReminderTime(v);
                  if (errors.reminderTime) {
                    setErrors(prev => ({ ...prev, reminderTime: undefined }));
                  }
                }}
                placeholder="09:00"
                keyboardType="numeric"
                maxLength={5}
                error={errors.reminderTime}
                helperText="Use 24-hour time, e.g. 09:00 or 18:30"
              />
            </View>
          ) : null}
        </View>

        <View style={styles.section}>
          <AppTextInput
            label="Goal Name *"
            value={name}
            onChangeText={v => { setName(v); setErrors(p => ({ ...p, name: undefined })); }}
            placeholder="e.g. Vacation Fund"
            maxLength={100}
            error={errors.name}
          />
          <AppTextInput
            label="Target Amount *"
            value={targetAmount}
            onChangeText={v => { setTargetAmount(v); setErrors(p => ({ ...p, targetAmount: undefined })); }}
            placeholder="0.00"
            keyboardType="decimal-pad"
            prefix="$"
            error={errors.targetAmount}
          />
          <AppTextInput
            label="Starting Amount"
            value={startingAmount}
            onChangeText={v => { setStartingAmount(v); setErrors(p => ({ ...p, startingAmount: undefined })); }}
            placeholder="0.00"
            keyboardType="decimal-pad"
            prefix="$"
            error={errors.startingAmount}
          />
          <AppTextInput
            label="Saved Amount"
            value={savedAmount}
            onChangeText={v => { setSavedAmount(v); setErrors(p => ({ ...p, savedAmount: undefined })); }}
            placeholder="0.00"
            keyboardType="decimal-pad"
            prefix="$"
            error={errors.savedAmount}
            helperText={`Minimum from contributions: $${contributionTotal.toFixed(2)}`}
          />
          <AppTextInput
            label="Target Date *"
            value={targetDate}
            onChangeText={v => { setTargetDate(v); setErrors(p => ({ ...p, targetDate: undefined })); }}
            placeholder="YYYY-MM-DD"
            keyboardType="numeric"
            error={errors.targetDate}
            helperText="Format: YYYY-MM-DD (e.g. 2027-01-15)"
          />
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionLabel}>Savings Strategy *</Text>
          {errors.strategy ? <Text style={styles.errorText}>{errors.strategy}</Text> : null}
          <Card style={styles.strategyCard}>
            {SAVINGS_STRATEGIES.map((strategy, index) => {
              const isSelected = selectedStrategy === strategy.id;
              return (
                <TouchableOpacity
                  key={strategy.id}
                  style={[
                    styles.strategyItem,
                    isSelected && styles.strategyItemSelected,
                    index < SAVINGS_STRATEGIES.length - 1 && styles.strategyItemBorder,
                  ]}
                  onPress={() => { setSelectedStrategy(strategy.id); setErrors(p => ({ ...p, strategy: undefined })); }}
                  activeOpacity={0.75}
                >
                  <View style={styles.strategyItemInner}>
                    <View style={[styles.radioCircle, isSelected && styles.radioCircleSelected]}>
                      {isSelected ? <View style={styles.radioDot} /> : null}
                    </View>
                    <Text style={[styles.strategyName, isSelected && styles.strategyNameSelected]}>
                      {strategy.name}
                    </Text>
                  </View>
                </TouchableOpacity>
              );
            })}
          </Card>
          {selectedStrategyDef ? (
            <View style={styles.strategyDescription}>
              <Text style={styles.strategyDescriptionText}>{selectedStrategyDef.description}</Text>
            </View>
          ) : null}
        </View>

        <View style={styles.section}>
          <AppTextInput
            label="Notes"
            value={notes}
            onChangeText={setNotes}
            placeholder="Optional notes..."
            multiline
            numberOfLines={4}
            maxLength={500}
          />
        </View>
      </View>

      <StickyActionBar>
        <Button
          title={saving ? 'Saving...' : 'Save Changes'}
          onPress={handleSave}
          disabled={saving}
          loading={saving}
          size="lg"
        />
      </StickyActionBar>
    </KeyboardSafeScreen>
  );
}

const styles = StyleSheet.create({
  container: { paddingHorizontal: Spacing.md, paddingTop: Spacing.md },
  infoCard: {
    backgroundColor: Colors.primaryFade,
    borderRadius: BorderRadius.md,
    padding: Spacing.sm,
    marginBottom: Spacing.md,
  },
  infoText: { ...Typography.caption, color: Colors.primary, fontWeight: '500' },
  section: { marginBottom: Spacing.lg },
  sectionLabel: { ...Typography.label, color: Colors.textSecondary, marginBottom: Spacing.sm, textTransform: 'uppercase' },
  errorText: { ...Typography.caption, color: Colors.error, marginBottom: Spacing.xs },
  strategyCard: { overflow: 'hidden', padding: 0 },
  strategyItem: { paddingHorizontal: Spacing.md, paddingVertical: Spacing.sm + 2, backgroundColor: Colors.surface },
  strategyItemSelected: { backgroundColor: Colors.primaryFade },
  strategyItemBorder: { borderBottomWidth: 1, borderBottomColor: Colors.border },
  strategyItemInner: { flexDirection: 'row', alignItems: 'center' },
  radioCircle: { width: 20, height: 20, borderRadius: 10, borderWidth: 2, borderColor: Colors.border, alignItems: 'center', justifyContent: 'center', marginRight: Spacing.sm },
  radioCircleSelected: { borderColor: Colors.primary },
  radioDot: { width: 10, height: 10, borderRadius: 5, backgroundColor: Colors.primary },
  strategyName: { ...Typography.body, color: Colors.text, flex: 1 },
  strategyNameSelected: { color: Colors.primary, fontWeight: '600' },
  strategyDescription: { marginTop: Spacing.sm, backgroundColor: Colors.primaryFade, borderRadius: BorderRadius.md, padding: Spacing.sm, borderLeftWidth: 3, borderLeftColor: Colors.primary },
  strategyDescriptionText: { ...Typography.caption, color: Colors.textSecondary, lineHeight: 18 },
  reminderHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: Spacing.md,
    marginBottom: Spacing.sm,
  },
  reminderHeaderText: { flex: 1 },
  reminderHelper: { ...Typography.caption, color: Colors.textMuted },
  frequencyRow: { flexDirection: 'row', gap: Spacing.sm, marginBottom: Spacing.sm },
  frequencyPill: {
    flex: 1,
    minHeight: 44,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: BorderRadius.md,
    borderWidth: 1,
    borderColor: Colors.border,
    backgroundColor: Colors.surface,
  },
  frequencyPillSelected: { borderColor: Colors.primary, backgroundColor: Colors.primaryFade },
  frequencyText: { ...Typography.caption, color: Colors.textSecondary, fontWeight: '600' },
  frequencyTextSelected: { color: Colors.primary },
});
