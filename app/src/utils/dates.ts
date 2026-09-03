import { addMonths, format, parseISO } from 'date-fns';
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
