import React, {useState} from 'react';
import {
  Alert,
  Modal,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import DeviceInfo from 'react-native-device-info';
import {AdsConsent} from 'react-native-google-mobile-ads';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import {useSafeAreaInsets} from 'react-native-safe-area-context';

import ConfirmDialog from '../components/common/ConfirmDialog';
import SafeScrollView from '../components/layout/SafeScrollView';
import {useApp} from '../context/AppContext';
import {SUPPORTED_CURRENCIES} from '../data/currencies';
import {BorderRadius, Colors, Shadows, Spacing, Typography} from '../theme';
import type {Currency} from '../types';
import {
  exportAllDataJSON,
  exportDebtsCSV,
  exportSavingsCSV,
  exportTextSummary,
} from '../utils/exports';

const PRIVACY_TEXT = `Savings Tracker data collection

Savings Tracker works offline, but anonymous data collection is required for continued use. We upload your exact savings goals, debts, balances, APRs, target and activity dates, contribution and payment history, names, and notes to our service at tracking.server.oldalexhub.com. Names and notes are uploaded unchanged, so do not enter your name, account numbers, contact details, or other personal information. Free text cannot be guaranteed anonymous.

We also collect an app-generated installation ID, manufacturer and model, Android version, app version, locale, timezone, screen class, app activity, sync diagnostics, and capability information. We do not collect IMEI, hardware serial, contacts, GPS location, email, phone number, or a first-party Advertising ID.

Data supports deterministic forecasts, risk detection, next-best actions, feature analytics, reliability monitoring, experiments, and aggregate model development. Device characteristics are excluded from financial recommendations. Google and its partners may process advertising data under your regional consent choices.

Active finance snapshots are retained until you delete them or after 24 months of installation inactivity. Raw analytics are retained for 13 months. Non-reversible aggregate statistics may remain. Data is encrypted in transit; local finance data is encrypted with a key protected by Android Keystore. There is no account, cloud restore, or cross-device recovery.

“Delete this installation” attempts to purge the current installation’s server records before clearing the device. It requires a connection so the app never discards the only deletion credential before the server confirms the purge.`;

const DISCLAIMER_TEXT = `Savings Tracker provides educational calculations and estimates—not financial, investment, tax, legal, or credit advice. Forecasts, completion ranges, on-track probabilities, payoff dates, interest totals, risks, and next actions may be incomplete or inaccurate and are always labeled “Estimated.” Results depend on the information you enter and assumptions that may not match actual interest, fees, compounding, payment timing, income, or market conditions.

You are responsible for financial decisions. Verify important calculations and consider a qualified professional before acting. Never delay required debt payments based on an app estimate.`;

interface SettingRowProps {
  icon: string;
  title: string;
  subtitle: string;
  onPress?: () => void;
  tone?: 'normal' | 'danger';
}

function SettingRow({icon, title, subtitle, onPress, tone = 'normal'}: SettingRowProps) {
  return (
    <TouchableOpacity
      accessibilityRole={onPress ? 'button' : undefined}
      activeOpacity={onPress ? 0.75 : 1}
      style={styles.settingRow}
      onPress={onPress}>
      <View style={[styles.settingIcon, tone === 'danger' && styles.dangerIcon]}>
        <Icon name={icon} size={21} color={tone === 'danger' ? Colors.error : Colors.primaryDark} />
      </View>
      <View style={styles.settingCopy}>
        <Text style={[styles.settingTitle, tone === 'danger' && styles.dangerText]}>{title}</Text>
        <Text style={styles.settingSubtitle}>{subtitle}</Text>
      </View>
      {onPress ? <Icon name="chevron-right" size={22} color={Colors.textMuted} /> : null}
    </TouchableOpacity>
  );
}

export default function SettingsScreen(): React.JSX.Element {
  const insets = useSafeAreaInsets();
  const {
    data,
    updatePreferences,
    clearAllData,
    syncStatus,
    pendingSyncCount,
    lastSyncedAt,
    trackEvent,
  } = useApp();
  const [modal, setModal] = useState<'privacy' | 'disclaimer' | 'currency' | null>(null);
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [exporting, setExporting] = useState<string | null>(null);

  const chooseCurrency = async (currency: Currency) => {
    await updatePreferences({currency});
    setModal(null);
  };

  const chooseTheme = async (themeMode: 'system' | 'light' | 'dark') => {
    await updatePreferences({themeMode});
  };

  const exportData = async (kind: 'json' | 'savings' | 'debts' | 'summary') => {
    setExporting(kind);
    try {
      if (kind === 'json') await exportAllDataJSON(data, data.preferences);
      if (kind === 'savings') await exportSavingsCSV(data.savingsGoals, data.contributions, data.preferences);
      if (kind === 'debts') await exportDebtsCSV(data.debtAccounts, data.debtPayments, data.preferences);
      if (kind === 'summary') await exportTextSummary(data, data.preferences);
      await trackEvent('export_completed', 'Settings', {type: kind});
    } catch (reason) {
      Alert.alert('Export unavailable', reason instanceof Error ? reason.message : 'Please try again.');
    } finally {
      setExporting(null);
    }
  };

  const deleteInstallation = async () => {
    setConfirmDelete(false);
    setDeleting(true);
    try {
      await clearAllData();
    } catch {
      Alert.alert(
        'Connect to finish deletion',
        'Savings Tracker must confirm the server purge before it clears the anonymous installation token. Connect to the internet and try again.',
      );
    } finally {
      setDeleting(false);
    }
  };

  const openAdChoices = async () => {
    try {
      await AdsConsent.showPrivacyOptionsForm();
    } catch {
      Alert.alert('Ad privacy choices', 'No regional ad privacy form is required for this device right now.');
    }
  };

  const syncCopy = syncStatus === 'synced'
    ? `Up to date${lastSyncedAt ? ` • ${new Date(lastSyncedAt).toLocaleTimeString([], {hour: 'numeric', minute: '2-digit'})}` : ''}`
    : syncStatus === 'offline'
      ? `Offline • ${pendingSyncCount} queued`
      : syncStatus === 'syncing'
        ? 'Sending encrypted updates…'
        : `${pendingSyncCount} update${pendingSyncCount === 1 ? '' : 's'} queued`;

  return (
    <View style={styles.screen}>
      <View style={[styles.header, {paddingTop: insets.top + 12}]}>
        <Text style={styles.eyebrow}>CONTROL CENTER</Text>
        <Text style={styles.headerTitle}>Settings</Text>
      </View>

      <SafeScrollView>
        <View style={styles.content}>
          <Text style={styles.sectionLabel}>DATA & SYNC</Text>
          <View style={styles.card}>
            <SettingRow icon="cloud-check-outline" title="Anonymous sync" subtitle={syncCopy} />
            <View style={styles.divider} />
            <SettingRow
              icon="server-security"
              title="Analysis service"
              subtitle="tracking.server.oldalexhub.com • required"
            />
          </View>

          <Text style={styles.sectionLabel}>PREFERENCES</Text>
          <View style={styles.card}>
            <SettingRow
              icon="currency-usd"
              title="Display currency"
              subtitle={`${data.preferences.currency} • amounts are never converted`}
              onPress={() => setModal('currency')}
            />
            <View style={styles.divider} />
            <View style={styles.themeRow}>
              <View style={styles.settingIcon}><Icon name="theme-light-dark" size={21} color={Colors.primaryDark} /></View>
              <View style={styles.settingCopy}>
                <Text style={styles.settingTitle}>Appearance</Text>
                <View style={styles.themeOptions}>
                  {(['system', 'light', 'dark'] as const).map(mode => (
                    <TouchableOpacity
                      key={mode}
                      style={[styles.themeOption, data.preferences.themeMode === mode && styles.themeOptionActive]}
                      onPress={() => void chooseTheme(mode)}>
                      <Text style={[styles.themeOptionText, data.preferences.themeMode === mode && styles.themeOptionTextActive]}>
                        {mode[0].toUpperCase() + mode.slice(1)}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </View>
              </View>
            </View>
          </View>

          <Text style={styles.sectionLabel}>YOUR DATA</Text>
          <View style={styles.card}>
            <SettingRow icon="database-export-outline" title="Export full JSON" subtitle={exporting === 'json' ? 'Preparing…' : 'Complete local backup'} onPress={() => void exportData('json')} />
            <View style={styles.divider} />
            <SettingRow icon="file-delimited-outline" title="Export savings CSV" subtitle={exporting === 'savings' ? 'Preparing…' : 'Goals and contributions'} onPress={() => void exportData('savings')} />
            <View style={styles.divider} />
            <SettingRow icon="file-delimited-outline" title="Export debt CSV" subtitle={exporting === 'debts' ? 'Preparing…' : 'Accounts and payment history'} onPress={() => void exportData('debts')} />
            <View style={styles.divider} />
            <SettingRow icon="file-document-outline" title="Export text summary" subtitle={exporting === 'summary' ? 'Preparing…' : 'A readable offline report'} onPress={() => void exportData('summary')} />
            <View style={styles.divider} />
            <SettingRow
              icon="delete-forever-outline"
              title={deleting ? 'Deleting installation…' : 'Delete this installation'}
              subtitle="Purges server records, then this device"
              tone="danger"
              onPress={() => setConfirmDelete(true)}
            />
          </View>

          <Text style={styles.sectionLabel}>PRIVACY & GUIDANCE</Text>
          <View style={styles.card}>
            <SettingRow icon="shield-account-outline" title="Data collection & privacy" subtitle="What is collected, why, and for how long" onPress={() => setModal('privacy')} />
            <View style={styles.divider} />
            <SettingRow icon="advertisements-off" title="Ad privacy choices" subtitle="Regional Google consent and personalization options" onPress={() => void openAdChoices()} />
            <View style={styles.divider} />
            <SettingRow icon="scale-balance" title="Financial disclaimer" subtitle="Important limits of estimates and guidance" onPress={() => setModal('disclaimer')} />
          </View>

          <View style={styles.disclaimerCard}>
            <View style={styles.disclaimerHeader}>
              <Icon name="information-outline" size={20} color={Colors.warning} />
              <Text style={styles.disclaimerTitle}>Estimates, not advice</Text>
            </View>
            <Text style={styles.disclaimerPreview}>
              Savings Tracker provides educational estimates only. Verify important calculations before making financial decisions.
            </Text>
            <TouchableOpacity onPress={() => setModal('disclaimer')}>
              <Text style={styles.readMore}>Read the full disclaimer</Text>
            </TouchableOpacity>
          </View>

          <Text style={styles.version}>
            Savings Tracker {DeviceInfo.getVersion()} ({DeviceInfo.getBuildNumber()}) • Old Alex Hub
          </Text>
        </View>
      </SafeScrollView>

      <Modal
        visible={modal !== null}
        transparent
        animationType="slide"
        onRequestClose={() => setModal(null)}>
        <View style={styles.modalOverlay}>
          <View style={[styles.sheet, {paddingBottom: Math.max(insets.bottom, 16)}]}>
            <View style={styles.sheetHandle} />
            <View style={styles.sheetHeader}>
              <Text style={styles.sheetTitle}>
                {modal === 'privacy' ? 'Data collection & privacy' : modal === 'disclaimer' ? 'Financial disclaimer' : 'Display currency'}
              </Text>
              <TouchableOpacity style={styles.closeButton} onPress={() => setModal(null)}>
                <Icon name="close" size={22} color={Colors.text} />
              </TouchableOpacity>
            </View>
            {modal === 'currency' ? (
              <ScrollView style={styles.sheetScroll}>
                {SUPPORTED_CURRENCIES.map(item => (
                  <TouchableOpacity
                    key={item.code}
                    style={styles.currencyRow}
                    onPress={() => void chooseCurrency(item.code)}>
                    <View style={styles.currencyCode}><Text style={styles.currencyCodeText}>{item.code}</Text></View>
                    <Text style={styles.currencyName}>{item.name}</Text>
                    {data.preferences.currency === item.code ? <Icon name="check-circle" size={22} color={Colors.primary} /> : null}
                  </TouchableOpacity>
                ))}
              </ScrollView>
            ) : (
              <ScrollView style={styles.sheetScroll} contentContainerStyle={styles.policyContent}>
                <Text style={styles.policyText}>{modal === 'privacy' ? PRIVACY_TEXT : DISCLAIMER_TEXT}</Text>
              </ScrollView>
            )}
          </View>
        </View>
      </Modal>

      <ConfirmDialog
        visible={confirmDelete}
        title="Delete this installation?"
        message="While connected, Savings Tracker will permanently purge this installation’s raw server records and then erase the encrypted local data. This cannot be undone or restored."
        confirmLabel="Delete everywhere"
        cancelLabel="Keep my data"
        destructive
        onConfirm={() => void deleteInstallation()}
        onCancel={() => setConfirmDelete(false)}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  screen: {flex: 1, backgroundColor: Colors.background},
  header: {backgroundColor: '#092A23', paddingHorizontal: Spacing.lg, paddingBottom: 22, borderBottomLeftRadius: 28, borderBottomRightRadius: 28},
  eyebrow: {...Typography.label, color: '#65D8AD', letterSpacing: 1.3},
  headerTitle: {fontSize: 30, fontWeight: '800', letterSpacing: -1, color: '#F4FFF9', marginTop: 2},
  content: {padding: Spacing.md, paddingTop: 10},
  sectionLabel: {fontSize: 10, fontWeight: '800', letterSpacing: 1.3, color: Colors.textMuted, marginTop: 22, marginBottom: 8, marginLeft: 4},
  card: {backgroundColor: Colors.surface, borderWidth: 1, borderColor: Colors.border, borderRadius: BorderRadius.lg, overflow: 'hidden', ...Shadows.sm},
  settingRow: {minHeight: 74, flexDirection: 'row', alignItems: 'center', paddingHorizontal: 15, paddingVertical: 12},
  settingIcon: {width: 40, height: 40, borderRadius: 14, backgroundColor: Colors.primaryFade, alignItems: 'center', justifyContent: 'center', marginRight: 12},
  dangerIcon: {backgroundColor: Colors.errorLight},
  settingCopy: {flex: 1},
  settingTitle: {...Typography.body, fontWeight: '700', color: Colors.text},
  settingSubtitle: {...Typography.caption, color: Colors.textMuted, marginTop: 2},
  dangerText: {color: Colors.error},
  divider: {height: 1, backgroundColor: Colors.divider, marginLeft: 67},
  themeRow: {flexDirection: 'row', paddingHorizontal: 15, paddingVertical: 14},
  themeOptions: {flexDirection: 'row', backgroundColor: Colors.surfaceVariant, padding: 3, borderRadius: 12, marginTop: 8},
  themeOption: {flex: 1, alignItems: 'center', paddingVertical: 7, borderRadius: 9},
  themeOptionActive: {backgroundColor: Colors.surface},
  themeOptionText: {fontSize: 11, fontWeight: '600', color: Colors.textMuted},
  themeOptionTextActive: {color: Colors.primaryDark},
  disclaimerCard: {borderWidth: 1, borderColor: Colors.border, backgroundColor: Colors.warningLight, borderRadius: BorderRadius.lg, padding: 16, marginTop: 22},
  disclaimerHeader: {flexDirection: 'row', alignItems: 'center', gap: 8},
  disclaimerTitle: {...Typography.h4, color: Colors.text},
  disclaimerPreview: {...Typography.body, color: Colors.textSecondary, marginTop: 8},
  readMore: {...Typography.body, fontWeight: '700', color: Colors.warning, marginTop: 9},
  version: {...Typography.caption, color: Colors.textMuted, textAlign: 'center', marginVertical: 24},
  modalOverlay: {flex: 1, backgroundColor: 'rgba(3, 18, 14, 0.58)', justifyContent: 'flex-end'},
  sheet: {maxHeight: '88%', minHeight: '42%', backgroundColor: Colors.surface, borderTopLeftRadius: 28, borderTopRightRadius: 28},
  sheetHandle: {width: 42, height: 5, borderRadius: 3, backgroundColor: Colors.border, alignSelf: 'center', marginTop: 9},
  sheetHeader: {flexDirection: 'row', alignItems: 'center', padding: 18, borderBottomWidth: 1, borderBottomColor: Colors.divider},
  sheetTitle: {...Typography.h3, color: Colors.text, flex: 1},
  closeButton: {width: 38, height: 38, borderRadius: 14, backgroundColor: Colors.surfaceVariant, alignItems: 'center', justifyContent: 'center'},
  sheetScroll: {flexGrow: 0},
  policyContent: {padding: 18, paddingBottom: 28},
  policyText: {...Typography.body, color: Colors.textSecondary, lineHeight: 23},
  currencyRow: {height: 62, flexDirection: 'row', alignItems: 'center', paddingHorizontal: 18, borderBottomWidth: 1, borderBottomColor: Colors.divider},
  currencyCode: {width: 50, height: 34, borderRadius: 11, backgroundColor: Colors.primaryFade, alignItems: 'center', justifyContent: 'center', marginRight: 12},
  currencyCodeText: {fontSize: 11, fontWeight: '800', color: Colors.primaryDark},
  currencyName: {...Typography.body, color: Colors.text, flex: 1},
});
