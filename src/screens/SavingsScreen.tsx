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
import type {GoalStatus, RootStackParamList} from '../types';
import {formatCurrency, formatDate} from '../utils/formatters';

type Navigation = NativeStackNavigationProp<RootStackParamList>;
type Filter = 'all' | GoalStatus;
const FILTERS: Array<{key: Filter; label: string}> = [
  {key: 'active', label: 'Active'},
  {key: 'completed', label: 'Completed'},
  {key: 'archived', label: 'Archived'},
  {key: 'all', label: 'All'},
];

export default function SavingsScreen(): React.JSX.Element {
  const insets = useSafeAreaInsets();
  const navigation = useNavigation<Navigation>();
  const {
    data,
    loading,
    refreshData,
    insights,
    archiveSavingsGoal,
    completeSavingsGoal,
    deleteSavingsGoal,
  } = useApp();
  const [filter, setFilter] = useState<Filter>('active');
  const [query, setQuery] = useState('');
  const [menuId, setMenuId] = useState<string | null>(null);
  const [deleteId, setDeleteId] = useState<string | null>(null);

  const goals = useMemo(() => data.savingsGoals
    .filter(goal => filter === 'all' || goal.status === filter)
    .filter(goal => `${goal.name} ${goal.notes}`.toLowerCase().includes(query.trim().toLowerCase()))
    .sort((a, b) => a.targetDate.localeCompare(b.targetDate)), [data.savingsGoals, filter, query]);
  const active = data.savingsGoals.filter(goal => goal.status === 'active');
  const totalSaved = active.reduce((sum, goal) => sum + goal.savedAmount, 0);
  const totalTarget = active.reduce((sum, goal) => sum + goal.targetAmount, 0);
  const currency = data.preferences.currency;

  const archive = async (id: string) => {
    try {
      await archiveSavingsGoal(id);
      setMenuId(null);
    } catch {
      Alert.alert('Could not archive goal', 'Please try again.');
    }
  };

  const complete = async (id: string) => {
    try {
      await completeSavingsGoal(id);
      setMenuId(null);
    } catch {
      Alert.alert('Could not complete goal', 'Please try again.');
    }
  };

  const remove = async () => {
    if (!deleteId) return;
    try {
      await deleteSavingsGoal(deleteId);
    } catch {
      Alert.alert('Could not delete goal', 'Please try again.');
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
            <Text style={styles.eyebrow}>SAVE WITH INTENT</Text>
            <Text style={styles.headerTitle}>Goals</Text>
          </View>
          <TouchableOpacity style={styles.headerButton} onPress={() => navigation.navigate('AddSavingsGoal')}>
            <Icon name="plus" size={23} color="#D5F6E9" />
          </TouchableOpacity>
        </View>
        <View style={styles.overviewRow}>
          <View style={styles.overviewBlock}>
            <Text style={styles.overviewLabel}>SAVED</Text>
            <Text style={styles.overviewValue}>{formatCurrency(totalSaved, currency)}</Text>
          </View>
          <View style={styles.overviewDivider} />
          <View style={styles.overviewBlock}>
            <Text style={styles.overviewLabel}>TO GO</Text>
            <Text style={styles.overviewValue}>{formatCurrency(Math.max(0, totalTarget - totalSaved), currency)}</Text>
          </View>
          <View style={styles.overviewDivider} />
          <View style={styles.overviewBlock}>
            <Text style={styles.overviewLabel}>ACTIVE</Text>
            <Text style={styles.overviewValue}>{active.length}</Text>
          </View>
        </View>
      </View>

      <View style={styles.tools}>
        <View style={styles.searchBox}>
          <Icon name="magnify" size={20} color={Colors.textMuted} />
          <TextInput
            accessibilityLabel="Search savings goals"
            style={styles.searchInput}
            value={query}
            onChangeText={setQuery}
            placeholder="Search goals and notes"
            placeholderTextColor={Colors.textMuted}
          />
          {query ? (
            <TouchableOpacity onPress={() => setQuery('')}><Icon name="close-circle" size={19} color={Colors.textMuted} /></TouchableOpacity>
          ) : null}
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
          {goals.map(goal => {
            const percent = goal.targetAmount > 0 ? Math.min(100, goal.savedAmount / goal.targetAmount * 100) : 0;
            const forecast = insights?.goals.find(item => item.goalId === goal.id);
            const isOpen = menuId === goal.id;
            return (
              <View key={goal.id} style={styles.goalCard}>
                <TouchableOpacity
                  activeOpacity={0.82}
                  onPress={() => navigation.navigate('SavingsGoalDetail', {goalId: goal.id})}>
                  <View style={styles.goalTop}>
                    <View style={styles.goalIcon}><Icon name="flag-variant-outline" size={22} color={Colors.primaryDark} /></View>
                    <View style={styles.goalCopy}>
                      <Text style={styles.goalName} numberOfLines={1}>{goal.name}</Text>
                      <Text style={styles.goalDate}>Target {formatDate(goal.targetDate)}</Text>
                    </View>
                    <TouchableOpacity
                      accessibilityLabel={`Actions for ${goal.name}`}
                      hitSlop={10}
                      style={styles.menuButton}
                      onPress={() => setMenuId(isOpen ? null : goal.id)}>
                      <Icon name="dots-horizontal" size={22} color={Colors.textMuted} />
                    </TouchableOpacity>
                  </View>
                  <View style={styles.amountRow}>
                    <Text style={styles.savedAmount}>{formatCurrency(goal.savedAmount, currency)}</Text>
                    <Text style={styles.targetAmount}>of {formatCurrency(goal.targetAmount, currency)}</Text>
                    <Text style={styles.percent}>{Math.round(percent)}%</Text>
                  </View>
                  <ProgressBar progress={percent} height={7} showPercent={false} />
                  <View style={styles.metaRow}>
                    <Text style={styles.remaining}>{formatCurrency(Math.max(0, goal.targetAmount - goal.savedAmount), currency)} remaining</Text>
                    {forecast ? (
                      <Text style={[styles.probability, {color: forecast.risk === 'low' ? Colors.success : forecast.risk === 'medium' ? Colors.warning : Colors.error}]}>
                        {forecast.onTrackProbability}% on track • Estimated
                      </Text>
                    ) : <Text style={styles.pending}>Estimate pending</Text>}
                  </View>
                </TouchableOpacity>

                {isOpen ? (
                  <View style={styles.actionTray}>
                    <TouchableOpacity style={styles.action} onPress={() => navigation.navigate('LogContribution', {goalId: goal.id})}>
                      <Icon name="plus-circle-outline" size={20} color={Colors.primaryDark} /><Text style={styles.actionText}>Log</Text>
                    </TouchableOpacity>
                    <TouchableOpacity style={styles.action} onPress={() => navigation.navigate('EditSavingsGoal', {goalId: goal.id})}>
                      <Icon name="pencil-outline" size={20} color={Colors.secondary} /><Text style={styles.actionText}>Edit</Text>
                    </TouchableOpacity>
                    {goal.status === 'active' ? (
                      <TouchableOpacity style={styles.action} onPress={() => void complete(goal.id)}>
                        <Icon name="check-circle-outline" size={20} color={Colors.success} /><Text style={styles.actionText}>Complete</Text>
                      </TouchableOpacity>
                    ) : null}
                    <TouchableOpacity style={styles.action} onPress={() => void archive(goal.id)}>
                      <Icon name="archive-outline" size={20} color={Colors.textMuted} /><Text style={styles.actionText}>Archive</Text>
                    </TouchableOpacity>
                    <TouchableOpacity style={styles.action} onPress={() => setDeleteId(goal.id)}>
                      <Icon name="delete-outline" size={20} color={Colors.error} /><Text style={[styles.actionText, {color: Colors.error}]}>Delete</Text>
                    </TouchableOpacity>
                  </View>
                ) : null}
              </View>
            );
          })}

          {goals.length === 0 ? (
            <View style={styles.empty}>
              <View style={styles.emptyIcon}><Icon name="target" size={34} color={Colors.primary} /></View>
              <Text style={styles.emptyTitle}>{query ? 'No matching goals' : 'A goal makes progress visible'}</Text>
              <Text style={styles.emptyBody}>{query ? 'Try another search or filter.' : 'Add a target, choose a date, and start logging contributions.'}</Text>
              {!query ? (
                <TouchableOpacity style={styles.emptyButton} onPress={() => navigation.navigate('AddSavingsGoal')}>
                  <Text style={styles.emptyButtonText}>Create a goal</Text>
                </TouchableOpacity>
              ) : null}
            </View>
          ) : null}

          <TouchableOpacity style={styles.strategyCard} onPress={() => navigation.navigate('SavingsStrategy')}>
            <View style={styles.strategyIcon}><Icon name="map-marker-path" size={23} color={Colors.secondary} /></View>
            <View style={styles.goalCopy}>
              <Text style={styles.strategyTitle}>Explore savings strategies</Text>
              <Text style={styles.strategyBody}>Compare practical ways to build your plan.</Text>
            </View>
            <Icon name="chevron-right" size={22} color={Colors.textMuted} />
          </TouchableOpacity>

          <BannerAdComponent style={styles.ad} />
        </View>
      </SafeScrollView>

      <ConfirmDialog
        visible={deleteId !== null}
        title="Delete this goal?"
        message="The goal and its full contribution history will be deleted locally and from the next server snapshot."
        confirmLabel="Delete goal"
        cancelLabel="Keep goal"
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
  goalCard: {backgroundColor: Colors.surface, borderRadius: BorderRadius.lg, borderWidth: 1, borderColor: Colors.border, padding: 15, marginBottom: 10, ...Shadows.sm},
  goalTop: {flexDirection: 'row', alignItems: 'center'},
  goalIcon: {width: 42, height: 42, borderRadius: 14, backgroundColor: Colors.primaryFade, alignItems: 'center', justifyContent: 'center', marginRight: 11},
  goalCopy: {flex: 1},
  goalName: {...Typography.h4, color: Colors.text},
  goalDate: {...Typography.caption, color: Colors.textMuted, marginTop: 2},
  menuButton: {width: 34, height: 34, alignItems: 'center', justifyContent: 'center'},
  amountRow: {flexDirection: 'row', alignItems: 'baseline', marginTop: 14, marginBottom: 9},
  savedAmount: {fontSize: 19, fontWeight: '800', color: Colors.text},
  targetAmount: {...Typography.caption, color: Colors.textMuted, marginLeft: 5, flex: 1},
  percent: {fontSize: 13, fontWeight: '800', color: Colors.primaryDark},
  metaRow: {flexDirection: 'row', justifyContent: 'space-between', gap: 8, marginTop: 9},
  remaining: {...Typography.caption, color: Colors.textMuted},
  probability: {fontSize: 10, fontWeight: '700', textAlign: 'right'},
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
  strategyCard: {flexDirection: 'row', alignItems: 'center', backgroundColor: Colors.surface, borderWidth: 1, borderColor: Colors.border, borderRadius: BorderRadius.lg, padding: 14, marginTop: 4},
  strategyIcon: {width: 42, height: 42, borderRadius: 14, backgroundColor: Colors.secondaryFade, alignItems: 'center', justifyContent: 'center', marginRight: 11},
  strategyTitle: {...Typography.body, color: Colors.text, fontWeight: '700'},
  strategyBody: {...Typography.caption, color: Colors.textMuted, marginTop: 2},
  ad: {marginTop: 18},
});
