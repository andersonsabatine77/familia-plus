import React, { useState, useCallback } from 'react';
import {
  View, Text, ScrollView, StyleSheet, TouchableOpacity,
  Modal, TextInput, Alert, FlatList,
} from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../context/ThemeContext';
import { useData } from '../context/DataContext';
import { ChildCard, EventMiniCard } from '../components/ChildCard';
import CustomButton from '../components/CustomButton';
import DateField from '../components/DateField';
import { formatDate, formatDateShort, generateId } from '../utils/formatters';
import { spacing, radius, fontSize, fontWeight, elevation } from '../styles/spacing';

// ── Formulário de cadastro de filho ─────────────────────────────────────────
function AddChildForm({ onSave, onClose, colors }) {
  const [name,      setName]      = useState('');
  const [birthDate, setBirthDate] = useState('');
  const [schoolName,setSchoolName]= useState('');
  const [bloodType, setBloodType] = useState('');
  const s = formStyles(colors);

  const handleSave = () => {
    if (!name.trim()) return Alert.alert('Atenção', 'Informe o nome.');
    onSave({
      name: name.trim(),
      birthDate: birthDate || null,
      photo: null,
      school: { name: schoolName.trim(), meetings: [], exams: [], grades: [], contacts: [] },
      health: { bloodType: bloodType.trim(), appointments: [], medications: [], vaccines: [], allergies: [], contacts: [] },
      activities: [],
    });
    onClose();
  };

  return (
    <View>
      <Text style={s.title}>👶 Novo Filho</Text>
      <Text style={s.label}>Nome *</Text>
      <TextInput style={s.input} value={name} onChangeText={setName} placeholder="Nome completo" placeholderTextColor={colors.textDisabled} />
      <Text style={s.label}>Data de Nascimento</Text>
      <DateField value={birthDate} onChange={setBirthDate} placeholder="Selecionar data" />
      <Text style={s.label}>Escola</Text>
      <TextInput style={s.input} value={schoolName} onChangeText={setSchoolName} placeholder="Nome da escola" placeholderTextColor={colors.textDisabled} />
      <Text style={s.label}>Tipo Sanguíneo</Text>
      <TextInput style={s.input} value={bloodType} onChangeText={setBloodType} placeholder="Ex.: A+" placeholderTextColor={colors.textDisabled} />
      <View style={{ flexDirection: 'row', gap: spacing.sm }}>
        <CustomButton title="Cancelar" variant="outline" onPress={onClose} style={{ flex: 1 }} />
        <CustomButton title="Salvar"   variant="primary" onPress={handleSave} style={{ flex: 1 }} />
      </View>
    </View>
  );
}

