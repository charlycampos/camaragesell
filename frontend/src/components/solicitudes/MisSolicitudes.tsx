/**
 * Vista de Mis Solicitudes (Fiscal) - VERSIÓN ENRIQUECIDA
 * Muestra datos completos con nombres en lugar de IDs
 */
import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Layout } from '../layout/Layout';
import { solicitudService } from '../../services/solicitud.service';
import { SolicitudEnriched } from '../../types';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import StatusBadge from '../common/StatusBadge';
import InfoChip from '../common/InfoChip';
import './MisSolicitudes.css';

export const MisSolicitudes = () => {
  const navigate = useNavigate();
  const [solicitudes, setSolicitudes] = useState<SolicitudEnriched[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    loadSolicitudes();
  }, []);

  const loadSolicitudes = async () => {
    try {
      const data = await solicitudService.getAllEnriched();
      setSolicitudes(data.sort((a, b) =>
        new Date(b.fecha_solicitud).getTime() - new Date(a.fecha_solicitud).getTime()
      ));
    } catch (err: any) {
      setError(err.response?.data?.detail || 'Error al cargar solicitudes');
    } finally {
      setIsLoading(false);
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
      <div className="mis-solicitudes-enriched">
        <div className="header-moderno">
          <div className="header-content">
            <h1>📋 Mis Solicitudes</h1>
            <p>Visualiza el estado de todas tus solicitudes con información detallada</p>
          </div>
          <button
            className="btn-agregar"
            onClick={() => navigate('/solicitudes/nueva')}
          >
            ➕ Nueva Solicitud
          </button>
        </div>

        {error && (
          <div className="error-message-modern">
            <span className="error-icon">⚠️</span>
            <span>{error}</span>
          </div>
        )}

        {solicitudes.length === 0 ? (
          <div className="empty-state-modern">
            <div className="empty-icon">📄</div>
            <h3>No tienes solicitudes</h3>
            <p>Crea tu primera solicitud de cita para Cámara Gesell</p>
            <button
              className="btn-crear-primera"
              onClick={() => navigate('/solicitudes/nueva')}
            >
              ✨ Crear Primera Solicitud
            </button>
          </div>
        ) : (
          <div className="solicitudes-grid-modern">
            {solicitudes.map((solicitud) => (
              <div key={solicitud.id} className="solicitud-card-enriched">
                {/* Header de la tarjeta */}
                <div className="card-header-enriched">
                  <div className="header-left">
                    <h3 className="numero-caso">📑 {solicitud.numero_caso}</h3>
                    <span className="fecha-small">
                      {format(new Date(solicitud.fecha_solicitud), "dd MMM yyyy, HH:mm", { locale: es })}
                    </span>
                  </div>
                  <StatusBadge status={solicitud.estado} type="solicitud" size="medium" />
                </div>

                {/* Contenido principal */}
                <div className="card-content-enriched">
                  {/* Tipo de diligencia */}
                  <div className="info-section">
                    <label className="info-label">Tipo de Diligencia</label>
                    <p className="info-value-highlight">{solicitud.tipo_diligencia}</p>
                  </div>

                  {/* Evaluado */}
                  <div className="info-section">
                    <label className="info-label">Persona Evaluada</label>
                    <div className="evaluado-info">
                      <span className="evaluado-nombre">{solicitud.nombre_evaluado}</span>
                      {solicitud.edad_evaluado && (
                        <span className="evaluado-edad">({solicitud.edad_evaluado} años)</span>
                      )}
                    </div>
                  </div>

                  {/* Despacho Fiscal - INFO ENRIQUECIDA */}
                  <div className="info-chips-container">
                    <InfoChip
                      icon="⚖️"
                      label="Despacho Fiscal"
                      value={solicitud.despacho_fiscal.nombre}
                      variant="primary"
                      size="small"
                    />
                    {solicitud.despacho_fiscal.distrito && (
                      <InfoChip
                        icon="📍"
                        label="Distrito"
                        value={solicitud.despacho_fiscal.distrito}
                        variant="info"
                        size="small"
                      />
                    )}
                  </div>

                  {solicitud.despacho_fiscal.fiscal_titular && (
                    <div className="info-section">
                      <label className="info-label">Fiscal Titular</label>
                      <p className="info-value">{solicitud.despacho_fiscal.fiscal_titular}</p>
                    </div>
                  )}

                  {/* Observaciones */}
                  {solicitud.observaciones && (
                    <div className="info-section">
                      <label className="info-label">Observaciones</label>
                      <p className="info-value-obs">{solicitud.observaciones}</p>
                    </div>
                  )}

                  {/* Indicador de programación */}
                  {solicitud.tiene_programacion && (
                    <div className="programacion-indicator">
                      <span className="indicator-icon">✅</span>
                      <span className="indicator-text">Esta solicitud ya tiene cita programada</span>
                    </div>
                  )}
                </div>

                {/* Footer con acciones */}
                <div className="card-footer-enriched">
                  <button
                    className="btn-ver-detalle"
                    onClick={() => {
                      navigate(`/solicitudes/${solicitud.id}`);
                    }}
                  >
                    👁️ Ver Detalle Completo
                  </button>
                  {solicitud.tiene_programacion && solicitud.programacion_id && (
                    <button
                      className="btn-ver-cita"
                      onClick={() => {
                        navigate(`/programacion/${solicitud.programacion_id}`);
                      }}
                    >
                      📅 Ver Cita
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </Layout>
  );
};

export default MisSolicitudes;
