import React, { useState, useCallback } from 'react';
import {
  View, Text, ScrollView, StyleSheet, TouchableOpacity,
  Modal, TextInput, Alert, Share, Platform,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../context/ThemeContext';
import { useData } from '../context/DataContext';
import ThemeToggle from '../components/ThemeToggle';
import CustomButton from '../components/CustomButton';
import { exportAllData, importAllData, clearAllData } from '../utils/storage';
import { requestNotificationPermission, cancelAllNotifications } from '../utils/notifications';
import { sendWhatsApp } from '../utils/whatsapp';
import { spacing, radius, fontSize, fontWeight, elevation } from '../styles/spacing';

// ── Seção com título e cards ─────────────────────────────────────────────────
function Section({ title, children, colors }) {
  return (
    <View style={{ marginBottom: spacing.lg }}>
      <Text style={{ fontSize: fontSize.sm, fontWeight: fontWeight.bold, color: colors.primary, marginBottom: spacing.sm, paddingHorizontal: spacing.md }}>
        {title.toUpperCase()}
      </Text>
      <View style={{ backgroundColor: colors.card, borderRadius: radius.md, marginHorizontal: spacing.md, overflow: 'hidden', ...elevation.sm }}>
        {children}
      </View>
    </View>
  );
}

function SettingRow({ icon, label, onPress, value, colors, danger, last }) {
  return (
    <TouchableOpacity
      style={[
        rowStyles.row,
        { borderBottomColor: colors.divider },
        last && { borderBottomWidth: 0 },
      ]}
      onPress={onPress}
      activeOpacity={0.7}
    >
      <View style={[rowStyles.iconBg, { backgroundColor: (danger ? colors.error : colors.primary) + '22' }]}>
        <Ionicons name={icon} size={18} color={danger ? colors.error : colors.primary} />
      </View>
      <Text style={[rowStyles.label, { color: danger ? colors.error : colors.text }]}>{label}</Text>
      {value !== undefined
        ? <Text style={[rowStyles.value, { color: colors.textSecondary }]}>{value}</Text>
        : <Ionicons name="chevron-forward" size={16} color={colors.textDisabled} />
      }
    </TouchableOpacity>
  );
}

const rowStyles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: spacing.md,
    gap: spacing.sm,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  iconBg: {
    width: 36,
    height: 36,
    borderRadius: radius.sm,
    alignItems: 'center',
    justifyContent: 'center',
  },
  label: { flex: 1, fontSize: fontSize.md },
  value: { fontSize: fontSize.sm },
});

