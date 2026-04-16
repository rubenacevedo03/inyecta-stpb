import { calcularAmortFrances } from './amortizacion';

export interface ParticipacionInput {
  porcentaje: number;
  tasaNeta: number;
}

export interface ResultadoEconomica {
  apertura: number;
  adminTotal: number;
  spreadIncome: number;
  cobranzaIncome: number;
  ingresoTotal: number;
  margen: number;
  roi: number;
  interesInvTotal: number;
}

/**
 * Calcula la económica de una operación para la SOFOM.
 */
export function calcularEconomicaOperacion(
  monto: number,
  tasaBruta: number,
  meses: number,
  spread: number,
  adminFee: number,
  cobranza: number,
  costosFijos: number,
  participaciones: ParticipacionInput[]
): ResultadoEconomica {
  const amortBruta = calcularAmortFrances(monto, tasaBruta, meses, new Date());

  const apertura = monto * 0.03;
  const adminTotal = monto * adminFee * (meses / 12);

  const interesInvTotal = participaciones.reduce((sum, p) => {
    const amortInv = calcularAmortFrances(
      monto * p.porcentaje,
      p.tasaNeta,
      meses,
      new Date()
    );
    return sum + amortInv.totalIntereses;
  }, 0);

  const spreadIncome = amortBruta.totalIntereses - interesInvTotal;
  const cobranzaIncome = amortBruta.totalPagado * cobranza;
  const ingresoTotal = apertura + adminTotal + spreadIncome + cobranzaIncome;
  const margen = ingresoTotal - costosFijos;

  return {
    apertura: Math.round(apertura * 100) / 100,
    adminTotal: Math.round(adminTotal * 100) / 100,
    spreadIncome: Math.round(spreadIncome * 100) / 100,
    cobranzaIncome: Math.round(cobranzaIncome * 100) / 100,
    ingresoTotal: Math.round(ingresoTotal * 100) / 100,
    margen: Math.round(margen * 100) / 100,
    roi: costosFijos > 0 ? Math.round((margen / costosFijos) * 10000) / 10000 : 0,
    interesInvTotal: Math.round(interesInvTotal * 100) / 100,
  };
}
