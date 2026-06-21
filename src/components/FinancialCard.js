import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../context/ThemeContext';
import { formatCurrency, formatDate, isOverdue, isDueWithin } from '../utils/formatters';
import { spacing, radius, fontSize, fontWeight, elevation } from '../styles/spacing';
import { expenseCategories } from '../styles/colors';

// Card de transação financeira (receita ou despesa)
export function FinancialCard({ item, type, onPress, onEdit, onDelete, onTogglePaid }) {
  const { colors } = useTheme();
  const s = buildStyles(colors);

  const isExpense = type === 'expense';
  const overdue   = isExpense && item.dueDate && isOverdue(item.dueDate) && !item.paid;
  const dueSoon   = isExpense && item.dueDate && isDueWithin(item.dueDate, 3) && !item.paid && !overdue;

  const cat = expenseCategories.find(c => c.key === item.category);
  const catColor = cat ? colors[cat.colorKey] : colors.textSecondary;

  return (
    <TouchableOpacity style={[s.card, overdue && s.overdueCard]} onPress={onPress} activeOpacity={0.85}>
      {/* Ícone de categoria */}
      <View style={[s.iconBg, { backgroundColor: isExpense ? catColor + '22' : colors.success + '22' }]}>
        <Ionicons
          name={isExpense ? (cat?.icon || 'card') : 'arrow-down-circle'}
          size={22}
          color={isExpense ? catColor : colors.success}
        />
      </View>

      {/* Conteúdo central */}
      <View style={s.content}>
        <Text style={s.description} numberOfLines={1}>{item.description}</Text>
        <Text style={s.meta}>
          {formatDate(item.date)}
          {item.dueDate ? ` · Vence ${formatDate(item.dueDate)}` : ''}
          {item.recurring ? ' · 🔄 Recorrente' : ''}
        </Text>
        {overdue  && <Text style={[s.badge, { color: colors.error }]}>⚠️ Vencida</Text>}
        {dueSoon  && <Text style={[s.badge, { color: colors.warning }]}>⏰ Vence em breve</Text>}
      </View>

      {/* Valor e ações */}
      <View style={s.right}>
        <Text style={[s.amount, { color: isExpense ? colors.error : colors.success }]}>
          {isExpense ? '-' : '+'}{formatCurrency(item.amount)}
        </Text>
        <View style={s.actions}>
          {isExpense && onTogglePaid && (
            <TouchableOpacity onPress={() => onTogglePaid(item.id)} hitSlop={8}>
              <Ionicons
                name={item.paid ? 'checkmark-circle' : 'ellipse-outline'}
                size={20}
                color={item.paid ? colors.success : colors.textSecondary}
              />
            </TouchableOpacity>
          )}
          {onEdit && (
            <TouchableOpacity onPress={onEdit} hitSlop={8}>
              <Ionicons name="pencil-outline" size={18} color={colors.primary} />
            </TouchableOpacity>
          )}
          {onDelete && (
            <TouchableOpacity onPress={() => onDelete(item.id)} hitSlop={8}>
              <Ionicons name="trash-outline" size={18} color={colors.error} />
            </TouchableOpacity>
          )}
        </View>
      </View>
    </TouchableOpacity>
  );
}

// Card de resumo (saldo, receitas, despesas)
export function SummaryCard({ title, value, icon, color, style }) {
  const { colors } = useTheme();
  const s = buildStyles(colors);

  return (
    <View style={[s.summaryCard, style]}>
      <View style={[s.summaryIcon, { backgroundColor: (color || colors.primary) + '22' }]}>
        <Ionicons name={icon} size={24} color={color || colors.primary} />
      </View>
      <Text style={s.summaryTitle}>{title}</Text>
      <Text style={[s.summaryValue, { color: color || colors.primary }]}>{formatCurrency(value)}</Text>
    </View>
  );
}

const buildStyles = (colors) =>
  StyleSheet.create({
    card: {
      flexDirection: 'row',
      alignItems: 'center',
      backgroundColor: colors.card,
      borderRadius: radius.md,
      padding: spacing.md,
      marginBottom: spacing.sm,
      gap: spacing.sm,
      ...elevation.sm,
    },
    overdueCard: {
      borderLeftWidth: 3,
      borderLeftColor: colors.error,
    },
    iconBg: {
      width: 44,
      height: 44,
      borderRadius: radius.full,
      alignItems: 'center',
      justifyContent: 'center',
    },
    content: { flex: 1 },
    description: {
      fontSize: fontSize.md,
      fontWeight: fontWeight.semibold,
      color: colors.text,
    },
    meta: {
      fontSize: fontSize.xs,
      color: colors.textSecondary,
      marginTop: 2,
    },
    badge: {
      fontSize: fontSize.xs,
      fontWeight: fontWeight.semibold,
      marginTop: 2,
    },
    right: { alignItems: 'flex-end', gap: 6 },
    amount: {
      fontSize: fontSize.md,
      fontWeight: fontWeight.bold,
    },
    actions: { flexDirection: 'row', gap: spacing.sm },

    // Summary card
    summaryCard: {
      flex: 1,
      backgroundColor: colors.card,
      borderRadius: radius.md,
      padding: spacing.md,
      alignItems: 'center',
      gap: spacing.xs,
      ...elevation.sm,
    },
    summaryIcon: {
      width: 48,
      height: 48,
      borderRadius: radius.full,
      alignItems: 'center',
      justifyContent: 'center',
    },
    summaryTitle: {
      fontSize: fontSize.xs,
      color: colors.textSecondary,
      textAlign: 'center',
    },
    summaryValue: {
      fontSize: fontSize.lg,
      fontWeight: fontWeight.bold,
    },
  });
