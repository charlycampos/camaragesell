/**
 * Dashboard Administrativo - Con gráficos y métricas en tiempo real
 */
import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Layout } from '../components/layout/Layout';
import { estadisticasService, ResumenGeneral, SolicitudesPorMes, ProgramacionesPorPerito, OcupacionSala, SolicitudesPorDespacho } from '../services/estadisticas.service';
import {
  BarChart, Bar, LineChart, Line, PieChart, Pie, Cell,
  XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer
} from 'recharts';
import './DashboardAdmin.css';

const COLORS = ['#8b5cf6', '#3b82f6', '#10b981', '#f59e0b', '#ef4444'];

export const DashboardAdmin = () => {
  const navigate = useNavigate();
  const [resumen, setResumen] = useState<ResumenGeneral | null>(null);
  const [solicitudesPorMes, setSolicitudesPorMes] = useState<SolicitudesPorMes[]>([]);
  const [programacionesPorPerito, setProgramacionesPorPerito] = useState<ProgramacionesPorPerito[]>([]);
  const [ocupacionSalas, setOcupacionSalas] = useState<OcupacionSala[]>([]);
  const [solicitudesPorDespacho, setSolicitudesPorDespacho] = useState<SolicitudesPorDespacho[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    loadEstadisticas();
  }, []);

  const loadEstadisticas = async () => {
    try {
      const [resumenData, solicitudesData, programacionesData, ocupacionData, despachosData] = await Promise.all([
        estadisticasService.getResumenGeneral(),
        estadisticasService.getSolicitudesPorMes(6),
        estadisticasService.getProgramacionesPorPerito(),
        estadisticasService.getOcupacionSalas(),
        estadisticasService.getSolicitudesPorDespacho()
      ]);

      setResumen(resumenData);
      setSolicitudesPorMes(solicitudesData);
      setProgramacionesPorPerito(programacionesData.slice(0, 8)); // Top 8
      setOcupacionSalas(ocupacionData.slice(0, 6)); // Top 6
      setSolicitudesPorDespacho(despachosData);
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
          <p>Cargando estadísticas...</p>
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

  // Preparar datos para el gráfico de pie de estados de solicitudes
  const solicitudesEstadoData = resumen ? [
    { name: 'Pendientes', value: resumen.solicitudes_pendientes },
    { name: 'Aprobadas', value: resumen.solicitudes_aprobadas },
    { name: 'Rechazadas', value: resumen.solicitudes_rechazadas }
  ] : [];

  return (
    <Layout>
      <div className="dashboard-admin-modern">
        {/* Header */}
        <div className="dashboard-header">
          <div className="header-content">
            <h1>📊 Dashboard Administrativo</h1>
            <p>Visualización completa del sistema SIGECA en tiempo real</p>
          </div>
          <button className="btn-refresh" onClick={loadEstadisticas}>
            🔄 Actualizar
          </button>
        </div>

        {/* KPI Cards */}
        {resumen && (
          <div className="kpi-grid">
            <div className="kpi-card kpi-purple">
              <div className="kpi-icon">📋</div>
              <div className="kpi-content">
                <h3>{resumen.total_solicitudes}</h3>
                <p>Total Solicitudes</p>
              </div>
              <div className="kpi-badge">{resumen.solicitudes_pendientes} pendientes</div>
            </div>

            <div className="kpi-card kpi-blue">
              <div className="kpi-icon">📅</div>
              <div className="kpi-content">
                <h3>{resumen.total_programaciones}</h3>
                <p>Programaciones</p>
              </div>
              <div className="kpi-badge">{resumen.programaciones_mes} este mes</div>
            </div>

            <div className="kpi-card kpi-green">
              <div className="kpi-icon">✅</div>
              <div className="kpi-content">
                <h3>{resumen.tasa_realizacion}%</h3>
                <p>Tasa de Realización</p>
              </div>
              <div className="kpi-badge">{resumen.programaciones_realizadas} realizadas</div>
            </div>

            <div className="kpi-card kpi-orange">
              <div className="kpi-icon">🏢</div>
              <div className="kpi-content">
                <h3>{resumen.total_salas}</h3>
                <p>Salas Activas</p>
              </div>
              <div className="kpi-badge">{resumen.total_peritos} peritos</div>
            </div>
          </div>
        )}

        {/* Gráficos principales */}
        <div className="charts-grid">
          {/* Solicitudes por mes */}
          <div className="chart-card chart-large">
            <div className="chart-header">
              <h3>📈 Solicitudes por Mes</h3>
              <p>Últimos 6 meses</p>
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
                  <Line type="monotone" dataKey="aprobadas" stroke="#10b981" strokeWidth={2} name="Aprobadas" />
                  <Line type="monotone" dataKey="rechazadas" stroke="#ef4444" strokeWidth={2} name="Rechazadas" />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Estados de solicitudes */}
          <div className="chart-card">
            <div className="chart-header">
              <h3>🔵 Estados de Solicitudes</h3>
              <p>Distribución actual</p>
            </div>
            <div className="chart-container">
              <ResponsiveContainer width="100%" height={300}>
                <PieChart>
                  <Pie
                    data={solicitudesEstadoData}
                    cx="50%"
                    cy="50%"
                    labelLine={false}
                    label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                    outerRadius={80}
                    fill="#8884d8"
                    dataKey="value"
                  >
                    {solicitudesEstadoData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Programaciones por perito */}
          <div className="chart-card chart-large">
            <div className="chart-header">
              <h3>👥 Programaciones por Perito</h3>
              <p>Top 8 peritos más activos</p>
            </div>
            <div className="chart-container">
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={programacionesPorPerito}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                  <XAxis dataKey="perito" stroke="#6b7280" angle={-45} textAnchor="end" height={100} />
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
                  <Bar dataKey="total" fill="#8b5cf6" name="Total" />
                  <Bar dataKey="realizadas" fill="#10b981" name="Realizadas" />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Ocupación de salas */}
          <div className="chart-card">
            <div className="chart-header">
              <h3>🏢 Ocupación de Salas</h3>
              <p>Tasa de uso</p>
            </div>
            <div className="chart-container">
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={ocupacionSalas} layout="horizontal">
                  <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                  <XAxis type="number" stroke="#6b7280" />
                  <YAxis dataKey="sala" type="category" stroke="#6b7280" width={100} />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: 'rgba(255, 255, 255, 0.95)',
                      border: '1px solid #e5e7eb',
                      borderRadius: '8px',
                      boxShadow: '0 4px 6px rgba(0, 0, 0, 0.1)'
                    }}
                  />
                  <Legend />
                  <Bar dataKey="tasa_ocupacion" fill="#3b82f6" name="Tasa %" />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Solicitudes por despacho */}
          <div className="chart-card chart-full">
            <div className="chart-header">
              <h3>⚖️ Solicitudes por Despacho Fiscal</h3>
              <p>Top 10 despachos</p>
            </div>
            <div className="chart-container">
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={solicitudesPorDespacho}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                  <XAxis dataKey="despacho" stroke="#6b7280" angle={-45} textAnchor="end" height={120} />
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
                  <Bar dataKey="total" fill="#8b5cf6" name="Total" />
                  <Bar dataKey="pendientes" fill="#f59e0b" name="Pendientes" />
                  <Bar dataKey="aprobadas" fill="#10b981" name="Aprobadas" />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>

        {/* Accesos rápidos */}
        <div className="quick-access">
          <h3>⚡ Accesos Rápidos</h3>
          <div className="quick-access-grid">
            <button className="quick-btn" onClick={() => navigate('/usuarios')}>
              <span className="quick-icon">👥</span>
              <span>Gestión de Usuarios</span>
            </button>
            <button className="quick-btn" onClick={() => navigate('/solicitudes/pendientes')}>
              <span className="quick-icon">📋</span>
              <span>Solicitudes Pendientes</span>
            </button>
            <button className="quick-btn" onClick={() => navigate('/programacion/calendario-avanzado')}>
              <span className="quick-icon">📅</span>
              <span>Calendario</span>
            </button>
            <button className="quick-btn" onClick={() => navigate('/reportes')}>
              <span className="quick-icon">📊</span>
              <span>Reportes</span>
            </button>
            <button className="quick-btn" onClick={() => navigate('/mantenimientos/sedes')}>
              <span className="quick-icon">🏢</span>
              <span>Mantenimientos</span>
            </button>
          </div>
        </div>
      </div>
    </Layout>
  );
};

export default DashboardAdmin;
