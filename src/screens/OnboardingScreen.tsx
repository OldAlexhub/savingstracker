import React, {useState} from 'react';
import {
  ActivityIndicator,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import ReactNativeHapticFeedback from 'react-native-haptic-feedback';
import {SafeAreaView} from 'react-native-safe-area-context';

import {useApp} from '../context/AppContext';
import {BorderRadius, Colors, Spacing, Typography} from '../theme';

const DISCLOSURES = [
  {
    icon: 'cloud-sync-outline',
    title: 'Required anonymous sync',
    body: 'Your goals, debts, balances, rates, dates, contribution and payment history are sent securely for forecasts and product analytics.',
  },
  {
    icon: 'text-box-outline',
    title: 'Names and notes are included',
    body: 'Goal and debt names and notes are uploaded unchanged. Please do not enter your name, account numbers, or other personal information.',
  },
  {
    icon: 'cellphone-information',
    title: 'Limited device details',
    body: 'We collect app version, device model, Android version, locale, timezone, screen class, and capabilities—not IMEI, contacts, GPS, email, or phone.',
  },
  {
    icon: 'shield-key-outline',
    title: 'Private by design',
    body: 'There is no account or cross-device recovery. Local data is encrypted, and Settings can delete both this device’s data and its server records.',
  },
] as const;

export default function OnboardingScreen(): React.JSX.Element {
  const {acceptDataCollection} = useApp();
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const accept = async () => {
    setSubmitting(true);
    setError(null);
    try {
      await acceptDataCollection();
      ReactNativeHapticFeedback.trigger('notificationSuccess', {
        enableVibrateFallback: true,
        ignoreAndroidSystemSettings: false,
      });
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : 'Could not save your choice.');
      setSubmitting(false);
    }
  };

  return (
    <SafeAreaView style={styles.safe} edges={['top', 'bottom']}>
      <ScrollView
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
        bounces={false}>
        <View style={styles.brandRow}>
          <View style={styles.logo}>
            <Icon name="chart-timeline-variant-shimmer" size={27} color={Colors.textInverse} />
          </View>
          <Text style={styles.brand}>Savings Tracker</Text>
          <View style={styles.yearPill}>
            <Text style={styles.yearText}>2027</Text>
          </View>
        </View>

        <View style={styles.hero}>
          <Text style={styles.eyebrow}>YOUR MONEY, IN MOTION</Text>
          <Text style={styles.title}>A clearer path to every goal.</Text>
          <Text style={styles.subtitle}>
            Track savings and debt offline, then get explainable forecasts and next steps when connected.
          </Text>
        </View>

        <View style={styles.disclosureCard}>
          <Text style={styles.cardTitle}>Before you continue</Text>
          <Text style={styles.cardIntro}>
            Anonymous data collection is required to use Savings Tracker. Here is exactly what that means.
          </Text>
          {DISCLOSURES.map((item, index) => (
            <View key={item.title} style={[styles.row, index > 0 && styles.rowBorder]}>
              <View style={styles.iconWrap}>
                <Icon name={item.icon} size={21} color={Colors.primaryDark} />
              </View>
              <View style={styles.rowCopy}>
                <Text style={styles.rowTitle}>{item.title}</Text>
                <Text style={styles.rowBody}>{item.body}</Text>
              </View>
            </View>
          ))}
        </View>

        {error ? <Text style={styles.error}>{error}</Text> : null}

        <TouchableOpacity
          accessibilityRole="button"
          accessibilityLabel="Accept data collection and continue"
          style={[styles.acceptButton, submitting && styles.buttonDisabled]}
          disabled={submitting}
          activeOpacity={0.86}
          onPress={() => void accept()}>
          {submitting ? (
            <ActivityIndicator color={Colors.textInverse} />
          ) : (
            <>
              <Text style={styles.acceptText}>Accept & continue</Text>
              <Icon name="arrow-right" size={21} color={Colors.textInverse} />
            </>
          )}
        </TouchableOpacity>
        <Text style={styles.required}>Required collection • No in-app analytics opt-out</Text>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: {flex: 1, backgroundColor: '#081C18'},
  content: {padding: Spacing.lg, paddingBottom: Spacing.xl},
  brandRow: {flexDirection: 'row', alignItems: 'center', marginBottom: 38},
  logo: {
    width: 46,
    height: 46,
    borderRadius: 15,
    backgroundColor: Colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  brand: {fontSize: 18, fontWeight: '700', color: '#F4FFF9', flex: 1},
  yearPill: {borderWidth: 1, borderColor: '#325B50', borderRadius: 99, paddingHorizontal: 10, paddingVertical: 5},
  yearText: {...Typography.label, color: '#8CEAC5'},
  hero: {marginBottom: Spacing.lg},
  eyebrow: {...Typography.label, color: '#65D8AD', letterSpacing: 1.5, marginBottom: 12},
  title: {fontSize: 39, lineHeight: 44, letterSpacing: -1.5, fontWeight: '800', color: '#F4FFF9', maxWidth: 330},
  subtitle: {...Typography.bodyLarge, color: '#A9C9BE', marginTop: 14, lineHeight: 25},
  disclosureCard: {backgroundColor: Colors.surface, borderRadius: BorderRadius.xl, padding: Spacing.lg},
  cardTitle: {...Typography.h2, color: Colors.text},
  cardIntro: {...Typography.body, color: Colors.textSecondary, marginTop: 6, marginBottom: 8},
  row: {flexDirection: 'row', paddingVertical: 15},
  rowBorder: {borderTopWidth: 1, borderTopColor: Colors.divider},
  iconWrap: {
    width: 38,
    height: 38,
    borderRadius: 13,
    backgroundColor: Colors.primaryFade,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  rowCopy: {flex: 1},
  rowTitle: {...Typography.h4, color: Colors.text},
  rowBody: {...Typography.caption, color: Colors.textSecondary, marginTop: 2, lineHeight: 18},
  acceptButton: {
    minHeight: 56,
    borderRadius: BorderRadius.round,
    backgroundColor: Colors.primary,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
    marginTop: Spacing.lg,
  },
  buttonDisabled: {opacity: 0.7},
  acceptText: {fontSize: 16, fontWeight: '700', color: Colors.textInverse},
  required: {...Typography.caption, color: '#71988B', textAlign: 'center', marginTop: 10},
  error: {...Typography.body, color: '#FF9CAA', marginTop: 12, textAlign: 'center'},
});
