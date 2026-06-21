import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../context/ThemeContext';
import { formatCurrency } from '../utils/formatters';
import { spacing, radius, fontSize, fontWeight } from '../styles/spacing';
import { shoppingCategories } from '../styles/colors';

// Item de lista de mercado com checkbox
export function MarketItem({ item, onToggle, onDelete }) {
  const { colors } = useTheme();
  const s = buildStyles(colors);

  const cat = shoppingCategories.find(c => c.key === item.category);
  const total = (item.estimatedPrice || 0) * (item.quantity || 1);

  return (
    <View style={[s.item, item.checked && s.itemChecked]}>
      <TouchableOpacity onPress={() => onToggle(item.id)} style={s.checkbox} hitSlop={8}>
        <Ionicons
          name={item.checked ? 'checkbox' : 'square-outline'}
          size={24}
          color={item.checked ? colors.success : colors.primary}
        />
      </TouchableOpacity>

      <View style={s.catIcon}>
        <Ionicons name={cat?.icon || 'basket'} size={16} color={colors.textSecondary} />
      </View>

      <View style={s.info}>
        <Text style={[s.name, item.checked && s.nameChecked]}>{item.name}</Text>
        <Text style={s.meta}>
          {item.quantity}x{item.estimatedPrice ? ` · ${formatCurrency(item.estimatedPrice)} un.` : ''}
        </Text>
      </View>

      {total > 0 && <Text style={[s.total, item.checked && { color: colors.textDisabled }]}>{formatCurrency(total)}</Text>}

      {onDelete && (
        <TouchableOpacity onPress={() => onDelete(item.id)} hitSlop={8}>
          <Ionicons name="close-circle" size={20} color={colors.textDisabled} />
        </TouchableOpacity>
      )}
    </View>
  );
}

// Item de lista de itens para casa
export function HouseItem({ item, onUpdateStatus, onDelete }) {
  const { colors } = useTheme();
  const s = buildStyles(colors);

  const statusConfig = {
    planned:    { label: 'Planejado',   color: colors.textSecondary, icon: 'time-outline' },
    purchasing: { label: 'Em compra',   color: colors.warning,       icon: 'cart-outline' },
    bought:     { label: 'Comprado',    color: colors.success,       icon: 'checkmark-circle' },
  };
  const priorityColors = {
    high:   colors.error,
    medium: colors.warning,
    low:    colors.success,
  };
  const priorityLabels = { high: 'Alta', medium: 'Média', low: 'Baixa' };

  const st = statusConfig[item.status] || statusConfig.planned;

  return (
    <View style={[s.houseItem, { borderLeftColor: priorityColors[item.priority] || colors.border }]}>
      <View style={s.info}>
        <Text style={[s.name, item.status === 'bought' && s.nameChecked]}>{item.name}</Text>
        <View style={{ flexDirection: 'row', gap: spacing.sm, marginTop: 4, flexWrap: 'wrap' }}>
          {item.estimatedPrice > 0 && (
            <Text style={s.meta}>{formatCurrency(item.estimatedPrice)}</Text>
          )}
          <Text style={[s.meta, { color: priorityColors[item.priority] }]}>
            Prioridade: {priorityLabels[item.priority] || 'Média'}
          </Text>
        </View>
      </View>

      <View style={s.right}>
        <TouchableOpacity
          style={[s.statusBadge, { backgroundColor: st.color + '22' }]}
          onPress={() => {
            const statuses = ['planned', 'purchasing', 'bought'];
            const next = statuses[(statuses.indexOf(item.status) + 1) % statuses.length];
            onUpdateStatus?.(item.id, { status: next });
          }}
        >
          <Ionicons name={st.icon} size={14} color={st.color} />
          <Text style={[s.statusText, { color: st.color }]}>{st.label}</Text>
        </TouchableOpacity>
        {onDelete && (
          <TouchableOpacity onPress={() => onDelete(item.id)} hitSlop={8}>
            <Ionicons name="trash-outline" size={16} color={colors.error} />
          </TouchableOpacity>
        )}
      </View>
    </View>
  );
}

const buildStyles = (colors) =>
  StyleSheet.create({
    item: {
      flexDirection: 'row',
      alignItems: 'center',
      backgroundColor: colors.card,
      borderRadius: radius.md,
      padding: spacing.sm,
      marginBottom: spacing.xs,
      gap: spacing.sm,
    },
    itemChecked: { opacity: 0.6 },
    checkbox: { padding: 2 },
    catIcon: {
      width: 28,
      height: 28,
      borderRadius: radius.full,
      backgroundColor: colors.surfaceVariant,
      alignItems: 'center',
      justifyContent: 'center',
    },
    info: { flex: 1 },
    name: {
      fontSize: fontSize.md,
      fontWeight: fontWeight.medium,
      color: colors.text,
    },
    nameChecked: {
      textDecorationLine: 'line-through',
      color: colors.textSecondary,
    },
    meta: {
      fontSize: fontSize.xs,
      color: colors.textSecondary,
    },
    total: {
      fontSize: fontSize.sm,
      fontWeight: fontWeight.semibold,
      color: colors.text,
    },

    // House item
    houseItem: {
      flexDirection: 'row',
      alignItems: 'center',
      backgroundColor: colors.card,
      borderRadius: radius.md,
      padding: spacing.md,
      marginBottom: spacing.sm,
      gap: spacing.sm,
      borderLeftWidth: 3,
    },
    right: { alignItems: 'flex-end', gap: 6 },
    statusBadge: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 4,
      paddingHorizontal: spacing.sm,
      paddingVertical: 4,
      borderRadius: radius.full,
    },
    statusText: { fontSize: fontSize.xs, fontWeight: fontWeight.semibold },
  });
