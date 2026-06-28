import React, { useState, useCallback } from 'react';
import {
  View, Text, ScrollView, StyleSheet, TouchableOpacity,
  Modal, TextInput, Alert, Share, Platform, Linking,
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
  const {
    family, settings, updateFamily, updateSettings,
    syncEnabled, syncCode, syncStatus, startSyncedFamily, joinSyncedFamily, leaveSyncedFamily,
  } = useData();

  const [joinModal, setJoinModal] = useState(false);
  const [joinCode,  setJoinCode]  = useState('');
  const [syncBusy,  setSyncBusy]  = useState(false);
  const [dbHelp,    setDbHelp]    = useState(false);

  const [familyModal, setFamilyModal] = useState(false);
  const [editMember,  setEditMember]  = useState(null);
  const [memberName,  setMemberName]  = useState('');
  const [memberPhone, setMemberPhone] = useState('');

  const [timeModal, setTimeModal] = useState(false);
  const [tmpHour,   setTmpHour]   = useState(9);
  const [tmpMin,    setTmpMin]    = useState(0);

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

  // ── Sincronização entre celulares ────────────────────────────────────────────
  const syncStatusLabel = {
    off: 'Desativada', connecting: 'Conectando…', online: 'Sincronizando ✓', error: 'Sem conexão — tentando…',
  }[syncStatus] || '';

  const handleCreateFamily = async () => {
    setSyncBusy(true);
    try {
      const code = await startSyncedFamily();
      Alert.alert(
        '✅ Família criada!',
        `Seu código é:\n\n${code}\n\nNo outro celular, abra o Família+ → Configurações → "Entrar com código" e digite esse código. Tudo passa a ser compartilhado em tempo real.`,
      );
    } catch (e) {
      Alert.alert('Erro', e?.message || 'Não foi possível criar a família.');
    } finally {
      setSyncBusy(false);
    }
  };

  const handleJoinFamily = async () => {
    if (!joinCode.trim()) return Alert.alert('Atenção', 'Digite o código da família.');
    setSyncBusy(true);
    try {
      await joinSyncedFamily(joinCode);
      setJoinModal(false);
      setJoinCode('');
      Alert.alert('✅ Conectado!', 'Agora vocês compartilham os mesmos dados em tempo real. Os dados deste aparelho foram substituídos pelos da família.');
    } catch (e) {
      Alert.alert('Código inválido', e?.message || 'Não foi possível entrar nessa família.');
    } finally {
      setSyncBusy(false);
    }
  };

  const handleShareCode = async () => {
    await Share.share({
      message: `Vamos compartilhar nossa organização no app Família+!\nAbra o app → Configurações → "Entrar com código" e use:\n\n${syncCode}`,
    });
  };

  const handleLeaveSync = () => {
    Alert.alert(
      'Parar de sincronizar?',
      'Este aparelho deixa de enviar e receber mudanças. Os dados atuais continuam salvos aqui normalmente.',
      [
        { text: 'Cancelar', style: 'cancel' },
        { text: 'Parar', style: 'destructive', onPress: () => leaveSyncedFamily() },
      ],
    );
  };

  const openFirebaseSite = () => {
    Linking.openURL('https://console.firebase.google.com').catch(() =>
      Alert.alert('Erro', 'Não foi possível abrir o navegador.')
    );
  };

  // Passo a passo para criar um banco de dados próprio (Firebase)
  const dbSteps = [
    'Acesse console.firebase.google.com e entre com uma conta Google.',
    'Clique em "Criar um projeto", dê um nome (ex.: familia-plus) e conclua. Pode desativar o Google Analytics.',
    'No menu Build → Firestore Database, toque em "Criar banco de dados". Escolha o modo de produção e a região southamerica-east1 (São Paulo).',
    'Em ⚙ Configurações do projeto → Seus apps, clique no ícone </> (Web) e registre um app. O Firebase mostra 6 chaves (firebaseConfig).',
    'Essas 6 chaves vão no arquivo src/firebase/config.js do app — e então é preciso gerar um novo APK. (Esta parte é técnica, feita por quem monta o app.)',
    'No Firestore → aba Regras, publique a regra que libera a coleção "families".',
  ];

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

  // ── Horário do alerta ─────────────────────────────────────────────────────────
  const alertTime = settings.billsAlertTime || '09:00';

  const openTimePicker = () => {
    const [h, m] = alertTime.split(':').map(n => parseInt(n, 10) || 0);
    setTmpHour(h);
    setTmpMin(m);
    setTimeModal(true);
  };

  const step = (setter, value, delta, max) => {
    let next = value + delta;
    if (next < 0) next = max;
    if (next > max) next = 0;
    setter(next);
  };

  const saveTime = () => {
    const hh = String(tmpHour).padStart(2, '0');
    const mm = String(tmpMin).padStart(2, '0');
    updateSettings({ billsAlertTime: `${hh}:${mm}` });
    setTimeModal(false);
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

        {/* ── Sincronização ── */}
        <Section title="Compartilhar com a Família" colors={colors}>
          {!syncEnabled ? (
            <View style={{ padding: spacing.md }}>
              <Text style={{ color: colors.text, fontWeight: fontWeight.semibold, marginBottom: spacing.xs }}>
                ☁️ Sincronização entre celulares
              </Text>
              <Text style={{ color: colors.textSecondary, fontSize: fontSize.sm }}>
                Para usar os mesmos dados em mais de um aparelho, é preciso configurar o Firebase (grátis) uma única vez. O passo a passo está no arquivo README do app, em "Sincronização".
              </Text>
            </View>
          ) : !syncCode ? (
            <View style={{ padding: spacing.md, gap: spacing.sm }}>
              <Text style={{ color: colors.textSecondary, fontSize: fontSize.sm, marginBottom: spacing.xs }}>
                Use os mesmos dados em vários celulares, em tempo real. Crie uma família e compartilhe o código — ou entre em uma já existente.
              </Text>
              <CustomButton title="Criar família" variant="primary" onPress={handleCreateFamily} loading={syncBusy} />
              <CustomButton title="Entrar com código" variant="outline" onPress={() => setJoinModal(true)} />
            </View>
          ) : (
            <>
              <View style={{ padding: spacing.md }}>
                <Text style={{ color: colors.textSecondary, fontSize: fontSize.xs, letterSpacing: 1 }}>
                  CÓDIGO DA FAMÍLIA
                </Text>
                <Text selectable style={{ color: colors.text, fontSize: 32, fontWeight: fontWeight.bold, letterSpacing: 6, marginVertical: 2 }}>
                  {syncCode}
                </Text>
                <Text style={{ color: syncStatus === 'online' ? colors.success : (syncStatus === 'error' ? colors.error : colors.textSecondary), fontSize: fontSize.sm }}>
                  {syncStatusLabel}
                </Text>
              </View>
              <SettingRow icon="share-social-outline" label="Compartilhar código"   onPress={handleShareCode} colors={colors} />
              <SettingRow icon="log-out-outline"       label="Parar de sincronizar"  onPress={handleLeaveSync} colors={colors} />
            </>
          )}

          {/* Ajuda: criar banco de dados próprio + passo a passo */}
          <TouchableOpacity
            style={[rowStyles.row, { borderTopWidth: StyleSheet.hairlineWidth, borderTopColor: colors.divider, borderBottomWidth: 0 }]}
            onPress={() => setDbHelp(true)}
            activeOpacity={0.7}
          >
            <View style={[rowStyles.iconBg, { backgroundColor: colors.info + '22' }]}>
              <Ionicons name="server-outline" size={18} color={colors.info} />
            </View>
            <Text style={[rowStyles.label, { color: colors.text }]}>Criar banco de dados (passo a passo)</Text>
            <Ionicons name="chevron-forward" size={16} color={colors.textDisabled} />
          </TouchableOpacity>
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
            <>
              <SettingRow
                icon="time-outline"
                label="Horário do alerta"
                value={alertTime}
                onPress={openTimePicker}
                colors={colors}
              />
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
                <Text style={{ color: colors.textDisabled, fontSize: fontSize.xs, marginTop: spacing.sm }}>
                  As contas a vencer avisam neste horário. Ao alterar, todos os lembretes existentes são reagendados automaticamente.
                </Text>
              </View>
            </>
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

      {/* Modal de horário do alerta */}
      <Modal visible={timeModal} transparent animationType="slide" onRequestClose={() => setTimeModal(false)}>
        <View style={s.modalOverlay}>
          <View style={[s.modalSheet, { backgroundColor: colors.surface }]}>
            <Text style={s.modalTitle}>Horário do alerta</Text>
            <View style={s.timeRow}>
              {/* Hora */}
              <View style={s.timeCol}>
                <TouchableOpacity onPress={() => step(setTmpHour, tmpHour, 1, 23)} hitSlop={10}>
                  <Ionicons name="chevron-up" size={28} color={colors.primary} />
                </TouchableOpacity>
                <Text style={[s.timeNum, { color: colors.text }]}>{String(tmpHour).padStart(2, '0')}</Text>
                <TouchableOpacity onPress={() => step(setTmpHour, tmpHour, -1, 23)} hitSlop={10}>
                  <Ionicons name="chevron-down" size={28} color={colors.primary} />
                </TouchableOpacity>
                <Text style={[s.timeLbl, { color: colors.textSecondary }]}>hora</Text>
              </View>

              <Text style={[s.timeSep, { color: colors.text }]}>:</Text>

              {/* Minuto */}
              <View style={s.timeCol}>
                <TouchableOpacity onPress={() => step(setTmpMin, tmpMin, 5, 55)} hitSlop={10}>
                  <Ionicons name="chevron-up" size={28} color={colors.primary} />
                </TouchableOpacity>
                <Text style={[s.timeNum, { color: colors.text }]}>{String(tmpMin).padStart(2, '0')}</Text>
                <TouchableOpacity onPress={() => step(setTmpMin, tmpMin, -5, 55)} hitSlop={10}>
                  <Ionicons name="chevron-down" size={28} color={colors.primary} />
                </TouchableOpacity>
                <Text style={[s.timeLbl, { color: colors.textSecondary }]}>min</Text>
              </View>
            </View>
            <View style={{ flexDirection: 'row', gap: spacing.sm, marginTop: spacing.lg }}>
              <CustomButton title="Cancelar" variant="outline" onPress={() => setTimeModal(false)} style={{ flex: 1 }} />
              <CustomButton title="Salvar"   variant="primary" onPress={saveTime}                 style={{ flex: 1 }} />
            </View>
          </View>
        </View>
      </Modal>

      {/* Modal de entrar com código */}
      <Modal visible={joinModal} transparent animationType="slide" onRequestClose={() => setJoinModal(false)}>
        <View style={s.modalOverlay}>
          <View style={[s.modalSheet, { backgroundColor: colors.surface }]}>
            <Text style={s.modalTitle}>Entrar na família</Text>
            <Text style={{ color: colors.textSecondary, fontSize: fontSize.sm, marginBottom: spacing.md, textAlign: 'center' }}>
              Digite o código que a outra pessoa criou. Os dados deste aparelho serão substituídos pelos da família.
            </Text>
            <TextInput
              style={[s.input, { backgroundColor: colors.surfaceVariant, color: colors.text, textAlign: 'center', fontSize: 26, letterSpacing: 6, fontWeight: fontWeight.bold }]}
              value={joinCode}
              onChangeText={t => setJoinCode(t.toUpperCase())}
              placeholder="ABC123"
              placeholderTextColor={colors.textDisabled}
              autoCapitalize="characters"
              autoCorrect={false}
              maxLength={6}
            />
            <View style={{ flexDirection: 'row', gap: spacing.sm, marginTop: spacing.sm }}>
              <CustomButton title="Cancelar" variant="outline" onPress={() => setJoinModal(false)} style={{ flex: 1 }} />
              <CustomButton title="Entrar"   variant="primary" onPress={handleJoinFamily} loading={syncBusy} style={{ flex: 1 }} />
            </View>
          </View>
        </View>
      </Modal>

      {/* Modal: passo a passo do banco de dados */}
      <Modal visible={dbHelp} transparent animationType="slide" onRequestClose={() => setDbHelp(false)}>
        <View style={s.modalOverlay}>
          <ScrollView
            style={[s.modalSheet, { backgroundColor: colors.surface, maxHeight: '88%' }]}
            contentContainerStyle={{ padding: spacing.lg }}
            showsVerticalScrollIndicator={false}
          >
            <Text style={s.modalTitle}>☁️ Banco de dados (sincronização)</Text>

            <View style={{ backgroundColor: colors.success + '18', borderRadius: radius.md, padding: spacing.md, marginBottom: spacing.md }}>
              <Text style={{ color: colors.text, fontSize: fontSize.sm, lineHeight: 20 }}>
                <Text style={{ fontWeight: fontWeight.bold }}>Para o uso normal você NÃO precisa criar nada.</Text>{'\n'}
                O app já vem conectado a um banco de dados gratuito. Para compartilhar, basta um criar a família (gera um código) e o outro entrar com esse código.
              </Text>
            </View>

            <Text style={{ color: colors.textSecondary, fontSize: fontSize.sm, marginBottom: spacing.md, lineHeight: 20 }}>
              O passo a passo abaixo só é necessário se você quiser ter o seu <Text style={{ fontWeight: fontWeight.bold }}>próprio</Text> banco de dados separado (uso avançado — exige gerar um novo APK com as chaves):
            </Text>

            {dbSteps.map((step, i) => (
              <View key={i} style={{ flexDirection: 'row', gap: spacing.sm, marginBottom: spacing.sm }}>
                <View style={{ width: 24, height: 24, borderRadius: 12, backgroundColor: colors.primary, alignItems: 'center', justifyContent: 'center' }}>
                  <Text style={{ color: '#fff', fontWeight: fontWeight.bold, fontSize: fontSize.xs }}>{i + 1}</Text>
                </View>
                <Text style={{ flex: 1, color: colors.text, fontSize: fontSize.sm, lineHeight: 20 }}>{step}</Text>
              </View>
            ))}

            <CustomButton
              title="Abrir o site do Firebase"
              variant="primary"
              icon={<Ionicons name="open-outline" size={18} color="#fff" />}
              onPress={openFirebaseSite}
              style={{ marginTop: spacing.md }}
            />
            <CustomButton
              title="Fechar"
              variant="outline"
              onPress={() => setDbHelp(false)}
              style={{ marginTop: spacing.sm }}
            />
          </ScrollView>
        </View>
      </Modal>

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

    timeRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: spacing.md },
    timeCol: { alignItems: 'center', minWidth: 72 },
    timeNum: { fontSize: 44, fontWeight: fontWeight.bold, marginVertical: spacing.xs, fontVariant: ['tabular-nums'] },
    timeSep: { fontSize: 44, fontWeight: fontWeight.bold, marginBottom: 18 },
    timeLbl: { fontSize: fontSize.xs, marginTop: 2 },

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
