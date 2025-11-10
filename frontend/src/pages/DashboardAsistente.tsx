/**
 * Dashboard para Asistente Administrativo
 */
import { Layout } from '../components/layout/Layout';

export const DashboardAsistente = () => {
  return (
    <Layout>
      <div className="dashboard">
        <h1>Dashboard - Asistente Administrativo</h1>
        <p>Panel de gestión y programación de citas</p>

        <div className="dashboard-cards">
          <div className="card">
            <h3>Solicitudes Pendientes</h3>
            <p>Gestiona las solicitudes de citas pendientes</p>
            <div className="badge">5 pendientes</div>
          </div>

          <div className="card">
            <h3>Calendario de Programación</h3>
            <p>Programa y gestiona las citas en el calendario</p>
          </div>

          <div className="card">
            <h3>Reportes</h3>
            <p>Genera reportes de las programaciones</p>
          </div>
        </div>
      </div>
    </Layout>
  );
};

export default DashboardAsistente;
