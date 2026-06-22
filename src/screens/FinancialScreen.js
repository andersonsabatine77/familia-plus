import React, { useState, useMemo, useCallback } from 'react';
import {
  View, Text, ScrollView, StyleSheet, TouchableOpacity,
  Modal, TextInput, Alert, Dimensions,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';

import { useTheme } from '../context/ThemeContext';
import { useData } from '../context/DataContext';
import { FinancialCard, SummaryCard } from '../components/FinancialCard';
import CustomButton from '../components/CustomButton';
import {
  formatCurrency, formatMonthYear, filterByMonth, sumField,
  groupBy, generateId, parseDate, isOverdue,
} from '../utils/formatters';
import { spacing, radius, fontSize, fontWeight, elevation } from '../styles/spacing';
import { expenseCategories } from '../styles/colors';


// ── Gráfico de pizza simples (pure RN, sem SVG) ───────────────────────────────
function SimplePieChart({ data, colors: themeColors }) {
  if (!data || data.length === 0) return null;
  const total = data.reduce((s, d) => s + d.amount, 0);
  if (total === 0) return null;

  let cumulative = 0;
  return (
    <View>
      {/* Barras horizontais empilhadas como legenda visual */}
      <View style={{ flexDirection: 'row', height: 20, borderRadius: 10, overflow: 'hidden', marginBottom: spacing.sm }}>
        {data.map((d, i) => (
          <View
            key={i}
            style={{ flex: d.amount / total, backgroundColor: d.color, minWidth: 4 }}
          />
        ))}
      </View>
      {/* Legenda */}
      <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: spacing.xs }}>
        {data.map((d, i) => (
          <View key={i} style={{ flexDirection: 'row', alignItems: 'center', gap: 4, minWidth: '45%' }}>
            <View style={{ width: 10, height: 10, borderRadius: 5, backgroundColor: d.color }} />
            <Text style={{ fontSize: 11, color: themeColors.textSecondary }} numberOfLines={1}>
              {d.name}: {formatCurrency(d.amount)}
            </Text>
          </View>
        ))}
      </View>
    </View>
  );
}

