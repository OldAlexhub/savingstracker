import {Platform, PlatformColor} from 'react-native';

const semanticColor = (resource: string, fallback: string): string =>
  (Platform.OS === 'android' ? PlatformColor(`@color/${resource}`) : fallback) as unknown as string;

export const Colors = {
  primary: '#059669',
  primaryLight: '#34D399',
  primaryDark: semanticColor('st_primary_strong', '#047857'),
  primaryFade: semanticColor('st_primary_fade', '#DDF8ED'),

  secondary: '#3559E0',
  secondaryLight: '#5F7AF0',
  secondaryFade: semanticColor('st_secondary_fade', '#E9EDFF'),

  accent: '#D97706',
  accentLight: '#F59E0B',
  accentFade: semanticColor('st_accent_fade', '#FFF4D6'),

  background: semanticColor('st_background', '#F4F7F5'),
  surface: semanticColor('st_surface', '#FFFFFF'),
  surfaceVariant: semanticColor('st_surface_variant', '#EEF3F0'),
  surfaceElevated: semanticColor('st_surface_elevated', '#FAFCFB'),

  text: semanticColor('st_text', '#101C24'),
  textSecondary: semanticColor('st_text_secondary', '#40505B'),
  textMuted: semanticColor('st_text_muted', '#718078'),
  textDisabled: semanticColor('st_text_disabled', '#9AA7A0'),
  textInverse: '#FFFFFF',

  success: semanticColor('st_success', '#047857'),
  successLight: semanticColor('st_success_light', '#DDF8ED'),
  warning: semanticColor('st_warning', '#B45309'),
  warningLight: semanticColor('st_warning_light', '#FFF4D6'),
  error: semanticColor('st_error', '#BE3A4A'),
  errorLight: semanticColor('st_error_light', '#FDE8EB'),
  info: semanticColor('st_info', '#3559E0'),
  infoLight: semanticColor('st_info_light', '#E9EDFF'),

  border: semanticColor('st_border', '#DDE6E1'),
  borderLight: semanticColor('st_border_light', '#EDF2EF'),
  divider: semanticColor('st_divider', '#E8EFEB'),

  progressLow: '#EF5350',
  progressMid: '#FF8F00',
  progressHigh: '#43A047',

  debtHigh: '#C62828',
  debtMid: '#F57C00',
  debtLow: '#2E7D32',

  tabActive: '#059669',
  tabInactive: semanticColor('st_tab_inactive', '#78867E'),
  tabBackground: semanticColor('st_surface', '#FFFFFF'),

  shadowColor: '#000000',

  cardBorder: semanticColor('st_border', '#DDE6E1'),

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
  h1: { fontSize: 30, fontWeight: '800' as const, lineHeight: 38, letterSpacing: -0.8 },
  h2: { fontSize: 23, fontWeight: '700' as const, lineHeight: 31, letterSpacing: -0.4 },
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
  sm: 6,
  md: 10,
  lg: 16,
  xl: 22,
  xxl: 30,
  round: 999,
} as const;

export const Shadows = {
  sm: {
    shadowColor: '#17352A',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.08,
    shadowRadius: 2,
    elevation: 2,
  },
  md: {
    shadowColor: '#17352A',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.09,
    shadowRadius: 8,
    elevation: 3,
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
  INTERSTITIAL_MIN_GAP_MS: 10 * 60 * 1000,
  INTERSTITIAL_MAX_PER_SESSION: 3,
  INTERSTITIAL_MAX_PER_DAY: 5,
  BANNER_RELOAD_MS: 30 * 1000,
} as const;
