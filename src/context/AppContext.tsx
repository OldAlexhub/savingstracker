import React, {
  createContext,
  useContext,
  useEffect,
  useState,
  useCallback,
  ReactNode,
} from 'react';
import {
  AppData,
  SavingsGoal,
  SavingsContribution,
  DebtAccount,
  DebtPayment,
  UserPreferences,
} from '../types/index';
import {
  loadAllData,
  saveSavingsGoal,
  deleteSavingsGoal as dbDeleteGoal,
  saveContribution,
  deleteContribution as dbDeleteContribution,
  saveDebtAccount,
  deleteDebtAccount as dbDeleteDebt,
  saveDebtPayment,
  deleteDebtPayment as dbDeletePayment,
  savePreferences,
  clearAllData as dbClearAll,
  generateId,
} from '../storage/database';
import {
  cancelSavingsReminder,
  scheduleSavingsReminder,
} from '../utils/reminders';

// ─── Context Value Type ───────────────────────────────────────────────────────

interface AppContextValue {
  data: AppData;
  loading: boolean;
  error: string | null;

  // Savings Goals
  addSavingsGoal: (goal: Omit<SavingsGoal, 'id' | 'createdAt' | 'updatedAt'>) => Promise<string>;
  updateSavingsGoal: (id: string, updates: Partial<SavingsGoal>) => Promise<void>;
  deleteSavingsGoal: (id: string) => Promise<void>;
  archiveSavingsGoal: (id: string) => Promise<void>;
  completeSavingsGoal: (id: string) => Promise<void>;

  // Contributions
  addContribution: (contribution: Omit<SavingsContribution, 'id' | 'createdAt'>) => Promise<void>;
  deleteContribution: (id: string) => Promise<void>;

  // Debt Accounts
  addDebtAccount: (debt: Omit<DebtAccount, 'id' | 'createdAt' | 'updatedAt'>) => Promise<string>;
  updateDebtAccount: (id: string, updates: Partial<DebtAccount>) => Promise<void>;
  deleteDebtAccount: (id: string) => Promise<void>;
  archiveDebtAccount: (id: string) => Promise<void>;

  // Debt Payments
  addDebtPayment: (payment: Omit<DebtPayment, 'id' | 'createdAt'>) => Promise<void>;
  deleteDebtPayment: (id: string) => Promise<void>;

  // Preferences
  updatePreferences: (prefs: Partial<UserPreferences>) => Promise<void>;

  // Utility
  clearAllData: () => Promise<void>;
  refreshData: () => Promise<void>;
}

// ─── Default Data ─────────────────────────────────────────────────────────────

const DEFAULT_PREFERENCES: UserPreferences = {
  currency: 'USD',
  defaultSavingsStrategy: 'fixed_monthly',
  defaultDebtStrategy: 'avalanche',
  lastExportDate: null,
};

const DEFAULT_DATA: AppData = {
  savingsGoals: [],
  contributions: [],
  debtAccounts: [],
  debtPayments: [],
  preferences: DEFAULT_PREFERENCES,
  adState: {
    lastInterstitialShownAt: null,
    interstitialShowCount: 0,
    appOpenCount: 0,
  },
  exportRecords: [],
};

// ─── Context ──────────────────────────────────────────────────────────────────

const AppContext = createContext<AppContextValue | null>(null);

// ─── Provider ─────────────────────────────────────────────────────────────────

interface AppProviderProps {
  children: ReactNode;
}