// ── Gráfico de evolução patrimonial (pure RN) ────────────────────────────────
function PatrimonyChart({ finances, colors: themeColors }) {
  const CHART_H = 160;
  const CHART_W = Dimensions.get('window').width - spacing.md * 4 - 2;

  const months = useMemo(() => {
    const result = [];
    const now = new Date();
    for (let i = 5; i >= 0; i--) {
      const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
      const y = d.getFullYear();
      const m = d.getMonth();
      const inc = finances.incomes
        .filter(x => { const dt = parseDate(x.date); return dt && dt.getFullYear() === y && dt.getMonth() === m; })
        .reduce((s, x) => s + x.amount, 0);
      const exp = finances.expenses
        .filter(x => { const dt = parseDate(x.date); return dt && dt.getFullYear() === y && dt.getMonth() === m; })
        .reduce((s, x) => s + x.amount, 0);
      result.push({ label: d.toLocaleString('pt-BR', { month: 'short' }), inc, exp, pat: inc - exp });
    }
    let acc = 0;
    return result.map(r => { acc += r.pat; return { ...r, accPat: acc }; });
  }, [finances]);

  const allVals = months.flatMap(m => [m.inc, m.exp, m.accPat]);
  const minVal  = Math.min(...allVals, 0);
  const maxVal  = Math.max(...allVals, 1);
  const range   = maxVal - minVal || 1;

  const toY = (val) => CHART_H - ((val - minVal) / range) * (CHART_H - 16) - 8;
  const toX = (i)   => (i / (months.length - 1)) * (CHART_W - 24) + 12;

  // Gera segmentos de linha entre pontos consecutivos
  const lineSegments = (getter, color) =>
    months.slice(0, -1).map((_, i) => {
      const x1 = toX(i);   const y1 = toY(getter(months[i]));
      const x2 = toX(i+1); const y2 = toY(getter(months[i+1]));
      const len = Math.sqrt((x2-x1)**2 + (y2-y1)**2);
      const angle = Math.atan2(y2-y1, x2-x1) * 180 / Math.PI;
      return (
        <View key={i} style={{
          position: 'absolute',
          left: x1, top: y1 - 1.5,
          width: len, height: 3,
          backgroundColor: color,
          borderRadius: 2,
          transformOrigin: 'left center',
          transform: [{ rotate: `${angle}deg` }],
        }} />
      );
    });

  // Pontos no final de cada linha
  const dots = (getter, color) =>
    months.map((m, i) => (
      <View key={i} style={{
        position: 'absolute',
        left: toX(i) - 4, top: toY(getter(m)) - 4,
        width: 8, height: 8,
        borderRadius: 4,
        backgroundColor: color,
        borderWidth: 2,
        borderColor: themeColors.card,
      }} />
    ));

  return (
    <View>
      {/* Área do gráfico */}
      <View style={{ height: CHART_H, width: CHART_W, position: 'relative', marginBottom: spacing.xs }}>
        {/* Linhas de grade horizontais */}
        {[0, 0.25, 0.5, 0.75, 1].map(p => (
          <View key={p} style={{
            position: 'absolute',
            left: 0, right: 0,
            top: CHART_H - p * (CHART_H - 16) - 8,
            height: StyleSheet.hairlineWidth,
            backgroundColor: themeColors.divider,
          }} />
        ))}

        {/* Linhas das 3 séries */}
        {lineSegments(m => m.inc,    themeColors.success)}
        {lineSegments(m => m.exp,    themeColors.error)}
        {lineSegments(m => m.accPat, themeColors.primary)}

        {/* Pontos */}
        {dots(m => m.inc,    themeColors.success)}
        {dots(m => m.exp,    themeColors.error)}
        {dots(m => m.accPat, themeColors.primary)}
      </View>

      {/* Eixo X */}
      <View style={{ flexDirection: 'row', paddingHorizontal: 12 }}>
        {months.map((m, i) => (
          <Text key={i} style={{ flex: 1, fontSize: 9, textAlign: 'center', color: themeColors.textSecondary }}>{m.label}</Text>
        ))}
      </View>

      {/* Legenda */}
      <View style={{ flexDirection: 'row', justifyContent: 'center', gap: spacing.md, marginTop: spacing.sm }}>
        {[
          { color: themeColors.success, label: 'Receitas' },
          { color: themeColors.error,   label: 'Despesas' },
          { color: themeColors.primary, label: 'Patrimônio' },
        ].map(l => (
          <View key={l.label} style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}>
            <View style={{ width: 12, height: 3, borderRadius: 2, backgroundColor: l.color }} />
            <Text style={{ fontSize: 10, color: themeColors.textSecondary }}>{l.label}</Text>
          </View>
        ))}
      </View>

      {/* Resumo do último mês */}
      {months.length > 0 && (
        <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginTop: spacing.sm, padding: spacing.sm, backgroundColor: themeColors.surfaceVariant, borderRadius: 8 }}>
          <Text style={{ fontSize: 10, color: themeColors.success }}>+{formatCurrency(months[months.length-1].inc)}</Text>
          <Text style={{ fontSize: 10, color: themeColors.error }}>-{formatCurrency(months[months.length-1].exp)}</Text>
          <Text style={{ fontSize: 10, color: themeColors.primary, fontWeight: 'bold' }}>
            {months[months.length-1].accPat >= 0 ? '+' : ''}{formatCurrency(months[months.length-1].accPat)}
          </Text>
        </View>
      )}
    </View>
  );
}

