/**
 * Componente principal de la aplicación
 */
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { useEffect } from 'react';
import { useAuthStore } from './contexts/authStore';
import { UserRole } from './types';

// Pages
import LoginPage from './components/auth/LoginPage';
import ProtectedRoute from './components/auth/ProtectedRoute';
import DashboardAdmin from './pages/DashboardAdmin';
import DashboardAsistente from './pages/DashboardAsistente';
import DashboardPerito from './pages/DashboardPerito';
import DashboardFiscal from './pages/DashboardFiscal';

import './App.css';

function App() {
  const { loadUser, isAuthenticated } = useAuthStore();

  useEffect(() => {
    loadUser();
  }, [loadUser]);

  return (
    <BrowserRouter>
      <Routes>
        {/* Ruta pública */}
        <Route path="/login" element={<LoginPage />} />

        {/* Rutas protegidas por rol */}
        <Route
          path="/dashboard/admin"
          element={
            <ProtectedRoute allowedRoles={[UserRole.ADMIN]}>
              <DashboardAdmin />
            </ProtectedRoute>
          }
        />

        <Route
          path="/dashboard/asistente"
          element={
            <ProtectedRoute allowedRoles={[UserRole.ASISTENTE_ADMINISTRATIVO]}>
              <DashboardAsistente />
            </ProtectedRoute>
          }
        />

        <Route
          path="/dashboard/perito"
          element={
            <ProtectedRoute allowedRoles={[UserRole.PERITO]}>
              <DashboardPerito />
            </ProtectedRoute>
          }
        />

        <Route
          path="/dashboard/fiscal"
          element={
            <ProtectedRoute allowedRoles={[UserRole.FISCAL]}>
              <DashboardFiscal />
            </ProtectedRoute>
          }
        />

        {/* Página de no autorizado */}
        <Route
          path="/unauthorized"
          element={
            <div className="error-page">
              <h1>Acceso No Autorizado</h1>
              <p>No tienes permisos para acceder a esta página.</p>
            </div>
          }
        />

        {/* Redirección por defecto */}
        <Route
          path="/"
          element={
            isAuthenticated ? <Navigate to="/dashboard" replace /> : <Navigate to="/login" replace />
          }
        />

        {/* Dashboard genérico que redirige según el rol */}
        <Route
          path="/dashboard"
          element={
            <ProtectedRoute>
              <DashboardRedirect />
            </ProtectedRoute>
          }
        />

        {/* 404 */}
        <Route
          path="*"
          element={
            <div className="error-page">
              <h1>404 - Página No Encontrada</h1>
              <p>La página que buscas no existe.</p>
            </div>
          }
        />
      </Routes>
    </BrowserRouter>
  );
}

// Componente auxiliar para redirigir al dashboard según el rol
function DashboardRedirect() {
  const user = useAuthStore((state) => state.user);

  if (!user) return <Navigate to="/login" replace />;

  switch (user.role) {
    case UserRole.ADMIN:
      return <Navigate to="/dashboard/admin" replace />;
    case UserRole.ASISTENTE_ADMINISTRATIVO:
      return <Navigate to="/dashboard/asistente" replace />;
    case UserRole.PERITO:
      return <Navigate to="/dashboard/perito" replace />;
    case UserRole.FISCAL:
      return <Navigate to="/dashboard/fiscal" replace />;
    default:
      return <Navigate to="/login" replace />;
  }
}

export default App;
