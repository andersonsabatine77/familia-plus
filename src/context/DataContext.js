import React, { createContext, useContext, useState, useEffect, useCallback, useMemo } from 'react';
import { loadData, saveData, STORAGE_KEYS, initializeStorage } from '../utils/storage';
import { generateId } from '../utils/formatters';
import { scheduleBillAlert, cancelNotification, rescheduleAllBillAlerts } from '../utils/notifications';

const DataContext = createContext(null);

export function DataProvider({ children }) {
  const [finances,  setFinances]  = useState({ incomes: [], expenses: [] });
  const [children_,  setChildren]  = useState([]);   // "children" é reservado no React
  const [shopping,  setShopping]  = useState({ marketList: [], houseList: [] });
  const [calendar,  setCalendar]  = useState({ events: [] });
  const [family,    setFamily]    = useState([]);
  const [settings,  setSettings]  = useState({ notificationsEnabled: true, billsAlertDays: [1, 3, 7], billsAlertTime: '09:00', whatsappNumbers: ['', '', ''] });
  const [defaultMarketList, setDefaultMarketListState] = useState([]);
  const [loading,   setLoading]   = useState(true);

  // ── Carregamento inicial ──────────────────────────────────
  useEffect(() => {
    (async () => {
      await initializeStorage();
      const [fin, chi, sho, cal, fam, set] = await Promise.all([
        loadData(STORAGE_KEYS.FINANCES),
        loadData(STORAGE_KEYS.CHILDREN),
        loadData(STORAGE_KEYS.SHOPPING),
        loadData(STORAGE_KEYS.CALENDAR),
        loadData(STORAGE_KEYS.FAMILY),
        loadData(STORAGE_KEYS.SETTINGS),
      ]);
      const def = await loadData(STORAGE_KEYS.DEFAULT_MARKET);
      if (fin) setFinances(fin);
      if (chi) setChildren(chi);
      if (sho) setShopping(sho);
      if (cal) setCalendar(cal);
      if (fam) setFamily(fam);
      if (set) setSettings(s => ({ ...s, ...set }));
      if (def) setDefaultMarketListState(def);
      setLoading(false);
    })();
  }, []);

  // ── Persistência automática por seção ────────────────────
  const persist = useCallback(async (key, data) => {
    await saveData(key, data);
  }, []);

  // ═══════════════════════════════════════════════════════════
  // FINANÇAS
  // ═══════════════════════════════════════════════════════════
  const addIncome = useCallback(async (income) => {
    const item = { ...income, id: generateId() };
    const next = { ...finances, incomes: [...finances.incomes, item] };
    setFinances(next);
    await persist(STORAGE_KEYS.FINANCES, next);
  }, [finances]);

  const updateIncome = useCallback(async (id, data) => {
    const next = {
      ...finances,
      incomes: finances.incomes.map(i => i.id === id ? { ...i, ...data } : i),
    };
    setFinances(next);
    await persist(STORAGE_KEYS.FINANCES, next);
  }, [finances]);

  const deleteIncome = useCallback(async (id) => {
    const next = { ...finances, incomes: finances.incomes.filter(i => i.id !== id) };
    setFinances(next);
    await persist(STORAGE_KEYS.FINANCES, next);
  }, [finances]);

  const addExpense = useCallback(async (expense) => {
    const item = { ...expense, id: generateId() };
    const next = { ...finances, expenses: [...finances.expenses, item] };
    setFinances(next);
    await persist(STORAGE_KEYS.FINANCES, next);
    if (settings.notificationsEnabled) {
      await scheduleBillAlert(item, settings.billsAlertDays, settings.billsAlertTime);
    }
  }, [finances, settings]);

  const updateExpense = useCallback(async (id, data) => {
    const next = {
      ...finances,
      expenses: finances.expenses.map(e => e.id === id ? { ...e, ...data } : e),
    };
    setFinances(next);
    await persist(STORAGE_KEYS.FINANCES, next);
  }, [finances]);

  const deleteExpense = useCallback(async (id) => {
    await cancelNotification(`bill-${id}-1d`);
    await cancelNotification(`bill-${id}-3d`);
    await cancelNotification(`bill-${id}-7d`);
    const next = { ...finances, expenses: finances.expenses.filter(e => e.id !== id) };
    setFinances(next);
    await persist(STORAGE_KEYS.FINANCES, next);
  }, [finances]);

  const toggleExpensePaid = useCallback(async (id) => {
    const next = {
      ...finances,
      expenses: finances.expenses.map(e =>
        e.id === id ? { ...e, paid: !e.paid } : e
      ),
    };
    setFinances(next);
    await persist(STORAGE_KEYS.FINANCES, next);
  }, [finances]);

  // ═══════════════════════════════════════════════════════════
  // FILHOS
  // ═══════════════════════════════════════════════════════════
  const addChild = useCallback(async (child) => {
    const item = {
      ...child,
      id: generateId(),
      school:  { meetings: [], exams: [], grades: [], contacts: [], ...child.school },
      health:  { appointments: [], medications: [], vaccines: [], allergies: [], contacts: [], ...child.health },
      activities: child.activities || [],
    };
    const next = [...children_, item];
    setChildren(next);
    await persist(STORAGE_KEYS.CHILDREN, next);
  }, [children_]);

  const updateChild = useCallback(async (id, data) => {
    const next = children_.map(c => c.id === id ? { ...c, ...data } : c);
    setChildren(next);
    await persist(STORAGE_KEYS.CHILDREN, next);
  }, [children_]);

  const deleteChild = useCallback(async (id) => {
    const next = children_.filter(c => c.id !== id);
    setChildren(next);
    await persist(STORAGE_KEYS.CHILDREN, next);
  }, [children_]);

  // Adiciona item a sub-lista do filho (exams, meetings, medications, etc.)
  const addChildSubItem = useCallback(async (childId, section, subsection, item) => {
    const next = children_.map(c => {
      if (c.id !== childId) return c;
      const sub = c[section] || {};
      return {
        ...c,
        [section]: {
          ...sub,
          [subsection]: [...(sub[subsection] || []), { ...item, id: generateId() }],
        },
      };
    });
    setChildren(next);
    await persist(STORAGE_KEYS.CHILDREN, next);
  }, [children_]);

  const deleteChildSubItem = useCallback(async (childId, section, subsection, itemId) => {
    const next = children_.map(c => {
      if (c.id !== childId) return c;
      const sub = c[section] || {};
      return {
        ...c,
        [section]: {
          ...sub,
          [subsection]: (sub[subsection] || []).filter(i => i.id !== itemId),
        },
      };
    });
    setChildren(next);
    await persist(STORAGE_KEYS.CHILDREN, next);
  }, [children_]);

  // ═══════════════════════════════════════════════════════════
  // COMPRAS
  // ═══════════════════════════════════════════════════════════
  const addMarketItem = useCallback(async (item) => {
    const next = { ...shopping, marketList: [...shopping.marketList, { ...item, id: generateId(), checked: false }] };
    setShopping(next);
    await persist(STORAGE_KEYS.SHOPPING, next);
  }, [shopping]);

  const toggleMarketItem = useCallback(async (id) => {
    const next = {
      ...shopping,
      marketList: shopping.marketList.map(i => i.id === id ? { ...i, checked: !i.checked } : i),
    };
    setShopping(next);
    await persist(STORAGE_KEYS.SHOPPING, next);
  }, [shopping]);

  const deleteMarketItem = useCallback(async (id) => {
    const next = { ...shopping, marketList: shopping.marketList.filter(i => i.id !== id) };
    setShopping(next);
    await persist(STORAGE_KEYS.SHOPPING, next);
  }, [shopping]);

  const clearCheckedMarketItems = useCallback(async () => {
    const next = { ...shopping, marketList: shopping.marketList.filter(i => !i.checked) };
    setShopping(next);
    await persist(STORAGE_KEYS.SHOPPING, next);
  }, [shopping]);

  // Salva lista atual como padrão
  const saveDefaultMarketList = useCallback(async (list) => {
    const clean = list.map(({ id, checked, ...rest }) => rest);
    setDefaultMarketListState(clean);
    await persist(STORAGE_KEYS.DEFAULT_MARKET, clean);
  }, []);

  // Carrega lista padrão como nova lista de compras (reseta checkmarks)
  const loadDefaultMarketList = useCallback(async () => {
    const next = {
      ...shopping,
      marketList: defaultMarketList.map(item => ({ ...item, id: generateId(), checked: false })),
    };
    setShopping(next);
    await persist(STORAGE_KEYS.SHOPPING, next);
  }, [shopping, defaultMarketList]);

  const addHouseItem = useCallback(async (item) => {
    const next = { ...shopping, houseList: [...shopping.houseList, { ...item, id: generateId(), status: 'planned' }] };
    setShopping(next);
    await persist(STORAGE_KEYS.SHOPPING, next);
  }, [shopping]);

  const updateHouseItem = useCallback(async (id, data) => {
    const next = { ...shopping, houseList: shopping.houseList.map(i => i.id === id ? { ...i, ...data } : i) };
    setShopping(next);
    await persist(STORAGE_KEYS.SHOPPING, next);
  }, [shopping]);

  const deleteHouseItem = useCallback(async (id) => {
    const next = { ...shopping, houseList: shopping.houseList.filter(i => i.id !== id) };
    setShopping(next);
    await persist(STORAGE_KEYS.SHOPPING, next);
  }, [shopping]);

  // ═══════════════════════════════════════════════════════════
  // CALENDÁRIO
  // ═══════════════════════════════════════════════════════════
  const addEvent = useCallback(async (event) => {
    const item = { ...event, id: generateId() };
    const next = { ...calendar, events: [...calendar.events, item] };
    setCalendar(next);
    await persist(STORAGE_KEYS.CALENDAR, next);
  }, [calendar]);

  const updateEvent = useCallback(async (id, data) => {
    const next = { ...calendar, events: calendar.events.map(e => e.id === id ? { ...e, ...data } : e) };
    setCalendar(next);
    await persist(STORAGE_KEYS.CALENDAR, next);
  }, [calendar]);

  const deleteEvent = useCallback(async (id) => {
    await cancelNotification(`event-${id}`);
    const next = { ...calendar, events: calendar.events.filter(e => e.id !== id) };
    setCalendar(next);
    await persist(STORAGE_KEYS.CALENDAR, next);
  }, [calendar]);

  // ═══════════════════════════════════════════════════════════
  // FAMÍLIA & CONFIGURAÇÕES
  // ═══════════════════════════════════════════════════════════
  const updateFamily = useCallback(async (data) => {
    setFamily(data);
    await persist(STORAGE_KEYS.FAMILY, data);
  }, []);

  const updateSettings = useCallback(async (data) => {
    const next = { ...settings, ...data };
    setSettings(next);
    await persist(STORAGE_KEYS.SETTINGS, next);
    // Reagenda todos os alertas de conta se mudou horário, dias ou ativou/desativou notificações
    if ('billsAlertTime' in data || 'billsAlertDays' in data || 'notificationsEnabled' in data) {
      await rescheduleAllBillAlerts(finances.expenses, next);
    }
  }, [settings, finances]);

  const value = useMemo(() => ({
    // estado
    finances, children: children_, shopping, calendar, family, settings, loading,
    defaultMarketList,
    // finanças
    addIncome, updateIncome, deleteIncome,
    addExpense, updateExpense, deleteExpense, toggleExpensePaid,
    // filhos
    addChild, updateChild, deleteChild, addChildSubItem, deleteChildSubItem,
    // compras
    addMarketItem, toggleMarketItem, deleteMarketItem, clearCheckedMarketItems,
    addHouseItem, updateHouseItem, deleteHouseItem,
    saveDefaultMarketList, loadDefaultMarketList,
    // calendário
    addEvent, updateEvent, deleteEvent,
    // config
    updateFamily, updateSettings,
  }), [
    finances, children_, shopping, calendar, family, settings, loading,
    defaultMarketList,
    addIncome, updateIncome, deleteIncome,
    addExpense, updateExpense, deleteExpense, toggleExpensePaid,
    addChild, updateChild, deleteChild, addChildSubItem, deleteChildSubItem,
    addMarketItem, toggleMarketItem, deleteMarketItem, clearCheckedMarketItems,
    addHouseItem, updateHouseItem, deleteHouseItem,
    saveDefaultMarketList, loadDefaultMarketList,
    addEvent, updateEvent, deleteEvent,
    updateFamily, updateSettings,
  ]);

  return <DataContext.Provider value={value}>{children}</DataContext.Provider>;
}

export function useData() {
  const ctx = useContext(DataContext);
  if (!ctx) throw new Error('useData deve ser usado dentro de DataProvider');
  return ctx;
}