// ── Formulário reutilizável de lançamento ────────────────────────────────────
function EntryForm({ type, initialData, onSave, onClose, colors }) {
  const isIncome  = type === 'income';
  const isEdit    = !!initialData;
  const [description, setDescription] = useState(initialData?.description ?? '');
  const [amount,      setAmount]      = useState(initialData?.amount ? String(initialData.amount) : '');
  const [date,        setDate]        = useState(initialData?.date ? initialData.date.slice(0, 10) : new Date().toISOString().slice(0, 10));
  const [dueDate,     setDueDate]     = useState(initialData?.dueDate ? initialData.dueDate.slice(0, 10) : '');
  const [category,    setCategory]    = useState(initialData?.category ?? 'other');
  const [recurring,   setRecurring]   = useState(initialData?.recurring ?? false);
  const [incomeType,  setIncomeType]  = useState(initialData?.type ?? 'salary');

  const s = formStyles(colors);

  const handleSave = () => {
    if (!description.trim()) return Alert.alert('Atenção', 'Informe a descrição.');
    const parsed = parseFloat(String(amount).replace(',', '.'));
    if (isNaN(parsed) || parsed <= 0) return Alert.alert('Atenção', 'Informe um valor válido.');

    onSave({
      description: description.trim(),
      amount: parsed,
      date: date || new Date().toISOString(),
      ...(isIncome
        ? { type: incomeType, recurring }
        : { type: initialData?.type ?? 'dynamic', category, dueDate: dueDate || null, recurring, paid: initialData?.paid ?? false }
      ),
    });
    onClose();
  };

  return (
    <View style={s.form}>
      <Text style={s.title}>
        {isEdit ? '✏️ Editar' : (isIncome ? '➕ Nova Receita' : '➖ Nova Despesa')}
      </Text>

      <Text style={s.label}>Descrição *</Text>
      <TextInput
        style={s.input}
        value={description}
        onChangeText={setDescription}
        placeholder="Ex.: Salário, Aluguel..."
        placeholderTextColor={colors.textDisabled}
      />

      <Text style={s.label}>Valor (R$) *</Text>
      <TextInput
        style={s.input}
        value={amount}
        onChangeText={setAmount}
        placeholder="0,00"
        keyboardType="decimal-pad"
        placeholderTextColor={colors.textDisabled}
      />

      <Text style={s.label}>Data</Text>
      <TextInput
        style={s.input}
        value={date}
        onChangeText={setDate}
        placeholder="AAAA-MM-DD"
        placeholderTextColor={colors.textDisabled}
      />

      {!isIncome && (
        <>
          <Text style={s.label}>Vencimento</Text>
          <TextInput
            style={s.input}
            value={dueDate}
            onChangeText={setDueDate}
            placeholder="AAAA-MM-DD"
            placeholderTextColor={colors.textDisabled}
          />

          <Text style={s.label}>Categoria</Text>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginBottom: spacing.md }}>
            {expenseCategories.map(cat => (
              <TouchableOpacity
                key={cat.key}
                style={[s.catChip, category === cat.key && { backgroundColor: colors.primary }]}
                onPress={() => setCategory(cat.key)}
              >
                <Ionicons name={cat.icon} size={14} color={category === cat.key ? '#fff' : colors.textSecondary} />
                <Text style={[s.catText, category === cat.key && { color: '#fff' }]}>{cat.label}</Text>
              </TouchableOpacity>
            ))}
          </ScrollView>
        </>
      )}

      <TouchableOpacity
        style={s.toggle}
        onPress={() => setRecurring(r => !r)}
      >
        <Ionicons
          name={recurring ? 'checkbox' : 'square-outline'}
          size={20}
          color={colors.primary}
        />
        <Text style={s.toggleText}>Recorrente (mensal)</Text>
      </TouchableOpacity>

      <View style={s.buttons}>
        <CustomButton title="Cancelar" variant="outline" onPress={onClose} style={{ flex: 1 }} />
        <CustomButton title="Salvar"   variant="primary" onPress={handleSave} style={{ flex: 1 }} />
      </View>
    </View>
  );
}

