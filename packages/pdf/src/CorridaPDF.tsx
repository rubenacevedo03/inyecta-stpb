import React from 'react';
import { Document, Page, Text, View, StyleSheet } from '@react-pdf/renderer';

const styles = StyleSheet.create({
  page: {
    fontFamily: 'Helvetica',
    fontSize: 9,
    padding: '1.5cm',
    color: '#1a1a1a',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 14,
    paddingBottom: 10,
    borderBottomWidth: 1.5,
    borderBottomColor: '#c9a227',
  },
  logoText: { fontSize: 20, fontFamily: 'Helvetica-Bold', letterSpacing: -0.5 },
  logoSub: { fontSize: 7, color: '#888', letterSpacing: 2, marginTop: 2 },
  title: { fontSize: 13, fontFamily: 'Helvetica-Bold', textTransform: 'uppercase', letterSpacing: 2 },
  subtitle: { fontSize: 8, color: '#666', marginTop: 2, textAlign: 'center' },
  badge: { fontSize: 8, fontFamily: 'Helvetica-Bold', letterSpacing: 1, textTransform: 'uppercase', marginBottom: 10 },
  metaGrid: { flexDirection: 'row', flexWrap: 'wrap', marginBottom: 14, padding: 10, border: '1 solid #e0e0e0', borderRadius: 4 },
  metaItem: { width: '50%', flexDirection: 'row', marginBottom: 4 },
  metaLabel: { fontFamily: 'Helvetica-Bold', color: '#555', width: 120, fontSize: 8.5 },
  metaValue: { fontSize: 8.5 },
  tableHeader: { flexDirection: 'row', backgroundColor: '#1a1a1a', padding: '5 6' },
  th: { color: '#fff', fontFamily: 'Helvetica-Bold', fontSize: 7.5, textTransform: 'uppercase', textAlign: 'right' },
  thLeft: { color: '#fff', fontFamily: 'Helvetica-Bold', fontSize: 7.5, textAlign: 'center' },
  row: { flexDirection: 'row', padding: '4 6', borderBottomWidth: 0.5, borderBottomColor: '#e8e8e8' },
  rowAlt: { backgroundColor: '#f8f9fa' },
  td: { fontSize: 8.5, textAlign: 'right', fontFamily: 'Helvetica' },
  tdCenter: { fontSize: 8.5, textAlign: 'center', color: '#555' },
  totalRow: { flexDirection: 'row', backgroundColor: '#1a1a1a', padding: '5 6' },
  totalTd: { color: '#fff', fontFamily: 'Helvetica-Bold', fontSize: 8.5, textAlign: 'right' },
  footer: {
    marginTop: 20,
    paddingTop: 8,
    borderTopWidth: 0.5,
    borderTopColor: '#e0e0e0',
    fontSize: 7.5,
    color: '#999',
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
});

const COL_WIDTHS = {
  no: 30,
  fecha: 65,
  capital: 75,
  intereses: 75,
  iva: 55,
  seguro: 50,
  total: 75,
  saldo: 75,
};

function fmtMXN(n: number): string {
  return '$' + n.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

function fmtDate(d: Date): string {
  const date = new Date(d);
  const day = date.getDate().toString().padStart(2, '0');
  const month = (date.getMonth() + 1).toString().padStart(2, '0');
  const year = date.getFullYear();
  return `${day}/${month}/${year}`;
}

function fmtPct(n: number, dec = 0): string {
  return (n * 100).toFixed(dec) + '%';
}

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

export interface CorridaPDFProps {
  tipo: 'ACREDITADO' | 'INVERSIONISTA';
  clienteNombre: string;
  inversionistaNombre?: string;
  participacion?: number;
  amort: ResultadoAmort;
  tasaAnual: number;
  meses: number;
  comisionApertura?: number;
  cat?: number;
  generadoEn: Date;
}

export function CorridaPDF({
  tipo,
  clienteNombre,
  inversionistaNombre,
  participacion,
  amort,
  tasaAnual,
  meses,
  comisionApertura,
  cat,
  generadoEn,
}: CorridaPDFProps) {
  return (
    <Document>
      <Page size="LETTER" orientation="landscape" style={styles.page}>
        {/* Header */}
        <View style={styles.header}>
          <View>
            <Text style={styles.logoText}>&#9671; inyecta</Text>
            <Text style={styles.logoSub}>SOLUCIONES DE CAPITAL</Text>
          </View>
          <View style={{ textAlign: 'center' }}>
            <Text style={styles.title}>Amortizacion</Text>
            <Text style={styles.subtitle}>
              FSMP SOLUCIONES DE CAPITAL, S.A. DE C.V., SOFOM, E.N.R.
            </Text>
          </View>
          <Text style={{ fontSize: 8, color: '#888' }}>
            {fmtDate(generadoEn)}
          </Text>
        </View>

        {/* Badge */}
        <Text
          style={[
            styles.badge,
            { color: tipo === 'ACREDITADO' ? '#856404' : '#155724' },
          ]}
        >
          {tipo}
          {inversionistaNombre ? ` — ${inversionistaNombre}` : ''}
          {participacion ? ` | Participacion: ${fmtPct(participacion, 1)}` : ''}
        </Text>

        {/* Meta grid */}
        <View style={styles.metaGrid}>
          {[
            ['Cliente', clienteNombre],
            ['Tasa Anual (%)', fmtPct(tasaAnual, 0)],
            ['Importe', fmtMXN(amort.saldoInicial)],
            ['Tasa Mensual (%)', fmtPct(tasaAnual / 12, 2)],
            ['No. de Pagos', String(meses)],
            ['CAT', cat ? fmtPct(cat, 1) + ' (sin IVA, informativo)' : 'N/A'],
            ['Frecuencia De Pago', 'Mensual'],
            [
              'Comision Por Apertura',
              comisionApertura
                ? fmtMXN(comisionApertura) + ' (3.0%)'
                : 'N/A',
            ],
          ].map(([label, value]) => (
            <View style={styles.metaItem} key={label}>
              <Text style={styles.metaLabel}>{label}</Text>
              <Text style={styles.metaValue}>{value}</Text>
            </View>
          ))}
        </View>

        {/* Table header */}
        <View style={styles.tableHeader}>
          <Text style={[styles.thLeft, { width: COL_WIDTHS.no }]}>No.</Text>
          <Text style={[styles.thLeft, { width: COL_WIDTHS.fecha }]}>Fecha</Text>
          <Text style={[styles.th, { width: COL_WIDTHS.capital }]}>Pago Capital</Text>
          <Text style={[styles.th, { width: COL_WIDTHS.intereses }]}>Pago Intereses</Text>
          <Text style={[styles.th, { width: COL_WIDTHS.iva }]}>Pago IVA</Text>
          <Text style={[styles.th, { width: COL_WIDTHS.seguro }]}>Seguro</Text>
          <Text style={[styles.th, { width: COL_WIDTHS.total }]}>Pago Total</Text>
          <Text style={[styles.th, { width: COL_WIDTHS.saldo }]}>Saldo Capital</Text>
        </View>

        {/* Row 0 — initial balance */}
        <View style={styles.row}>
          <Text style={[styles.tdCenter, { width: COL_WIDTHS.no }]}>0</Text>
          <Text style={{ width: COL_WIDTHS.fecha }}> </Text>
          <Text style={{ width: COL_WIDTHS.capital }}> </Text>
          <Text style={{ width: COL_WIDTHS.intereses }}> </Text>
          <Text style={{ width: COL_WIDTHS.iva }}> </Text>
          <Text style={{ width: COL_WIDTHS.seguro }}> </Text>
          <Text style={{ width: COL_WIDTHS.total }}> </Text>
          <Text style={[styles.td, { width: COL_WIDTHS.saldo }]}>
            {fmtMXN(amort.saldoInicial)}
          </Text>
        </View>

        {/* Data rows */}
        {amort.filas.map((fila, i) => (
          <View
            key={i}
            style={[styles.row, i % 2 !== 0 ? styles.rowAlt : {}]}
          >
            <Text style={[styles.tdCenter, { width: COL_WIDTHS.no }]}>
              {fila.mes}
            </Text>
            <Text style={[styles.tdCenter, { width: COL_WIDTHS.fecha }]}>
              {fmtDate(fila.fecha)}
            </Text>
            <Text style={[styles.td, { width: COL_WIDTHS.capital }]}>
              {fmtMXN(fila.pagoCapital)}
            </Text>
            <Text style={[styles.td, { width: COL_WIDTHS.intereses }]}>
              {fmtMXN(fila.pagoIntereses)}
            </Text>
            <Text style={[styles.td, { width: COL_WIDTHS.iva }]}>$0.00</Text>
            <Text style={[styles.td, { width: COL_WIDTHS.seguro }]}>$0.00</Text>
            <Text style={[styles.td, { width: COL_WIDTHS.total }]}>
              {fmtMXN(fila.pagoTotal)}
            </Text>
            <Text style={[styles.td, { width: COL_WIDTHS.saldo }]}>
              {fmtMXN(fila.saldo)}
            </Text>
          </View>
        ))}

        {/* Totals row */}
        <View style={styles.totalRow}>
          <Text
            style={[
              styles.totalTd,
              {
                width: COL_WIDTHS.no + COL_WIDTHS.fecha,
                textAlign: 'left',
              },
            ]}
          >
            Totales
          </Text>
          <Text style={[styles.totalTd, { width: COL_WIDTHS.capital }]}>
            {fmtMXN(amort.saldoInicial)}
          </Text>
          <Text style={[styles.totalTd, { width: COL_WIDTHS.intereses }]}>
            {fmtMXN(amort.totalIntereses)}
          </Text>
          <Text style={[styles.totalTd, { width: COL_WIDTHS.iva }]}>
            $0.00
          </Text>
          <Text style={[styles.totalTd, { width: COL_WIDTHS.seguro }]}>
            $0.00
          </Text>
          <Text style={[styles.totalTd, { width: COL_WIDTHS.total }]}>
            {fmtMXN(amort.totalPagado)}
          </Text>
          <Text style={{ width: COL_WIDTHS.saldo }}> </Text>
        </View>

        {/* Footer */}
        <View style={styles.footer}>
          <Text>
            Av. Sierra Vista 1305, Piso 4 Oficina 7, Col. Lomas del
            Tecnologico, C.P. 78215, San Luis Potosi, S.L.P.
          </Text>
          <Text>
            Tel: 444-521-7204 / 444-521-6980 | contacto@inyecta.com.mx |
            www.inyecta.com.mx
          </Text>
        </View>
      </Page>
    </Document>
  );
}
