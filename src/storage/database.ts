import 'react-native-get-random-values';

import AsyncStorage from '@react-native-async-storage/async-storage';
import * as Keychain from 'react-native-keychain';
import {createMMKV, type MMKV} from 'react-native-mmkv';
import {v4 as uuidv4} from 'uuid';

import type {
  AdState,
  AnalyticsEvent,
  AnalyticsEventName,
  AppData,
  DebtAccount,
  DebtPayment,
  ExportRecord,
  SavingsContribution,
  SavingsGoal,
  SyncOutboxItem,
  UserPreferences,
} from '../types';

const ENVELOPE_KEY = 'finance-envelope';
const ENVELOPE_SCHEMA_VERSION = 2;
const MMKV_ID = 'savings-tracker-secure-v2';
const KEYCHAIN_SERVICE = 'com.oldalexhub.savingstracker.storage-key.v2';

const LEGACY_KEYS = {
  savingsGoals: '@savings_tracker/savings_goals',
  contributions: '@savings_tracker/contributions',
  debtAccounts: '@savings_tracker/debt_accounts',
  debtPayments: '@savings_tracker/debt_payments',
  preferences: '@savings_tracker/preferences',
  adState: '@savings_tracker/ad_state',
  exportRecords: '@savings_tracker/export_records',
} as const;

export const DEFAULT_PREFERENCES: UserPreferences = {
  currency: 'USD',
  defaultSavingsStrategy: 'fixed_monthly',
  defaultDebtStrategy: 'avalanche',
  lastExportDate: null,
  themeMode: 'system',
  dataCollectionAcceptedAt: null,
  dataDisclosureVersion: null,
};

export const DEFAULT_AD_STATE: AdState = {
  lastInterstitialShownAt: null,
  interstitialShowCount: 0,
  appOpenCount: 0,
  dailyInterstitialCount: 0,
  dailyInterstitialDate: null,
};

export const DEFAULT_APP_DATA: AppData = {
  savingsGoals: [],
  contributions: [],
  debtAccounts: [],
  debtPayments: [],
  preferences: DEFAULT_PREFERENCES,
  adState: DEFAULT_AD_STATE,
  exportRecords: [],
};

interface StorageEnvelope {
  schemaVersion: 2;
  snapshotVersion: number;
  data: AppData;
  outbox: SyncOutboxItem[];
  migratedAt: string | null;
  legacyCheckpointVerified: boolean;
}

export interface MutationEvent {
  name: AnalyticsEventName;
  appVersion: string;
  screen?: string;
  properties?: Record<string, string | number | boolean | null>;
}

let storagePromise: Promise<MMKV> | null = null;
let operationQueue: Promise<void> = Promise.resolve();

export function generateId(): string {
  return uuidv4();
}

function cloneDefaults(): AppData {
  return {
    ...DEFAULT_APP_DATA,
    preferences: {...DEFAULT_PREFERENCES},
    adState: {...DEFAULT_AD_STATE},
  };
}

function normalizeData(value: Partial<AppData> | null | undefined): AppData {
  const defaults = cloneDefaults();
  if (!value) {
    return defaults;
  }
  return {
    savingsGoals: Array.isArray(value.savingsGoals) ? value.savingsGoals : [],
    contributions: Array.isArray(value.contributions) ? value.contributions : [],
    debtAccounts: Array.isArray(value.debtAccounts) ? value.debtAccounts : [],
    debtPayments: Array.isArray(value.debtPayments) ? value.debtPayments : [],
    preferences: {...DEFAULT_PREFERENCES, ...(value.preferences ?? {})},
    adState: {...DEFAULT_AD_STATE, ...(value.adState ?? {})},
    exportRecords: Array.isArray(value.exportRecords) ? value.exportRecords : [],
  };
}

function parseJSON<T>(raw: string | null | undefined, fallback: T): T {
  if (!raw) {
    return fallback;
  }
  try {
    return JSON.parse(raw) as T;
  } catch {
    return fallback;
  }
}

