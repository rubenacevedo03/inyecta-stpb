import { describe, it, expect } from 'vitest';
import { aplicarPago, calcularMoratorios } from '../pagos';
import type { EstadoPagoMensual } from '../pagos';

// ─── Suite 1: prelación ───────────────────────────────────────────────────────

describe('aplicarPago — prelación correcta', () => {
  const estadoCompleto: EstadoPagoMensual = {
    capitalPendiente:   10_000,
    interesPendiente:      500,
    ivaPendiente:           80,  // 500 * 0.16
    interesMoratorio:      200,
    ivaMoratorio:           32,  // 200 * 0.16
  };

  it('pago exacto cubre todo sin sobrante', () => {
    const total = 200 + 32 + 500 + 80 + 10_000; // 10,812
    const r = aplicarPago(total, estadoCompleto);
    expect(r.abonoMoratorio).toBe(200);
    expect(r.abonoIvaMoratorio).toBe(32);
    expect(r.abonoInteres).toBe(500);
    expect(r.abonoIvaInteres).toBe(80);
    expect(r.abonoCapital).toBe(10_000);
    expect(r.sobrante).toBe(0);
    expect(r.capitalRestante).toBe(0);
    expect(r.moratorioRestante).toBe(0);
    expect(r.ivaMoratorioRestante).toBe(0);
  });

  it('pago insuficiente: cubre solo moratorios + IVA moratorios (prelación)', () => {
    const r = aplicarPago(232, estadoCompleto); // solo alcanza para 200+32
    expect(r.abonoMoratorio).toBe(200);
    expect(r.abonoIvaMoratorio).toBe(32);
    expect(r.abonoInteres).toBe(0);
    expect(r.abonoIvaInteres).toBe(0);
    expect(r.abonoCapital).toBe(0);
    expect(r.sobrante).toBe(0);
    expect(r.moratorioRestante).toBe(0);
    expect(r.ivaMoratorioRestante).toBe(0);
  });

  it('pago parcial: cubre moratorios + IVA moratorios + intereses parciales', () => {
    const r = aplicarPago(432, estadoCompleto); // 232 + 200 extra para intereses
    expect(r.abonoMoratorio).toBe(200);
    expect(r.abonoIvaMoratorio).toBe(32);
    expect(r.abonoInteres).toBe(200); // 432 - 232 = 200, aplica a intereses
    expect(r.abonoIvaInteres).toBe(0);
    expect(r.abonoCapital).toBe(0);
    expect(r.sobrante).toBe(0);
  });

  it('pago con sobrante: totalAplicado + sobrante === monto recibido', () => {
    const monto = 15_000; // más que suficiente
    const r = aplicarPago(monto, estadoCompleto);
    expect(r.sobrante).toBeCloseTo(monto - r.totalAplicado, 2);
    expect(r.totalAplicado + r.sobrante).toBeCloseTo(monto, 2);
  });

  it('pago exacto: totalAplicado === monto recibido', () => {
    const monto = 200 + 32 + 500 + 80 + 10_000;
    const r = aplicarPago(monto, estadoCompleto);
    expect(r.totalAplicado).toBe(monto);
  });
});

// ─── Suite 2: sin moratorios ─────────────────────────────────────────────────

describe('aplicarPago — sin moratorios', () => {
  const estadoSinMora: EstadoPagoMensual = {
    capitalPendiente: 5_000,
    interesPendiente:   250,
    ivaPendiente:        40,
    interesMoratorio:     0,
    ivaMoratorio:         0,
  };

  it('pago exacto cubre intereses + IVA + capital', () => {
    const monto = 250 + 40 + 5_000;
    const r = aplicarPago(monto, estadoSinMora);
    expect(r.abonoMoratorio).toBe(0);
    expect(r.abonoIvaMoratorio).toBe(0);
    expect(r.abonoInteres).toBe(250);
    expect(r.abonoIvaInteres).toBe(40);
    expect(r.abonoCapital).toBe(5_000);
    expect(r.sobrante).toBe(0);
  });
});

// ─── Suite 3: casos borde ────────────────────────────────────────────────────

describe('aplicarPago — casos borde', () => {
  const estado: EstadoPagoMensual = {
    capitalPendiente: 1_000,
    interesPendiente:   100,
    ivaPendiente:        16,
    interesMoratorio:    50,
    ivaMoratorio:         8,
  };

  it('pago $0 → todos los abonos son 0, sobrante 0', () => {
    const r = aplicarPago(0, estado);
    expect(r.abonoMoratorio).toBe(0);
    expect(r.abonoCapital).toBe(0);
    expect(r.sobrante).toBe(0);
    expect(r.totalAplicado).toBe(0);
  });

  it('pago negativo lanza error', () => {
    expect(() => aplicarPago(-100, estado)).toThrow('negativo');
  });

  it('capital restante no puede ser negativo', () => {
    const r = aplicarPago(999_999, estado);
    expect(r.capitalRestante).toBe(0);
    expect(r.sobrante).toBeGreaterThan(0);
  });

  it('totalAplicado = suma de todos los abonos', () => {
    const r = aplicarPago(500, estado);
    const suma = r.abonoMoratorio + r.abonoIvaMoratorio + r.abonoInteres + r.abonoIvaInteres + r.abonoCapital;
    expect(r.totalAplicado).toBeCloseTo(suma, 2);
  });
});

// ─── Suite 4: calcularMoratorios ─────────────────────────────────────────────

describe('calcularMoratorios', () => {
  it('0 días de atraso → todo en 0', () => {
    const r = calcularMoratorios(100_000, 0.72, 0);
    expect(r.interesMoratorio).toBe(0);
    expect(r.ivaMoratorio).toBe(0);
    expect(r.totalMoratorio).toBe(0);
  });

  it('días negativos → todo en 0', () => {
    const r = calcularMoratorios(100_000, 0.72, -5);
    expect(r.interesMoratorio).toBe(0);
  });

  it('30 días de atraso / 72% anual / $100,000 saldo', () => {
    // moratorio = 100,000 × (0.72/360) × 30 = 6,000.00
    const r = calcularMoratorios(100_000, 0.72, 30);
    expect(r.interesMoratorio).toBe(6_000);
  });

  it('IVA moratorio = interesMoratorio × 0.16', () => {
    const r = calcularMoratorios(100_000, 0.72, 30);
    expect(r.ivaMoratorio).toBeCloseTo(r.interesMoratorio * 0.16, 2);
  });

  it('totalMoratorio = interesMoratorio + ivaMoratorio', () => {
    const r = calcularMoratorios(100_000, 0.72, 30);
    expect(r.totalMoratorio).toBeCloseTo(r.interesMoratorio + r.ivaMoratorio, 2);
  });

  it('sin IVA (tasaIva=0): ivaMoratorio === 0 y total = interés puro', () => {
    const r = calcularMoratorios(100_000, 0.72, 30, 0);
    expect(r.ivaMoratorio).toBe(0);
    expect(r.totalMoratorio).toBe(r.interesMoratorio);
  });

  it('1 día / 72% / $360,000 → moratorio = $720', () => {
    // 360,000 × (0.72/360) × 1 = 720
    const r = calcularMoratorios(360_000, 0.72, 1);
    expect(r.interesMoratorio).toBe(720);
  });
});
