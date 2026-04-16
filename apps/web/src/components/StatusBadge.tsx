const statusConfig: Record<string, { label: string; className: string }> = {
  PROSPECTO: { label: 'Prospecto', className: 'bg-gray-100 text-gray-600' },
  ANALISIS: { label: 'Análisis', className: 'bg-blue-100 text-blue-600' },
  APROBADA: { label: 'Aprobada', className: 'bg-green-100 text-green-700' },
  ACTIVA: { label: 'Activa', className: 'bg-emerald-100 text-emerald-700' },
  LIQUIDADA: { label: 'Liquidada', className: 'bg-purple-100 text-purple-700' },
  EN_MORA: { label: 'En Mora', className: 'bg-red-100 text-red-700' },
  EJECUTADA: { label: 'Ejecutada', className: 'bg-orange-100 text-orange-700' },
  CANCELADA: { label: 'Cancelada', className: 'bg-gray-200 text-gray-500' },
};

const productoBadge: Record<string, { label: string; className: string }> = {
  PYME: { label: 'PyME', className: 'bg-indigo-100 text-indigo-700' },
  PERSONAL: { label: 'Personal', className: 'bg-teal-100 text-teal-700' },
  EXPRESS: { label: 'Express', className: 'bg-yellow-100 text-yellow-700' },
  STPB: { label: 'Sé Tu Propio Banco', className: 'bg-amber-100 text-amber-700' },
};

export function StatusBadge({ status }: { status: string }) {
  const cfg = statusConfig[status] || { label: status, className: 'bg-gray-100 text-gray-600' };
  return <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${cfg.className}`}>{cfg.label}</span>;
}

export function ProductoBadge({ producto }: { producto: string }) {
  const cfg = productoBadge[producto] || { label: producto, className: 'bg-gray-100 text-gray-600' };
  return <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${cfg.className}`}>{cfg.label}</span>;
}
