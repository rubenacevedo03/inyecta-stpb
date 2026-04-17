import express from 'express';
import cors from 'cors';

import authRoutes           from './routes/auth';
import operacionesRoutes    from './routes/operaciones';
import bloquesRoutes        from './routes/bloques';
import solicitudesRoutes    from './routes/solicitudes';
import notificacionesRoutes from './routes/notificaciones';
import usuariosRoutes       from './routes/usuarios';
import dashboardRoutes      from './routes/dashboard';
import pagosRoutes          from './routes/pagos';
import acreditadosRoutes    from './routes/acreditados';
import inversionistasRoutes from './routes/inversionistas';
import participacionesRoutes from './routes/participaciones';

import { bitacoraMiddleware } from './middleware/bitacora';

const app  = express();
const PORT = process.env.PORT || 3001;

app.use(cors({
  origin:      process.env.FRONTEND_URL || 'http://localhost:5173',
  credentials: true,
}));
app.use(express.json());

// ── Health ────────────────────────────────────────────────────────────────────
app.get('/api/health', (_req, res) =>
  res.json({ status: 'ok', timestamp: new Date().toISOString() }),
);

// ── Rutas públicas ────────────────────────────────────────────────────────────
app.use('/api/auth', authRoutes);

// ── Rutas protegidas ──────────────────────────────────────────────────────────
app.use('/api/operaciones',    bitacoraMiddleware('Operacion'),    operacionesRoutes);
app.use('/api/acreditados',    bitacoraMiddleware('Acreditado'),   acreditadosRoutes);
app.use('/api/inversionistas', bitacoraMiddleware('Inversionista'), inversionistasRoutes);
app.use('/api/participaciones', bitacoraMiddleware('Participacion'), participacionesRoutes);
app.use('/api/pagos',          bitacoraMiddleware('PagoMensual'),  pagosRoutes);
app.use('/api/bloques',        bloquesRoutes);
app.use('/api/solicitudes',    solicitudesRoutes);
app.use('/api/notificaciones', notificacionesRoutes);
app.use('/api/usuarios',       usuariosRoutes);
app.use('/api/dashboard',      dashboardRoutes);

// ── Error handler ─────────────────────────────────────────────────────────────
app.use((err: any, _req: express.Request, res: express.Response, _next: express.NextFunction) => {
  console.error(err);
  res.status(err.status || 500).json({ error: err.message || 'Error interno' });
});

app.listen(PORT, () => console.log(`[Inyecta API] http://localhost:${PORT}`));
