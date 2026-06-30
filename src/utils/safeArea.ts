import { Platform } from 'react-native';

const ANDROID_NAV_FALLBACK = 24;

export function bottomInsetWithFallback(bottomInset: number): number {
  if (Platform.OS !== 'android') {
    return bottomInset;
  }
  return Math.max(bottomInset, ANDROID_NAV_FALLBACK);
}
