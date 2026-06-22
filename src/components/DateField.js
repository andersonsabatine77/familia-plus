import React, { useState, useMemo } from 'react';
import { View, Text, TouchableOpacity, Modal, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../context/ThemeContext';
import { parseDate, formatDate, monthName } from '../utils/formatters';
import { spacing, radius, fontSize, fontWeight, elevation } from '../styles/spacing';

const WEEKDAYS = ['D', 'S', 'T', 'Q', 'Q', 'S', 'S'];

// Campo de data que abre um calendário para seleção (formato DD/MM/AAAA).
// value/onChange usam string 'YYYY-MM-DD'.
export default function DateField({ value, onChange, placeholder = 'Selecionar data' }) {
  const { colors } = useTheme();
  const s = buildStyles(colors);

  const [open, setOpen] = useState(false);
  const [mode, setMode] = useState('days'); // 'days' | 'years'
  const [view, setView] = useState(() => {
    const d = value ? parseDate(value) : new Date();
    return { year: d.getFullYear(), month: d.getMonth() };
  });

  const selected = value ? parseDate(value) : null;
  const today = new Date();

  const openPicker = () => {
    const d = value ? parseDate(value) : new Date();
    setView({ year: d.getFullYear(), month: d.getMonth() });
    setMode('days');
    setOpen(true);
  };

  const cells = useMemo(() => {
    const daysInMonth = new Date(view.year, view.month + 1, 0).getDate();
    const firstDow = new Date(view.year, view.month, 1).getDay();
    const arr = [];
    for (let i = 0; i < firstDow; i++) arr.push(null);
    for (let d = 1; d <= daysInMonth; d++) arr.push(d);
    return arr;
  }, [view]);

  const changeMonth = (delta) => {
    let m = view.month + delta;
    let y = view.year;
    if (m < 0) { m = 11; y--; }
    if (m > 11) { m = 0; y++; }
    setView({ year: y, month: m });
  };

  const pickDay = (day) => {
    const mm = String(view.month + 1).padStart(2, '0');
    const dd = String(day).padStart(2, '0');
    onChange(`${view.year}-${mm}-${dd}`);
    setOpen(false);
  };

  const pickToday = () => {
    const t = new Date();
    onChange(`${t.getFullYear()}-${String(t.getMonth() + 1).padStart(2, '0')}-${String(t.getDate()).padStart(2, '0')}`);
    setOpen(false);
  };

  const years = useMemo(() => {
    const base = view.year - 8;
    return Array.from({ length: 16 }, (_, i) => base + i);
  }, [view.year]);

  const isSel = (day) =>
    selected && selected.getFullYear() === view.year &&
    selected.getMonth() === view.month && selected.getDate() === day;

  const isToday = (day) =>
    today.getFullYear() === view.year && today.getMonth() === view.month && today.getDate() === day;

  return (
    <>
      <TouchableOpacity style={s.field} onPress={openPicker} activeOpacity={0.7}>
        <Text style={[s.fieldText, !value && { color: colors.textDisabled }]}>
          {value ? formatDate(value) : placeholder}
        </Text>
        <Ionicons name="calendar-outline" size={20} color={colors.primary} />
      </TouchableOpacity>

      <Modal visible={open} transparent animationType="fade" onRequestClose={() => setOpen(false)}>
        <TouchableOpacity style={s.overlay} activeOpacity={1} onPress={() => setOpen(false)}>
          <TouchableOpacity style={s.sheet} activeOpacity={1} onPress={() => {}}>

            {/* Cabeçalho */}
            <View style={s.header}>
              <TouchableOpacity onPress={() => changeMonth(-1)} hitSlop={10} disabled={mode === 'years'}>
                <Ionicons name="chevron-back" size={24} color={mode === 'years' ? 'transparent' : colors.primary} />
              </TouchableOpacity>
              <TouchableOpacity onPress={() => setMode(mode === 'days' ? 'years' : 'days')}>
                <Text style={s.headerTitle}>
                  {mode === 'days' ? `${monthName(view.month)} ${view.year}` : 'Escolha o ano'}
                </Text>
              </TouchableOpacity>
              <TouchableOpacity onPress={() => changeMonth(1)} hitSlop={10} disabled={mode === 'years'}>
                <Ionicons name="chevron-forward" size={24} color={mode === 'years' ? 'transparent' : colors.primary} />
              </TouchableOpacity>
            </View>

            {mode === 'days' ? (
              <>
                {/* Dias da semana */}
                <View style={s.weekRow}>
                  {WEEKDAYS.map((w, i) => (
                    <Text key={i} style={s.weekday}>{w}</Text>
                  ))}
                </View>

                {/* Grade de dias */}
                <View style={s.grid}>
                  {cells.map((day, i) => (
                    <View key={i} style={s.cell}>
                      {day && (
                        <TouchableOpacity
                          style={[
                            s.day,
                            isToday(day) && s.dayToday,
                            isSel(day) && s.daySelected,
                          ]}
                          onPress={() => pickDay(day)}
                        >
                          <Text style={[
                            s.dayText,
                            isSel(day) && { color: '#fff', fontWeight: fontWeight.bold },
                          ]}>
                            {day}
                          </Text>
                        </TouchableOpacity>
                      )}
                    </View>
                  ))}
                </View>

                <TouchableOpacity style={s.todayBtn} onPress={pickToday}>
                  <Text style={s.todayBtnText}>Hoje</Text>
                </TouchableOpacity>
              </>
            ) : (
              /* Seletor de ano */
              <View style={s.yearGrid}>
                {years.map(y => (
                  <TouchableOpacity
                    key={y}
                    style={[s.yearCell, y === view.year && s.daySelected]}
                    onPress={() => { setView(v => ({ ...v, year: y })); setMode('days'); }}
                  >
                    <Text style={[s.yearText, y === view.year && { color: '#fff', fontWeight: fontWeight.bold }]}>
                      {y}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            )}
          </TouchableOpacity>
        </TouchableOpacity>
      </Modal>
    </>
  );
}

const buildStyles = (colors) => StyleSheet.create({
  field: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: colors.surfaceVariant,
    borderRadius: radius.md,
    padding: spacing.md,
    marginBottom: spacing.md,
  },
  fieldText: { fontSize: fontSize.md, color: colors.text },

  overlay: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: 'rgba(0,0,0,0.5)', padding: spacing.lg },
  sheet: {
    width: '100%',
    maxWidth: 360,
    backgroundColor: colors.surface,
    borderRadius: radius.xl,
    padding: spacing.lg,
    ...elevation.lg,
  },

  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: spacing.md },
  headerTitle: { fontSize: fontSize.lg, fontWeight: fontWeight.bold, color: colors.text, textTransform: 'capitalize' },

  weekRow: { flexDirection: 'row', marginBottom: spacing.xs },
  weekday: { flex: 1, textAlign: 'center', fontSize: fontSize.xs, fontWeight: fontWeight.semibold, color: colors.textSecondary },

  grid: { flexDirection: 'row', flexWrap: 'wrap' },
  cell: { width: `${100 / 7}%`, aspectRatio: 1, alignItems: 'center', justifyContent: 'center', padding: 2 },
  day: { width: '100%', height: '100%', borderRadius: radius.full, alignItems: 'center', justifyContent: 'center' },
  dayToday: { borderWidth: 1.5, borderColor: colors.primary },
  daySelected: { backgroundColor: colors.primary },
  dayText: { fontSize: fontSize.md, color: colors.text },

  todayBtn: { alignSelf: 'center', marginTop: spacing.md, paddingVertical: spacing.xs, paddingHorizontal: spacing.lg, borderRadius: radius.full, backgroundColor: colors.primary + '22' },
  todayBtnText: { color: colors.primary, fontWeight: fontWeight.semibold, fontSize: fontSize.md },

  yearGrid: { flexDirection: 'row', flexWrap: 'wrap' },
  yearCell: { width: `${100 / 4}%`, aspectRatio: 1.6, alignItems: 'center', justifyContent: 'center', borderRadius: radius.md, marginVertical: 2 },
  yearText: { fontSize: fontSize.md, color: colors.text },
});