// ── Formulário genérico de sub-item ─────────────────────────────────────────
function SubItemForm({ section, subsection, onSave, onClose, colors }) {
  const [title,   setTitle]   = useState('');
  const [date,    setDate]    = useState('');
  const [time,    setTime]    = useState('');
  const [notes,   setNotes]   = useState('');
  const [dosage,  setDosage]  = useState('');
  const s = formStyles(colors);

  const labels = {
    'school.meetings':     { title: '📅 Nova Reunião', titleLabel: 'Assunto' },
    'school.exams':        { title: '📝 Nova Prova',   titleLabel: 'Disciplina' },
    'health.appointments': { title: '🏥 Nova Consulta', titleLabel: 'Médico / Especialidade' },
    'health.medications':  { title: '💊 Nova Medicação', titleLabel: 'Nome do Remédio' },
    'health.vaccines':     { title: '💉 Nova Vacina',   titleLabel: 'Nome da Vacina' },
    'activities':          { title: '⚽ Nova Atividade', titleLabel: 'Atividade' },
  };
  const key = `${section}.${subsection}`;
  const cfg = labels[key] || labels['activities'];

  const handleSave = () => {
    if (!title.trim()) return Alert.alert('Atenção', 'Preencha o campo obrigatório.');
    onSave({
      [subsection === 'medications' ? 'name' : subsection === 'activities' ? 'name' : 'subject']: title.trim(),
      date: date || null,
      time: time || null,
      notes: notes || null,
      dosage: dosage || null,
      active: true,
    });
    onClose();
  };

  return (
    <View>
      <Text style={s.title}>{cfg.title}</Text>
      <Text style={s.label}>{cfg.titleLabel} *</Text>
      <TextInput style={s.input} value={title} onChangeText={setTitle} placeholder={cfg.titleLabel} placeholderTextColor={colors.textDisabled} />
      <Text style={s.label}>Data</Text>
      <DateField value={date} onChange={setDate} placeholder="Selecionar data" />
      <Text style={s.label}>Horário</Text>
      <TextInput style={s.input} value={time} onChangeText={setTime} placeholder="HH:MM" placeholderTextColor={colors.textDisabled} />
      {subsection === 'medications' && (
        <>
          <Text style={s.label}>Dosagem</Text>
          <TextInput style={s.input} value={dosage} onChangeText={setDosage} placeholder="Ex.: 5ml" placeholderTextColor={colors.textDisabled} />
        </>
      )}
      <Text style={s.label}>Observações</Text>
      <TextInput style={[s.input, { height: 80, textAlignVertical: 'top' }]} value={notes} onChangeText={setNotes} placeholder="Observações..." multiline placeholderTextColor={colors.textDisabled} />
      <View style={{ flexDirection: 'row', gap: spacing.sm }}>
        <CustomButton title="Cancelar" variant="outline" onPress={onClose} style={{ flex: 1 }} />
        <CustomButton title="Salvar"   variant="primary" onPress={handleSave} style={{ flex: 1 }} />
      </View>
    </View>
  );
}

