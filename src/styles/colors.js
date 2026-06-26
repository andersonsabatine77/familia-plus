// Paleta de cores do Família+ — tema claro e escuro
export const lightColors = {
  primary: '#6C63FF',
  primaryLight: '#9C95FF',
  primaryDark: '#4A42CC',
  secondary: '#FF6584',
  accent: '#43C6AC',
  success: '#4CAF50',
  warning: '#FF9800',
  error: '#F44336',
  info: '#2196F3',

  background: '#F8F9FA',
  surface: '#FFFFFF',
  surfaceVariant: '#F0F0F7',
  card: '#FFFFFF',
  border: '#E0E0E0',
  divider: '#EEEEEE',

  text: '#212121',
  textSecondary: '#757575',
  textDisabled: '#BDBDBD',
  textOnPrimary: '#FFFFFF',

  // Categorias de gastos
  catFood: '#FF7043',
  catHealth: '#E91E63',
  catEducation: '#3F51B5',
  catTransport: '#00BCD4',
  catLeisure: '#9C27B0',
  catHome: '#8D6E63',
  catOther: '#607D8B',

  // Categorias de eventos do calendário
  evtBill: '#FF6584',
  evtMeeting: '#6C63FF',
  evtExam: '#FF9800',
  evtAppointment: '#4CAF50',
  evtBirthday: '#FF4081',
  evtOther: '#607D8B',

  shadow: 'rgba(0,0,0,0.1)',
  overlay: 'rgba(0,0,0,0.5)',
};

export const darkColors = {
  primary: '#9C95FF',
  primaryLight: '#C5C0FF',
  primaryDark: '#6C63FF',
  secondary: '#FF8FA3',
  accent: '#43C6AC',
  success: '#66BB6A',
  warning: '#FFA726',
  error: '#EF5350',
  info: '#42A5F5',

  background: '#0F0F1A',
  surface: '#1A1A2E',
  surfaceVariant: '#252545',
  card: '#1E1E35',
  border: '#2D2D50',
  divider: '#2A2A45',

  text: '#FFFFFF',
  textSecondary: '#AAAACC',
  textDisabled: '#555577',
  textOnPrimary: '#FFFFFF',

  catFood: '#FF8A65',
  catHealth: '#F48FB1',
  catEducation: '#7986CB',
  catTransport: '#4DD0E1',
  catLeisure: '#CE93D8',
  catHome: '#A1887F',
  catOther: '#90A4AE',

  evtBill: '#FF8FA3',
  evtMeeting: '#9C95FF',
  evtExam: '#FFA726',
  evtAppointment: '#66BB6A',
  evtBirthday: '#FF80AB',
  evtOther: '#90A4AE',

  shadow: 'rgba(0,0,0,0.4)',
  overlay: 'rgba(0,0,0,0.7)',
};

// Mapeamento de categorias
export const expenseCategories = [
  { key: 'food',       label: 'Alimentação', icon: 'fast-food',    colorKey: 'catFood' },
  { key: 'health',     label: 'Saúde',       icon: 'medkit',       colorKey: 'catHealth' },
  { key: 'education',  label: 'Educação',    icon: 'school',       colorKey: 'catEducation' },
  { key: 'transport',  label: 'Transporte',  icon: 'car',          colorKey: 'catTransport' },
  { key: 'leisure',    label: 'Lazer',       icon: 'game-controller', colorKey: 'catLeisure' },
  { key: 'home',       label: 'Casa',        icon: 'home',         colorKey: 'catHome' },
  { key: 'other',      label: 'Outros',      icon: 'ellipsis-horizontal', colorKey: 'catOther' },
];

export const eventCategories = [
  { key: 'bill',        label: 'Conta',      icon: 'receipt',     colorKey: 'evtBill' },
  { key: 'meeting',     label: 'Reunião',    icon: 'people',      colorKey: 'evtMeeting' },
  { key: 'exam',        label: 'Prova',      icon: 'document-text', colorKey: 'evtExam' },
  { key: 'appointment', label: 'Consulta',   icon: 'medical',     colorKey: 'evtAppointment' },
  { key: 'birthday',    label: 'Aniversário',icon: 'gift',        colorKey: 'evtBirthday' },
  { key: 'other',       label: 'Outro',      icon: 'calendar',    colorKey: 'evtOther' },
];

export const shoppingCategories = [
  { key: 'fruits',  label: 'Frutas',     icon: 'nutrition' },
  { key: 'veggies', label: 'Verduras',   icon: 'leaf' },
  { key: 'dairy',   label: 'Laticínios', icon: 'water' },
  { key: 'meat',    label: 'Carnes',     icon: 'restaurant' },
  { key: 'drinks',  label: 'Bebidas',    icon: 'cafe' },
  { key: 'hygiene', label: 'Higiene',    icon: 'body' },
  { key: 'cleaning',label: 'Limpeza',    icon: 'sparkles' },
  { key: 'other',   label: 'Outros',     icon: 'basket' },
];
