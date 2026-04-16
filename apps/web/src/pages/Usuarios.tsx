import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { usuariosApi } from '../lib/api';
import { Plus, UserCheck, UserX, Key } from 'lucide-react';

const ROLES = ['ADMIN', 'LEGAL', 'OPERADOR', 'CONSULTOR'];

const rolColors: Record<string, string> = {
  ADMIN: 'bg-purple-100 text-purple-700',
  LEGAL: 'bg-blue-100 text-blue-700',
  OPERADOR: 'bg-green-100 text-green-700',
  CONSULTOR: 'bg-gray-100 text-gray-600',
};

export default function Usuarios() {
  const queryClient = useQueryClient();
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({ nombre: '', email: '', password: '', rol: 'OPERADOR' });

  const { data: usuarios, isLoading } = useQuery({
    queryKey: ['usuarios'],
    queryFn: () => usuariosApi.list().then(r => r.data),
  });

  const createMut = useMutation({
    mutationFn: (data: any) => usuariosApi.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['usuarios'] });
      setShowForm(false);
      setForm({ nombre: '', email: '', password: '', rol: 'OPERADOR' });
    },
  });

  const toggleMut = useMutation({
    mutationFn: (id: string) => usuariosApi.toggleActivo(id),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['usuarios'] }),
  });

  const inputCls = "w-full border rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-[#c9a227] outline-none";

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold">Usuarios</h1>
          <p className="text-gray-500 text-sm">Solo el ADMIN puede gestionar usuarios</p>
        </div>
        <button
          onClick={() => setShowForm(!showForm)}
          className="bg-[#1a1a1a] text-white px-4 py-2.5 rounded-lg text-sm font-medium hover:bg-gray-800 flex items-center gap-2"
        >
          <Plus size={16} /> Nuevo Usuario
        </button>
      </div>

      {showForm && (
        <div className="bg-white rounded-xl p-6 shadow-sm border mb-6">
          <h3 className="font-semibold mb-4">Nuevo Usuario</h3>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">Nombre completo</label>
              <input value={form.nombre} onChange={e => setForm(p => ({ ...p, nombre: e.target.value }))} className={inputCls} />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">Email</label>
              <input type="email" value={form.email} onChange={e => setForm(p => ({ ...p, email: e.target.value }))} className={inputCls} />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">Contraseña temporal</label>
              <input type="password" value={form.password} onChange={e => setForm(p => ({ ...p, password: e.target.value }))} className={inputCls} />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">Rol</label>
              <select value={form.rol} onChange={e => setForm(p => ({ ...p, rol: e.target.value }))} className={inputCls}>
                {ROLES.map(r => <option key={r} value={r}>{r}</option>)}
              </select>
            </div>
          </div>
          <div className="flex justify-end gap-3 mt-4">
            <button onClick={() => setShowForm(false)} className="px-4 py-2 border rounded-lg text-sm">Cancelar</button>
            <button
              onClick={() => createMut.mutate(form)}
              disabled={!form.nombre || !form.email || !form.password || createMut.isPending}
              className="px-4 py-2 bg-[#c9a227] text-white rounded-lg text-sm disabled:opacity-50"
            >
              {createMut.isPending ? 'Creando...' : 'Crear usuario'}
            </button>
          </div>
        </div>
      )}

      <div className="bg-white rounded-xl shadow-sm border overflow-hidden">
        {isLoading ? (
          <div className="p-8 text-center text-gray-400">Cargando...</div>
        ) : (
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b bg-gray-50 text-left">
                {['Nombre', 'Email', 'Rol', 'Estado', 'Alta', 'Acciones'].map(h => (
                  <th key={h} className="px-4 py-3 text-xs font-medium text-gray-500 uppercase">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {usuarios?.map((u: any) => (
                <tr key={u.id} className="border-b hover:bg-gray-50">
                  <td className="px-4 py-3 font-medium">{u.nombre}</td>
                  <td className="px-4 py-3 text-gray-500">{u.email}</td>
                  <td className="px-4 py-3">
                    <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${rolColors[u.rol] || 'bg-gray-100 text-gray-600'}`}>
                      {u.rol}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <span className={`px-2 py-0.5 rounded-full text-xs ${u.activo ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-600'}`}>
                      {u.activo ? 'Activo' : 'Inactivo'}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-gray-400 text-xs">{new Date(u.creadoEn).toLocaleDateString('es-MX')}</td>
                  <td className="px-4 py-3">
                    <div className="flex gap-2">
                      <button
                        onClick={() => toggleMut.mutate(u.id)}
                        title={u.activo ? 'Desactivar' : 'Activar'}
                        className={`p-1.5 rounded ${u.activo ? 'text-red-400 hover:bg-red-50' : 'text-green-500 hover:bg-green-50'}`}
                      >
                        {u.activo ? <UserX size={14} /> : <UserCheck size={14} />}
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}
