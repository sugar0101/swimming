import {
  addMonths,
  differenceInCalendarMonths,
  format,
  parseISO,
} from 'date-fns';
import { es } from 'date-fns/locale';

export const ISO_DATE = 'yyyy-MM-dd';
export const ISO_MONTH = 'yyyy-MM';

export function toIsoDate(date: Date): string {
  return format(date, ISO_DATE);
}

export function toIsoMonth(date: Date): string {
  return format(date, ISO_MONTH);
}

export function fromIsoDate(value: string): Date {
  return parseISO(value);
}

export function todayIso(): string {
  return toIsoDate(new Date());
}

export function currentMonthIso(): string {
  return toIsoMonth(new Date());
}

// Suma meses a una fecha ISO ('yyyy-MM-dd') y devuelve otra ISO.
export function addMonthsIso(value: string, months: number): string {
  return toIsoDate(addMonths(parseISO(value), months));
}

// La mensualidad corre en ciclos anclados al día de la fecha de inicio:
// quien empieza un 3 siempre vence un 3, sin importar el día en que pague.
// El ciclo k es startDate + k meses (en meses cortos el día se ajusta al
// último, p. ej. inicio el 31 → 28 feb).
function cycleIso(startIso: string, k: number): string {
  return addMonthsIso(startIso, k);
}

// Primera fecha de ciclo estrictamente posterior a `currentIso`.
export function nextCycleIso(startIso: string, currentIso: string): string {
  let k = Math.max(
    0,
    differenceInCalendarMonths(parseISO(currentIso), parseISO(startIso))
  );
  while (cycleIso(startIso, k) <= currentIso) k += 1;
  return cycleIso(startIso, k);
}

// Última fecha de ciclo estrictamente anterior a `currentIso` (sin bajar
// de la fecha de inicio).
export function prevCycleIso(startIso: string, currentIso: string): string {
  let k = Math.max(
    0,
    differenceInCalendarMonths(parseISO(currentIso), parseISO(startIso)) + 1
  );
  while (k > 0 && cycleIso(startIso, k) >= currentIso) k -= 1;
  return cycleIso(startIso, k);
}

// "21 ago" / "21 ago 2026"
export function formatShortDate(value: string, withYear = false): string {
  return format(parseISO(value), withYear ? 'd MMM yyyy' : 'd MMM', {
    locale: es,
  });
}

// "septiembre 2026"
export function formatMonthName(value: string): string {
  return format(parseISO(`${value}-01`), 'MMMM yyyy', { locale: es });
}
