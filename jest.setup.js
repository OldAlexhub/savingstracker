jest.mock('@react-native-async-storage/async-storage', () =>
  require('@react-native-async-storage/async-storage/jest/async-storage-mock'),
);

jest.mock('react-native-google-mobile-ads', () => {
  const mockAd = {
    addAdEventListener: jest.fn(() => jest.fn()),
    load: jest.fn(),
    show: jest.fn(() => Promise.resolve()),
  };

  const MobileAds = jest.fn(() => ({
    initialize: jest.fn(() => Promise.resolve()),
    setRequestConfiguration: jest.fn(() => Promise.resolve()),
  }));

  return {
    __esModule: true,
    default: MobileAds,
    BannerAd: 'BannerAd',
    BannerAdSize: { ANCHORED_ADAPTIVE_BANNER: 'ANCHORED_ADAPTIVE_BANNER' },
    InterstitialAd: { createForAdRequest: jest.fn(() => mockAd) },
    AdEventType: { LOADED: 'loaded', ERROR: 'error', CLOSED: 'closed' },
    TestIds: {
      BANNER: 'test-banner',
      INTERSTITIAL: 'test-interstitial',
      NATIVE: 'test-native',
    },
  };
});

jest.mock('react-native-vector-icons/MaterialCommunityIcons', () => 'Icon');

jest.mock('react-native-fs', () => ({
  DocumentDirectoryPath: '/tmp',
  DownloadDirectoryPath: '/tmp',
  writeFile: jest.fn(() => Promise.resolve()),
  exists: jest.fn(() => Promise.resolve(true)),
  mkdir: jest.fn(() => Promise.resolve()),
}));
