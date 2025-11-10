/**
 * Dashboard Perito - Con métricas personales
 */
import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Layout } from '../components/layout/Layout';
import { estadisticasService, EstadisticasPerito } from '../services/estadisticas.service';
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip, Legend } from 'recharts';
import './DashboardPerito.css';

const COLORS = ['#10b981', '#3b82f6', '#f59e0b', '#ef4444'];

export const DashboardPerito = () => {
  const navigate = useNavigate();
  const [estadisticas, setEstadisticas] = useState<EstadisticasPerito | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    loadEstadisticas();
  }, []);

  const loadEstadisticas = async () => {
    try {
      const data = await estadisticasService.getEstadisticasPerito();
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
    { name: 'Realizadas', value: estadisticas.citas_realizadas },
    { name: 'Próximas', value: estadisticas.citas_proximas }
  ] : [];

  return (
    <Layout>
      <div className="dashboard-perito-modern">
        <div className="dashboard-header">
          <div className="header-content">
            <h1>👨‍⚕️ Mi Dashboard</h1>
            <p>Estadísticas de tu desempeño profesional</p>
          </div>
          <button className="btn-refresh" onClick={loadEstadisticas}>
            🔄 Actualizar
          </button>
        </div>

        {estadisticas && (
          <>
            <div className="kpi-grid-perito">
              <div className="kpi-card kpi-green">
                <div className="kpi-icon">✅</div>
                <div className="kpi-content">
                  <h3>{estadisticas.citas_realizadas}</h3>
                  <p>Citas Realizadas</p>
                </div>
                <div className="kpi-badge">{estadisticas.tasa_realizacion}% tasa éxito</div>
              </div>

              <div className="kpi-card kpi-blue">
                <div className="kpi-icon">📅</div>
                <div className="kpi-content">
                  <h3>{estadisticas.citas_proximas}</h3>
                  <p>Citas Próximas</p>
                </div>
                <div className="kpi-action" onClick={() => navigate('/agenda/mis-citas')}>Ver agenda →</div>
              </div>

              <div className="kpi-card kpi-purple">
                <div className="kpi-icon">📊</div>
                <div className="kpi-content">
                  <h3>{estadisticas.citas_mes}</h3>
                  <p>Citas Este Mes</p>
                </div>
              </div>

              <div className="kpi-card kpi-orange">
                <div className="kpi-icon">🎯</div>
                <div className="kpi-content">
                  <h3>{estadisticas.total_citas}</h3>
                  <p>Total de Citas</p>
                </div>
              </div>
            </div>

            <div className="chart-section">
              <div className="chart-card">
                <div className="chart-header">
                  <h3>📊 Distribución de Citas</h3>
                  <p>Realizadas vs Próximas</p>
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

        <div className="quick-actions-perito">
          <button className="action-card" onClick={() => navigate('/agenda/mis-citas')}>
            <span className="action-icon">📅</span>
            <h4>Ver Mis Citas</h4>
            <p>Gestiona tu agenda de evaluaciones</p>
          </button>
          <button className="action-card" onClick={() => navigate('/programacion/calendario-avanzado')}>
            <span className="action-icon">📆</span>
            <h4>Calendario General</h4>
            <p>Ver todas las programaciones</p>
          </button>
        </div>
      </div>
    </Layout>
  );
};

export default DashboardPerito;
