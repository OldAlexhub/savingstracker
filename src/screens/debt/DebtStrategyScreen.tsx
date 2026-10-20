import React, { useState, useMemo } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
} from 'react-native';
import { useApp } from '../../context/AppContext';
import { Colors, Spacing, Typography, BorderRadius, Shadows } from '../../theme';
import {
  calculateDebtAvalanche,
  calculateDebtSnowball,
  calculateDebtHybrid,
  calculateEqualExtraPayment,
} from '../../utils/calculations';
import {
  formatCurrency,
  formatDate,
  formatDebtType,
  formatAPR,
  parseNumberSafe,
} from '../../utils/formatters';
import { DEBT_STRATEGY_DESCRIPTIONS } from '../../data/strategies';
import Card from '../../components/common/Card';
import AppTextInput from '../../components/common/TextInput';
import EmptyState from '../../components/common/EmptyState';
import Badge from '../../components/common/Badge';
import SafeScrollView from '../../components/layout/SafeScrollView';
import BannerAdComponent from '../../components/ads/BannerAdComponent';
import type { DebtStrategyId } from '../../types/index';

type StrategyTab = {
  id: DebtStrategyId;
  label: string;
};

const STRATEGY_TABS: StrategyTab[] = [
  { id: 'avalanche', label: 'Avalanche' },
  { id: 'snowball', label: 'Snowball' },
  { id: 'hybrid', label: 'Hybrid' },
  { id: 'equal_extra', label: 'Equal Extra' },
  { id: 'custom_order', label: 'Custom' },
];

