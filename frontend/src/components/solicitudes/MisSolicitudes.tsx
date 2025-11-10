/**
 * Vista de Mis Solicitudes (Fiscal)
 */
import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Layout } from '../layout/Layout';
import { solicitudService } from '../../services/solicitud.service';
import { Solicitud, EstadoSolicitud } from '../../types';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import './MisSolicitudes.css';

export const MisSolicitudes = () => {
  const navigate = useNavigate();
  const [solicitudes, setSolicitudes] = useState<Solicitud[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    loadSolicitudes();
  }, []);

  const loadSolicitudes = async () => {
    try {
      const data = await solicitudService.getAll();
      setSolicitudes(data.sort((a, b) =>
        new Date(b.fecha_solicitud).getTime() - new Date(a.fecha_solicitud).getTime()
      ));
    } catch (err: any) {
      setError(err.response?.data?.detail || 'Error al cargar solicitudes');
    } finally {
      setIsLoading(false);
    }
  };

  const getEstadoBadgeClass = (estado: EstadoSolicitud) => {
    switch (estado) {
      case EstadoSolicitud.PENDIENTE:
        return 'estado-badge pendiente';
      case EstadoSolicitud.PROGRAMADA:
        return 'estado-badge programada';
      case EstadoSolicitud.RECHAZADA:
        return 'estado-badge rechazada';
      case EstadoSolicitud.CANCELADA:
        return 'estado-badge cancelada';
      default:
        return 'estado-badge';
    }
  };

  const getEstadoTexto = (estado: EstadoSolicitud) => {
    switch (estado) {
      case EstadoSolicitud.PENDIENTE:
        return 'Pendiente';
      case EstadoSolicitud.PROGRAMADA:
        return 'Programada';
      case EstadoSolicitud.RECHAZADA:
        return 'Rechazada';
      case EstadoSolicitud.CANCELADA:
        return 'Cancelada';
      default:
        return estado;
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
      <div className="mis-solicitudes">
        <div className="header-section">
          <div>
            <h1>Mis Solicitudes</h1>
            <p>Visualiza el estado de todas tus solicitudes</p>
          </div>
          <button
            className="btn-primary"
            onClick={() => navigate('/solicitudes/nueva')}
          >
            + Nueva Solicitud
          </button>
        </div>

        {error && <div className="error-message">{error}</div>}

        {solicitudes.length === 0 ? (
          <div className="empty-state">
            <h3>No tienes solicitudes</h3>
            <p>Crea tu primera solicitud de cita</p>
            <button
              className="btn-primary"
              onClick={() => navigate('/solicitudes/nueva')}
            >
              Crear Solicitud
            </button>
          </div>
        ) : (
          <div className="table-container">
            <table>
              <thead>
                <tr>
                  <th>N° Caso</th>
                  <th>Tipo Diligencia</th>
                  <th>Evaluado</th>
                  <th>Fecha Solicitud</th>
                  <th>Estado</th>
                  <th>Acciones</th>
                </tr>
              </thead>
              <tbody>
                {solicitudes.map((solicitud) => (
                  <tr key={solicitud.id}>
                    <td><strong>{solicitud.numero_caso}</strong></td>
                    <td>{solicitud.tipo_diligencia}</td>
                    <td>{solicitud.nombre_evaluado}</td>
                    <td>
                      {format(new Date(solicitud.fecha_solicitud), 'dd MMM yyyy, HH:mm', { locale: es })}
                    </td>
                    <td>
                      <span className={getEstadoBadgeClass(solicitud.estado)}>
                        {getEstadoTexto(solicitud.estado)}
                      </span>
                    </td>
                    <td>
                      <button
                        className="btn-link"
                        onClick={() => {/* TODO: Ver detalle */}}
                      >
                        Ver Detalle
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </Layout>
  );
};

export default MisSolicitudes;