// ── Tela principal ────────────────────────────────────────────────────────────
export default function FinancialScreen() {
  const { colors }  = useTheme();
  const {
    finances, addIncome, updateIncome, addExpense, updateExpense, deleteIncome, deleteExpense, toggleExpensePaid,
  } = useData();

  const [now,         setNow]         = useState(new Date());
  const [tab,         setTab]         = useState('overview'); // overview | incomes | expenses | patrimony
  const [modalType,   setModalType]   = useState(null);       // null | 'income' | 'expense'
  const [editItem,    setEditItem]    = useState(null);        // item sendo editado
  const [filterCat,   setFilterCat]   = useState('all');

  const openEdit = useCallback((item, type) => {
    setEditItem({ item, type });
    setModalType(type);
  }, []);

  const handleSave = useCallback(async (data) => {
    if (editItem) {
      if (editItem.type === 'income') await updateIncome(editItem.item.id, data);
      else await updateExpense(editItem.item.id, data);
      setEditItem(null);
    } else {
      if (modalType === 'income') await addIncome(data);
      else await addExpense(data);
    }
  }, [editItem, modalType, addIncome, addExpense, updateIncome, updateExpense]);

  const s = buildStyles(colors);

  // Filtra por mês/ano atual
  const monthIncomes  = useMemo(() =>
    filterByMonth(finances.incomes,  'date', now.getFullYear(), now.getMonth()),
    [finances.incomes, now]
  );
  const monthExpenses = useMemo(() =>
    filterByMonth(finances.expenses, 'date', now.getFullYear(), now.getMonth()),
    [finances.expenses, now]
  );

  const totalIncome  = useMemo(() => sumField(monthIncomes,  'amount'), [monthIncomes]);
  const totalExpense = useMemo(() => sumField(monthExpenses, 'amount'), [monthExpenses]);
  const balance      = totalIncome - totalExpense;

  // Gastos por categoria para gráfico de pizza
  const pieData = useMemo(() => {
    const byCategory = groupBy(monthExpenses, 'category');
    return expenseCategories
      .map(cat => ({
        name: cat.label,
        amount: sumField(byCategory[cat.key] || [], 'amount'),
        color: colors[cat.colorKey],
        legendFontColor: colors.text,
        legendFontSize: 12,
      }))
      .filter(d => d.amount > 0);
  }, [monthExpenses, colors]);

  // Sugestão de economia
  const biggestCat = useMemo(() => {
    if (!pieData.length) return null;
    return pieData.reduce((a, b) => a.amount > b.amount ? a : b);
  }, [pieData]);

  // Navegação de mês
  const prevMonth = () => setNow(d => new Date(d.getFullYear(), d.getMonth() - 1, 1));
  const nextMonth = () => setNow(d => new Date(d.getFullYear(), d.getMonth() + 1, 1));

  // Despesas filtradas por categoria
  const filteredExpenses = useMemo(() =>
    filterCat === 'all'
      ? monthExpenses
      : monthExpenses.filter(e => e.category === filterCat),
    [monthExpenses, filterCat]
  );

  // Alertas de contas vencidas
  const overdueCount = useMemo(() =>
    finances.expenses.filter(e => e.dueDate && !e.paid && isOverdue(e.dueDate)).length,
    [finances.expenses]
  );

  return (
    <SafeAreaView style={[s.safe, { backgroundColor: colors.background }]} edges={['top']}>
      {/* Header */}
      <View style={s.header}>
        <Text style={s.headerTitle}>💰 Finanças</Text>
        <View style={{ flexDirection: 'row', gap: spacing.sm }}>
          <TouchableOpacity style={s.addBtn} onPress={() => setModalType('income')}>
            <Ionicons name="arrow-down-circle" size={20} color={colors.success} />
          </TouchableOpacity>
          <TouchableOpacity style={s.addBtn} onPress={() => setModalType('expense')}>
            <Ionicons name="arrow-up-circle" size={20} color={colors.error} />
          </TouchableOpacity>
        </View>
      </View>

      {/* Alerta de contas vencidas */}
      {overdueCount > 0 && (
        <View style={[s.alert, { backgroundColor: colors.error + '22', borderColor: colors.error }]}>
          <Ionicons name="warning" size={16} color={colors.error} />
          <Text style={[s.alertText, { color: colors.error }]}>
            {overdueCount} conta{overdueCount > 1 ? 's' : ''} vencida{overdueCount > 1 ? 's' : ''}!
          </Text>
        </View>
      )}

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

      {/* Abas internas */}
      <View style={s.tabs}>
        {[
          { key: 'overview',   label: 'Visão Geral' },
          { key: 'patrimony',  label: 'Patrimônio' },
          { key: 'incomes',    label: 'Receitas' },
          { key: 'expenses',   label: 'Despesas' },
        ].map(t => (
          <TouchableOpacity
            key={t.key}
            style={[s.tabItem, tab === t.key && s.tabActive]}
            onPress={() => setTab(t.key)}
          >
            <Text style={[s.tabText, tab === t.key && s.tabTextActive]} numberOfLines={1}>{t.label}</Text>
          </TouchableOpacity>
        ))}
      </View>

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ padding: spacing.md, paddingBottom: spacing.xxl }}
      >
        {/* ── VISÃO GERAL ── */}
        {tab === 'overview' && (
          <>
            {/* Cards de resumo */}
            <View style={s.summaryRow}>
              <SummaryCard title="Receitas"  value={totalIncome}  icon="arrow-down-circle" color={colors.success} />
              <SummaryCard title="Despesas"  value={totalExpense} icon="arrow-up-circle"   color={colors.error}   />
            </View>
            <View style={[s.balanceCard, { backgroundColor: balance >= 0 ? colors.success + '22' : colors.error + '22' }]}>
              <Text style={s.balanceLabel}>Saldo disponível</Text>
              <Text style={[s.balanceValue, { color: balance >= 0 ? colors.success : colors.error }]}>
                {formatCurrency(balance)}
              </Text>
            </View>

            {/* Gráfico de pizza por categoria */}
            {pieData.length > 0 && (
              <View style={s.chartCard}>
                <Text style={s.chartTitle}>Gastos por Categoria</Text>
                <SimplePieChart data={pieData} colors={colors} />
              </View>
            )}

            {/* Sugestão de economia */}
            {biggestCat && (
              <View style={[s.tipCard, { backgroundColor: colors.accent + '22', borderColor: colors.accent }]}>
                <Ionicons name="bulb" size={20} color={colors.accent} />
                <Text style={[s.tipText, { color: colors.text }]}>
                  <Text style={{ fontWeight: fontWeight.bold }}>Dica: </Text>
                  Seu maior gasto é em {biggestCat.name} ({formatCurrency(biggestCat.amount)}).
                  Revise esses gastos para economizar!
                </Text>
              </View>
            )}

            {/* Últimas movimentações */}
            <Text style={s.sectionTitle}>Últimas Movimentações</Text>
            {[...monthIncomes.slice(-3), ...monthExpenses.slice(-3)]
              .sort((a, b) => parseDate(b.date) - parseDate(a.date))
              .map(item => {
                const isInc = !!monthIncomes.find(i => i.id === item.id);
                return (
                  <FinancialCard
                    key={item.id}
                    item={item}
                    type={isInc ? 'income' : 'expense'}
                    onEdit={() => openEdit(item, isInc ? 'income' : 'expense')}
                    onDelete={isInc ? () => deleteIncome(item.id) : () => deleteExpense(item.id)}
                    onTogglePaid={!isInc ? () => toggleExpensePaid(item.id) : null}
                  />
                );
              })
            }
          </>
        )}

        {/* ── PATRIMÔNIO ── */}
        {tab === 'patrimony' && (
          <>
            <View style={s.chartCard}>
              <Text style={s.chartTitle}>📈 Evolução Patrimonial — Últimos 6 Meses</Text>
              <PatrimonyChart finances={finances} colors={colors} />
            </View>
            <View style={[s.chartCard, { backgroundColor: colors.primary + '11' }]}>
              <Text style={[s.chartTitle, { color: colors.primary }]}>Como funciona</Text>
              <Text style={{ fontSize: 12, color: colors.textSecondary, lineHeight: 18 }}>
                {'• Barras verdes = receitas do mês\n• Barras vermelhas = despesas do mês\n• Linha azul = patrimônio acumulado (receitas − despesas)\nO patrimônio é calculado automaticamente com base em todos os lançamentos cadastrados.'}
              </Text>
            </View>
          </>
        )}

        {/* ── RECEITAS ── */}
        {tab === 'incomes' && (
          <>
            <CustomButton
              title="Nova Receita"
              variant="primary"
              icon={<Ionicons name="add" size={18} color="#fff" />}
              onPress={() => { setEditItem(null); setModalType('income'); }}
              style={{ marginBottom: spacing.md }}
            />
            {monthIncomes.length === 0 ? (
              <Text style={s.empty}>Nenhuma receita este mês.</Text>
            ) : (
              monthIncomes.map(item => (
                <FinancialCard
                  key={item.id}
                  item={item}
                  type="income"
                  onEdit={() => openEdit(item, 'income')}
                  onDelete={() => deleteIncome(item.id)}
                />
              ))
            )}
          </>
        )}

        {/* ── DESPESAS ── */}
        {tab === 'expenses' && (
          <>
            <CustomButton
              title="Nova Despesa"
              variant="danger"
              icon={<Ionicons name="add" size={18} color="#fff" />}
              onPress={() => { setEditItem(null); setModalType('expense'); }}
              style={{ marginBottom: spacing.md }}
            />

            {/* Filtro por categoria */}
            <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginBottom: spacing.md }}>
              {[{ key: 'all', label: 'Todos', icon: 'apps' }, ...expenseCategories].map(cat => (
                <TouchableOpacity
                  key={cat.key}
                  style={[s.filterChip, filterCat === cat.key && { backgroundColor: colors.primary }]}
                  onPress={() => setFilterCat(cat.key)}
                >
                  <Ionicons name={cat.icon} size={13} color={filterCat === cat.key ? '#fff' : colors.textSecondary} />
                  <Text style={[s.filterChipText, filterCat === cat.key && { color: '#fff' }]}>
                    {cat.label}
                  </Text>
                </TouchableOpacity>
              ))}
            </ScrollView>

            {filteredExpenses.length === 0 ? (
              <Text style={s.empty}>Nenhuma despesa encontrada.</Text>
            ) : (
              filteredExpenses.map(item => (
                <FinancialCard
                  key={item.id}
                  item={item}
                  type="expense"
                  onEdit={() => openEdit(item, 'expense')}
                  onDelete={() => deleteExpense(item.id)}
                  onTogglePaid={() => toggleExpensePaid(item.id)}
                />
              ))
            )}
          </>
        )}
      </ScrollView>

      {/* Modal de lançamento / edição */}
      <Modal
        visible={!!modalType}
        transparent
        animationType="slide"
        onRequestClose={() => { setModalType(null); setEditItem(null); }}
      >
        <View style={s.modalOverlay}>
          <ScrollView
            style={[s.modalSheet, { backgroundColor: colors.surface }]}
            keyboardShouldPersistTaps="handled"
            contentContainerStyle={{ padding: spacing.lg }}
          >
            {modalType && (
              <EntryForm
                type={modalType}
                initialData={editItem?.item ?? null}
                onSave={handleSave}
                onClose={() => { setModalType(null); setEditItem(null); }}
                colors={colors}
              />
            )}
          </ScrollView>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

