import {
  clearAllData,
  deferOutboxItem,
  getOutbox,
  loadAllData,
  mutateAppData,
} from '../src/storage/database';

describe('encrypted envelope and sync outbox', () => {
  beforeEach(async () => {
    await clearAllData();
  });

  test('persists one latest snapshot while retaining deduplicated event batches', async () => {
    await mutateAppData(current => ({
      ...current,
      preferences: {...current.preferences, currency: 'EUR'},
    }), '2.0.0', [{name: 'screen_viewed', appVersion: '2.0.0', screen: 'Settings'}]);

    await mutateAppData(current => ({
      ...current,
      preferences: {...current.preferences, currency: 'GBP'},
    }), '2.0.0', [{name: 'screen_viewed', appVersion: '2.0.0', screen: 'Home'}]);

    expect((await loadAllData()).preferences.currency).toBe('GBP');
    const outbox = await getOutbox();
    expect(outbox.filter(item => item.kind === 'snapshot')).toHaveLength(1);
    expect(outbox.filter(item => item.kind === 'events')).toHaveLength(2);
    expect(new Set(outbox.map(item => item.id)).size).toBe(outbox.length);
  });

  test('backs off a failed item without losing it', async () => {
    await mutateAppData(current => current, '2.0.0');
    const [item] = await getOutbox();
    const before = Date.now();
    await deferOutboxItem(item.id, 3);
    const deferred = (await getOutbox()).find(entry => entry.id === item.id);
    expect(deferred?.attempts).toBe(3);
    expect(new Date(deferred?.nextAttemptAt ?? 0).getTime()).toBeGreaterThan(before);
  });
});
