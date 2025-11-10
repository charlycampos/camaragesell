/**
 * Dashboard para Fiscal
 */
import { Layout } from '../components/layout/Layout';

export const DashboardFiscal = () => {
  return (
    <Layout>
      <div className="dashboard">
        <h1>Dashboard - Fiscal</h1>
        <p>Gestión de mis solicitudes</p>

        <div className="dashboard-cards">
          <div className="card">
            <h3>Nueva Solicitud</h3>
            <p>Crear una nueva solicitud de cita</p>
          </div>

          <div className="card">
            <h3>Mis Solicitudes</h3>
            <p>Ver el estado de mis solicitudes</p>
            <div className="badge">2 pendientes</div>
          </div>

          <div className="card">
            <h3>Solicitudes Programadas</h3>
            <p>Solicitudes con cita programada</p>
            <div className="badge">5 programadas</div>
          </div>

          <div className="card">
            <h3>Historial</h3>
            <p>Historial de solicitudes realizadas</p>
          </div>
        </div>
      </div>
    </Layout>
  );
};

export default DashboardFiscal;
