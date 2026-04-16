import { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { operacionesApi, bloquesApi, solicitudesApi } from '../lib/api';
import api from '../lib/api';
import { useAuth } from '../hooks/useAuth';
import { imprimirCorrida } from '../lib/printPDF';

// ─── Constants ────────────────────────────────────────────────────────────────

const BLOQUE_NOMBRES: Record<number, string> = {
  1: 'Análisis de Riesgos',
  2: 'Integración Comercial',
  3: 'Dictamen Jurídico',
  4: 'Presentación a Comité',
  5: 'Formalización y Dispersión',
};

const BLOQUE_RESULTADOS: Record<number, { value: string; label: string; color: string }[]> = {
  1: [
    { value: 'PRE_AUTORIZADO', label: 'Pre-autorizado', color: 'bg-green-100 text-green-700 border-green-300' },
    { value: 'PRE_AUTORIZADO_CONDICIONADO', label: 'Pre-autorizado condicionado', color: 'bg-yellow-100 text-yellow-700 border-yellow-300' },
    { value: 'NO_VIABLE', label: 'No viable', color: 'bg-red-100 text-red-700 border-red-300' },
    { value: 'RECHAZADO', label: 'Rechazado', color: 'bg-red-100 text-red-700 border-red-300' },
  ],
  2: [
    { value: 'EXPEDIENTE_INTEGRADO', label: 'Expediente integrado', color: 'bg-blue-100 text-blue-700 border-blue-300' },
    { value: 'OBSERVADO', label: 'Con observaciones', color: 'bg-orange-100 text-orange-700 border-orange-300' },
  ],
  3: [
    { value: 'DICTAMEN_VIABLE', label: 'Dictamen viable', color: 'bg-green-100 text-green-700 border-green-300' },
    { value: 'DICTAMEN_VIABLE_CONDICIONADO', label: 'Viable condicionado', color: 'bg-yellow-100 text-yellow-700 border-yellow-300' },
    { value: 'NO_VIABLE', label: 'No viable', color: 'bg-red-100 text-red-700 border-red-300' },
    { value: 'RECHAZADO', label: 'Rechazado', color: 'bg-red-100 text-red-700 border-red-300' },
  ],
  4: [
    { value: 'VALIDADO', label: 'Validado por Comité', color: 'bg-green-100 text-green-700 border-green-300' },
    { value: 'OBSERVADO', label: 'Con observaciones', color: 'bg-orange-100 text-orange-700 border-orange-300' },
    { value: 'RECHAZADO', label: 'Rechazado', color: 'bg-red-100 text-red-700 border-red-300' },
  ],
  5: [
    { value: 'FORMALIZADO', label: 'Formalizado y dispersado', color: 'bg-green-100 text-green-700 border-green-300' },
    { value: 'CERRADO', label: 'Cerrado sin dispersión', color: 'bg-gray-100 text-gray-600 border-gray-300' },
  ],
};

const CATEGORIA_COLORS: Record<string, string> = {
  RIESGOS: 'bg-purple-50 text-purple-700 border-purple-200',
  COMERCIAL: 'bg-blue-50 text-blue-700 border-blue-200',
  JURIDICO: 'bg-amber-50 text-amber-700 border-amber-200',
};

const STATUS_BADGE: Record<string, string> = {
  PROSPECTO: 'bg-gray-100 text-gray-600',
  ANALISIS: 'bg-blue-100 text-blue-700',
  APROBADA: 'bg-green-100 text-green-700',
  ACTIVA: 'bg-emerald-100 text-emerald-700',
  LIQUIDADA: 'bg-purple-100 text-purple-600',
  EN_MORA: 'bg-red-100 text-red-700',
  EJECUTADA: 'bg-orange-100 text-orange-700',
  CANCELADA: 'bg-gray-200 text-gray-500',
};

const PRODUCTO_BADGE: Record<string, string> = {
  PYME: 'bg-blue-600',
  PERSONAL: 'bg-violet-600',
  EXPRESS: 'bg-amber-500',
  STPB: 'text-[#1a1a1a] bg-[#c9a227]',
};

const TIPO_SOL: Record<string, string> = {
  SOL_01: 'Solicitud de documentos al acreditado',
  SOL_02: 'Solicitud de avalúo',
  SOL_03: 'Solicitud de CLG / RPP',
  SOL_04: 'Solicitud de firma de contratos',
  SOL_05: 'Solicitud de dispersión',
  SOL_06: 'Solicitud al área jurídica',
  SOL_07: 'Solicitud al área de riesgos',
  SOL_08: 'Solicitud al área comercial',
};

// ─── Helper ────────────────────────────────────────────────────────────────────
const fmtMXN = (n: number) =>
  new Intl.NumberFormat('es-MX', { style: 'currency', currency: 'MXN', maximumFractionDigits: 2 }).format(n);
const fmtPct = (n: number) => (n * 100).toFixed(2) + '%';
const fmtDate = (d: string | Date) =>
  new Date(d).toLocaleDateString('es-MX', { day: '2-digit', month: 'short', year: 'numeric' });

// ─── Admin Override Component ───────────────────────────────────────────────
const ALL_STATUSES = [
  { value: 'EN_PROCESO', label: 'En Proceso' },
  { value: 'PRE_AUTORIZADO', label: 'Pre-autorizado' },
  { value: 'PRE_AUTORIZADO_CONDICIONADO', label: 'Pre-autorizado condicionado' },
  { value: 'EXPEDIENTE_INTEGRADO', label: 'Expediente integrado' },
  { value: 'DICTAMEN_VIABLE', label: 'Dictamen viable' },
  { value: 'DICTAMEN_VIABLE_CONDICIONADO', label: 'Dictamen viable condicionado' },
  { value: 'VALIDADO', label: 'Validado' },
  { value: 'OBSERVADO', label: 'Con observaciones' },
  { value: 'FORMALIZADO', label: 'Formalizado' },
  { value: 'RECHAZADO', label: 'Rechazado' },
  { value: 'NO_VIABLE', label: 'No viable' },
  { value: 'CERRADO', label: 'Cerrado' },
  { value: 'PENDIENTE', label: 'Pendiente (resetear)' },
];

function AdminBloqueOverride({
  bloque,
  onSave,
  isPending,
}: {
  bloque: any;
  onSave: (bloqueId: string, data: any) => void;
  isPending: boolean;
}) {
  const [open, setOpen] = useState(false);
  const [nuevoStatus, setNuevoStatus] = useState(bloque.status);
  const [nota, setNota] = useState('');

  if (!open) {
    return (
      <div className="bg-red-50 rounded-xl border border-red-200 p-4">
        <p className="text-xs font-semibold text-red-700 mb-2">⚙ Administrador</p>
        <button
          onClick={() => setOpen(true)}
          className="w-full text-xs px-3 py-2 border border-red-300 text-red-700 rounded-lg hover:bg-red-100 transition-colors"
        >
          Corregir Estado del Bloque
        </button>
      </div>
    );
  }

  return (
    <div className="bg-red-50 rounded-xl border border-red-300 p-4">
      <p className="text-xs font-semibold text-red-700 mb-3">⚙ Corrección de Estado (Admin)</p>
      <div className="space-y-3">
        <div>
          <label className="text-xs text-gray-600 block mb-1">Nuevo Estado</label>
          <select
            value={nuevoStatus}
            onChange={e => setNuevoStatus(e.target.value)}
            className="w-full text-sm border border-gray-300 rounded-lg px-2 py-2 outline-none"
          >
            {ALL_STATUSES.map(s => (
              <option key={s.value} value={s.value}>{s.label}</option>
            ))}
          </select>
        </div>
        <div>
          <label className="text-xs text-gray-600 block mb-1">Motivo de corrección</label>
          <input
            type="text"
            value={nota}
            onChange={e => setNota(e.target.value)}
            placeholder="Ej: Error al dictaminar, corrección..."
            className="w-full text-sm border border-gray-300 rounded-lg px-2 py-1.5 outline-none"
          />
        </div>
        <div className="flex gap-2">
          <button
            onClick={() => setOpen(false)}
            className="flex-1 text-xs px-3 py-2 border border-gray-300 rounded-lg hover:bg-gray-100"
          >
            Cancelar
          </button>
          <button
            onClick={() => {
              onSave(bloque.id, {
                resultado: nuevoStatus,
                condiciones: nota || null,
                motivoRechazo: null,
              });
              setOpen(false);
            }}
            disabled={isPending}
            className="flex-1 text-xs px-3 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 disabled:opacity-40"
          >
            {isPending ? 'Guardando...' : 'Aplicar'}
          </button>
        </div>
      </div>
    </div>
  );
}

// ─── Main Component ────────────────────────────────────────────────────────────
export default function DetalleOperacion() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();
  const qc = useQueryClient();

  const [activeTab, setActiveTab] = useState<'datos' | 'circuito' | 'financiero' | 'corridas' | 'historial'>('circuito');
  const [selectedBloque, setSelectedBloque] = useState(1);
  const [resultado, setResultado] = useState('');
  const [condiciones, setCondiciones] = useState('');
  const [showSolicitudModal, setShowSolicitudModal] = useState(false);
  const [solicitudTipo, setSolicitudTipo] = useState('SOL_01');
  const [solicitudDescripcion, setSolicitudDescripcion] = useState('');
  const [solicitudDirigidaId, setSolicitudDirigidaId] = useState('');

  // Pago modal state
  const [pagoModal, setPagoModal] = useState<{ pago: any } | null>(null);
  const [montoPagado, setMontoPagado] = useState('');
  const [fechaPago, setFechaPago] = useState(() => new Date().toISOString().split('T')[0]);
  const [notasPago, setNotasPago] = useState('');

  // ─── Queries ─────────────────────────────────────────────────────────────────
  const { data: op, isLoading } = useQuery({
    queryKey: ['operacion', id],
    queryFn: () => operacionesApi.get(id!).then(r => r.data),
    enabled: !!id,
  });

  // ─── Mutations ────────────────────────────────────────────────────────────────
  const checklistMut = useMutation({
    mutationFn: ({ itemId, completado, nota }: { itemId: string; completado: boolean; nota?: string }) =>
      bloquesApi.updateChecklist(itemId, completado, nota),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['operacion', id] }),
  });

  const resultadoMut = useMutation({
    mutationFn: ({ bloqueId, data }: { bloqueId: string; data: any }) =>
      bloquesApi.setResultado(bloqueId, data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['operacion', id] });
      setResultado('');
      setCondiciones('');
    },
  });

  const avanzarMut = useMutation({
    mutationFn: (bloqueActual: number) => bloquesApi.avanzar(id!, bloqueActual),
    onSuccess: (data) => {
      qc.invalidateQueries({ queryKey: ['operacion', id] });
      setSelectedBloque(data.data.bloqueActual);
    },
  });

  const solicitudMut = useMutation({
    mutationFn: (data: any) => solicitudesApi.create(data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['operacion', id] });
      setShowSolicitudModal(false);
      setSolicitudDescripcion('');
    },
  });

  const registrarPagoMut = useMutation({
    mutationFn: ({ pagoId, data }: { pagoId: string; data: any }) =>
      api.patch(`/pagos/${pagoId}/registrar`, data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['operacion', id] });
      setPagoModal(null);
      setMontoPagado('');
      setNotasPago('');
    },
  });

  // ─── Loading ──────────────────────────────────────────────────────────────────
  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-[#c9a227]" />
      </div>
    );
  }
  if (!op) {
    return (
      <div className="text-center py-16">
        <p className="text-red-500 text-lg">Operación no encontrada.</p>
        <button onClick={() => navigate('/operaciones')} className="mt-4 text-sm text-[#c9a227] hover:underline">
          ← Volver a Operaciones
        </button>
      </div>
    );
  }

  const bloque = op.bloques?.find((b: any) => b.numeroBloque === selectedBloque);
  const bloqueActual = op.bloqueActual || 1;

  // ─── Helpers ──────────────────────────────────────────────────────────────────
  const getBloqueStatusDot = (num: number) => {
    const b = op.bloques?.find((x: any) => x.numeroBloque === num);
    if (!b) return 'bg-gray-200';
    if (b.status === 'PENDIENTE') return 'bg-gray-200';
    if (b.status === 'EN_PROCESO') return 'bg-blue-400 animate-pulse';
    if (['RECHAZADO', 'NO_VIABLE'].includes(b.status)) return 'bg-red-500';
    if (['PRE_AUTORIZADO', 'EXPEDIENTE_INTEGRADO', 'DICTAMEN_VIABLE', 'VALIDADO', 'FORMALIZADO'].includes(b.status)) return 'bg-green-500';
    if (['PRE_AUTORIZADO_CONDICIONADO', 'DICTAMEN_VIABLE_CONDICIONADO', 'OBSERVADO'].includes(b.status)) return 'bg-yellow-400';
    return 'bg-blue-400';
  };

  const isChecklistComplete = () => {
    if (!bloque?.checklistItems?.length) return false;
    return bloque.checklistItems.every((item: any) => item.completado);
  };

  const groupedChecklist = () => {
    if (!bloque?.checklistItems) return {};
    return bloque.checklistItems.reduce((acc: any, item: any) => {
      if (!acc[item.categoria]) acc[item.categoria] = [];
      acc[item.categoria].push(item);
      return acc;
    }, {} as Record<string, any[]>);
  };

  // ─── Render ───────────────────────────────────────────────────────────────────
  return (
    <div className="max-w-7xl mx-auto">
      {/* ─── Header ─────────────────────────────────────────────────────────────── */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
        <div className="flex items-start gap-3">
          <button
            onClick={() => navigate('/operaciones')}
            className="mt-1 text-gray-400 hover:text-gray-700 transition-colors"
          >
            ←
          </button>
          <div>
            <div className="flex items-center gap-3 flex-wrap">
              <h1 className="text-2xl font-bold text-gray-900">{op.folio}</h1>
              <span className={`px-2.5 py-0.5 rounded-full text-xs font-semibold text-white ${PRODUCTO_BADGE[op.producto] || 'bg-gray-500'}`}>
                {op.producto}
              </span>
              <span className={`px-2.5 py-0.5 rounded-full text-xs font-medium ${STATUS_BADGE[op.status] || 'bg-gray-100 text-gray-500'}`}>
                {op.status}
              </span>
            </div>
            <p className="text-gray-500 text-sm mt-0.5">
              {op.acreditadoNombre}
              {op.acreditadoRfc && <span className="ml-2 text-gray-400">· {op.acreditadoRfc}</span>}
            </p>
          </div>
        </div>
        <div className="flex gap-2">
          <button
            onClick={() => setShowSolicitudModal(true)}
            className="px-4 py-2 text-sm bg-[#1a1a1a] text-white rounded-lg hover:bg-gray-800 transition-colors"
          >
            + Nueva Solicitud
          </button>
        </div>
      </div>

      {/* ─── Tabs ────────────────────────────────────────────────────────────────── */}
      <div className="flex gap-1 border-b mb-6">
        {[
          { key: 'circuito', label: 'Circuito de Crédito' },
          { key: 'datos', label: 'Datos' },
          { key: 'financiero', label: 'Financiero' },
          { key: 'corridas', label: 'Corridas PDF' },
          { key: 'historial', label: 'Historial' },
        ].map(tab => (
          <button
            key={tab.key}
            onClick={() => setActiveTab(tab.key as any)}
            className={`px-4 py-2.5 text-sm font-medium border-b-2 transition-colors whitespace-nowrap ${
              activeTab === tab.key
                ? 'border-[#c9a227] text-[#c9a227]'
                : 'border-transparent text-gray-500 hover:text-gray-800'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* ═══════════════════════════════════════════════════════════════════════════
          TAB: CIRCUITO DE CRÉDITO
      ═══════════════════════════════════════════════════════════════════════════ */}
      {activeTab === 'circuito' && (
        <div className="space-y-6">
          {/* Block Tracker */}
          <div className="bg-white rounded-xl border shadow-sm p-6">
            <h3 className="text-sm font-semibold text-gray-500 uppercase tracking-wider mb-4">
              Circuito de Crédito — Bloque Actual: {bloqueActual}
            </h3>
            <div className="flex items-center gap-0">
              {[1, 2, 3, 4, 5].map((num, idx) => {
                const b = op.bloques?.find((x: any) => x.numeroBloque === num);
                const isActive = num === bloqueActual;
                const isPast = num < bloqueActual;
                const isFuture = num > bloqueActual;
                const isSelected = num === selectedBloque;
                return (
                  <div key={num} className="flex items-center flex-1">
                    <button
                      onClick={() => setSelectedBloque(num)}
                      disabled={isFuture && b?.status === 'PENDIENTE'}
                      className={`relative flex flex-col items-center flex-1 py-3 px-2 rounded-lg transition-all ${
                        isSelected ? 'bg-[#1a1a1a] text-white' :
                        isFuture && b?.status === 'PENDIENTE' ? 'opacity-40 cursor-not-allowed bg-gray-50' :
                        'hover:bg-gray-50 cursor-pointer'
                      }`}
                    >
                      <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold mb-1 border-2 ${
                        isSelected ? 'bg-[#c9a227] border-[#c9a227] text-[#1a1a1a]' :
                        isPast ? 'bg-green-500 border-green-500 text-white' :
                        isActive ? 'bg-blue-500 border-blue-500 text-white' :
                        'bg-gray-100 border-gray-200 text-gray-400'
                      }`}>
                        {isPast && !isSelected ? '✓' : num}
                      </div>
                      <span className={`text-xs font-medium text-center leading-tight ${isSelected ? 'text-white' : 'text-gray-600'}`}>
                        {BLOQUE_NOMBRES[num]}
                      </span>
                      {b?.slaHoras && (
                        <span className={`text-[10px] mt-0.5 ${isSelected ? 'text-gray-300' : 'text-gray-400'}`}>
                          SLA {b.slaHoras}h
                        </span>
                      )}
                      <div className={`w-2 h-2 rounded-full mt-1 ${getBloqueStatusDot(num)}`} />
                    </button>
                    {idx < 4 && (
                      <div className={`h-0.5 w-4 flex-shrink-0 ${isPast ? 'bg-green-400' : 'bg-gray-200'}`} />
                    )}
                  </div>
                );
              })}
            </div>
          </div>

          {/* Selected Block Detail */}
          {bloque && (
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              {/* Checklist */}
              <div className="lg:col-span-2 bg-white rounded-xl border shadow-sm">
                <div className="p-5 border-b flex items-center justify-between">
                  <div>
                    <h3 className="font-semibold text-gray-900">
                      Bloque {selectedBloque} — {BLOQUE_NOMBRES[selectedBloque]}
                    </h3>
                    <p className="text-xs text-gray-400 mt-0.5">
                      {bloque.checklistItems?.filter((i: any) => i.completado).length || 0} /&nbsp;
                      {bloque.checklistItems?.length || 0} items completados
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    {bloque.status !== 'PENDIENTE' && (
                      <span className={`px-2 py-0.5 rounded-full text-xs font-medium border ${
                        ['RECHAZADO', 'NO_VIABLE'].includes(bloque.status) ? 'bg-red-50 text-red-600 border-red-200' :
                        ['PRE_AUTORIZADO', 'EXPEDIENTE_INTEGRADO', 'DICTAMEN_VIABLE', 'VALIDADO', 'FORMALIZADO'].includes(bloque.status) ? 'bg-green-50 text-green-700 border-green-200' :
                        ['PRE_AUTORIZADO_CONDICIONADO', 'DICTAMEN_VIABLE_CONDICIONADO'].includes(bloque.status) ? 'bg-yellow-50 text-yellow-700 border-yellow-200' :
                        bloque.status === 'EN_PROCESO' ? 'bg-blue-50 text-blue-700 border-blue-200' :
                        'bg-gray-50 text-gray-600 border-gray-200'
                      }`}>
                        {bloque.status.replace(/_/g, ' ')}
                      </span>
                    )}
                  </div>
                </div>

                <div className="p-5 space-y-5">
                  {Object.entries(groupedChecklist()).map(([cat, items]) => (
                    <div key={cat}>
                      <div className={`inline-block px-2 py-0.5 rounded text-xs font-semibold border mb-3 ${CATEGORIA_COLORS[cat] || 'bg-gray-50 text-gray-600 border-gray-200'}`}>
                        {cat}
                      </div>
                      <div className="space-y-2">
                        {(items as any[]).map((item: any) => (
                          <label
                            key={item.id}
                            className={`flex items-start gap-3 p-3 rounded-lg border cursor-pointer transition-colors ${
                              item.completado
                                ? 'bg-green-50 border-green-200'
                                : 'bg-gray-50 border-gray-200 hover:bg-gray-100'
                            }`}
                          >
                            <input
                              type="checkbox"
                              checked={item.completado}
                              onChange={(e) => checklistMut.mutate({ itemId: item.id, completado: e.target.checked })}
                              className="mt-0.5 w-4 h-4 accent-[#c9a227] flex-shrink-0"
                            />
                            <div className="flex-1 min-w-0">
                              <p className={`text-sm ${item.completado ? 'line-through text-gray-400' : 'text-gray-700'}`}>
                                {item.descripcion}
                              </p>
                              {item.completado && item.completadoPor && (
                                <p className="text-xs text-gray-400 mt-0.5">
                                  ✓ {item.completadoPor?.nombre || 'Usuario'} — {item.fechaCompletado ? fmtDate(item.fechaCompletado) : ''}
                                </p>
                              )}
                            </div>
                          </label>
                        ))}
                      </div>
                    </div>
                  ))}

                  {!bloque.checklistItems?.length && (
                    <p className="text-sm text-gray-400 text-center py-4">Sin items de checklist</p>
                  )}
                </div>
              </div>

              {/* Right sidebar: Resultado + Avanzar + Solicitudes */}
              <div className="space-y-5">
                {/* Resultado del bloque */}
                {bloque.status === 'EN_PROCESO' && (
                  <div className="bg-white rounded-xl border shadow-sm p-5">
                    <h4 className="font-semibold text-sm mb-3">Dictaminar Bloque</h4>
                    <div className="space-y-2 mb-3">
                      {(BLOQUE_RESULTADOS[selectedBloque] || []).map(opt => (
                        <label
                          key={opt.value}
                          className={`flex items-center gap-2 p-2.5 rounded-lg border cursor-pointer transition-colors ${
                            resultado === opt.value ? opt.color + ' font-medium' : 'border-gray-200 hover:bg-gray-50'
                          }`}
                        >
                          <input
                            type="radio"
                            name="resultado"
                            value={opt.value}
                            checked={resultado === opt.value}
                            onChange={() => setResultado(opt.value)}
                            className="accent-[#c9a227]"
                          />
                          <span className="text-sm">{opt.label}</span>
                        </label>
                      ))}
                    </div>
                    {resultado && (
                      <textarea
                        value={condiciones}
                        onChange={e => setCondiciones(e.target.value)}
                        placeholder={
                          resultado.includes('CONDICIONADO') || resultado === 'OBSERVADO'
                            ? 'Condiciones requeridas...'
                            : resultado.includes('RECHAZADO') || resultado === 'NO_VIABLE'
                            ? 'Motivo del rechazo...'
                            : 'Notas adicionales (opcional)'
                        }
                        rows={3}
                        className="w-full text-sm border border-gray-200 rounded-lg p-2.5 outline-none focus:ring-2 focus:ring-[#c9a227]/30 focus:border-[#c9a227] resize-none"
                      />
                    )}
                    <button
                      onClick={() =>
                        resultadoMut.mutate({
                          bloqueId: bloque.id,
                          data: {
                            resultado,
                            condiciones: condiciones || null,
                            motivoRechazo: resultado.includes('RECHAZADO') || resultado === 'NO_VIABLE' ? condiciones : null,
                          },
                        })
                      }
                      disabled={!resultado || resultadoMut.isPending}
                      className="w-full mt-3 bg-[#1a1a1a] text-white py-2.5 rounded-lg text-sm font-medium hover:bg-gray-800 transition-colors disabled:opacity-40"
                    >
                      {resultadoMut.isPending ? 'Guardando...' : 'Guardar Dictamen'}
                    </button>
                  </div>
                )}

                {/* Avanzar al siguiente bloque */}
                {bloque.status !== 'PENDIENTE' &&
                  bloque.status !== 'EN_PROCESO' &&
                  !['RECHAZADO', 'NO_VIABLE'].includes(bloque.status) &&
                  selectedBloque === bloqueActual &&
                  bloqueActual < 5 && (
                    <div className="bg-white rounded-xl border shadow-sm p-5">
                      <h4 className="font-semibold text-sm mb-2">Avanzar a Bloque {bloqueActual + 1}</h4>
                      <p className="text-xs text-gray-500 mb-3">
                        {BLOQUE_NOMBRES[bloqueActual + 1]}
                      </p>
                      <button
                        onClick={() => avanzarMut.mutate(bloqueActual)}
                        disabled={!isChecklistComplete() || avanzarMut.isPending}
                        className="w-full bg-[#c9a227] text-[#1a1a1a] py-2.5 rounded-lg text-sm font-semibold hover:bg-yellow-500 transition-colors disabled:opacity-40"
                      >
                        {avanzarMut.isPending ? 'Avanzando...' : `→ Bloque ${bloqueActual + 1}`}
                      </button>
                      {!isChecklistComplete() && (
                        <p className="text-xs text-gray-400 text-center mt-2">
                          Completa todos los items del checklist para avanzar
                        </p>
                      )}
                    </div>
                  )}

                {/* Solicitudes del bloque */}
                <div className="bg-white rounded-xl border shadow-sm p-5">
                  <div className="flex items-center justify-between mb-3">
                    <h4 className="font-semibold text-sm">Solicitudes</h4>
                    <button
                      onClick={() => setShowSolicitudModal(true)}
                      className="text-xs text-[#c9a227] hover:underline"
                    >
                      + Nueva
                    </button>
                  </div>
                  {op.solicitudes?.length > 0 ? (
                    <div className="space-y-2">
                      {op.solicitudes.slice(0, 5).map((sol: any) => (
                        <div key={sol.id} className="p-2.5 bg-gray-50 rounded-lg text-xs">
                          <p className="font-medium text-gray-700">{TIPO_SOL[sol.tipo] || sol.tipo}</p>
                          <p className="text-gray-400 mt-0.5">
                            {sol.generadaPor?.nombre} → {sol.dirigidaA?.nombre || 'Sin asignar'}
                          </p>
                          <div className="flex items-center justify-between mt-1">
                            <span className={`px-1.5 py-0.5 rounded text-[10px] font-medium ${
                              sol.status === 'RESUELTA' ? 'bg-green-100 text-green-600' :
                              sol.status === 'CANCELADA' ? 'bg-red-100 text-red-600' :
                              'bg-blue-100 text-blue-600'
                            }`}>
                              {sol.status}
                            </span>
                            <span className="text-gray-400">{fmtDate(sol.creadoEn)}</span>
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="text-xs text-gray-400 text-center py-3">Sin solicitudes</p>
                  )}
                </div>

                {/* Condiciones del bloque (if any) */}
                {bloque.condiciones && (
                  <div className="bg-yellow-50 rounded-xl border border-yellow-200 p-4">
                    <p className="text-xs font-semibold text-yellow-700 mb-1">Condiciones del bloque</p>
                    <p className="text-sm text-yellow-800">{bloque.condiciones}</p>
                  </div>
                )}
                {bloque.motivoRechazo && (
                  <div className="bg-red-50 rounded-xl border border-red-200 p-4">
                    <p className="text-xs font-semibold text-red-700 mb-1">Motivo de rechazo</p>
                    <p className="text-sm text-red-800">{bloque.motivoRechazo}</p>
                  </div>
                )}

                {/* Admin override */}
                {user?.rol === 'ADMIN' && (
                  <AdminBloqueOverride
                    bloque={bloque}
                    onSave={(bloqueId, data) => resultadoMut.mutate({ bloqueId, data })}
                    isPending={resultadoMut.isPending}
                  />
                )}
              </div>
            </div>
          )}
        </div>
      )}

      {/* ═══════════════════════════════════════════════════════════════════════════
          TAB: DATOS
      ═══════════════════════════════════════════════════════════════════════════ */}
      {activeTab === 'datos' && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Acreditado */}
          <div className="bg-white rounded-xl border shadow-sm p-6">
            <h3 className="font-semibold mb-4 flex items-center gap-2">
              <span className="w-7 h-7 rounded-full bg-[#c9a227] text-[#1a1a1a] flex items-center justify-center text-xs font-bold">A</span>
              Acreditado
            </h3>
            <dl className="space-y-3 text-sm">
              {[
                ['Nombre', op.acreditadoNombre],
                ['RFC', op.acreditadoRfc || '—'],
                ['Tipo', op.acreditadoTipo === 'PF' ? 'Persona Física' : 'Persona Moral'],
                ['Teléfono', op.acreditadoTelefono || '—'],
                ['Correo', op.acreditadoEmail || '—'],
                ['Dirección', op.acreditadoDireccion || '—'],
              ].map(([label, value]) => (
                <div key={label} className="flex justify-between gap-4">
                  <dt className="text-gray-500 flex-shrink-0">{label}</dt>
                  <dd className="font-medium text-right">{value}</dd>
                </div>
              ))}
            </dl>
          </div>

          {/* Crédito */}
          <div className="bg-white rounded-xl border shadow-sm p-6">
            <h3 className="font-semibold mb-4 flex items-center gap-2">
              <span className="w-7 h-7 rounded-full bg-[#1a1a1a] text-white flex items-center justify-center text-xs font-bold">$</span>
              Condiciones del Crédito
            </h3>
            <dl className="space-y-3 text-sm">
              {[
                ['Monto', fmtMXN(op.monto)],
                ['Tasa Anual', fmtPct(op.tasaAnual)],
                ['Plazo', op.plazoMeses + ' meses'],
                ['Primer Pago', op.fechaPrimerPago ? fmtDate(op.fechaPrimerPago) : '—'],
                ['Comisión Apertura', fmtPct(op.comisionApertura)],
                ['Spread SOFOM', fmtPct(op.spreadSofom || 0)],
                ['Admin Fideicomiso', fmtPct(op.adminFideicomiso || 0)],
                ['Cobranza', fmtPct(op.comisionCobranza || 0)],
                op.valorInmueble ? ['Valor Inmueble', fmtMXN(op.valorInmueble)] : null,
                op.ltv ? ['LTV', fmtPct(op.ltv)] : null,
              ].filter(Boolean).map((row) => {
                const [label, value] = row as [string, string];
                return (
                  <div key={label} className="flex justify-between gap-4">
                    <dt className="text-gray-500 flex-shrink-0">{label}</dt>
                    <dd className="font-medium text-right">{value}</dd>
                  </div>
                );
              })}
            </dl>
          </div>

          {/* Inversionistas */}
          <div className="bg-white rounded-xl border shadow-sm p-6">
            <h3 className="font-semibold mb-4">Inversionistas</h3>
            {op.inversionistas?.length > 0 ? (
              <div className="space-y-3">
                {op.inversionistas.map((inv: any) => (
                  <div key={inv.id} className={`p-4 rounded-lg border ${inv.esSofom ? 'bg-[#c9a227]/10 border-[#c9a227]/30' : 'bg-gray-50'}`}>
                    <div className="flex items-center justify-between">
                      <p className="font-medium text-sm">
                        {inv.nombre}
                        {inv.esSofom && <span className="ml-2 text-xs text-[#c9a227] font-semibold">SOFOM</span>}
                      </p>
                      <span className="text-sm font-semibold">{fmtPct(inv.porcentaje)}</span>
                    </div>
                    <div className="flex justify-between text-xs text-gray-500 mt-1">
                      <span>{fmtMXN(inv.monto)}</span>
                      <span>Tasa neta: {fmtPct(inv.tasaNeta)}</span>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-gray-400 text-sm">Sin inversionistas asignados</p>
            )}
          </div>

          {/* Operador + Notas */}
          <div className="space-y-5">
            <div className="bg-white rounded-xl border shadow-sm p-6">
              <h3 className="font-semibold mb-3">Ejecutivo Responsable</h3>
              <p className="text-sm font-medium">{op.ejecutivo?.nombre || '—'}</p>
              <p className="text-sm text-gray-500">{op.ejecutivo?.email || ''}</p>
              {op.creadoPor && (
                <p className="text-xs text-gray-400 mt-2">Creado por: {op.creadoPor.nombre}</p>
              )}
            </div>
            {op.notas && (
              <div className="bg-white rounded-xl border shadow-sm p-6">
                <h3 className="font-semibold mb-3 text-yellow-700">Notas</h3>
                <p className="text-sm text-gray-700 whitespace-pre-wrap">{op.notas}</p>
              </div>
            )}
            {op.sofomComoAcreditante && (
              <div className="bg-white rounded-xl border border-[#c9a227]/30 shadow-sm p-6">
                <h3 className="font-semibold mb-3 text-[#c9a227]">SOFOM como Acreditante</h3>
                <dl className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <dt className="text-gray-500">Monto SOFOM</dt>
                    <dd className="font-medium">{fmtMXN(op.sofomMonto || 0)}</dd>
                  </div>
                  <div className="flex justify-between">
                    <dt className="text-gray-500">Tasa Neta SOFOM</dt>
                    <dd className="font-medium">{fmtPct(op.sofomTasaNeta || 0)}</dd>
                  </div>
                </dl>
              </div>
            )}
          </div>
        </div>
      )}

      {/* ═══════════════════════════════════════════════════════════════════════════
          TAB: FINANCIERO
      ═══════════════════════════════════════════════════════════════════════════ */}
      {activeTab === 'financiero' && (
        <div className="space-y-6">
          {/* KPIs */}
          {op.pagos?.length > 0 && (() => {
            const pagados = op.pagos.filter((p: any) => p.status === 'PAGADO');
            const vencidos = op.pagos.filter((p: any) => p.status === 'VENCIDO');
            const pendientes = op.pagos.filter((p: any) => p.status === 'PENDIENTE');
            const totalCapital = op.pagos.reduce((s: number, p: any) => s + p.capitalTotal, 0);
            const capitalPagado = pagados.reduce((s: number, p: any) => s + p.capitalTotal, 0);
            const pmt = op.pagos[0]?.pagoTotal || 0;
            return (
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                {[
                  { label: 'Pago Mensual', value: fmtMXN(pmt), color: 'text-[#1a1a1a]' },
                  { label: 'Capital Recuperado', value: fmtMXN(capitalPagado), color: 'text-green-600' },
                  { label: 'Saldo Pendiente', value: fmtMXN(totalCapital - capitalPagado), color: 'text-blue-600' },
                  { label: 'Pagos Vencidos', value: vencidos.length, color: vencidos.length > 0 ? 'text-red-600' : 'text-gray-500' },
                ].map(kpi => (
                  <div key={kpi.label} className="bg-white rounded-xl border shadow-sm p-4">
                    <p className="text-xs text-gray-500 mb-1">{kpi.label}</p>
                    <p className={`text-xl font-bold ${kpi.color}`}>{kpi.value}</p>
                  </div>
                ))}
              </div>
            );
          })()}

          {/* Payment table */}
          <div className="bg-white rounded-xl border shadow-sm overflow-hidden">
            <div className="p-5 border-b">
              <h3 className="font-semibold">Tabla de Amortización</h3>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="bg-gray-50 border-b">
                    {['No.', 'Vencimiento', 'Capital', 'Interés', 'Total', 'Saldo', 'Status', 'Pagado'].map(h => (
                      <th key={h} className="px-3 py-3 text-left text-xs font-medium text-gray-500 first:text-center">{h}</th>
                    ))}
                    <th className="px-3 py-3 text-left text-xs font-medium text-gray-500">Acción</th>
                  </tr>
                </thead>
                <tbody>
                  {op.pagos?.map((pago: any) => (
                    <tr key={pago.id} className={`border-b hover:bg-gray-50 ${pago.status === 'VENCIDO' ? 'bg-red-50' : ''}`}>
                      <td className="px-3 py-2 text-center text-gray-500">{pago.numeroPago}</td>
                      <td className="px-3 py-2">{fmtDate(pago.fechaVencimiento)}</td>
                      <td className="px-3 py-2 text-right">{fmtMXN(pago.capitalTotal)}</td>
                      <td className="px-3 py-2 text-right">{fmtMXN(pago.interesTotal)}</td>
                      <td className="px-3 py-2 text-right font-medium">{fmtMXN(pago.pagoTotal)}</td>
                      <td className="px-3 py-2 text-right">{fmtMXN(pago.saldo)}</td>
                      <td className="px-3 py-2">
                        <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${
                          pago.status === 'PAGADO' ? 'bg-green-100 text-green-600' :
                          pago.status === 'VENCIDO' ? 'bg-red-100 text-red-600' :
                          pago.status === 'PARCIAL' ? 'bg-yellow-100 text-yellow-600' :
                          pago.status === 'CONDONADO' ? 'bg-purple-100 text-purple-600' :
                          'bg-gray-100 text-gray-500'
                        }`}>
                          {pago.status}
                        </span>
                      </td>
                      <td className="px-3 py-2 text-right text-gray-500">
                        {pago.montoPagado ? fmtMXN(pago.montoPagado) : '—'}
                      </td>
                      <td className="px-3 py-2">
                        {(pago.status === 'PENDIENTE' || pago.status === 'VENCIDO') && (
                          <button
                            onClick={() => {
                              setPagoModal({ pago });
                              setMontoPagado(pago.pagoTotal.toFixed(2));
                              setFechaPago(new Date().toISOString().split('T')[0]);
                              setNotasPago('');
                            }}
                            className="text-xs px-2 py-1 bg-[#1a1a1a] text-white rounded hover:bg-gray-800 transition-colors whitespace-nowrap"
                          >
                            Registrar
                          </button>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* ═══════════════════════════════════════════════════════════════════════════
          TAB: CORRIDAS PDF
      ═══════════════════════════════════════════════════════════════════════════ */}
      {activeTab === 'corridas' && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {[
            {
              title: 'Corrida del Acreditado',
              desc: 'Tabla de amortización completa con desglose de capital e intereses para presentar al acreditado.',
              icon: '📋',
              color: 'border-blue-200 bg-blue-50',
              btnColor: 'bg-blue-600 hover:bg-blue-700',
              action: async () => {
                const r = await operacionesApi.corrida(id!, 'acreditado');
                const { amort, nombre } = r.data;
                imprimirCorrida({
                  tipo: 'acreditado',
                  nombre: nombre || op.acreditadoNombre,
                  monto: op.monto,
                  tasaAnual: op.tasaAnual,
                  plazoMeses: op.plazoMeses,
                  pmt: amort.pmt,
                  comisionApertura: op.monto * op.comisionApertura,
                  totalIntereses: amort.totalIntereses,
                  totalPagado: amort.totalPagado,
                  filas: amort.filas,
                });
              },
            },
            ...( (op.inversionistas || []).map((inv: any) => ({
              title: `Corrida — ${inv.nombre}`,
              desc: `Corrida de flujos para el inversionista. Monto: ${fmtMXN(inv.monto)} | Tasa neta: ${fmtPct(inv.tasaNeta)}`,
              icon: '💰',
              color: 'border-[#c9a227]/30 bg-[#c9a227]/5',
              btnColor: 'bg-[#c9a227] hover:bg-yellow-500 text-[#1a1a1a]',
              action: async () => {
                const r = await operacionesApi.corrida(id!, 'inversionista', inv.id);
                const { amort, nombre } = r.data;
                imprimirCorrida({
                  tipo: 'inversionista',
                  nombre,
                  monto: inv.monto,
                  tasaAnual: inv.tasaNeta,
                  plazoMeses: op.plazoMeses,
                  pmt: amort.pmt,
                  comisionApertura: 0,
                  totalIntereses: amort.totalIntereses,
                  totalPagado: amort.totalPagado,
                  filas: amort.filas,
                });
              },
            })) ),
          ].map((item, idx) => (
            <div key={idx} className={`bg-white rounded-xl border shadow-sm p-6 ${item.color}`}>
              <div className="text-3xl mb-3">{item.icon}</div>
              <h3 className="font-semibold mb-2">{item.title}</h3>
              <p className="text-sm text-gray-500 mb-5">{item.desc}</p>
              <button
                onClick={item.action}
                className={`w-full py-2.5 rounded-lg text-sm font-semibold text-white transition-colors ${item.btnColor}`}
              >
                Generar PDF
              </button>
            </div>
          ))}
          {op.inversionistas?.length === 0 && (
            <div className="md:col-span-2 bg-gray-50 rounded-xl border border-dashed p-6 text-center">
              <p className="text-gray-400 text-sm">Sin inversionistas asignados — agrega inversionistas para generar corridas</p>
            </div>
          )}
        </div>
      )}

      {/* ═══════════════════════════════════════════════════════════════════════════
          TAB: HISTORIAL
      ═══════════════════════════════════════════════════════════════════════════ */}
      {activeTab === 'historial' && (
        <div className="bg-white rounded-xl border shadow-sm">
          <div className="p-5 border-b">
            <h3 className="font-semibold">Historial de Movimientos</h3>
          </div>
          <div className="p-5">
            {op.historial?.length > 0 ? (
              <ol className="relative border-l-2 border-gray-100 ml-3 space-y-6">
                {op.historial.map((h: any) => (
                  <li key={h.id} className="ml-6">
                    <span className="absolute -left-2 flex items-center justify-center w-4 h-4 rounded-full bg-[#c9a227]" />
                    <div className="flex items-center justify-between mb-1">
                      <p className="text-sm font-semibold text-gray-800">{h.descripcion}</p>
                      <span className="text-xs text-gray-400">{fmtDate(h.creadoEn)}</span>
                    </div>
                    {h.detalle && <p className="text-xs text-gray-500">{h.detalle}</p>}
                    <p className="text-xs text-gray-400 mt-0.5">
                      {h.usuario?.nombre || 'Sistema'} · {h.tipo}
                    </p>
                  </li>
                ))}
              </ol>
            ) : (
              <p className="text-sm text-gray-400 text-center py-8">Sin movimientos registrados</p>
            )}
          </div>
        </div>
      )}

      {/* ═══════════════════════════════════════════════════════════════════════════
          MODAL: Nueva Solicitud
      ═══════════════════════════════════════════════════════════════════════════ */}
      {showSolicitudModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-md">
            <div className="p-6 border-b">
              <h3 className="font-semibold text-lg">Nueva Solicitud</h3>
              <p className="text-sm text-gray-500 mt-0.5">{op.folio} — {op.acreditadoNombre}</p>
            </div>
            <div className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Tipo de Solicitud</label>
                <select
                  value={solicitudTipo}
                  onChange={e => setSolicitudTipo(e.target.value)}
                  className="w-full px-3 py-2.5 border border-gray-300 rounded-lg text-sm outline-none focus:ring-2 focus:ring-[#c9a227]/30 focus:border-[#c9a227]"
                >
                  {Object.entries(TIPO_SOL).map(([k, v]) => (
                    <option key={k} value={k}>{k} — {v}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Descripción</label>
                <textarea
                  value={solicitudDescripcion}
                  onChange={e => setSolicitudDescripcion(e.target.value)}
                  rows={3}
                  placeholder="Describe el requerimiento específico..."
                  className="w-full px-3 py-2.5 border border-gray-300 rounded-lg text-sm outline-none focus:ring-2 focus:ring-[#c9a227]/30 focus:border-[#c9a227] resize-none"
                />
              </div>
            </div>
            <div className="p-6 border-t flex gap-3 justify-end">
              <button
                onClick={() => setShowSolicitudModal(false)}
                className="px-4 py-2 text-sm text-gray-600 hover:text-gray-800 border border-gray-300 rounded-lg transition-colors"
              >
                Cancelar
              </button>
              <button
                onClick={() =>
                  solicitudMut.mutate({
                    operacionId: id,
                    tipo: solicitudTipo,
                    descripcion: solicitudDescripcion,
                    generadaPorId: user?.id,
                    bloqueNumero: selectedBloque,
                  })
                }
                disabled={!solicitudDescripcion || solicitudMut.isPending}
                className="px-4 py-2 text-sm bg-[#1a1a1a] text-white rounded-lg hover:bg-gray-800 transition-colors disabled:opacity-40"
              >
                {solicitudMut.isPending ? 'Enviando...' : 'Crear Solicitud'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ═══ MODAL: Registrar Pago ═══ */}
      {pagoModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-md">
            <div className="p-6 border-b">
              <h3 className="font-semibold text-lg">Registrar Pago</h3>
              <p className="text-sm text-gray-500 mt-0.5">
                Pago #{pagoModal.pago.numeroPago} — Vence: {new Date(pagoModal.pago.fechaVencimiento).toLocaleDateString('es-MX')}
              </p>
            </div>
            <div className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Monto Pagado ($)</label>
                <input
                  type="number"
                  step="0.01"
                  value={montoPagado}
                  onChange={e => setMontoPagado(e.target.value)}
                  className="w-full px-3 py-2.5 border border-gray-300 rounded-lg text-sm outline-none focus:ring-2 focus:ring-[#c9a227]/30 focus:border-[#c9a227]"
                />
                <p className="text-xs text-gray-400 mt-1">
                  Pago total programado: {new Intl.NumberFormat('es-MX', { style: 'currency', currency: 'MXN' }).format(pagoModal.pago.pagoTotal)}
                </p>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Fecha de Pago</label>
                <input
                  type="date"
                  value={fechaPago}
                  onChange={e => setFechaPago(e.target.value)}
                  className="w-full px-3 py-2.5 border border-gray-300 rounded-lg text-sm outline-none focus:ring-2 focus:ring-[#c9a227]/30 focus:border-[#c9a227]"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Notas (opcional)</label>
                <input
                  type="text"
                  value={notasPago}
                  onChange={e => setNotasPago(e.target.value)}
                  placeholder="Referencia de transferencia, banco, etc."
                  className="w-full px-3 py-2.5 border border-gray-300 rounded-lg text-sm outline-none focus:ring-2 focus:ring-[#c9a227]/30 focus:border-[#c9a227]"
                />
              </div>
            </div>
            <div className="p-6 border-t flex gap-3 justify-end">
              <button
                onClick={() => setPagoModal(null)}
                className="px-4 py-2 text-sm text-gray-600 border border-gray-300 rounded-lg hover:bg-gray-50"
              >
                Cancelar
              </button>
              <button
                onClick={() => registrarPagoMut.mutate({
                  pagoId: pagoModal.pago.id,
                  data: {
                    montoPagado: parseFloat(montoPagado),
                    fechaPago,
                    notas: notasPago || undefined,
                  },
                })}
                disabled={!montoPagado || registrarPagoMut.isPending}
                className="px-4 py-2 text-sm bg-[#1a1a1a] text-white rounded-lg hover:bg-gray-800 disabled:opacity-40"
              >
                {registrarPagoMut.isPending ? 'Registrando...' : 'Confirmar Pago'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