async function getEncryptionKey(): Promise<string> {
  const existing = await Keychain.getGenericPassword({service: KEYCHAIN_SERVICE});
  if (existing) {
    return existing.password;
  }

  const key = uuidv4().replace(/-/g, '');
  const stored = await Keychain.setGenericPassword('storage', key, {
    service: KEYCHAIN_SERVICE,
    securityLevel: Keychain.SECURITY_LEVEL.SECURE_SOFTWARE,
    accessible: Keychain.ACCESSIBLE.AFTER_FIRST_UNLOCK_THIS_DEVICE_ONLY,
  });
  if (!stored) {
    throw new Error('Android Keystore could not protect the local encryption key.');
  }
  return key;
}

async function readLegacyData(): Promise<AppData> {
  const pairs = await AsyncStorage.multiGet(Object.values(LEGACY_KEYS));
  const lookup = new Map(pairs);
  return normalizeData({
    savingsGoals: parseJSON<SavingsGoal[]>(lookup.get(LEGACY_KEYS.savingsGoals), []),
    contributions: parseJSON<SavingsContribution[]>(lookup.get(LEGACY_KEYS.contributions), []),
    debtAccounts: parseJSON<DebtAccount[]>(lookup.get(LEGACY_KEYS.debtAccounts), []),
    debtPayments: parseJSON<DebtPayment[]>(lookup.get(LEGACY_KEYS.debtPayments), []),
    preferences: parseJSON<UserPreferences>(lookup.get(LEGACY_KEYS.preferences), DEFAULT_PREFERENCES),
    adState: parseJSON<AdState>(lookup.get(LEGACY_KEYS.adState), DEFAULT_AD_STATE),
    exportRecords: parseJSON<ExportRecord[]>(lookup.get(LEGACY_KEYS.exportRecords), []),
  });
}

function createEnvelope(data: AppData, migratedAt: string | null): StorageEnvelope {
  return {
    schemaVersion: ENVELOPE_SCHEMA_VERSION,
    snapshotVersion: 0,
    data: normalizeData(data),
    outbox: [],
    migratedAt,
    legacyCheckpointVerified: true,
  };
}

function readEnvelope(storage: MMKV): StorageEnvelope {
  const parsed = parseJSON<StorageEnvelope | null>(storage.getString(ENVELOPE_KEY), null);
  if (!parsed || parsed.schemaVersion !== ENVELOPE_SCHEMA_VERSION) {
    return createEnvelope(cloneDefaults(), null);
  }
  return {
    ...parsed,
    data: normalizeData(parsed.data),
    outbox: Array.isArray(parsed.outbox) ? parsed.outbox : [],
  };
}

function writeEnvelope(storage: MMKV, envelope: StorageEnvelope): void {
  storage.set(ENVELOPE_KEY, JSON.stringify(envelope));
}

async function initializeStorage(): Promise<MMKV> {
  const encryptionKey = await getEncryptionKey();
  const storage = createMMKV({
    id: MMKV_ID,
    encryptionKey,
    encryptionType: 'AES-256',
    compareBeforeSet: true,
    recoveryStrategy: 'recover-on-error',
  });

  if (!storage.contains(ENVELOPE_KEY)) {
    const legacyData = await readLegacyData();
    const envelope = createEnvelope(legacyData, new Date().toISOString());
    writeEnvelope(storage, envelope);

    const verified = readEnvelope(storage);
    const expectedCounts = [
      legacyData.savingsGoals.length,
      legacyData.contributions.length,
      legacyData.debtAccounts.length,
      legacyData.debtPayments.length,
    ];
    const actualCounts = [
      verified.data.savingsGoals.length,
      verified.data.contributions.length,
      verified.data.debtAccounts.length,
      verified.data.debtPayments.length,
    ];
    if (expectedCounts.some((count, index) => count !== actualCounts[index])) {
      storage.remove(ENVELOPE_KEY);
      throw new Error('Existing data could not be verified after secure migration.');
    }
    // Legacy keys intentionally remain as a reversible migration checkpoint.
  }
  return storage;
}

