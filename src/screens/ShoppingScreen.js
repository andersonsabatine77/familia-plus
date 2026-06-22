import React, { useState, useMemo, useCallback } from 'react';
import {
  View, Text, ScrollView, StyleSheet, TouchableOpacity,
  Modal, TextInput, Alert, Share,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../context/ThemeContext';
import { useData } from '../context/DataContext';
import { MarketItem, HouseItem } from '../components/ShoppingItem';
import CustomButton from '../components/CustomButton';
import CurrencyField from '../components/CurrencyField';
import { formatCurrency, sumField } from '../utils/formatters';
import { buildMarketListMessage, sendWhatsApp } from '../utils/whatsapp';
import { spacing, radius, fontSize, fontWeight } from '../styles/spacing';
import { shoppingCategories } from '../styles/colors';

// ── Formulário de item de mercado ────────────────────────────────────────────
function MarketItemForm({ onSave, onClose, colors }) {
  const [name,     setName]     = useState('');
  const [qty,      setQty]      = useState('1');
  const [price,    setPrice]    = useState('');
  const [category, setCategory] = useState('other');
  const s = formStyles(colors);

  const handleSave = () => {
    if (!name.trim()) return Alert.alert('Atenção', 'Informe o nome do item.');
    onSave({
      name: name.trim(),
      quantity: parseInt(qty) || 1,
      estimatedPrice: Number(price) || 0,
      category,
    });
    onClose();
  };

  return (
    <View>
      <Text style={s.title}>🛒 Novo Item</Text>
      <Text style={s.label}>Nome *</Text>
      <TextInput style={s.input} value={name} onChangeText={setName} placeholder="Ex.: Leite" placeholderTextColor={colors.textDisabled} />
      <Text style={s.label}>Quantidade</Text>
      <TextInput style={s.input} value={qty} onChangeText={setQty} keyboardType="number-pad" placeholder="1" placeholderTextColor={colors.textDisabled} />
      <Text style={s.label}>Preço estimado (R$)</Text>
      <CurrencyField value={price} onChangeValue={setPrice} />
      <Text style={s.label}>Categoria</Text>
      <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginBottom: spacing.md }}>
        {shoppingCategories.map(cat => (
          <TouchableOpacity
            key={cat.key}
            style={[s.chip, category === cat.key && { backgroundColor: colors.primary }]}
            onPress={() => setCategory(cat.key)}
          >
            <Ionicons name={cat.icon} size={14} color={category === cat.key ? '#fff' : colors.textSecondary} />
            <Text style={[s.chipText, category === cat.key && { color: '#fff' }]}>{cat.label}</Text>
          </TouchableOpacity>
        ))}
      </ScrollView>
      <View style={{ flexDirection: 'row', gap: spacing.sm }}>
        <CustomButton title="Cancelar" variant="outline" onPress={onClose} style={{ flex: 1 }} />
        <CustomButton title="Adicionar" variant="primary" onPress={handleSave} style={{ flex: 1 }} />
      </View>
    </View>
  );
}

// ── Formulário de item para casa ─────────────────────────────────────────────
function HouseItemForm({ onSave, onClose, colors }) {
  const [name,     setName]     = useState('');
  const [price,    setPrice]    = useState('');
  const [priority, setPriority] = useState('medium');
  const s = formStyles(colors);

  const priorities = [
    { key: 'high',   label: '🔴 Alta' },
    { key: 'medium', label: '🟡 Média' },
    { key: 'low',    label: '🟢 Baixa' },
  ];

  const handleSave = () => {
    if (!name.trim()) return Alert.alert('Atenção', 'Informe o nome do item.');
    onSave({
      name: name.trim(),
      estimatedPrice: Number(price) || 0,
      priority,
      status: 'planned',
    });
    onClose();
  };

  return (
    <View>
      <Text style={s.title}>🏠 Item para Casa</Text>
      <Text style={s.label}>Item *</Text>
      <TextInput style={s.input} value={name} onChangeText={setName} placeholder="Ex.: Cadeira de escritório" placeholderTextColor={colors.textDisabled} />
      <Text style={s.label}>Preço estimado (R$)</Text>
      <CurrencyField value={price} onChangeValue={setPrice} />
      <Text style={s.label}>Prioridade</Text>
      <View style={{ flexDirection: 'row', gap: spacing.sm, marginBottom: spacing.md }}>
        {priorities.map(p => (
          <TouchableOpacity
            key={p.key}
            style={[s.chip, { flex: 1 }, priority === p.key && { backgroundColor: colors.primary }]}
            onPress={() => setPriority(p.key)}
          >
            <Text style={[s.chipText, { textAlign: 'center' }, priority === p.key && { color: '#fff' }]}>{p.label}</Text>
          </TouchableOpacity>
        ))}
      </View>
      <View style={{ flexDirection: 'row', gap: spacing.sm }}>
        <CustomButton title="Cancelar" variant="outline" onPress={onClose} style={{ flex: 1 }} />
        <CustomButton title="Adicionar" variant="primary" onPress={handleSave} style={{ flex: 1 }} />
      </View>
    </View>
  );
}

