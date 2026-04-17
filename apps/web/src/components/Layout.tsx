import { Outlet, NavLink, useNavigate } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import { useState } from 'react';
import {
  LayoutDashboard, Calculator, FileText, TrendingUp,
  Users, Bell, LogOut, Menu, ChevronRight, UserCheck, Briefcase
} from 'lucide-react';
import NotificationPanel from './NotificationPanel';

export default function Layout() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [notifOpen, setNotifOpen] = useState(false);

  const navItems = [
    { to: '/', icon: LayoutDashboard, label: 'Dashboard', roles: ['ADMIN', 'OPERADOR'] },
    { to: '/cotizador', icon: Calculator, label: 'Cotizador', roles: ['ADMIN', 'OPERADOR', 'CONSULTOR'] },
    { to: '/operaciones', icon: FileText, label: 'Operaciones', roles: ['ADMIN', 'OPERADOR', 'LEGAL', 'CONSULTOR'] },
    { to: '/cartera', icon: TrendingUp, label: 'Cartera Activa', roles: ['ADMIN', 'OPERADOR'] },
    { to: '/acreditados', icon: UserCheck, label: 'Acreditados', roles: ['ADMIN', 'OPERADOR', 'LEGAL'] },
    { to: '/inversionistas', icon: Briefcase, label: 'Inversionistas', roles: ['ADMIN', 'OPERADOR'] },
    { to: '/usuarios', icon: Users, label: 'Usuarios', roles: ['ADMIN'] },
  ].filter(item => !user || item.roles.includes(user.rol));

  return (
    <div className="min-h-screen flex bg-gray-50">
      {sidebarOpen && (
        <div className="fixed inset-0 bg-black/50 z-40 lg:hidden" onClick={() => setSidebarOpen(false)} />
      )}

      {/* Sidebar */}
      <aside className={`fixed lg:static inset-y-0 left-0 z-50 w-64 bg-[#1a1a1a] text-white flex flex-col transform transition-transform lg:translate-x-0 ${sidebarOpen ? 'translate-x-0' : '-translate-x-full'}`}>
        <div className="p-6 border-b border-white/10">
          <div className="flex items-center gap-2">
            <span className="text-2xl font-bold text-[#c9a227]">◇</span>
            <div>
              <span className="text-xl font-bold tracking-tight">inyecta</span>
              <p className="text-[10px] text-gray-400 tracking-[3px] uppercase">Soluciones de Capital</p>
            </div>
          </div>
        </div>

        <nav className="flex-1 p-3 space-y-0.5 overflow-y-auto">
          {navItems.map(({ to, icon: Icon, label }) => (
            <NavLink
              key={to}
              to={to}
              end={to === '/'}
              onClick={() => setSidebarOpen(false)}
              className={({ isActive }) =>
                `flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors ${
                  isActive ? 'bg-[#c9a227]/20 text-[#c9a227]' : 'text-gray-400 hover:bg-white/5 hover:text-white'
                }`
              }
            >
              <Icon size={16} />
              {label}
            </NavLink>
          ))}
        </nav>

        <div className="p-4 border-t border-white/10">
          <div className="flex items-center gap-3 mb-3">
            <div className="w-8 h-8 rounded-full bg-[#c9a227]/20 flex items-center justify-center text-[#c9a227] text-sm font-bold">
              {user?.nombre?.charAt(0) || 'U'}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-white truncate">{user?.nombre}</p>
              <p className="text-xs text-gray-400">{user?.rol}</p>
            </div>
          </div>
          <button
            onClick={() => { logout(); navigate('/login'); }}
            className="w-full flex items-center gap-2 text-gray-400 hover:text-red-400 text-xs py-1.5 transition-colors"
          >
            <LogOut size={14} />
            Cerrar sesión
          </button>
        </div>
      </aside>

      {/* Main */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Header */}
        <header className="bg-white border-b px-4 py-3 flex items-center justify-between">
          <button className="lg:hidden" onClick={() => setSidebarOpen(true)}>
            <Menu size={22} />
          </button>
          <div className="lg:hidden flex items-center gap-2">
            <span className="text-[#c9a227] font-bold">◇</span>
            <span className="font-bold">inyecta</span>
          </div>
          <div className="flex-1 lg:flex-none" />
          <div className="flex items-center gap-3">
            <button
              onClick={() => setNotifOpen(!notifOpen)}
              className="relative p-2 text-gray-500 hover:text-gray-800 rounded-lg hover:bg-gray-100"
            >
              <Bell size={18} />
              <span className="absolute -top-0.5 -right-0.5 w-4 h-4 bg-red-500 text-white text-[9px] rounded-full flex items-center justify-center font-bold">3</span>
            </button>
          </div>
        </header>

        <main className="flex-1 p-4 lg:p-6 overflow-auto">
          <Outlet />
        </main>
      </div>

      {notifOpen && <NotificationPanel onClose={() => setNotifOpen(false)} />}
    </div>
  );
}