export default function DebtStrategyScreen(): React.JSX.Element {
  const { data } = useApp();
  const currency = data.preferences.currency;

  const [selectedTab, setSelectedTab] = useState<DebtStrategyId>('avalanche');
  const [extraPayment, setExtraPayment] = useState('');

  const activeDebts = useMemo(
    () => data.debtAccounts.filter(d => d.status === 'active'),
    [data.debtAccounts],
  );

  const parsedExtra = parseNumberSafe(extraPayment);

  const strategyResult = useMemo(() => {
    if (activeDebts.length === 0 || selectedTab === 'custom_order') {
      return null;
    }
    switch (selectedTab) {
      case 'avalanche':
        return calculateDebtAvalanche(activeDebts, parsedExtra);
      case 'snowball':
        return calculateDebtSnowball(activeDebts, parsedExtra);
      case 'hybrid':
        return calculateDebtHybrid(activeDebts, parsedExtra);
      case 'equal_extra':
        return calculateEqualExtraPayment(activeDebts, parsedExtra);
      default:
        return null;
    }
  }, [activeDebts, selectedTab, parsedExtra]);

  const missingApr = activeDebts.filter(d => d.apr === null || d.apr === undefined);
  const missingMinPayment = activeDebts.filter(
    d => d.minimumPayment === null || d.minimumPayment === undefined || d.minimumPayment <= 0,
  );

  if (activeDebts.length === 0) {
    return (
      <SafeScrollView>
        <View style={styles.container}>
          <BannerAdComponent />
          <EmptyState
            icon="📊"
            title="No Active Debts"
            description="Add a debt account to compare payoff strategies."
          />
        </View>
      </SafeScrollView>
    );
  }

  return (
    <SafeScrollView>
      <View style={styles.container}>
        <Text style={styles.headerTitle}>Compare Payoff Strategies</Text>

        {/* Extra payment input */}
        <Card style={styles.extraCard}>
          <Text style={styles.extraCardLabel}>Monthly Extra Payment (Optional)</Text>
          <AppTextInput
            value={extraPayment}
            onChangeText={setExtraPayment}
            placeholder="0.00"
            keyboardType="decimal-pad"
            prefix="$"
            helperText="Applied on top of minimum payments each month"
          />
        </Card>

        <BannerAdComponent />

        {/* Missing data warnings */}
        {(missingApr.length > 0 || missingMinPayment.length > 0) ? (
          <View style={styles.warningCard}>
            <Text style={styles.warningTitle}>Incomplete Debt Information</Text>
            {missingApr.map(d => (
              <Text key={`apr-${d.id}`} style={styles.warningItem}>
                • "{d.name}" is missing APR — interest cannot be estimated
              </Text>
            ))}
            {missingMinPayment.map(d => (
              <Text key={`min-${d.id}`} style={styles.warningItem}>
                • "{d.name}" is missing minimum payment — payoff timeline unavailable
              </Text>
            ))}
          </View>
        ) : null}

        {/* Strategy tabs */}
        <View style={styles.tabRow}>
          {STRATEGY_TABS.map(tab => (
            <TouchableOpacity
              key={tab.id}
              style={[styles.tab, selectedTab === tab.id && styles.tabActive]}
              onPress={() => setSelectedTab(tab.id)}
              activeOpacity={0.75}
            >
              <Text
                style={[
                  styles.tabText,
                  selectedTab === tab.id && styles.tabTextActive,
                ]}
                numberOfLines={1}
              >
                {tab.label}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        {/* Strategy description */}
        <Card style={[styles.card, styles.descCard]}>
          <Text style={styles.descText}>
            {selectedTab !== 'custom_order'
              ? DEBT_STRATEGY_DESCRIPTIONS[selectedTab] ?? ''
              : 'Show debts in the order entered. Prioritize based on your personal criteria — due dates, interest, or emotional factors.'}
          </Text>
        </Card>

        {/* Calculation warnings */}
        {strategyResult && strategyResult.warnings.length > 0 ? (
          <View style={styles.warningCard}>
            {strategyResult.warnings.map((w, i) => (
              <Text key={i} style={styles.warningItem}>
                {'⚠'} {w}
              </Text>
            ))}
          </View>
        ) : null}

        {/* Debt order table */}
        <Card style={styles.card}>
          <Text style={styles.cardTitle}>
            {selectedTab === 'custom_order' ? 'Current Debt Order' : 'Recommended Payoff Order'}
          </Text>

          {/* Table header */}
          <View style={styles.tableHeader}>
            <Text style={[styles.rankCell, styles.tableHeaderText]}>#</Text>
            <Text style={[styles.nameCell, styles.tableHeaderText]}>Name</Text>
            <Text style={[styles.balanceCell, styles.tableHeaderText]}>Balance</Text>
            <Text style={[styles.aprCell, styles.tableHeaderText]}>APR</Text>
          </View>

          {(selectedTab === 'custom_order'
            ? activeDebts
            : strategyResult?.debtOrder ?? activeDebts
          ).map((debt, index) => {
            const isFirst = index === 0;
            const isLast = index === activeDebts.length - 1;
            return (
              <View
                key={debt.id}
                style={[
                  styles.tableRow,
                  isFirst && selectedTab !== 'custom_order' && styles.tableRowHighlight,
                  !isLast && styles.tableRowBorder,
                ]}
              >
                <Text style={styles.rankCell}>{index + 1}</Text>
                <View style={styles.nameCellView}>
                  <Text style={styles.nameText} numberOfLines={2}>
                    {debt.name}
                  </Text>
                  <Text style={styles.typeText}>{formatDebtType(debt.debtType)}</Text>
                  {isFirst && selectedTab !== 'custom_order' ? (
                    <Badge
                      label="Focus Next"
                      color={Colors.primaryFade}
                      textColor={Colors.primary}
                      size="sm"
                    />
                  ) : null}
                </View>
                <Text style={styles.balanceCell}>
                  {formatCurrency(debt.currentBalance, currency)}
                </Text>
                <Text style={styles.aprCell}>{formatAPR(debt.apr)}</Text>
              </View>
            );
          })}
        </Card>

        {/* Summary card */}
        {strategyResult ? (
          <Card style={styles.card}>
            <Text style={styles.cardTitle}>Strategy Summary</Text>
            <View style={styles.summaryGrid}>
              <View style={styles.summaryItem}>
                <Text style={styles.summaryLabel}>Est. Total Interest</Text>
                <Text style={[styles.summaryValue, { color: Colors.error }]}>
                  {formatCurrency(strategyResult.totalInterest, currency)}
                </Text>
              </View>
              <View style={styles.summaryItem}>
                <Text style={styles.summaryLabel}>Est. Total Paid</Text>
                <Text style={styles.summaryValue}>
                  {formatCurrency(strategyResult.totalPaid, currency)}
                </Text>
              </View>
            </View>
            {strategyResult.estimatedPayoffDate ? (
              <View style={styles.payoffRow}>
                <Text style={styles.summaryLabel}>Estimated Payoff: </Text>
                <Text style={styles.payoffDate}>
                  {formatDate(strategyResult.estimatedPayoffDate)}
                </Text>
              </View>
            ) : (
              <Text style={styles.noEstimate}>
                Add APR and minimum payments to all debts for a payoff date estimate.
              </Text>
            )}
          </Card>
        ) : null}

        {/* Next target highlight */}
        {strategyResult?.nextTargetDebt && selectedTab !== 'custom_order' ? (
          <Card style={[styles.card, styles.nextTargetCard]}>
            <Text style={styles.nextTargetLabel}>Focus Debt First</Text>
            <Text style={styles.nextTargetName} numberOfLines={2}>
              {strategyResult.nextTargetDebt.name}
            </Text>
            <Text style={styles.nextTargetDetail}>
              Balance: {formatCurrency(strategyResult.nextTargetDebt.currentBalance, currency)}
              {'  '}APR: {formatAPR(strategyResult.nextTargetDebt.apr)}
            </Text>
            {strategyResult.nextTargetDebt.minimumPayment !== null &&
            strategyResult.nextTargetDebt.minimumPayment !== undefined ? (
              <Text style={styles.nextTargetDetail}>
                Min Payment:{' '}
                {formatCurrency(strategyResult.nextTargetDebt.minimumPayment, currency)}/mo
                {parsedExtra > 0 ? ` + ${formatCurrency(parsedExtra, currency)} extra` : ''}
              </Text>
            ) : null}
          </Card>
        ) : null}

        {/* Custom note */}
        {selectedTab === 'custom_order' ? (
          <Card style={styles.card}>
            <Text style={styles.customNote}>
              The custom order strategy lets you decide the payoff sequence based on factors only you can evaluate — urgency, emotional weight, due dates, or lender relationships. Edit debts individually to update balances and payment information.
            </Text>
          </Card>
        ) : null}

      </View>
    </SafeScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    paddingHorizontal: Spacing.md,
    paddingTop: Spacing.md,
    paddingBottom: Spacing.xxl,
  },
  headerTitle: {
    ...Typography.h2,
    color: Colors.text,
    marginBottom: Spacing.sm,
  },
  topDisclaimer: {
    marginBottom: Spacing.md,
  },
  extraCard: {
    padding: Spacing.md,
    marginBottom: Spacing.md,
  },
  extraCardLabel: {
    ...Typography.label,
    color: Colors.textSecondary,
    textTransform: 'uppercase',
    marginBottom: Spacing.sm,
  },
  warningCard: {
    backgroundColor: Colors.warningLight,
    borderRadius: BorderRadius.md,
    padding: Spacing.md,
    marginBottom: Spacing.md,
    borderLeftWidth: 3,
    borderLeftColor: Colors.warning,
  },
  warningTitle: {
    ...Typography.label,
    color: Colors.warning,
    textTransform: 'uppercase',
    marginBottom: Spacing.xs,
  },
  warningItem: {
    ...Typography.caption,
    color: Colors.textSecondary,
    lineHeight: 18,
    marginBottom: 2,
  },
  tabRow: {
    flexDirection: 'row',
    marginBottom: Spacing.md,
    backgroundColor: Colors.surfaceVariant,
    borderRadius: BorderRadius.md,
    padding: 4,
  },
  tab: {
    flex: 1,
    paddingVertical: Spacing.xs,
    paddingHorizontal: 2,
    borderRadius: BorderRadius.sm,
    alignItems: 'center',
  },
  tabActive: {
    backgroundColor: Colors.surface,
    ...Shadows.sm,
  },
  tabText: {
    ...Typography.caption,
    color: Colors.textMuted,
    fontWeight: '600',
    textAlign: 'center',
    fontSize: 11,
  },
  tabTextActive: {
    color: Colors.primary,
  },
  card: {
    padding: Spacing.md,
    marginBottom: Spacing.md,
  },
  descCard: {
    backgroundColor: Colors.primaryFade,
  },
  descText: {
    ...Typography.body,
    color: Colors.textSecondary,
    lineHeight: 22,
  },
  cardTitle: {
    ...Typography.label,
    color: Colors.textSecondary,
    textTransform: 'uppercase',
    marginBottom: Spacing.sm,
  },
  tableHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.surfaceVariant,
    borderRadius: BorderRadius.sm,
    paddingVertical: Spacing.xs,
    paddingHorizontal: 4,
    marginBottom: 2,
  },
  tableHeaderText: {
    fontWeight: '700',
    color: Colors.textSecondary,
  },
  tableRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    paddingVertical: Spacing.sm,
    paddingHorizontal: 4,
  },
  tableRowBorder: {
    borderBottomWidth: 1,
    borderBottomColor: Colors.divider,
  },
  tableRowHighlight: {
    backgroundColor: Colors.primaryFade,
    borderRadius: BorderRadius.sm,
  },
  rankCell: {
    width: 22,
    ...Typography.caption,
    color: Colors.textSecondary,
    fontWeight: '700',
    textAlign: 'center',
    paddingTop: 2,
  },
  nameCell: {
    flex: 1,
    ...Typography.caption,
    color: Colors.textSecondary,
    fontWeight: '700',
  },
  nameCellView: {
    flex: 1,
    paddingHorizontal: 4,
  },
  nameText: {
    ...Typography.caption,
    color: Colors.text,
    fontWeight: '600',
    marginBottom: 2,
  },
  typeText: {
    ...Typography.caption,
    color: Colors.textMuted,
    fontSize: 10,
    marginBottom: 2,
  },
  balanceCell: {
    width: 82,
    ...Typography.caption,
    color: Colors.text,
    textAlign: 'right',
    paddingTop: 2,
  },
  aprCell: {
    width: 50,
    ...Typography.caption,
    color: Colors.text,
    textAlign: 'right',
    paddingTop: 2,
  },
  summaryGrid: {
    flexDirection: 'row',
    marginBottom: Spacing.sm,
  },
  summaryItem: {
    flex: 1,
  },
  summaryLabel: {
    ...Typography.caption,
    color: Colors.textMuted,
    marginBottom: 2,
  },
  summaryValue: {
    ...Typography.h4,
    color: Colors.text,
  },
  payoffRow: {
    flexDirection: 'row',
    alignItems: 'center',
    flexWrap: 'wrap',
  },
  payoffDate: {
    ...Typography.body,
    color: Colors.text,
    fontWeight: '600',
  },
  noEstimate: {
    ...Typography.caption,
    color: Colors.textMuted,
    fontStyle: 'italic',
    lineHeight: 18,
    marginTop: Spacing.xs,
  },
  nextTargetCard: {
    borderWidth: 2,
    borderColor: Colors.primary,
    backgroundColor: Colors.primaryFade,
  },
  nextTargetLabel: {
    ...Typography.label,
    color: Colors.primary,
    textTransform: 'uppercase',
    marginBottom: Spacing.xs,
  },
  nextTargetName: {
    ...Typography.h3,
    color: Colors.text,
    marginBottom: Spacing.xs,
  },
  nextTargetDetail: {
    ...Typography.body,
    color: Colors.textSecondary,
    marginBottom: 2,
  },
  customNote: {
    ...Typography.body,
    color: Colors.textSecondary,
    lineHeight: 22,
  },
  bottomDisclaimer: {
    marginTop: Spacing.sm,
  },
});
