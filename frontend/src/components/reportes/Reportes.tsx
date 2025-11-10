/**
 * Módulo de Reportes (Admin/Asistente)
 */
import { useState, useEffect } from 'react';
import { Layout } from '../layout/Layout';
import api from '../../services/api';
import { format } from 'date-fns';
import './Reportes.css';

interface Estadisticas {
  solicitudes: {
    total: number;
    pendientes: number;
    programadas: number;
  };
  programaciones: {
    total: number;
    programadas: number;
    realizadas: number;
  };
}

export const Reportes = () => {
  const [estadisticas, setEstadisticas] = useState<Estadisticas | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');
  const [fechaInicio, setFechaInicio] = useState('');
  const [fechaFin, setFechaFin] = useState('');
  const [isDownloading, setIsDownloading] = useState(false);

  useEffect(() => {
    loadEstadisticas();
  }, []);

  const loadEstadisticas = async () => {
    try {
      const response = await api.get<Estadisticas>('/api/v1/reportes/estadisticas');
      setEstadisticas(response.data);
    } catch (err: any) {
      setError('Error al cargar estadísticas');
    } finally {
      setIsLoading(false);
    }
  };

  const handleDownloadProgramaciones = async () => {
    setIsDownloading(true);
    try {
      const params = new URLSearchParams();
      if (fechaInicio) params.append('fecha_inicio', fechaInicio);
      if (fechaFin) params.append('fecha_fin', fechaFin);

      const response = await api.get(`/api/v1/reportes/programaciones/excel?${params.toString()}`, {
        responseType: 'blob',
      });

      // Crear un link temporal para descargar el archivo
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `reporte_programaciones_${format(new Date(), 'yyyyMMdd')}.xlsx`);
      document.body.appendChild(link);
      link.click();
      link.remove();
    } catch (err: any) {
      setError('Error al descargar reporte');
    } finally {
      setIsDownloading(false);
    }
  };

  const handleDownloadSolicitudes = async () => {
    setIsDownloading(true);
    try {
      const params = new URLSearchParams();
      if (fechaInicio) params.append('fecha_inicio', fechaInicio);
      if (fechaFin) params.append('fecha_fin', fechaFin);

      const response = await api.get(`/api/v1/reportes/solicitudes/excel?${params.toString()}`, {
        responseType: 'blob',
      });

      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `reporte_solicitudes_${format(new Date(), 'yyyyMMdd')}.xlsx`);
      document.body.appendChild(link);
      link.click();
      link.remove();
    } catch (err: any) {
      setError('Error al descargar reporte');
    } finally {
      setIsDownloading(false);
    }
  };

  if (isLoading) {
    return (
      <Layout>
        <div className="loading">
          <div className="spinner"></div>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="reportes">
        <div className="header-section">
          <div>
            <h1>Reportes y Estadísticas</h1>
            <p>Genera reportes y visualiza estadísticas del sistema</p>
          </div>
        </div>

        {error && <div className="error-message">{error}</div>}

        {/* Estadísticas */}
        <div className="stats-section">
          <h2>Estadísticas Generales</h2>
          {estadisticas && (
            <div className="stats-grid">
              <div className="stat-card large">
                <h3>Solicitudes</h3>
                <div className="stat-details">
                  <div className="stat-item">
                    <span className="stat-number">{estadisticas.solicitudes.total}</span>
                    <span className="stat-label">Total</span>
                  </div>
                  <div className="stat-item">
                    <span className="stat-number text-warning">{estadisticas.solicitudes.pendientes}</span>
                    <span className="stat-label">Pendientes</span>
                  </div>
                  <div className="stat-item">
                    <span className="stat-number text-info">{estadisticas.solicitudes.programadas}</span>
                    <span className="stat-label">Programadas</span>
                  </div>
                </div>
              </div>

              <div className="stat-card large">
                <h3>Programaciones</h3>
                <div className="stat-details">
                  <div className="stat-item">
                    <span className="stat-number">{estadisticas.programaciones.total}</span>
                    <span className="stat-label">Total</span>
                  </div>
                  <div className="stat-item">
                    <span className="stat-number text-info">{estadisticas.programaciones.programadas}</span>
                    <span className="stat-label">Programadas</span>
                  </div>
                  <div className="stat-item">
                    <span className="stat-number text-success">{estadisticas.programaciones.realizadas}</span>
                    <span className="stat-label">Realizadas</span>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Exportación de Reportes */}
        <div className="export-section">
          <h2>Exportar Reportes</h2>

          <div className="filters-card">
            <div className="filters">
              <div className="form-group">
                <label>Fecha Inicio</label>
                <input
                  type="date"
                  value={fechaInicio}
                  onChange={(e) => setFechaInicio(e.target.value)}
                />
              </div>

              <div className="form-group">
                <label>Fecha Fin</label>
                <input
                  type="date"
                  value={fechaFin}
                  onChange={(e) => setFechaFin(e.target.value)}
                />
              </div>
            </div>

            <div className="export-buttons">
              <button
                className="btn-primary"
                onClick={handleDownloadProgramaciones}
                disabled={isDownloading}
              >
                {isDownloading ? 'Descargando...' : '📊 Exportar Programaciones'}
              </button>

              <button
                className="btn-primary"
                onClick={handleDownloadSolicitudes}
                disabled={isDownloading}
              >
                {isDownloading ? 'Descargando...' : '📋 Exportar Solicitudes'}
              </button>
            </div>
          </div>
        </div>
      </div>
    </Layout>
  );
};

export default Reportes;