async function getStorage(): Promise<MMKV> {
  storagePromise ??= initializeStorage();
  return storagePromise;
}

function serialize<T>(task: () => Promise<T>): Promise<T> {
  const current = operationQueue.then(task, task);
  operationQueue = current.then(
    () => undefined,
    () => undefined,
  );
  return current;
}

function toAnalyticsEvent(input: MutationEvent): AnalyticsEvent {
  return {
    eventId: generateId(),
    name: input.name,
    clientTimestamp: new Date().toISOString(),
    appVersion: input.appVersion,
    screen: input.screen,
    properties: input.properties,
  };
}

function snapshotPayload(data: AppData, snapshotVersion: number, appVersion: string) {
  return {
    schemaVersion: 1,
    snapshotVersion,
    clientTimestamp: new Date().toISOString(),
    appVersion,
    currency: data.preferences.currency,
    savingsGoals: data.savingsGoals,
    contributions: data.contributions,
    debtAccounts: data.debtAccounts,
    debtPayments: data.debtPayments,
  };
}

export async function loadAllData(): Promise<AppData> {
  await operationQueue;
  return normalizeData(readEnvelope(await getStorage()).data);
}

export async function mutateAppData(
  mutator: (current: AppData) => AppData,
  appVersion: string,
  events: MutationEvent[] = [],
): Promise<AppData> {
  return serialize(async () => {
    const storage = await getStorage();
    const envelope = readEnvelope(storage);
    const nextData = normalizeData(mutator(normalizeData(envelope.data)));
    const nextSnapshotVersion = envelope.snapshotVersion + 1;
    const retainedEvents = envelope.outbox.filter(item => item.kind === 'events');
    const now = new Date().toISOString();
    const outbox: SyncOutboxItem[] = [
      ...retainedEvents,
      ...(events.length
        ? [{
            id: generateId(),
            kind: 'events' as const,
            createdAt: now,
            attempts: 0,
            nextAttemptAt: now,
            payload: {schemaVersion: 1, events: events.map(toAnalyticsEvent)},
          }]
        : []),
      {
        id: `snapshot-${nextSnapshotVersion}`,
        kind: 'snapshot',
        createdAt: now,
        attempts: 0,
        nextAttemptAt: now,
        payload: snapshotPayload(nextData, nextSnapshotVersion, appVersion),
      },
    ];
    writeEnvelope(storage, {
      ...envelope,
      data: nextData,
      snapshotVersion: nextSnapshotVersion,
      outbox,
    });
    return nextData;
  });
}

export async function queueAnalyticsEvents(events: MutationEvent[]): Promise<void> {
  if (events.length === 0) {
    return;
  }
  await serialize(async () => {
    const storage = await getStorage();
    const envelope = readEnvelope(storage);
    const now = new Date().toISOString();
    envelope.outbox.push({
      id: generateId(),
      kind: 'events',
      createdAt: now,
      attempts: 0,
      nextAttemptAt: now,
      payload: {schemaVersion: 1, events: events.map(toAnalyticsEvent)},
    });
    writeEnvelope(storage, envelope);
  });
}

export async function ensureSnapshotQueued(appVersion: string): Promise<void> {
  await serialize(async () => {
    const storage = await getStorage();
    const envelope = readEnvelope(storage);
    if (envelope.outbox.some(item => item.kind === 'snapshot')) {
      return;
    }
    const version = Math.max(1, envelope.snapshotVersion);
    const now = new Date().toISOString();
    envelope.outbox.push({
      id: `snapshot-${version}`,
      kind: 'snapshot',
      createdAt: now,
      attempts: 0,
      nextAttemptAt: now,
      payload: snapshotPayload(envelope.data, version, appVersion),
    });
    writeEnvelope(storage, envelope);
  });
}

export async function getOutbox(): Promise<SyncOutboxItem[]> {
  await operationQueue;
  return [...readEnvelope(await getStorage()).outbox];
}

