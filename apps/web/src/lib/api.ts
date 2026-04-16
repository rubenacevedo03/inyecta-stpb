import axios from 'axios';

const api = axios.create({ baseURL: '/api' });

api.interceptors.request.use((config) => {
  const token = localStorage.getItem('inyecta_token');
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

api.interceptors.response.use(
  (r) => r,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem('inyecta_token');
      localStorage.removeItem('inyecta_user');
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

export const operacionesApi = {
  list: () => api.get('/operaciones'),
  get: (id: string) => api.get(`/operaciones/${id}`),
  create: (data: any) => api.post('/operaciones', data),
  updateStatus: (id: string, status: string) => api.patch(`/operaciones/${id}/status`, { status }),
  corrida: (id: string, tipo: string, invId?: string) =>
    api.get(`/operaciones/${id}/corrida`, { params: { tipo, inversionistaId: invId } }),
};

export const bloquesApi = {
  get: (opId: string, num: number) => api.get(`/bloques/${opId}/${num}`),
  updateChecklist: (itemId: string, completado: boolean, nota?: string) =>
    api.patch(`/bloques/checklist/${itemId}`, { completado, nota }),
  setResultado: (bloqueId: string, data: any) => api.patch(`/bloques/${bloqueId}/resultado`, data),
  avanzar: (opId: string, bloqueActual: number) => api.post(`/bloques/${opId}/avanzar`, { bloqueActual }),
};

export const solicitudesApi = {
  list: (opId?: string) => api.get('/solicitudes', { params: { operacionId: opId } }),
  create: (data: any) => api.post('/solicitudes', data),
  update: (id: string, data: any) => api.patch(`/solicitudes/${id}`, data),
  comentar: (id: string, texto: string) => api.post(`/solicitudes/${id}/comentarios`, { texto }),
};

export const notificacionesApi = {
  list: () => api.get('/notificaciones'),
  marcarLeida: (id: string) => api.patch(`/notificaciones/${id}/leida`),
  marcarTodas: () => api.patch('/notificaciones/todas-leidas'),
};

export const usuariosApi = {
  list: () => api.get('/usuarios'),
  create: (data: any) => api.post('/usuarios', data),
  update: (id: string, data: any) => api.patch(`/usuarios/${id}`, data),
  toggleActivo: (id: string) => api.patch(`/usuarios/${id}/toggle-activo`),
  resetPassword: (id: string, password: string) => api.patch(`/usuarios/${id}/reset-password`, { password }),
};

export const acreditadosApi = {
  list: (q?: string) => api.get('/acreditados', { params: q ? { q } : {} }),
  get: (id: string) => api.get(`/acreditados/${id}`),
  create: (data: any) => api.post('/acreditados', data),
  update: (id: string, data: any) => api.patch(`/acreditados/${id}`, data),
};

export const inversionistasApi = {
  list: (q?: string) => api.get('/inversionistas', { params: q ? { q } : {} }),
  get: (id: string) => api.get(`/inversionistas/${id}`),
  create: (data: any) => api.post('/inversionistas', data),
  update: (id: string, data: any) => api.patch(`/inversionistas/${id}`, data),
};

export const participacionesApi = {
  byOperacion: (operacionId: string) => api.get(`/participaciones/operacion/${operacionId}`),
  create: (data: any) => api.post('/participaciones', data),
  update: (id: string, data: any) => api.patch(`/participaciones/${id}`, data),
  remove: (id: string) => api.delete(`/participaciones/${id}`),
};

export default api;
