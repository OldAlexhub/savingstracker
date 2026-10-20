import React, {useCallback} from 'react';
import {StyleSheet, Text, TouchableOpacity, View} from 'react-native';
import {DateTimePickerAndroid} from '@react-native-community/datetimepicker';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';

import {BorderRadius, Colors, Spacing, Typography} from '../../theme';
import {formatDate} from '../../utils/formatters';

interface Props {
  label: string;
  value: string;
  onChange: (value: string) => void;
  error?: string;
  helperText?: string;
  minimumDate?: Date;
  maximumDate?: Date;
}

function parseDate(value: string): Date {
  const parsed = new Date(`${value}T12:00:00`);
  return Number.isNaN(parsed.getTime()) ? new Date() : parsed;
}

function toLocalIso(value: Date): string {
  const year = value.getFullYear();
  const month = String(value.getMonth() + 1).padStart(2, '0');
  const day = String(value.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

export default function DateField({
  label,
  value,
  onChange,
  error,
  helperText,
  minimumDate,
  maximumDate,
}: Props): React.JSX.Element {
  const openPicker = useCallback(() => {
    DateTimePickerAndroid.open({
      value: parseDate(value),
      mode: 'date',
      minimumDate,
      maximumDate,
      onChange: (event, selected) => {
        if (event.type === 'set' && selected) {
          onChange(toLocalIso(selected));
        }
      },
    });
  }, [maximumDate, minimumDate, onChange, value]);

  return (
    <View>
      <Text style={styles.label}>{label}</Text>
      <TouchableOpacity
        accessibilityRole="button"
        accessibilityLabel={`${label}, ${value ? formatDate(value) : 'not selected'}`}
        accessibilityHint="Opens the Android date picker"
        activeOpacity={0.75}
        style={[styles.field, error && styles.fieldError]}
        onPress={openPicker}>
        <Text style={[styles.value, !value && styles.placeholder]}>
          {value ? formatDate(value) : 'Choose a date'}
        </Text>
        <Icon name="calendar-blank-outline" size={21} color={Colors.primaryDark} />
      </TouchableOpacity>
      {error ? <Text style={styles.error}>{error}</Text> : helperText ? <Text style={styles.helper}>{helperText}</Text> : null}
    </View>
  );
}

const styles = StyleSheet.create({
  label: {...Typography.label, color: Colors.textSecondary, marginBottom: 7},
  field: {
    minHeight: 52,
    borderRadius: BorderRadius.md,
    borderWidth: 1,
    borderColor: Colors.border,
    backgroundColor: Colors.surface,
    paddingHorizontal: Spacing.md,
    flexDirection: 'row',
    alignItems: 'center',
  },
  fieldError: {borderColor: Colors.error},
  value: {...Typography.bodyLarge, color: Colors.text, flex: 1},
  placeholder: {color: Colors.textMuted},
  error: {...Typography.caption, color: Colors.error, marginTop: 5},
  helper: {...Typography.caption, color: Colors.textMuted, marginTop: 5},
});
