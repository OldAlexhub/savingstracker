import NetInfo from '@react-native-community/netinfo';
import {Dimensions, Platform} from 'react-native';
import DeviceInfo from 'react-native-device-info';
import * as Keychain from 'react-native-keychain';

import type {AppData, RemoteConfig, ServerInsights} from '../types';
import {
  completeOutboxItem,
  deferOutboxItem,
  ensureSnapshotQueued,
  generateId,
  getOutbox,
} from '../storage/database';

export const API_ORIGIN = 'https://tracking.server.oldalexhub.com';
const API_BASE = `${API_ORIGIN}/api/v1`;
const INSTALLATION_SERVICE = 'com.oldalexhub.savingstracker.installation.v1';
const REQUEST_TIMEOUT_MS = 10_000;

interface InstallationCredentials {
  installationId: string;
  token: string;
  deviceSyncedAt?: string;
}

export interface SyncResult {
  status: 'synced' | 'offline' | 'pending';
  pendingCount: number;
  config: RemoteConfig | null;
  insights: ServerInsights | null;
  lastSyncedAt: string | null;
}

export const DEFAULT_REMOTE_CONFIG: RemoteConfig = {
  configVersion: 1,
  android: {
    latestVersionCode: 2,
    minSupportedVersionCode: 1,
    playStoreUrl: 'https://play.google.com/store/apps/details?id=com.oldalexhub.savingstracker',
  },
  ads: {
    minInterstitialGapMs: 600_000,
    maxPerSession: 3,
    maxPerDay: 5,
    rewardedScenariosEnabled: false,
  },
  features: {serverInsights: true, whatIf: true, mlShadowMode: true},
};

async function apiRequest<T>(
  path: string,
  options: RequestInit = {},
  credentials?: InstallationCredentials,
): Promise<T | null> {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS);
  try {
    const response = await fetch(`${API_BASE}${path}`, {
      ...options,
      signal: controller.signal,
      headers: {
        Accept: 'application/json',
        ...(options.body ? {'Content-Type': 'application/json'} : {}),
        ...(credentials ? {Authorization: `Bearer ${credentials.token}`} : {}),
        ...options.headers,
      },
    });
    if (response.status === 204) {
      return null;
    }
    if (!response.ok) {
      const error = new Error(`Tracking service returned ${response.status}.`);
      Object.assign(error, {status: response.status});
      throw error;
    }
    return (await response.json()) as T;
  } finally {
    clearTimeout(timeout);
  }
}

async function getCredentials(): Promise<InstallationCredentials | null> {
  const stored = await Keychain.getGenericPassword({service: INSTALLATION_SERVICE});
  if (!stored) {
    return null;
  }
  try {
    return JSON.parse(stored.password) as InstallationCredentials;
  } catch {
    await Keychain.resetGenericPassword({service: INSTALLATION_SERVICE});
    return null;
  }
}

async function storeCredentials(credentials: InstallationCredentials): Promise<void> {
  const result = await Keychain.setGenericPassword(
    'anonymous-installation',
    JSON.stringify(credentials),
    {
      service: INSTALLATION_SERVICE,
      securityLevel: Keychain.SECURITY_LEVEL.SECURE_SOFTWARE,
      accessible: Keychain.ACCESSIBLE.AFTER_FIRST_UNLOCK_THIS_DEVICE_ONLY,
    },
  );
  if (!result) {
    throw new Error('Could not protect the anonymous installation token.');
  }
}

function screenClass(): 'compact' | 'medium' | 'expanded' {
  const width = Dimensions.get('window').width;
  if (width < 600) {
    return 'compact';
  }
  if (width < 840) {
    return 'medium';
  }
  return 'expanded';
}

async function getDeviceSnapshot() {
  const resolved = Intl.DateTimeFormat().resolvedOptions();
  return {
    manufacturer: await DeviceInfo.getManufacturer(),
    model: DeviceInfo.getModel(),
    androidVersion: String(Platform.Version),
    apiLevel: await DeviceInfo.getApiLevel(),
    appVersion: DeviceInfo.getVersion(),
    locale: resolved.locale || 'und',
    timezone: resolved.timeZone || 'UTC',
    screenClass: screenClass(),
    capabilities: [
      'offline-first',
      'encrypted-storage',
      'server-insights',
      ...(DeviceInfo.isTablet() ? ['tablet'] : ['phone']),
    ],
  };
}