export async function completeOutboxItem(id: string): Promise<void> {
  await serialize(async () => {
    const storage = await getStorage();
    const envelope = readEnvelope(storage);
    envelope.outbox = envelope.outbox.filter(item => item.id !== id);
    writeEnvelope(storage, envelope);
  });
}

export async function deferOutboxItem(id: string, attempts: number): Promise<void> {
  await serialize(async () => {
    const storage = await getStorage();
    const envelope = readEnvelope(storage);
    const backoffMs = Math.min(3_600_000, 2 ** Math.min(attempts, 10) * 5_000);
    envelope.outbox = envelope.outbox.map(item =>
      item.id === id
        ? {...item, attempts, nextAttemptAt: new Date(Date.now() + backoffMs).toISOString()}
        : item,
    );
    writeEnvelope(storage, envelope);
  });
}

export async function saveAllData(data: AppData): Promise<void> {
  await mutateAppData(() => data, '2.0.0');
}

export async function saveSavingsGoal(goal: SavingsGoal): Promise<void> {
  await mutateAppData(current => ({
    ...current,
    savingsGoals: current.savingsGoals.some(item => item.id === goal.id)
      ? current.savingsGoals.map(item => (item.id === goal.id ? goal : item))
      : [...current.savingsGoals, goal],
  }), '2.0.0');
}

export async function deleteSavingsGoal(id: string): Promise<void> {
  await mutateAppData(current => ({
    ...current,
    savingsGoals: current.savingsGoals.filter(item => item.id !== id),
    contributions: current.contributions.filter(item => item.goalId !== id),
  }), '2.0.0');
}

export async function saveContribution(contribution: SavingsContribution): Promise<void> {
  await mutateAppData(current => ({
    ...current,
    contributions: current.contributions.some(item => item.id === contribution.id)
      ? current.contributions.map(item => (item.id === contribution.id ? contribution : item))
      : [...current.contributions, contribution],
  }), '2.0.0');
}

export async function deleteContribution(id: string): Promise<void> {
  await mutateAppData(current => ({
    ...current,
    contributions: current.contributions.filter(item => item.id !== id),
  }), '2.0.0');
}

export async function saveDebtAccount(debt: DebtAccount): Promise<void> {
  await mutateAppData(current => ({
    ...current,
    debtAccounts: current.debtAccounts.some(item => item.id === debt.id)
      ? current.debtAccounts.map(item => (item.id === debt.id ? debt : item))
      : [...current.debtAccounts, debt],
  }), '2.0.0');
}

export async function deleteDebtAccount(id: string): Promise<void> {
  await mutateAppData(current => ({
    ...current,
    debtAccounts: current.debtAccounts.filter(item => item.id !== id),
    debtPayments: current.debtPayments.filter(item => item.debtId !== id),
  }), '2.0.0');
}

export async function saveDebtPayment(payment: DebtPayment): Promise<void> {
  await mutateAppData(current => ({
    ...current,
    debtPayments: current.debtPayments.some(item => item.id === payment.id)
      ? current.debtPayments.map(item => (item.id === payment.id ? payment : item))
      : [...current.debtPayments, payment],
  }), '2.0.0');
}

export async function deleteDebtPayment(id: string): Promise<void> {
  await mutateAppData(current => ({
    ...current,
    debtPayments: current.debtPayments.filter(item => item.id !== id),
  }), '2.0.0');
}

export async function savePreferences(preferences: UserPreferences): Promise<void> {
  await mutateAppData(current => ({...current, preferences}), '2.0.0');
}

export async function saveAdState(adState: AdState): Promise<void> {
  await mutateAppData(current => ({...current, adState}), '2.0.0');
}

export async function saveExportRecord(record: ExportRecord): Promise<void> {
  await mutateAppData(current => ({
    ...current,
    exportRecords: [...current.exportRecords, record].slice(-50),
  }), '2.0.0');
}

export async function clearAllData(): Promise<void> {
  await serialize(async () => {
    const storage = await getStorage();
    writeEnvelope(storage, createEnvelope(cloneDefaults(), null));
    await AsyncStorage.multiRemove(Object.values(LEGACY_KEYS));
  });
}
