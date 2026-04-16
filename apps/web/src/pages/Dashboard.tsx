import { useQuery } from '@tanstack/react-query';
import api from '../lib/api';
import {
  DollarSign,
  FileText,
  TrendingUp,
  AlertTriangle,
} from 'lucide-react';

function StatCard({ title, value, subtitle, icon: Icon, color }: any) {
  return (
    <div className="bg-white rounded-xl p-6 shadow-sm border">
      <div className="flex items-start justify-between">
        <div>
          <p className="text-sm text-gray-500">{title}</p>
          <p className="text-2xl font-bold mt-1">{value}</p>
          {subtitle && <p className="text-xs text-gray-400 mt-1">{subtitle}</p>}
        </div>
        <div className={`p-3 rounded-lg ${color}`}>
          <Icon size={20} className="text-white" />
        </div>
      </div>
    </div>
  );
}

export default function Dashboard() {
  const { data, isLoading } = useQuery({
    queryKey: ['dashboard'],
    queryFn: () => api.get('/dashboard').then((r) => r.data),
  });

  const fmtMXN = (n: number) =>
    new Intl.NumberFormat('es-MX', { style: 'currency', currency: 'MXN' }).format(n);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gold-500" />
      </div>
    );
  }

  return (
    <div>
      <div className="mb-8">
        <h1 className="text-2xl font-bold">Dashboard</h1>
        <p className="text-gray-500 text-sm">Resumen ejecutivo de operaciones</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <StatCard
          title="Cartera Total"
          value={data ? fmtMXN(data.carteraTotal) : '$0'}
          subtitle="Créditos activos"
          icon={DollarSign}
          color="bg-green-500"
        />
        <StatCard
          title="Operaciones Activas"
          value={data?.operacionesActivas || 0}
          icon={FileText}
          color="bg-blue-500"
        />
        <StatCard
          title="Cobranza del Mes"
          value={data ? `${data.cobranza.porcentaje}%` : '0%'}
          subtitle={data ? `${fmtMXN(data.cobranza.real)} de ${fmtMXN(data.cobranza.esperada)}` : ''}
          icon={TrendingUp}
          color="bg-gold-500"
        />
        <StatCard
          title="Morosidad"
          value={data ? `${data.morosidad}%` : '0%'}
          icon={AlertTriangle}
          color={data?.morosidad > 5 ? 'bg-red-500' : 'bg-gray-400'}
        />
      </div>

      {/* Status breakdown & Top investors */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white rounded-xl p-6 shadow-sm border">
          <h3 className="font-semibold mb-4">Operaciones por Estatus</h3>
          <div className="space-y-3">
            {data?.porStatus?.map((s: any) => (
              <div key={s.status} className="flex items-center justify-between">
                <span className="text-sm text-gray-600">{s.status}</span>
                <span className="bg-gray-100 px-3 py-1 rounded-full text-sm font-medium">
                  {s.count}
                </span>
              </div>
            ))}
            {(!data?.porStatus || data.porStatus.length === 0) && (
              <p className="text-gray-400 text-sm">No hay operaciones registradas</p>
            )}
          </div>
        </div>

        <div className="bg-white rounded-xl p-6 shadow-sm border">
          <h3 className="font-semibold mb-4">Top Inversionistas</h3>
          <div className="space-y-3">
            {data?.topInversionistas?.map((inv: any, i: number) => (
              <div key={i} className="flex items-center justify-between">
                <span className="text-sm text-gray-600">{inv.nombre}</span>
                <span className="text-sm font-medium">{fmtMXN(inv.montoTotal)}</span>
              </div>
            ))}
            {(!data?.topInversionistas || data.topInversionistas.length === 0) && (
              <p className="text-gray-400 text-sm">No hay inversionistas registrados</p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
