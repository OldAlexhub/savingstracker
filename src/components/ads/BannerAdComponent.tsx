import React, { useState } from 'react';
import { View, StyleSheet, ViewStyle } from 'react-native';
import { BannerAd, BannerAdSize } from 'react-native-google-mobile-ads';
import { AD_UNITS, Colors } from '../../theme';
import SafeAdContainer from '../layout/SafeAdContainer';

interface BannerAdComponentProps {
  style?: ViewStyle;
}

const BannerAdComponent: React.FC<BannerAdComponentProps> = ({ style }) => {
  const [adLoaded, setAdLoaded] = useState(false);
  const [adFailed, setAdFailed] = useState(false);

  if (adFailed) {
    return null;
  }

  const adUnitId = AD_UNITS.BANNER;

  return (
    <SafeAdContainer style={style}>
      {!adLoaded && (
        <View style={styles.loadingPlaceholder} />
      )}
      <BannerAd
        unitId={adUnitId}
        size={BannerAdSize.ANCHORED_ADAPTIVE_BANNER}
        onAdLoaded={() => {
          setAdLoaded(true);
          setAdFailed(false);
        }}
        onAdFailedToLoad={() => {
          setAdFailed(true);
          setAdLoaded(false);
        }}
      />
    </SafeAdContainer>
  );
};

const styles = StyleSheet.create({
  loadingPlaceholder: {
    height: 50,
    width: '100%',
    backgroundColor: Colors.surfaceVariant,
    borderRadius: 4,
  },
});

export default BannerAdComponent;
