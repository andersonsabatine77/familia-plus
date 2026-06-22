import React, { useState, useMemo, useCallback } from 'react';
import {
  View, Text, ScrollView, StyleSheet, TouchableOpacity,
  Modal, TextInput, Alert, Dimensions,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../context/ThemeContext';
import { useData } from '../context/DataContext';
import { CalendarEventCard, DayDot } from '../components/CalendarEvent';
import CustomButton from '../components/CustomButton';
import { formatMonthYear, formatDate, monthName, parseDate } from '../utils/formatters';
import { spacing, radius, fontSize, fontWeight } from '../styles/spacing';
import { eventCategories } from '../styles/colors';
import { scheduleEventAlert } from '../utils/notifications';

const DAYS_OF_WEEK = ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb'];

// ── Formulário de evento ────────────────────────────────────────────────────
function EventForm({ onSave, onClose, colors, initialDate }) {
  const [title,    setTitle]    = useState('');
  const [date,     setDate]     = useState(initialDate || new Date().toISOString().slice(0, 10));
  const [time,     setTime]     = useState('');
  const [category, setCategory] = useState('other');
  const [desc,     setDesc]     = useState('');
  const s = formStyles(colors);

  const cat = eventCategories.find(c => c.key === category);

  const handleSave = () => {
    if (!title.trim()) return Alert.alert('Atenção', 'Informe o título do evento.');
    onSave({
      title: title.trim(),
      date:  date || new Date().toISOString(),
      time:  time || null,
      category,
      description: desc.trim(),
      color: cat ? colors[cat.colorKey] : colors.primary,
    });
    onClose();
  };

  return (
    <View>
      <Text style={s.title}>📅 Novo Evento</Text>
      <Text style={s.label}>Título *</Text>
      <TextInput style={s.input} value={title} onChangeText={setTitle} placeholder="Ex.: Reunião Escolar" placeholderTextColor={colors.textDisabled} />
      <Text style={s.label}>Data</Text>
      <TextInput style={s.input} value={date} onChangeText={setDate} placeholder="AAAA-MM-DD" placeholderTextColor={colors.textDisabled} />
      <Text style={s.label}>Horário</Text>
      <TextInput style={s.input} value={time} onChangeText={setTime} placeholder="HH:MM" placeholderTextColor={colors.textDisabled} />
      <Text style={s.label}>Categoria</Text>
      <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginBottom: spacing.md }}>
        {eventCategories.map(cat => (
          <TouchableOpacity
            key={cat.key}
            style={[s.chip, category === cat.key && { backgroundColor: colors[cat.colorKey] }]}
            onPress={() => setCategory(cat.key)}
          >
            <Ionicons name={cat.icon} size={14} color={category === cat.key ? '#fff' : colors.textSecondary} />
            <Text style={[s.chipText, category === cat.key && { color: '#fff' }]}>{cat.label}</Text>
          </TouchableOpacity>
        ))}
      </ScrollView>
      <Text style={s.label}>Descrição</Text>
      <TextInput
        style={[s.input, { height: 80, textAlignVertical: 'top' }]}
        value={desc}
        onChangeText={setDesc}
        placeholder="Detalhes do evento..."
        multiline
        placeholderTextColor={colors.textDisabled}
      />
      <View style={{ flexDirection: 'row', gap: spacing.sm }}>
        <CustomButton title="Cancelar" variant="outline" onPress={onClose} style={{ flex: 1 }} />
        <CustomButton title="Salvar"   variant="primary" onPress={handleSave} style={{ flex: 1 }} />
      </View>
    </View>
  );
}