// ── Detalhe do filho ─────────────────────────────────────────────────────────
function ChildDetail({ child, onClose, colors }) {
  const { addChildSubItem, deleteChildSubItem } = useData();
  const insets = useSafeAreaInsets();
  const [tab,       setTab]       = useState('school'); // school | health | activities
  const [subModal,  setSubModal]  = useState(null);     // { section, subsection }
  const s = detailStyles(colors);

  const schoolSections = [
    { subsection: 'meetings', label: 'Reuniões',  icon: 'people',        dateKey: 'date', titleKey: 'subject' },
    { subsection: 'exams',    label: 'Provas',    icon: 'document-text', dateKey: 'date', titleKey: 'subject' },
    { subsection: 'grades',   label: 'Notas',     icon: 'ribbon',        dateKey: 'date', titleKey: 'subject' },
  ];
  const healthSections = [
    { subsection: 'appointments', label: 'Consultas',  icon: 'medical',    dateKey: 'date',     titleKey: 'subject' },
    { subsection: 'medications',  label: 'Medicações', icon: 'flask',      dateKey: null,       titleKey: 'name' },
    { subsection: 'vaccines',     label: 'Vacinas',    icon: 'shield',     dateKey: 'date',     titleKey: 'name' },
  ];

  const renderItems = (section, items, titleKey, dateKey, icon) => (
    <View style={{ marginBottom: spacing.md }}>
      {items.length === 0
        ? <Text style={s.empty}>Nenhum item cadastrado.</Text>
        : items.map(item => (
            <View key={item.id} style={s.subItem}>
              <Ionicons name={icon} size={16} color={colors.primary} />
              <View style={{ flex: 1 }}>
                <Text style={s.subItemTitle}>{item[titleKey]}</Text>
                {dateKey && item[dateKey] && <Text style={s.subItemMeta}>{formatDate(item[dateKey])}{item.time ? ` às ${item.time}` : ''}</Text>}
                {item.dosage && <Text style={s.subItemMeta}>Dose: {item.dosage}</Text>}
                {item.notes  && <Text style={s.subItemMeta}>{item.notes}</Text>}
              </View>
              <TouchableOpacity onPress={() => deleteChildSubItem(child.id, section, subsection, item.id)} hitSlop={8}>
                <Ionicons name="trash-outline" size={16} color={colors.error} />
              </TouchableOpacity>
            </View>
          ))
      }
    </View>
  );

  // Helper para renderizar com subsection no escopo
  const renderSection = (section, cfg) => (
    <View key={cfg.subsection}>
      <View style={s.subHeader}>
        <Text style={s.subTitle}>
          <Ionicons name={cfg.icon} size={16} color={colors.primary} /> {cfg.label}
        </Text>
        <TouchableOpacity onPress={() => setSubModal({ section, subsection: cfg.subsection })}>
          <Ionicons name="add-circle" size={22} color={colors.primary} />
        </TouchableOpacity>
      </View>
      {renderItems(section, (child[section]?.[cfg.subsection] || []), cfg.titleKey, cfg.dateKey, cfg.icon)}
    </View>
  );

  return (
    <View style={{ flex: 1, backgroundColor: colors.background }}>
      {/* Header do detalhe */}
      <View style={[s.detailHeader, { backgroundColor: colors.primary, paddingTop: insets.top + spacing.sm }]}>
        <TouchableOpacity onPress={onClose} hitSlop={8}>
          <Ionicons name="arrow-back" size={22} color="#fff" />
        </TouchableOpacity>
        <Text style={s.detailName}>{child.name}</Text>
        <View style={{ width: 22 }} />
      </View>

      {/* Info de saúde básica */}
      {child.health?.bloodType && (
        <View style={s.infoBar}>
          <Ionicons name="water" size={14} color={colors.error} />
          <Text style={[s.infoText, { color: colors.error }]}>Tipo: {child.health.bloodType}</Text>
          {child.health.allergies?.length > 0 && (
            <>
              <Ionicons name="alert-circle" size={14} color={colors.warning} />
              <Text style={[s.infoText, { color: colors.warning }]}>
                Alergias: {child.health.allergies.join(', ')}
              </Text>
            </>
          )}
        </View>
      )}

      {/* Abas */}
      <View style={s.tabs}>
        {[
          { key: 'school', label: '🏫 Escola' },
          { key: 'health', label: '💊 Saúde' },
          { key: 'activities', label: '⚽ Atividades' },
        ].map(t => (
          <TouchableOpacity
            key={t.key}
            style={[s.tabItem, tab === t.key && s.tabActive]}
            onPress={() => setTab(t.key)}
          >
            <Text style={[s.tabText, tab === t.key && s.tabTextActive]}>{t.label}</Text>
          </TouchableOpacity>
        ))}
      </View>

      <ScrollView contentContainerStyle={{ padding: spacing.md, paddingBottom: spacing.xxl }}>
        {/* Escola */}
        {tab === 'school' && (
          <>
            {child.school?.name && (
              <View style={[s.schoolInfo, { backgroundColor: colors.primary + '22' }]}>
                <Ionicons name="school" size={16} color={colors.primary} />
                <Text style={[s.schoolName, { color: colors.primary }]}>{child.school.name}</Text>
              </View>
            )}
            {schoolSections.map(cfg => renderSection('school', cfg))}
          </>
        )}

        {/* Saúde */}
        {tab === 'health' && (
          <>
            {healthSections.map(cfg => renderSection('health', cfg))}

            {/* Alergias */}
            <View style={s.subHeader}>
              <Text style={s.subTitle}>⚠️ Alergias</Text>
            </View>
            {(child.health?.allergies || []).length === 0
              ? <Text style={s.empty}>Nenhuma alergia cadastrada.</Text>
              : (child.health.allergies).map((a, i) => (
                  <Text key={i} style={s.allergyItem}>• {a}</Text>
                ))
            }
          </>
        )}

        {/* Atividades */}
        {tab === 'activities' && (
          <>
            <TouchableOpacity
              style={[s.addActivityBtn, { borderColor: colors.primary }]}
              onPress={() => setSubModal({ section: 'activities', subsection: 'activities' })}
            >
              <Ionicons name="add" size={18} color={colors.primary} />
              <Text style={{ color: colors.primary, fontWeight: fontWeight.semibold }}>Adicionar Atividade</Text>
            </TouchableOpacity>
            {(child.activities || []).length === 0
              ? <Text style={s.empty}>Nenhuma atividade cadastrada.</Text>
              : (child.activities).map(act => (
                  <View key={act.id} style={s.subItem}>
                    <Ionicons name="star" size={16} color={colors.accent} />
                    <View style={{ flex: 1 }}>
                      <Text style={s.subItemTitle}>{act.name}</Text>
                      {act.schedule && <Text style={s.subItemMeta}>{act.schedule}</Text>}
                      {act.location && <Text style={s.subItemMeta}>📍 {act.location}</Text>}
                    </View>
                    <TouchableOpacity onPress={() => deleteChildSubItem(child.id, 'activities', 'activities', act.id)} hitSlop={8}>
                      <Ionicons name="trash-outline" size={16} color={colors.error} />
                    </TouchableOpacity>
                  </View>
                ))
            }
          </>
        )}
      </ScrollView>

      {/* Modal de sub-item */}
      <Modal visible={!!subModal} transparent animationType="slide" onRequestClose={() => setSubModal(null)}>
        <View style={s.modalOverlay}>
          <ScrollView
            style={[s.modalSheet, { backgroundColor: colors.surface }]}
            contentContainerStyle={{ padding: spacing.lg }}
            keyboardShouldPersistTaps="handled"
          >
            {subModal && (
              <SubItemForm
                section={subModal.section}
                subsection={subModal.subsection}
                colors={colors}
                onClose={() => setSubModal(null)}
                onSave={(item) => {
                  addChildSubItem(child.id, subModal.section, subModal.subsection, item);
                  setSubModal(null);
                }}
              />
            )}
          </ScrollView>
        </View>
      </Modal>
    </View>
  );
}

