import React, { useState, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Alert,
  Modal,
} from 'react-native';
import { useNavigation, useRoute, RouteProp } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useApp } from '../../context/AppContext';
import { Colors, Spacing, Typography, BorderRadius } from '../../theme';
import { formatCurrency, formatPercent, formatDate, formatDebtType, formatAPR, formatMonths } from '../../utils/formatters';
import Card from '../../components/common/Card';
import Button from '../../components/common/Button';
import ProgressBar from '../../components/common/ProgressBar';
import ConfirmDialog from '../../components/common/ConfirmDialog';
import Badge from '../../components/common/Badge';
import SafeScrollView from '../../components/layout/SafeScrollView';
import StickyActionBar from '../../components/layout/StickyActionBar';
import AppTextInput from '../../components/common/TextInput';
import DateField from '../../components/common/DateField';
import type { RootStackParamList } from '../../types/index';

type Nav = NativeStackNavigationProp<RootStackParamList>;
type Route = RouteProp<RootStackParamList, 'DebtDetail'>;

function calcPayoffMonths(balance: number, apr: number | null, minPayment: number | null): number | null {
  if (balance <= 0) return 0;
  if (!minPayment || minPayment <= 0) return null;
  if (!apr || apr <= 0) return Math.ceil(balance / minPayment);
  const r = apr / 100 / 12;
  if (minPayment <= balance * r) return null;
  const n = -Math.log(1 - (r * balance) / minPayment) / Math.log(1 + r);
  if (!isFinite(n) || isNaN(n) || n < 0) return null;
  return Math.min(Math.ceil(n), 600);
}

function calcTotalInterest(balance: number, apr: number | null, minPayment: number | null): number {
  if (!apr || apr <= 0 || !minPayment || minPayment <= 0 || balance <= 0) return 0;
  const months = calcPayoffMonths(balance, apr, minPayment);
  if (months === null) return 0;
  const totalPaid = minPayment * months;
  return Math.max(0, totalPaid - balance);
}

