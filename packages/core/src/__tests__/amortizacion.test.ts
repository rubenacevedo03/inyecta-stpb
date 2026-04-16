import { describe, it, expect } from 'vitest';
import { calcularAmortFrances } from '../amortizacion';

// ─── Helpers ──────────────────────────────────────────────────────────────────

/** Formatea como YYYY-MM-DD en hora local (sin depender de UTC). */
function localISO(d: Date): string {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const dd = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${dd}`;
}

// ─── Suite 1: caso principal del brief ───────────────────────────────────────

describe('calcularAmortFrances — $3,500,000 / 36 meses / 18%', () => {
  const resultado = calcularAmortFrances(
    3_500_000,
    0.18,
    36,
    new Date(2026, 5, 1, 12, 0, 0), // 1 jun 2026
  );

  it('genera exactamente 36 filas', () => {
    expect(resultado.filas).toHaveLength(36);
  });

  it('saldo de la última fila es exactamente 0.00', () => {
    const ultima = resultado.filas[35];
    expect(ultima.saldo).toBe(0);
  });

  it('saldo de la fila 1 es positivo y menor al capital inicial', () => {
    const fila1 = resultado.filas[0];
    expect(fila1.saldo).toBeGreaterThan(0);
    expect(fila1.saldo).toBeLessThan(3_500_000);
  });

  it('pmt es aprox $126,533 (tol ±200)', () => {
    expect(resultado.pmt).toBeGreaterThan(126_300);
    expect(resultado.pmt).toBeLessThan(126_800);
  });

  it('totalPagado = suma de todos los pagos individuales (tol ±1)', () => {
    const sumaFilas = resultado.filas.reduce((acc, f) => acc + f.pagoTotal, 0);
    expect(Math.abs(sumaFilas - resultado.totalPagado)).toBeLessThanOrEqual(1);
  });

  it('suma de pagoCapital de todas las filas ≈ 3,500,000 (tol ±1)', () => {
    const sumaCapital = resultado.filas.reduce((acc, f) => acc + f.pagoCapital, 0);
    expect(Math.abs(sumaCapital - 3_500_000)).toBeLessThanOrEqual(1);
  });

  it('primer pago es el 2026-06-01 (no un mes después)', () => {
    expect(localISO(resultado.filas[0].fecha)).toBe('2026-06-01');
  });

  it('segundo pago es el 2026-07-01', () => {
    expect(localISO(resultado.filas[1].fecha)).toBe('2026-07-01');
  });

  it('último pago (fila 36) es el 2029-05-01', () => {
    expect(localISO(resultado.filas[35].fecha)).toBe('2029-05-01');
  });

  it('saldoInicial === 3,500,000', () => {
    expect(resultado.saldoInicial).toBe(3_500_000);
  });
});

// ─── Suite 2: corrección del bug de mes con desborde (31 ene → 28 feb) ───────

describe('calcularAmortFrances — corrección addMeses (sin desborde de día)', () => {
  it('enero 31 + 1 mes → febrero 28 (no marzo 3)', () => {
    const res = calcularAmortFrances(100_000, 0.12, 2, new Date(2026, 0, 31, 12, 0, 0));
    expect(localISO(res.filas[0].fecha)).toBe('2026-01-31');
    expect(localISO(res.filas[1].fecha)).toBe('2026-02-28');
  });

  it('enero 31 + 2 meses → marzo 31 (día no clampeado si el mes lo soporta)', () => {
    const res = calcularAmortFrances(100_000, 0.12, 3, new Date(2026, 0, 31, 12, 0, 0));
    expect(localISO(res.filas[2].fecha)).toBe('2026-03-31');
  });

  it('enero 31 + 3 meses → abril 30 (abril tiene 30 días)', () => {
    const res = calcularAmortFrances(100_000, 0.12, 4, new Date(2026, 0, 31, 12, 0, 0));
    expect(localISO(res.filas[3].fecha)).toBe('2026-04-30');
  });
});

// ─── Suite 3: caso borde — tasa 0% ───────────────────────────────────────────

describe('calcularAmortFrances — tasa 0%', () => {
  it('con tasa 0, PMT = capital / plazo', () => {
    const res = calcularAmortFrances(120_000, 0, 12, new Date(2026, 0, 1, 12, 0, 0));
    expect(res.pmt).toBe(10_000);
  });

  it('con tasa 0, saldo final es 0.00', () => {
    const res = calcularAmortFrances(120_000, 0, 12, new Date(2026, 0, 1, 12, 0, 0));
    expect(res.filas[11].saldo).toBe(0);
  });

  it('con tasa 0, totalIntereses = 0', () => {
    const res = calcularAmortFrances(120_000, 0, 12, new Date(2026, 0, 1, 12, 0, 0));
    expect(res.totalIntereses).toBe(0);
  });
});

// ─── Suite 4: precisión numérica en montos no redondos ───────────────────────

describe('calcularAmortFrances — montos con centavos', () => {
  it('saldo final es 0.00 para monto $1,234,567.89 / 24 m / 15.5%', () => {
    const res = calcularAmortFrances(1_234_567.89, 0.155, 24, new Date(2026, 0, 15, 12, 0, 0));
    expect(res.filas[23].saldo).toBe(0);
  });

  it('saldo final es 0.00 para monto $750,000 / 60 m / 21%', () => {
    const res = calcularAmortFrances(750_000, 0.21, 60, new Date(2026, 2, 1, 12, 0, 0));
    expect(res.filas[59].saldo).toBe(0);
  });
});
