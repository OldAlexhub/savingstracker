import React, {useMemo, useState} from 'react';
import {
  Alert,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import {useNavigation} from '@react-navigation/native';
import type {NativeStackNavigationProp} from '@react-navigation/native-stack';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import {useSafeAreaInsets} from 'react-native-safe-area-context';

import BannerAdComponent from '../components/ads/BannerAdComponent';
import ConfirmDialog from '../components/common/ConfirmDialog';
import ProgressBar from '../components/common/ProgressBar';
import SafeScrollView from '../components/layout/SafeScrollView';
import {useApp} from '../context/AppContext';
import {BorderRadius, Colors, Shadows, Spacing, Typography} from '../theme';
import type {DebtStatus, RootStackParamList} from '../types';
import {formatCurrency, formatDebtType} from '../utils/formatters';

type Navigation = NativeStackNavigationProp<RootStackParamList>;
type Filter = 'all' | DebtStatus;
const FILTERS: Array<{key: Filter; label: string}> = [
  {key: 'active', label: 'Active'},
  {key: 'paid_off', label: 'Paid off'},
  {key: 'archived', label: 'Archived'},
  {key: 'all', label: 'All'},
];

export default function DebtScreen(): React.JSX.Element {
  const insets = useSafeAreaInsets();
  const navigation = useNavigation<Navigation>();
  const {data, loading, refreshData, insights, archiveDebtAccount, deleteDebtAccount} = useApp();
  const [filter, setFilter] = useState<Filter>('active');
  const [query, setQuery] = useState('');
  const [menuId, setMenuId] = useState<string | null>(null);
  const [deleteId, setDeleteId] = useState<string | null>(null);

  const debts = useMemo(() => data.debtAccounts
    .filter(debt => filter === 'all' || debt.status === filter)
    .filter(debt => `${debt.name} ${debt.notes}`.toLowerCase().includes(query.trim().toLowerCase()))
    .sort((a, b) => (b.apr ?? 0) - (a.apr ?? 0)), [data.debtAccounts, filter, query]);
  const active = data.debtAccounts.filter(item => item.status === 'active');
  const totalDebt = active.reduce((sum, item) => sum + item.currentBalance, 0);
  const originalDebt = active.reduce((sum, item) => sum + item.originalBalance, 0);
  const totalPaid = Math.max(0, originalDebt - totalDebt);
  const highestApr = active.reduce((max, item) => Math.max(max, item.apr ?? 0), 0);
  const currency = data.preferences.currency;

  const archive = async (id: string) => {
    try {
      await archiveDebtAccount(id);
      setMenuId(null);
    } catch {
      Alert.alert('Could not archive debt', 'Please try again.');
    }
  };

  const remove = async () => {
    if (!deleteId) return;
    try {
      await deleteDebtAccount(deleteId);
    } catch {
      Alert.alert('Could not delete debt', 'Please try again.');
    } finally {
      setDeleteId(null);
      setMenuId(null);
    }
  };

  return (
    <View style={styles.screen}>
      <View style={[styles.header, {paddingTop: insets.top + 12}]}>
        <View style={styles.headerRow}>
          <View>
            <Text style={styles.eyebrow}>PAYDOWN WITH CLARITY</Text>
            <Text style={styles.headerTitle}>Debt</Text>
          </View>
          <TouchableOpacity style={styles.headerButton} onPress={() => navigation.navigate('AddDebt')}>
            <Icon name="plus" size={23} color="#D5F6E9" />
          </TouchableOpacity>
        </View>
        <View style={styles.overviewRow}>
          <View style={styles.overviewBlock}>
            <Text style={styles.overviewLabel}>REMAINING</Text>
            <Text style={styles.overviewValue}>{formatCurrency(totalDebt, currency)}</Text>
          </View>
          <View style={styles.overviewDivider} />
          <View style={styles.overviewBlock}>
            <Text style={styles.overviewLabel}>PAID</Text>
            <Text style={styles.overviewValue}>{formatCurrency(totalPaid, currency)}</Text>
          </View>
          <View style={styles.overviewDivider} />
          <View style={styles.overviewBlock}>
            <Text style={styles.overviewLabel}>TOP APR</Text>
            <Text style={styles.overviewValue}>{highestApr ? `${highestApr.toFixed(2)}%` : '—'}</Text>
          </View>
        </View>
      </View>

      <View style={styles.tools}>
        <View style={styles.searchBox}>
          <Icon name="magnify" size={20} color={Colors.textMuted} />
          <TextInput
            accessibilityLabel="Search debt accounts"
            style={styles.searchInput}
            value={query}
            onChangeText={setQuery}
            placeholder="Search debts and notes"
            placeholderTextColor={Colors.textMuted}
          />
          {query ? <TouchableOpacity onPress={() => setQuery('')}><Icon name="close-circle" size={19} color={Colors.textMuted} /></TouchableOpacity> : null}
        </View>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.filters}>
          {FILTERS.map(item => (
            <TouchableOpacity
              key={item.key}
              style={[styles.filter, filter === item.key && styles.filterActive]}
              onPress={() => setFilter(item.key)}>
              <Text style={[styles.filterText, filter === item.key && styles.filterTextActive]}>{item.label}</Text>
            </TouchableOpacity>
          ))}
        </ScrollView>
      </View>

      <SafeScrollView
        refreshControl={<RefreshControl refreshing={loading} onRefresh={() => void refreshData()} colors={[Colors.primary]} />}>
        <View style={styles.content}>
          <TouchableOpacity style={styles.compareCard} onPress={() => navigation.navigate('DebtStrategy')}>
            <View style={styles.compareIcon}><Icon name="chart-box-outline" size={23} color={Colors.secondary} /></View>
            <View style={styles.debtCopy}>
              <Text style={styles.compareTitle}>Compare payoff strategies</Text>
              <Text style={styles.compareBody}>Avalanche, snowball, hybrid, and equal-extra.</Text>
            </View>
            <Icon name="chevron-right" size={22} color={Colors.textMuted} />
          </TouchableOpacity>

          {debts.map(debt => {
            const progress = debt.originalBalance > 0
              ? Math.min(100, Math.max(0, (debt.originalBalance - debt.currentBalance) / debt.originalBalance * 100))
              : 0;
            const forecast = insights?.debts.find(item => item.debtId === debt.id);
            const isOpen = menuId === debt.id;
            return (
              <View key={debt.id} style={styles.debtCard}>
                <TouchableOpacity activeOpacity={0.82} onPress={() => navigation.navigate('DebtDetail', {debtId: debt.id})}>
                  <View style={styles.debtTop}>
                    <View style={styles.debtIcon}><Icon name="credit-card-outline" size={22} color={Colors.error} /></View>
                    <View style={styles.debtCopy}>
                      <Text style={styles.debtName} numberOfLines={1}>{debt.name}</Text>
                      <Text style={styles.debtType}>{formatDebtType(debt.debtType)} • {debt.apr === null ? 'APR not set' : `${debt.apr.toFixed(2)}% APR`}</Text>
                    </View>
                    <TouchableOpacity
                      accessibilityLabel={`Actions for ${debt.name}`}
                      hitSlop={10}
                      style={styles.menuButton}
                      onPress={() => setMenuId(isOpen ? null : debt.id)}>
                      <Icon name="dots-horizontal" size={22} color={Colors.textMuted} />
                    </TouchableOpacity>
                  </View>
                  <View style={styles.amountRow}>
                    <Text style={styles.balance}>{formatCurrency(debt.currentBalance, currency)}</Text>
                    <Text style={styles.balanceLabel}>remaining</Text>
                    <Text style={styles.percent}>{Math.round(progress)}% paid</Text>
                  </View>
                  <ProgressBar progress={progress} height={7} showPercent={false} color={progress >= 75 ? Colors.success : Colors.secondary} />
                  <View style={styles.metaRow}>
                    <Text style={styles.minimum}>{debt.minimumPayment ? `${formatCurrency(debt.minimumPayment, currency)} min.` : 'Add minimum payment'}</Text>
                    {forecast ? (
                      <Text style={[styles.risk, {color: forecast.risk === 'low' ? Colors.success : forecast.risk === 'medium' ? Colors.warning : Colors.error}]}>
                        {forecast.estimatedMonths === null ? 'Needs attention' : `${forecast.estimatedMonths} mo. • Estimated`}
                      </Text>
                    ) : <Text style={styles.pending}>Estimate pending</Text>}
                  </View>
                </TouchableOpacity>

                {isOpen ? (
                  <View style={styles.actionTray}>
                    <TouchableOpacity style={styles.action} onPress={() => navigation.navigate('LogDebtPayment', {debtId: debt.id})}>
                      <Icon name="cash-check" size={20} color={Colors.primaryDark} /><Text style={styles.actionText}>Pay</Text>
                    </TouchableOpacity>
                    <TouchableOpacity style={styles.action} onPress={() => navigation.navigate('EditDebt', {debtId: debt.id})}>
                      <Icon name="pencil-outline" size={20} color={Colors.secondary} /><Text style={styles.actionText}>Edit</Text>
                    </TouchableOpacity>
                    <TouchableOpacity style={styles.action} onPress={() => void archive(debt.id)}>
                      <Icon name="archive-outline" size={20} color={Colors.textMuted} /><Text style={styles.actionText}>Archive</Text>
                    </TouchableOpacity>
                    <TouchableOpacity style={styles.action} onPress={() => setDeleteId(debt.id)}>
                      <Icon name="delete-outline" size={20} color={Colors.error} /><Text style={[styles.actionText, {color: Colors.error}]}>Delete</Text>
                    </TouchableOpacity>
                  </View>
                ) : null}
              </View>
            );
          })}

          {debts.length === 0 ? (
            <View style={styles.empty}>
              <View style={styles.emptyIcon}><Icon name="shield-check-outline" size={34} color={Colors.primary} /></View>
              <Text style={styles.emptyTitle}>{query ? 'No matching debts' : filter === 'active' ? 'No active debt here' : 'Nothing in this view yet'}</Text>
              <Text style={styles.emptyBody}>{query ? 'Try another search or filter.' : 'Add an account when you want payoff projections, strategy comparisons, and payment momentum.'}</Text>
              {!query && filter === 'active' ? (
                <TouchableOpacity style={styles.emptyButton} onPress={() => navigation.navigate('AddDebt')}>
                  <Text style={styles.emptyButtonText}>Add a debt account</Text>
                </TouchableOpacity>
              ) : null}
            </View>
          ) : null}

          <BannerAdComponent style={styles.ad} />
        </View>
      </SafeScrollView>

      <ConfirmDialog
        visible={deleteId !== null}
        title="Delete this debt?"
        message="The account and its full payment history will be deleted locally and from the next server snapshot."
        confirmLabel="Delete debt"
        cancelLabel="Keep debt"
        destructive
        onConfirm={() => void remove()}
        onCancel={() => setDeleteId(null)}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  screen: {flex: 1, backgroundColor: Colors.background},
  header: {backgroundColor: '#092A23', paddingHorizontal: Spacing.lg, paddingBottom: 20, borderBottomLeftRadius: 28, borderBottomRightRadius: 28},
  headerRow: {flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between'},
  eyebrow: {...Typography.label, color: '#65D8AD', letterSpacing: 1.3},
  headerTitle: {fontSize: 30, fontWeight: '800', letterSpacing: -1, color: '#F4FFF9', marginTop: 2},
  headerButton: {width: 44, height: 44, borderRadius: 15, backgroundColor: '#123F34', alignItems: 'center', justifyContent: 'center'},
  overviewRow: {flexDirection: 'row', alignItems: 'center', marginTop: 17},
  overviewBlock: {flex: 1},
  overviewDivider: {height: 30, width: 1, backgroundColor: '#2D5148', marginHorizontal: 10},
  overviewLabel: {fontSize: 9, fontWeight: '700', letterSpacing: 1, color: '#77A99A'},
  overviewValue: {fontSize: 15, fontWeight: '700', color: '#EAFBF5', marginTop: 3},
  tools: {paddingTop: 14, backgroundColor: Colors.background},
  searchBox: {height: 45, marginHorizontal: Spacing.md, paddingHorizontal: 13, flexDirection: 'row', alignItems: 'center', backgroundColor: Colors.surface, borderRadius: 15, borderWidth: 1, borderColor: Colors.border},
  searchInput: {flex: 1, color: Colors.text, paddingHorizontal: 9, paddingVertical: 0},
  filters: {gap: 8, paddingHorizontal: Spacing.md, paddingVertical: 11},
  filter: {paddingHorizontal: 14, paddingVertical: 8, borderRadius: 99, backgroundColor: Colors.surface, borderWidth: 1, borderColor: Colors.border},
  filterActive: {backgroundColor: Colors.primaryDark, borderColor: Colors.primaryDark},
  filterText: {fontSize: 12, fontWeight: '600', color: Colors.textSecondary},
  filterTextActive: {color: Colors.textInverse},
  content: {paddingHorizontal: Spacing.md, paddingTop: 2},
  compareCard: {flexDirection: 'row', alignItems: 'center', backgroundColor: Colors.surface, borderWidth: 1, borderColor: Colors.border, borderRadius: BorderRadius.lg, padding: 14, marginBottom: 10},
  compareIcon: {width: 42, height: 42, borderRadius: 14, backgroundColor: Colors.secondaryFade, alignItems: 'center', justifyContent: 'center', marginRight: 11},
  compareTitle: {...Typography.body, color: Colors.text, fontWeight: '700'},
  compareBody: {...Typography.caption, color: Colors.textMuted, marginTop: 2},
  debtCard: {backgroundColor: Colors.surface, borderRadius: BorderRadius.lg, borderWidth: 1, borderColor: Colors.border, padding: 15, marginBottom: 10, ...Shadows.sm},
  debtTop: {flexDirection: 'row', alignItems: 'center'},
  debtIcon: {width: 42, height: 42, borderRadius: 14, backgroundColor: Colors.errorLight, alignItems: 'center', justifyContent: 'center', marginRight: 11},
  debtCopy: {flex: 1},
  debtName: {...Typography.h4, color: Colors.text},
  debtType: {...Typography.caption, color: Colors.textMuted, marginTop: 2},
  menuButton: {width: 34, height: 34, alignItems: 'center', justifyContent: 'center'},
  amountRow: {flexDirection: 'row', alignItems: 'baseline', marginTop: 14, marginBottom: 9},
  balance: {fontSize: 19, fontWeight: '800', color: Colors.text},
  balanceLabel: {...Typography.caption, color: Colors.textMuted, marginLeft: 5, flex: 1},
  percent: {fontSize: 13, fontWeight: '800', color: Colors.secondary},
  metaRow: {flexDirection: 'row', justifyContent: 'space-between', gap: 8, marginTop: 9},
  minimum: {...Typography.caption, color: Colors.textMuted},
  risk: {fontSize: 10, fontWeight: '700', textAlign: 'right'},
  pending: {fontSize: 10, color: Colors.textMuted},
  actionTray: {flexDirection: 'row', flexWrap: 'wrap', gap: 7, borderTopWidth: 1, borderTopColor: Colors.divider, marginTop: 14, paddingTop: 12},
  action: {flexDirection: 'row', alignItems: 'center', gap: 4, paddingHorizontal: 9, paddingVertical: 7, borderRadius: 10, backgroundColor: Colors.surfaceVariant},
  actionText: {fontSize: 11, fontWeight: '700', color: Colors.textSecondary},
  empty: {alignItems: 'center', padding: 30, backgroundColor: Colors.surface, borderRadius: BorderRadius.xl, borderWidth: 1, borderColor: Colors.border},
  emptyIcon: {width: 64, height: 64, borderRadius: 22, backgroundColor: Colors.primaryFade, alignItems: 'center', justifyContent: 'center'},
  emptyTitle: {...Typography.h2, color: Colors.text, textAlign: 'center', marginTop: 14},
  emptyBody: {...Typography.body, color: Colors.textSecondary, textAlign: 'center', marginTop: 7},
  emptyButton: {backgroundColor: Colors.primary, borderRadius: 99, paddingHorizontal: 20, paddingVertical: 11, marginTop: 17},
  emptyButtonText: {color: Colors.textInverse, fontWeight: '700'},
  ad: {marginTop: 18},
});
