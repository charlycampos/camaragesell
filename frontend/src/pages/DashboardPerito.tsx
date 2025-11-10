/**
 * Dashboard para Perito/Psicólogo
 */
import { Layout } from '../components/layout/Layout';

export const DashboardPerito = () => {
  return (
    <Layout>
      <div className="dashboard">
        <h1>Dashboard - Perito</h1>
        <p>Mi agenda y citas asignadas</p>

        <div className="dashboard-cards">
          <div className="card">
            <h3>Mis Citas</h3>
            <p>Próximas citas programadas</p>
            <div className="badge">3 próximas</div>
          </div>

          <div className="card">
            <h3>Citas de Hoy</h3>
            <p>Citas programadas para hoy</p>
            <div className="badge">2 hoy</div>
          </div>

          <div className="card">
            <h3>Dictámenes Pendientes</h3>
            <p>Dictámenes por registrar</p>
            <div className="badge">1 pendiente</div>
          </div>
        </div>
      </div>
    </Layout>
  );
};

export default DashboardPerito;
