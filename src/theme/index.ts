export const Colors = {
  primary: '#2E7D32',
  primaryLight: '#4CAF50',
  primaryDark: '#1B5E20',
  primaryFade: '#E8F5E9',

  secondary: '#1565C0',
  secondaryLight: '#1E88E5',
  secondaryFade: '#E3F2FD',

  accent: '#F57F17',
  accentLight: '#FFB300',
  accentFade: '#FFF8E1',

  background: '#F5F7FA',
  surface: '#FFFFFF',
  surfaceVariant: '#F0F4F8',
  surfaceElevated: '#FAFBFC',

  text: '#1A202C',
  textSecondary: '#4A5568',
  textMuted: '#718096',
  textDisabled: '#A0AEC0',
  textInverse: '#FFFFFF',

  success: '#2E7D32',
  successLight: '#E8F5E9',
  warning: '#F57C00',
  warningLight: '#FFF3E0',
  error: '#C62828',
  errorLight: '#FFEBEE',
  info: '#1565C0',
  infoLight: '#E3F2FD',

  border: '#E2E8F0',
  borderLight: '#F0F4F8',
  divider: '#EDF2F7',

  progressLow: '#EF5350',
  progressMid: '#FF8F00',
  progressHigh: '#43A047',

  debtHigh: '#C62828',
  debtMid: '#F57C00',
  debtLow: '#2E7D32',

  tabActive: '#2E7D32',
  tabInactive: '#9E9E9E',
  tabBackground: '#FFFFFF',

  shadowColor: '#000000',

  cardBorder: '#E2E8F0',

  chartBlue: '#1E88E5',
  chartGreen: '#43A047',
  chartOrange: '#FB8C00',
  chartRed: '#E53935',
  chartPurple: '#8E24AA',
} as const;

export const Spacing = {
  xs: 4,
  sm: 8,
  md: 16,
  lg: 24,
  xl: 32,
  xxl: 48,
} as const;

export const Typography = {
  h1: { fontSize: 28, fontWeight: '700' as const, lineHeight: 36 },
  h2: { fontSize: 22, fontWeight: '700' as const, lineHeight: 30 },
  h3: { fontSize: 18, fontWeight: '600' as const, lineHeight: 26 },
  h4: { fontSize: 16, fontWeight: '600' as const, lineHeight: 24 },
  body: { fontSize: 14, fontWeight: '400' as const, lineHeight: 22 },
  bodyLarge: { fontSize: 16, fontWeight: '400' as const, lineHeight: 24 },
  caption: { fontSize: 12, fontWeight: '400' as const, lineHeight: 18 },
  label: { fontSize: 12, fontWeight: '600' as const, lineHeight: 18, letterSpacing: 0.5 },
  button: { fontSize: 16, fontWeight: '600' as const, lineHeight: 24 },
  buttonSmall: { fontSize: 14, fontWeight: '600' as const, lineHeight: 20 },
  mono: { fontSize: 13, fontFamily: 'monospace' as const, lineHeight: 20 },
  number: { fontSize: 24, fontWeight: '700' as const, lineHeight: 32 },
  numberLarge: { fontSize: 32, fontWeight: '800' as const, lineHeight: 40 },
} as const;

export const BorderRadius = {
  sm: 4,
  md: 8,
  lg: 12,
  xl: 16,
  xxl: 24,
  round: 999,
} as const;

export const Shadows = {
  sm: {
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.08,
    shadowRadius: 2,
    elevation: 2,
  },
  md: {
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.12,
    shadowRadius: 4,
    elevation: 4,
  },
  lg: {
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.16,
    shadowRadius: 8,
    elevation: 8,
  },
} as const;

export const AD_UNITS = {
  BANNER: 'ca-app-pub-7831002909037560/7254294744',
  INTERSTITIAL: 'ca-app-pub-7831002909037560/5286606952',
  NATIVE: 'ca-app-pub-7831002909037560/1118875629',
  APP_ID: 'ca-app-pub-7831002909037560~5086040793',
} as const;

export const AD_CONFIG = {
  INTERSTITIAL_MIN_GAP_MS: 5 * 60 * 1000,
  INTERSTITIAL_MAX_PER_SESSION: 10,
  BANNER_RELOAD_MS: 30 * 1000,
} as const;
