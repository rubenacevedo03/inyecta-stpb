import express from 'express';
import cors from 'cors';
import authRoutes from './routes/auth';
import operacionesRoutes from './routes/operaciones';
import bloquesRoutes from './routes/bloques';
import solicitudesRoutes from './routes/solicitudes';
import notificacionesRoutes from './routes/notificaciones';
import usuariosRoutes from './routes/usuarios';
import dashboardRoutes from './routes/dashboard';
import pagosRoutes from './routes/pagos';

const app = express();
const PORT = process.env.PORT || 3001;

app.use(cors({ origin: process.env.FRONTEND_URL || 'http://localhost:5173', credentials: true }));
app.use(express.json());

app.get('/api/health', (_req, res) => res.json({ status: 'ok', timestamp: new Date().toISOString() }));

app.use('/api/auth', authRoutes);
app.use('/api/operaciones', operacionesRoutes);
app.use('/api/bloques', bloquesRoutes);
app.use('/api/solicitudes', solicitudesRoutes);
app.use('/api/notificaciones', notificacionesRoutes);
app.use('/api/usuarios', usuariosRoutes);
app.use('/api/dashboard', dashboardRoutes);
app.use('/api/pagos', pagosRoutes);

app.use((err: any, _req: express.Request, res: express.Response, _next: express.NextFunction) => {
  console.error(err);
  res.status(err.status || 500).json({ error: err.message || 'Error interno' });
});

app.listen(PORT, () => console.log(`[Inyecta API] http://localhost:${PORT}`));
