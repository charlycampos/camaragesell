/**
 * Bandeja de Solicitudes Pendientes (Asistente Administrativo)
 */
import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Layout } from '../layout/Layout';
import { solicitudService } from '../../services/solicitud.service';
import { Solicitud } from '../../types';
import { format } from 'date-fns';
import './SolicitudesPendientes.css';

export const SolicitudesPendientes = () => {
  const navigate = useNavigate();
  const [solicitudes, setSolicitudes] = useState<Solicitud[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');
  const [selectedSolicitud, setSelectedSolicitud] = useState<Solicitud | null>(null);

  useEffect(() => {
    loadSolicitudes();
  }, []);

  const loadSolicitudes = async () => {
    try {
      const data = await solicitudService.getPendientes();
      setSolicitudes(data.sort((a, b) =>
        new Date(a.fecha_solicitud).getTime() - new Date(b.fecha_solicitud).getTime()
      ));
    } catch (err: any) {
      setError(err.response?.data?.detail || 'Error al cargar solicitudes');
    } finally {
      setIsLoading(false);
    }
  };

  const handleProgramar = (solicitud: Solicitud) => {
    // Navegar al calendario con la solicitud seleccionada
    navigate('/programacion/calendario', { state: { solicitud } });
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
      <div className="solicitudes-pendientes">
        <div className="header-section">
          <div>
            <h1>Solicitudes Pendientes</h1>
            <p>Gestiona las solicitudes pendientes de programación</p>
          </div>
          <div className="stats">
            <div className="stat-card">
              <span className="stat-number">{solicitudes.length}</span>
              <span className="stat-label">Pendientes</span>
            </div>
          </div>
        </div>

        {error && <div className="error-message">{error}</div>}

        {solicitudes.length === 0 ? (
          <div className="empty-state">
            <h3>No hay solicitudes pendientes</h3>
            <p>Todas las solicitudes han sido procesadas</p>
          </div>
        ) : (
          <div className="solicitudes-grid">
            {solicitudes.map((solicitud) => (
              <div
                key={solicitud.id}
                className={`solicitud-card ${selectedSolicitud?.id === solicitud.id ? 'selected' : ''}`}
                onClick={() => setSelectedSolicitud(solicitud)}
              >
                <div className="card-header">
                  <h3>{solicitud.numero_caso}</h3>
                  <span className="fecha">
                    {format(new Date(solicitud.fecha_solicitud), 'dd/MM/yyyy HH:mm')}
                  </span>
                </div>

                <div className="card-body">
                  <div className="info-row">
                    <span className="label">Tipo:</span>
                    <span className="value">{solicitud.tipo_diligencia}</span>
                  </div>
                  <div className="info-row">
                    <span className="label">Evaluado:</span>
                    <span className="value">{solicitud.nombre_evaluado}</span>
                  </div>
                  {solicitud.edad_evaluado && (
                    <div className="info-row">
                      <span className="label">Edad:</span>
                      <span className="value">{solicitud.edad_evaluado} años</span>
                    </div>
                  )}
                  {solicitud.observaciones && (
                    <div className="info-row">
                      <span className="label">Observaciones:</span>
                      <span className="value text-small">{solicitud.observaciones}</span>
                    </div>
                  )}
                </div>

                <div className="card-footer">
                  <button
                    className="btn-secondary btn-small"
                    onClick={(e) => {
                      e.stopPropagation();
                      navigate(`/solicitudes/${solicitud.id}`);
                    }}
                  >
                    Ver Detalle
                  </button>
                  <button
                    className="btn-primary btn-small"
                    onClick={(e) => {
                      e.stopPropagation();
                      handleProgramar(solicitud);
                    }}
                  >
                    Programar Cita
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </Layout>
  );
};

export default SolicitudesPendientes;
