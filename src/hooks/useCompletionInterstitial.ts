import {useCallback, useEffect} from 'react';
import {TestIds, useInterstitialAd} from 'react-native-google-mobile-ads';

import {useApp} from '../context/AppContext';
import {AD_UNITS} from '../theme';
import {adManager} from '../utils/adManager';

const UNIT_ID = __DEV__ ? TestIds.INTERSTITIAL : AD_UNITS.INTERSTITIAL;

export function useCompletionInterstitial(): {showIfEligible: () => boolean} {
  const {data, remoteConfig, recordInterstitialShown, trackEvent} = useApp();
  const {isLoaded, load, show, error} = useInterstitialAd(UNIT_ID);

  useEffect(() => {
    void trackEvent('ad_requested', undefined, {format: 'interstitial', placement: 'completion'});
    load();
  }, [load, trackEvent]);

  useEffect(() => {
    if (error) {
      void trackEvent('ad_failed', undefined, {format: 'interstitial', placement: 'completion'});
    }
  }, [error, trackEvent]);

  const showIfEligible = useCallback(() => {
    if (!isLoaded || !adManager.canShowInterstitial(data.adState, remoteConfig.ads)) {
      return false;
    }
    show();
    adManager.recordInterstitialShown();
    void recordInterstitialShown();
    return true;
  }, [data.adState, isLoaded, recordInterstitialShown, remoteConfig.ads, show]);

  return {showIfEligible};
}
