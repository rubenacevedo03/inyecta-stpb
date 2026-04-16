import { Routes, Route, Navigate } from 'react-router-dom';
import { useAuth } from './hooks/useAuth';
import Layout from './components/Layout';
import Login from './pages/Login';
import Dashboard from './pages/Dashboard';
import Cotizador from './pages/Cotizador';
import Operaciones from './pages/Operaciones';
import NuevaOperacion from './pages/NuevaOperacion';
import DetalleOperacion from './pages/DetalleOperacion';
import Cartera from './pages/Cartera';
import Usuarios from './pages/Usuarios';

function ProtectedRoute({ children, roles }: { children: React.ReactNode; roles?: string[] }) {
  const { isAuthenticated, user } = useAuth();
  if (!isAuthenticated) return <Navigate to="/login" />;
  if (roles && user && !roles.includes(user.rol)) return <Navigate to="/" />;
  return <>{children}</>;
}

export default function App() {
  return (
    <Routes>
      <Route path="/login" element={<Login />} />
      <Route path="/" element={<ProtectedRoute><Layout /></ProtectedRoute>}>
        <Route index element={<Dashboard />} />
        <Route path="cotizador" element={<Cotizador />} />
        <Route path="operaciones" element={<Operaciones />} />
        <Route path="operaciones/nueva" element={<NuevaOperacion />} />
        <Route path="operaciones/:id" element={<DetalleOperacion />} />
        <Route path="operaciones/:id/bloque/:num" element={<DetalleOperacion />} />
        <Route path="cartera" element={<Cartera />} />
        <Route path="usuarios" element={
          <ProtectedRoute roles={['ADMIN']}><Usuarios /></ProtectedRoute>
        } />
      </Route>
    </Routes>
  );
}
