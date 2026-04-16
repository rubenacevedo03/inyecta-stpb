import { X, Bell, FileText, CheckCircle, AlertTriangle, Clock } from 'lucide-react';

const mockNotifs = [
  { id: '1', tipo: 'SOLICITUD_RECIBIDA', titulo: 'Nueva solicitud: SOL-01', desc: 'Dictamen de Pre-autorización — Operación INY-2604-ABC', tiempo: 'hace 5 min', leida: false },
  { id: '2', tipo: 'SLA_PROXIMO', titulo: 'SLA por vencer (12 hrs)', desc: 'Bloque 1 — Constructora Potosina S.R.L.', tiempo: 'hace 1 hr', leida: false },
  { id: '3', tipo: 'DOCUMENTO_CARGADO', titulo: 'Documento cargado', desc: 'CLG subido a Desarrollos del Centro S.A.', tiempo: 'hace 3 hrs', leida: true },
];

const icons: Record<string, React.ReactNode> = {
  SOLICITUD_RECIBIDA: <FileText size={14} className="text-blue-500" />,
  SLA_PROXIMO: <AlertTriangle size={14} className="text-yellow-500" />,
  SLA_VENCIDO: <AlertTriangle size={14} className="text-red-500" />,
  DOCUMENTO_CARGADO: <CheckCircle size={14} className="text-green-500" />,
  BLOQUE_AVANZADO: <CheckCircle size={14} className="text-green-500" />,
};

export default function NotificationPanel({ onClose }: { onClose: () => void }) {
  return (
    <>
      <div className="fixed inset-0 z-40" onClick={onClose} />
      <div className="fixed right-4 top-14 w-80 bg-white rounded-xl shadow-xl border z-50 overflow-hidden">
        <div className="flex items-center justify-between px-4 py-3 border-b">
          <div className="flex items-center gap-2">
            <Bell size={16} className="text-gray-500" />
            <span className="font-semibold text-sm">Notificaciones</span>
          </div>
          <div className="flex items-center gap-3">
            <button className="text-xs text-blue-600 hover:underline">Marcar todo leído</button>
            <button onClick={onClose}><X size={16} className="text-gray-400" /></button>
          </div>
        </div>
        <div className="divide-y max-h-96 overflow-y-auto">
          {mockNotifs.map(n => (
            <div key={n.id} className={`px-4 py-3 hover:bg-gray-50 cursor-pointer ${!n.leida ? 'bg-blue-50/50' : ''}`}>
              <div className="flex gap-3">
                <div className="mt-0.5 flex-shrink-0">{icons[n.tipo] || <Bell size={14} />}</div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-gray-900">{n.titulo}</p>
                  <p className="text-xs text-gray-500 mt-0.5">{n.desc}</p>
                  <p className="text-xs text-gray-400 mt-1">{n.tiempo}</p>
                </div>
                {!n.leida && <div className="w-2 h-2 bg-blue-500 rounded-full mt-1 flex-shrink-0" />}
              </div>
            </div>
          ))}
        </div>
        <div className="px-4 py-2 border-t text-center">
          <button className="text-xs text-blue-600 hover:underline">Ver todas las notificaciones</button>
        </div>
      </div>
    </>
  );
}
