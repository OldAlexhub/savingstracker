import React, { useState, useEffect } from 'react';
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
import { Colors, Spacing, Typography, BorderRadius } from '../../theme';
import { parseNumberSafe, formatDebtType } from '../../utils/formatters';
import Card from '../../components/common/Card';
import Button from '../../components/common/Button';
import AppTextInput from '../../components/common/TextInput';
import KeyboardSafeScreen from '../../components/layout/KeyboardSafeScreen';
import StickyActionBar from '../../components/layout/StickyActionBar';
import type { DebtType, RootStackParamList } from '../../types/index';

type Nav = NativeStackNavigationProp<RootStackParamList>;
type Route = RouteProp<RootStackParamList, 'EditDebt'>;

const DEBT_TYPES: DebtType[] = [
  'credit_card', 'student_loan', 'auto_loan', 'mortgage', 'personal_loan', 'medical', 'other',
];

interface FormErrors {
  name?: string;
  originalBalance?: string;
  currentBalance?: string;
  apr?: string;
  minimumPayment?: string;
  dueDayOfMonth?: string;
  notes?: string;
}

export default function EditDebtScreen(): React.JSX.Element {
  const navigation = useNavigation<Nav>();
  const route = useRoute<Route>();
  const { debtId } = route.params;
  const { data, updateDebtAccount } = useApp();

  const debt = data.debtAccounts.find(d => d.id === debtId);
  const paymentCount = data.debtPayments.filter(p => p.debtId === debtId).length;

  const [name, setName] = useState(debt?.name ?? '');
  const [debtType, setDebtType] = useState<DebtType>(debt?.debtType ?? 'credit_card');
  const [originalBalance, setOriginalBalance] = useState(debt?.originalBalance.toString() ?? '');
  const [currentBalance, setCurrentBalance] = useState(debt?.currentBalance.toString() ?? '');
  const [apr, setApr] = useState(debt?.apr?.toString() ?? '');
  const [minimumPayment, setMinimumPayment] = useState(debt?.minimumPayment?.toString() ?? '');
  const [dueDayOfMonth, setDueDayOfMonth] = useState(debt?.dueDayOfMonth?.toString() ?? '');
  const [notes, setNotes] = useState(debt?.notes ?? '');
  const [errors, setErrors] = useState<FormErrors>({});
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!debt) {
      Alert.alert('Error', 'Debt not found.', [{ text: 'OK', onPress: () => navigation.goBack() }]);
    }
  }, [debt, navigation]);

  if (!debt) return <View style={{ flex: 1, backgroundColor: Colors.background }} />;

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
      await updateDebtAccount(debtId, {
        name: name.trim(),
        debtType,
        originalBalance: parseNumberSafe(originalBalance),
        currentBalance: parseNumberSafe(currentBalance),
        apr: apr.trim() ? parseNumberSafe(apr) : null,
        minimumPayment: minimumPayment.trim() ? parseNumberSafe(minimumPayment) : null,
        dueDayOfMonth: dueDayOfMonth.trim() ? parseInt(dueDayOfMonth, 10) : null,
        notes: notes.trim(),
      });
      Alert.alert('Updated!', 'Your debt account has been updated.');
      navigation.goBack();
    } catch {
      Alert.alert('Error', 'Failed to update debt. Please try again.');
    } finally {
      setSaving(false);
    }
  }

  return (
    <KeyboardSafeScreen>
      <View style={styles.container}>
        <View style={styles.infoCard}>
          <Text style={styles.infoText}>
            {paymentCount} payment{paymentCount !== 1 ? 's' : ''} logged
          </Text>
        </View>

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
              return (
                <TouchableOpacity
                  key={type}
                  style={[styles.pickerRow, isSelected && styles.pickerRowSelected, index < DEBT_TYPES.length - 1 && styles.pickerRowBorder]}
                  onPress={() => setDebtType(type)}
                  activeOpacity={0.75}
                >
                  <View style={[styles.radioCircle, isSelected && styles.radioCircleSelected]}>
                    {isSelected ? <View style={styles.radioDot} /> : null}
                  </View>
                  <Text style={[styles.pickerLabel, isSelected && styles.pickerLabelSelected]}>{formatDebtType(type)}</Text>
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
            placeholder="0.00" keyboardType="decimal-pad" prefix="$"
            error={errors.originalBalance}
          />
          <AppTextInput
            label="Current Balance *"
            value={currentBalance}
            onChangeText={v => { setCurrentBalance(v); setErrors(p => ({ ...p, currentBalance: undefined })); }}
            placeholder="0.00" keyboardType="decimal-pad" prefix="$"
            error={errors.currentBalance}
          />
          <AppTextInput
            label="APR (%)"
            value={apr}
            onChangeText={v => { setApr(v); setErrors(p => ({ ...p, apr: undefined })); }}
            placeholder="0.00" keyboardType="decimal-pad" suffix="%"
            error={errors.apr}
          />
          <AppTextInput
            label="Minimum Payment (per month)"
            value={minimumPayment}
            onChangeText={v => { setMinimumPayment(v); setErrors(p => ({ ...p, minimumPayment: undefined })); }}
            placeholder="0.00" keyboardType="decimal-pad" prefix="$"
            error={errors.minimumPayment}
          />
          <AppTextInput
            label="Due Day of Month"
            value={dueDayOfMonth}
            onChangeText={v => { setDueDayOfMonth(v); setErrors(p => ({ ...p, dueDayOfMonth: undefined })); }}
            placeholder="e.g. 15" keyboardType="numeric"
            error={errors.dueDayOfMonth}
          />
        </View>

        <View style={styles.section}>
          <AppTextInput
            label="Notes"
            value={notes}
            onChangeText={setNotes}
            placeholder="Optional notes..."
            multiline numberOfLines={3} maxLength={500}
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
  infoCard: { backgroundColor: Colors.primaryFade, borderRadius: BorderRadius.md, padding: Spacing.sm, marginBottom: Spacing.md },
  infoText: { ...Typography.caption, color: Colors.primary, fontWeight: '500' },
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
});
