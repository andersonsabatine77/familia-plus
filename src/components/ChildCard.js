import React from 'react';
import { View, Text, Image, TouchableOpacity, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../context/ThemeContext';
import { calcAge, formatDate } from '../utils/formatters';
import { spacing, radius, fontSize, fontWeight, elevation } from '../styles/spacing';

// Card principal de filho na listagem
export function ChildCard({ child, onPress, onDelete }) {
  const { colors } = useTheme();
  const s = buildStyles(colors);
  const age = calcAge(child.birthDate);
  const initials = child.name.split(' ').map(w => w[0]).join('').slice(0, 2).toUpperCase();

  // Conta próximos eventos do filho
  const upcoming = [
    ...(child.school?.exams || []),
    ...(child.school?.meetings || []),
    ...(child.health?.appointments || []),
  ].filter(e => new Date(e.date) >= new Date()).length;

  return (
    <TouchableOpacity style={s.card} onPress={onPress} activeOpacity={0.85}>
      {/* Avatar */}
      {child.photo ? (
        <Image source={{ uri: child.photo }} style={s.avatar} />
      ) : (
        <View style={[s.avatar, s.avatarPlaceholder]}>
          <Text style={s.initials}>{initials}</Text>
        </View>
      )}

      {/* Informações */}
      <View style={s.info}>
        <Text style={s.name}>{child.name}</Text>
        <Text style={s.meta}>{age} anos · Nasc. {formatDate(child.birthDate)}</Text>
        {child.school?.name && (
          <Text style={s.school} numberOfLines={1}>
            <Ionicons name="school" size={12} /> {child.school.name}
          </Text>
        )}
        {upcoming > 0 && (
          <View style={s.badge}>
            <Ionicons name="calendar" size={11} color={colors.primary} />
            <Text style={[s.badgeText, { color: colors.primary }]}>
              {upcoming} evento{upcoming > 1 ? 's' : ''} próximos
            </Text>
          </View>
        )}
      </View>

      {/* Ações */}
      {onDelete && (
        <TouchableOpacity onPress={() => onDelete(child.id)} hitSlop={8}>
          <Ionicons name="trash-outline" size={18} color={colors.error} />
        </TouchableOpacity>
      )}
      <Ionicons name="chevron-forward" size={18} color={colors.textSecondary} />
    </TouchableOpacity>
  );
}

// Card pequeno de evento (prova, reunião, consulta)
export function EventMiniCard({ label, date, icon, color }) {
  const { colors } = useTheme();
  const s = buildStyles(colors);

  return (
    <View style={[s.miniCard, { borderLeftColor: color || colors.primary }]}>
      <Ionicons name={icon} size={16} color={color || colors.primary} />
      <View style={{ flex: 1 }}>
        <Text style={s.miniLabel} numberOfLines={1}>{label}</Text>
        <Text style={s.miniDate}>{formatDate(date)}</Text>
      </View>
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
    avatar: {
      width: 56,
      height: 56,
      borderRadius: radius.full,
    },
    avatarPlaceholder: {
      backgroundColor: colors.primary + '33',
      alignItems: 'center',
      justifyContent: 'center',
    },
    initials: {
      fontSize: fontSize.xl,
      fontWeight: fontWeight.bold,
      color: colors.primary,
    },
    info: { flex: 1 },
    name: {
      fontSize: fontSize.lg,
      fontWeight: fontWeight.bold,
      color: colors.text,
    },
    meta: {
      fontSize: fontSize.sm,
      color: colors.textSecondary,
      marginTop: 2,
    },
    school: {
      fontSize: fontSize.xs,
      color: colors.textSecondary,
      marginTop: 2,
    },
    badge: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 4,
      marginTop: 4,
    },
    badgeText: {
      fontSize: fontSize.xs,
      fontWeight: fontWeight.semibold,
    },

    // Mini card de evento
    miniCard: {
      flexDirection: 'row',
      alignItems: 'center',
      backgroundColor: colors.surfaceVariant,
      borderRadius: radius.sm,
      padding: spacing.sm,
      marginBottom: spacing.xs,
      gap: spacing.sm,
      borderLeftWidth: 3,
    },
    miniLabel: {
      fontSize: fontSize.sm,
      fontWeight: fontWeight.semibold,
      color: colors.text,
    },
    miniDate: {
      fontSize: fontSize.xs,
      color: colors.textSecondary,
    },
  });
