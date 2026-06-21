import React from 'react';
import { View, Switch, Text, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../context/ThemeContext';
import { spacing, fontSize } from '../styles/spacing';

export default function ThemeToggle() {
  const { isDark, toggleTheme, colors } = useTheme();

  return (
    <View style={styles.container}>
      <Ionicons name={isDark ? 'moon' : 'sunny'} size={22} color={colors.primary} />
      <Text style={[styles.label, { color: colors.text }]}>
        {isDark ? 'Tema Escuro' : 'Tema Claro'}
      </Text>
      <Switch
        value={isDark}
        onValueChange={toggleTheme}
        trackColor={{ false: colors.border, true: colors.primaryLight }}
        thumbColor={isDark ? colors.primary : colors.surface}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  label: {
    flex: 1,
    fontSize: fontSize.md,
  },
});
