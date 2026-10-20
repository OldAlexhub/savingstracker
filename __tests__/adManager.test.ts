import {AdManager} from '../src/utils/adManager';
import type {AdState, RemoteConfig} from '../src/types';

const caps: RemoteConfig['ads'] = {
  minInterstitialGapMs: 600_000,
  maxPerSession: 3,
  maxPerDay: 5,
  rewardedScenariosEnabled: false,
};

const emptyState: AdState = {
  lastInterstitialShownAt: null,
  interstitialShowCount: 0,
  appOpenCount: 0,
  dailyInterstitialCount: 0,
  dailyInterstitialDate: null,
};

describe('ad caps', () => {
  test('enforces gap, session, and daily limits', () => {
    const manager = AdManager.getInstance();
    manager.resetSession();
    const at = Date.UTC(2030, 0, 2, 12);
    expect(manager.canShowInterstitial(emptyState, caps, at)).toBe(true);
    manager.recordInterstitialShown(at);
    expect(manager.canShowInterstitial(emptyState, caps, at + 60_000)).toBe(false);

    manager.resetSession();
    const day = new Date(at).toISOString().slice(0, 10);
    expect(manager.canShowInterstitial({
      ...emptyState,
      dailyInterstitialDate: day,
      dailyInterstitialCount: 5,
    }, caps, at + 700_000)).toBe(false);
  });
});
