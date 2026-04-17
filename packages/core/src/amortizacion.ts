import Decimal from 'decimal.js';

// Configuración global de Decimal: 20 dígitos de precisión, sin notación científica
Decimal.set({ precision: 20, rounding: Decimal.ROUND_HALF_UP });

// ─── Interfaces ───────────────────────────────────────────────────────────────

export interface FilaAmortizacion {
  mes: number;
  fecha: Date;
  pagoCapital: number;   // redondeado a 2 decimales en el boundary
  pagoIntereses: number;
  pagoTotal: number;
  saldo: number;
}

export interface ResultadoAmort {
  filas: FilaAmortizacion[];
  pmt: number;
  totalIntereses: number;
  totalPagado: number;
  saldoInicial: number;
}

// ─── Helper: suma de meses sin desborde de días ───────────────────────────────
/**
 * Añade `meses` meses a `base` usando aritmética de calendario local.
 * Evita el bug de setMonth() cuando el día es > 28:
 *   ej. 31-ene + 1 mes → 28-feb (no 3-mar).
 */
function addMeses(base: Date, meses: number): Date {
  const totalMeses = base.getMonth() + meses;
  const yr  = base.getFullYear() + Math.floor(totalMeses / 12);
  const mo  = ((totalMeses % 12) + 12) % 12;
  const dia = base.getDate();
  const maxDia = new Date(yr, mo + 1, 0).getDate();
  return new Date(yr, mo, Math.min(dia, maxDia), 12, 0, 0);
}

// ─── Núcleo del cálculo ───────────────────────────────────────────────────────

/**
 * Calcula la tabla de amortización francesa (PMT fijo) usando Decimal.js.
 *
 * Correcciones respecto a la versión anterior:
 *  1. Todo el cálculo interno usa Decimal → sin error de redondeo acumulado.
 *  2. En la última fila: capital = saldo restante y saldo = 0 exacto.
 *     (antes: Math.max(0, saldo - capital) enmascaraba el residuo)
 *  3. Las fechas usan addMeses() con clamping al último día del mes.
 *     (antes: setMonth() desbordaba, p. ej. 31-ene + 1 → 3-mar)
 *
 * @param principal     Monto del crédito
 * @param tasaAnual     Tasa anual como decimal (ej: 0.18 = 18%)
 * @param meses         Plazo en número de pagos mensuales
 * @param fechaPrimerPago  Fecha del primer pago (local)
 */
export function calcularAmortFrances(
  principal: number,
  tasaAnual: number,
  meses: number,
  fechaPrimerPago: Date,
): ResultadoAmort {
  const P   = new Decimal(principal);
  const r   = new Decimal(tasaAnual).dividedBy(12);

  // PMT = P * r * (1+r)^n  /  ((1+r)^n - 1)
  // Si tasa = 0, PMT = P / n
  let PMT: Decimal;
  if (r.isZero()) {
    PMT = P.dividedBy(meses);
  } else {
    const factor = r.plus(1).pow(meses);          // (1+r)^n
    PMT = P.times(r).times(factor).dividedBy(factor.minus(1));
  }

  const filas: FilaAmortizacion[] = [];
  let saldo         = P;
  let totalIntereses = new Decimal(0);

  for (let i = 1; i <= meses; i++) {
    const interes  = saldo.times(r);
    const esUltima = i === meses;

    // En la última fila el capital es exactamente el saldo restante
    // para garantizar cierre exacto en 0.00 sin residuo de redondeo.
    const capital = esUltima ? saldo : PMT.minus(interes);
    const pagoEstaFila = esUltima ? saldo.plus(interes) : PMT;

    totalIntereses = totalIntereses.plus(interes);
    saldo = esUltima ? new Decimal(0) : saldo.minus(capital);

    const fecha = addMeses(fechaPrimerPago, i - 1);

    filas.push({
      mes:          i,
      fecha,
      pagoCapital:  to2(capital),
      pagoIntereses: to2(interes),
      pagoTotal:    to2(pagoEstaFila),
      saldo:        to2(saldo),
    });
  }

  return {
    filas,
    pmt:           to2(PMT),
    totalIntereses: to2(totalIntereses),
    totalPagado:   to2(PMT.times(meses - 1).plus(filas[meses - 1].pagoTotal)),
    saldoInicial:  principal,
  };
}

// ─── Utilidad interna ─────────────────────────────────────────────────────────

/** Convierte Decimal a number redondeado a 2 decimales (boundary de salida). */
function to2(d: Decimal): number {
  return d.toDecimalPlaces(2, Decimal.ROUND_HALF_UP).toNumber();
}