// ── Tela principal ────────────────────────────────────────────────────────────
export default function ShoppingScreen() {
  const { colors } = useTheme();
  const {
    shopping,
    addMarketItem, toggleMarketItem, deleteMarketItem, clearCheckedMarketItems,
    addHouseItem, updateHouseItem, deleteHouseItem,
    family,
    defaultMarketList, saveDefaultMarketList, loadDefaultMarketList,
  } = useData();

  const [tab,      setTab]      = useState('market'); // market | house
  const [modal,    setModal]    = useState(null);     // null | 'market' | 'house'
  const [filterCat,setFilterCat]= useState('all');

  const s = buildStyles(colors);

  const { marketList, houseList } = shopping;

  // Estatísticas da lista de mercado
  const marketStats = useMemo(() => {
    const checked   = marketList.filter(i => i.checked).length;
    const total     = marketList.length;
    const totalCost = marketList.reduce((s, i) => s + (i.estimatedPrice || 0) * (i.quantity || 1), 0);
    const remaining = marketList
      .filter(i => !i.checked)
      .reduce((s, i) => s + (i.estimatedPrice || 0) * (i.quantity || 1), 0);
    return { checked, total, totalCost, remaining };
  }, [marketList]);

  // Filtra por categoria
  const filteredMarket = useMemo(() =>
    filterCat === 'all' ? marketList : marketList.filter(i => i.category === filterCat),
    [marketList, filterCat]
  );

  // Compartilha lista no WhatsApp
  const shareWhatsApp = useCallback(async () => {
    const message = buildMarketListMessage(marketList);
    const phone = family?.[0]?.phone;
    if (phone) {
      await sendWhatsApp(phone, message);
    } else {
      await Share.share({ message });
    }
  }, [marketList, family]);

  return (
    <SafeAreaView style={[s.safe, { backgroundColor: colors.background }]} edges={['top']}>
      {/* Header */}
      <View style={s.header}>
        <Text style={s.headerTitle}>🛍️ Compras</Text>
        <TouchableOpacity style={s.addBtn} onPress={() => setModal(tab)}>
          <Ionicons name="add" size={22} color="#fff" />
        </TouchableOpacity>
      </View>

      {/* Abas */}
      <View style={s.tabs}>
        <TouchableOpacity style={[s.tab, tab === 'market' && s.tabActive]} onPress={() => setTab('market')}>
          <Ionicons name="cart" size={16} color={tab === 'market' ? '#fff' : colors.textSecondary} />
          <Text style={[s.tabText, tab === 'market' && s.tabTextActive]}>Mercado</Text>
        </TouchableOpacity>
        <TouchableOpacity style={[s.tab, tab === 'house' && s.tabActive]} onPress={() => setTab('house')}>
          <Ionicons name="home" size={16} color={tab === 'house' ? '#fff' : colors.textSecondary} />
          <Text style={[s.tabText, tab === 'house' && s.tabTextActive]}>Para Casa</Text>
        </TouchableOpacity>
      </View>

      {/* ── Lista de Mercado ── */}
      {tab === 'market' && (
        <>
          {/* Resumo */}
          <View style={s.statsBar}>
            <View style={s.stat}>
              <Text style={s.statValue}>{marketStats.checked}/{marketStats.total}</Text>
              <Text style={s.statLabel}>Comprados</Text>
            </View>
            <View style={s.statDivider} />
            <View style={s.stat}>
              <Text style={s.statValue}>{formatCurrency(marketStats.remaining)}</Text>
              <Text style={s.statLabel}>Restante</Text>
            </View>
            <View style={s.statDivider} />
            <View style={s.stat}>
              <Text style={s.statValue}>{formatCurrency(marketStats.totalCost)}</Text>
              <Text style={s.statLabel}>Total</Text>
            </View>
          </View>

          {/* Barra de progresso */}
          {marketStats.total > 0 && (
            <View style={s.progressBg}>
              <View
                style={[
                  s.progressFill,
                  {
                    width: `${(marketStats.checked / marketStats.total) * 100}%`,
                    backgroundColor: colors.success,
                  },
                ]}
              />
            </View>
          )}

          {/* Ações */}
          <View style={s.actionsRow}>
            <ScrollView horizontal showsHorizontalScrollIndicator={false}>
              {[{ key: 'all', label: 'Todos', icon: 'apps' }, ...shoppingCategories].map(cat => (
                <TouchableOpacity
                  key={cat.key}
                  style={[s.filterChip, filterCat === cat.key && { backgroundColor: colors.primary }]}
                  onPress={() => setFilterCat(cat.key)}
                >
                  <Ionicons name={cat.icon} size={12} color={filterCat === cat.key ? '#fff' : colors.textSecondary} />
                  <Text style={[s.filterText, filterCat === cat.key && { color: '#fff' }]}>{cat.label}</Text>
                </TouchableOpacity>
              ))}
            </ScrollView>
          </View>

          <ScrollView contentContainerStyle={{ padding: spacing.md, paddingBottom: spacing.xxl }}>
            {filteredMarket.length === 0 ? (
              <View style={s.emptyState}>
                <Ionicons name="cart-outline" size={60} color={colors.textDisabled} />
                <Text style={s.emptyTitle}>Lista vazia</Text>
                <CustomButton title="Adicionar Item" variant="primary" onPress={() => setModal('market')} style={{ marginTop: spacing.md }} />
              </View>
            ) : (
              filteredMarket.map(item => (
                <MarketItem
                  key={item.id}
                  item={item}
                  onToggle={toggleMarketItem}
                  onDelete={deleteMarketItem}
                />
              ))
            )}

            {/* Botões de ação */}
            <View style={{ gap: spacing.sm, marginTop: spacing.md }}>
              {/* Lista padrão */}
              <View style={{ flexDirection: 'row', gap: spacing.sm }}>
                <CustomButton
                  title="Carregar Lista Padrão"
                  variant="outline"
                  icon={<Ionicons name="refresh" size={16} color={colors.primary} />}
                  style={{ flex: 1 }}
                  onPress={() => {
                    if (defaultMarketList.length === 0) {
                      return Alert.alert('Lista padrão vazia', 'Primeiro adicione itens e salve como lista padrão usando o botão "Definir como Padrão".');
                    }
                    Alert.alert(
                      'Carregar Lista Padrão',
                      `Isso substituirá a lista atual por ${defaultMarketList.length} itens padrão. Continuar?`,
                      [
                        { text: 'Cancelar', style: 'cancel' },
                        { text: 'Carregar', onPress: loadDefaultMarketList },
                      ]
                    );
                  }}
                />
                <CustomButton
                  title="Definir como Padrão"
                  variant="outline"
                  icon={<Ionicons name="bookmark" size={16} color={colors.accent} />}
                  style={{ flex: 1 }}
                  onPress={() => {
                    if (marketList.length === 0) return Alert.alert('Atenção', 'Adicione itens à lista antes de salvar como padrão.');
                    Alert.alert(
                      'Salvar Lista Padrão',
                      `Salvar os ${marketList.length} itens atuais como lista padrão mensal?`,
                      [
                        { text: 'Cancelar', style: 'cancel' },
                        { text: 'Salvar', onPress: () => saveDefaultMarketList(marketList) },
                      ]
                    );
                  }}
                />
              </View>

              {marketList.length > 0 && (
                <CustomButton
                  title="Compartilhar via WhatsApp"
                  variant="secondary"
                  icon={<Ionicons name="logo-whatsapp" size={18} color="#fff" />}
                  onPress={shareWhatsApp}
                />
              )}
              {marketStats.checked > 0 && (
                <CustomButton
                  title="Limpar itens comprados"
                  variant="outline"
                  onPress={() => Alert.alert('Limpar', 'Remover todos os itens marcados?', [
                    { text: 'Cancelar', style: 'cancel' },
                    { text: 'Limpar', onPress: clearCheckedMarketItems },
                  ])}
                />
              )}
            </View>
          </ScrollView>
        </>
      )}

      {/* ── Lista para Casa ── */}
      {tab === 'house' && (
        <ScrollView contentContainerStyle={{ padding: spacing.md, paddingBottom: spacing.xxl }}>
          {/* Resumo por prioridade */}
          {houseList.length > 0 && (
            <View style={s.houseSummary}>
              {['high', 'medium', 'low'].map(p => {
                const count = houseList.filter(i => i.priority === p).length;
                const colors_ = { high: colors.error, medium: colors.warning, low: colors.success };
                const labels  = { high: 'Alta', medium: 'Média', low: 'Baixa' };
                return count > 0 ? (
                  <View key={p} style={[s.priorityStat, { backgroundColor: colors_[p] + '22' }]}>
                    <Text style={[s.priorityCount, { color: colors_[p] }]}>{count}</Text>
                    <Text style={[s.priorityLabel, { color: colors_[p] }]}>{labels[p]}</Text>
                  </View>
                ) : null;
              })}
              <View style={[s.priorityStat, { backgroundColor: colors.primary + '22', flex: 1.5 }]}>
                <Text style={[s.priorityCount, { color: colors.primary }]}>
                  {formatCurrency(sumField(houseList, 'estimatedPrice'))}
                </Text>
                <Text style={[s.priorityLabel, { color: colors.primary }]}>Total estimado</Text>
              </View>
            </View>
          )}

          <CustomButton
            title="Adicionar Item"
            variant="primary"
            icon={<Ionicons name="add" size={18} color="#fff" />}
            onPress={() => setModal('house')}
            style={{ marginBottom: spacing.md }}
          />

          {houseList.length === 0 ? (
            <View style={s.emptyState}>
              <Ionicons name="home-outline" size={60} color={colors.textDisabled} />
              <Text style={s.emptyTitle}>Nenhum item planejado</Text>
            </View>
          ) : (
            houseList
              .sort((a, b) => {
                const order = { high: 0, medium: 1, low: 2 };
                return (order[a.priority] || 1) - (order[b.priority] || 1);
              })
              .map(item => (
                <HouseItem
                  key={item.id}
                  item={item}
                  onUpdateStatus={updateHouseItem}
                  onDelete={deleteHouseItem}
                />
              ))
          )}
        </ScrollView>
      )}

      {/* Modal de adição */}
      <Modal visible={!!modal} transparent animationType="slide" onRequestClose={() => setModal(null)}>
        <View style={s.modalOverlay}>
          <ScrollView
            style={[s.modalSheet, { backgroundColor: colors.surface }]}
            contentContainerStyle={{ padding: spacing.lg }}
            keyboardShouldPersistTaps="handled"
          >
            {modal === 'market' && (
              <MarketItemForm colors={colors} onClose={() => setModal(null)} onSave={addMarketItem} />
            )}
            {modal === 'house' && (
              <HouseItemForm colors={colors} onClose={() => setModal(null)} onSave={addHouseItem} />
            )}
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
    tabs: {
      flexDirection: 'row',
      marginHorizontal: spacing.md,
      backgroundColor: colors.surfaceVariant,
      borderRadius: radius.md,
      padding: 4,
      marginBottom: spacing.xs,
    },
    tab: { flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6, paddingVertical: spacing.xs, borderRadius: radius.sm },
    tabActive: { backgroundColor: colors.primary },
    tabText: { fontSize: fontSize.sm, color: colors.textSecondary },
    tabTextActive: { color: '#fff', fontWeight: fontWeight.semibold },

    statsBar: {
      flexDirection: 'row',
      marginHorizontal: spacing.md,
      backgroundColor: colors.card,
      borderRadius: radius.md,
      padding: spacing.sm,
      marginBottom: spacing.xs,
    },
    stat: { flex: 1, alignItems: 'center' },
    statValue: { fontSize: fontSize.md, fontWeight: fontWeight.bold, color: colors.text },
    statLabel: { fontSize: fontSize.xs, color: colors.textSecondary },
    statDivider: { width: 1, backgroundColor: colors.border },

    progressBg: {
      height: 6,
      backgroundColor: colors.border,
      borderRadius: radius.full,
      marginHorizontal: spacing.md,
      marginBottom: spacing.xs,
      overflow: 'hidden',
    },
    progressFill: { height: '100%', borderRadius: radius.full },

    actionsRow: { marginHorizontal: spacing.md, marginBottom: spacing.xs },
    filterChip: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 4,
      backgroundColor: colors.surfaceVariant,
      borderRadius: radius.full,
      paddingHorizontal: spacing.sm,
      paddingVertical: 5,
      marginRight: spacing.xs,
    },
    filterText: { fontSize: fontSize.xs, color: colors.textSecondary },

    houseSummary: { flexDirection: 'row', gap: spacing.xs, marginBottom: spacing.md, flexWrap: 'wrap' },
    priorityStat: { flex: 1, borderRadius: radius.md, padding: spacing.sm, alignItems: 'center' },
    priorityCount: { fontSize: fontSize.lg, fontWeight: fontWeight.bold },
    priorityLabel: { fontSize: fontSize.xs },

    emptyState: { alignItems: 'center', marginTop: spacing.xxl },
    emptyTitle: { fontSize: fontSize.xl, fontWeight: fontWeight.bold, color: colors.textSecondary, marginTop: spacing.md },

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