export default function DebtDetailScreen(): React.JSX.Element {
  const navigation = useNavigation<Nav>();
  const route = useRoute<Route>();
  const { debtId } = route.params;
  const { data, deleteDebtAccount, archiveDebtAccount, deleteDebtPayment, updateDebtPayment } = useApp();

  const debt = data.debtAccounts.find(d => d.id === debtId);
  const payments = data.debtPayments.filter(p => p.debtId === debtId).sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
  const currency = data.preferences.currency;

  const [deleteDebtConfirm, setDeleteDebtConfirm] = useState(false);
  const [deletePaymentId, setDeletePaymentId] = useState<string | null>(null);
  const [actionLoading, setActionLoading] = useState(false);
  const [editPaymentId, setEditPaymentId] = useState<string | null>(null);
  const [editAmount, setEditAmount] = useState('');
  const [editDate, setEditDate] = useState('');
  const [editNotes, setEditNotes] = useState('');
  const handleGoBack = useCallback(() => navigation.goBack(), [navigation]);

  if (!debt) {
    return (
      <View style={styles.centered}>
        <Text style={styles.errorText}>Debt not found.</Text>
        <Button title="Go Back" onPress={handleGoBack} variant="primary" />
      </View>
    );
  }

  const paidAmount = Math.max(0, debt.originalBalance - debt.currentBalance);
  const paidPercent = debt.originalBalance > 0 ? Math.min(100, (paidAmount / debt.originalBalance) * 100) : 0;
  const payoffMonths = calcPayoffMonths(debt.currentBalance, debt.apr, debt.minimumPayment);
  const estimatedInterest = calcTotalInterest(debt.currentBalance, debt.apr, debt.minimumPayment);
  const missingInfo = debt.apr === null || debt.minimumPayment === null;

  function getStatusBadge(status: string) {
    if (status === 'active') return { color: Colors.errorLight, textColor: Colors.error, label: 'Active' };
    if (status === 'paid_off') return { color: Colors.successLight, textColor: Colors.success, label: 'Paid Off' };
    return { color: Colors.surfaceVariant, textColor: Colors.textMuted, label: 'Archived' };
  }

  const badge = getStatusBadge(debt.status);

  const handleDeleteDebt = async () => {
    setDeleteDebtConfirm(false);
    setActionLoading(true);
    try {
      await deleteDebtAccount(debtId);
      navigation.goBack();
    } catch {
      Alert.alert('Error', 'Failed to delete debt.');
    } finally {
      setActionLoading(false);
    }
  };

  const handleDeletePayment = async () => {
    if (!deletePaymentId) return;
    try {
      await deleteDebtPayment(deletePaymentId);
    } catch {
      Alert.alert('Error', 'Failed to delete payment.');
    } finally {
      setDeletePaymentId(null);
    }
  };

  const openPaymentEditor = (id: string) => {
    const payment = payments.find(item => item.id === id);
    if (!payment) return;
    setEditPaymentId(id);
    setEditAmount(String(payment.amount));
    setEditDate(payment.date);
    setEditNotes(payment.notes);
  };

  const savePaymentEdit = async () => {
    const amount = Number(editAmount);
    if (!editPaymentId || !Number.isFinite(amount) || amount <= 0) {
      Alert.alert('Check the amount', 'Enter an amount above zero.');
      return;
    }
    await updateDebtPayment(editPaymentId, {amount, date: editDate, notes: editNotes.trim()});
    setEditPaymentId(null);
  };

  const handleArchive = async () => {
    setActionLoading(true);
    try {
      await archiveDebtAccount(debtId);
    } catch {
      Alert.alert('Error', 'Failed to archive debt.');
    } finally {
      setActionLoading(false);
    }
  };

  return (
    <View style={styles.screen}>
      <SafeScrollView>
        {/* Header Card */}
        <Card style={styles.headerCard}>
          <View style={styles.headerRow}>
            <Text style={styles.debtName}>{debt.name}</Text>
            <View style={styles.badgeCol}>
              <Badge label={formatDebtType(debt.debtType)} color={Colors.secondaryFade} textColor={Colors.secondary} style={styles.badgeSpacing} />
              <Badge label={badge.label} color={badge.color} textColor={badge.textColor} />
            </View>
          </View>

          {/* Balance Section */}
          <View style={styles.balanceRow}>
            <View>
              <Text style={styles.currentBalance}>{formatCurrency(debt.currentBalance, currency)}</Text>
              <Text style={styles.balanceLabel}>current balance</Text>
            </View>
            <View style={styles.alignRight}>
              <Text style={styles.originalBalance}>{formatCurrency(debt.originalBalance, currency)}</Text>
              <Text style={styles.balanceLabel}>original</Text>
            </View>
          </View>

          <ProgressBar progress={paidPercent} height={10} color={Colors.success} animated style={styles.progressBar} />
          <View style={styles.progressMeta}>
            <Text style={styles.metaText}>{formatPercent(paidPercent)} paid off</Text>
            <Text style={styles.metaText}>{formatCurrency(paidAmount, currency)} paid</Text>
          </View>

          {/* APR / Min Payment Info */}
          <View style={styles.metaBadgeRow}>
            <Badge
              label={debt.apr !== null ? `APR: ${formatAPR(debt.apr)}` : 'APR: Not set'}
              color={debt.apr !== null ? Colors.accentFade : Colors.surfaceVariant}
              textColor={debt.apr !== null ? Colors.accent : Colors.textMuted}
            />
            {debt.minimumPayment !== null ? (
              <Badge label={`Min: ${formatCurrency(debt.minimumPayment, currency)}/mo`} color={Colors.infoLight} textColor={Colors.info} style={styles.badgeSpacing} />
            ) : (
              <Badge label="Min Payment: Not set" color={Colors.surfaceVariant} textColor={Colors.textMuted} style={styles.badgeSpacing} />
            )}
            {debt.dueDayOfMonth !== null ? (
              <Badge label={`Due: Day ${debt.dueDayOfMonth}`} color={Colors.surfaceVariant} textColor={Colors.textSecondary} />
            ) : null}
          </View>
        </Card>

        {/* Payoff Estimate */}
        <Card style={styles.card}>
          <Text style={styles.cardTitle}>Payoff Estimate</Text>
          {missingInfo ? (
            <View style={styles.warningBox}>
              <Text style={styles.warningText}>
                ⚠ APR{debt.apr === null ? '' : ''} and/or minimum payment not set.
                Add these in Edit Debt to see payoff estimates.
              </Text>
            </View>
          ) : payoffMonths === null ? (
            <View style={styles.warningBox}>
              <Text style={styles.warningText}>
                ⚠ Minimum payment does not cover monthly interest. Increase your payment to pay off this debt.
              </Text>
            </View>
          ) : (
            <View style={styles.estimateGrid}>
              <View style={styles.estimateItem}>
                <Text style={styles.estimateValue}>{formatMonths(payoffMonths)}</Text>
                <Text style={styles.estimateLabel}>to pay off</Text>
              </View>
              <View style={styles.estimateItem}>
                <Text style={styles.estimateValue}>{formatCurrency(estimatedInterest, currency)}</Text>
                <Text style={styles.estimateLabel}>est. interest</Text>
              </View>
            </View>
          )}
          <Text style={styles.estimateNote}>
            Based on minimum payment only. Paying more accelerates payoff.
          </Text>
        </Card>

        {/* Payments */}
        <Card style={styles.card}>
          <View style={styles.contribHeader}>
            <Text style={styles.cardTitle}>Payments ({payments.length})</Text>
            <Button
              title="Log"
              onPress={() => navigation.navigate('LogDebtPayment', { debtId })}
              variant="primary"
              size="sm"
            />
          </View>
          {payments.length === 0 ? (
            <Text style={styles.emptyText}>No payments logged. Tap "Log" to record a payment.</Text>
          ) : (
            payments.map(p => (
              <View key={p.id} style={styles.paymentRow}>
                <View style={styles.paymentInfo}>
                  <Text style={styles.paymentAmount}>{formatCurrency(p.amount, currency)}</Text>
                  <Text style={styles.paymentDate}>{formatDate(p.date)}</Text>
                  {p.isMinimumPayment ? <Badge label="Min Payment" color={Colors.infoLight} textColor={Colors.info} size="sm" style={styles.minBadge} /> : null}
                  {p.notes ? <Text style={styles.paymentNote}>{p.notes}</Text> : null}
                </View>
                <View style={styles.historyActions}>
                  <Button title="Edit" onPress={() => openPaymentEditor(p.id)} variant="outline" size="sm" />
                  <Button title="Del" onPress={() => setDeletePaymentId(p.id)} variant="danger" size="sm" />
                </View>
              </View>
            ))
          )}
        </Card>

        {/* Notes */}
        {debt.notes ? (
          <Card style={styles.card}>
            <Text style={styles.cardTitle}>Notes</Text>
            <Text style={styles.notesText}>{debt.notes}</Text>
          </Card>
        ) : null}

      </SafeScrollView>

      <StickyActionBar>
        <View style={styles.actionRow}>
          <Button title="Edit" onPress={() => navigation.navigate('EditDebt', { debtId })} variant="outline" size="md" style={styles.actionBtn} />
          {debt.status !== 'archived' ? (
            <Button title="Archive" onPress={handleArchive} variant="ghost" size="md" loading={actionLoading} style={styles.actionBtn} />
          ) : null}
          <Button title="Delete" onPress={() => setDeleteDebtConfirm(true)} variant="danger" size="md" style={styles.actionBtn} />
        </View>
      </StickyActionBar>

      <ConfirmDialog
        visible={deleteDebtConfirm}
        title="Delete Debt?"
        message="This will permanently delete this debt account and all its payment history. This cannot be undone."
        confirmLabel="Delete"
        cancelLabel="Cancel"
        destructive
        onConfirm={handleDeleteDebt}
        onCancel={() => setDeleteDebtConfirm(false)}
      />
      <ConfirmDialog
        visible={deletePaymentId !== null}
        title="Delete Payment?"
        message="This will remove this payment and increase your current balance."
        confirmLabel="Delete"
        cancelLabel="Cancel"
        destructive
        onConfirm={handleDeletePayment}
        onCancel={() => setDeletePaymentId(null)}
      />
      <Modal visible={editPaymentId !== null} transparent animationType="slide" onRequestClose={() => setEditPaymentId(null)}>
        <View style={styles.modalOverlay}>
          <View style={styles.editorSheet}>
            <Text style={styles.editorTitle}>Edit payment</Text>
            <AppTextInput label="Amount" value={editAmount} onChangeText={setEditAmount} keyboardType="decimal-pad" prefix={currency} />
            <DateField label="Date" value={editDate} onChange={setEditDate} maximumDate={new Date()} />
            <AppTextInput label="Notes" value={editNotes} onChangeText={setEditNotes} multiline numberOfLines={3} maxLength={500} helperText="Uploaded unchanged. Do not include personal information." />
            <View style={styles.editorActions}>
              <Button title="Cancel" onPress={() => setEditPaymentId(null)} variant="ghost" style={styles.editorButton} />
              <Button title="Save changes" onPress={() => void savePaymentEdit()} style={styles.editorButton} />
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: Colors.background },
  centered: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: Spacing.xl },
  errorText: { ...Typography.body, color: Colors.error, marginBottom: Spacing.md },
  headerCard: { margin: Spacing.md, padding: Spacing.md },
  headerRow: { flexDirection: 'row', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: Spacing.sm },
  debtName: { ...Typography.h2, color: Colors.text, flex: 1, marginRight: Spacing.sm },
  badgeCol: { alignItems: 'flex-end', gap: 4 },
  badgeSpacing: { marginRight: 4 },
  balanceRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-end', marginBottom: Spacing.sm },
  currentBalance: { ...Typography.numberLarge, color: Colors.error },
  balanceLabel: { ...Typography.caption, color: Colors.textMuted },
  alignRight: { alignItems: 'flex-end' },
  originalBalance: { ...Typography.h3, color: Colors.textSecondary },
  progressBar: { marginBottom: Spacing.xs },
  progressMeta: { flexDirection: 'row', justifyContent: 'space-between' },
  metaText: { ...Typography.caption, color: Colors.textMuted },
  metaBadgeRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 4, marginTop: Spacing.sm },
  card: { margin: Spacing.md, marginTop: 0, padding: Spacing.md },
  cardTitle: { ...Typography.h4, color: Colors.text, marginBottom: Spacing.sm },
  warningBox: { backgroundColor: Colors.warningLight, borderRadius: BorderRadius.md, padding: Spacing.sm, borderLeftWidth: 3, borderLeftColor: Colors.warning },
  warningText: { ...Typography.caption, color: Colors.warning, lineHeight: 18 },
  estimateGrid: { flexDirection: 'row', justifyContent: 'space-around', marginBottom: Spacing.sm },
  estimateItem: { alignItems: 'center' },
  estimateValue: { ...Typography.h3, color: Colors.primary },
  estimateLabel: { ...Typography.caption, color: Colors.textMuted },
  estimateNote: { ...Typography.caption, color: Colors.textMuted, fontStyle: 'italic', marginTop: Spacing.xs },
  contribHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: Spacing.sm },
  emptyText: { ...Typography.caption, color: Colors.textMuted, fontStyle: 'italic', textAlign: 'center', paddingVertical: Spacing.md },
  paymentRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingVertical: Spacing.xs, borderBottomWidth: 1, borderBottomColor: Colors.divider },
  paymentInfo: { flex: 1, marginRight: Spacing.sm },
  paymentAmount: { ...Typography.body, color: Colors.success, fontWeight: '600' },
  paymentDate: { ...Typography.caption, color: Colors.textMuted },
  minBadge: { marginTop: 2 },
  paymentNote: { ...Typography.caption, color: Colors.textMuted, fontStyle: 'italic' },
  notesText: { ...Typography.body, color: Colors.textSecondary, lineHeight: 22 },
  disclaimer: { marginHorizontal: Spacing.md, marginBottom: Spacing.lg },
  actionRow: { flexDirection: 'row', gap: Spacing.sm },
  actionBtn: { flex: 1 },
  historyActions: { flexDirection: 'row', gap: Spacing.xs },
  modalOverlay: { flex: 1, backgroundColor: 'rgba(3,18,14,0.55)', justifyContent: 'flex-end' },
  editorSheet: { backgroundColor: Colors.surface, borderTopLeftRadius: 26, borderTopRightRadius: 26, padding: Spacing.lg, paddingBottom: 32 },
  editorTitle: { ...Typography.h2, color: Colors.text, marginBottom: Spacing.md },
  editorActions: { flexDirection: 'row', gap: Spacing.sm, marginTop: Spacing.sm },
  editorButton: { flex: 1 },
});