// ── Estilos ───────────────────────────────────────────────────────────────────
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
      backgroundColor: colors.surfaceVariant,
      borderRadius: radius.full,
      padding: spacing.sm,
    },
    alert: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: spacing.sm,
      marginHorizontal: spacing.md,
      padding: spacing.sm,
      borderRadius: radius.sm,
      borderWidth: 1,
      marginBottom: spacing.xs,
    },
    alertText: { fontSize: fontSize.sm, fontWeight: fontWeight.semibold },
    monthNav: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      paddingHorizontal: spacing.md,
      paddingVertical: spacing.xs,
    },
    monthText: { fontSize: fontSize.lg, fontWeight: fontWeight.semibold, color: colors.text },
    tabs: {
      flexDirection: 'row',
      marginHorizontal: spacing.md,
      marginBottom: spacing.xs,
      backgroundColor: colors.surfaceVariant,
      borderRadius: radius.md,
      padding: 4,
      gap: 2,
    },
    tabItem: {
      flex: 1,
      alignItems: 'center',
      paddingVertical: spacing.xs,
      borderRadius: radius.sm,
    },
    tabActive: { backgroundColor: colors.primary },
    tabText: { fontSize: fontSize.sm, color: colors.textSecondary },
    tabTextActive: { color: '#fff', fontWeight: fontWeight.semibold },

    summaryRow: { flexDirection: 'row', gap: spacing.sm, marginBottom: spacing.sm },
    balanceCard: {
      borderRadius: radius.md,
      padding: spacing.md,
      alignItems: 'center',
      marginBottom: spacing.md,
    },
    balanceLabel: { fontSize: fontSize.sm, color: colors.textSecondary },
    balanceValue: { fontSize: fontSize.xxxl, fontWeight: fontWeight.bold, marginTop: 4 },

    chartCard: {
      backgroundColor: colors.card,
      borderRadius: radius.md,
      padding: spacing.md,
      marginBottom: spacing.md,
      ...elevation.sm,
    },
    chartTitle: {
      fontSize: fontSize.md,
      fontWeight: fontWeight.semibold,
      color: colors.text,
      marginBottom: spacing.sm,
    },

    tipCard: {
      flexDirection: 'row',
      alignItems: 'flex-start',
      gap: spacing.sm,
      borderRadius: radius.md,
      padding: spacing.md,
      borderWidth: 1,
      marginBottom: spacing.md,
    },
    tipText: { flex: 1, fontSize: fontSize.sm, lineHeight: 20 },

    sectionTitle: {
      fontSize: fontSize.lg,
      fontWeight: fontWeight.bold,
      color: colors.text,
      marginBottom: spacing.sm,
    },
    empty: { color: colors.textSecondary, textAlign: 'center', marginTop: spacing.xl },

    filterChip: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 4,
      backgroundColor: colors.surfaceVariant,
      borderRadius: radius.full,
      paddingHorizontal: spacing.sm,
      paddingVertical: 6,
      marginRight: spacing.xs,
    },
    filterChipText: { fontSize: fontSize.xs, color: colors.textSecondary },

    modalOverlay: {
      flex: 1,
      justifyContent: 'flex-end',
      backgroundColor: 'rgba(0,0,0,0.5)',
    },
    modalSheet: {
      borderTopLeftRadius: radius.xl,
      borderTopRightRadius: radius.xl,
      maxHeight: '90%',
    },
  });

const formStyles = (colors) =>
  StyleSheet.create({
    form: {},
    title: {
      fontSize: fontSize.xl,
      fontWeight: fontWeight.bold,
      color: colors.text,
      marginBottom: spacing.lg,
      textAlign: 'center',
    },
    label: {
      fontSize: fontSize.sm,
      fontWeight: fontWeight.semibold,
      color: colors.textSecondary,
      marginBottom: spacing.xs,
    },
    input: {
      backgroundColor: colors.surfaceVariant,
      borderRadius: radius.md,
      padding: spacing.md,
      color: colors.text,
      fontSize: fontSize.md,
      marginBottom: spacing.md,
    },
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
    catText: { fontSize: fontSize.xs, color: colors.textSecondary },
    toggle: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: spacing.sm,
      marginBottom: spacing.lg,
    },
    toggleText: { fontSize: fontSize.md, color: colors.text },
    buttons: { flexDirection: 'row', gap: spacing.sm },
  });
