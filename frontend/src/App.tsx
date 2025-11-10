/**
 * Componente principal de la aplicación
 */
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { useEffect } from 'react';
import { useAuthStore } from './contexts/authStore';
import { UserRole } from './types';

// Auth
import LoginPage from './components/auth/LoginPage';
import ProtectedRoute from './components/auth/ProtectedRoute';

// Dashboards
import DashboardAdmin from './pages/DashboardAdmin';
import DashboardAsistente from './pages/DashboardAsistente';
import DashboardPerito from './pages/DashboardPerito';
import DashboardFiscal from './pages/DashboardFiscal';

// Solicitudes
import NuevaSolicitud from './components/solicitudes/NuevaSolicitud';
import MisSolicitudes from './components/solicitudes/MisSolicitudes';
import SolicitudesPendientes from './components/solicitudes/SolicitudesPendientes';

// Programación
import CalendarioProgramacion from './components/programacion/CalendarioProgramacion';
import CalendarioAvanzado from './components/programacion/CalendarioAvanzado';

// Agenda
import MisCitas from './components/agenda/MisCitas';

// Mantenimientos
import SedesMantenimiento from './components/mantenimientos/SedesMantenimiento';
import SalasMantenimiento from './components/mantenimientos/SalasMantenimiento';
import PeritosMantenimiento from './components/mantenimientos/PeritosMantenimiento';
import DespachosMantenimiento from './components/mantenimientos/DespachosMantenimiento';
import UsuariosMantenimiento from './components/mantenimientos/UsuariosMantenimiento';

// Reportes
import Reportes from './components/reportes/Reportes';

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

        {/* Dashboards por rol */}
        <Route
          path="/dashboard/admin"
          element={
            <ProtectedRoute allowedRoles={[UserRole.ADMIN]}>
              <DashboardAdmin />
            </ProtectedRoute>
          }
        />

        <Route
          path="/dashboard/asistente_administrativo"
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

        {/* Rutas de Solicitudes */}
        <Route
          path="/solicitudes/nueva"
          element={
            <ProtectedRoute allowedRoles={[UserRole.FISCAL, UserRole.ADMIN]}>
              <NuevaSolicitud />
            </ProtectedRoute>
          }
        />

        <Route
          path="/solicitudes/mis-solicitudes"
          element={
            <ProtectedRoute allowedRoles={[UserRole.FISCAL, UserRole.ADMIN]}>
              <MisSolicitudes />
            </ProtectedRoute>
          }
        />

        <Route
          path="/solicitudes/pendientes"
          element={
            <ProtectedRoute allowedRoles={[UserRole.ASISTENTE_ADMINISTRATIVO, UserRole.ADMIN]}>
              <SolicitudesPendientes />
            </ProtectedRoute>
          }
        />

        {/* Rutas de Programación */}
        <Route
          path="/programacion/calendario"
          element={
            <ProtectedRoute allowedRoles={[UserRole.ASISTENTE_ADMINISTRATIVO, UserRole.ADMIN]}>
              <CalendarioProgramacion />
            </ProtectedRoute>
          }
        />

        <Route
          path="/programacion/calendario-avanzado"
          element={
            <ProtectedRoute allowedRoles={[UserRole.ASISTENTE_ADMINISTRATIVO, UserRole.ADMIN]}>
              <CalendarioAvanzado />
            </ProtectedRoute>
          }
        />

        {/* Rutas de Agenda */}
        <Route
          path="/agenda/mis-citas"
          element={
            <ProtectedRoute allowedRoles={[UserRole.PERITO, UserRole.ADMIN]}>
              <MisCitas />
            </ProtectedRoute>
          }
        />

        {/* Rutas de Mantenimientos */}
        <Route
          path="/mantenimientos/sedes"
          element={
            <ProtectedRoute allowedRoles={[UserRole.ADMIN]}>
              <SedesMantenimiento />
            </ProtectedRoute>
          }
        />

        <Route
          path="/mantenimientos/salas"
          element={
            <ProtectedRoute allowedRoles={[UserRole.ADMIN]}>
              <SalasMantenimiento />
            </ProtectedRoute>
          }
        />

        <Route
          path="/mantenimientos/peritos"
          element={
            <ProtectedRoute allowedRoles={[UserRole.ADMIN]}>
              <PeritosMantenimiento />
            </ProtectedRoute>
          }
        />

        <Route
          path="/mantenimientos/despachos"
          element={
            <ProtectedRoute allowedRoles={[UserRole.ADMIN]}>
              <DespachosMantenimiento />
            </ProtectedRoute>
          }
        />

        <Route
          path="/usuarios"
          element={
            <ProtectedRoute allowedRoles={[UserRole.ADMIN]}>
              <UsuariosMantenimiento />
            </ProtectedRoute>
          }
        />

        {/* Rutas de Reportes */}
        <Route
          path="/reportes"
          element={
            <ProtectedRoute allowedRoles={[UserRole.ADMIN, UserRole.ASISTENTE_ADMINISTRATIVO]}>
              <Reportes />
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
      return <Navigate to="/dashboard/asistente_administrativo" replace />;
    case UserRole.PERITO:
      return <Navigate to="/dashboard/perito" replace />;
    case UserRole.FISCAL:
      return <Navigate to="/dashboard/fiscal" replace />;
    default:
      return <Navigate to="/login" replace />;
  }
}

export default App;
