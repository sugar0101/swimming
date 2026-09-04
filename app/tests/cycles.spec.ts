import { describe, expect, it } from 'vitest';
import { nextCycleIso, prevCycleIso } from '../src/utils/dates';
import { coverageAfterPayment } from '../src/utils/subscription';

describe('nextCycleIso', () => {
  it('avanza un ciclo cuando la cobertura está alineada al inicio', () => {
    expect(nextCycleIso('2026-09-03', '2026-09-03')).toBe('2026-10-03');
    expect(nextCycleIso('2026-09-03', '2026-10-03')).toBe('2026-11-03');
  });

  it('re-ancla al día de inicio una cobertura corrida (lógica vieja)', () => {
    // Con la lógica anterior un pago tardío dejaba paidThrough en el día
    // del pago; el siguiente ciclo vuelve al día de corte original.
    expect(nextCycleIso('2026-09-03', '2026-09-15')).toBe('2026-10-03');
    expect(nextCycleIso('2026-09-03', '2026-10-20')).toBe('2026-11-03');
  });

  it('ajusta el día en meses cortos sin perder el ancla', () => {
    // Inicio el 31: enero 31 → feb 28 → mar 31.
    expect(nextCycleIso('2026-01-31', '2026-01-31')).toBe('2026-02-28');
    expect(nextCycleIso('2026-01-31', '2026-02-28')).toBe('2026-03-31');
  });
});

describe('prevCycleIso', () => {
  it('retrocede un ciclo alineado', () => {
    expect(prevCycleIso('2026-09-03', '2026-11-03')).toBe('2026-10-03');
    expect(prevCycleIso('2026-09-03', '2026-10-03')).toBe('2026-09-03');
  });

  it('no baja de la fecha de inicio', () => {
    expect(prevCycleIso('2026-09-03', '2026-09-03')).toBe('2026-09-03');
  });

  it('deshace el ajuste de meses cortos', () => {
    expect(prevCycleIso('2026-01-31', '2026-03-31')).toBe('2026-02-28');
    expect(prevCycleIso('2026-01-31', '2026-02-28')).toBe('2026-01-31');
  });
});

describe('coverageAfterPayment', () => {
  it('paga a tiempo: siguiente ciclo desde el vencimiento', () => {
    expect(
      coverageAfterPayment({ startDate: '2026-09-03', paidThrough: '2026-10-03' })
    ).toBe('2026-11-03');
  });

  it('paga tarde: el corte sigue anclado al día de inicio, no al día del pago', () => {
    // Venció el 3 oct y paga el 20 oct: queda cubierto hasta el 3 nov,
    // no hasta el 20 nov.
    expect(
      coverageAfterPayment({ startDate: '2026-09-03', paidThrough: '2026-10-03' })
    ).toBe('2026-11-03');
  });

  it('debe desde el inicio: el primer pago cubre el primer ciclo', () => {
    expect(
      coverageAfterPayment({ startDate: '2026-09-03', paidThrough: '2026-09-03' })
    ).toBe('2026-10-03');
  });

  it('paidThrough anterior al inicio (inicio editado): parte del inicio', () => {
    expect(
      coverageAfterPayment({ startDate: '2026-09-10', paidThrough: '2026-09-03' })
    ).toBe('2026-10-10');
  });
});
