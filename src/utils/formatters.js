// Funções de formatação de dados para exibição

// Formata número como moeda BRL
export function formatCurrency(value) {
  return new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL',
  }).format(value || 0);
}

// Formata data ISO como dd/mm/aaaa
export function formatDate(isoString) {
  if (!isoString) return '--/--/----';
  const d = new Date(isoString);
  return d.toLocaleDateString('pt-BR');
}

// Formata data para rótulo curto — ex.: "15 jun"
export function formatDateShort(isoString) {
  if (!isoString) return '';
  const d = new Date(isoString);
  return d.toLocaleDateString('pt-BR', { day: '2-digit', month: 'short' });
}

// Retorna "Janeiro 2025", "Fevereiro 2025" etc.
export function formatMonthYear(date) {
  return date.toLocaleDateString('pt-BR', { month: 'long', year: 'numeric' });
}

// Calcula idade a partir de data de nascimento (ISO string)
export function calcAge(birthDateISO) {
  if (!birthDateISO) return 0;
  const birth = new Date(birthDateISO);
  const today = new Date();
  let age = today.getFullYear() - birth.getFullYear();
  const m = today.getMonth() - birth.getMonth();
  if (m < 0 || (m === 0 && today.getDate() < birth.getDate())) age--;
  return age;
}

// Verifica se uma data ISO está vencida (anterior ao dia de hoje)
export function isOverdue(isoString) {
  if (!isoString) return false;
  return new Date(isoString) < new Date();
}

// Verifica se vence nos próximos N dias
export function isDueWithin(isoString, days) {
  if (!isoString) return false;
  const target = new Date(isoString);
  const now = new Date();
  const diff = (target - now) / (1000 * 60 * 60 * 24);
  return diff >= 0 && diff <= days;
}

// Gera UUID simples (sem depedências externas)
export function generateId() {
  return Date.now().toString(36) + Math.random().toString(36).slice(2);
}

// Retorna o nome do mês em PT-BR
export function monthName(monthIndex) {
  const months = [
    'Janeiro','Fevereiro','Março','Abril','Maio','Junho',
    'Julho','Agosto','Setembro','Outubro','Novembro','Dezembro',
  ];
  return months[monthIndex] || '';
}

// Filtra lista por mês e ano
export function filterByMonth(list, dateKey, year, month) {
  return list.filter(item => {
    const d = new Date(item[dateKey]);
    return d.getFullYear() === year && d.getMonth() === month;
  });
}

// Soma campo numérico de uma lista
export function sumField(list, field) {
  return list.reduce((acc, item) => acc + (Number(item[field]) || 0), 0);
}

// Agrupa lista por campo string
export function groupBy(list, field) {
  return list.reduce((acc, item) => {
    const key = item[field] || 'other';
    if (!acc[key]) acc[key] = [];
    acc[key].push(item);
    return acc;
  }, {});
}
