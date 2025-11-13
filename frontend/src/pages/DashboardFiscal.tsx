/**
 * Dashboard Fiscal - Con métricas de solicitudes
 */
import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Layout } from '../components/layout/Layout';
import { estadisticasService, EstadisticasFiscal } from '../services/estadisticas.service';
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip, Legend } from 'recharts';
import './DashboardFiscal.css';

const COLORS = ['#f59e0b', '#10b981', '#ef4444'];

export const DashboardFiscal = () => {
  const navigate = useNavigate();
  const [estadisticas, setEstadisticas] = useState<EstadisticasFiscal | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    loadEstadisticas();
  }, []);

  const loadEstadisticas = async () => {
    try {
      const data = await estadisticasService.getEstadisticasFiscal();
      setEstadisticas(data);
    } catch (err: any) {
      setError(err.response?.data?.detail || 'Error al cargar estadísticas');
    } finally {
      setIsLoading(false);
    }
  };

  if (isLoading) {
    return (
      <Layout>
        <div className="loading">
          <div className="spinner"></div>
          <p>Cargando tus estadísticas...</p>
        </div>
      </Layout>
    );
  }

  if (error) {
    return (
      <Layout>
        <div className="error-message-modern">
          <span className="error-icon">⚠️</span>
          <span>{error}</span>
        </div>
      </Layout>
    );
  }

  const chartData = estadisticas ? [
    { name: 'Pendientes', value: estadisticas.pendientes },
    { name: 'Aprobadas', value: estadisticas.aprobadas },
    { name: 'Rechazadas', value: estadisticas.rechazadas }
  ] : [];

  return (
    <Layout>
      <div className="dashboard-fiscal-modern">
        <div className="dashboard-header">
          <div className="header-content">
            <h1>⚖️ Mi Dashboard</h1>
            <p>Gestión de tus solicitudes de citas</p>
          </div>
          <button className="btn-refresh" onClick={loadEstadisticas}>
            🔄 Actualizar
          </button>
        </div>

        {estadisticas && (
          <>
            <div className="kpi-grid-fiscal">
              <div className="kpi-card kpi-purple">
                <div className="kpi-icon">📋</div>
                <div className="kpi-content">
                  <h3>{estadisticas.total_solicitudes}</h3>
                  <p>Total Solicitudes</p>
                </div>
                <div className="kpi-badge">{estadisticas.tasa_aprobacion}% aprobadas</div>
              </div>

              <div className="kpi-card kpi-warning">
                <div className="kpi-icon">⏳</div>
                <div className="kpi-content">
                  <h3>{estadisticas.pendientes}</h3>
                  <p>Pendientes</p>
                </div>
                <div className="kpi-action" onClick={() => navigate('/solicitudes/mis-solicitudes')}>Ver todas →</div>
              </div>

              <div className="kpi-card kpi-green">
                <div className="kpi-icon">✅</div>
                <div className="kpi-content">
                  <h3>{estadisticas.aprobadas}</h3>
                  <p>Aprobadas</p>
                </div>
              </div>

              <div className="kpi-card kpi-blue">
                <div className="kpi-icon">📅</div>
                <div className="kpi-content">
                  <h3>{estadisticas.solicitudes_mes}</h3>
                  <p>Este Mes</p>
                </div>
              </div>
            </div>

            <div className="chart-section">
              <div className="chart-card">
                <div className="chart-header">
                  <h3>📊 Estado de Solicitudes</h3>
                  <p>Distribución actual</p>
                </div>
                <div className="chart-container">
                  <ResponsiveContainer width="100%" height={300}>
                    <PieChart>
                      <Pie
                        data={chartData}
                        cx="50%"
                        cy="50%"
                        labelLine={false}
                        label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                        outerRadius={100}
                        fill="#8884d8"
                        dataKey="value"
                      >
                        {chartData.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                        ))}
                      </Pie>
                      <Tooltip />
                      <Legend />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
              </div>
            </div>
          </>
        )}

        <div className="quick-actions-fiscal">
          <button className="action-card action-primary" onClick={() => navigate('/solicitudes/nueva')}>
            <span className="action-icon">➕</span>
            <h4>Nueva Solicitud</h4>
            <p>Crear solicitud de cita</p>
          </button>
          <button className="action-card action-info" onClick={() => navigate('/solicitudes/mis-solicitudes')}>
            <span className="action-icon">📋</span>
            <h4>Mis Solicitudes</h4>
            <p>Ver estado de solicitudes</p>
          </button>
        </div>
      </div>
    </Layout>
  );
};

export default DashboardFiscal;
