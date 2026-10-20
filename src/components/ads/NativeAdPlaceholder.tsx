import React, {useEffect, useState} from 'react';
import {Image, StyleProp, StyleSheet, Text, TouchableOpacity, View, ViewStyle} from 'react-native';
import {
  NativeAd,
  NativeAdView,
  NativeAsset,
  NativeAssetType,
  TestIds,
} from 'react-native-google-mobile-ads';

import {useApp} from '../../context/AppContext';
import {AD_UNITS, BorderRadius, Colors, Shadows, Spacing, Typography} from '../../theme';

const UNIT_ID = __DEV__ ? TestIds.NATIVE : AD_UNITS.NATIVE;

interface Props {
  style?: StyleProp<ViewStyle>;
}

export default function NativeAdPlaceholder({style}: Props): React.JSX.Element | null {
  const [nativeAd, setNativeAd] = useState<NativeAd | null>(null);
  const {trackEvent} = useApp();

  useEffect(() => {
    let active = true;
    let loadedAd: NativeAd | null = null;
    void trackEvent('ad_requested', 'Insights', {format: 'native', placement: 'education'});
    void NativeAd.createForAdRequest(UNIT_ID, {startVideoMuted: true})
      .then(ad => {
        loadedAd = ad;
        if (active) {
          setNativeAd(ad);
          void trackEvent('ad_impression', 'Insights', {format: 'native', placement: 'education'});
        } else {
          ad.destroy();
        }
      })
      .catch(() => {
        void trackEvent('ad_failed', 'Insights', {format: 'native', placement: 'education'});
      });
    return () => {
      active = false;
      loadedAd?.destroy();
    };
  }, [trackEvent]);

  if (!nativeAd) {
    return null;
  }

  return (
    <NativeAdView nativeAd={nativeAd} style={[styles.card, style]}>
      <View style={styles.badge}><Text style={styles.badgeText}>Sponsored</Text></View>
      <View style={styles.row}>
        {nativeAd.icon?.url ? (
          <NativeAsset assetType={NativeAssetType.ICON}>
            <Image source={{uri: nativeAd.icon.url}} style={styles.icon} />
          </NativeAsset>
        ) : null}
        <View style={styles.copy}>
          <NativeAsset assetType={NativeAssetType.HEADLINE}>
            <Text style={styles.headline} numberOfLines={1}>{nativeAd.headline}</Text>
          </NativeAsset>
          <NativeAsset assetType={NativeAssetType.BODY}>
            <Text style={styles.body} numberOfLines={2}>{nativeAd.body}</Text>
          </NativeAsset>
        </View>
      </View>
      <NativeAsset assetType={NativeAssetType.CALL_TO_ACTION}>
        <TouchableOpacity accessibilityRole="button" style={styles.cta}>
          <Text style={styles.ctaText}>{nativeAd.callToAction}</Text>
        </TouchableOpacity>
      </NativeAsset>
    </NativeAdView>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: Colors.surface,
    borderRadius: BorderRadius.lg,
    borderWidth: 1,
    borderColor: Colors.border,
    padding: Spacing.md,
    ...Shadows.sm,
  },
  badge: {alignSelf: 'flex-start', borderWidth: 1, borderColor: Colors.border, borderRadius: 99, paddingHorizontal: 7, paddingVertical: 3},
  badgeText: {fontSize: 9, fontWeight: '800', letterSpacing: 0.7, color: Colors.textMuted},
  row: {flexDirection: 'row', alignItems: 'center', marginTop: 10},
  icon: {width: 48, height: 48, borderRadius: 12, marginRight: 11},
  copy: {flex: 1},
  headline: {...Typography.h4, color: Colors.text},
  body: {...Typography.caption, color: Colors.textSecondary, marginTop: 3},
  cta: {alignSelf: 'flex-end', backgroundColor: Colors.primaryFade, borderRadius: 99, paddingHorizontal: 15, paddingVertical: 9, marginTop: 12},
  ctaText: {...Typography.label, color: Colors.primaryDark},
});
