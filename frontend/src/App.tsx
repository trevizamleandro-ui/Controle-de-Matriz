import { useEffect, ReactNode } from 'react';
import { BrowserRouter, Routes, Route, NavLink, Navigate, useLocation } from 'react-router-dom';
import { authApi } from './services/api';
import './index.css';
import Dashboard from './pages/Dashboard';
import Inventario from './pages/Inventario';
import Inspecoes from './pages/Inspecoes';
import Reparos from './pages/Reparos';
import Maquinas from './pages/Maquinas';
import Fornecedores from './pages/Fornecedores';
import Login from './pages/Login';
import Usuarios from './pages/Usuarios';
import Relatorios from './pages/Relatorios';
import { AuthProvider, useAuth } from './contexts/AuthContext';

function Sidebar({ alertasCount = 0 }: { alertasCount?: number }) {
  const { user, logout } = useAuth();

  const navItemsPLC = [
    { icon: '📊', label: 'Dashboard (Visão Geral)', path: '/dashboard', roles: ['ADMIN', 'MANUTENCAO'] },
    { icon: '🔩', label: 'Inventário de Matrizes', path: '/inventario', roles: ['ADMIN', 'MANUTENCAO'] },
    { icon: '🔍', label: 'Inspeções Rápidas', path: '/inspecoes', roles: ['ADMIN', 'MANUTENCAO'] },
    { icon: '🔧', label: 'Ordens de Reparo', path: '/reparos', roles: ['ADMIN', 'MANUTENCAO'] },
  ];

  const navItemsConfig = [
    { icon: '⚙️', label: 'Cadastro de Máquinas', path: '/maquinas', roles: ['ADMIN'] },
    { icon: '🏭', label: 'Gestão de Fornecedores', path: '/fornecedores', roles: ['ADMIN'] },
    { icon: '👥', label: 'Usuários do Sistema', path: '/usuarios', roles: ['ADMIN'] },
  ];

  const userRole = user?.role || '';
  const filteredPLC = navItemsPLC.filter(item => item.roles.includes(userRole));
  const filteredConfig = navItemsConfig.filter(item => item.roles.includes(userRole));

  return (
    <aside className="sidebar">
      <div className="sidebar-logo">
        <h1>DACARTO MATRIZES</h1>
      </div>

      <nav className="sidebar-nav">
        <div style={{ padding: '8px 12px', fontSize: '11px', color: '#004F5C', fontWeight: 'bold' }}>
          📂 Projeto: Dacarto_Matrizes
        </div>

        {/* PLC Device Level */}
        <div style={{ padding: '0 8px' }}>
          {filteredPLC.map(item => (
            <NavLink
              key={item.path}
              to={item.path}
              className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`}
              style={{ padding: '4px 8px', margin: '2px 0' }}
            >
              <span className="nav-icon" style={{ fontSize: '12px' }}>{item.icon}</span>
              {item.label}
              {item.path === '/reparos' && alertasCount > 0 && (
                <span className="nav-badge">{alertasCount}</span>
              )}
            </NavLink>
          ))}
        </div>

        {/* Global Configuration Level */}
        <div style={{ paddingLeft: 8, marginTop: 12 }}>
          <div style={{ fontSize: '11.5px', fontWeight: '600', color: '#1F2429', padding: '4px 8px', display: 'flex', alignItems: 'center', gap: '4px' }}>
            <span>⚙️</span> Parâmetros Globais
          </div>

          <div style={{ paddingLeft: 12, borderLeft: '1px dotted #A6B1BD', marginLeft: 16 }}>
            {filteredConfig.map(item => (
              <NavLink
                key={item.path}
                to={item.path}
                className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`}
                style={{ padding: '4px 8px', margin: '2px 0' }}
              >
                <span className="nav-icon" style={{ fontSize: '12px' }}>{item.icon}</span>
                {item.label}
              </NavLink>
            ))}
          </div>
        </div>
      </nav>

      <div className="sidebar-footer" style={{ background: '#BAC3CD', padding: '12px 16px', borderTop: '1px solid var(--color-border)' }}>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 2, marginBottom: 8 }}>
          <div style={{ fontSize: '11.5px', color: '#004F5C', fontWeight: 'bold' }}>👤 {user?.nome}</div>
          <div style={{ fontSize: '10px', color: '#4E5761' }}>Acesso: {user?.role}</div>
        </div>
        <button
          className="btn btn-secondary btn-sm"
          style={{ width: '100%', padding: '4px', background: '#FFF', borderColor: '#B0B9C2', fontWeight: 600 }}
          onClick={logout}
        >
          🚪 Logout do Sistema
        </button>
      </div>
    </aside>
  );
}

