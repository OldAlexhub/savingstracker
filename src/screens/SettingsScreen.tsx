import React, { useState, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  Modal,
  TouchableOpacity,
  ScrollView,
  Alert,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { useApp } from '../context/AppContext';
import { Colors, Spacing, Typography, BorderRadius, Shadows } from '../theme';
import { exportAllDataJSON, exportSavingsCSV, exportDebtsCSV, exportTextSummary } from '../utils/exports';
import { SUPPORTED_CURRENCIES } from '../data/currencies';
import type { Currency } from '../types';

import Card from '../components/common/Card';
import Button from '../components/common/Button';
import ConfirmDialog from '../components/common/ConfirmDialog';
import SectionHeader from '../components/common/SectionHeader';
import Disclaimer from '../components/common/Disclaimer';
import BannerAdComponent from '../components/ads/BannerAdComponent';
import SafeScrollView from '../components/layout/SafeScrollView';

const PRIVACY_POLICY_TEXT = `Privacy Policy — Savings Tracker by Old Alex Hub

Last updated: 2025

1. INFORMATION WE COLLECT
This app stores all data locally on your device. We do not collect, transmit, or store any personal financial information on external servers.

2. DATA STORAGE
All savings goals, debts, contributions, and preferences are stored exclusively on your device using local storage. You have full control over your data at all times.

3. ADVERTISING
This app uses Google AdMob to display advertisements. AdMob may collect device identifiers and usage data to serve personalized ads. Please review Google's Privacy Policy at policies.google.com for details. You can opt out of personalized ads in your device settings under Privacy > Ads.

4. EXPORTS
When you export data, files are saved to your device's storage. We do not receive copies of exported data.

5. ANALYTICS
We do not use analytics services that track individual user behavior beyond what AdMob collects.

6. CHILDREN'S PRIVACY
This app is not directed at children under 13.

7. CHANGES
We may update this policy. Continued use of the app constitutes acceptance of changes.

8. CONTACT
Questions? Contact us at: oldalexhub@gmail.com`;

const ADS_DISCLOSURE_TEXT = `Ads Disclosure

Savings Tracker is free to use and supported by advertising provided by Google AdMob.

What this means for you:
• Ads help keep this app free for everyone.
• Google AdMob may collect device identifiers (like Advertising ID) for ad targeting purposes.
• You may see personalized or non-personalized ads based on your device settings.

How to opt out:
• On Android: Settings > Privacy > Ads > Opt out of Ads Personalization
• On iOS: Settings > Privacy > Apple Advertising > Limit Ad Tracking

We respect your privacy. All your financial data stays on your device and is never shared with advertisers.`;

const SettingsScreen: React.FC = () => {
  const insets = useSafeAreaInsets();
  const { data, updatePreferences, clearAllData } = useApp();

  const [showCurrencyModal, setShowCurrencyModal] = useState(false);
  const [showPrivacyModal, setShowPrivacyModal] = useState(false);
  const [showAdsModal, setShowAdsModal] = useState(false);
  const [showClearConfirm, setShowClearConfirm] = useState(false);

  const [exportingJSON, setExportingJSON] = useState(false);
  const [exportingCSVSavings, setExportingCSVSavings] = useState(false);
  const [exportingCSVDebts, setExportingCSVDebts] = useState(false);
  const [exportingText, setExportingText] = useState(false);
  const [clearingData, setClearingData] = useState(false);

  const currency = data.preferences.currency;
  const currentCurrencyOption =
    SUPPORTED_CURRENCIES.find(c => c.code === currency) ?? SUPPORTED_CURRENCIES[0];

  // ── Currency ───────────────────────────────────────────────────────────────

  const handleSelectCurrency = useCallback(
    async (selected: Currency) => {
      setShowCurrencyModal(false);
      if (selected === currency) return;
      try {
        await updatePreferences({ currency: selected });
      } catch {
        Alert.alert('Error', 'Failed to update currency. Please try again.');
      }
    },
    [currency, updatePreferences],
  );

  // ── Exports ────────────────────────────────────────────────────────────────

  const handleExportJSON = useCallback(async () => {
    setExportingJSON(true);
    try {
      await exportAllDataJSON(data, data.preferences);
      Alert.alert('Success', 'All data exported as JSON backup.');
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Export failed.';
      Alert.alert('Export Error', msg);
    } finally {
      setExportingJSON(false);
    }
  }, [data]);

  const handleExportSavingsCSV = useCallback(async () => {
    setExportingCSVSavings(true);
    try {
      await exportSavingsCSV(data.savingsGoals, data.contributions, data.preferences);
      Alert.alert('Success', 'Savings data exported as CSV.');
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Export failed.';
      Alert.alert('Export Error', msg);
    } finally {
      setExportingCSVSavings(false);
    }
  }, [data]);

  const handleExportDebtsCSV = useCallback(async () => {
    setExportingCSVDebts(true);
    try {
      await exportDebtsCSV(data.debtAccounts, data.debtPayments, data.preferences);
      Alert.alert('Success', 'Debt data exported as CSV.');
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Export failed.';
      Alert.alert('Export Error', msg);
    } finally {
      setExportingCSVDebts(false);
    }
  }, [data]);

  const handleExportTextSummary = useCallback(async () => {
    setExportingText(true);
    try {
      await exportTextSummary(data, data.preferences);
      Alert.alert('Success', 'Summary report exported.');
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Export failed.';
      Alert.alert('Export Error', msg);
    } finally {
      setExportingText(false);
    }
  }, [data]);

  // ── Clear Data ─────────────────────────────────────────────────────────────

  const handleClearData = useCallback(async () => {
    setShowClearConfirm(false);
    setClearingData(true);
    try {
      await clearAllData();
      Alert.alert('Done', 'All data has been cleared.');
    } catch {
      Alert.alert('Error', 'Failed to clear data. Please try again.');
    } finally {
      setClearingData(false);
    }
  }, [clearAllData]);

  // ── Currency Modal ─────────────────────────────────────────────────────────

  const renderCurrencyItem = useCallback(
    ({ item }: { item: (typeof SUPPORTED_CURRENCIES)[number] }) => {
      const isSelected = item.code === currency;
      return (
        <TouchableOpacity
          style={[styles.currencyRow, isSelected && styles.currencyRowSelected]}
          onPress={() => handleSelectCurrency(item.code)}
          activeOpacity={0.7}
        >
          <View style={styles.currencySymbolBubble}>
            <Text style={styles.currencySymbol}>{item.code}</Text>
          </View>
          <View style={styles.currencyInfo}>
            <Text style={styles.currencyCode}>{item.code}</Text>
            <Text style={styles.currencyName}>{item.name}</Text>
          </View>
          {isSelected && <Text style={styles.currencyCheck}>✓</Text>}
        </TouchableOpacity>
      );
    },
    [currency, handleSelectCurrency],
  );

  return (
    <View style={styles.screen}>
      {/* Header */}
      <View style={[styles.header, { paddingTop: insets.top + Spacing.md }]}>
        <Text style={styles.headerTitle}>Settings</Text>
      </View>

      <BannerAdComponent />

      <SafeScrollView>
        <View style={styles.content}>

          {/* Preferences */}
          <View style={styles.section}>
            <SectionHeader title="Preferences" style={styles.sectionHeader} />
            <Card style={styles.card}>
              <TouchableOpacity
                style={styles.settingRow}
                onPress={() => setShowCurrencyModal(true)}
                activeOpacity={0.7}
              >
                <View style={styles.settingInfo}>
                  <Text style={styles.settingLabel}>Currency</Text>
                  <Text style={styles.settingValue}>
                    {currentCurrencyOption.code} - {currentCurrencyOption.name}
                  </Text>
                </View>
                <Text style={styles.settingArrow}>›</Text>
              </TouchableOpacity>
              <View style={styles.settingDivider} />
              <Text style={styles.settingNote}>
                Currency affects how amounts are displayed throughout the app.
              </Text>
            </Card>
          </View>

          {/* Export Data */}
          <View style={styles.section}>
            <SectionHeader title="Export Data" style={styles.sectionHeader} />
            <Card style={styles.card}>
              <View style={styles.exportRow}>
                <View style={styles.exportInfo}>
                  <Text style={styles.exportTitle}>Export All Data (JSON)</Text>
                  <Text style={styles.exportDesc}>Full backup of all data</Text>
                </View>
                <Button
                  title="Export"
                  onPress={handleExportJSON}
                  variant="primary"
                  size="sm"
                  loading={exportingJSON}
                  icon="📦"
                />
              </View>

              <View style={styles.exportDivider} />

              <View style={styles.exportRow}>
                <View style={styles.exportInfo}>
                  <Text style={styles.exportTitle}>Export Savings (CSV)</Text>
                  <Text style={styles.exportDesc}>Goals and contributions</Text>
                </View>
                <Button
                  title="Export"
                  onPress={handleExportSavingsCSV}
                  variant="outline"
                  size="sm"
                  loading={exportingCSVSavings}
                  icon="📊"
                />
              </View>

              <View style={styles.exportDivider} />

              <View style={styles.exportRow}>
                <View style={styles.exportInfo}>
                  <Text style={styles.exportTitle}>Export Debts (CSV)</Text>
                  <Text style={styles.exportDesc}>Debt accounts and payments</Text>
                </View>
                <Button
                  title="Export"
                  onPress={handleExportDebtsCSV}
                  variant="outline"
                  size="sm"
                  loading={exportingCSVDebts}
                  icon="📊"
                />
              </View>

              <View style={styles.exportDivider} />

              <View style={styles.exportRow}>
                <View style={styles.exportInfo}>
                  <Text style={styles.exportTitle}>Export Summary (Text)</Text>
                  <Text style={styles.exportDesc}>Human-readable report</Text>
                </View>
                <Button
                  title="Export"
                  onPress={handleExportTextSummary}
                  variant="ghost"
                  size="sm"
                  loading={exportingText}
                  icon="📄"
                />
              </View>
            </Card>
          </View>

          {/* About */}
          <View style={styles.section}>
            <SectionHeader title="About" style={styles.sectionHeader} />
            <Card style={styles.card}>
              <View style={styles.aboutRow}>
                <Text style={styles.aboutLabel}>App Name</Text>
                <Text style={styles.aboutValue}>Savings Tracker</Text>
              </View>
              <View style={styles.aboutDivider} />
              <View style={styles.aboutRow}>
                <Text style={styles.aboutLabel}>Version</Text>
                <Text style={styles.aboutValue}>1.0.0</Text>
              </View>
              <View style={styles.aboutDivider} />
              <View style={styles.aboutRow}>
                <Text style={styles.aboutLabel}>Developer</Text>
                <Text style={styles.aboutValue}>Old Alex Hub</Text>
              </View>
              <View style={styles.aboutDivider} />
              <View style={styles.aboutButtonRow}>
                <Button
                  title="Privacy Policy"
                  onPress={() => setShowPrivacyModal(true)}
                  variant="ghost"
                  size="sm"
                  style={styles.aboutBtn}
                />
                <Button
                  title="Ads Disclosure"
                  onPress={() => setShowAdsModal(true)}
                  variant="ghost"
                  size="sm"
                  style={styles.aboutBtn}
                />
              </View>
            </Card>
          </View>

          {/* Data Management */}
          <View style={styles.section}>
            <SectionHeader title="Data Management" style={styles.sectionHeader} />
            <Card style={styles.card}>
              <Text style={styles.dangerWarning}>
                ⚠ This action permanently deletes all your data and cannot be undone.
              </Text>
              <Button
                title="Clear All Data"
                onPress={() => setShowClearConfirm(true)}
                variant="danger"
                size="md"
                loading={clearingData}
                icon="🗑"
                style={styles.dangerButton}
              />
            </Card>
          </View>

          <Disclaimer style={styles.disclaimer} />
        </View>
      </SafeScrollView>

      {/* Currency Modal */}
      <Modal
        visible={showCurrencyModal}
        animationType="slide"
        transparent
        onRequestClose={() => setShowCurrencyModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={[styles.modalSheet, { paddingBottom: insets.bottom }]}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Select Currency</Text>
              <TouchableOpacity
                onPress={() => setShowCurrencyModal(false)}
                style={styles.modalClose}
                activeOpacity={0.7}
              >
                <Text style={styles.modalCloseText}>✕</Text>
              </TouchableOpacity>
            </View>
            <FlatList
              data={SUPPORTED_CURRENCIES}
              keyExtractor={item => item.code}
              renderItem={renderCurrencyItem}
              style={styles.currencyList}
              ItemSeparatorComponent={() => <View style={styles.currencyDivider} />}
            />
          </View>
        </View>
      </Modal>

      {/* Privacy Policy Modal */}
      <Modal
        visible={showPrivacyModal}
        animationType="slide"
        transparent
        onRequestClose={() => setShowPrivacyModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={[styles.modalSheet, { paddingBottom: insets.bottom }]}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Privacy Policy</Text>
              <TouchableOpacity
                onPress={() => setShowPrivacyModal(false)}
                style={styles.modalClose}
                activeOpacity={0.7}
              >
                <Text style={styles.modalCloseText}>✕</Text>
              </TouchableOpacity>
            </View>
            <ScrollView
              style={styles.policyScroll}
              contentContainerStyle={styles.policyContent}
              showsVerticalScrollIndicator={false}
            >
              <Text style={styles.policyText}>{PRIVACY_POLICY_TEXT}</Text>
            </ScrollView>
            <View style={styles.modalFooter}>
              <Button
                title="Close"
                onPress={() => setShowPrivacyModal(false)}
                variant="primary"
                size="md"
              />
            </View>
          </View>
        </View>
      </Modal>

      {/* Ads Disclosure Modal */}
      <Modal
        visible={showAdsModal}
        animationType="slide"
        transparent
        onRequestClose={() => setShowAdsModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={[styles.modalSheet, { paddingBottom: insets.bottom }]}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Ads Disclosure</Text>
              <TouchableOpacity
                onPress={() => setShowAdsModal(false)}
                style={styles.modalClose}
                activeOpacity={0.7}
              >
                <Text style={styles.modalCloseText}>✕</Text>
              </TouchableOpacity>
            </View>
            <ScrollView
              style={styles.policyScroll}
              contentContainerStyle={styles.policyContent}
              showsVerticalScrollIndicator={false}
            >
              <Text style={styles.policyText}>{ADS_DISCLOSURE_TEXT}</Text>
            </ScrollView>
            <View style={styles.modalFooter}>
              <Button
                title="Got It"
                onPress={() => setShowAdsModal(false)}
                variant="primary"
                size="md"
              />
            </View>
          </View>
        </View>
      </Modal>

      {/* Clear All Data Confirm */}
      <ConfirmDialog
        visible={showClearConfirm}
        title="Clear All Data?"
        message="This will permanently delete all your savings goals, contributions, debts, and payment history. This action cannot be undone. Are you sure?"
        confirmLabel="Yes, Delete Everything"
        cancelLabel="Cancel"
        destructive
        onConfirm={handleClearData}
        onCancel={() => setShowClearConfirm(false)}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.md,
    backgroundColor: Colors.surface,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  headerTitle: {
    ...Typography.h3,
    color: Colors.text,
  },
  content: {
    padding: Spacing.md,
  },
  section: {
    marginBottom: Spacing.lg,
  },
  sectionHeader: {
    marginBottom: Spacing.sm,
  },
  card: {
    padding: Spacing.md,
  },

  // Settings Row
  settingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: Spacing.xs,
  },
  settingInfo: {
    flex: 1,
  },
  settingLabel: {
    ...Typography.label,
    color: Colors.textMuted,
    textTransform: 'uppercase',
    marginBottom: 2,
  },
  settingValue: {
    ...Typography.body,
    color: Colors.text,
    fontWeight: '500',
  },
  settingArrow: {
    fontSize: 22,
    color: Colors.textMuted,
    fontWeight: '700',
  },
  settingDivider: {
    height: 1,
    backgroundColor: Colors.divider,
    marginVertical: Spacing.sm,
  },
  settingNote: {
    ...Typography.caption,
    color: Colors.textMuted,
    fontStyle: 'italic',
  },

  // Export Rows
  exportRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: Spacing.xs,
  },
  exportInfo: {
    flex: 1,
    marginRight: Spacing.sm,
  },
  exportTitle: {
    ...Typography.body,
    color: Colors.text,
    fontWeight: '500',
  },
  exportDesc: {
    ...Typography.caption,
    color: Colors.textMuted,
  },
  exportDivider: {
    height: 1,
    backgroundColor: Colors.divider,
    marginVertical: Spacing.sm,
  },

  // About
  aboutRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: Spacing.xs,
  },
  aboutLabel: {
    ...Typography.body,
    color: Colors.textSecondary,
  },
  aboutValue: {
    ...Typography.body,
    color: Colors.text,
    fontWeight: '500',
  },
  aboutDivider: {
    height: 1,
    backgroundColor: Colors.divider,
    marginVertical: Spacing.sm,
  },
  aboutButtonRow: {
    flexDirection: 'row',
    gap: Spacing.sm,
    marginTop: Spacing.xs,
  },
  aboutBtn: {
    flex: 1,
  },

  // Data Management
  dangerWarning: {
    ...Typography.body,
    color: Colors.warning,
    backgroundColor: Colors.warningLight,
    padding: Spacing.sm,
    borderRadius: BorderRadius.md,
    marginBottom: Spacing.md,
  },
  dangerButton: {
    width: '100%',
  },

  // Disclaimer
  disclaimer: {
    marginBottom: Spacing.xl,
  },

  // Modal Overlay
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'flex-end',
  },
  modalSheet: {
    backgroundColor: Colors.surface,
    borderTopLeftRadius: BorderRadius.xl,
    borderTopRightRadius: BorderRadius.xl,
    maxHeight: '80%',
    ...Shadows.lg,
  },
  modalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: Spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  modalTitle: {
    ...Typography.h4,
    color: Colors.text,
  },
  modalClose: {
    width: 32,
    height: 32,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: BorderRadius.round,
    backgroundColor: Colors.surfaceVariant,
  },
  modalCloseText: {
    fontSize: 16,
    color: Colors.textSecondary,
    fontWeight: '600',
  },
  modalFooter: {
    padding: Spacing.md,
    borderTopWidth: 1,
    borderTopColor: Colors.border,
  },

  // Currency List
  currencyList: {
    maxHeight: 360,
  },
  currencyRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.md,
  },
  currencyRowSelected: {
    backgroundColor: Colors.primaryFade,
  },
  currencySymbolBubble: {
    width: 52,
    height: 40,
    borderRadius: BorderRadius.md,
    backgroundColor: Colors.primaryFade,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: Spacing.md,
  },
  currencySymbol: {
    ...Typography.label,
    color: Colors.primary,
  },
  currencyInfo: {
    flex: 1,
  },
  currencyCode: {
    ...Typography.body,
    color: Colors.text,
    fontWeight: '600',
  },
  currencyName: {
    ...Typography.caption,
    color: Colors.textMuted,
  },
  currencyCheck: {
    fontSize: 18,
    color: Colors.primary,
    fontWeight: '700',
  },
  currencyDivider: {
    height: 1,
    backgroundColor: Colors.divider,
    marginHorizontal: Spacing.md,
  },

  // Policy
  policyScroll: {
    flexGrow: 0,
  },
  policyContent: {
    padding: Spacing.md,
  },
  policyText: {
    ...Typography.body,
    color: Colors.textSecondary,
    lineHeight: 22,
  },
});

export default SettingsScreen;
