import { X, Bell, FileText, CheckCircle, AlertTriangle, Clock, CreditCard, MessageSquare } from 'lucide-react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import { notificacionesApi } from '../lib/api';

const ICONS: Record<string, React.ReactNode> = {
  SOLICITUD_RECIBIDA:   <FileText      size={14} className="text-blue-500" />,
  SOLICITUD_COMPLETADA: <CheckCircle   size={14} className="text-green-500" />,
  DOCUMENTO_CARGADO:    <CheckCircle   size={14} className="text-green-500" />,
  BLOQUE_AVANZADO:      <CheckCircle   size={14} className="text-green-500" />,
  SLA_PROXIMO:          <AlertTriangle size={14} className="text-yellow-500" />,
  SLA_VENCIDO:          <AlertTriangle size={14} className="text-red-500" />,
  PAGO_REGISTRADO:      <CreditCard    size={14} className="text-green-500" />,
  MORA_ACTIVADA:        <AlertTriangle size={14} className="text-red-500" />,
  COMENTARIO:           <MessageSquare size={14} className="text-blue-400" />,
};

function tiempoRelativo(fecha: string) {
  const diff = Date.now() - new Date(fecha).getTime();
  const min  = Math.floor(diff / 60000);
  if (min < 1)   return 'ahora';
  if (min < 60)  return `hace ${min} min`;
  const hrs = Math.floor(min / 60);
  if (hrs < 24)  return `hace ${hrs} hr${hrs > 1 ? 's' : ''}`;
  const dias = Math.floor(hrs / 24);
  return `hace ${dias} día${dias > 1 ? 's' : ''}`;
}

export default function NotificationPanel({ onClose }: { onClose: () => void }) {
  const navigate    = useNavigate();
  const qc          = useQueryClient();

  const { data: notifs = [], isLoading } = useQuery({
    queryKey: ['notificaciones'],
    queryFn:  () => notificacionesApi.list().then(r => r.data),
    refetchInterval: 30_000,   // poll cada 30 s
  });

  const marcarLeida = useMutation({
    mutationFn: (id: string) => notificacionesApi.marcarLeida(id),
    onSuccess:  () => qc.invalidateQueries({ queryKey: ['notificaciones'] }),
  });

  const marcarTodas = useMutation({
    mutationFn: () => notificacionesApi.marcarTodas(),
    onSuccess:  () => qc.invalidateQueries({ queryKey: ['notificaciones'] }),
  });

  function handleClick(n: any) {
    if (!n.leida) marcarLeida.mutate(n.id);
    if (n.operacionId) {
      navigate(`/operaciones/${n.operacionId}`);
      onClose();
    }
  }

  const noLeidas = notifs.filter((n: any) => !n.leida).length;

  return (
    <>
      <div className="fixed inset-0 z-40" onClick={onClose} />
      <div className="fixed right-4 top-14 w-80 bg-white rounded-xl shadow-xl border z-50 overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between px-4 py-3 border-b">
          <div className="flex items-center gap-2">
            <Bell size={16} className="text-gray-500" />
            <span className="font-semibold text-sm">Notificaciones</span>
            {noLeidas > 0 && (
              <span className="bg-red-500 text-white text-[10px] font-bold px-1.5 py-0.5 rounded-full">
                {noLeidas}
              </span>
            )}
          </div>
          <div className="flex items-center gap-3">
            {noLeidas > 0 && (
              <button
                onClick={() => marcarTodas.mutate()}
                className="text-xs text-blue-600 hover:underline"
              >
                Marcar todo leído
              </button>
            )}
            <button onClick={onClose}><X size={16} className="text-gray-400" /></button>
          </div>
        </div>

        {/* Lista */}
        <div className="divide-y max-h-96 overflow-y-auto">
          {isLoading && (
            <div className="px-4 py-6 text-center text-sm text-gray-400">Cargando...</div>
          )}
          {!isLoading && notifs.length === 0 && (
            <div className="px-4 py-8 text-center">
              <Bell size={28} className="mx-auto text-gray-300 mb-2" />
              <p className="text-sm text-gray-400">Sin notificaciones</p>
            </div>
          )}
          {notifs.map((n: any) => (
            <div
              key={n.id}
              onClick={() => handleClick(n)}
              className={`px-4 py-3 cursor-pointer transition-colors hover:bg-gray-50 ${!n.leida ? 'bg-blue-50/50' : ''}`}
            >
              <div className="flex gap-3">
                <div className="mt-0.5 flex-shrink-0">
                  {ICONS[n.tipo] ?? <Bell size={14} className="text-gray-400" />}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-gray-900 leading-snug">{n.titulo}</p>
                  <p className="text-xs text-gray-500 mt-0.5 leading-snug">{n.descripcion}</p>
                  <div className="flex items-center gap-1 mt-1">
                    <Clock size={10} className="text-gray-300" />
                    <p className="text-[10px] text-gray-400">{tiempoRelativo(n.creadoEn)}</p>
                    {n.operacionId && (
                      <span className="text-[10px] text-blue-400 ml-1">→ Ver operación</span>
                    )}
                  </div>
                </div>
                {!n.leida && (
                  <div className="w-2 h-2 bg-blue-500 rounded-full mt-1.5 flex-shrink-0" />
                )}
              </div>
            </div>
          ))}
        </div>
      </div>
    </>
  );
}
