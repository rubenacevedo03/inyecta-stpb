import { useQuery } from '@tanstack/react-query';
import api from '../lib/api';
import { TrendingUp, AlertTriangle } from 'lucide-react';

const fmtMXN = (n: number) => new Intl.NumberFormat('es-MX', { style: 'currency', currency: 'MXN' }).format(n);

export default function Cartera() {
  const { data: ops } = useQuery({
    queryKey: ['cartera'],
    queryFn: () => api.get('/operaciones?status=ACTIVA').then(r => r.data),
  });

  const activas = ops?.filter((o: any) => o.status === 'ACTIVA') || [];
  const carteraTotal = activas.reduce((s: number, o: any) => s + o.monto, 0);

  return (
    <div>
      <div className="flex items-center gap-3 mb-6">
        <div className="p-2 bg-[#1a1a1a] rounded-lg"><TrendingUp size={20} className="text-[#c9a227]" /></div>
        <div>
          <h1 className="text-2xl font-bold">Cartera Activa</h1>
          <p className="text-gray-500 text-sm">Seguimiento de créditos formalizados</p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
        <div className="bg-white rounded-xl p-5 shadow-sm border">
          <p className="text-xs text-gray-500 mb-1">Cartera Total Vigente</p>
          <p className="text-2xl font-bold">{fmtMXN(carteraTotal)}</p>
        </div>
        <div className="bg-white rounded-xl p-5 shadow-sm border">
          <p className="text-xs text-gray-500 mb-1">Operaciones Activas</p>
          <p className="text-2xl font-bold">{activas.length}</p>
        </div>
        <div className="bg-white rounded-xl p-5 shadow-sm border flex items-center gap-3">
          <AlertTriangle size={20} className="text-yellow-500 flex-shrink-0" />
          <div>
            <p className="text-xs text-gray-500">En Mora</p>
            <p className="text-2xl font-bold">{ops?.filter((o: any) => o.status === 'EN_MORA').length || 0}</p>
          </div>
        </div>
      </div>

      <div className="bg-white rounded-xl shadow-sm border overflow-hidden">
        <div className="p-4 border-b"><h3 className="font-semibold">Operaciones Activas</h3></div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b bg-gray-50">
                {['Folio', 'Acreditado', 'Producto', 'Monto Original', 'Tasa', 'Plazo', 'Estatus'].map(h => (
                  <th key={h} className="px-4 py-3 text-left text-xs font-medium text-gray-500">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {activas.map((op: any) => (
                <tr key={op.id} className="border-b hover:bg-gray-50">
                  <td className="px-4 py-3 font-medium text-[#c9a227]">{op.folio}</td>
                  <td className="px-4 py-3">{op.acreditadoNombre}</td>
                  <td className="px-4 py-3"><span className="bg-amber-100 text-amber-700 px-2 py-0.5 rounded-full text-xs">{op.producto}</span></td>
                  <td className="px-4 py-3 font-medium">{fmtMXN(op.monto)}</td>
                  <td className="px-4 py-3">{(op.tasaAnual * 100).toFixed(0)}%</td>
                  <td className="px-4 py-3">{op.plazoMeses}m</td>
                  <td className="px-4 py-3"><span className="bg-emerald-100 text-emerald-700 px-2 py-0.5 rounded-full text-xs">{op.status}</span></td>
                </tr>
              ))}
              {activas.length === 0 && (
                <tr><td colSpan={7} className="px-4 py-8 text-center text-gray-400">No hay operaciones activas</td></tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
