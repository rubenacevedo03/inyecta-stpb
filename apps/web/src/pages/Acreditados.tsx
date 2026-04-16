import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import api from '../lib/api';
import { Plus } from 'lucide-react';
import { useState } from 'react';

export default function Acreditados() {
  const queryClient = useQueryClient();
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({ nombre: '', rfc: '', telefono: '', email: '', direccion: '' });

  const { data: acreditados, isLoading } = useQuery({
    queryKey: ['acreditados'],
    queryFn: () => api.get('/acreditados').then(r => r.data),
  });

  const mutation = useMutation({
    mutationFn: (data: any) => api.post('/acreditados', data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['acreditados'] });
      setShowForm(false);
      setForm({ nombre: '', rfc: '', telefono: '', email: '', direccion: '' });
    },
  });

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold">Acreditados</h1>
          <p className="text-gray-500 text-sm">Catálogo de clientes</p>
        </div>
        <button
          onClick={() => setShowForm(!showForm)}
          className="bg-inyecta-dark text-white px-4 py-2.5 rounded-lg text-sm font-medium hover:bg-gray-800 flex items-center gap-2"
        >
          <Plus size={16} /> Nuevo Acreditado
        </button>
      </div>

      {showForm && (
        <div className="bg-white rounded-xl p-6 shadow-sm border mb-6">
          <h3 className="font-semibold mb-4">Nuevo Acreditado</h3>
          <div className="grid grid-cols-2 gap-4">
            {['nombre', 'rfc', 'telefono', 'email', 'direccion'].map(field => (
              <div key={field} className={field === 'direccion' ? 'col-span-2' : ''}>
                <label className="block text-sm font-medium text-gray-700 mb-1 capitalize">{field}</label>
                <input
                  value={(form as any)[field]}
                  onChange={e => setForm(prev => ({ ...prev, [field]: e.target.value }))}
                  className="w-full border rounded-lg px-4 py-2.5 text-sm"
                />
              </div>
            ))}
          </div>
          <div className="flex justify-end gap-3 mt-4">
            <button onClick={() => setShowForm(false)} className="px-4 py-2 border rounded-lg text-sm">Cancelar</button>
            <button
              onClick={() => mutation.mutate(form)}
              disabled={!form.nombre || mutation.isPending}
              className="px-4 py-2 bg-gold-500 text-white rounded-lg text-sm disabled:opacity-50"
            >
              {mutation.isPending ? 'Guardando...' : 'Guardar'}
            </button>
          </div>
        </div>
      )}

      <div className="bg-white rounded-xl shadow-sm border">
        {isLoading ? (
          <div className="p-8 text-center text-gray-400">Cargando...</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b bg-gray-50">
                  <th className="text-left px-4 py-3 font-medium text-gray-500">Nombre</th>
                  <th className="text-left px-4 py-3 font-medium text-gray-500">RFC</th>
                  <th className="text-left px-4 py-3 font-medium text-gray-500">Teléfono</th>
                  <th className="text-left px-4 py-3 font-medium text-gray-500">Email</th>
                  <th className="text-center px-4 py-3 font-medium text-gray-500">Operaciones</th>
                </tr>
              </thead>
              <tbody>
                {acreditados?.map((a: any) => (
                  <tr key={a.id} className="border-b hover:bg-gray-50">
                    <td className="px-4 py-3 font-medium">{a.nombre}</td>
                    <td className="px-4 py-3 text-gray-500">{a.rfc || '—'}</td>
                    <td className="px-4 py-3 text-gray-500">{a.telefono || '—'}</td>
                    <td className="px-4 py-3 text-gray-500">{a.email || '—'}</td>
                    <td className="px-4 py-3 text-center">
                      <span className="bg-gray-100 px-2 py-1 rounded-full text-xs">{a._count?.operaciones || 0}</span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