function ProtectedRoute({ children, allowedRoles }: { children: ReactNode; allowedRoles?: string[] }) {
  const { signed, loading, user } = useAuth();
  const location = useLocation();

  if (loading) return <div className="loading-center"><div className="spinner" /></div>;
  if (!signed) return <Navigate to="/login" state={{ from: location }} replace />;
  if (allowedRoles && user && !allowedRoles.includes(user.role)) {
    return <Navigate to="/dashboard" replace />;
  }

  return <>{children}</>;
}

function Layout() {
  const location = useLocation();

  useEffect(() => {
    const interval = setInterval(() => {
      authApi.ping();
    }, 300000);
    return () => clearInterval(interval);
  }, []);

  const tabConfigs: Record<string, { icon: string; label: string }> = {
    '/dashboard': { icon: '📊', label: 'Dashboard' },
    '/inventario': { icon: '🔩', label: 'Inventário' },
    '/inspecoes': { icon: '🔍', label: 'Inspeções' },
    '/reparos': { icon: '🔧', label: 'Reparos' },
    '/maquinas': { icon: '⚙️', label: 'Máquinas' },
    '/fornecedores': { icon: '🏭', label: 'Fornecedores' },
    '/usuarios': { icon: '👥', label: 'Usuários' }
  };

  const activeTab = tabConfigs[location.pathname] || { icon: '💻', label: 'Workspace' };

  return (
    <div className="app-layout">
      <Sidebar />

      <main className="main-content">
        <div className="app-toolbar">
          <div style={{ fontWeight: 'bold', color: '#004F5C', marginRight: 16 }}>DACARTO</div>
        </div>

        <div className="editor-tabs-container">
          <div className="editor-tab active">
            <span>{activeTab.icon}</span> {activeTab.label}
          </div>
          <NavLink
            to="/relatorios"
            className={({ isActive }) => `editor-tab ${isActive ? 'active' : ''}`}
          >
            📊 Relatórios
          </NavLink>
        </div>

        <div className="page-container">
          <Routes>
            <Route path="/" element={<Navigate to="/dashboard" replace />} />
            <Route path="/dashboard" element={<ProtectedRoute><Dashboard /></ProtectedRoute>} />
            <Route path="/inventario" element={<ProtectedRoute><Inventario /></ProtectedRoute>} />
            <Route path="/inspecoes" element={<ProtectedRoute><Inspecoes /></ProtectedRoute>} />
            <Route path="/reparos" element={<ProtectedRoute><Reparos /></ProtectedRoute>} />
            <Route path="/relatorios" element={<ProtectedRoute><Relatorios /></ProtectedRoute>} />
            <Route path="/maquinas" element={<ProtectedRoute allowedRoles={['ADMIN']}><Maquinas /></ProtectedRoute>} />
            <Route path="/fornecedores" element={<ProtectedRoute allowedRoles={['ADMIN']}><Fornecedores /></ProtectedRoute>} />
            <Route path="/usuarios" element={<ProtectedRoute allowedRoles={['ADMIN']}><Usuarios /></ProtectedRoute>} />
          </Routes>
        </div>
      </main>
    </div>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Routes>
          <Route path="/login" element={<Login />} />
          <Route path="/*" element={<Layout />} />
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  );
}
