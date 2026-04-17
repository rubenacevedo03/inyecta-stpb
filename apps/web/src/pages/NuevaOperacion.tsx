import { useState, useMemo, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useMutation, useQuery } from '@tanstack/react-query';
import { operacionesApi, acreditadosApi, inversionistasApi, participacionesApi } from '../lib/api';
import { useAuth } from '../hooks/useAuth';

// ─── Types ─────────────────────────────────────────────────────────────────────
type Producto = 'PYME' | 'PERSONAL' | 'EXPRESS' | 'STPB';
type TipoAcreditado = 'PF' | 'PM';

interface PartForm {
  uid: string;              // local key
  inversionistaId: string;  // from catalog
  nombre: string;           // display
  modo: 'MONTO' | 'PORCENTAJE';
  valor: number;
  tasaNeta: number;
  esSofom: boolean;
}

// ─── Helpers ───────────────────────────────────────────────────────────────────
function r2(n: number) { return Math.round(n * 100) / 100; }
const fmtMXN = (n: number) =>
  new Intl.NumberFormat('es-MX', { style: 'currency', currency: 'MXN', maximumFractionDigits: 0 }).format(n);

function calcPMT(monto: number, tasaAnualDecimal: number, meses: number) {
  if (monto <= 0 || meses <= 0) return 0;
  const r = tasaAnualDecimal / 12;
  if (r === 0) return monto / meses;
  const factor = Math.pow(1 + r, meses);
  return r2((monto * r * factor) / (factor - 1));
}

// ─── Steps ─────────────────────────────────────────────────────────────────────
const STEPS = ['Acreditado', 'Operación', 'Participaciones', 'Confirmar'];

const PRODUCTOS: { value: Producto; label: string; color: string }[] = [
  { value: 'PYME',     label: 'PyME',              color: 'bg-blue-600'     },
  { value: 'PERSONAL', label: 'Personal',           color: 'bg-violet-600'  },
  { value: 'EXPRESS',  label: 'Express',            color: 'bg-amber-500'   },
  { value: 'STPB',     label: 'Sé Tu Propio Banco', color: 'bg-[#c9a227]'  },
];

