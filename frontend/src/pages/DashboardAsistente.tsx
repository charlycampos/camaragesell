/**
 * Dashboard Asistente Administrativo - Con métricas operativas
 */
import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Layout } from '../components/layout/Layout';
import { estadisticasService, ResumenGeneral, SolicitudesPorMes, OcupacionSala } from '../services/estadisticas.service';
import {
  BarChart, Bar, LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer
} from 'recharts';
import './DashboardAsistente.css';

export const DashboardAsistente = () => {
  const navigate = useNavigate();
  const [resumen, setResumen] = useState<ResumenGeneral | null>(null);
  const [solicitudesPorMes, setSolicitudesPorMes] = useState<SolicitudesPorMes[]>([]);
  const [ocupacionSalas, setOcupacionSalas] = useState<OcupacionSala[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    loadEstadisticas();
  }, []);

  const loadEstadisticas = async () => {
    try {
      const [resumenData, solicitudesData, ocupacionData] = await Promise.all([
        estadisticasService.getResumenGeneral(),
        estadisticasService.getSolicitudesPorMes(3),
        estadisticasService.getOcupacionSalas()
      ]);

      setResumen(resumenData);
      setSolicitudesPorMes(solicitudesData);
      setOcupacionSalas(ocupacionData);
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
          <p>Cargando métricas...</p>
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

  return (
    <Layout>
      <div className="dashboard-asistente-modern">
        {/* Header */}
        <div className="dashboard-header">
          <div className="header-content">
            <h1>📋 Dashboard Operativo</h1>
            <p>Gestión de solicitudes y programaciones</p>
          </div>
          <button className="btn-refresh" onClick={loadEstadisticas}>
            🔄 Actualizar
          </button>
        </div>

        {/* KPI Cards */}
        {resumen && (
          <div className="kpi-grid">
            <div className="kpi-card kpi-warning" onClick={() => navigate('/solicitudes/pendientes')}>
              <div className="kpi-icon">⏳</div>
              <div className="kpi-content">
                <h3>{resumen.solicitudes_pendientes}</h3>
                <p>Solicitudes Pendientes</p>
              </div>
              <div className="kpi-action">Ver todas →</div>
            </div>

            <div className="kpi-card kpi-blue" onClick={() => navigate('/programacion/calendario-avanzado')}>
              <div className="kpi-icon">📅</div>
              <div className="kpi-content">
                <h3>{resumen.programaciones_programadas}</h3>
                <p>Citas Programadas</p>
              </div>
              <div className="kpi-action">Ver calendario →</div>
            </div>

            <div className="kpi-card kpi-green">
              <div className="kpi-icon">✅</div>
              <div className="kpi-content">
                <h3>{resumen.programaciones_mes}</h3>
                <p>Citas Este Mes</p>
              </div>
              <div className="kpi-badge">{resumen.tasa_realizacion}% realizadas</div>
            </div>

            <div className="kpi-card kpi-purple">
              <div className="kpi-icon">🏢</div>
              <div className="kpi-content">
                <h3>{resumen.total_salas}</h3>
                <p>Salas Disponibles</p>
              </div>
              <div className="kpi-badge">{resumen.total_peritos} peritos</div>
            </div>
          </div>
        )}

        {/* Charts Grid */}
        <div className="charts-grid">
          {/* Solicitudes últimos 3 meses */}
          <div className="chart-card chart-large">
            <div className="chart-header">
              <h3>📊 Solicitudes Últimos 3 Meses</h3>
              <p>Evolución de solicitudes por estado</p>
            </div>
            <div className="chart-container">
              <ResponsiveContainer width="100%" height={300}>
                <LineChart data={solicitudesPorMes}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                  <XAxis dataKey="mes" stroke="#6b7280" />
                  <YAxis stroke="#6b7280" />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: 'rgba(255, 255, 255, 0.95)',
                      border: '1px solid #e5e7eb',
                      borderRadius: '8px',
                      boxShadow: '0 4px 6px rgba(0, 0, 0, 0.1)'
                    }}
                  />
                  <Legend />
                  <Line type="monotone" dataKey="total" stroke="#8b5cf6" strokeWidth={3} name="Total" />
                  <Line type="monotone" dataKey="pendientes" stroke="#f59e0b" strokeWidth={2} name="Pendientes" />
                  <Line type="monotone" dataKey="aprobadas" stroke="#10b981" strokeWidth={2} name="Aprobadas" />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Ocupación de salas */}
          <div className="chart-card">
            <div className="chart-header">
              <h3>🏢 Ocupación de Salas</h3>
              <p>Tasa de uso actual</p>
            </div>
            <div className="chart-container">
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={ocupacionSalas}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                  <XAxis dataKey="sala" stroke="#6b7280" angle={-45} textAnchor="end" height={100} />
                  <YAxis stroke="#6b7280" />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: 'rgba(255, 255, 255, 0.95)',
                      border: '1px solid #e5e7eb',
                      borderRadius: '8px',
                      boxShadow: '0 4px 6px rgba(0, 0, 0, 0.1)'
                    }}
                  />
                  <Legend />
                  <Bar dataKey="tasa_ocupacion" fill="#3b82f6" name="Ocupación %" />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>

        {/* Acciones Rápidas */}
        <div className="quick-actions">
          <h3>⚡ Acciones Rápidas</h3>
          <div className="actions-grid">
            <button className="action-btn action-primary" onClick={() => navigate('/solicitudes/pendientes')}>
              <div className="action-icon">📋</div>
              <div className="action-content">
                <h4>Revisar Pendientes</h4>
                <p>{resumen?.solicitudes_pendientes || 0} solicitudes esperando</p>
              </div>
            </button>

            <button className="action-btn action-success" onClick={() => navigate('/programacion/calendario-avanzado')}>
              <div className="action-icon">📅</div>
              <div className="action-content">
                <h4>Ver Calendario</h4>
                <p>Gestiona programaciones</p>
              </div>
            </button>

            <button className="action-btn action-info" onClick={() => navigate('/reportes')}>
              <div className="action-icon">📊</div>
              <div className="action-content">
                <h4>Generar Reportes</h4>
                <p>Exportar datos del sistema</p>
              </div>
            </button>

            <button className="action-btn action-warning" onClick={() => navigate('/mantenimientos/salas')}>
              <div className="action-icon">🏢</div>
              <div className="action-content">
                <h4>Gestionar Salas</h4>
                <p>Configurar disponibilidad</p>
              </div>
            </button>
          </div>
        </div>
      </div>
    </Layout>
  );
};

export default DashboardAsistente;
