// ─── Corridas de Amortización — Inyecta STPB ─────────────────────────────────
// Genera ventana de impresión en formato oficial FSMP / Inyecta.
// Soporta ambas convenciones de nombres de campo (API y Cotizador local).

export interface CorridaData {
  tipo: 'acreditado' | 'inversionista' | 'maestra';
  /** Nombre del cliente o inversionista */
  nombre: string;
  monto: number;
  /** Tasa anual como decimal (0.34 = 34%) */
  tasaAnual: number;
  plazoMeses: number;
  pmt: number;
  /** Monto de la comisión de apertura en MXN */
  comisionApertura: number;
  /** Porcentaje de comisión de apertura como decimal (0.06 = 6%). Opcional. */
  comisionAperturaPorc?: number;
  totalIntereses: number;
  totalPagado: number;
  /** CAT como decimal (0.454 = 45.4%). Opcional. */
  cat?: number;
  filas: FilaCorrida[];
}

export interface FilaCorrida {
  mes: number;
  fecha: Date | string;
  // ── API naming (calcularAmortFrances) ──
  pagoCapital?: number;
  pagoIntereses?: number;
  pagoTotal?: number;
  // ── Cotizador legacy naming ──
  capital?: number;
  interes?: number;
  total?: number;
  // ──────────────────────────────────────
  saldo: number;
  /** IVA sobre intereses. Default 0. */
  iva?: number;
  /** Seguro de vida/daños. Default 0. */
  seguro?: number;
}

// ─── Helpers ─────────────────────────────────────────────────────────────────

