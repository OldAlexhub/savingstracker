import type {AdState, RemoteConfig} from '../types';

type AdCaps = RemoteConfig['ads'];

export class AdManager {
  private static instance: AdManager;
  private lastInterstitialTime = 0;
  private sessionInterstitialCount = 0;

  private constructor() {}

  static getInstance(): AdManager {
    if (!AdManager.instance) {
      AdManager.instance = new AdManager();
    }
    return AdManager.instance;
  }

  canShowInterstitial(state: AdState, caps: AdCaps, at = Date.now()): boolean {
    if (this.sessionInterstitialCount >= caps.maxPerSession) {
      return false;
    }

    const today = new Date(at).toISOString().slice(0, 10);
    if (state.dailyInterstitialDate === today && state.dailyInterstitialCount >= caps.maxPerDay) {
      return false;
    }

    const lastShown = Math.max(this.lastInterstitialTime, state.lastInterstitialShownAt ?? 0);
    return lastShown === 0 || at - lastShown >= caps.minInterstitialGapMs;
  }

  recordInterstitialShown(at = Date.now()): void {
    this.lastInterstitialTime = at;
    this.sessionInterstitialCount += 1;
  }

  resetSession(): void {
    this.sessionInterstitialCount = 0;
  }
}

export const adManager = AdManager.getInstance();
