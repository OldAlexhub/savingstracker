import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { Colors, Spacing, Typography } from '../../theme';
import { SAVINGS_STRATEGIES } from '../../data/strategies';
import Card from '../../components/common/Card';
import SafeScrollView from '../../components/layout/SafeScrollView';

export default function SavingsStrategyScreen(): React.JSX.Element {
  const [expandedId, setExpandedId] = useState<string | null>(null);

  return (
    <SafeScrollView>
      <View style={styles.container}>
        <Text style={styles.intro}>
          Learn about different savings strategies. These are educational overviews to help you choose
          the approach that best fits your goals and lifestyle.
        </Text>

        {SAVINGS_STRATEGIES.map(strategy => {
          const isExpanded = expandedId === strategy.id;
          return (
            <Card key={strategy.id} style={styles.strategyCard}>
              <TouchableOpacity
                onPress={() => setExpandedId(isExpanded ? null : strategy.id)}
                activeOpacity={0.8}
              >
                <View style={styles.strategyHeader}>
                  <View style={styles.strategyHeaderText}>
                    <Text style={styles.strategyName}>{strategy.name}</Text>
                    <Text style={styles.strategyPreview} numberOfLines={isExpanded ? undefined : 2}>
                      {strategy.description}
                    </Text>
                  </View>
                  <Text style={styles.expandIcon}>{isExpanded ? '▲' : '▼'}</Text>
                </View>
              </TouchableOpacity>

              {isExpanded ? (
                <View style={styles.expandedContent}>
                  <View style={styles.divider} />

                  <View style={styles.infoBlock}>
                    <Text style={styles.infoLabel}>REQUIRED INPUTS</Text>
                    {strategy.requiredInputs.map((input, i) => (
                      <Text key={i} style={styles.infoItem}>• {input}</Text>
                    ))}
                  </View>

                  <View style={styles.infoBlock}>
                    <Text style={styles.infoLabel}>HOW IT WORKS</Text>
                    <Text style={styles.infoText}>{strategy.calculationDescription}</Text>
                  </View>

                  <View style={styles.infoBlock}>
                    <Text style={styles.infoLabel}>LIMITATIONS</Text>
                    <Text style={styles.infoText}>{strategy.limitations}</Text>
                  </View>

                </View>
              ) : null}
            </Card>
          );
        })}

      </View>
    </SafeScrollView>
  );
}

const styles = StyleSheet.create({
  container: { padding: Spacing.md },
  intro: { ...Typography.body, color: Colors.textSecondary, lineHeight: 22, marginBottom: Spacing.lg },
  strategyCard: { padding: Spacing.md, marginBottom: Spacing.sm },
  strategyHeader: { flexDirection: 'row', alignItems: 'flex-start' },
  strategyHeaderText: { flex: 1, marginRight: Spacing.sm },
  strategyName: { ...Typography.h4, color: Colors.text, marginBottom: Spacing.xs },
  strategyPreview: { ...Typography.body, color: Colors.textSecondary, lineHeight: 20 },
  expandIcon: { fontSize: 14, color: Colors.textMuted, marginTop: 2 },
  expandedContent: { marginTop: Spacing.sm },
  divider: { height: 1, backgroundColor: Colors.divider, marginBottom: Spacing.md },
  infoBlock: { marginBottom: Spacing.md },
  infoLabel: { ...Typography.label, color: Colors.textMuted, textTransform: 'uppercase', marginBottom: Spacing.xs },
  infoItem: { ...Typography.body, color: Colors.textSecondary, marginBottom: 2 },
  infoText: { ...Typography.body, color: Colors.textSecondary, lineHeight: 20 },
  footer: { marginTop: Spacing.lg, marginBottom: Spacing.xl },
});