const fmt = (n: number | undefined | null): string => {
  const v = n ?? 0;
  if (!isFinite(v) || isNaN(v)) return '$0.00';
  return new Intl.NumberFormat('es-MX', {
    style: 'currency',
    currency: 'MXN',
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(v);
};

const fmtPct = (n: number | undefined | null, decimales = 2): string => {
  const v = n ?? 0;
  if (!isFinite(v) || isNaN(v)) return '0.00%';
  return (v * 100).toFixed(decimales) + '%';
};

const fmtFecha = (d: Date | string): string => {
  const dt = d instanceof Date ? d : new Date(d);
  if (isNaN(dt.getTime())) return '—';
  const dd = String(dt.getDate()).padStart(2, '0');
  const mm = String(dt.getMonth() + 1).padStart(2, '0');
  const yyyy = dt.getFullYear();
  return `${dd}/${mm}/${yyyy}`;
};

/** Normaliza la fila para soportar tanto API-naming como cotizador-naming */
function normFila(f: FilaCorrida): {
  capital: number; intereses: number; iva: number; seguro: number; total: number; saldo: number;
} {
  const capital   = f.pagoCapital   ?? f.capital   ?? 0;
  const intereses = f.pagoIntereses ?? f.interes   ?? 0;
  const iva       = f.iva     ?? 0;
  const seguro    = f.seguro  ?? 0;
  const total     = f.pagoTotal     ?? f.total     ?? (capital + intereses + iva + seguro);
  const saldo     = f.saldo   ?? 0;
  return { capital, intereses, iva, seguro, total, saldo };
}

// ─── Construcción del HTML ────────────────────────────────────────────────────

const ROWS_PER_PAGE = 27; // filas de datos por página (sin contar encabezado de tabla)

export function imprimirCorrida(data: CorridaData): void {
  const ahora = new Date();
  const fechaGen = ahora.toLocaleDateString('es-MX', {
    day: '2-digit', month: '2-digit', year: 'numeric',
  }) + ' ' + ahora.toLocaleTimeString('es-MX', { hour: '2-digit', minute: '2-digit', second: '2-digit' });

  const tasaMensual = data.tasaAnual / 12;
  const comPorcStr  = data.comisionAperturaPorc != null
    ? fmtPct(data.comisionAperturaPorc)
    : (data.monto > 0 ? fmtPct(data.comisionApertura / data.monto) : '—');
  const catStr = data.cat != null ? fmtPct(data.cat, 1) : '—';

  // Fila 0 (saldo inicial) + todas las filas normales
  type FilaNorm = { mes: number; fecha: string; capital: number; intereses: number; iva: number; seguro: number; total: number; saldo: number; isZero?: boolean };
  const todasFilas: FilaNorm[] = [
    { mes: 0, fecha: '', capital: 0, intereses: 0, iva: 0, seguro: 0, total: 0, saldo: data.monto, isZero: true },
    ...data.filas.map(f => {
      const n = normFila(f);
      return { mes: f.mes, fecha: fmtFecha(f.fecha), ...n };
    }),
  ];

  // Calcular totales
  const totalCapital   = data.filas.reduce((s, f) => s + (normFila(f).capital),   0);
  const totalIntereses = data.filas.reduce((s, f) => s + (normFila(f).intereses), 0);
  const totalIva       = data.filas.reduce((s, f) => s + (normFila(f).iva),       0);
  const totalSeguro    = data.filas.reduce((s, f) => s + (normFila(f).seguro),    0);
  const totalPagado    = data.filas.reduce((s, f) => s + (normFila(f).total),     0);

  // Dividir en páginas
  const filasSinCero   = todasFilas.slice(1);   // las 0 va sola en página 1
  const totalPaginas   = Math.ceil((todasFilas.length) / ROWS_PER_PAGE) || 1;

  // Construir páginas: pág 1 incluye fila 0 + primeras (ROWS_PER_PAGE-1) filas normales
  const paginas: FilaNorm[][] = [];
  const filasPag1 = [todasFilas[0], ...filasSinCero.slice(0, ROWS_PER_PAGE - 1)];
  paginas.push(filasPag1);
  for (let i = ROWS_PER_PAGE - 1; i < filasSinCero.length; i += ROWS_PER_PAGE) {
    paginas.push(filasSinCero.slice(i, i + ROWS_PER_PAGE));
  }

  // ── Bloques HTML reutilizables ────────────────────────────────────────────

  const headerHTML = `
    <div class="page-header">
      <div class="header-logo">
        <div class="logo-diamond">&#9671;</div>
        <div class="logo-text">
          <span class="logo-name">inyecta</span>
          <span class="logo-sub">SOLUCIONES DE CAPITAL</span>
        </div>
      </div>
      <div class="header-center">
        <div class="company-name">FSMP SOLUCIONES DE CAPITAL, S.A. DE C.V., SOFOM, E.N.R.</div>
        <div class="doc-title">AMORTIZACIÓN</div>
      </div>
      <div class="header-date">${fechaGen}</div>
    </div>`;

  const infoHTML = `
    <div class="info-block">
      <table class="info-table">
        <tr>
          <td class="info-label">Cliente</td>
          <td class="info-value">${data.nombre}</td>
          <td class="info-label">Tasa Anual (%)</td>
          <td class="info-value">${fmtPct(data.tasaAnual)}</td>
        </tr>
        <tr>
          <td class="info-label">Importe</td>
          <td class="info-value">${fmt(data.monto)}</td>
          <td class="info-label">Tasa Mensual (%)</td>
          <td class="info-value">${fmtPct(tasaMensual, 2)}</td>
        </tr>
        <tr>
          <td class="info-label">No. de Pagos</td>
          <td class="info-value">${data.plazoMeses}</td>
          <td class="info-label">CAT</td>
          <td class="info-value cat-cell">${catStr} <span class="cat-note">Sin IVA para fines informativos y de comparación.</span></td>
        </tr>
        <tr>
          <td class="info-label">Frecuencia De Pago</td>
          <td class="info-value">Mensual</td>
          <td class="info-label">Comisión Por Apertura</td>
          <td class="info-value">${fmt(data.comisionApertura)} <span class="pct-note">${comPorcStr}</span></td>
        </tr>
      </table>
    </div>`;

  const tableHeaderHTML = `
    <thead>
      <tr class="th-row">
        <th>No. Periodo</th>
        <th>Fecha</th>
        <th>Pago Capital</th>
        <th>Pago Intereses</th>
        <th>Pago IVA</th>
        <th>Seguro</th>
        <th>Pago Total</th>
        <th>Saldo Capital</th>
      </tr>
    </thead>`;

  const footerAddr = `Av. Sierra Vista 1305, Piso 4 Oficina 7, Col. Lomas del Tecnológico, C.P. 78215, San Luis Potosí, S.L.P.<br>
    Teléfonos: 444-521-7204 / 444-521-6980&nbsp;&nbsp;&nbsp;E-mail: contacto@inyecta.com.mx&nbsp;&nbsp;&nbsp;Página web: www.inyecta.com.mx`;

  // ── Generar filas HTML ────────────────────────────────────────────────────
  const filasHtml = (filas: FilaNorm[], incluyeTotales: boolean, numPag: number): string => {
    let out = '';
    filas.forEach((f, idx) => {
      const cls = idx % 2 === 0 ? 'row-even' : 'row-odd';
      if (f.isZero) {
        out += `<tr class="${cls} row-zero">
          <td class="center">${f.mes}</td>
          <td class="center">—</td>
          <td></td><td></td><td></td><td></td><td></td>
          <td class="right bold">${fmt(f.saldo)}</td>
        </tr>`;
      } else {
        out += `<tr class="${cls}">
          <td class="center">${f.mes}</td>
          <td class="center">${f.fecha}</td>
          <td class="right">${fmt(f.capital)}</td>
          <td class="right">${fmt(f.intereses)}</td>
          <td class="right">${fmt(f.iva)}</td>
          <td class="right">${fmt(f.seguro)}</td>
          <td class="right bold">${fmt(f.total)}</td>
          <td class="right">${fmt(f.saldo)}</td>
        </tr>`;
      }
    });

    if (incluyeTotales) {
      out += `<tr class="totales-row">
        <td colspan="2" class="left">Totales</td>
        <td class="right">${fmt(totalCapital)}</td>
        <td class="right">${fmt(totalIntereses)}</td>
        <td class="right">${fmt(totalIva)}</td>
        <td class="right">${fmt(totalSeguro)}</td>
        <td class="right">${fmt(totalPagado)}</td>
        <td class="right">—</td>
      </tr>`;
    }
    return out;
  };

  // ── Ensamblar páginas ─────────────────────────────────────────────────────
  let paginasHTML = '';
  paginas.forEach((filasBloque, idx) => {
    const numPag    = idx + 1;
    const esUltima  = numPag === paginas.length;
    const esFirst   = numPag === 1;

    paginasHTML += `
    <div class="pagina${idx < paginas.length - 1 ? ' page-break' : ''}">
      ${headerHTML}
      ${esFirst ? infoHTML : ''}
      <table class="amort-table">
        ${tableHeaderHTML}
        <tbody>${filasHtml(filasBloque, esUltima, numPag)}</tbody>
      </table>
      <div class="page-footer">
        <div class="footer-left">
          <div class="footer-logo">
            <span class="footer-diamond">&#9671;</span>
            <span class="footer-brand">inyecta</span>
          </div>
          <div class="footer-addr">${footerAddr}</div>
        </div>
        <div class="footer-right">Página/Page ${numPag} / ${paginas.length}</div>
      </div>
    </div>`;
  });

  // ── Estilos ───────────────────────────────────────────────────────────────
  const styles = `
    @page { size: letter portrait; margin: 0; }
    * { box-sizing: border-box; margin: 0; padding: 0; font-family: Arial, Helvetica, sans-serif; }
    body { background: #fff; color: #1a1a1a; font-size: 9pt; }

    .pagina {
      width: 216mm;
      min-height: 279mm;
      padding: 14mm 14mm 12mm 14mm;
      display: flex;
      flex-direction: column;
    }
    .page-break { page-break-after: always; }

    /* ── Header ── */
    .page-header {
      display: flex;
      align-items: flex-start;
      justify-content: space-between;
      margin-bottom: 10px;
      padding-bottom: 8px;
      border-bottom: 2px solid #1a1a1a;
    }
    .header-logo { display: flex; align-items: center; gap: 8px; min-width: 130px; }
    .logo-diamond { color: #c9a227; font-size: 22pt; line-height: 1; }
    .logo-name { display: block; font-size: 16pt; font-weight: 900; letter-spacing: -0.5px; color: #1a1a1a; }
    .logo-sub  { display: block; font-size: 5.5pt; color: #888; letter-spacing: 2px; text-transform: uppercase; }
    .header-center { text-align: center; flex: 1; padding: 0 10px; }
    .company-name { font-size: 9.5pt; font-weight: 700; }
    .doc-title    { font-size: 11pt; font-weight: 900; margin-top: 3px; letter-spacing: 1px; }
    .header-date  { font-size: 7.5pt; color: #555; text-align: right; min-width: 130px; white-space: nowrap; padding-top: 4px; }

    /* ── Info block ── */
    .info-block { margin-bottom: 10px; }
    .info-table { width: 100%; border-collapse: collapse; font-size: 8.5pt; }
    .info-table td { padding: 2.5px 6px; vertical-align: top; }
    .info-label { font-weight: 700; width: 130px; color: #333; }
    .info-value { min-width: 160px; }
    .cat-cell   { }
    .cat-note   { font-size: 7pt; color: #888; margin-left: 6px; }
    .pct-note   { font-size: 8pt; color: #555; margin-left: 6px; }

    /* ── Tabla ── */
    .amort-table { width: 100%; border-collapse: collapse; font-size: 8pt; flex: 1; }
    .th-row th {
      background: #1a1a1a; color: #fff;
      padding: 5px 6px; text-align: right;
      font-weight: 600; font-size: 7.5pt;
      border: 1px solid #333;
    }
    .th-row th:first-child,
    .th-row th:nth-child(2) { text-align: center; }

    .row-even { background: #fff; }
    .row-odd  { background: #f5f5f5; }
    .row-zero td { color: #666; font-style: italic; }

    .amort-table tbody td {
      padding: 3.5px 6px;
      border-bottom: 1px solid #e8e8e8;
      border-left: 1px solid #e8e8e8;
    }
    .amort-table tbody td:last-child { border-right: 1px solid #e8e8e8; }

    .center { text-align: center; }
    .right  { text-align: right; }
    .left   { text-align: left; }
    .bold   { font-weight: 700; }

    .totales-row td {
      background: #1a1a1a; color: #fff;
      padding: 5px 6px; font-weight: 700;
      font-size: 8pt; text-align: right;
      border: 1px solid #333;
    }
    .totales-row td:first-child { text-align: left; }

    /* ── Footer ── */
    .page-footer {
      display: flex;
      justify-content: space-between;
      align-items: flex-end;
      margin-top: 10px;
      padding-top: 6px;
      border-top: 1px solid #ccc;
      font-size: 6.5pt;
      color: #666;
    }
    .footer-left  { display: flex; align-items: flex-start; gap: 6px; }
    .footer-logo  { display: flex; align-items: center; gap: 3px; white-space: nowrap; }
    .footer-diamond { color: #c9a227; font-size: 11pt; }
    .footer-brand   { font-size: 9pt; font-weight: 900; color: #1a1a1a; }
    .footer-addr    { line-height: 1.5; color: #777; }
    .footer-right   { font-size: 7.5pt; font-weight: 600; color: #333; white-space: nowrap; margin-left: 10px; align-self: flex-end; }

    @media print {
      * { -webkit-print-color-adjust: exact; print-color-adjust: exact; }
      body { background: #fff; }
    }
  `;

  // ── Abrir ventana ─────────────────────────────────────────────────────────
  const w = window.open('', '_blank', 'width=900,height=750');
  if (!w) {
    alert('Por favor permite ventanas emergentes (pop-ups) en este sitio para generar corridas.');
    return;
  }

  const tipoLabel =
    data.tipo === 'acreditado'    ? 'Corrida del Acreditado' :
    data.tipo === 'inversionista' ? 'Corrida del Inversionista' :
    'Corrida Maestra SOFOM';

  w.document.write(`<!DOCTYPE html>
<html lang="es">
<head>
  <meta charset="UTF-8">
  <title>${tipoLabel} — ${data.nombre}</title>
  <style>${styles}</style>
</head>
<body>
  ${paginasHTML}
</body>
</html>`);
  w.document.close();
  w.focus();
  setTimeout(() => w.print(), 800);
}
