import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput as RNTextInput,
  StyleSheet,
  ViewStyle,
  TextStyle,
  KeyboardTypeOptions,
} from 'react-native';
import { Colors, Spacing, Typography, BorderRadius } from '../../theme';

interface TextInputProps {
  label?: string;
  value: string;
  onChangeText: (v: string) => void;
  placeholder?: string;
  error?: string | null;
  helperText?: string;
  keyboardType?: KeyboardTypeOptions;
  multiline?: boolean;
  numberOfLines?: number;
  maxLength?: number;
  secureTextEntry?: boolean;
  editable?: boolean;
  prefix?: string;
  suffix?: string;
  style?: ViewStyle;
  inputStyle?: TextStyle;
  testID?: string;
}

const TextInput: React.FC<TextInputProps> = ({
  label,
  value,
  onChangeText,
  placeholder,
  error,
  helperText,
  keyboardType,
  multiline = false,
  numberOfLines = 1,
  maxLength,
  secureTextEntry = false,
  editable = true,
  prefix,
  suffix,
  style,
  inputStyle,
  testID,
}) => {
  const [focused, setFocused] = useState(false);

  const borderColor = error
    ? Colors.error
    : focused
    ? Colors.primary
    : Colors.border;

  const inputHeight = multiline && numberOfLines > 1
    ? numberOfLines * 22 + Spacing.sm * 2
    : undefined;

  return (
    <View style={[styles.container, style]}>
      {label ? (
        <Text style={styles.label}>{label}</Text>
      ) : null}

      <View
        style={[
          styles.inputRow,
          { borderColor },
          !editable && styles.inputDisabled,
          multiline && styles.inputMultiline,
        ]}
      >
        {prefix ? (
          <Text style={styles.affix}>{prefix}</Text>
        ) : null}

        <RNTextInput
          style={[
            styles.input,
            inputHeight ? { height: inputHeight } : null,
            inputStyle,
          ]}
          value={value}
          onChangeText={onChangeText}
          placeholder={placeholder}
          placeholderTextColor={Colors.textMuted}
          keyboardType={keyboardType}
          multiline={multiline}
          numberOfLines={multiline ? numberOfLines : undefined}
          maxLength={maxLength}
          secureTextEntry={secureTextEntry}
          editable={editable}
          onFocus={() => setFocused(true)}
          onBlur={() => setFocused(false)}
          testID={testID}
          textAlignVertical={multiline ? 'top' : 'center'}
        />

        {suffix ? (
          <Text style={styles.affix}>{suffix}</Text>
        ) : null}
      </View>

      {error ? (
        <Text style={styles.errorText}>{error}</Text>
      ) : helperText ? (
        <Text style={styles.helperText}>{helperText}</Text>
      ) : null}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    marginBottom: Spacing.sm,
  },
  label: {
    ...Typography.label,
    color: Colors.textSecondary,
    marginBottom: Spacing.xs,
    textTransform: 'uppercase',
  },
  inputRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.surface,
    borderWidth: 1.5,
    borderRadius: BorderRadius.md,
    paddingHorizontal: Spacing.sm,
    minHeight: 48,
  },
  inputMultiline: {
    alignItems: 'flex-start',
    paddingVertical: Spacing.sm,
  },
  inputDisabled: {
    backgroundColor: Colors.surfaceVariant,
    borderColor: Colors.border,
  },
  input: {
    flex: 1,
    ...Typography.body,
    color: Colors.text,
    paddingVertical: Spacing.sm,
    paddingHorizontal: Spacing.xs,
  },
  affix: {
    ...Typography.body,
    color: Colors.textMuted,
    paddingHorizontal: Spacing.xs,
  },
  errorText: {
    ...Typography.caption,
    color: Colors.error,
    marginTop: Spacing.xs,
  },
  helperText: {
    ...Typography.caption,
    color: Colors.textMuted,
    marginTop: Spacing.xs,
  },
});

export default TextInput;