export function AppProvider({ children }: AppProviderProps): React.JSX.Element {
  const [data, setData] = useState<AppData>(DEFAULT_DATA);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  const nowISO = (): string => new Date().toISOString();

  // ── Load on mount ──────────────────────────────────────────────────────────

  const refreshData = useCallback(async (): Promise<void> => {
    try {
      setLoading(true);
      setError(null);
      const loaded = await loadAllData();
      setData(loaded);
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Failed to load data.';
      setError(msg);
      console.warn('[AppContext] refreshData error:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    refreshData();
  }, [refreshData]);

  // ── Savings Goals ──────────────────────────────────────────────────────────

  const addSavingsGoal = useCallback(
    async (goalInput: Omit<SavingsGoal, 'id' | 'createdAt' | 'updatedAt'>): Promise<string> => {
      const id = generateId();
      const timestamp = nowISO();
      const goal: SavingsGoal = {
        ...goalInput,
        id,
        createdAt: timestamp,
        updatedAt: timestamp,
      };
      await saveSavingsGoal(goal);
      scheduleSavingsReminder(goal).catch(err =>
        console.warn('[AppContext] addSavingsGoal reminder error:', err),
      );
      setData(prev => ({
        ...prev,
        savingsGoals: [...prev.savingsGoals, goal],
      }));
      return id;
    },
    [],
  );

  const updateSavingsGoal = useCallback(
    async (id: string, updates: Partial<SavingsGoal>): Promise<void> => {
      const timestamp = nowISO();
      setData(prev => {
        const idx = prev.savingsGoals.findIndex(g => g.id === id);
        if (idx < 0) {
          return prev;
        }
        const updated: SavingsGoal = {
          ...prev.savingsGoals[idx],
          ...updates,
          id,
          updatedAt: timestamp,
        };
        const goals = [...prev.savingsGoals];
        goals[idx] = updated;
        saveSavingsGoal(updated).catch(err =>
          console.warn('[AppContext] updateSavingsGoal persist error:', err),
        );
        scheduleSavingsReminder(updated).catch(err =>
          console.warn('[AppContext] updateSavingsGoal reminder error:', err),
        );
        return { ...prev, savingsGoals: goals };
      });
    },
    [],
  );

  const deleteSavingsGoal = useCallback(async (id: string): Promise<void> => {
    await dbDeleteGoal(id);
    cancelSavingsReminder(id).catch(err =>
      console.warn('[AppContext] deleteSavingsGoal reminder error:', err),
    );
    setData(prev => ({
      ...prev,
      savingsGoals: prev.savingsGoals.filter(g => g.id !== id),
      contributions: prev.contributions.filter(c => c.goalId !== id),
    }));
  }, []);

  const archiveSavingsGoal = useCallback(
    async (id: string): Promise<void> => {
      await updateSavingsGoal(id, { status: 'archived' });
    },
    [updateSavingsGoal],
  );

  const completeSavingsGoal = useCallback(
    async (id: string): Promise<void> => {
      await updateSavingsGoal(id, { status: 'completed' });
    },
    [updateSavingsGoal],
  );

  // ── Contributions ──────────────────────────────────────────────────────────

  const addContribution = useCallback(
    async (contribInput: Omit<SavingsContribution, 'id' | 'createdAt'>): Promise<void> => {
      const id = generateId();
      const timestamp = nowISO();
      const contribution: SavingsContribution = {
        ...contribInput,
        id,
        createdAt: timestamp,
      };

      await saveContribution(contribution);

      setData(prev => {
        const goals = prev.savingsGoals.map(g => {
          if (g.id !== contribution.goalId) {
            return g;
          }
          const updatedGoal: SavingsGoal = {
            ...g,
            savedAmount: g.savedAmount + contribution.amount,
            updatedAt: timestamp,
          };
          saveSavingsGoal(updatedGoal).catch(err =>
            console.warn('[AppContext] addContribution goal persist error:', err),
          );
          return updatedGoal;
        });

        return {
          ...prev,
          savingsGoals: goals,
          contributions: [...prev.contributions, contribution],
        };
      });
    },
    [],
  );

  const deleteContribution = useCallback(async (id: string): Promise<void> => {
    const timestamp = nowISO();
    setData(prev => {
      const contribution = prev.contributions.find(c => c.id === id);
      if (!contribution) {
        return prev;
      }

      const goals = prev.savingsGoals.map(g => {
        if (g.id !== contribution.goalId) {
          return g;
        }
        const updatedGoal: SavingsGoal = {
          ...g,
          savedAmount: Math.max(0, g.savedAmount - contribution.amount),
          updatedAt: timestamp,
        };
        saveSavingsGoal(updatedGoal).catch(err =>
          console.warn('[AppContext] deleteContribution goal persist error:', err),
        );
        return updatedGoal;
      });

      dbDeleteContribution(id).catch(err =>
        console.warn('[AppContext] deleteContribution persist error:', err),
      );

      return {
        ...prev,
        savingsGoals: goals,
        contributions: prev.contributions.filter(c => c.id !== id),
      };
    });
  }, []);

  // ── Debt Accounts ──────────────────────────────────────────────────────────

  const addDebtAccount = useCallback(
    async (debtInput: Omit<DebtAccount, 'id' | 'createdAt' | 'updatedAt'>): Promise<string> => {
      const id = generateId();
      const timestamp = nowISO();
      const debt: DebtAccount = {
        ...debtInput,
        id,
        createdAt: timestamp,
        updatedAt: timestamp,
      };
      await saveDebtAccount(debt);
      setData(prev => ({
        ...prev,
        debtAccounts: [...prev.debtAccounts, debt],
      }));
      return id;
    },
    [],
  );

  const updateDebtAccount = useCallback(
    async (id: string, updates: Partial<DebtAccount>): Promise<void> => {
      const timestamp = nowISO();
      setData(prev => {
        const idx = prev.debtAccounts.findIndex(d => d.id === id);
        if (idx < 0) {
          return prev;
        }
        const updated: DebtAccount = {
          ...prev.debtAccounts[idx],
          ...updates,
          id,
          updatedAt: timestamp,
        };
        const debts = [...prev.debtAccounts];
        debts[idx] = updated;
        saveDebtAccount(updated).catch(err =>
          console.warn('[AppContext] updateDebtAccount persist error:', err),
        );
        return { ...prev, debtAccounts: debts };
      });
    },
    [],
  );

  const deleteDebtAccount = useCallback(async (id: string): Promise<void> => {
    await dbDeleteDebt(id);
    setData(prev => ({
      ...prev,
      debtAccounts: prev.debtAccounts.filter(d => d.id !== id),
      debtPayments: prev.debtPayments.filter(p => p.debtId !== id),
    }));
  }, []);

  const archiveDebtAccount = useCallback(
    async (id: string): Promise<void> => {
      await updateDebtAccount(id, { status: 'archived' });
    },
    [updateDebtAccount],
  );

  // ── Debt Payments ──────────────────────────────────────────────────────────

  const addDebtPayment = useCallback(
    async (paymentInput: Omit<DebtPayment, 'id' | 'createdAt'>): Promise<void> => {
      const id = generateId();
      const timestamp = nowISO();
      const payment: DebtPayment = {
        ...paymentInput,
        id,
        createdAt: timestamp,
      };

      await saveDebtPayment(payment);

      setData(prev => {
        const debts = prev.debtAccounts.map(d => {
          if (d.id !== payment.debtId) {
            return d;
          }
          const newBalance = Math.max(0, d.currentBalance - payment.amount);
          const newStatus = newBalance <= 0 ? 'paid_off' : d.status;
          const updatedDebt: DebtAccount = {
            ...d,
            currentBalance: newBalance,
            status: newStatus,
            updatedAt: timestamp,
          };
          saveDebtAccount(updatedDebt).catch(err =>
            console.warn('[AppContext] addDebtPayment debt persist error:', err),
          );
          return updatedDebt;
        });

        return {
          ...prev,
          debtAccounts: debts,
          debtPayments: [...prev.debtPayments, payment],
        };
      });
    },
    [],
  );

  const deleteDebtPayment = useCallback(async (id: string): Promise<void> => {
    const timestamp = nowISO();
    setData(prev => {
      const payment = prev.debtPayments.find(p => p.id === id);
      if (!payment) {
        return prev;
      }

      const debts = prev.debtAccounts.map(d => {
        if (d.id !== payment.debtId) {
          return d;
        }
        const restoredBalance = d.currentBalance + payment.amount;
        // If the debt had been marked paid_off due to this payment, revert to active
        const restoredStatus = d.status === 'paid_off' ? 'active' : d.status;
        const updatedDebt: DebtAccount = {
          ...d,
          currentBalance: restoredBalance,
          status: restoredStatus,
          updatedAt: timestamp,
        };
        saveDebtAccount(updatedDebt).catch(err =>
          console.warn('[AppContext] deleteDebtPayment debt persist error:', err),
        );
        return updatedDebt;
      });

      dbDeletePayment(id).catch(err =>
        console.warn('[AppContext] deleteDebtPayment persist error:', err),
      );

      return {
        ...prev,
        debtAccounts: debts,
        debtPayments: prev.debtPayments.filter(p => p.id !== id),
      };
    });
  }, []);

  // ── Preferences ────────────────────────────────────────────────────────────

  const updatePreferences = useCallback(
    async (prefs: Partial<UserPreferences>): Promise<void> => {
      setData(prev => {
        const updated: UserPreferences = { ...prev.preferences, ...prefs };
        savePreferences(updated).catch(err =>
          console.warn('[AppContext] updatePreferences persist error:', err),
        );
        return { ...prev, preferences: updated };
      });
    },
    [],
  );

  // ── Clear All ──────────────────────────────────────────────────────────────

  const clearAllData = useCallback(async (): Promise<void> => {
    await Promise.all(
      data.savingsGoals.map(goal =>
        cancelSavingsReminder(goal.id).catch(err =>
          console.warn('[AppContext] clearAllData reminder error:', err),
        ),
      ),
    );
    await dbClearAll();
    const fresh = await loadAllData();
    setData(fresh);
  }, [data.savingsGoals]);

  // ── Context Value ──────────────────────────────────────────────────────────

  const contextValue: AppContextValue = {
    data,
    loading,
    error,
    addSavingsGoal,
    updateSavingsGoal,
    deleteSavingsGoal,
    archiveSavingsGoal,
    completeSavingsGoal,
    addContribution,
    deleteContribution,
    addDebtAccount,
    updateDebtAccount,
    deleteDebtAccount,
    archiveDebtAccount,
    addDebtPayment,
    deleteDebtPayment,
    updatePreferences,
    clearAllData,
    refreshData,
  };

  return <AppContext.Provider value={contextValue}>{children}</AppContext.Provider>;
}

// ─── Hook ─────────────────────────────────────────────────────────────────────

export function useApp(): AppContextValue {
  const ctx = useContext(AppContext);
  if (ctx === null) {
    throw new Error('useApp must be used within an AppProvider.');
  }
  return ctx;
}

export default AppContext;
