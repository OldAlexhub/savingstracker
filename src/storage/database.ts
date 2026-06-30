import AsyncStorage from '@react-native-async-storage/async-storage';
import {
  AppData,
  SavingsGoal,
  SavingsContribution,
  DebtAccount,
  DebtPayment,
  UserPreferences,
  AdState,
  ExportRecord,
} from '../types/index';

// ─── Storage Keys ────────────────────────────────────────────────────────────

const STORAGE_KEYS = {
  SAVINGS_GOALS: '@savings_tracker/savings_goals',
  CONTRIBUTIONS: '@savings_tracker/contributions',
  DEBT_ACCOUNTS: '@savings_tracker/debt_accounts',
  DEBT_PAYMENTS: '@savings_tracker/debt_payments',
  PREFERENCES: '@savings_tracker/preferences',
  AD_STATE: '@savings_tracker/ad_state',
  EXPORT_RECORDS: '@savings_tracker/export_records',
} as const;

// ─── Defaults ────────────────────────────────────────────────────────────────

const DEFAULT_PREFERENCES: UserPreferences = {
  currency: 'USD',
  defaultSavingsStrategy: 'fixed_monthly',
  defaultDebtStrategy: 'avalanche',
  lastExportDate: null,
};

const DEFAULT_AD_STATE: AdState = {
  lastInterstitialShownAt: null,
  interstitialShowCount: 0,
  appOpenCount: 0,
};

const DEFAULT_APP_DATA: AppData = {
  savingsGoals: [],
  contributions: [],
  debtAccounts: [],
  debtPayments: [],
  preferences: DEFAULT_PREFERENCES,
  adState: DEFAULT_AD_STATE,
  exportRecords: [],
};

// ─── ID Generation ───────────────────────────────────────────────────────────

export function generateId(): string {
  const timestamp = Date.now().toString(36);
  const randomPart = Math.random().toString(36).slice(2, 11);
  const extra = Math.random().toString(36).slice(2, 6);
  return `${timestamp}-${randomPart}-${extra}`;
}

// ─── JSON Helpers ─────────────────────────────────────────────────────────────

async function readJSON<T>(key: string, fallback: T): Promise<T> {
  try {
    const raw = await AsyncStorage.getItem(key);
    if (raw === null) {
      return fallback;
    }
    return JSON.parse(raw) as T;
  } catch (err) {
    console.warn(`[DB] Failed to read key "${key}":`, err);
    return fallback;
  }
}

async function writeJSON<T>(key: string, value: T): Promise<void> {
  try {
    await AsyncStorage.setItem(key, JSON.stringify(value));
  } catch (err) {
    console.warn(`[DB] Failed to write key "${key}":`, err);
  }
}

// ─── Load / Save All ─────────────────────────────────────────────────────────

export async function loadAllData(): Promise<AppData> {
  try {
    const [
      savingsGoals,
      contributions,
      debtAccounts,
      debtPayments,
      preferences,
      adState,
      exportRecords,
    ] = await Promise.all([
      readJSON<SavingsGoal[]>(STORAGE_KEYS.SAVINGS_GOALS, []),
      readJSON<SavingsContribution[]>(STORAGE_KEYS.CONTRIBUTIONS, []),
      readJSON<DebtAccount[]>(STORAGE_KEYS.DEBT_ACCOUNTS, []),
      readJSON<DebtPayment[]>(STORAGE_KEYS.DEBT_PAYMENTS, []),
      readJSON<UserPreferences>(STORAGE_KEYS.PREFERENCES, DEFAULT_PREFERENCES),
      readJSON<AdState>(STORAGE_KEYS.AD_STATE, DEFAULT_AD_STATE),
      readJSON<ExportRecord[]>(STORAGE_KEYS.EXPORT_RECORDS, []),
    ]);

    return {
      savingsGoals: Array.isArray(savingsGoals) ? savingsGoals : [],
      contributions: Array.isArray(contributions) ? contributions : [],
      debtAccounts: Array.isArray(debtAccounts) ? debtAccounts : [],
      debtPayments: Array.isArray(debtPayments) ? debtPayments : [],
      preferences: preferences ?? DEFAULT_PREFERENCES,
      adState: adState ?? DEFAULT_AD_STATE,
      exportRecords: Array.isArray(exportRecords) ? exportRecords : [],
    };
  } catch (err) {
    console.warn('[DB] loadAllData failed, returning defaults:', err);
    return { ...DEFAULT_APP_DATA };
  }
}

export async function saveAllData(data: AppData): Promise<void> {
  try {
    await Promise.all([
      writeJSON(STORAGE_KEYS.SAVINGS_GOALS, data.savingsGoals),
      writeJSON(STORAGE_KEYS.CONTRIBUTIONS, data.contributions),
      writeJSON(STORAGE_KEYS.DEBT_ACCOUNTS, data.debtAccounts),
      writeJSON(STORAGE_KEYS.DEBT_PAYMENTS, data.debtPayments),
      writeJSON(STORAGE_KEYS.PREFERENCES, data.preferences),
      writeJSON(STORAGE_KEYS.AD_STATE, data.adState),
      writeJSON(STORAGE_KEYS.EXPORT_RECORDS, data.exportRecords),
    ]);
  } catch (err) {
    console.warn('[DB] saveAllData failed:', err);
  }
}

// ─── Savings Goals ────────────────────────────────────────────────────────────