// ─── Component ─────────────────────────────────────────────────────────────────
export default function NuevaOperacion() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [step, setStep] = useState(0);

  // ── Acreditado ────────────────────────────────────────────────────
  const [acreditadoId, setAcreditadoId]       = useState('');   // FK catálogo
  const [acreditadoBusq, setAcreditadoBusq]   = useState('');   // texto de búsqueda
  const [showDropdown, setShowDropdown]        = useState(false);
  const [modoAcreditado, setModoAcreditado]    = useState<'buscar' | 'nuevo'>('buscar');
  // Campos del form (usados si modoAcreditado === 'nuevo' o para editar)
  const [acreditadoNombre, setAcreditadoNombre]   = useState('');
  const [acreditadoRfc, setAcreditadoRfc]         = useState('');
  const [acreditadoTipo, setAcreditadoTipo]       = useState<TipoAcreditado>('PF');
  const [acreditadoTelefono, setAcreditadoTelefono] = useState('');
  const [acreditadoEmail, setAcreditadoEmail]     = useState('');
  const [acreditadoDireccion, setAcreditadoDireccion] = useState('');
  const [interesadoNombre, setInteresadoNombre]   = useState('');
  const [interesadoCargo, setInteresadoCargo]     = useState('');
  const [interesadoTelefono, setInteresadoTelefono] = useState('');
  const dropdownRef = useRef<HTMLDivElement>(null);

  // ── Operación ─────────────────────────────────────────────────────
  const [nombreOp, setNombreOp]               = useState('');
  const [producto, setProducto]               = useState<Producto>('STPB');
  const [monto, setMonto]                     = useState(3000000);
  const [tasaAnual, setTasaAnual]             = useState(18);
  const [plazoMeses, setPlazoMeses]           = useState(24);
  const [fechaPrimerPago, setFechaPrimerPago] = useState(() => {
    const d = new Date();
    d.setMonth(d.getMonth() + 1);
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-01`;
  });
  const [tasaMoratoriaAnual, setTasaMoratoriaAnual] = useState(36); // %
  const [comisionApertura, setComisionApertura]     = useState(3);
  const [spreadSofom, setSpreadSofom]               = useState(4);
  const [adminFideicomiso, setAdminFideicomiso]     = useState(1.5);
  const [comisionCobranza, setComisionCobranza]     = useState(0.5);
  const [sofomComoAcreditante, setSofomComoAcreditante] = useState(false);
  const [sofomMonto, setSofomMonto]                 = useState(0);
  const [sofomTasaNeta, setSofomTasaNeta]           = useState(14);
  const [valorInmueble, setValorInmueble]           = useState(0);
  const [notas, setNotas]                           = useState('');

  // ── Participaciones ───────────────────────────────────────────────
  const [participaciones, setParticipaciones] = useState<PartForm[]>([]);
  const [invBusq, setInvBusq]                 = useState('');

  // ─── Queries ──────────────────────────────────────────────────────
  const { data: acreditadosSug = [] } = useQuery({
    queryKey: ['acreditados-busq', acreditadoBusq],
    queryFn: () => acreditadosApi.list(acreditadoBusq).then(r => r.data),
    enabled: acreditadoBusq.length >= 2,
    staleTime: 10_000,
  });

  const { data: inversionistasCat = [] } = useQuery({
    queryKey: ['inversionistas-cat'],
    queryFn: () => inversionistasApi.list().then(r => r.data),
    staleTime: 60_000,
  });

  // Cerrar dropdown al hacer click afuera
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setShowDropdown(false);
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  // ── PMT preview ───────────────────────────────────────────────────
  const pmt = useMemo(() => calcPMT(monto, tasaAnual / 100, plazoMeses), [monto, tasaAnual, plazoMeses]);

  const totalPct = participaciones.reduce((s, p) => {
    return s + (p.modo === 'PORCENTAJE' ? p.valor : (monto > 0 ? (p.valor / monto) * 100 : 0));
  }, 0);
  const partValido = participaciones.length === 0 || Math.abs(totalPct - 100) < 0.01;

  // ── Mutations ─────────────────────────────────────────────────────
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState('');

  // ── Helpers ───────────────────────────────────────────────────────
  const n = (setter: (v: number) => void) =>
    (e: React.ChangeEvent<HTMLInputElement>) => setter(parseFloat(e.target.value) || 0);

  const inputCls = "w-full border border-gray-300 rounded-lg px-3 py-2.5 text-sm focus:ring-2 focus:ring-[#c9a227]/30 focus:border-[#c9a227] outline-none";
  const labelCls = "block text-sm font-medium text-gray-700 mb-1";

  const seleccionarAcreditado = (a: any) => {
    setAcreditadoId(a.id);
    setAcreditadoNombre(a.nombre);
    setAcreditadoRfc(a.rfc || '');
    setAcreditadoTipo(a.tipoPersona || 'PF');
    setAcreditadoTelefono(a.telefono || '');
    setAcreditadoEmail(a.email || '');
    setAcreditadoDireccion(a.direccion || '');
    setAcreditadoBusq(a.nombre);
    setShowDropdown(false);
  };

  const limpiarAcreditado = () => {
    setAcreditadoId('');
    setAcreditadoBusq('');
    setAcreditadoNombre('');
    setAcreditadoRfc('');
    setAcreditadoTelefono('');
    setAcreditadoEmail('');
    setAcreditadoDireccion('');
  };

  const addPart = () => {
    const invDisponibles = inversionistasCat.filter(
      (inv: any) => !participaciones.some(p => p.inversionistaId === inv.id)
    );
    if (invDisponibles.length === 0) return;
    const inv: any = invDisponibles[0];
    setParticipaciones(prev => [...prev, {
      uid: Date.now().toString(),
      inversionistaId: inv.id,
      nombre: inv.nombre,
      modo: 'PORCENTAJE',
      valor: Math.max(0, r2(100 - totalPct)),
      tasaNeta: tasaAnual - spreadSofom,
      esSofom: false,
    }]);
  };

  const updatePart = (uid: string, field: string, value: any) =>
    setParticipaciones(prev => prev.map(p => p.uid === uid ? { ...p, [field]: value } : p));

  const removePart = (uid: string) =>
    setParticipaciones(prev => prev.filter(p => p.uid !== uid));

  // ── Submit ────────────────────────────────────────────────────────
  const handleSubmit = async () => {
    setSubmitting(true);
    setSubmitError('');
    try {
      // 1. Crear operación
      const payload: any = {
        nombre: nombreOp || `${acreditadoNombre} — ${producto}`,
        producto,
        // Acreditado: FK si ya existe, o inline para crear uno nuevo
        ...(acreditadoId
          ? { acreditadoId }
          : {
              acreditadoNombre,
              acreditadoRfc: acreditadoRfc || null,
              acreditadoTipo,
              acreditadoTelefono: acreditadoTelefono || null,
              acreditadoEmail: acreditadoEmail || null,
              acreditadoDireccion: acreditadoDireccion || null,
            }),
        monto,
        tasaAnual:          tasaAnual / 100,
        plazoMeses,
        fechaPrimerPago,
        tasaMoratoriaAnual: tasaMoratoriaAnual / 100,
        comisionApertura:   comisionApertura / 100,
        spreadSofom:        spreadSofom / 100,
        adminFideicomiso:   adminFideicomiso / 100,
        comisionCobranza:   comisionCobranza / 100,
        sofomComoAcreditante,
        sofomMonto:  sofomComoAcreditante ? sofomMonto  : null,
        sofomTasaNeta: sofomComoAcreditante ? sofomTasaNeta / 100 : null,
        valorInmueble: valorInmueble || null,
        notas: (() => {
          let nota = notas || '';
          if (acreditadoTipo === 'PM' && interesadoNombre) {
            nota += `\nInteresado/Representante: ${interesadoNombre}${interesadoCargo ? ` (${interesadoCargo})` : ''}${interesadoTelefono ? ` — Tel: ${interesadoTelefono}` : ''}`;
          }
          return nota || null;
        })(),
      };

      const opRes = await operacionesApi.create(payload);
      const opId = opRes.data.id;

      // 2. Crear participaciones (si hay)
      for (const part of participaciones) {
        const montoAport = part.modo === 'MONTO' ? part.valor : monto * part.valor / 100;
        const porcAport  = part.modo === 'PORCENTAJE' ? part.valor / 100 : part.valor / monto;
        await participacionesApi.create({
          operacionId:            opId,
          inversionistaId:        part.inversionistaId,
          porcentajeParticipacion: porcAport,
          montoAportado:           montoAport,
          tasaNeta:                part.tasaNeta / 100,
          esSofom:                 part.esSofom,
          orden:                   participaciones.indexOf(part),
        });
      }

      navigate(`/operaciones/${opId}`);
    } catch (err: any) {
      setSubmitError(err?.response?.data?.error || 'Error al crear la operación. Verifica los datos.');
    } finally {
      setSubmitting(false);
    }
  };

  const canAdvance = () => {
    if (step === 0) return (acreditadoId || acreditadoNombre.trim().length > 0);
    if (step === 1) return monto > 0 && tasaAnual > 0 && plazoMeses > 0 && tasaMoratoriaAnual > 0;
    if (step === 2) return partValido;
    return true;
  };

  const invFiltrados = useMemo(() =>
    (inversionistasCat as any[]).filter(inv =>
      inv.nombre.toLowerCase().includes(invBusq.toLowerCase()) ||
      (inv.rfc || '').toLowerCase().includes(invBusq.toLowerCase())
    ), [inversionistasCat, invBusq]);

  // ── Render ────────────────────────────────────────────────────────
  return (
    <div className="max-w-3xl mx-auto">
      {/* Header */}
      <div className="mb-8">
        <button onClick={() => navigate('/operaciones')} className="text-gray-400 hover:text-gray-700 text-sm mb-3 flex items-center gap-1">
          ← Operaciones
        </button>
        <h1 className="text-2xl font-bold">Nueva Operación</h1>
        <p className="text-gray-500 text-sm mt-1">Complete los datos para registrar el crédito</p>
      </div>

      {/* Stepper */}
      <div className="flex items-center mb-8">
        {STEPS.map((s, i) => (
          <div key={s} className="flex items-center flex-1 last:flex-none">
            <div className="flex flex-col items-center">
              <div className={`w-9 h-9 rounded-full flex items-center justify-center text-sm font-bold transition-colors ${
                i < step ? 'bg-green-500 text-white' :
                i === step ? 'bg-[#1a1a1a] text-white' :
                'bg-gray-100 text-gray-400'
              }`}>
                {i < step ? '✓' : i + 1}
              </div>
              <span className={`text-xs mt-1 whitespace-nowrap ${i === step ? 'font-semibold text-[#1a1a1a]' : 'text-gray-400'}`}>
                {s}
              </span>
            </div>
            {i < STEPS.length - 1 && (
              <div className={`h-0.5 flex-1 mx-2 mb-4 ${i < step ? 'bg-green-400' : 'bg-gray-200'}`} />
            )}
          </div>
        ))}
      </div>

      <div className="bg-white rounded-2xl shadow-sm border p-8">

        {/* ══ STEP 0: ACREDITADO ══════════════════════════════════════════════ */}
        {step === 0 && (
          <div className="space-y-6">
            <h3 className="text-lg font-semibold">Datos del Acreditado</h3>

            {/* Selector de modo */}
            <div className="flex gap-2">
              {(['buscar', 'nuevo'] as const).map(m => (
                <button
                  key={m}
                  onClick={() => { setModoAcreditado(m); limpiarAcreditado(); }}
                  className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors border ${
                    modoAcreditado === m
                      ? 'bg-[#1a1a1a] text-white border-[#1a1a1a]'
                      : 'border-gray-300 text-gray-600 hover:border-gray-400'
                  }`}
                >
                  {m === 'buscar' ? '🔍 Buscar en catálogo' : '+ Nuevo acreditado'}
                </button>
              ))}
            </div>

            {/* Búsqueda en catálogo */}
            {modoAcreditado === 'buscar' && (
              <div className="relative" ref={dropdownRef}>
                <label className={labelCls}>Buscar acreditado *</label>
                {acreditadoId ? (
                  <div className="flex items-center gap-3 p-3 border-2 border-green-400 bg-green-50 rounded-lg">
                    <div className="w-8 h-8 rounded-full bg-green-500 text-white flex items-center justify-center text-sm font-bold">
                      {acreditadoNombre.charAt(0)}
                    </div>
                    <div className="flex-1">
                      <p className="text-sm font-semibold text-green-800">{acreditadoNombre}</p>
                      {acreditadoRfc && <p className="text-xs text-green-600">RFC: {acreditadoRfc}</p>}
                    </div>
                    <button
                      onClick={limpiarAcreditado}
                      className="text-green-600 hover:text-red-500 text-lg font-bold transition-colors"
                    >
                      ×
                    </button>
                  </div>
                ) : (
                  <>
                    <input
                      type="text"
                      value={acreditadoBusq}
                      onChange={e => { setAcreditadoBusq(e.target.value); setShowDropdown(true); }}
                      onFocus={() => acreditadoBusq.length >= 2 && setShowDropdown(true)}
                      placeholder="Escribe nombre o RFC..."
                      className={inputCls}
                    />
                    {showDropdown && acreditadosSug.length > 0 && (
                      <div className="absolute z-20 left-0 right-0 mt-1 bg-white border border-gray-200 rounded-xl shadow-lg max-h-52 overflow-y-auto">
                        {(acreditadosSug as any[]).map((a: any) => (
                          <button
                            key={a.id}
                            onMouseDown={() => seleccionarAcreditado(a)}
                            className="w-full flex items-center gap-3 px-4 py-3 hover:bg-[#c9a227]/10 text-left transition-colors"
                          >
                            <div className="w-7 h-7 rounded-full bg-gray-200 flex items-center justify-center text-xs font-bold flex-shrink-0">
                              {a.nombre.charAt(0)}
                            </div>
                            <div>
                              <p className="text-sm font-medium">{a.nombre}</p>
                              <p className="text-xs text-gray-500">{a.rfc || 'Sin RFC'} · {a.tipoPersona}</p>
                            </div>
                          </button>
                        ))}
                      </div>
                    )}
                    {showDropdown && acreditadoBusq.length >= 2 && acreditadosSug.length === 0 && (
                      <div className="absolute z-20 left-0 right-0 mt-1 bg-white border border-gray-200 rounded-xl shadow p-4 text-sm text-gray-400 text-center">
                        No se encontraron resultados.{' '}
                        <button
                          className="text-[#c9a227] font-medium hover:underline"
                          onMouseDown={() => { setModoAcreditado('nuevo'); setAcreditadoNombre(acreditadoBusq); setShowDropdown(false); }}
                        >
                          Crear nuevo
                        </button>
                      </div>
                    )}
                  </>
                )}
              </div>
            )}

            {/* Formulario nuevo acreditado */}
            {(modoAcreditado === 'nuevo' || (modoAcreditado === 'buscar' && !acreditadoId)) && modoAcreditado === 'nuevo' && (
              <>
                {/* Tipo PF / PM */}
                <div>
                  <label className={labelCls}>Tipo de Persona *</label>
                  <div className="flex gap-3">
                    {(['PF', 'PM'] as TipoAcreditado[]).map(t => (
                      <button
                        key={t}
                        onClick={() => setAcreditadoTipo(t)}
                        className={`flex-1 py-2.5 rounded-lg border-2 text-sm font-semibold transition-colors ${
                          acreditadoTipo === t
                            ? 'border-[#c9a227] bg-[#c9a227]/10 text-[#1a1a1a]'
                            : 'border-gray-200 text-gray-500 hover:border-gray-300'
                        }`}
                      >
                        {t === 'PF' ? 'Persona Física' : 'Persona Moral'}
                      </button>
                    ))}
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="col-span-2">
                    <label className={labelCls}>
                      {acreditadoTipo === 'PF' ? 'Nombre Completo' : 'Razón Social'} *
                    </label>
                    <input
                      type="text"
                      value={acreditadoNombre}
                      onChange={e => setAcreditadoNombre(e.target.value)}
                      placeholder={acreditadoTipo === 'PF' ? 'Ej: Juan Pérez Martínez' : 'Ej: Desarrollos del Norte S.A. de C.V.'}
                      className={inputCls}
                    />
                  </div>
                  <div>
                    <label className={labelCls}>RFC</label>
                    <input type="text" value={acreditadoRfc} onChange={e => setAcreditadoRfc(e.target.value.toUpperCase())} placeholder={acreditadoTipo === 'PF' ? 'PEMJ800101XXX' : 'DEN200101ABC'} maxLength={13} className={inputCls + ' uppercase'} />
                  </div>
                  <div>
                    <label className={labelCls}>Teléfono</label>
                    <input type="tel" value={acreditadoTelefono} onChange={e => setAcreditadoTelefono(e.target.value)} placeholder="444-123-4567" className={inputCls} />
                  </div>
                  <div className="col-span-2">
                    <label className={labelCls}>Correo Electrónico</label>
                    <input type="email" value={acreditadoEmail} onChange={e => setAcreditadoEmail(e.target.value)} placeholder="contacto@empresa.com" className={inputCls} />
                  </div>
                  <div className="col-span-2">
                    <label className={labelCls}>Domicilio</label>
                    <input type="text" value={acreditadoDireccion} onChange={e => setAcreditadoDireccion(e.target.value)} placeholder="Av. Principal 100, Col. Centro, C.P. 78000, SLP" className={inputCls} />
                  </div>
                </div>

                {/* PM: representante */}
                {acreditadoTipo === 'PM' && (
                  <div className="border border-[#c9a227]/30 bg-amber-50/40 rounded-xl p-5">
                    <h4 className="font-semibold text-sm mb-4 text-amber-800">Representante / Persona de Contacto</h4>
                    <div className="grid grid-cols-2 gap-4">
                      <div className="col-span-2">
                        <label className={labelCls}>Nombre del Representante Legal</label>
                        <input type="text" value={interesadoNombre} onChange={e => setInteresadoNombre(e.target.value)} placeholder="Nombre completo" className={inputCls} />
                      </div>
                      <div>
                        <label className={labelCls}>Cargo</label>
                        <input type="text" value={interesadoCargo} onChange={e => setInteresadoCargo(e.target.value)} placeholder="Director General, Apoderado Legal..." className={inputCls} />
                      </div>
                      <div>
                        <label className={labelCls}>Teléfono directo</label>
                        <input type="tel" value={interesadoTelefono} onChange={e => setInteresadoTelefono(e.target.value)} placeholder="444-987-6543" className={inputCls} />
                      </div>
                    </div>
                  </div>
                )}
              </>
            )}
          </div>
        )}

        {/* ══ STEP 1: OPERACIÓN ════════════════════════════════════════════════ */}
        {step === 1 && (
          <div className="space-y-6">
            <h3 className="text-lg font-semibold">Datos de la Operación</h3>

            <div className="grid grid-cols-2 gap-4">
              <div className="col-span-2">
                <label className={labelCls}>Nombre / Referencia de la Operación</label>
                <input
                  type="text"
                  value={nombreOp}
                  onChange={e => setNombreOp(e.target.value)}
                  placeholder={`${acreditadoNombre || 'Acreditado'} — Crédito`}
                  className={inputCls}
                />
                <p className="text-xs text-gray-400 mt-1">Si se deja vacío, se genera automáticamente</p>
              </div>

              {/* Producto */}
              <div className="col-span-2">
                <label className={labelCls}>Producto *</label>
                <div className="grid grid-cols-2 gap-2">
                  {PRODUCTOS.map(p => (
                    <button
                      key={p.value}
                      onClick={() => setProducto(p.value)}
                      className={`py-3 px-4 rounded-xl border-2 text-sm font-semibold transition-all text-left ${
                        producto === p.value
                          ? 'border-[#c9a227] bg-[#c9a227]/10'
                          : 'border-gray-200 hover:border-gray-300'
                      }`}
                    >
                      <span className={`inline-block w-2 h-2 rounded-full mr-2 ${p.color}`} />
                      {p.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Financieros */}
              <div>
                <label className={labelCls}>Monto del Crédito ($) *</label>
                <input type="number" value={monto} onChange={n(setMonto)} className={inputCls} />
              </div>
              <div>
                <label className={labelCls}>Tasa Anual (%) *</label>
                <input type="number" step="0.1" value={tasaAnual} onChange={n(setTasaAnual)} className={inputCls} />
              </div>
              <div>
                <label className={labelCls}>Plazo (meses) *</label>
                <input type="number" value={plazoMeses} onChange={n(setPlazoMeses)} className={inputCls} />
              </div>
              <div>
                <label className={labelCls}>Fecha del Primer Pago *</label>
                <input type="date" value={fechaPrimerPago} onChange={e => setFechaPrimerPago(e.target.value)} className={inputCls} />
              </div>

              {/* Tasa moratoria — nuevo campo requerido */}
              <div>
                <label className={labelCls}>
                  Tasa Moratoria Anual (%) *
                  <span className="ml-1 text-xs text-gray-400 font-normal">— aplicable en mora</span>
                </label>
                <input
                  type="number"
                  step="0.1"
                  value={tasaMoratoriaAnual}
                  onChange={n(setTasaMoratoriaAnual)}
                  className={`${inputCls} ${tasaMoratoriaAnual <= 0 ? 'border-red-400 focus:border-red-500' : ''}`}
                />
                {tasaMoratoriaAnual <= 0 && (
                  <p className="text-xs text-red-500 mt-1">Campo requerido</p>
                )}
              </div>

              <div>
                <label className={labelCls}>Comisión Apertura (%)</label>
                <input type="number" step="0.1" value={comisionApertura} onChange={n(setComisionApertura)} className={inputCls} />
              </div>
              <div>
                <label className={labelCls}>Valor Inmueble ($) <span className="text-gray-400 font-normal">(opcional)</span></label>
                <input type="number" value={valorInmueble || ''} onChange={n(setValorInmueble)} placeholder="0" className={inputCls} />
              </div>

              {/* STPB fields */}
              {producto === 'STPB' && (
                <>
                  <div>
                    <label className={labelCls}>Spread SOFOM (%)</label>
                    <input type="number" step="0.1" value={spreadSofom} onChange={n(setSpreadSofom)} className={inputCls} />
                  </div>
                  <div>
                    <label className={labelCls}>Admin Fideicomiso (%)</label>
                    <input type="number" step="0.1" value={adminFideicomiso} onChange={n(setAdminFideicomiso)} className={inputCls} />
                  </div>
                  <div>
                    <label className={labelCls}>Comisión Cobranza (%)</label>
                    <input type="number" step="0.1" value={comisionCobranza} onChange={n(setComisionCobranza)} className={inputCls} />
                  </div>
                  <div className="flex items-center gap-3">
                    <div
                      onClick={() => setSofomComoAcreditante(v => !v)}
                      className={`w-11 h-6 rounded-full transition-colors cursor-pointer relative flex-shrink-0 ${sofomComoAcreditante ? 'bg-[#c9a227]' : 'bg-gray-200'}`}
                    >
                      <div className={`absolute top-1 w-4 h-4 bg-white rounded-full shadow transition-transform ${sofomComoAcreditante ? 'translate-x-6' : 'translate-x-1'}`} />
                    </div>
                    <label className="text-sm text-gray-700 cursor-pointer" onClick={() => setSofomComoAcreditante(v => !v)}>
                      SOFOM como acreditante
                    </label>
                  </div>
                  {sofomComoAcreditante && (
                    <>
                      <div>
                        <label className={labelCls}>Monto SOFOM ($)</label>
                        <input type="number" value={sofomMonto} onChange={n(setSofomMonto)} className={inputCls} />
                      </div>
                      <div>
                        <label className={labelCls}>Tasa Neta SOFOM (%)</label>
                        <input type="number" step="0.1" value={sofomTasaNeta} onChange={n(setSofomTasaNeta)} className={inputCls} />
                      </div>
                    </>
                  )}
                </>
              )}

              <div className="col-span-2">
                <label className={labelCls}>Notas <span className="text-gray-400 font-normal">(opcional)</span></label>
                <textarea value={notas} onChange={e => setNotas(e.target.value)} rows={2} className={inputCls + ' resize-none'} placeholder="Observaciones, condiciones especiales..." />
              </div>
            </div>

            {/* PMT preview */}
            {monto > 0 && tasaAnual > 0 && plazoMeses > 0 && (
              <div className="flex items-center gap-4 bg-[#1a1a1a] text-white rounded-xl px-5 py-4">
                <div>
                  <p className="text-xs text-gray-400">Pago Mensual estimado</p>
                  <p className="text-2xl font-bold text-[#c9a227]">{fmtMXN(pmt)}</p>
                </div>
                <div className="ml-auto text-right text-xs text-gray-400">
                  <p>{fmtMXN(monto)} · {tasaAnual}% · {plazoMeses} meses</p>
                  {valorInmueble > 0 && <p>LTV: {((monto / valorInmueble) * 100).toFixed(1)}%</p>}
                  <p className="text-orange-400">Mora: {tasaMoratoriaAnual}% anual</p>
                </div>
              </div>
            )}
          </div>
        )}

        {/* ══ STEP 2: PARTICIPACIONES ══════════════════════════════════════════ */}
        {step === 2 && (
          <div className="space-y-5">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-lg font-semibold">Participaciones</h3>
                <p className="text-sm text-gray-400 mt-0.5">Opcional — puedes configurarlo después desde el detalle</p>
              </div>
              <button
                onClick={addPart}
                disabled={(inversionistasCat as any[]).length === 0}
                className="flex items-center gap-1.5 px-4 py-2 bg-[#1a1a1a] text-white rounded-lg text-sm hover:bg-gray-800 transition-colors disabled:opacity-40"
              >
                + Agregar
              </button>
            </div>

            {/* Filtro de catálogo */}
            {(inversionistasCat as any[]).length > 0 && (
              <input
                type="text"
                value={invBusq}
                onChange={e => setInvBusq(e.target.value)}
                placeholder="Filtrar inversionistas del catálogo..."
                className={inputCls + ' text-xs py-2'}
              />
            )}

            {/* Validation */}
            {participaciones.length > 0 && (
              <div className={`px-4 py-2 rounded-lg text-sm font-medium ${partValido ? 'bg-green-50 text-green-700' : 'bg-red-50 text-red-700'}`}>
                Suma de participaciones: {totalPct.toFixed(2)}%
                {partValido ? ' ✓' : ` — falta ${(100 - totalPct).toFixed(2)}%`}
              </div>
            )}

            {participaciones.length === 0 ? (
              <div className="text-center py-10 border-2 border-dashed border-gray-200 rounded-xl text-gray-400">
                <p className="text-sm">Sin participaciones por ahora</p>
                <p className="text-xs mt-1">Puedes agregarlas desde el detalle de la operación</p>
              </div>
            ) : (
              <div className="space-y-3">
                {participaciones.map((part, idx) => (
                  <div key={part.uid} className={`p-4 rounded-xl border ${part.esSofom ? 'border-[#c9a227]/30 bg-amber-50/30' : 'border-gray-200 bg-gray-50'}`}>
                    <div className="flex items-center gap-3 mb-3">
                      <span className="w-6 h-6 rounded-full bg-[#1a1a1a] text-white text-xs font-bold flex items-center justify-center">{idx + 1}</span>
                      {/* Selector de inversionista del catálogo */}
                      <select
                        value={part.inversionistaId}
                        onChange={e => {
                          const inv = (inversionistasCat as any[]).find(i => i.id === e.target.value);
                          if (inv) updatePart(part.uid, 'inversionistaId', inv.id);
                          if (inv) updatePart(part.uid, 'nombre', inv.nombre);
                        }}
                        className="flex-1 text-sm font-medium bg-white border border-gray-200 rounded-lg px-2 py-1.5 outline-none focus:ring-1 focus:ring-[#c9a227]"
                      >
                        {invFiltrados.map((inv: any) => (
                          <option key={inv.id} value={inv.id}>{inv.nombre}</option>
                        ))}
                      </select>
                      <button onClick={() => removePart(part.uid)} className="text-red-400 hover:text-red-600 text-lg leading-none">×</button>
                    </div>
                    <div className="grid grid-cols-3 gap-3">
                      <div>
                        <label className="text-xs text-gray-500 block mb-1">Modo</label>
                        <div className="flex gap-1">
                          {(['MONTO', 'PORCENTAJE'] as const).map(m => (
                            <button
                              key={m}
                              onClick={() => updatePart(part.uid, 'modo', m)}
                              className={`flex-1 py-1.5 text-xs rounded font-medium transition-colors ${part.modo === m ? 'bg-[#1a1a1a] text-white' : 'bg-gray-200 text-gray-600'}`}
                            >
                              {m === 'MONTO' ? '$' : '%'}
                            </button>
                          ))}
                        </div>
                      </div>
                      <div>
                        <label className="text-xs text-gray-500 block mb-1">
                          {part.modo === 'MONTO' ? 'Monto ($)' : 'Porcentaje (%)'}
                        </label>
                        <input
                          type="number"
                          step={part.modo === 'PORCENTAJE' ? '0.1' : '100000'}
                          value={part.valor}
                          onChange={e => updatePart(part.uid, 'valor', parseFloat(e.target.value) || 0)}
                          className="w-full border rounded-lg px-2 py-1.5 text-sm outline-none focus:ring-1 focus:ring-[#c9a227]"
                        />
                        <p className="text-xs text-gray-400 mt-0.5">
                          {part.modo === 'MONTO'
                            ? `${monto > 0 ? ((part.valor / monto) * 100).toFixed(1) : 0}%`
                            : fmtMXN(monto * part.valor / 100)}
                        </p>
                      </div>
                      <div>
                        <label className="text-xs text-gray-500 block mb-1">Tasa Neta (%)</label>
                        <input
                          type="number"
                          step="0.1"
                          value={part.tasaNeta}
                          onChange={e => updatePart(part.uid, 'tasaNeta', parseFloat(e.target.value) || 0)}
                          className="w-full border rounded-lg px-2 py-1.5 text-sm outline-none focus:ring-1 focus:ring-[#c9a227]"
                        />
                      </div>
                    </div>
                    <div className="flex items-center gap-2 mt-2">
                      <input
                        type="checkbox"
                        id={`sofom-${part.uid}`}
                        checked={part.esSofom}
                        onChange={e => updatePart(part.uid, 'esSofom', e.target.checked)}
                        className="rounded"
                      />
                      <label htmlFor={`sofom-${part.uid}`} className="text-xs text-gray-600">Es SOFOM</label>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* ══ STEP 3: CONFIRMAR ════════════════════════════════════════════════ */}
        {step === 3 && (
          <div className="space-y-6">
            <h3 className="text-lg font-semibold">Confirmar Operación</h3>

            {submitError && (
              <div className="bg-red-50 border border-red-200 rounded-xl p-4 text-sm text-red-700">
                {submitError}
              </div>
            )}

            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              {/* Acreditado */}
              <div className="bg-gray-50 rounded-xl p-4 border">
                <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-3">Acreditado</p>
                <div className="space-y-1.5 text-sm">
                  {acreditadoId && <div className="flex items-center gap-1.5"><span className="w-2 h-2 rounded-full bg-green-400" /><span className="text-xs text-green-600">Del catálogo</span></div>}
                  <div className="flex justify-between"><span className="text-gray-500">Nombre</span><span className="font-medium">{acreditadoNombre}</span></div>
                  {acreditadoRfc && <div className="flex justify-between"><span className="text-gray-500">RFC</span><span className="font-medium">{acreditadoRfc}</span></div>}
                  <div className="flex justify-between"><span className="text-gray-500">Tipo</span><span className="font-medium">{acreditadoTipo === 'PF' ? 'Persona Física' : 'Persona Moral'}</span></div>
                </div>
              </div>

              {/* Crédito */}
              <div className="bg-gray-50 rounded-xl p-4 border">
                <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-3">Crédito</p>
                <div className="space-y-1.5 text-sm">
                  <div className="flex justify-between"><span className="text-gray-500">Producto</span><span className="font-semibold">{producto}</span></div>
                  <div className="flex justify-between"><span className="text-gray-500">Monto</span><span className="font-medium">{fmtMXN(monto)}</span></div>
                  <div className="flex justify-between"><span className="text-gray-500">Tasa Anual</span><span className="font-medium">{tasaAnual}%</span></div>
                  <div className="flex justify-between"><span className="text-gray-500">Tasa Moratoria</span><span className="font-medium text-orange-600">{tasaMoratoriaAnual}%</span></div>
                  <div className="flex justify-between"><span className="text-gray-500">Plazo</span><span className="font-medium">{plazoMeses} meses</span></div>
                  <div className="flex justify-between"><span className="text-gray-500">Primer Pago</span><span className="font-medium">{fechaPrimerPago}</span></div>
                  {valorInmueble > 0 && <div className="flex justify-between"><span className="text-gray-500">LTV</span><span className="font-medium">{((monto / valorInmueble) * 100).toFixed(1)}%</span></div>}
                </div>
              </div>
            </div>

            {/* PMT highlight */}
            <div className="bg-[#1a1a1a] rounded-2xl px-6 py-5 flex items-center justify-between">
              <div>
                <p className="text-gray-400 text-sm">Pago Mensual</p>
                <p className="text-3xl font-bold text-[#c9a227]">{fmtMXN(pmt)}</p>
              </div>
              <div className="text-right text-sm text-gray-400">
                <p>{participaciones.length} participación{participaciones.length !== 1 ? 'es' : ''}</p>
                <p>{plazoMeses} pagos programados</p>
              </div>
            </div>
          </div>
        )}

        {/* ── Navigation ──────────────────────────────────────────────────────── */}
        <div className="flex justify-between mt-8 pt-6 border-t">
          <button
            onClick={() => setStep(s => Math.max(0, s - 1))}
            disabled={step === 0}
            className="px-6 py-2.5 border border-gray-300 rounded-xl text-sm hover:bg-gray-50 disabled:opacity-30 transition-colors"
          >
            ← Anterior
          </button>

          {step < STEPS.length - 1 ? (
            <button
              onClick={() => setStep(s => s + 1)}
              disabled={!canAdvance()}
              className="px-8 py-2.5 bg-[#1a1a1a] text-white rounded-xl text-sm font-semibold hover:bg-gray-800 disabled:opacity-40 transition-colors"
            >
              Siguiente →
            </button>
          ) : (
            <button
              onClick={handleSubmit}
              disabled={submitting}
              className="px-8 py-2.5 bg-[#c9a227] text-[#1a1a1a] rounded-xl text-sm font-bold hover:bg-yellow-500 disabled:opacity-50 transition-colors"
            >
              {submitting ? 'Creando operación...' : '✓ Crear Operación'}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