// ── Tela principal ────────────────────────────────────────────────────────────
export default function SettingsScreen() {
  const { colors, isDark } = useTheme();
  const { family, settings, updateFamily, updateSettings } = useData();

  const [familyModal, setFamilyModal] = useState(false);
  const [editMember,  setEditMember]  = useState(null);
  const [memberName,  setMemberName]  = useState('');
  const [memberPhone, setMemberPhone] = useState('');

  const s = buildStyles(colors);

  // ── Backup ──────────────────────────────────────────────────────────────────
  const handleBackup = useCallback(async () => {
    const data = await exportAllData();
    const json = JSON.stringify(data, null, 2);
    await Share.share({
      message: json,
      title: 'Família+ Backup',
    });
  }, []);

  // ── Limpar dados ─────────────────────────────────────────────────────────────
  const handleClear = useCallback(() => {
    Alert.alert(
      '⚠️ Atenção',
      'Todos os dados serão apagados e os dados de exemplo serão restaurados. Esta ação não pode ser desfeita!',
      [
        { text: 'Cancelar', style: 'cancel' },
        {
          text: 'Limpar tudo',
          style: 'destructive',
          onPress: async () => {
            await cancelAllNotifications();
            await clearAllData();
            Alert.alert('✅ Dados limpos', 'Os dados de exemplo foram restaurados. Reinicie o app.');
          },
        },
      ]
    );
  }, []);

  // ── Membro da família ────────────────────────────────────────────────────────
  const openMember = (member) => {
    setEditMember(member);
    setMemberName(member?.name || '');
    setMemberPhone(member?.phone || '');
    setFamilyModal(true);
  };

  const saveMember = () => {
    if (!memberName.trim()) return Alert.alert('Atenção', 'Informe o nome.');
    let next;
    if (editMember) {
      next = family.map(m => m.id === editMember.id ? { ...m, name: memberName.trim(), phone: memberPhone.trim() } : m);
    } else {
      next = [...family, { id: Date.now().toString(), name: memberName.trim(), phone: memberPhone.trim(), role: 'parent' }];
    }
    updateFamily(next);
    setFamilyModal(false);
  };

  const deleteMember = (id) => {
    Alert.alert('Remover', 'Remover este membro?', [
      { text: 'Cancelar', style: 'cancel' },
      { text: 'Remover', style: 'destructive', onPress: () => updateFamily(family.filter(m => m.id !== id)) },
    ]);
  };

  // ── Notificações ─────────────────────────────────────────────────────────────
  const toggleNotifications = async () => {
    if (!settings.notificationsEnabled) {
      const granted = await requestNotificationPermission();
      if (!granted) return Alert.alert('Permissão negada', 'Ative as notificações nas configurações do celular.');
    }
    updateSettings({ notificationsEnabled: !settings.notificationsEnabled });
  };

  const toggleAlertDay = (day) => {
    const current = settings.billsAlertDays || [];
    const next = current.includes(day) ? current.filter(d => d !== day) : [...current, day].sort((a, b) => a - b);
    updateSettings({ billsAlertDays: next });
  };

  // ── WhatsApp ──────────────────────────────────────────────────────────────────
  const whatsappNumbers = settings.whatsappNumbers || ['', '', ''];

  const updateWhatsApp = (index, value) => {
    const next = [...whatsappNumbers];
    next[index] = value.replace(/\D/g, ''); // só dígitos
    updateSettings({ whatsappNumbers: next });
  };

  const testWhatsApp = async (number) => {
    if (!number) return Alert.alert('Atenção', 'Informe o número antes de testar.');
    await sendWhatsApp(number, 'Olá! Este é um teste de notificação do app Família+. ✅');
  };

  return (
    <SafeAreaView style={[s.safe, { backgroundColor: colors.background }]} edges={['top']}>
      <View style={s.header}>
        <Text style={s.headerTitle}>⚙️ Configurações</Text>
      </View>

      <ScrollView contentContainerStyle={{ paddingTop: spacing.md, paddingBottom: spacing.xxl }}>

        {/* ── Aparência ── */}
        <Section title="Aparência" colors={colors}>
          <View style={{ padding: spacing.md }}>
            <ThemeToggle />
          </View>
        </Section>

        {/* ── Família ── */}
        <Section title="Membros da Família" colors={colors}>
          {family.map((m, i) => (
            <TouchableOpacity
              key={m.id}
              style={[rowStyles.row, { borderBottomColor: colors.divider }, i === family.length - 1 && { borderBottomWidth: 0 }]}
              onPress={() => openMember(m)}
            >
              <View style={[rowStyles.iconBg, { backgroundColor: colors.accent + '22' }]}>
                <Ionicons name="person" size={18} color={colors.accent} />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={{ color: colors.text, fontWeight: fontWeight.semibold }}>{m.name}</Text>
                <Text style={{ color: colors.textSecondary, fontSize: fontSize.sm }}>{m.phone || 'Sem telefone'}</Text>
              </View>
              <TouchableOpacity onPress={() => deleteMember(m.id)} hitSlop={8}>
                <Ionicons name="trash-outline" size={16} color={colors.error} />
              </TouchableOpacity>
            </TouchableOpacity>
          ))}
          <TouchableOpacity style={[rowStyles.row, { borderBottomWidth: 0 }]} onPress={() => openMember(null)}>
            <View style={[rowStyles.iconBg, { backgroundColor: colors.primary + '22' }]}>
              <Ionicons name="person-add" size={18} color={colors.primary} />
            </View>
            <Text style={[rowStyles.label, { color: colors.primary }]}>Adicionar membro</Text>
          </TouchableOpacity>
        </Section>

        {/* ── Notificações ── */}
        <Section title="Notificações" colors={colors}>
          <View style={[rowStyles.row, { borderBottomColor: colors.divider }]}>
            <View style={[rowStyles.iconBg, { backgroundColor: colors.primary + '22' }]}>
              <Ionicons name="notifications" size={18} color={colors.primary} />
            </View>
            <Text style={[rowStyles.label, { color: colors.text }]}>Notificações ativas</Text>
            <TouchableOpacity onPress={toggleNotifications}>
              <Ionicons
                name={settings.notificationsEnabled ? 'toggle' : 'toggle-outline'}
                size={32}
                color={settings.notificationsEnabled ? colors.success : colors.textDisabled}
              />
            </TouchableOpacity>
          </View>

          {settings.notificationsEnabled && (
            <View style={{ padding: spacing.md, borderBottomWidth: 0 }}>
              <Text style={{ color: colors.textSecondary, fontSize: fontSize.sm, marginBottom: spacing.sm }}>
                Alertar contas com antecedência de:
              </Text>
              <View style={{ flexDirection: 'row', gap: spacing.sm }}>
                {[1, 3, 7].map(day => {
                  const active = (settings.billsAlertDays || []).includes(day);
                  return (
                    <TouchableOpacity
                      key={day}
                      style={[
                        s.dayChip,
                        active && { backgroundColor: colors.primary },
                      ]}
                      onPress={() => toggleAlertDay(day)}
                    >
                      <Text style={[s.dayChipText, active && { color: '#fff' }]}>
                        {day}d
                      </Text>
                    </TouchableOpacity>
                  );
                })}
              </View>
            </View>
          )}
        </Section>

        {/* ── WhatsApp ── */}
        <Section title="Avisos via WhatsApp" colors={colors}>
          <View style={{ padding: spacing.md }}>
            <Text style={{ color: colors.textSecondary, fontSize: fontSize.sm, marginBottom: spacing.md }}>
              Cadastre até 3 números para receber avisos de contas, eventos e listas de compras.{'\n'}Use o formato: 5511999998888 (código do país + DDD + número).
            </Text>
            {[0, 1, 2].map(i => (
              <View key={i} style={{ marginBottom: spacing.sm }}>
                <Text style={{ fontSize: fontSize.xs, color: colors.textSecondary, marginBottom: 4 }}>
                  Número {i + 1}
                </Text>
                <View style={{ flexDirection: 'row', gap: spacing.sm }}>
                  <TextInput
                    style={{
                      flex: 1,
                      backgroundColor: colors.surfaceVariant,
                      borderRadius: radius.md,
                      padding: spacing.sm,
                      color: colors.text,
                      fontSize: fontSize.md,
                    }}
                    value={whatsappNumbers[i]}
                    onChangeText={v => updateWhatsApp(i, v)}
                    placeholder="5511999998888"
                    placeholderTextColor={colors.textDisabled}
                    keyboardType="phone-pad"
                  />
                  <TouchableOpacity
                    style={{
                      backgroundColor: '#25D366',
                      borderRadius: radius.md,
                      paddingHorizontal: spacing.md,
                      alignItems: 'center',
                      justifyContent: 'center',
                    }}
                    onPress={() => testWhatsApp(whatsappNumbers[i])}
                  >
                    <Ionicons name="logo-whatsapp" size={20} color="#fff" />
                  </TouchableOpacity>
                </View>
              </View>
            ))}
            <Text style={{ fontSize: fontSize.xs, color: colors.textSecondary, marginTop: spacing.xs }}>
              Toque no ícone verde para testar o envio para cada número.
            </Text>
          </View>
        </Section>

        {/* ── Dados ── */}
        <Section title="Dados" colors={colors}>
          <SettingRow
            icon="cloud-download-outline"
            label="Exportar backup"
            onPress={handleBackup}
            colors={colors}
          />
          <SettingRow
            icon="trash-bin-outline"
            label="Limpar todos os dados"
            onPress={handleClear}
            colors={colors}
            danger
            last
          />
        </Section>

        {/* ── Sobre ── */}
        <Section title="Sobre" colors={colors}>
          <View style={{ padding: spacing.md }}>
            <Text style={{ fontSize: fontSize.xxl, textAlign: 'center', marginBottom: spacing.xs }}>👨‍👩‍👧‍👦</Text>
            <Text style={{ fontSize: fontSize.xl, fontWeight: fontWeight.bold, color: colors.text, textAlign: 'center' }}>
              Família+
            </Text>
            <Text style={{ fontSize: fontSize.sm, color: colors.textSecondary, textAlign: 'center', marginTop: spacing.xs }}>
              Versão 1.0.0
            </Text>
            <Text style={{ fontSize: fontSize.sm, color: colors.textSecondary, textAlign: 'center', marginTop: spacing.sm }}>
              Gerencie finanças, filhos, compras e eventos da sua família em um só lugar — 100% offline.
            </Text>
          </View>
        </Section>
      </ScrollView>

      {/* Modal de membro */}
      <Modal visible={familyModal} transparent animationType="slide" onRequestClose={() => setFamilyModal(false)}>
        <View style={s.modalOverlay}>
          <View style={[s.modalSheet, { backgroundColor: colors.surface }]}>
            <Text style={s.modalTitle}>{editMember ? 'Editar Membro' : 'Novo Membro'}</Text>
            <Text style={s.label}>Nome *</Text>
            <TextInput
              style={[s.input, { backgroundColor: colors.surfaceVariant, color: colors.text }]}
              value={memberName}
              onChangeText={setMemberName}
              placeholder="Nome"
              placeholderTextColor={colors.textDisabled}
            />
            <Text style={s.label}>WhatsApp</Text>
            <TextInput
              style={[s.input, { backgroundColor: colors.surfaceVariant, color: colors.text }]}
              value={memberPhone}
              onChangeText={setMemberPhone}
              placeholder="(11) 99999-9999"
              keyboardType="phone-pad"
              placeholderTextColor={colors.textDisabled}
            />
            <View style={{ flexDirection: 'row', gap: spacing.sm, marginTop: spacing.sm }}>
              <CustomButton title="Cancelar" variant="outline" onPress={() => setFamilyModal(false)} style={{ flex: 1 }} />
              <CustomButton title="Salvar"   variant="primary" onPress={saveMember}               style={{ flex: 1 }} />
            </View>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

const buildStyles = (colors) =>
  StyleSheet.create({
    safe: { flex: 1 },
    header: { paddingHorizontal: spacing.md, paddingVertical: spacing.sm },
    headerTitle: { fontSize: fontSize.xl, fontWeight: fontWeight.bold, color: colors.text },

    dayChip: {
      paddingHorizontal: spacing.md,
      paddingVertical: spacing.sm,
      borderRadius: radius.full,
      backgroundColor: colors.surfaceVariant,
    },
    dayChipText: { fontSize: fontSize.md, fontWeight: fontWeight.semibold, color: colors.textSecondary },

    modalOverlay: { flex: 1, justifyContent: 'flex-end', backgroundColor: 'rgba(0,0,0,0.5)' },
    modalSheet: {
      borderTopLeftRadius: radius.xl,
      borderTopRightRadius: radius.xl,
      padding: spacing.lg,
    },
    modalTitle: {
      fontSize: fontSize.xl,
      fontWeight: fontWeight.bold,
      color: colors.text,
      textAlign: 'center',
      marginBottom: spacing.lg,
    },
    label: {
      fontSize: fontSize.sm,
      fontWeight: fontWeight.semibold,
      color: colors.textSecondary,
      marginBottom: spacing.xs,
    },
    input: {
      borderRadius: radius.md,
      padding: spacing.md,
      fontSize: fontSize.md,
      marginBottom: spacing.md,
    },
  });
