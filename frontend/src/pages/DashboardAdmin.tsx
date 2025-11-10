/**
 * Dashboard para Administrador
 */
import { Layout } from '../components/layout/Layout';

export const DashboardAdmin = () => {
  return (
    <Layout>
      <div className="dashboard">
        <h1>Dashboard Administrativo</h1>
        <p>Bienvenido al panel de administración del sistema SIGECA</p>

        <div className="dashboard-cards">
          <div className="card">
            <h3>Gestión de Usuarios</h3>
            <p>Administra los usuarios del sistema</p>
          </div>

          <div className="card">
            <h3>Mantenimientos</h3>
            <p>Gestiona sedes, salas, peritos y despachos</p>
          </div>

          <div className="card">
            <h3>Reportes</h3>
            <p>Genera reportes y estadísticas del sistema</p>
          </div>

          <div className="card">
            <h3>Configuración</h3>
            <p>Configuración general del sistema</p>
          </div>
        </div>
      </div>
    </Layout>
  );
};

export default DashboardAdmin;
