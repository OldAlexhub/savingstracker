export class AdManager {
  private static instance: AdManager;

  private lastInterstitialTime: number = 0;
  private sessionInterstitialCount: number = 0;

  private readonly MIN_GAP_MS = 5 * 60 * 1000; // 5 minutes
  private readonly MAX_PER_SESSION = 10;

  private constructor() {
    // Private constructor enforces singleton
  }

  static getInstance(): AdManager {
    if (!AdManager.instance) {
      AdManager.instance = new AdManager();
    }
    return AdManager.instance;
  }

  /**
   * Returns true if an interstitial ad can be shown right now.
   * Conditions that block showing:
   *   1. Session count has reached MAX_PER_SESSION
   *   2. Not enough time has passed since the last interstitial
   */
  canShowInterstitial(): boolean {
    if (this.sessionInterstitialCount >= this.MAX_PER_SESSION) {
      return false;
    }
    if (this.lastInterstitialTime === 0) {
      // Never shown in this session — allowed
      return true;
    }
    const elapsed = Date.now() - this.lastInterstitialTime;
    return elapsed >= this.MIN_GAP_MS;
  }

  /**
   * Call this immediately after an interstitial is successfully shown
   * to record the time and increment the session count.
   */
  recordInterstitialShown(): void {
    this.lastInterstitialTime = Date.now();
    this.sessionInterstitialCount += 1;
  }

  /**
   * Resets the session counters (e.g. on app foreground / resume).
   * Does NOT reset lastInterstitialTime so the gap check still applies.
   */
  resetSession(): void {
    this.sessionInterstitialCount = 0;
  }
}

export const adManager = AdManager.getInstance();
