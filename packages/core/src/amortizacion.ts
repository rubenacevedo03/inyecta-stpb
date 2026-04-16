export interface FilaAmortizacion {
  mes: number;
  fecha: Date;
  pagoCapital: number;
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

/**
 * Calcula tabla de amortización francesa (PMT fijo).
 * @param principal Monto del crédito
 * @param tasaAnual Tasa anual (ej: 0.36 = 36%)
 * @param meses Plazo en meses
 * @param fechaInicio Fecha de inicio del crédito
 */
export function calcularAmortFrances(
  principal: number,
  tasaAnual: number,
  meses: number,
  fechaInicio: Date
): ResultadoAmort {
  const r = tasaAnual / 12;
  const factor = Math.pow(1 + r, meses);
  const PMT = r === 0
    ? principal / meses
    : (principal * r * factor) / (factor - 1);

  const filas: FilaAmortizacion[] = [];
  let saldo = principal;
  let totalIntereses = 0;

  for (let i = 1; i <= meses; i++) {
    const interes = saldo * r;
    const capital = PMT - interes;
    totalIntereses += interes;
    saldo = Math.max(0, saldo - capital);

    const fecha = new Date(fechaInicio);
    fecha.setMonth(fecha.getMonth() + i);

    filas.push({
      mes: i,
      fecha,
      pagoCapital: round2(capital),
      pagoIntereses: round2(interes),
      pagoTotal: round2(PMT),
      saldo: round2(saldo),
    });
  }

  return {
    filas,
    pmt: round2(PMT),
    totalIntereses: round2(totalIntereses),
    totalPagado: round2(PMT * meses),
    saldoInicial: principal,
  };
}

function round2(n: number): number {
  return Math.round(n * 100) / 100;
}
