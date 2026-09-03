const copFormatter = new Intl.NumberFormat('es-CO', {
  style: 'currency',
  currency: 'COP',
  maximumFractionDigits: 0,
});

// "$170.000" (pesos colombianos, sin decimales ni espacio tras el signo).
export function formatMoney(value: number): string {
  return copFormatter.format(Math.round(value || 0)).replace(/\s/g, '');
}
