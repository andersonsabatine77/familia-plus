import { Linking } from 'react-native';
import { formatCurrency, formatDate } from './formatters';

// Abre WhatsApp com uma mensagem pré-formatada
export async function sendWhatsApp(phone, message) {
  // Remove tudo que não é número
  const cleanPhone = phone.replace(/\D/g, '');
  const encoded = encodeURIComponent(message);
  const url = `whatsapp://send?phone=55${cleanPhone}&text=${encoded}`;

  const canOpen = await Linking.canOpenURL(url);
  if (canOpen) {
    await Linking.openURL(url);
    return true;
  }
  // Fallback para web.whatsapp.com se app não estiver instalado
  await Linking.openURL(`https://wa.me/55${cleanPhone}?text=${encoded}`);
  return false;
}

// Compartilha lista de mercado via WhatsApp
export function buildMarketListMessage(items) {
  const unchecked = items.filter(i => !i.checked);
  const checked   = items.filter(i => i.checked);

  let msg = '🛒 *Lista de Mercado — Família+*\n\n';

  if (unchecked.length) {
    msg += '📋 *Para comprar:*\n';
    unchecked.forEach(item => {
      const price = item.estimatedPrice ? ` (~${formatCurrency(item.estimatedPrice)})` : '';
      msg += `  ◻️ ${item.name} × ${item.quantity}${price}\n`;
    });
  }

  if (checked.length) {
    msg += '\n✅ *Já comprado:*\n';
    checked.forEach(item => {
      msg += `  ✔️ ${item.name} × ${item.quantity}\n`;
    });
  }

  const total = items.reduce((s, i) => s + (i.estimatedPrice || 0) * (i.quantity || 1), 0);
  msg += `\n💰 *Total estimado: ${formatCurrency(total)}*`;

  return msg;
}

// Lembrete de conta a vencer
export function buildBillReminderMessage(expense) {
  return (
    `💳 *Lembrete — Família+*\n\n` +
    `Conta: *${expense.description}*\n` +
    `Valor: *${formatCurrency(expense.amount)}*\n` +
    `Vencimento: *${formatDate(expense.dueDate)}*\n\n` +
    `Não se esqueça de pagar! 😉`
  );
}

// Lembrete de evento
export function buildEventReminderMessage(event) {
  return (
    `📅 *Lembrete — Família+*\n\n` +
    `Evento: *${event.title}*\n` +
    `Data: *${formatDate(event.date)}*` +
    (event.time ? ` às *${event.time}*` : '') + '\n' +
    (event.description ? `\n${event.description}` : '')
  );
}

// Lembrete de consulta médica de filho
export function buildAppointmentMessage(child, appointment) {
  return (
    `🏥 *Consulta Médica — Família+*\n\n` +
    `Paciente: *${child.name}*\n` +
    `Data: *${formatDate(appointment.date)}*` +
    (appointment.time ? ` às *${appointment.time}*` : '') + '\n' +
    (appointment.doctor ? `Médico: *${appointment.doctor}*\n` : '') +
    (appointment.location ? `Local: *${appointment.location}*` : '')
  );
}
