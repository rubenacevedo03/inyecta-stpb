import { useState, useMemo } from 'react';
import { Calculator, Plus, Trash2, Download, FileText, Save, FolderOpen, X } from 'lucide-react';
import { imprimirCorrida } from '../lib/printPDF';

type Producto = 'PYME' | 'PERSONAL' | 'EXPRESS' | 'STPB';
type ModoCaptura = 'MONTO' | 'PORCENTAJE';

interface InversionistaLocal {
  id: string;
  nombre: string;
  modo: ModoCaptura;
  valor: number;
  tasaNeta: number;
  esSofom: boolean;
}

interface CotizacionGuardada {
  id: string;
  nombre: string;
  fecha: string;
  producto: Producto;
  monto: number;
  tasaAnual: number;
  plazoMeses: number;
  fechaPrimerPago: string;
  comisionApertura: number;
  spreadSofom: number;
  adminFid: number;
  cobranza: number;
  sofomAcreditante: boolean;
  inversionistas: InversionistaLocal[];
}

const STORAGE_KEY = 'inyecta_cotizaciones';

const PRODUCTOS: { value: Producto; label: string }[] = [
  { value: 'PYME', label: 'PyME' },
  { value: 'PERSONAL', label: 'Personal' },
  { value: 'EXPRESS', label: 'Express' },
  { value: 'STPB', label: 'Sé Tu Propio Banco' },
];

function safeAddMonths(base: Date, months: number): Date {
  const baseDay = base.getDate();
  const totalMonths = base.getMonth() + months;
  const yr = base.getFullYear() + Math.floor(totalMonths / 12);
  const mo = ((totalMonths % 12) + 12) % 12;
  const maxDay = new Date(yr, mo + 1, 0).getDate();
  return new Date(yr, mo, Math.min(baseDay, maxDay));
}

function calcAmort(principal: number, tasaAnual: number, meses: number, fechaPrimerPago: Date) {
  const r = tasaAnual / 12;
  const factor = Math.pow(1 + r, meses);
  const PMT = r === 0 ? principal / meses : (principal * r * factor) / (factor - 1);
  const filas: any[] = [];
  let saldo = principal;
  let totalIntereses = 0;
  for (let i = 1; i <= meses; i++) {
    const interes = saldo * r;
    const capital = PMT - interes;
    totalIntereses += interes;
    saldo = Math.max(0, saldo - capital);
    const fecha = safeAddMonths(fechaPrimerPago, i - 1);
    filas.push({ mes: i, fecha, capital: r2(capital), interes: r2(interes), total: r2(PMT), saldo: r2(saldo) });
  }
  return { pmt: r2(PMT), totalIntereses: r2(totalIntereses), totalPagado: r2(PMT * meses), filas, saldoInicial: principal };
}

function r2(n: number) { return Math.round(n * 100) / 100; }
const fmtMXN = (n: number) => new Intl.NumberFormat('es-MX', { style: 'currency', currency: 'MXN' }).format(n);
const fmtPct = (n: number, d = 1) => (n * 100).toFixed(d) + '%';

function getCotizaciones(): CotizacionGuardada[] {
  try { return JSON.parse(localStorage.getItem(STORAGE_KEY) || '[]'); } catch { return []; }
}
function saveCotizaciones(list: CotizacionGuardada[]) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(list));
}