// ── Tela principal de filhos ─────────────────────────────────────────────────
export default function ChildrenScreen() {
  const { colors }  = useTheme();
  const { children, addChild, deleteChild } = useData();
  const [addModal,    setAddModal]    = useState(false);
  const [selectedChild, setSelectedChild] = useState(null);

  const s = buildStyles(colors);

  const handleDelete = useCallback((id) => {
    Alert.alert(
      'Remover filho',
      'Tem certeza? Todos os dados deste filho serão removidos.',
      [
        { text: 'Cancelar', style: 'cancel' },
        { text: 'Remover', style: 'destructive', onPress: () => deleteChild(id) },
      ]
    );
  }, [deleteChild]);

  if (selectedChild) {
    return (
      <ChildDetail
        child={children.find(c => c.id === selectedChild) || selectedChild}
        onClose={() => setSelectedChild(null)}
        colors={colors}
      />
    );
  }

  return (
    <SafeAreaView style={[s.safe, { backgroundColor: colors.background }]} edges={['top']}>
      <View style={s.header}>
        <Text style={s.headerTitle}>👨‍👩‍👧 Filhos</Text>
        <TouchableOpacity style={s.addBtn} onPress={() => setAddModal(true)}>
          <Ionicons name="add" size={22} color="#fff" />
        </TouchableOpacity>
      </View>

      <ScrollView contentContainerStyle={{ padding: spacing.md, paddingBottom: spacing.xxl }}>
        {children.length === 0 ? (
          <View style={s.emptyState}>
            <Ionicons name="people" size={60} color={colors.textDisabled} />
            <Text style={s.emptyTitle}>Nenhum filho cadastrado</Text>
            <Text style={s.emptySubtitle}>Toque no + para adicionar</Text>
            <CustomButton
              title="Adicionar Filho"
              variant="primary"
              onPress={() => setAddModal(true)}
              style={{ marginTop: spacing.lg }}
            />
          </View>
        ) : (
          children.map(child => (
            <ChildCard
              key={child.id}
              child={child}
              onPress={() => setSelectedChild(child.id)}
              onDelete={handleDelete}
            />
          ))
        )}
      </ScrollView>

      <Modal visible={addModal} transparent animationType="slide" onRequestClose={() => setAddModal(false)}>
        <View style={s.modalOverlay}>
          <ScrollView
            style={[s.modalSheet, { backgroundColor: colors.surface }]}
            contentContainerStyle={{ padding: spacing.lg }}
            keyboardShouldPersistTaps="handled"
          >
            <AddChildForm
              colors={colors}
              onClose={() => setAddModal(false)}
              onSave={addChild}
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
    addBtn: {
      backgroundColor: colors.primary,
      borderRadius: radius.full,
      padding: spacing.sm,
    },
    emptyState: { alignItems: 'center', marginTop: spacing.xxl },
    emptyTitle: { fontSize: fontSize.xl, fontWeight: fontWeight.bold, color: colors.textSecondary, marginTop: spacing.md },
    emptySubtitle: { fontSize: fontSize.md, color: colors.textDisabled, marginTop: spacing.xs },
    modalOverlay: { flex: 1, justifyContent: 'flex-end', backgroundColor: 'rgba(0,0,0,0.5)' },
    modalSheet: { borderTopLeftRadius: radius.xl, borderTopRightRadius: radius.xl, maxHeight: '90%' },
  });

