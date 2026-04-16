import { useQuery } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import api from '../lib/api';
import { Plus, Search } from 'lucide-react';
import { useState } from 'react';
import { StatusBadge, ProductoBadge } from '../components/StatusBadge';

const fmtMXN = (n: number) =>
  new Intl.NumberFormat('es-MX', { style: 'currency', currency: 'MXN' }).format(n);

export default function Operaciones() {
  const [search, setSearch] = useState('');
  const { data: operaciones, isLoading } = useQuery({
    queryKey: ['operaciones'],
    queryFn: () => api.get('/operaciones').then((r) => r.data),
  });

  const filtered = operaciones?.filter(
    (op: any) =>
      op.folio.toLowerCase().includes(search.toLowerCase()) ||
      (op.acreditadoNombre || '').toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold">Operaciones</h1>
          <p className="text-gray-500 text-sm">Administración de créditos</p>
        </div>
        <Link
          to="/operaciones/nueva"
          className="bg-[#1a1a1a] text-white px-4 py-2.5 rounded-lg text-sm font-medium hover:bg-gray-800 transition-colors flex items-center gap-2"
        >
          <Plus size={16} />
          Nueva Operación
        </Link>
      </div>

      <div className="bg-white rounded-xl shadow-sm border">
        <div className="p-4 border-b">
          <div className="relative">
            <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
            <input
              type="text"
              placeholder="Buscar por folio o acreditado..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-[#c9a227] focus:border-[#c9a227] outline-none"
            />
          </div>
        </div>

        {isLoading ? (
          <div className="p-8 text-center text-gray-400">Cargando...</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b bg-gray-50">
                  <th className="text-left px-4 py-3 font-medium text-gray-500 text-xs uppercase">Folio</th>
                  <th className="text-left px-4 py-3 font-medium text-gray-500 text-xs uppercase">Acreditado</th>
                  <th className="text-left px-4 py-3 font-medium text-gray-500 text-xs uppercase">Producto</th>
                  <th className="text-right px-4 py-3 font-medium text-gray-500 text-xs uppercase">Monto</th>
                  <th className="text-center px-4 py-3 font-medium text-gray-500 text-xs uppercase">Tasa</th>
                  <th className="text-center px-4 py-3 font-medium text-gray-500 text-xs uppercase">Plazo</th>
                  <th className="text-center px-4 py-3 font-medium text-gray-500 text-xs uppercase">Status</th>
                  <th className="text-left px-4 py-3 font-medium text-gray-500 text-xs uppercase">Fecha</th>
                </tr>
              </thead>
              <tbody>
                {filtered?.map((op: any) => (
                  <tr key={op.id} className="border-b hover:bg-gray-50 cursor-pointer">
                    <td className="px-4 py-3">
                      <Link to={`/operaciones/${op.id}`} className="text-[#c9a227] font-medium hover:underline">
                        {op.folio}
                      </Link>
                    </td>
                    <td className="px-4 py-3">{op.acreditadoNombre}</td>
                    <td className="px-4 py-3">
                      <ProductoBadge producto={op.producto} />
                    </td>
                    <td className="px-4 py-3 text-right font-medium">{fmtMXN(op.monto)}</td>
                    <td className="px-4 py-3 text-center">{(op.tasaAnual * 100).toFixed(0)}%</td>
                    <td className="px-4 py-3 text-center">{op.plazoMeses}m</td>
                    <td className="px-4 py-3 text-center">
                      <StatusBadge status={op.status} />
                    </td>
                    <td className="px-4 py-3 text-gray-500">
                      {new Date(op.fechaInicio).toLocaleDateString('es-MX')}
                    </td>
                  </tr>
                ))}
                {(!filtered || filtered.length === 0) && (
                  <tr>
                    <td colSpan={8} className="px-4 py-8 text-center text-gray-400">
                      No hay operaciones registradas
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