export async function saveSavingsGoal(goal: SavingsGoal): Promise<void> {
  try {
    const goals = await readJSON<SavingsGoal[]>(STORAGE_KEYS.SAVINGS_GOALS, []);
    const idx = goals.findIndex(g => g.id === goal.id);
    if (idx >= 0) {
      goals[idx] = goal;
    } else {
      goals.push(goal);
    }
    await writeJSON(STORAGE_KEYS.SAVINGS_GOALS, goals);
  } catch (err) {
    console.warn('[DB] saveSavingsGoal failed:', err);
  }
}

export async function deleteSavingsGoal(id: string): Promise<void> {
  try {
    const goals = await readJSON<SavingsGoal[]>(STORAGE_KEYS.SAVINGS_GOALS, []);
    const filtered = goals.filter(g => g.id !== id);
    await writeJSON(STORAGE_KEYS.SAVINGS_GOALS, filtered);
  } catch (err) {
    console.warn('[DB] deleteSavingsGoal failed:', err);
  }
}

// ─── Contributions ────────────────────────────────────────────────────────────

export async function saveContribution(contribution: SavingsContribution): Promise<void> {
  try {
    const list = await readJSON<SavingsContribution[]>(STORAGE_KEYS.CONTRIBUTIONS, []);
    const idx = list.findIndex(c => c.id === contribution.id);
    if (idx >= 0) {
      list[idx] = contribution;
    } else {
      list.push(contribution);
    }
    await writeJSON(STORAGE_KEYS.CONTRIBUTIONS, list);
  } catch (err) {
    console.warn('[DB] saveContribution failed:', err);
  }
}

export async function deleteContribution(id: string): Promise<void> {
  try {
    const list = await readJSON<SavingsContribution[]>(STORAGE_KEYS.CONTRIBUTIONS, []);
    const filtered = list.filter(c => c.id !== id);
    await writeJSON(STORAGE_KEYS.CONTRIBUTIONS, filtered);
  } catch (err) {
    console.warn('[DB] deleteContribution failed:', err);
  }
}

// ─── Debt Accounts ────────────────────────────────────────────────────────────

export async function saveDebtAccount(debt: DebtAccount): Promise<void> {
  try {
    const list = await readJSON<DebtAccount[]>(STORAGE_KEYS.DEBT_ACCOUNTS, []);
    const idx = list.findIndex(d => d.id === debt.id);
    if (idx >= 0) {
      list[idx] = debt;
    } else {
      list.push(debt);
    }
    await writeJSON(STORAGE_KEYS.DEBT_ACCOUNTS, list);
  } catch (err) {
    console.warn('[DB] saveDebtAccount failed:', err);
  }
}

export async function deleteDebtAccount(id: string): Promise<void> {
  try {
    const list = await readJSON<DebtAccount[]>(STORAGE_KEYS.DEBT_ACCOUNTS, []);
    const filtered = list.filter(d => d.id !== id);
    await writeJSON(STORAGE_KEYS.DEBT_ACCOUNTS, filtered);
  } catch (err) {
    console.warn('[DB] deleteDebtAccount failed:', err);
  }
}

// ─── Debt Payments ────────────────────────────────────────────────────────────

export async function saveDebtPayment(payment: DebtPayment): Promise<void> {
  try {
    const list = await readJSON<DebtPayment[]>(STORAGE_KEYS.DEBT_PAYMENTS, []);
    const idx = list.findIndex(p => p.id === payment.id);
    if (idx >= 0) {
      list[idx] = payment;
    } else {
      list.push(payment);
    }
    await writeJSON(STORAGE_KEYS.DEBT_PAYMENTS, list);
  } catch (err) {
    console.warn('[DB] saveDebtPayment failed:', err);
  }
}

export async function deleteDebtPayment(id: string): Promise<void> {
  try {
    const list = await readJSON<DebtPayment[]>(STORAGE_KEYS.DEBT_PAYMENTS, []);
    const filtered = list.filter(p => p.id !== id);
    await writeJSON(STORAGE_KEYS.DEBT_PAYMENTS, filtered);
  } catch (err) {
    console.warn('[DB] deleteDebtPayment failed:', err);
  }
}

// ─── Preferences ─────────────────────────────────────────────────────────────

export async function savePreferences(prefs: UserPreferences): Promise<void> {
  await writeJSON(STORAGE_KEYS.PREFERENCES, prefs);
}

// ─── Ad State ────────────────────────────────────────────────────────────────

export async function saveAdState(state: AdState): Promise<void> {
  await writeJSON(STORAGE_KEYS.AD_STATE, state);
}

// ─── Export Records ──────────────────────────────────────────────────────────

export async function saveExportRecord(record: ExportRecord): Promise<void> {
  try {
    const list = await readJSON<ExportRecord[]>(STORAGE_KEYS.EXPORT_RECORDS, []);
    list.push(record);
    // Keep only the last 50 export records
    const trimmed = list.slice(-50);
    await writeJSON(STORAGE_KEYS.EXPORT_RECORDS, trimmed);
  } catch (err) {
    console.warn('[DB] saveExportRecord failed:', err);
  }
}

// ─── Clear All ───────────────────────────────────────────────────────────────

export async function clearAllData(): Promise<void> {
  try {
    await AsyncStorage.multiRemove(Object.values(STORAGE_KEYS));
  } catch (err) {
    console.warn('[DB] clearAllData failed:', err);
  }
}
