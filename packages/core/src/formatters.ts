/**
 * Formatea un número como moneda MXN.
 */
export function fmtMXN(n: number): string {
  return new Intl.NumberFormat('es-MX', {
    style: 'currency',
    currency: 'MXN',
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(n);
}

/**
 * Formatea un número como porcentaje.
 */
export function fmtPct(n: number, decimals = 0): string {
  return (n * 100).toFixed(decimals) + '%';
}

/**
 * Formatea una fecha en formato dd/mm/yyyy.
 */
export function fmtFecha(d: Date): string {
  return d.toLocaleDateString('es-MX', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
  });
}

/**
 * Genera un folio de operación.
 */
export function generarFolio(): string {
  const now = new Date();
  const year = now.getFullYear().toString().slice(-2);
  const month = (now.getMonth() + 1).toString().padStart(2, '0');
  const rand = Math.random().toString(36).substring(2, 6).toUpperCase();
  return `OP-${year}${month}-${rand}`;
}
