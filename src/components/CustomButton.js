import React from 'react';
import { TouchableOpacity, Text, ActivityIndicator, StyleSheet } from 'react-native';
import { useTheme } from '../context/ThemeContext';
import { spacing, radius, fontSize, fontWeight } from '../styles/spacing';

// Variantes: 'primary' | 'secondary' | 'outline' | 'danger' | 'ghost'
export default function CustomButton({
  title,
  onPress,
  variant = 'primary',
  loading = false,
  disabled = false,
  icon,
  style,
  textStyle,
}) {
  const { colors } = useTheme();

  const styles = buildStyles(colors);
  const variantStyle = styles[variant] || styles.primary;
  const variantText  = styles[`${variant}Text`] || styles.primaryText;
  const isDisabled   = disabled || loading;

  return (
    <TouchableOpacity
      style={[styles.base, variantStyle, isDisabled && styles.disabled, style]}
      onPress={onPress}
      activeOpacity={0.8}
      disabled={isDisabled}
    >
      {loading ? (
        <ActivityIndicator color={variant === 'outline' || variant === 'ghost' ? colors.primary : '#fff'} />
      ) : (
        <>
          {icon && icon}
          <Text style={[styles.baseText, variantText, textStyle]}>{title}</Text>
        </>
      )}
    </TouchableOpacity>
  );
}

const buildStyles = (colors) =>
  StyleSheet.create({
    base: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      gap: spacing.sm,
      paddingVertical: 14,
      paddingHorizontal: spacing.lg,
      borderRadius: radius.md,
      minHeight: 50,
    },
    disabled: { opacity: 0.5 },
    baseText: { fontSize: fontSize.md, fontWeight: fontWeight.semibold },

    // Primário — fundo roxo sólido
    primary:     { backgroundColor: colors.primary },
    primaryText: { color: '#fff' },

    // Secundário — fundo rosa
    secondary:     { backgroundColor: colors.secondary },
    secondaryText: { color: '#fff' },

    // Contorno — borda sem preenchimento
    outline:     { backgroundColor: 'transparent', borderWidth: 2, borderColor: colors.primary },
    outlineText: { color: colors.primary },

    // Perigo — vermelho
    danger:     { backgroundColor: colors.error },
    dangerText: { color: '#fff' },

    // Fantasma — sem fundo nem borda
    ghost:     { backgroundColor: 'transparent' },
    ghostText: { color: colors.primary },
  });