// ── Calendário mensal ────────────────────────────────────────────────────────
function MonthGrid({ year, month, events, onDayPress, colors }) {
  const s = gridStyles(colors);

  // Quantos dias tem o mês e qual dia da semana começa
  const daysInMonth  = new Date(year, month + 1, 0).getDate();
  const firstDayOfWeek = new Date(year, month, 1).getDay(); // 0=Dom

  // Monta grade com células vazias no início
  const cells = [];
  for (let i = 0; i < firstDayOfWeek; i++) cells.push(null);
  for (let d = 1; d <= daysInMonth; d++) cells.push(d);

  // Agrupa eventos por dia
  const eventsByDay = useMemo(() => {
    const map = {};
    events.forEach(e => {
      const d = parseDate(e.date);
      if (d && d.getFullYear() === year && d.getMonth() === month) {
        const day = d.getDate();
        if (!map[day]) map[day] = [];
        map[day].push(e);
      }
    });
    return map;
  }, [events, year, month]);

  const today = new Date();
  const isToday = (d) =>
    d === today.getDate() && month === today.getMonth() && year === today.getFullYear();

  return (
    <View>
      {/* Cabeçalho dos dias da semana */}
      <View style={s.weekHeader}>
        {DAYS_OF_WEEK.map(d => (
          <Text key={d} style={s.weekDay}>{d}</Text>
        ))}
      </View>

      {/* Grade de dias */}
      <View style={s.grid}>
        {cells.map((day, idx) => (
          <TouchableOpacity
            key={idx}
            style={[
              s.cell,
              day && isToday(day) && s.todayCell,
            ]}
            onPress={() => day && onDayPress(day)}
            disabled={!day}
            activeOpacity={0.7}
          >
            {day ? (
              <>
                <Text style={[s.dayNum, isToday(day) && s.todayNum]}>{day}</Text>
                <View style={s.dots}>
                  {(eventsByDay[day] || []).slice(0, 3).map((e, i) => (
                    <DayDot key={i} category={e.category} colors={colors} />
                  ))}
                </View>
              </>
            ) : null}
          </TouchableOpacity>
        ))}
      </View>
    </View>
  );
}