const detailStyles = (colors) =>
  StyleSheet.create({
    detailHeader: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      padding: spacing.md,
    },
    detailName: { fontSize: fontSize.xl, fontWeight: fontWeight.bold, color: '#fff' },
    infoBar: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: spacing.sm,
      padding: spacing.sm,
      paddingHorizontal: spacing.md,
      backgroundColor: colors.surfaceVariant,
    },
    infoText: { fontSize: fontSize.sm, fontWeight: fontWeight.semibold },
    tabs: {
      flexDirection: 'row',
      backgroundColor: colors.surfaceVariant,
      padding: 4,
    },
    tabItem: { flex: 1, alignItems: 'center', paddingVertical: spacing.xs, borderRadius: radius.sm },
    tabActive: { backgroundColor: colors.primary },
    tabText: { fontSize: fontSize.sm, color: colors.textSecondary },
    tabTextActive: { color: '#fff', fontWeight: fontWeight.semibold },
    subHeader: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      marginBottom: spacing.sm,
      marginTop: spacing.sm,
    },
    subTitle: { fontSize: fontSize.md, fontWeight: fontWeight.bold, color: colors.text },
    subItem: {
      flexDirection: 'row',
      alignItems: 'flex-start',
      gap: spacing.sm,
      backgroundColor: colors.card,
      borderRadius: radius.md,
      padding: spacing.sm,
      marginBottom: spacing.xs,
    },
    subItemTitle: { fontSize: fontSize.sm, fontWeight: fontWeight.semibold, color: colors.text },
    subItemMeta: { fontSize: fontSize.xs, color: colors.textSecondary, marginTop: 2 },
    allergyItem: { fontSize: fontSize.md, color: colors.warning, marginBottom: spacing.xs },
    empty: { color: colors.textDisabled, textAlign: 'center', marginTop: spacing.sm, marginBottom: spacing.md },
    schoolInfo: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: spacing.sm,
      borderRadius: radius.md,
      padding: spacing.sm,
      marginBottom: spacing.md,
    },
    schoolName: { fontSize: fontSize.sm, fontWeight: fontWeight.semibold },
    addActivityBtn: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      gap: spacing.sm,
      borderWidth: 2,
      borderStyle: 'dashed',
      borderRadius: radius.md,
      padding: spacing.md,
      marginBottom: spacing.md,
    },
    modalOverlay: { flex: 1, justifyContent: 'flex-end', backgroundColor: 'rgba(0,0,0,0.5)' },
    modalSheet: { borderTopLeftRadius: radius.xl, borderTopRightRadius: radius.xl, maxHeight: '90%' },
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
  });
