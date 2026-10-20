import React, { useState, useMemo } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Alert } from 'react-native';
import { useNavigation, useRoute } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import type { RouteProp } from '@react-navigation/native';
import { useApp } from '../../context/AppContext';
import {useUnsavedChanges} from '../../hooks/useUnsavedChanges';
import {useCompletionInterstitial} from '../../hooks/useCompletionInterstitial';
import { Colors, Spacing, Typography, BorderRadius } from '../../theme';
import { formatCurrency, parseNumberSafe } from '../../utils/formatters';
import Button from '../../components/common/Button';
import AppTextInput from '../../components/common/TextInput';
import DateField from '../../components/common/DateField';
import Card from '../../components/common/Card';
import EmptyState from '../../components/common/EmptyState';
import KeyboardSafeScreen from '../../components/layout/KeyboardSafeScreen';
import StickyActionBar from '../../components/layout/StickyActionBar';

type RootStackParamList = {
  MainTabs: undefined; LogDebtPayment: { debtId?: string };
};

const LogDebtPaymentScreen: React.FC = () => {
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  const route = useRoute<RouteProp<RootStackParamList, 'LogDebtPayment'>>();
  const { data, addDebtPayment } = useApp();
  const {showIfEligible} = useCompletionInterstitial();

  const activeDebts = useMemo(
    () => data.debtAccounts.filter(d => d.status === 'active'),
    [data.debtAccounts],
  );

  const [selectedDebtId, setSelectedDebtId] = useState<string>(route.params?.debtId ?? '');
  const [amount, setAmount] = useState('');
  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
  const [notes, setNotes] = useState('');
  const [isMinimumPayment, setIsMinimumPayment] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [saving, setSaving] = useState(false);
  useUnsavedChanges(!saving && Boolean(
    amount || notes || isMinimumPayment || date !== new Date().toISOString().split('T')[0],
  ));

  const selectedDebt = activeDebts.find(d => d.id === selectedDebtId);
  const currency = data.preferences.currency;

  const amountNum = parseNumberSafe(amount);
  const remainingAfter = selectedDebt
    ? Math.max(0, selectedDebt.currentBalance - amountNum)
    : null;

  const validate = (): boolean => {
    const errs: Record<string, string> = {};
    if (!selectedDebtId) errs.debt = 'Please select a debt';
    if (amountNum <= 0) errs.amount = 'Amount must be greater than 0';
    if (selectedDebt && amountNum > selectedDebt.currentBalance) {
      errs.amount = `Amount exceeds current balance of ${formatCurrency(selectedDebt.currentBalance, currency)}`;
    }
    if (!date) errs.date = 'Date is required';
    else if (!/^\d{4}-\d{2}-\d{2}$/.test(date)) errs.date = 'Date must be YYYY-MM-DD';
    setErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const handleSubmit = async () => {
    if (!validate()) return;
    setSaving(true);
    try {
      await addDebtPayment({
        debtId: selectedDebtId,
        amount: amountNum,
        date,
        notes: notes.trim(),
        isMinimumPayment,
      });
      Alert.alert(
        'Payment Logged',
        'Your debt payment has been recorded.',
        [{text: 'Done', onPress: () => { showIfEligible(); navigation.goBack(); }}],
      );
    } catch {
      Alert.alert('Error', 'Failed to log payment. Please try again.');
    } finally {
      setSaving(false);
    }
  };

  if (activeDebts.length === 0) {
    return (
      <View style={styles.centered}>
        <EmptyState
          icon="💳"
          title="No Active Debts"
          description="Add a debt first before logging a payment."
          actionLabel="Go Back"
          onAction={() => navigation.goBack()}
        />
      </View>
    );
  }

  return (
    <KeyboardSafeScreen>
      <View style={styles.container}>
        <Text style={styles.sectionLabel}>Select Debt *</Text>
        <Card style={styles.debtListCard}>
          {activeDebts.map(debt => (
            <TouchableOpacity
              key={debt.id}
              style={[styles.debtRow, selectedDebtId === debt.id && styles.debtRowSelected]}
              onPress={() => setSelectedDebtId(debt.id)}
              activeOpacity={0.7}
            >
              <View style={styles.debtRowInfo}>
                <Text style={[styles.debtName, selectedDebtId === debt.id && styles.debtNameSelected]}>
                  {debt.name}
                </Text>
                <Text style={styles.debtBalance}>
                  Balance: {formatCurrency(debt.currentBalance, currency)}
                  {debt.minimumPayment !== null
                    ? ` · Min: ${formatCurrency(debt.minimumPayment, currency)}`
                    : ''}
                </Text>
              </View>
              {selectedDebtId === debt.id && <Text style={styles.checkmark}>✓</Text>}
            </TouchableOpacity>
          ))}
        </Card>
        {errors.debt && <Text style={styles.errorText}>{errors.debt}</Text>}

        {selectedDebt && (
          <Card style={styles.debtInfoCard}>
            <Text style={styles.debtInfoText}>
              Current balance: {formatCurrency(selectedDebt.currentBalance, currency)}
            </Text>
            {selectedDebt.minimumPayment !== null && (
              <Text style={styles.debtInfoText}>
                Minimum payment: {formatCurrency(selectedDebt.minimumPayment, currency)}
              </Text>
            )}
          </Card>
        )}

        <AppTextInput
          label="Payment Amount *"
          value={amount}
          onChangeText={setAmount}
          placeholder="0.00"
          keyboardType="decimal-pad"
          error={errors.amount}
          prefix="$"
          helperText={
            remainingAfter !== null
              ? `Balance after payment: ${formatCurrency(remainingAfter, currency)}`
              : undefined
          }
        />

        <TouchableOpacity
          style={styles.checkboxRow}
          onPress={() => setIsMinimumPayment(v => !v)}
          activeOpacity={0.7}
        >
          <View style={[styles.checkbox, isMinimumPayment && styles.checkboxChecked]}>
            {isMinimumPayment && <Text style={styles.checkboxCheck}>✓</Text>}
          </View>
          <Text style={styles.checkboxLabel}>This covers my minimum payment</Text>
        </TouchableOpacity>

        <DateField
          label="Date *"
          value={date}
          onChange={setDate}
          error={errors.date}
          helperText="Payment date"
          maximumDate={new Date()}
        />
        <AppTextInput
          label="Notes (optional)"
          value={notes}
          onChangeText={setNotes}
          placeholder="e.g. Extra principal payment"
          multiline
          numberOfLines={2}
          maxLength={200}
          helperText="Uploaded unchanged. Do not include personal or account information."
        />
        <View style={{ height: 100 }} />
      </View>
      <StickyActionBar>
        <Button
          title="Log Payment"
          onPress={handleSubmit}
          loading={saving}
          disabled={saving}
          variant="primary"
        />
      </StickyActionBar>
    </KeyboardSafeScreen>
  );
};

const styles = StyleSheet.create({
  container: { padding: Spacing.md },
  centered: { flex: 1 },
  sectionLabel: { ...Typography.label, color: Colors.textSecondary, marginBottom: Spacing.xs },
  debtListCard: { padding: 0, marginBottom: Spacing.sm, overflow: 'hidden' },
  debtRow: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    padding: Spacing.md, borderBottomWidth: 1, borderBottomColor: Colors.border,
  },
  debtRowSelected: { backgroundColor: Colors.primaryFade },
  debtRowInfo: { flex: 1 },
  debtName: { ...Typography.h4, color: Colors.text },
  debtNameSelected: { color: Colors.primary },
  debtBalance: { ...Typography.caption, color: Colors.textMuted, marginTop: 2 },
  checkmark: { color: Colors.primary, fontWeight: '700', fontSize: 16 },
  errorText: { ...Typography.caption, color: Colors.error, marginBottom: Spacing.sm },
  debtInfoCard: {
    backgroundColor: Colors.primaryFade, padding: Spacing.md, marginBottom: Spacing.md,
  },
  debtInfoText: { ...Typography.body, color: Colors.primaryDark, marginBottom: 2 },
  checkboxRow: {
    flexDirection: 'row', alignItems: 'center', marginBottom: Spacing.md,
    marginTop: Spacing.xs,
  },
  checkbox: {
    width: 22, height: 22, borderRadius: BorderRadius.sm,
    borderWidth: 2, borderColor: Colors.border,
    alignItems: 'center', justifyContent: 'center', marginRight: Spacing.sm,
  },
  checkboxChecked: { backgroundColor: Colors.primary, borderColor: Colors.primary },
  checkboxCheck: { color: Colors.textInverse, fontSize: 13, fontWeight: '700' },
  checkboxLabel: { ...Typography.body, color: Colors.text, flex: 1 },
});

export default LogDebtPaymentScreen;
