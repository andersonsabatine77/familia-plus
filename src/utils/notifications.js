import * as Notifications from 'expo-notifications';

// Configura comportamento de notificações recebidas com app em foreground
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: false,
  }),
});

// Solicita permissão ao usuário
export async function requestNotificationPermission() {
  const { status } = await Notifications.requestPermissionsAsync();
  return status === 'granted';
}

// Agenda um lembrete para uma data específica
export async function scheduleNotification({ title, body, date, id }) {
  const trigger = new Date(date);
  if (trigger <= new Date()) return null; // não agenda datas passadas

  const notifId = await Notifications.scheduleNotificationAsync({
    identifier: id,
    content: { title, body, sound: true },
    trigger,
  });
  return notifId;
}

// Cancela uma notificação pelo ID
export async function cancelNotification(id) {
  if (!id) return;
  await Notifications.cancelScheduledNotificationAsync(id);
}

// Cancela todas as notificações agendadas
export async function cancelAllNotifications() {
  await Notifications.cancelAllScheduledNotificationsAsync();
}

// Lista todas as notificações agendadas
export async function listScheduledNotifications() {
  return await Notifications.getAllScheduledNotificationsAsync();
}

// Agenda alertas de conta a vencer nos dias configurados (ex: [1, 3, 7])
// alertTime: horário do disparo no formato 'HH:MM' (padrão 09:00)
export async function scheduleBillAlert(expense, alertDays, alertTime = '09:00') {
  if (!expense.dueDate || expense.paid) return;
  const due = new Date(expense.dueDate);
  const [ah, am] = String(alertTime || '09:00').split(':').map(n => parseInt(n, 10) || 0);

  for (const days of alertDays) {
    const alertDate = new Date(due);
    alertDate.setDate(alertDate.getDate() - days);
    alertDate.setHours(ah, am, 0, 0); // horário configurado pelo usuário

    if (alertDate > new Date()) {
      await scheduleNotification({
        id: `bill-${expense.id}-${days}d`,
        title: '💰 Conta a vencer!',
        body: `"${expense.description}" vence em ${days} dia${days > 1 ? 's' : ''}!`,
        date: alertDate,
      });
    }
  }
}

// Agenda lembrete para evento do calendário
export async function scheduleEventAlert(event, minutesBefore = 60) {
  const eventDate = new Date(event.date);
  if (event.time) {
    const [h, m] = event.time.split(':');
    eventDate.setHours(parseInt(h), parseInt(m), 0, 0);
  }
  const alertDate = new Date(eventDate.getTime() - minutesBefore * 60 * 1000);

  if (alertDate > new Date()) {
    await scheduleNotification({
      id: `event-${event.id}`,
      title: '📅 Lembrete de evento',
      body: `"${event.title}" em ${minutesBefore} minutos`,
      date: alertDate,
    });
  }
}

// Agenda lembrete de medicação diário (hora específica)
export async function scheduleMedicationReminder(medication, childName) {
  if (!medication.time || !medication.active) return;
  const [h, m] = medication.time.split(':');
  const trigger = { hour: parseInt(h), minute: parseInt(m), repeats: true };

  await Notifications.scheduleNotificationAsync({
    identifier: `med-${medication.id}`,
    content: {
      title: '💊 Hora do remédio!',
      body: `${childName}: ${medication.name} — ${medication.dosage}`,
      sound: true,
    },
    trigger,
  });
}