// ── Tela principal ────────────────────────────────────────────────────────────
export default function CalendarScreen() {
  const { colors } = useTheme();
  const { calendar, addEvent, deleteEvent } = useData();

  const [now,         setNow]         = useState(new Date());
  const [modal,       setModal]       = useState(false);
  const [selectedDay, setSelectedDay] = useState(null);
  const [filterCat,   setFilterCat]   = useState('all');

  const s = buildStyles(colors);
  const { events } = calendar;

  const prevMonth = () => setNow(d => new Date(d.getFullYear(), d.getMonth() - 1, 1));
  const nextMonth = () => setNow(d => new Date(d.getFullYear(), d.getMonth() + 1, 1));

  // Eventos do mês corrente
  const monthEvents = useMemo(() =>
    events.filter(e => {
      const d = parseDate(e.date);
      return d && d.getFullYear() === now.getFullYear() && d.getMonth() === now.getMonth();
    }).sort((a, b) => parseDate(a.date) - parseDate(b.date)),
    [events, now]
  );

  // Eventos do dia selecionado
  const dayEvents = useMemo(() => {
    if (!selectedDay) return [];
    return monthEvents.filter(e => parseDate(e.date).getDate() === selectedDay);
  }, [selectedDay, monthEvents]);

  // Todos os eventos filtrados por categoria
  const filteredEvents = useMemo(() =>
    filterCat === 'all' ? monthEvents : monthEvents.filter(e => e.category === filterCat),
    [monthEvents, filterCat]
  );

  const handleDayPress = useCallback((day) => {
    setSelectedDay(prev => prev === day ? null : day);
  }, []);

  const handleAddEvent = useCallback(async (event) => {
    await addEvent(event);
    await scheduleEventAlert(event);
  }, [addEvent]);

  // Contagem de eventos por categoria neste mês
  const categoryCounts = useMemo(() => {
    const counts = {};
    monthEvents.forEach(e => {
      counts[e.category] = (counts[e.category] || 0) + 1;
    });
    return counts;
  }, [monthEvents]);

  return (
    <SafeAreaView style={[s.safe, { backgroundColor: colors.background }]} edges={['top']}>
      {/* Header */}
      <View style={s.header}>
        <Text style={s.headerTitle}>📅 Calendário</Text>
        <TouchableOpacity style={s.addBtn} onPress={() => setModal(true)}>
          <Ionicons name="add" size={22} color="#fff" />
        </TouchableOpacity>
      </View>

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: spacing.xxl }}>
        {/* Navegação de mês */}
        <View style={s.monthNav}>
          <TouchableOpacity onPress={prevMonth} hitSlop={8}>
            <Ionicons name="chevron-back" size={22} color={colors.primary} />
          </TouchableOpacity>
          <Text style={s.monthText}>{formatMonthYear(now)}</Text>
          <TouchableOpacity onPress={nextMonth} hitSlop={8}>
            <Ionicons name="chevron-forward" size={22} color={colors.primary} />
          </TouchableOpacity>
        </View>

        {/* Grade do calendário */}
        <View style={[s.gridCard, { backgroundColor: colors.card }]}>
          <MonthGrid
            year={now.getFullYear()}
            month={now.getMonth()}
            events={events}
            onDayPress={handleDayPress}
            colors={colors}
          />
        </View>

        {/* Eventos do dia selecionado */}
        {selectedDay && (
          <View style={{ paddingHorizontal: spacing.md, marginTop: spacing.sm }}>
            <Text style={s.sectionTitle}>
              {selectedDay} de {monthName(now.getMonth())}
            </Text>
            {dayEvents.length === 0 ? (
              <View style={[s.emptyDay, { backgroundColor: colors.surfaceVariant }]}>
                <Text style={s.emptyDayText}>Nenhum evento neste dia.</Text>
                <TouchableOpacity onPress={() => setModal(true)}>
                  <Text style={[s.emptyDayText, { color: colors.primary, marginTop: 4 }]}>+ Adicionar evento</Text>
                </TouchableOpacity>
              </View>
            ) : (
              dayEvents.map(event => (
                <CalendarEventCard
                  key={event.id}
                  event={event}
                  onDelete={() => Alert.alert('Excluir', `Excluir "${event.title}"?`, [
                    { text: 'Cancelar', style: 'cancel' },
                    { text: 'Excluir', style: 'destructive', onPress: () => deleteEvent(event.id) },
                  ])}
                />
              ))
            )}
          </View>
        )}

        {/* Legenda de categorias */}
        <View style={{ paddingHorizontal: spacing.md, marginTop: spacing.md }}>
          <Text style={s.sectionTitle}>Este mês — {monthEvents.length} evento{monthEvents.length !== 1 ? 's' : ''}</Text>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginBottom: spacing.sm }}>
            {[{ key: 'all', label: 'Todos', icon: 'apps', colorKey: null }, ...eventCategories].map(cat => {
              const count = cat.key === 'all' ? monthEvents.length : (categoryCounts[cat.key] || 0);
              if (cat.key !== 'all' && count === 0) return null;
              const color = cat.colorKey ? colors[cat.colorKey] : colors.primary;
              return (
                <TouchableOpacity
                  key={cat.key}
                  style={[s.catChip, filterCat === cat.key && { backgroundColor: color }]}
                  onPress={() => setFilterCat(cat.key)}
                >
                  <Ionicons name={cat.icon} size={13} color={filterCat === cat.key ? '#fff' : color} />
                  <Text style={[s.catChipText, { color: filterCat === cat.key ? '#fff' : colors.textSecondary }]}>
                    {cat.label} {count > 0 ? `(${count})` : ''}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </ScrollView>
        </View>

        {/* Lista de eventos do mês */}
        <View style={{ paddingHorizontal: spacing.md }}>
          {filteredEvents.length === 0 ? (
            <View style={[s.emptyDay, { backgroundColor: colors.surfaceVariant }]}>
              <Ionicons name="calendar-outline" size={40} color={colors.textDisabled} />
              <Text style={s.emptyDayText}>Nenhum evento este mês.</Text>
              <CustomButton title="Adicionar Evento" variant="primary" onPress={() => setModal(true)} style={{ marginTop: spacing.md }} />
            </View>
          ) : (
            filteredEvents.map(event => (
              <CalendarEventCard
                key={event.id}
                event={event}
                onDelete={() => Alert.alert('Excluir', `Excluir "${event.title}"?`, [
                  { text: 'Cancelar', style: 'cancel' },
                  { text: 'Excluir', style: 'destructive', onPress: () => deleteEvent(event.id) },
                ])}
              />
            ))
          )}
        </View>
      </ScrollView>

      {/* Modal de novo evento */}
      <Modal visible={modal} transparent animationType="slide" onRequestClose={() => setModal(false)}>
        <View style={s.modalOverlay}>
          <ScrollView
            style={[s.modalSheet, { backgroundColor: colors.surface }]}
            contentContainerStyle={{ padding: spacing.lg }}
            keyboardShouldPersistTaps="handled"
          >
            <EventForm
              colors={colors}
              onClose={() => setModal(false)}
              onSave={handleAddEvent}
              initialDate={
                selectedDay
                  ? `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2,'0')}-${String(selectedDay).padStart(2,'0')}`
                  : undefined
              }
            />
          </ScrollView>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

const buildStyles = (colors) =>
  StyleSheet.create({
    safe: { flex: 1 },
    header: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      paddingHorizontal: spacing.md,
      paddingVertical: spacing.sm,
    },
    headerTitle: { fontSize: fontSize.xl, fontWeight: fontWeight.bold, color: colors.text },
    addBtn: { backgroundColor: colors.primary, borderRadius: radius.full, padding: spacing.sm },
    monthNav: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      paddingHorizontal: spacing.md,
      paddingVertical: spacing.xs,
    },
    monthText: { fontSize: fontSize.lg, fontWeight: fontWeight.semibold, color: colors.text },
    gridCard: { marginHorizontal: spacing.md, borderRadius: radius.md, overflow: 'hidden', marginBottom: spacing.sm },
    sectionTitle: { fontSize: fontSize.lg, fontWeight: fontWeight.bold, color: colors.text, marginBottom: spacing.sm },
    emptyDay: { borderRadius: radius.md, padding: spacing.lg, alignItems: 'center' },
    emptyDayText: { color: colors.textSecondary, textAlign: 'center' },
    catChip: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 4,
      backgroundColor: colors.surfaceVariant,
      borderRadius: radius.full,
      paddingHorizontal: spacing.sm,
      paddingVertical: 6,
      marginRight: spacing.xs,
    },
    catChipText: { fontSize: fontSize.xs },
    modalOverlay: { flex: 1, justifyContent: 'flex-end', backgroundColor: 'rgba(0,0,0,0.5)' },
    modalSheet: { borderTopLeftRadius: radius.xl, borderTopRightRadius: radius.xl, maxHeight: '90%' },
  });

const gridStyles = (colors) =>
  StyleSheet.create({
    weekHeader: { flexDirection: 'row', backgroundColor: colors.primary + '22', paddingVertical: spacing.xs },
    weekDay: { flex: 1, textAlign: 'center', fontSize: fontSize.xs, fontWeight: fontWeight.bold, color: colors.primary },
    grid: { flexDirection: 'row', flexWrap: 'wrap' },
    cell: {
      width: `${100 / 7}%`,
      aspectRatio: 1,
      alignItems: 'center',
      justifyContent: 'flex-start',
      paddingTop: 6,
    },
    todayCell: { backgroundColor: colors.primary + '22' },
    dayNum: { fontSize: fontSize.sm, color: colors.text },
    todayNum: { color: colors.primary, fontWeight: fontWeight.bold },
    dots: { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'center', marginTop: 2 },
  });

const formStyles = (colors) =>
  StyleSheet.create({
    title: { fontSize: fontSize.xl, fontWeight: fontWeight.bold, color: colors.text, textAlign: 'center', marginBottom: spacing.lg },
    label: { fontSize: fontSize.sm, fontWeight: fontWeight.semibold, color: colors.textSecondary, marginBottom: spacing.xs },
    input: {
      backgroundColor: colors.surfaceVariant,
      borderRadius: radius.md,
      padding: spacing.md,
      color: colors.text,
      fontSize: fontSize.md,
      marginBottom: spacing.md,
    },
    chip: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 4,
      backgroundColor: colors.surfaceVariant,
      borderRadius: radius.full,
      paddingHorizontal: spacing.sm,
      paddingVertical: 6,
      marginRight: spacing.xs,
    },
    chipText: { fontSize: fontSize.xs, color: colors.textSecondary },
  });
