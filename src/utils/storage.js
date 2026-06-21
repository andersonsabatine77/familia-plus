import AsyncStorage from '@react-native-async-storage/async-storage';

// Chaves do AsyncStorage
export const STORAGE_KEYS = {
  FINANCES:          '@familia_plus:finances',
  CHILDREN:          '@familia_plus:children',
  SHOPPING:          '@familia_plus:shopping',
  CALENDAR:          '@familia_plus:calendar',
  SETTINGS:          '@familia_plus:settings',
  FAMILY:            '@familia_plus:family',
  DEFAULT_MARKET:    '@familia_plus:default_market',
};

// Dados iniciais de exemplo
const INITIAL_DATA = {
  finances: {
    incomes: [
      {
        id: '1',
        type: 'salary',
        description: 'Salário Maio',
        amount: 5000,
        date: new Date().toISOString(),
        recurring: true,
        receiptDay: 5,
      },
    ],
    expenses: [
      {
        id: '1',
        type: 'fixed',
        description: 'Aluguel',
        amount: 1500,
        date: new Date().toISOString(),
        category: 'other',
        dueDate: new Date(new Date().getFullYear(), new Date().getMonth(), 10).toISOString(),
        recurring: true,
        paid: false,
      },
      {
        id: '2',
        type: 'dynamic',
        description: 'Supermercado',
        amount: 350,
        date: new Date().toISOString(),
        category: 'food',
        dueDate: null,
        recurring: false,
        paid: true,
      },
    ],
  },
  children: [
    {
      id: '1',
      name: 'Ana',
      birthDate: '2015-03-15',
      photo: null,
      school: {
        name: 'Escola Municipal Boa Esperança',
        phone: '(11) 1234-5678',
        meetings: [],
        exams: [
          { id: '1', subject: 'Matemática', date: new Date(new Date().getFullYear(), new Date().getMonth(), 20).toISOString(), description: 'Prova bimestral' }
        ],
        grades: [],
        contacts: [],
      },
      health: {
        appointments: [],
        medications: [],
        vaccines: [
          { id: '1', name: 'Febre Amarela', date: '2022-01-10', nextDate: '2032-01-10' }
        ],
        allergies: ['Poeira'],
        bloodType: 'A+',
        contacts: [],
      },
      activities: [
        { id: '1', name: 'Futebol', schedule: 'Terças e Quintas 18h', location: 'Club Esportivo' }
      ],
    },
  ],
  shopping: {
    marketList: [
      { id: '1', name: 'Leite', quantity: 6,   estimatedPrice: 8.5,  category: 'dairy',  checked: false },
      { id: '2', name: 'Pão',   quantity: 2,   estimatedPrice: 7.0,  category: 'other',  checked: false },
      { id: '3', name: 'Frango',quantity: 1,   estimatedPrice: 25.0, category: 'meat',   checked: true  },
    ],
    houseList: [
      { id: '1', name: 'Cadeira de escritório', estimatedPrice: 600, priority: 'medium', status: 'planned' },
    ],
  },
  calendar: {
    events: [
      {
        id: '1',
        title: 'Reunião Escolar',
        date: new Date(new Date().getFullYear(), new Date().getMonth(), 15).toISOString(),
        time: '19:00',
        category: 'meeting',
        description: 'Reunião de pais e mestres — Escola Boa Esperança',
        color: '#6C63FF',
      },
    ],
  },
  settings: {
    theme: 'light',
    notificationsEnabled: true,
    billsAlertDays: [1, 3, 7],
  },
  family: [
    { id: '1', name: 'Responsável', phone: '', role: 'parent' },
  ],
};

// --- Leitura genérica ---
export async function loadData(key) {
  try {
    const raw = await AsyncStorage.getItem(key);
    return raw ? JSON.parse(raw) : null;
  } catch (e) {
    console.error(`[storage] Erro ao ler ${key}:`, e);
    return null;
  }
}

// --- Escrita genérica ---
export async function saveData(key, data) {
  try {
    await AsyncStorage.setItem(key, JSON.stringify(data));
  } catch (e) {
    console.error(`[storage] Erro ao salvar ${key}:`, e);
  }
}

// --- Inicialização: popula dados de exemplo se não existir ---
export async function initializeStorage() {
  const existing = await AsyncStorage.getItem(STORAGE_KEYS.FINANCES);
  if (!existing) {
    await Promise.all([
      saveData(STORAGE_KEYS.FINANCES,  INITIAL_DATA.finances),
      saveData(STORAGE_KEYS.CHILDREN,  INITIAL_DATA.children),
      saveData(STORAGE_KEYS.SHOPPING,  INITIAL_DATA.shopping),
      saveData(STORAGE_KEYS.CALENDAR,  INITIAL_DATA.calendar),
      saveData(STORAGE_KEYS.SETTINGS,  INITIAL_DATA.settings),
      saveData(STORAGE_KEYS.FAMILY,    INITIAL_DATA.family),
    ]);
  }
}

// --- Backup: exporta todos os dados como JSON ---
export async function exportAllData() {
  const keys = Object.values(STORAGE_KEYS);
  const pairs = await AsyncStorage.multiGet(keys);
  const result = {};
  pairs.forEach(([key, value]) => {
    result[key] = value ? JSON.parse(value) : null;
  });
  return result;
}

// --- Restauração: importa dados de um backup ---
export async function importAllData(backup) {
  const pairs = Object.entries(backup).map(([key, value]) => [key, JSON.stringify(value)]);
  await AsyncStorage.multiSet(pairs);
}

// --- Limpar todos os dados ---
export async function clearAllData() {
  await AsyncStorage.multiRemove(Object.values(STORAGE_KEYS));
  await initializeStorage();
}
