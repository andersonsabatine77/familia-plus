import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../context/ThemeContext';
import { formatDate } from '../utils/formatters';
import { spacing, radius, fontSize, fontWeight } from '../styles/spacing';
import { eventCategories } from '../styles/colors';

// Card de evento do calendário
export function CalendarEventCard({ event, onPress, onDelete }) {
  const { colors } = useTheme();
  const s = buildStyles(colors);

  const cat = eventCategories.find(c => c.key === event.category);
  const catColor = cat ? colors[cat.colorKey] : colors.primary;

  return (
    <TouchableOpacity
      style={[s.card, { borderLeftColor: catColor }]}
      onPress={onPress}
      activeOpacity={0.85}
    >
      <View style={[s.dot, { backgroundColor: catColor }]} />

      <View style={s.content}>
        <Text style={s.title} numberOfLines={1}>{event.title}</Text>
        <View style={s.meta}>
          <Ionicons name="calendar-outline" size={13} color={colors.textSecondary} />
          <Text style={s.metaText}>
            {formatDate(event.date)}{event.time ? ` às ${event.time}` : ''}
          </Text>
          {cat && (
            <>
              <Ionicons name={cat.icon} size={13} color={catColor} />
              <Text style={[s.metaText, { color: catColor }]}>{cat.label}</Text>
            </>
          )}
        </View>
        {event.description ? (
          <Text style={s.description} numberOfLines={2}>{event.description}</Text>
        ) : null}
      </View>

      {onDelete && (
        <TouchableOpacity onPress={() => onDelete(event.id)} hitSlop={8}>
          <Ionicons name="trash-outline" size={16} color={colors.error} />
        </TouchableOpacity>
      )}
    </TouchableOpacity>
  );
}

// Ponto colorido para dia no calendário mensal
export function DayDot({ category, colors }) {
  const cat = eventCategories.find(c => c.key === category);
  const color = cat ? colors[cat.colorKey] : colors.primary;
  return (
    <View style={{ width: 6, height: 6, borderRadius: 3, backgroundColor: color, margin: 1 }} />
  );
}

const buildStyles = (colors) =>
  StyleSheet.create({
    card: {
      flexDirection: 'row',
      alignItems: 'flex-start',
      backgroundColor: colors.card,
      borderRadius: radius.md,
      padding: spacing.md,
      marginBottom: spacing.sm,
      gap: spacing.sm,
      borderLeftWidth: 3,
    },
    dot: {
      width: 10,
      height: 10,
      borderRadius: radius.full,
      marginTop: 4,
    },
    content: { flex: 1 },
    title: {
      fontSize: fontSize.md,
      fontWeight: fontWeight.semibold,
      color: colors.text,
    },
    meta: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 4,
      marginTop: 4,
      flexWrap: 'wrap',
    },
    metaText: {
      fontSize: fontSize.xs,
      color: colors.textSecondary,
      marginRight: 6,
    },
    description: {
      fontSize: fontSize.sm,
      color: colors.textSecondary,
      marginTop: 4,
    },
  });
