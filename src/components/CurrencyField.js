import React from 'react';
import { TextInput } from 'react-native';
import { useTheme } from '../context/ThemeContext';
import { spacing, radius, fontSize } from '../styles/spacing';

// Formata um número (reais) como "1.234,56". Vazio → ''.
function format(value) {
  if (value === '' || value === null || value === undefined || isNaN(value)) return '';
  const cents = Math.round(Number(value) * 100);
  const str = String(cents).padStart(3, '0');
  const dec = str.slice(-2);
  let int = str.slice(0, -2);
  int = int.replace(/\B(?=(\d{3})+(?!\d))/g, '.'); // separador de milhar
  return `${int},${dec}`;
}

// Campo de valor em R$ com máscara de centavos: o usuário digita só números
// e a vírgula "anda" da direita para a esquerda (ex.: 1→0,01 7→0,17 0→1,70...).
// value: número em reais (ou '' ). onChangeValue recebe número (ou '').
export default function CurrencyField({ value, onChangeValue, placeholder = '0,00', style }) {
  const { colors } = useTheme();

  const handleChange = (text) => {
    const digits = text.replace(/\D/g, '');
    if (!digits) return onChangeValue('');
    onChangeValue(parseInt(digits, 10) / 100);
  };

  return (
    <TextInput
      style={[{
        backgroundColor: colors.surfaceVariant,
        borderRadius: radius.md,
        padding: spacing.md,
        fontSize: fontSize.md,
        color: colors.text,
        marginBottom: spacing.md,
      }, style]}
      value={format(value)}
      onChangeText={handleChange}
      placeholder={placeholder}
      placeholderTextColor={colors.textDisabled}
      keyboardType="numeric"
    />
  );
}
