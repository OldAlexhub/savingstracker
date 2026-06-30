import React, { useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Alert,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useApp } from '../../context/AppContext';
import { Colors, Spacing, Typography, BorderRadius } from '../../theme';
import { parseNumberSafe, formatDebtType } from '../../utils/formatters';
import Card from '../../components/common/Card';
import Button from '../../components/common/Button';
import AppTextInput from '../../components/common/TextInput';
import KeyboardSafeScreen from '../../components/layout/KeyboardSafeScreen';
import StickyActionBar from '../../components/layout/StickyActionBar';
import type { DebtType, RootStackParamList } from '../../types/index';

type Nav = NativeStackNavigationProp<RootStackParamList>;

const DEBT_TYPES: DebtType[] = [
  'credit_card', 'student_loan', 'auto_loan', 'mortgage', 'personal_loan', 'medical', 'other',
];

interface FormErrors {
  name?: string;
  debtType?: string;
  originalBalance?: string;
  currentBalance?: string;
  apr?: string;
  minimumPayment?: string;
  dueDayOfMonth?: string;
  notes?: string;
}

function isMissingFinancialInfo(apr: string, minPayment: string): boolean {
  return !apr.trim() || !minPayment.trim();
}

export default function AddDebtScreen(): React.JSX.Element {
  const navigation = useNavigation<Nav>();
  const { addDebtAccount } = useApp();

  const [name, setName] = useState('');
  const [debtType, setDebtType] = useState<DebtType>('credit_card');
  const [originalBalance, setOriginalBalance] = useState('');
  const [currentBalance, setCurrentBalance] = useState('');
  const [apr, setApr] = useState('');
  const [minimumPayment, setMinimumPayment] = useState('');
  const [dueDayOfMonth, setDueDayOfMonth] = useState('');
  const [notes, setNotes] = useState('');
  const [errors, setErrors] = useState<FormErrors>({});
  const [saving, setSaving] = useState(false);

  function validate(): boolean {
    const errs: FormErrors = {};
    if (!name.trim()) errs.name = 'Debt name is required.';
    else if (name.trim().length > 100) errs.name = 'Debt name must be 100 characters or less.';

    const parsedOrig = parseNumberSafe(originalBalance);
    if (!originalBalance.trim() || parsedOrig <= 0) errs.originalBalance = 'Original balance must be greater than 0.';

    const parsedCurrent = parseNumberSafe(currentBalance);
    if (!currentBalance.trim() || parsedCurrent < 0) errs.currentBalance = 'Current balance cannot be negative.';
    else if (parsedCurrent > parsedOrig) errs.currentBalance = 'Current balance cannot exceed original balance.';

    if (apr.trim()) {
      const parsedApr = parseNumberSafe(apr);
      if (parsedApr < 0 || parsedApr > 99.99) errs.apr = 'APR must be between 0 and 99.99%.';
    }

    if (minimumPayment.trim()) {
      const parsedMin = parseNumberSafe(minimumPayment);
      if (parsedMin < 0) errs.minimumPayment = 'Minimum payment cannot be negative.';
    }

    if (dueDayOfMonth.trim()) {
      const day = parseInt(dueDayOfMonth, 10);
      if (isNaN(day) || day < 1 || day > 31) errs.dueDayOfMonth = 'Due day must be between 1 and 31.';
    }

    if (notes.length > 500) errs.notes = 'Notes must be 500 characters or fewer.';

    setErrors(errs);
    return Object.keys(errs).length === 0;
  }

  async function handleSave(): Promise<void> {
    if (!validate()) return;
    setSaving(true);
    try {
      await addDebtAccount({
        name: name.trim(),
        debtType,
        originalBalance: parseNumberSafe(originalBalance),
        currentBalance: parseNumberSafe(currentBalance),
        apr: apr.trim() ? parseNumberSafe(apr) : null,
        minimumPayment: minimumPayment.trim() ? parseNumberSafe(minimumPayment) : null,
        dueDayOfMonth: dueDayOfMonth.trim() ? parseInt(dueDayOfMonth, 10) : null,
        notes: notes.trim(),
        status: 'active',
      });
      Alert.alert('Debt Added!', 'Your debt account has been created.');
      navigation.goBack();
    } catch {
      Alert.alert('Error', 'Failed to add debt account. Please try again.');
    } finally {
      setSaving(false);
    }
  }

  const showMissingWarning = originalBalance.trim() && currentBalance.trim() && isMissingFinancialInfo(apr, minimumPayment);

  return (
    <KeyboardSafeScreen>
      <View style={styles.container}>
        <View style={styles.section}>
          <AppTextInput
            label="Debt Name *"
            value={name}
            onChangeText={v => { setName(v); setErrors(p => ({ ...p, name: undefined })); }}
            placeholder="e.g. Chase Visa Card"
            maxLength={100}
            error={errors.name}
          />
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionLabel}>DEBT TYPE</Text>
          <Card style={styles.pickerCard}>
            {DEBT_TYPES.map((type, index) => {
              const isSelected = debtType === type;
              const isLast = index === DEBT_TYPES.length - 1;
              return (
                <TouchableOpacity
                  key={type}
                  style={[styles.pickerRow, isSelected && styles.pickerRowSelected, !isLast && styles.pickerRowBorder]}
                  onPress={() => setDebtType(type)}
                  activeOpacity={0.75}
                >
                  <View style={[styles.radioCircle, isSelected && styles.radioCircleSelected]}>
                    {isSelected ? <View style={styles.radioDot} /> : null}
                  </View>
                  <Text style={[styles.pickerLabel, isSelected && styles.pickerLabelSelected]}>
                    {formatDebtType(type)}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </Card>
        </View>

        <View style={styles.section}>
          <AppTextInput
            label="Original Balance *"
            value={originalBalance}
            onChangeText={v => { setOriginalBalance(v); setErrors(p => ({ ...p, originalBalance: undefined })); }}
            placeholder="0.00"
            keyboardType="decimal-pad"
            prefix="$"
            error={errors.originalBalance}
            helperText="Total balance when you started tracking"
          />
          <AppTextInput
            label="Current Balance *"
            value={currentBalance}
            onChangeText={v => { setCurrentBalance(v); setErrors(p => ({ ...p, currentBalance: undefined })); }}
            placeholder="0.00"
            keyboardType="decimal-pad"
            prefix="$"
            error={errors.currentBalance}
            helperText="Your remaining balance today"
          />
          <AppTextInput
            label="APR (%)"
            value={apr}
            onChangeText={v => { setApr(v); setErrors(p => ({ ...p, apr: undefined })); }}
            placeholder="0.00"
            keyboardType="decimal-pad"
            suffix="%"
            error={errors.apr}
            helperText="Annual interest rate (optional but needed for payoff estimates)"
          />
          <AppTextInput
            label="Minimum Payment (per month)"
            value={minimumPayment}
            onChangeText={v => { setMinimumPayment(v); setErrors(p => ({ ...p, minimumPayment: undefined })); }}
            placeholder="0.00"
            keyboardType="decimal-pad"
            prefix="$"
            error={errors.minimumPayment}
            helperText="Optional but needed for payoff estimates"
          />
          <AppTextInput
            label="Due Day of Month"
            value={dueDayOfMonth}
            onChangeText={v => { setDueDayOfMonth(v); setErrors(p => ({ ...p, dueDayOfMonth: undefined })); }}
            placeholder="e.g. 15"
            keyboardType="numeric"
            error={errors.dueDayOfMonth}
            helperText="Day of month payment is due (1-31, optional)"
          />
        </View>

        {showMissingWarning ? (
          <View style={styles.warningBox}>
            <Text style={styles.warningText}>
              ⚠ Without APR and minimum payment, payoff estimates cannot be calculated.
              You can add them later by editing this debt.
            </Text>
          </View>
        ) : null}

        <View style={styles.section}>
          <AppTextInput
            label="Notes"
            value={notes}
            onChangeText={setNotes}
            placeholder="Optional notes..."
            multiline
            numberOfLines={3}
            maxLength={500}
          />
        </View>
      </View>

      <StickyActionBar>
        <Button
          title={saving ? 'Saving...' : 'Add Debt'}
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
  section: { marginBottom: Spacing.lg },
  sectionLabel: { ...Typography.label, color: Colors.textSecondary, marginBottom: Spacing.sm, textTransform: 'uppercase' },
  pickerCard: { overflow: 'hidden', padding: 0 },
  pickerRow: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: Spacing.md, paddingVertical: Spacing.sm + 2, backgroundColor: Colors.surface },
  pickerRowSelected: { backgroundColor: Colors.primaryFade },
  pickerRowBorder: { borderBottomWidth: 1, borderBottomColor: Colors.border },
  radioCircle: { width: 20, height: 20, borderRadius: 10, borderWidth: 2, borderColor: Colors.border, alignItems: 'center', justifyContent: 'center', marginRight: Spacing.sm },
  radioCircleSelected: { borderColor: Colors.primary },
  radioDot: { width: 10, height: 10, borderRadius: 5, backgroundColor: Colors.primary },
  pickerLabel: { ...Typography.body, color: Colors.text },
  pickerLabelSelected: { color: Colors.primary, fontWeight: '600' },
  warningBox: { backgroundColor: Colors.warningLight, borderRadius: BorderRadius.md, padding: Spacing.sm, marginBottom: Spacing.md, borderLeftWidth: 3, borderLeftColor: Colors.warning },
  warningText: { ...Typography.caption, color: Colors.warning, lineHeight: 18 },
});
