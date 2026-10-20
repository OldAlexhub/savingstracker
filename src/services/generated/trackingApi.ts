/**
 * Generated client surface for Savings Tracker API schema v1.
 * Source: server GET /openapi.json (Savings Tracker API 1.0.0).
 * Regenerate when the server contract version changes; do not hand-edit endpoint shapes.
 */

import type {
  AnalyticsEvent,
  DebtAccount,
  DebtPayment,
  RemoteConfig,
  SavingsContribution,
  SavingsGoal,
  ServerInsights,
} from '../../types';

export interface InstallationRegistration {
  schemaVersion: 1;
  installationId: string;
  disclosureVersion: string;
  acceptedAt: string;
  device: {
    manufacturer: string;
    model: string;
    androidVersion: string;
    apiLevel: number;
    appVersion: string;
    locale: string;
    timezone: string;
    screenClass: 'compact' | 'medium' | 'expanded';
    capabilities: string[];
  };
}

export interface InstallationCredential {
  installationId: string;
  token: string;
  apiVersion: 1;
}

export interface FinanceSnapshotPayload {
  schemaVersion: 1;
  snapshotVersion: number;
  clientTimestamp: string;
  appVersion: string;
  currency: string;
  savingsGoals: SavingsGoal[];
  contributions: SavingsContribution[];
  debtAccounts: DebtAccount[];
  debtPayments: DebtPayment[];
}

export interface EventBatchPayload {
  schemaVersion: 1;
  events: AnalyticsEvent[];
}

export interface WhatIfRequest {
  type: 'goal_contribution' | 'debt_extra_payment';
  recordId: string;
  monthlyAmount: number;
}

export interface WhatIfResponse {
  estimated: true;
  result: Record<string, number | string | null>;
}

interface ClientOptions {
  origin: string;
  getToken?: () => string | undefined;
  timeoutMs?: number;
}

export class TrackingApiClient {
  constructor(private readonly options: ClientOptions) {}

  private async request<T>(path: string, init: RequestInit = {}): Promise<T | null> {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), this.options.timeoutMs ?? 10_000);
    try {
      const token = this.options.getToken?.();
      const response = await fetch(`${this.options.origin}/api/v1${path}`, {
        ...init,
        signal: controller.signal,
        headers: {
          Accept: 'application/json',
          ...(init.body ? {'Content-Type': 'application/json'} : {}),
          ...(token ? {Authorization: `Bearer ${token}`} : {}),
          ...init.headers,
        },
      });
      if (response.status === 204) return null;
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

  register(body: InstallationRegistration, idempotencyKey: string) {
    return this.request<InstallationCredential>('/installations', {
      method: 'POST', headers: {'Idempotency-Key': idempotencyKey}, body: JSON.stringify(body),
    });
  }

  ingestEvents(body: EventBatchPayload, idempotencyKey: string) {
    return this.request<{accepted: number; duplicates: number}>('/events/batch', {
      method: 'POST', headers: {'Idempotency-Key': idempotencyKey}, body: JSON.stringify(body),
    });
  }

  replaceSnapshot(body: FinanceSnapshotPayload, idempotencyKey: string) {
    return this.request<{accepted: boolean; snapshotVersion: number}>('/finance/snapshot', {
      method: 'PUT', headers: {'Idempotency-Key': idempotencyKey}, body: JSON.stringify(body),
    });
  }

  latestInsights() { return this.request<ServerInsights>('/insights/latest'); }
  remoteConfig() { return this.request<RemoteConfig>('/config'); }
  whatIf(body: WhatIfRequest) {
    return this.request<WhatIfResponse>('/insights/what-if', {method: 'POST', body: JSON.stringify(body)});
  }
  deleteInstallation() { return this.request<never>('/installations/me', {method: 'DELETE'}); }
}
