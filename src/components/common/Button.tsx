import React from 'react';
import {
  TouchableOpacity,
  Text,
  ActivityIndicator,
  StyleSheet,
  ViewStyle,
  View,
} from 'react-native';
import { Colors, Spacing, Typography, BorderRadius } from '../../theme';

type ButtonVariant = 'primary' | 'secondary' | 'outline' | 'danger' | 'ghost';
type ButtonSize = 'sm' | 'md' | 'lg';

interface ButtonProps {
  title: string;
  onPress: () => void;
  variant?: ButtonVariant;
  size?: ButtonSize;
  disabled?: boolean;
  loading?: boolean;
  icon?: string;
  style?: ViewStyle;
  testID?: string;
}

const Button: React.FC<ButtonProps> = ({
  title,
  onPress,
  variant = 'primary',
  size = 'md',
  disabled = false,
  loading = false,
  icon,
  style,
  testID,
}) => {
  const isDisabled = disabled || loading;

  const containerStyle = [
    styles.base,
    styles[`size_${size}`],
    styles[`variant_${variant}`],
    isDisabled && styles.disabled,
    style,
  ];

  const textStyle = [
    styles.text,
    styles[`text_${size}`],
    styles[`textVariant_${variant}`],
    isDisabled && styles.textDisabled,
  ];

  const indicatorColor =
    variant === 'outline' || variant === 'ghost'
      ? Colors.primary
      : Colors.textInverse;

  return (
    <TouchableOpacity
      style={containerStyle}
      onPress={onPress}
      disabled={isDisabled}
      activeOpacity={0.8}
      testID={testID}
    >
      {loading ? (
        <ActivityIndicator
          size="small"
          color={indicatorColor}
        />
      ) : (
        <View style={styles.content}>
          {icon ? <Text style={[styles.icon, styles[`text_${size}`], styles[`textVariant_${variant}`]]}>{icon} </Text> : null}
          <Text style={textStyle}>{title}</Text>
        </View>
      )}
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  base: {
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: BorderRadius.round,
    borderWidth: 0,
  },
  content: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  icon: {
    // size/color applied via dynamic styles
  },
  text: {
    ...Typography.button,
  },

  // Sizes
  size_sm: {
    minHeight: 36,
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.xs,
  },
  size_md: {
    minHeight: 46,
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm + 2,
  },
  size_lg: {
    minHeight: 54,
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.md,
    borderRadius: BorderRadius.round,
  },

  // Text sizes
  text_sm: {
    ...Typography.buttonSmall,
  },
  text_md: {
    ...Typography.button,
  },
  text_lg: {
    ...Typography.button,
    fontSize: 18,
  },

  // Variants
  variant_primary: {
    backgroundColor: Colors.primary,
  },
  variant_secondary: {
    backgroundColor: Colors.secondary,
  },
  variant_outline: {
    backgroundColor: 'transparent',
    borderWidth: 1.5,
    borderColor: Colors.primary,
  },
  variant_danger: {
    backgroundColor: Colors.error,
  },
  variant_ghost: {
    backgroundColor: 'transparent',
  },

  // Text colors by variant
  textVariant_primary: {
    color: Colors.textInverse,
  },
  textVariant_secondary: {
    color: Colors.textInverse,
  },
  textVariant_outline: {
    color: Colors.primary,
  },
  textVariant_danger: {
    color: Colors.textInverse,
  },
  textVariant_ghost: {
    color: Colors.primary,
  },

  // Disabled states
  disabled: {
    opacity: 0.5,
  },
  textDisabled: {
    // opacity handled on container
  },
});

export default Button;
