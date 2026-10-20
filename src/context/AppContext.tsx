import React, {
  createContext,
  type ReactNode,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
} from 'react';
import DeviceInfo from 'react-native-device-info';

import type {
  AnalyticsEventName,
  AppData,
  DebtAccount,
  DebtPayment,
  RemoteConfig,
  SavingsContribution,
  SavingsGoal,
  ServerInsights,
  UserPreferences,
} from '../types';
import {
  clearAllData as clearLocalData,
  DEFAULT_APP_DATA,
  generateId,
  loadAllData,
  mutateAppData,
  queueAnalyticsEvents,
} from '../storage/database';
import {
  DEFAULT_REMOTE_CONFIG,
  purgeRemoteInstallation,
  runWhatIf as requestWhatIf,
  subscribeToConnectivity,
  syncNow,
} from '../services/sync';
import {cancelSavingsReminder, scheduleSavingsReminder} from '../utils/reminders';

export const DATA_DISCLOSURE_VERSION = '2027.1';

type SyncStatus = 'idle' | 'syncing' | 'synced' | 'pending' | 'offline';

interface AppContextValue {
  data: AppData;
  loading: boolean;
  error: string | null;
  syncStatus: SyncStatus;
  pendingSyncCount: number;
  lastSyncedAt: string | null;
  remoteConfig: RemoteConfig;
  insights: ServerInsights | null;
  addSavingsGoal: (goal: Omit<SavingsGoal, 'id' | 'createdAt' | 'updatedAt'>) => Promise<string>;
  updateSavingsGoal: (id: string, updates: Partial<SavingsGoal>) => Promise<void>;
  deleteSavingsGoal: (id: string) => Promise<void>;
  archiveSavingsGoal: (id: string) => Promise<void>;
  completeSavingsGoal: (id: string) => Promise<void>;
  addContribution: (item: Omit<SavingsContribution, 'id' | 'createdAt'>) => Promise<void>;
  updateContribution: (id: string, updates: Partial<SavingsContribution>) => Promise<void>;
  deleteContribution: (id: string) => Promise<void>;
  addDebtAccount: (debt: Omit<DebtAccount, 'id' | 'createdAt' | 'updatedAt'>) => Promise<string>;
  updateDebtAccount: (id: string, updates: Partial<DebtAccount>) => Promise<void>;
  deleteDebtAccount: (id: string) => Promise<void>;
  archiveDebtAccount: (id: string) => Promise<void>;
  addDebtPayment: (item: Omit<DebtPayment, 'id' | 'createdAt'>) => Promise<void>;
  updateDebtPayment: (id: string, updates: Partial<DebtPayment>) => Promise<void>;
  deleteDebtPayment: (id: string) => Promise<void>;
  updatePreferences: (preferences: Partial<UserPreferences>) => Promise<void>;
  acceptDataCollection: () => Promise<void>;
  clearAllData: () => Promise<void>;
  refreshData: () => Promise<void>;
  refreshInsights: () => Promise<void>;
  runScenario: (
    input: {type: 'goal_contribution' | 'debt_extra_payment'; recordId: string; monthlyAmount: number},
  ) => Promise<Record<string, number | string | null> | null>;
  trackEvent: (
    name: AnalyticsEventName,
    screen?: string,
    properties?: Record<string, string | number | boolean | null>,
  ) => Promise<void>;
  recordInterstitialShown: () => Promise<void>;
}

const AppContext = createContext<AppContextValue | null>(null);
const APP_VERSION = DeviceInfo.getVersion();

function now(): string {
  return new Date().toISOString();
}

function recalculateGoalBalance(data: AppData, goalId: string): AppData {
  const goal = data.savingsGoals.find(item => item.id === goalId);
  if (!goal) {
    return data;
  }
  const contributed = data.contributions
    .filter(item => item.goalId === goalId)
    .reduce((sum, item) => sum + item.amount, 0);
  return {
    ...data,
    savingsGoals: data.savingsGoals.map(item =>
      item.id === goalId
        ? {...item, savedAmount: item.startingAmount + contributed, updatedAt: now()}
        : item,
    ),
  };
}

function recalculateDebtBalance(data: AppData, debtId: string): AppData {
  const debt = data.debtAccounts.find(item => item.id === debtId);
  if (!debt) {
    return data;
  }
  const paid = data.debtPayments
    .filter(item => item.debtId === debtId)
    .reduce((sum, item) => sum + item.amount, 0);
  const currentBalance = Math.max(0, debt.originalBalance - paid);
  return {
    ...data,
    debtAccounts: data.debtAccounts.map(item =>
      item.id === debtId
        ? {
            ...item,
            currentBalance,
            status: currentBalance === 0 ? 'paid_off' : item.status === 'paid_off' ? 'active' : item.status,
            updatedAt: now(),
          }
        : item,
    ),
  };
}