export default function Cotizador() {
  const [nombre, setNombre] = useState('');
  const [producto, setProducto] = useState<Producto>('STPB');
  const [monto, setMonto] = useState(5000000);
  const [tasaAnual, setTasaAnual] = useState(36);
  const [plazoMeses, setPlazoMeses] = useState(24);
  const [fechaPrimerPago, setFechaPrimerPago] = useState(() => {
    const d = new Date(); d.setMonth(d.getMonth() + 1);
    return `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-01`;
  });
  const [comisionApertura, setComisionApertura] = useState(3);

  // STPB params
  const [spreadSofom, setSpreadSofom] = useState(12);
  const [adminFid, setAdminFid] = useState(1.5);
  const [cobranza, setCobranza] = useState(0.5);
  const [sofomAcreditante, setSofomAcreditante] = useState(false);
  const [inversionistas, setInversionistas] = useState<InversionistaLocal[]>([]);

  // Saved cotizaciones UI
  const [showGuardadas, setShowGuardadas] = useState(false);
  const [cotizacionesGuardadas, setCotizacionesGuardadas] = useState<CotizacionGuardada[]>(getCotizaciones);

  const tasaDecimal = tasaAnual / 100;

  const amort = useMemo(() => {
    if (monto <= 0 || tasaDecimal < 0 || plazoMeses <= 0) return null;
    return calcAmort(monto, tasaDecimal, plazoMeses, new Date(fechaPrimerPago + 'T12:00:00'));
  }, [monto, tasaDecimal, plazoMeses, fechaPrimerPago]);

  const invData = useMemo(() => {
    if (!amort || producto !== 'STPB') return [];
    return inversionistas.map(inv => {
      const montoInv = inv.modo === 'MONTO' ? inv.valor : monto * (inv.valor / 100);
      const pctInv = inv.modo === 'PORCENTAJE' ? inv.valor : (inv.valor / monto) * 100;
      const amortInv = calcAmort(montoInv, inv.tasaNeta / 100, plazoMeses, new Date(fechaPrimerPago + 'T12:00:00'));
      return { ...inv, montoReal: r2(montoInv), porcentajeReal: r2(pctInv), amort: amortInv };
    });
  }, [inversionistas, monto, plazoMeses, fechaPrimerPago, amort, producto]);

  const totalPctInv = invData.reduce((s, inv) => s + inv.porcentajeReal, 0);
  const pctValido = Math.abs(totalPctInv - 100) < 0.01;

  const ingresosSofom = useMemo(() => {
    if (!amort || producto !== 'STPB') return null;
    const apertura = monto * (comisionApertura / 100);
    const spreadTotal = amort.filas.reduce((s: number, f: any) => {
      const saldoAnt = f.mes === 1 ? monto : amort.filas[f.mes - 2].saldo;
      return s + saldoAnt * (spreadSofom / 100 / 12);
    }, 0);
    const adminTotal = amort.filas.reduce((s: number, f: any) => {
      const saldoAnt = f.mes === 1 ? monto : amort.filas[f.mes - 2].saldo;
      return s + saldoAnt * (adminFid / 100 / 12);
    }, 0);
    const cobranzaTotal = amort.totalPagado * (cobranza / 100);
    const ingresoBruto = apertura + spreadTotal + adminTotal + cobranzaTotal;
    const totalInteresesInv = invData.reduce((s, inv) => s + inv.amort.totalIntereses, 0);
    return {
      apertura: r2(apertura),
      spreadTotal: r2(spreadTotal),
      adminTotal: r2(adminTotal),
      cobranzaTotal: r2(cobranzaTotal),
      ingresoBruto: r2(ingresoBruto),
      totalInteresesInv: r2(totalInteresesInv),
    };
  }, [amort, monto, producto, comisionApertura, spreadSofom, adminFid, cobranza, invData]);

  const addInv = () => {
    setInversionistas(prev => [...prev, {
      id: Date.now().toString(),
      nombre: `Inversionista ${prev.length + 1}`,
      modo: 'PORCENTAJE',
      valor: Math.max(0, 100 - totalPctInv),
      tasaNeta: tasaAnual - spreadSofom,
      esSofom: false,
    }]);
  };

  const updateInv = (id: string, field: string, value: any) =>
    setInversionistas(prev => prev.map(inv => inv.id === id ? { ...inv, [field]: value } : inv));

  const removeInv = (id: string) =>
    setInversionistas(prev => prev.filter(inv => inv.id !== id));

  const numFmt = (setter: (v: number) => void) => (e: React.ChangeEvent<HTMLInputElement>) =>
    setter(parseFloat(e.target.value) || 0);

  const inputCls = "w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-[#c9a227] focus:border-[#c9a227] outline-none";
  const labelCls = "block text-xs font-medium text-gray-600 mb-1";

  // ── PDF helpers ──────────────────────────────────────────────────────────────
  const handlePrintAcreditado = () => {
    if (!amort) return;
    imprimirCorrida({
      tipo: 'acreditado',
      nombre: nombre || 'Acreditado',
      monto,
      tasaAnual: tasaDecimal,
      plazoMeses,
      pmt: amort.pmt,
      comisionApertura: monto * comisionApertura / 100,
      comisionAperturaPorc: comisionApertura / 100,
      totalIntereses: amort.totalIntereses,
      totalPagado: amort.totalPagado,
      filas: amort.filas,
    });
  };

  const handlePrintInv = (inv: typeof invData[0]) => {
    imprimirCorrida({
      tipo: 'inversionista',
      nombre: inv.nombre,
      monto: inv.montoReal,
      tasaAnual: inv.tasaNeta / 100,
      plazoMeses,
      pmt: inv.amort.pmt,
      comisionApertura: 0,
      totalIntereses: inv.amort.totalIntereses,
      totalPagado: inv.amort.totalPagado,
      filas: inv.amort.filas,
    });
  };

  const handlePrintMaestra = () => {
    if (!amort) return;
    imprimirCorrida({
      tipo: 'maestra',
      nombre: nombre || 'SOFOM — Inyecta',
      monto,
      tasaAnual: tasaDecimal,
      plazoMeses,
      pmt: amort.pmt,
      comisionApertura: monto * comisionApertura / 100,
      comisionAperturaPorc: comisionApertura / 100,
      totalIntereses: amort.totalIntereses,
      totalPagado: amort.totalPagado,
      filas: amort.filas,
      inversionistas: invData.map(inv => ({
        nombre: inv.nombre,
        monto: inv.montoReal,
        tasaNeta: inv.tasaNeta / 100,
        porcentaje: inv.porcentajeReal / 100,
        pmt: inv.amort.pmt,
        totalIntereses: inv.amort.totalIntereses,
        totalPagado: inv.amort.totalPagado,
        filas: inv.amort.filas,
      })),
      spreadSofomPorc: spreadSofom / 100,
      adminFideicomisoPorc: adminFid / 100,
      comisionCobranzaPorc: cobranza / 100,
    });
  };

  // ── Save / Load ──────────────────────────────────────────────────────────────
  const handleGuardar = () => {
    const ref = nombre.trim() || `Cotización ${new Date().toLocaleDateString('es-MX')}`;
    const nueva: CotizacionGuardada = {
      id: Date.now().toString(),
      nombre: ref,
      fecha: new Date().toISOString(),
      producto, monto, tasaAnual, plazoMeses, fechaPrimerPago,
      comisionApertura, spreadSofom, adminFid, cobranza,
      sofomAcreditante, inversionistas,
    };
    const updated = [nueva, ...cotizacionesGuardadas].slice(0, 30);
    saveCotizaciones(updated);
    setCotizacionesGuardadas(updated);
    alert(`Cotización "${ref}" guardada.`);
  };

  const handleCargar = (cot: CotizacionGuardada) => {
    setNombre(cot.nombre);
    setProducto(cot.producto);
    setMonto(cot.monto);
    setTasaAnual(cot.tasaAnual);
    setPlazoMeses(cot.plazoMeses);
    setFechaPrimerPago(cot.fechaPrimerPago);
    setComisionApertura(cot.comisionApertura);
    setSpreadSofom(cot.spreadSofom);
    setAdminFid(cot.adminFid);
    setCobranza(cot.cobranza);
    setSofomAcreditante(cot.sofomAcreditante);
    setInversionistas(cot.inversionistas);
    setShowGuardadas(false);
  };

  const handleEliminar = (id: string) => {
    const updated = cotizacionesGuardadas.filter(c => c.id !== id);
    saveCotizaciones(updated);
    setCotizacionesGuardadas(updated);
  };

  return (
    <div className="max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-[#1a1a1a] rounded-lg">
            <Calculator size={20} className="text-[#c9a227]" />
          </div>
          <div>
            <h1 className="text-2xl font-bold">Cotizador</h1>
            <p className="text-gray-500 text-sm">Calculadora financiera</p>
          </div>
        </div>
        <div className="flex gap-2">
          <button
            onClick={() => setShowGuardadas(true)}
            className="flex items-center gap-2 px-4 py-2 border border-gray-300 rounded-lg text-sm hover:bg-gray-50 transition-colors"
          >
            <FolderOpen size={14} />
            Mis Cotizaciones
            {cotizacionesGuardadas.length > 0 && (
              <span className="bg-[#c9a227] text-[#1a1a1a] text-xs font-bold rounded-full w-5 h-5 flex items-center justify-center">
                {cotizacionesGuardadas.length}
              </span>
            )}
          </button>
          <button
            onClick={handleGuardar}
            disabled={!amort}
            className="flex items-center gap-2 px-4 py-2 bg-[#1a1a1a] text-white rounded-lg text-sm hover:bg-gray-800 transition-colors disabled:opacity-40"
          >
            <Save size={14} />
            Guardar
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
        {/* ─── Left panel ────────────────────────────────────────────────────── */}
        <div className="xl:col-span-1 space-y-5">

          {/* Identificación */}
          <div className="bg-white rounded-xl p-5 shadow-sm border">
            <h3 className="font-semibold text-sm mb-4 text-gray-700 uppercase tracking-wide">Identificación</h3>
            <div className="space-y-3">
              <div>
                <label className={labelCls}>Nombre / Referencia</label>
                <input type="text" value={nombre} onChange={e => setNombre(e.target.value)} placeholder="Cotización #..." className={inputCls} />
              </div>
              <div>
                <label className={labelCls}>Producto</label>
                <select value={producto} onChange={e => setProducto(e.target.value as Producto)} className={inputCls}>
                  {PRODUCTOS.map(p => <option key={p.value} value={p.value}>{p.label}</option>)}
                </select>
              </div>
            </div>
          </div>

          {/* Parámetros */}
          <div className="bg-white rounded-xl p-5 shadow-sm border">
            <h3 className="font-semibold text-sm mb-4 text-gray-700 uppercase tracking-wide">Parámetros del Crédito</h3>
            <div className="space-y-3">
              <div>
                <label className={labelCls}>Monto del Crédito ($)</label>
                <input type="number" value={monto} onChange={numFmt(setMonto)} className={inputCls} />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className={labelCls}>Tasa Anual (%)</label>
                  <input type="number" step="0.1" value={tasaAnual} onChange={numFmt(setTasaAnual)} className={inputCls} />
                </div>
                <div>
                  <label className={labelCls}>Plazo (meses)</label>
                  <input type="number" value={plazoMeses} onChange={numFmt(setPlazoMeses)} className={inputCls} />
                </div>
              </div>
              <div>
                <label className={labelCls}>Fecha del Primer Pago</label>
                <input type="date" value={fechaPrimerPago} onChange={e => setFechaPrimerPago(e.target.value)} className={inputCls} />
              </div>
              <div>
                <label className={labelCls}>Comisión Apertura (%)</label>
                <input type="number" step="0.1" value={comisionApertura} onChange={numFmt(setComisionApertura)} className={inputCls} />
              </div>
            </div>
          </div>

          {/* STPB */}
          {producto === 'STPB' && (
            <div className="bg-white rounded-xl p-5 shadow-sm border">
              <h3 className="font-semibold text-sm mb-4 text-gray-700 uppercase tracking-wide">Distribución SOFOM</h3>
              <div className="space-y-3">
                <div className="grid grid-cols-3 gap-2">
                  <div>
                    <label className={labelCls}>Spread (%)</label>
                    <input type="number" step="0.1" value={spreadSofom} onChange={numFmt(setSpreadSofom)} className={inputCls} />
                  </div>
                  <div>
                    <label className={labelCls}>Admin Fid. (%)</label>
                    <input type="number" step="0.1" value={adminFid} onChange={numFmt(setAdminFid)} className={inputCls} />
                  </div>
                  <div>
                    <label className={labelCls}>Cobranza (%)</label>
                    <input type="number" step="0.1" value={cobranza} onChange={numFmt(setCobranza)} className={inputCls} />
                  </div>
                </div>

                {/* SOFOM toggle */}
                <label className="flex items-center gap-2 cursor-pointer">
                  <div
                    onClick={() => {
                      const next = !sofomAcreditante;
                      setSofomAcreditante(next);
                      if (next) {
                        setInversionistas(prev =>
                          prev.some(i => i.esSofom) ? prev :
                          [...prev, { id: 'sofom', nombre: 'SOFOM — Inyecta', modo: 'PORCENTAJE', valor: 0, tasaNeta: tasaAnual - spreadSofom, esSofom: true }]
                        );
                      } else {
                        setInversionistas(prev => prev.filter(i => !i.esSofom));
                      }
                    }}
                    className={`w-10 h-5 rounded-full transition-colors cursor-pointer relative flex-shrink-0 ${sofomAcreditante ? 'bg-[#c9a227]' : 'bg-gray-200'}`}
                  >
                    <div className={`absolute top-0.5 w-4 h-4 bg-white rounded-full shadow transition-transform ${sofomAcreditante ? 'translate-x-5' : 'translate-x-0.5'}`} />
                  </div>
                  <span className="text-sm text-gray-700">SOFOM como acreditante</span>
                </label>

                {/* Investors */}
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-xs font-medium text-gray-600">Inversionistas</span>
                    <button onClick={addInv} className="flex items-center gap-1 text-xs bg-gray-100 hover:bg-gray-200 px-2 py-1 rounded transition-colors">
                      <Plus size={12} /> Agregar
                    </button>
                  </div>

                  {inversionistas.length > 0 && (
                    <div className={`mb-2 px-3 py-1.5 rounded text-xs font-medium ${pctValido ? 'bg-green-50 text-green-700' : 'bg-red-50 text-red-700'}`}>
                      Suma: {totalPctInv.toFixed(2)}% {pctValido ? '✓' : `— falta ${(100 - totalPctInv).toFixed(2)}%`}
                    </div>
                  )}

                  <div className="space-y-2">
                    {inversionistas.map(inv => (
                      <div key={inv.id} className={`p-3 rounded-lg border ${inv.esSofom ? 'border-[#c9a227]/40 bg-amber-50/50' : 'border-gray-200 bg-gray-50'}`}>
                        <div className="flex items-center justify-between mb-2">
                          <input
                            type="text"
                            value={inv.nombre}
                            onChange={e => updateInv(inv.id, 'nombre', e.target.value)}
                            disabled={inv.esSofom}
                            className="text-xs font-medium bg-transparent border-none outline-none flex-1"
                          />
                          {!inv.esSofom && (
                            <button onClick={() => removeInv(inv.id)} className="text-red-400 hover:text-red-600 ml-2">
                              <Trash2 size={12} />
                            </button>
                          )}
                        </div>
                        <div className="grid grid-cols-3 gap-1.5">
                          <div>
                            <div className="flex gap-1 mb-1">
                              {(['MONTO', 'PORCENTAJE'] as ModoCaptura[]).map(m => (
                                <button
                                  key={m}
                                  onClick={() => updateInv(inv.id, 'modo', m)}
                                  className={`text-[10px] px-1.5 py-0.5 rounded ${inv.modo === m ? 'bg-[#1a1a1a] text-white' : 'bg-gray-200 text-gray-600'}`}
                                >
                                  {m === 'MONTO' ? '$' : '%'}
                                </button>
                              ))}
                            </div>
                            <input
                              type="number"
                              step={inv.modo === 'PORCENTAJE' ? '0.1' : '100000'}
                              value={inv.valor}
                              onChange={e => updateInv(inv.id, 'valor', parseFloat(e.target.value) || 0)}
                              className="w-full border rounded px-2 py-1 text-xs"
                            />
                          </div>
                          <div>
                            <label className="text-[10px] text-gray-500 block mb-1">Tasa neta %</label>
                            <input
                              type="number"
                              step="0.1"
                              value={inv.tasaNeta}
                              onChange={e => updateInv(inv.id, 'tasaNeta', parseFloat(e.target.value) || 0)}
                              className="w-full border rounded px-2 py-1 text-xs"
                            />
                          </div>
                          <div className="text-xs text-gray-500 pt-5">
                            {inv.modo === 'MONTO'
                              ? `${monto > 0 ? ((inv.valor / monto) * 100).toFixed(1) : '0'}%`
                              : fmtMXN(monto * inv.valor / 100)}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* ─── Right panel ───────────────────────────────────────────────────── */}
        <div className="xl:col-span-2 space-y-5">
          {amort ? (
            <>
              {/* KPI cards */}
              <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
                {[
                  { label: 'PMT Mensual', value: fmtMXN(amort.pmt), color: 'text-[#1a1a1a]' },
                  { label: 'Total Intereses', value: fmtMXN(amort.totalIntereses), color: 'text-red-600' },
                  { label: 'Total a Pagar', value: fmtMXN(amort.totalPagado), color: 'text-gray-700' },
                  { label: 'Comisión Apertura', value: fmtMXN(monto * comisionApertura / 100), color: 'text-[#c9a227]' },
                ].map(kpi => (
                  <div key={kpi.label} className="bg-white rounded-xl p-4 shadow-sm border">
                    <p className="text-xs text-gray-500 mb-1">{kpi.label}</p>
                    <p className={`text-lg font-bold ${kpi.color}`}>{kpi.value}</p>
                  </div>
                ))}
              </div>

              {/* STPB SOFOM income */}
              {producto === 'STPB' && ingresosSofom && (
                <div className="bg-white rounded-xl p-5 shadow-sm border">
                  <h3 className="font-semibold text-sm mb-4 text-gray-700 uppercase tracking-wide">Ingresos SOFOM</h3>
                  <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 mb-4">
                    {[
                      { label: 'Apertura', value: fmtMXN(ingresosSofom.apertura) },
                      { label: 'Spread Total', value: fmtMXN(ingresosSofom.spreadTotal) },
                      { label: 'Admin Total', value: fmtMXN(ingresosSofom.adminTotal) },
                      { label: 'Cobranza Total', value: fmtMXN(ingresosSofom.cobranzaTotal) },
                    ].map(item => (
                      <div key={item.label} className="bg-gray-50 rounded-lg p-3">
                        <p className="text-xs text-gray-500">{item.label}</p>
                        <p className="text-sm font-semibold mt-0.5">{item.value}</p>
                      </div>
                    ))}
                  </div>
                  <div className="pt-3 border-t">
                    <p className="text-xs text-gray-500">Ingreso Bruto SOFOM</p>
                    <p className="text-xl font-bold text-[#c9a227]">{fmtMXN(ingresosSofom.ingresoBruto)}</p>
                  </div>
                </div>
              )}

              {/* Amortization table */}
              <div className="bg-white rounded-xl shadow-sm border overflow-hidden">
                <div className="p-4 border-b flex items-center justify-between">
                  <h3 className="font-semibold text-sm">Tabla de Amortización</h3>
                  <span className="text-xs text-gray-400">{plazoMeses} pagos</span>
                </div>
                <div className="overflow-x-auto max-h-80">
                  <table className="w-full text-xs">
                    <thead className="sticky top-0 bg-[#1a1a1a] text-white">
                      <tr>
                        {['No.', 'Fecha', 'Capital', 'Interés', 'Pago Total', 'Saldo'].map(h => (
                          <th key={h} className="px-3 py-2 text-right first:text-center">{h}</th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      <tr className="border-b bg-gray-50">
                        <td className="px-3 py-2 text-center text-gray-400">0</td>
                        <td className="px-3 py-2 text-right" colSpan={4}></td>
                        <td className="px-3 py-2 text-right font-medium">{fmtMXN(monto)}</td>
                      </tr>
                      {amort.filas.map((f: any, i: number) => (
                        <tr key={i} className={`border-b ${i % 2 ? 'bg-gray-50' : ''} hover:bg-amber-50`}>
                          <td className="px-3 py-1.5 text-center text-gray-400">{f.mes}</td>
                          <td className="px-3 py-1.5 text-right">
                            {f.fecha instanceof Date
                              ? f.fecha.toLocaleDateString('es-MX')
                              : new Date(f.fecha).toLocaleDateString('es-MX')}
                          </td>
                          <td className="px-3 py-1.5 text-right">{fmtMXN(f.capital)}</td>
                          <td className="px-3 py-1.5 text-right">{fmtMXN(f.interes)}</td>
                          <td className="px-3 py-1.5 text-right font-medium">{fmtMXN(f.total)}</td>
                          <td className="px-3 py-1.5 text-right">{fmtMXN(f.saldo)}</td>
                        </tr>
                      ))}
                    </tbody>
                    <tfoot>
                      <tr className="bg-[#1a1a1a] text-white">
                        <td className="px-3 py-2 text-xs font-bold" colSpan={2}>Totales</td>
                        <td className="px-3 py-2 text-right text-xs font-bold">{fmtMXN(monto)}</td>
                        <td className="px-3 py-2 text-right text-xs font-bold">{fmtMXN(amort.totalIntereses)}</td>
                        <td className="px-3 py-2 text-right text-xs font-bold">{fmtMXN(amort.totalPagado)}</td>
                        <td className="px-3 py-2 text-right text-xs">—</td>
                      </tr>
                    </tfoot>
                  </table>
                </div>
              </div>

              {/* PDF Buttons */}
              <div className="flex flex-wrap gap-3">
                <button
                  onClick={handlePrintAcreditado}
                  className="flex items-center gap-2 px-4 py-2 bg-[#1a1a1a] text-white rounded-lg text-sm hover:bg-gray-800 transition-colors"
                >
                  <Download size={14} />
                  Corrida del Acreditado (PDF)
                </button>
                {producto === 'STPB' && invData.map(inv => (
                  <button
                    key={inv.id}
                    onClick={() => handlePrintInv(inv)}
                    className="flex items-center gap-2 px-4 py-2 border rounded-lg text-sm hover:bg-gray-50 transition-colors"
                  >
                    <FileText size={14} />
                    Corrida — {inv.nombre}
                  </button>
                ))}
                {producto === 'STPB' && (
                  <button
                    onClick={handlePrintMaestra}
                    className="flex items-center gap-2 px-4 py-2 border border-[#c9a227] text-[#c9a227] rounded-lg text-sm hover:bg-amber-50 transition-colors"
                  >
                    <FileText size={14} />
                    Corrida Maestra SOFOM
                  </button>
                )}
              </div>
            </>
          ) : (
            <div className="bg-white rounded-xl p-12 shadow-sm border text-center text-gray-400">
              <Calculator size={48} className="mx-auto mb-3 opacity-20" />
              <p>Ingresa los parámetros del crédito para ver los resultados</p>
            </div>
          )}
        </div>
      </div>

      {/* ─── Saved Cotizaciones Modal ──────────────────────────────────────────── */}
      {showGuardadas && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-lg">
            <div className="p-5 border-b flex items-center justify-between">
              <h3 className="font-semibold text-lg">Cotizaciones Guardadas</h3>
              <button onClick={() => setShowGuardadas(false)} className="text-gray-400 hover:text-gray-700">
                <X size={20} />
              </button>
            </div>
            <div className="p-5 max-h-96 overflow-y-auto">
              {cotizacionesGuardadas.length === 0 ? (
                <div className="text-center py-8 text-gray-400">
                  <FolderOpen size={40} className="mx-auto mb-2 opacity-30" />
                  <p className="text-sm">No hay cotizaciones guardadas</p>
                </div>
              ) : (
                <div className="space-y-2">
                  {cotizacionesGuardadas.map(cot => (
                    <div key={cot.id} className="flex items-center gap-3 p-3 border rounded-lg hover:bg-gray-50">
                      <div className="flex-1 min-w-0">
                        <p className="font-medium text-sm truncate">{cot.nombre}</p>
                        <p className="text-xs text-gray-400 mt-0.5">
                          {cot.producto} · {new Intl.NumberFormat('es-MX', { style: 'currency', currency: 'MXN', maximumFractionDigits: 0 }).format(cot.monto)} · {cot.plazoMeses} meses
                        </p>
                        <p className="text-xs text-gray-400">
                          {new Date(cot.fecha).toLocaleDateString('es-MX', { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' })}
                        </p>
                      </div>
                      <div className="flex gap-2">
                        <button
                          onClick={() => handleCargar(cot)}
                          className="text-xs px-3 py-1.5 bg-[#1a1a1a] text-white rounded-lg hover:bg-gray-800"
                        >
                          Cargar
                        </button>
                        <button
                          onClick={() => handleEliminar(cot.id)}
                          className="text-xs px-2 py-1.5 border border-red-200 text-red-500 rounded-lg hover:bg-red-50"
                        >
                          <Trash2 size={12} />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
