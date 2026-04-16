// Utility: open a print window with a formatted corrida

export interface CorridaData {
  tipo: 'acreditado' | 'inversionista' | 'maestra';
  nombre: string;
  monto: number;
  tasaAnual: number;  // as decimal (0.18 = 18%)
  plazoMeses: number;
  pmt: number;
  comisionApertura: number;  // amount in MXN
  totalIntereses: number;
  totalPagado: number;
  filas: { mes: number; fecha: Date | string; capital: number; interes: number; total: number; saldo: number }[];
}

export function imprimirCorrida(data: CorridaData): void {
  const fmt = (n: number) =>
    new Intl.NumberFormat('es-MX', { style: 'currency', currency: 'MXN', maximumFractionDigits: 2 }).format(n);
  const fmtPct = (n: number) => (n * 100).toFixed(2) + '%';
  const fmtDate = (d: Date | string) =>
    new Date(d).toLocaleDateString('es-MX', { day: '2-digit', month: 'short', year: 'numeric' });

  const tipoLabel =
    data.tipo === 'acreditado' ? 'Corrida del Acreditado' :
    data.tipo === 'inversionista' ? 'Corrida del Inversionista' :
    'Corrida Maestra SOFOM';

  const rows = data.filas.map((f, i) => `
    <tr class="${i % 2 === 0 ? 'even' : 'odd'}">
      <td class="center gray">${f.mes}</td>
      <td class="center">${fmtDate(f.fecha)}</td>
      <td class="right">${fmt(f.capital)}</td>
      <td class="right">${fmt(f.interes)}</td>
      <td class="right bold">${fmt(f.total)}</td>
      <td class="right">${fmt(f.saldo)}</td>
    </tr>
  `).join('');

  const html = `<!DOCTYPE html>
<html lang="es">
<head>
  <meta charset="UTF-8">
  <title>${tipoLabel} — ${data.nombre}</title>
  <style>
    @page { size: letter landscape; margin: 1.5cm; }
    * { box-sizing: border-box; margin: 0; padding: 0; font-family: Arial, Helvetica, sans-serif; }
    body { color: #1a1a1a; font-size: 10pt; }

    .header { display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 18px; padding-bottom: 12px; border-bottom: 3px solid #c9a227; }
    .brand { font-size: 24pt; font-weight: 900; letter-spacing: -1px; }
    .brand-diamond { color: #c9a227; }
    .brand-sub { font-size: 7pt; color: #888; letter-spacing: 3px; text-transform: uppercase; margin-top: 2px; }
    .doc-info { text-align: right; }
    .doc-info h2 { font-size: 14pt; font-weight: 700; }
    .doc-info p { font-size: 8pt; color: #888; margin-top: 4px; }

    .meta { display: grid; grid-template-columns: repeat(4, 1fr); gap: 8px; margin-bottom: 16px; }
    .meta-card { background: #f8f8f8; border: 1px solid #e5e5e5; border-radius: 5px; padding: 8px 12px; }
    .meta-card.gold { background: #fffdf0; border-color: #c9a227; }
    .meta-label { font-size: 7pt; color: #999; text-transform: uppercase; letter-spacing: 0.5px; margin-bottom: 3px; }
    .meta-value { font-size: 11pt; font-weight: 700; }
    .meta-card.gold .meta-value { color: #b8900f; }

    table { width: 100%; border-collapse: collapse; font-size: 8.5pt; }
    thead tr { background: #1a1a1a; color: white; }
    thead th { padding: 7px 10px; text-align: right; font-weight: 600; }
    thead th.center { text-align: center; }
    tbody tr.even { background: #ffffff; }
    tbody tr.odd { background: #f9f9f9; }
    td { padding: 4.5px 10px; border-bottom: 1px solid #f0f0f0; }
    td.center { text-align: center; }
    td.gray { color: #888; }
    td.right { text-align: right; }
    td.bold { font-weight: 600; }
    tfoot tr { background: #1a1a1a; color: white; }
    tfoot td { padding: 7px 10px; font-weight: 700; text-align: right; }
    tfoot td:first-child { text-align: left; }

    .footer { margin-top: 14px; display: flex; justify-content: space-between; font-size: 7pt; color: #bbb; border-top: 1px solid #eee; padding-top: 8px; }
    @media print { * { -webkit-print-color-adjust: exact; print-color-adjust: exact; } }
  </style>
</head>
<body>
  <div class="header">
    <div>
      <div class="brand"><span class="brand-diamond">&#9671;</span> inyecta</div>
      <div class="brand-sub">Soluciones de Capital</div>
    </div>
    <div class="doc-info">
      <h2>${tipoLabel}</h2>
      <p>Generado el ${new Date().toLocaleDateString('es-MX', { day: '2-digit', month: 'long', year: 'numeric' })}</p>
    </div>
  </div>

  <div class="meta">
    <div class="meta-card">
      <div class="meta-label">Nombre / Referencia</div>
      <div class="meta-value" style="font-size:9pt">${data.nombre}</div>
    </div>
    <div class="meta-card gold">
      <div class="meta-label">Pago Mensual</div>
      <div class="meta-value">${fmt(data.pmt)}</div>
    </div>
    <div class="meta-card">
      <div class="meta-label">Monto del Crédito</div>
      <div class="meta-value">${fmt(data.monto)}</div>
    </div>
    <div class="meta-card">
      <div class="meta-label">Tasa Anual</div>
      <div class="meta-value">${fmtPct(data.tasaAnual)}</div>
    </div>
    <div class="meta-card">
      <div class="meta-label">Plazo</div>
      <div class="meta-value">${data.plazoMeses} meses</div>
    </div>
    <div class="meta-card">
      <div class="meta-label">Comisión Apertura</div>
      <div class="meta-value">${fmt(data.comisionApertura)}</div>
    </div>
    <div class="meta-card">
      <div class="meta-label">Total Intereses</div>
      <div class="meta-value">${fmt(data.totalIntereses)}</div>
    </div>
    <div class="meta-card gold">
      <div class="meta-label">Total a Pagar</div>
      <div class="meta-value">${fmt(data.totalPagado)}</div>
    </div>
  </div>

  <table>
    <thead>
      <tr>
        <th class="center" style="width:40px">No.</th>
        <th class="center" style="width:110px">Fecha de Pago</th>
        <th>Capital</th>
        <th>Interés</th>
        <th>Pago Total</th>
        <th>Saldo</th>
      </tr>
    </thead>
    <tbody>
      <tr class="even">
        <td class="center gray">0</td>
        <td class="center gray">—</td>
        <td class="right" colspan="3"></td>
        <td class="right bold">${fmt(data.monto)}</td>
      </tr>
      ${rows}
    </tbody>
    <tfoot>
      <tr>
        <td colspan="2">Totales</td>
        <td>${fmt(data.monto)}</td>
        <td>${fmt(data.totalIntereses)}</td>
        <td>${fmt(data.totalPagado)}</td>
        <td>—</td>
      </tr>
    </tfoot>
  </table>

  <div class="footer">
    <span>FSMP Soluciones de Capital, S.A. de C.V., SOFOM, E.N.R. — Inyecta</span>
    <span>Documento generado por sistema Inyecta STPB — Confidencial</span>
  </div>
</body>
</html>`;

  const w = window.open('', '_blank', 'width=1100,height=800');
  if (!w) {
    alert('Por favor permite ventanas emergentes (pop-ups) en este sitio para generar PDFs.');
    return;
  }
  w.document.write(html);
  w.document.close();
  w.focus();
  setTimeout(() => w.print(), 600);
}
