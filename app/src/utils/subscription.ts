import { differenceInCalendarDays, parseISO, subMonths } from 'date-fns';

export type SubscriptionStatus = 'al_dia' | 'vence_pronto' | 'debe';

// Días de aviso antes del vencimiento.
export const DUE_SOON_DAYS = 5;

export function daysUntilDue(paidThrough: string, today = new Date()): number {
  return differenceInCalendarDays(parseISO(paidThrough), today);
}

export function getStatus(
  paidThrough: string,
  today = new Date()
): SubscriptionStatus {
  const days = daysUntilDue(paidThrough, today);
  if (days < 0) return 'debe';
  if (days <= DUE_SOON_DAYS) return 'vence_pronto';
  return 'al_dia';
}

export const STATUS_LABEL: Record<SubscriptionStatus, string> = {
  al_dia: 'Al día',
  vence_pronto: 'Vence pronto',
  debe: 'Debe',
};

// Texto corto del vencimiento para la fila del alumno.
export function dueLabel(paidThrough: string, today = new Date()): string {
  const days = daysUntilDue(paidThrough, today);
  if (days === 0) return 'Vence hoy';
  if (days === 1) return 'Vence mañana';
  if (days > 1) return `Vence en ${days} días`;
  if (days === -1) return 'Venció ayer';
  return `Venció hace ${Math.abs(days)} días`;
}

// Fracción (0..1) del mes pagado que ya transcurrió: alimenta el "carril"
// de cada alumno. El periodo va de (paidThrough - 1 mes) a paidThrough.
export function periodProgress(paidThrough: string, today = new Date()): number {
  const end = parseISO(paidThrough);
  const start = subMonths(end, 1);
  const total = differenceInCalendarDays(end, start);
  if (total <= 0) return 1;
  const elapsed = differenceInCalendarDays(today, start);
  return Math.min(1, Math.max(0, elapsed / total));
}

// Mensaje de recordatorio para WhatsApp.
export function reminderMessage(name: string, dueText: string): string {
  return `Hola ${name}, te escribimos de Swimming is Cool. Tu mensualidad de natación ${dueText.toLowerCase()}. ¿Nos confirmas el pago? ¡Gracias!`;
}

// wa.me con indicativo de Colombia si el número viene sin él.
export function whatsappLink(phone: string, message: string): string {
  const digits = phone.replace(/\D/g, '');
  const full = digits.length === 10 ? `57${digits}` : digits;
  return `https://wa.me/${full}?text=${encodeURIComponent(message)}`;
}
