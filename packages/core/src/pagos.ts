import Decimal from 'decimal.js';

Decimal.set({ precision: 20, rounding: Decimal.ROUND_HALF_UP });

// ─── Tipos ────────────────────────────────────────────────────────────────────

/**
 * Snapshot del estado de un PagoMensual al momento de aplicar el cobro.
 * Los montos son los valores adeudados *antes* del pago.
 */
export interface EstadoPagoMensual {
  /** Capital programado pendiente en esta fila */
  capitalPendiente: number;
  /** Interés ordinario pendiente */
  interesPendiente: number;
  /** IVA sobre interés ordinario pendiente */
  ivaPendiente: number;
  /** Intereses moratorios acumulados */
  interesMoratorio: number;
  /** IVA sobre intereses moratorios */
  ivaMoratorio: number;
}

/**
 * Resultado de aplicar un pago según la prelación legal mexicana.
 *
 * Prelación: moratorios → IVA moratorios → intereses → IVA intereses → capital
 */
export interface ResultadoAplicarPago {
  /** Monto efectivamente aplicado a moratorios */
  abonoMoratorio: number;
  /** Monto efectivamente aplicado a IVA moratorios */
  abonoIvaMoratorio: number;
  /** Monto efectivamente aplicado a intereses ordinarios */
  abonoInteres: number;
  /** Monto efectivamente aplicado a IVA intereses */
  abonoIvaInteres: number;
  /** Monto efectivamente aplicado a capital */
  abonoCapital: number;
  /** Monto sobrante (no aplicado, debe devolverse o acreditarse) */
  sobrante: number;
  /** Suma de todos los abonos — debe igualar (monto - sobrante) */
  totalAplicado: number;
  /** Capital que queda pendiente tras el pago */
  capitalRestante: number;
  /** Intereses moratorios que quedan pendientes */
  moratorioRestante: number;
  /** IVA moratorio que queda pendiente */
  ivaMoratorioRestante: number;
}

// ─── Función principal ────────────────────────────────────────────────────────

/**
 * Aplica un pago a un PagoMensual respetando la prelación:
 *   1. Intereses moratorios
 *   2. IVA sobre intereses moratorios
 *   3. Intereses ordinarios
 *   4. IVA sobre intereses ordinarios
 *   5. Capital
 *
 * @param montoRecibido  Monto efectivo recibido del acreditado (número ≥ 0)
 * @param estado         Estado actual del pago mensual (adeudos antes del cobro)
 */
export function aplicarPago(
  montoRecibido: number,
  estado: EstadoPagoMensual,
): ResultadoAplicarPago {
  if (montoRecibido < 0) throw new Error('El monto recibido no puede ser negativo');

  let disponible = new Decimal(montoRecibido);

  // ── 1. Moratorios ──────────────────────────────────────────────────────────
  const { abono: abonoMoratorio, restante: moratorioRestante } =
    aplicarCuota(disponible, new Decimal(estado.interesMoratorio));
  disponible = disponible.minus(abonoMoratorio);

  // ── 2. IVA moratorios ──────────────────────────────────────────────────────
  const { abono: abonoIvaMoratorio, restante: ivaMoratorioRestante } =
    aplicarCuota(disponible, new Decimal(estado.ivaMoratorio));
  disponible = disponible.minus(abonoIvaMoratorio);

  // ── 3. Intereses ordinarios ────────────────────────────────────────────────
  const { abono: abonoInteres } =
    aplicarCuota(disponible, new Decimal(estado.interesPendiente));
  disponible = disponible.minus(abonoInteres);

  // ── 4. IVA intereses ───────────────────────────────────────────────────────
  const { abono: abonoIvaInteres } =
    aplicarCuota(disponible, new Decimal(estado.ivaPendiente));
  disponible = disponible.minus(abonoIvaInteres);

  // ── 5. Capital ─────────────────────────────────────────────────────────────
  const { abono: abonoCapital, restante: capitalRestante } =
    aplicarCuota(disponible, new Decimal(estado.capitalPendiente));
  disponible = disponible.minus(abonoCapital);

  const sobrante    = disponible; // lo que no se pudo aplicar
  const totalAplicado = new Decimal(montoRecibido).minus(sobrante);

  return {
    abonoMoratorio:    to2(abonoMoratorio),
    abonoIvaMoratorio: to2(abonoIvaMoratorio),
    abonoInteres:      to2(abonoInteres),
    abonoIvaInteres:   to2(abonoIvaInteres),
    abonoCapital:      to2(abonoCapital),
    sobrante:          to2(sobrante),
    totalAplicado:     to2(totalAplicado),
    capitalRestante:   to2(capitalRestante),
    moratorioRestante: to2(moratorioRestante),
    ivaMoratorioRestante: to2(ivaMoratorioRestante),
  };
}

// ─── Helper: calcular interés moratorio diario ────────────────────────────────

/**
 * Calcula el interés moratorio acumulado dado el saldo insoluto,
 * la tasa moratoria anual, el número de días de atraso y si aplica IVA.
 *
 * @param saldoInsoluto     Capital pendiente sobre el que corre la mora
 * @param tasaMoratoriaAnual Tasa moratoria anual (ej: 0.72 = 72%)
 * @param diasAtraso        Días transcurridos desde la fecha de vencimiento
 * @param tasaIva           Tasa de IVA (ej: 0.16). Pass 0 si no aplica IVA.
 */
export function calcularMoratorios(
  saldoInsoluto: number,
  tasaMoratoriaAnual: number,
  diasAtraso: number,
  tasaIva = 0.16,
): { interesMoratorio: number; ivaMoratorio: number; totalMoratorio: number } {
  if (diasAtraso <= 0) {
    return { interesMoratorio: 0, ivaMoratorio: 0, totalMoratorio: 0 };
  }
  const S   = new Decimal(saldoInsoluto);
  const tma = new Decimal(tasaMoratoriaAnual);
  const d   = new Decimal(diasAtraso);

  // Interés moratorio = saldo × (tasa anual / 360) × días
  const moratorio = S.times(tma).dividedBy(360).times(d);
  const iva       = moratorio.times(new Decimal(tasaIva));

  return {
    interesMoratorio: to2(moratorio),
    ivaMoratorio:     to2(iva),
    totalMoratorio:   to2(moratorio.plus(iva)),
  };
}

// ─── Utilidades internas ──────────────────────────────────────────────────────

/**
 * Aplica `disponible` contra `adeudo`.
 * Retorna cuánto se abonó y cuánto queda del adeudo.
 */
function aplicarCuota(
  disponible: Decimal,
  adeudo: Decimal,
): { abono: Decimal; restante: Decimal } {
  if (disponible.lte(0) || adeudo.lte(0)) {
    return { abono: new Decimal(0), restante: adeudo };
  }
  if (disponible.gte(adeudo)) {
    return { abono: adeudo, restante: new Decimal(0) };
  }
  return { abono: disponible, restante: adeudo.minus(disponible) };
}

function to2(d: Decimal): number {
  return d.toDecimalPlaces(2, Decimal.ROUND_HALF_UP).toNumber();
}