export function AppProvider({children}: {children: ReactNode}): React.JSX.Element {
  const [data, setData] = useState<AppData>(DEFAULT_APP_DATA);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [syncStatus, setSyncStatus] = useState<SyncStatus>('idle');
  const [pendingSyncCount, setPendingSyncCount] = useState(0);
  const [lastSyncedAt, setLastSyncedAt] = useState<string | null>(null);
  const [remoteConfig, setRemoteConfig] = useState(DEFAULT_REMOTE_CONFIG);
  const [insights, setInsights] = useState<ServerInsights | null>(null);
  const dataRef = useRef(data);
  const syncingRef = useRef(false);

  const publishData = useCallback((next: AppData) => {
    dataRef.current = next;
    setData(next);
  }, []);

  const performSync = useCallback(async (snapshot: AppData) => {
    if (!snapshot.preferences.dataCollectionAcceptedAt || syncingRef.current) {
      return;
    }
    syncingRef.current = true;
    setSyncStatus('syncing');
    try {
      const result = await syncNow(snapshot);
      setSyncStatus(result.status);
      setPendingSyncCount(result.pendingCount);
      if (result.config) {
        setRemoteConfig(result.config);
      }
      if (result.insights) {
        setInsights(result.insights);
      }
      if (result.lastSyncedAt) {
        setLastSyncedAt(result.lastSyncedAt);
      }
    } catch {
      setSyncStatus('pending');
    } finally {
      syncingRef.current = false;
    }
  }, []);

  const refreshData = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const loaded = await loadAllData();
      publishData(loaded);
      if (loaded.preferences.dataCollectionAcceptedAt) {
        await queueAnalyticsEvents([
          {name: 'app_opened', appVersion: APP_VERSION},
          {name: 'session_started', appVersion: APP_VERSION},
        ]);
        void performSync(loaded);
      }
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : 'Unable to load your data.');
    } finally {
      setLoading(false);
    }
  }, [performSync, publishData]);

  useEffect(() => {
    void refreshData();
    const unsubscribe = subscribeToConnectivity(() => {
      void performSync(dataRef.current);
    });
    return unsubscribe;
  }, [performSync, refreshData]);

  const commit = useCallback(
    async (
      mutator: (current: AppData) => AppData,
      name: AnalyticsEventName,
      properties?: Record<string, string | number | boolean | null>,
    ) => {
      const next = await mutateAppData(mutator, APP_VERSION, [{name, appVersion: APP_VERSION, properties}]);
      publishData(next);
      void performSync(next);
      return next;
    },
    [performSync, publishData],
  );

  const addSavingsGoal = useCallback(async (input: Omit<SavingsGoal, 'id' | 'createdAt' | 'updatedAt'>) => {
    const id = generateId();
    const timestamp = now();
    const goal: SavingsGoal = {...input, id, createdAt: timestamp, updatedAt: timestamp};
    await commit(current => ({...current, savingsGoals: [...current.savingsGoals, goal]}), 'goal_created');
    if (goal.reminderEnabled) {
      await scheduleSavingsReminder(goal);
    }
    return id;
  }, [commit]);

  const updateSavingsGoal = useCallback(async (id: string, updates: Partial<SavingsGoal>) => {
    let updated: SavingsGoal | null = null;
    await commit(current => ({
      ...current,
      savingsGoals: current.savingsGoals.map(item => {
        if (item.id !== id) {
          return item;
        }
        updated = {...item, ...updates, id, updatedAt: now()};
        return updated;
      }),
    }), 'goal_updated');
    if (updated) {
      await scheduleSavingsReminder(updated);
    }
  }, [commit]);

  const deleteSavingsGoal = useCallback(async (id: string) => {
    await commit(current => ({
      ...current,
      savingsGoals: current.savingsGoals.filter(item => item.id !== id),
      contributions: current.contributions.filter(item => item.goalId !== id),
    }), 'goal_deleted');
    await cancelSavingsReminder(id);
  }, [commit]);

  const archiveSavingsGoal = useCallback(async (id: string) => {
    await commit(current => ({
      ...current,
      savingsGoals: current.savingsGoals.map(item =>
        item.id === id ? {...item, status: 'archived', updatedAt: now()} : item,
      ),
    }), 'goal_archived');
  }, [commit]);

  const completeSavingsGoal = useCallback(async (id: string) => {
    await commit(current => ({
      ...current,
      savingsGoals: current.savingsGoals.map(item =>
        item.id === id ? {...item, status: 'completed', updatedAt: now()} : item,
      ),
    }), 'goal_completed');
  }, [commit]);

  const addContribution = useCallback(async (input: Omit<SavingsContribution, 'id' | 'createdAt'>) => {
    const contribution: SavingsContribution = {...input, id: generateId(), createdAt: now()};
    await commit(current => recalculateGoalBalance({
      ...current,
      contributions: [...current.contributions, contribution],
    }, contribution.goalId), 'contribution_logged');
  }, [commit]);

  const updateContribution = useCallback(async (id: string, updates: Partial<SavingsContribution>) => {
    await commit(current => {
      const existing = current.contributions.find(item => item.id === id);
      if (!existing) {
        return current;
      }
      const updated = {...existing, ...updates, id};
      let next = {...current, contributions: current.contributions.map(item => item.id === id ? updated : item)};
      next = recalculateGoalBalance(next, existing.goalId);
      return updated.goalId === existing.goalId ? next : recalculateGoalBalance(next, updated.goalId);
    }, 'goal_updated', {change: 'contribution'});
  }, [commit]);

  const deleteContribution = useCallback(async (id: string) => {
    await commit(current => {
      const existing = current.contributions.find(item => item.id === id);
      if (!existing) {
        return current;
      }
      return recalculateGoalBalance({
        ...current,
        contributions: current.contributions.filter(item => item.id !== id),
      }, existing.goalId);
    }, 'contribution_deleted');
  }, [commit]);

  const addDebtAccount = useCallback(async (input: Omit<DebtAccount, 'id' | 'createdAt' | 'updatedAt'>) => {
    const id = generateId();
    const timestamp = now();
    const debt: DebtAccount = {...input, id, createdAt: timestamp, updatedAt: timestamp};
    await commit(current => ({...current, debtAccounts: [...current.debtAccounts, debt]}), 'debt_created');
    return id;
  }, [commit]);

  const updateDebtAccount = useCallback(async (id: string, updates: Partial<DebtAccount>) => {
    await commit(current => ({
      ...current,
      debtAccounts: current.debtAccounts.map(item =>
        item.id === id ? {...item, ...updates, id, updatedAt: now()} : item,
      ),
    }), 'debt_updated');
  }, [commit]);

  const deleteDebtAccount = useCallback(async (id: string) => {
    await commit(current => ({
      ...current,
      debtAccounts: current.debtAccounts.filter(item => item.id !== id),
      debtPayments: current.debtPayments.filter(item => item.debtId !== id),
    }), 'debt_deleted');
  }, [commit]);

  const archiveDebtAccount = useCallback(async (id: string) => {
    await commit(current => ({
      ...current,
      debtAccounts: current.debtAccounts.map(item =>
        item.id === id ? {...item, status: 'archived', updatedAt: now()} : item,
      ),
    }), 'debt_archived');
  }, [commit]);

  const addDebtPayment = useCallback(async (input: Omit<DebtPayment, 'id' | 'createdAt'>) => {
    const payment: DebtPayment = {...input, id: generateId(), createdAt: now()};
    await commit(current => recalculateDebtBalance({
      ...current,
      debtPayments: [...current.debtPayments, payment],
    }, payment.debtId), 'payment_logged');
  }, [commit]);

  const updateDebtPayment = useCallback(async (id: string, updates: Partial<DebtPayment>) => {
    await commit(current => {
      const existing = current.debtPayments.find(item => item.id === id);
      if (!existing) {
        return current;
      }
      const updated = {...existing, ...updates, id};
      let next = {...current, debtPayments: current.debtPayments.map(item => item.id === id ? updated : item)};
      next = recalculateDebtBalance(next, existing.debtId);
      return updated.debtId === existing.debtId ? next : recalculateDebtBalance(next, updated.debtId);
    }, 'debt_updated', {change: 'payment'});
  }, [commit]);

  const deleteDebtPayment = useCallback(async (id: string) => {
    await commit(current => {
      const existing = current.debtPayments.find(item => item.id === id);
      if (!existing) {
        return current;
      }
      return recalculateDebtBalance({
        ...current,
        debtPayments: current.debtPayments.filter(item => item.id !== id),
      }, existing.debtId);
    }, 'payment_deleted');
  }, [commit]);

  const updatePreferences = useCallback(async (preferences: Partial<UserPreferences>) => {
    const next = await mutateAppData(current => ({
      ...current,
      preferences: {...current.preferences, ...preferences},
    }), APP_VERSION);
    publishData(next);
    void performSync(next);
  }, [performSync, publishData]);

  const acceptDataCollection = useCallback(async () => {
    const acceptedAt = now();
    const next = await mutateAppData(current => ({
      ...current,
      preferences: {
        ...current.preferences,
        dataCollectionAcceptedAt: acceptedAt,
        dataDisclosureVersion: DATA_DISCLOSURE_VERSION,
      },
    }), APP_VERSION, [{name: 'onboarding_completed', appVersion: APP_VERSION}]);
    publishData(next);
    void performSync(next);
  }, [performSync, publishData]);

  const clearAllData = useCallback(async () => {
    await purgeRemoteInstallation();
    await Promise.all(dataRef.current.savingsGoals.map(goal => cancelSavingsReminder(goal.id)));
    await clearLocalData();
    const empty = await loadAllData();
    publishData(empty);
    setInsights(null);
    setPendingSyncCount(0);
    setSyncStatus('idle');
    setLastSyncedAt(null);
  }, [publishData]);

  const refreshInsights = useCallback(async () => {
    await performSync(dataRef.current);
  }, [performSync]);

  const runScenario = useCallback(async (input: {
    type: 'goal_contribution' | 'debt_extra_payment';
    recordId: string;
    monthlyAmount: number;
  }) => {
    const response = await requestWhatIf(dataRef.current, input);
    return response?.result ?? null;
  }, []);

  const trackEvent = useCallback(async (
    name: AnalyticsEventName,
    screen?: string,
    properties?: Record<string, string | number | boolean | null>,
  ) => {
    await queueAnalyticsEvents([{name, appVersion: APP_VERSION, screen, properties}]);
    void performSync(dataRef.current);
  }, [performSync]);

  const recordInterstitialShown = useCallback(async () => {
    const date = new Date().toISOString().slice(0, 10);
    const next = await mutateAppData(current => ({
      ...current,
      adState: {
        ...current.adState,
        lastInterstitialShownAt: Date.now(),
        interstitialShowCount: current.adState.interstitialShowCount + 1,
        dailyInterstitialDate: date,
        dailyInterstitialCount:
          current.adState.dailyInterstitialDate === date
            ? current.adState.dailyInterstitialCount + 1
            : 1,
      },
    }), APP_VERSION, [{
      name: 'ad_impression',
      appVersion: APP_VERSION,
      properties: {format: 'interstitial', placement: 'completion'},
    }]);
    publishData(next);
    void performSync(next);
  }, [performSync, publishData]);

  const value = useMemo<AppContextValue>(() => ({
    data,
    loading,
    error,
    syncStatus,
    pendingSyncCount,
    lastSyncedAt,
    remoteConfig,
    insights,
    addSavingsGoal,
    updateSavingsGoal,
    deleteSavingsGoal,
    archiveSavingsGoal,
    completeSavingsGoal,
    addContribution,
    updateContribution,
    deleteContribution,
    addDebtAccount,
    updateDebtAccount,
    deleteDebtAccount,
    archiveDebtAccount,
    addDebtPayment,
    updateDebtPayment,
    deleteDebtPayment,
    updatePreferences,
    acceptDataCollection,
    clearAllData,
    refreshData,
    refreshInsights,
    runScenario,
    trackEvent,
    recordInterstitialShown,
  }), [
    data, loading, error, syncStatus, pendingSyncCount, lastSyncedAt, remoteConfig, insights,
    addSavingsGoal, updateSavingsGoal, deleteSavingsGoal, archiveSavingsGoal, completeSavingsGoal,
    addContribution, updateContribution, deleteContribution, addDebtAccount, updateDebtAccount,
    deleteDebtAccount, archiveDebtAccount, addDebtPayment, updateDebtPayment, deleteDebtPayment,
    updatePreferences, acceptDataCollection, clearAllData, refreshData, refreshInsights, runScenario,
    trackEvent, recordInterstitialShown,
  ]);

  return <AppContext.Provider value={value}>{children}</AppContext.Provider>;
}

export function useApp(): AppContextValue {
  const context = useContext(AppContext);
  if (!context) {
    throw new Error('useApp must be used within AppProvider.');
  }
  return context;
}

export default AppContext;
