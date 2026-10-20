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
    AdsConsent: {
      requestInfoUpdate: jest.fn(() => Promise.resolve({})),
      loadAndShowConsentFormIfRequired: jest.fn(() => Promise.resolve({})),
      showPrivacyOptionsForm: jest.fn(() => Promise.resolve({})),
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

jest.mock('react-native-device-info', () => ({
  __esModule: true,
  default: {
    getVersion: jest.fn(() => '2.0.0'),
    getBuildNumber: jest.fn(() => '2'),
    getManufacturer: jest.fn(() => Promise.resolve('Test')), 
    getModel: jest.fn(() => 'Device'),
    getApiLevel: jest.fn(() => Promise.resolve(36)),
    isTablet: jest.fn(() => false),
  },
}));

const mockKeychainRecords = new Map();
jest.mock('react-native-keychain', () => ({
  SECURITY_LEVEL: {SECURE_SOFTWARE: 1},
  ACCESSIBLE: {AFTER_FIRST_UNLOCK_THIS_DEVICE_ONLY: 'device-only'},
  getGenericPassword: jest.fn(({service}) => Promise.resolve(mockKeychainRecords.get(service) || false)),
  setGenericPassword: jest.fn((username, password, {service}) => {
    mockKeychainRecords.set(service, {username, password, service, storage: 'test'});
    return Promise.resolve({service, storage: 'test'});
  }),
  resetGenericPassword: jest.fn(({service}) => Promise.resolve(mockKeychainRecords.delete(service))),
}));

const mockMmkvRecords = new Map();
jest.mock('react-native-mmkv', () => ({
  createMMKV: jest.fn(() => ({
    contains: key => mockMmkvRecords.has(key),
    getString: key => mockMmkvRecords.get(key),
    set: (key, value) => mockMmkvRecords.set(key, value),
    remove: key => mockMmkvRecords.delete(key),
    clearAll: () => mockMmkvRecords.clear(),
  })),
}));

jest.mock('@react-native-community/netinfo', () => ({
  __esModule: true,
  default: {
    fetch: jest.fn(() => Promise.resolve({isConnected: false, isInternetReachable: false})),
    addEventListener: jest.fn(() => jest.fn()),
  },
}));

jest.mock('react-native-haptic-feedback', () => ({
  __esModule: true,
  default: {trigger: jest.fn()},
}));

let mockUuidCounter = 0;
jest.mock('uuid', () => ({
  v4: jest.fn(() => `123e4567-e89b-42d3-a456-${String(++mockUuidCounter).padStart(12, '0')}`),
}));
jest.mock('react-native-get-random-values', () => ({}));

jest.mock('@react-native-community/datetimepicker', () => ({
  DateTimePickerAndroid: {open: jest.fn(), dismiss: jest.fn()},
}));