async function ensureRegistered(data: AppData): Promise<InstallationCredentials> {
  const existing = await getCredentials();
  if (existing) {
    return existing;
  }
  const acceptedAt = data.preferences.dataCollectionAcceptedAt;
  const disclosureVersion = data.preferences.dataDisclosureVersion;
  if (!acceptedAt || !disclosureVersion) {
    throw new Error('Data collection disclosure has not been accepted.');
  }
  const result = await apiRequest<InstallationCredentials>('/installations', {
    method: 'POST',
    headers: {'Idempotency-Key': generateId()},
    body: JSON.stringify({
      schemaVersion: 1,
      installationId: generateId(),
      disclosureVersion,
      acceptedAt,
      device: await getDeviceSnapshot(),
    }),
  });
  if (!result) {
    throw new Error('The tracking service returned an empty registration response.');
  }
  const registered = {...result, deviceSyncedAt: new Date().toISOString()};
  await storeCredentials(registered);
  return registered;
}

async function syncDeviceIfStale(credentials: InstallationCredentials): Promise<InstallationCredentials> {
  const lastSync = credentials.deviceSyncedAt ? new Date(credentials.deviceSyncedAt).getTime() : 0;
  if (Date.now() - lastSync < 7 * 24 * 60 * 60 * 1000) {
    return credentials;
  }
  await apiRequest('/installations/device', {
    method: 'PUT',
    body: JSON.stringify(await getDeviceSnapshot()),
  }, credentials);
  const updated = {...credentials, deviceSyncedAt: new Date().toISOString()};
  await storeCredentials(updated);
  return updated;
}

export async function syncNow(data: AppData): Promise<SyncResult> {
  const network = await NetInfo.fetch();
  if (!network.isConnected || network.isInternetReachable === false) {
    return {
      status: 'offline',
      pendingCount: (await getOutbox()).length,
      config: null,
      insights: null,
      lastSyncedAt: null,
    };
  }

  const credentials = await syncDeviceIfStale(await ensureRegistered(data));
  const config = await apiRequest<RemoteConfig>('/config', {}, credentials);
  await ensureSnapshotQueued(DeviceInfo.getVersion());
  const outbox = await getOutbox();
  for (const item of outbox) {
    if (new Date(item.nextAttemptAt).getTime() > Date.now()) {
      continue;
    }
    try {
      await apiRequest(
        item.kind === 'snapshot' ? '/finance/snapshot' : '/events/batch',
        {
          method: item.kind === 'snapshot' ? 'PUT' : 'POST',
          headers: {'Idempotency-Key': item.id},
          body: JSON.stringify(item.payload),
        },
        credentials,
      );
      await completeOutboxItem(item.id);
    } catch (error) {
      if ((error as {status?: number}).status === 401) {
        await Keychain.resetGenericPassword({service: INSTALLATION_SERVICE});
      }
      await deferOutboxItem(item.id, item.attempts + 1);
      break;
    }
  }

  const remaining = await getOutbox();
  const insights = await apiRequest<ServerInsights>('/insights/latest', {}, credentials)
    .catch(() => null);
  return {
    status: remaining.length === 0 ? 'synced' : 'pending',
    pendingCount: remaining.length,
    config,
    insights,
    lastSyncedAt: new Date().toISOString(),
  };
}

export async function runWhatIf(
  data: AppData,
  input: {type: 'goal_contribution' | 'debt_extra_payment'; recordId: string; monthlyAmount: number},
) {
  const credentials = await ensureRegistered(data);
  return apiRequest<{estimated: true; result: Record<string, number | string | null>}>(
    '/insights/what-if',
    {method: 'POST', body: JSON.stringify(input)},
    credentials,
  );
}

export async function purgeRemoteInstallation(): Promise<void> {
  const credentials = await getCredentials();
  if (credentials) {
    await apiRequest('/installations/me', {method: 'DELETE'}, credentials);
  }
  await Keychain.resetGenericPassword({service: INSTALLATION_SERVICE});
}

export function subscribeToConnectivity(onOnline: () => void): () => void {
  return NetInfo.addEventListener(state => {
    if (state.isConnected && state.isInternetReachable !== false) {
      onOnline();
    }
  });
}
