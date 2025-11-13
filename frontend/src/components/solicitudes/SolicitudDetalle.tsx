/**
 * SolicitudDetalle - Página de detalle completo de una solicitud
 * Incluye: Información completa, edición, cambio de estado, historial
 */
import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Layout } from '../layout/Layout';
import { solicitudService } from '../../services/solicitud.service';
import { SolicitudEnriched, EstadoSolicitud } from '../../types';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import StatusBadge from '../common/StatusBadge';
import InfoChip from '../common/InfoChip';
import './SolicitudDetalle.css';

export const SolicitudDetalle = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();

  const [solicitud, setSolicitud] = useState<SolicitudEnriched | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');
  const [showEditModal, setShowEditModal] = useState(false);
  const [showCancelModal, setShowCancelModal] = useState(false);

  // Form para edición
  const [formData, setFormData] = useState({
    numero_caso: '',
    tipo_diligencia: '',
    nombre_evaluado: '',
    edad_evaluado: 0,
    observaciones: ''
  });

  useEffect(() => {
    if (id) {
      loadSolicitud();
    }
  }, [id]);

  const loadSolicitud = async () => {
    try {
      const data = await solicitudService.getByIdEnriched(parseInt(id!));
      setSolicitud(data);
      setFormData({
        numero_caso: data.numero_caso,
        tipo_diligencia: data.tipo_diligencia,
        nombre_evaluado: data.nombre_evaluado,
        edad_evaluado: data.edad_evaluado || 0,
        observaciones: data.observaciones || ''
      });
    } catch (err: any) {
      setError(err.response?.data?.detail || 'Error al cargar solicitud');
    } finally {
      setIsLoading(false);
    }
  };

  const handleEdit = async () => {
    try {
      await solicitudService.update(parseInt(id!), formData);
      setShowEditModal(false);
      await loadSolicitud();
      alert('✅ Solicitud actualizada exitosamente');
    } catch (err: any) {
      alert('❌ Error al actualizar solicitud');
    }
  };

  const handleCancel = async () => {
    try {
      await solicitudService.update(parseInt(id!), {
        estado: EstadoSolicitud.CANCELADA
      });
      setShowCancelModal(false);
      await loadSolicitud();
      alert('✅ Solicitud cancelada');
    } catch (err: any) {
      alert('❌ Error al cancelar solicitud');
    }
  };

  const handleReject = async () => {
    try {
      await solicitudService.update(parseInt(id!), {
        estado: EstadoSolicitud.RECHAZADA
      });
      await loadSolicitud();
      alert('✅ Solicitud rechazada');
    } catch (err: any) {
      alert('❌ Error al rechazar solicitud');
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

  if (!solicitud) {
    return (
      <Layout>
        <div className="error-page">
          <h1>Solicitud no encontrada</h1>
          <button onClick={() => navigate(-1)}>Volver</button>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="solicitud-detalle">
        {/* Header */}
        <div className="detalle-header">
          <button className="btn-back" onClick={() => navigate(-1)}>
            ← Volver
          </button>
          <div className="header-content">
            <h1>📋 {solicitud.numero_caso}</h1>
            <StatusBadge status={solicitud.estado} type="solicitud" size="large" />
          </div>
        </div>

        {error && (
          <div className="error-message-modern">
            <span className="error-icon">⚠️</span>
            <span>{error}</span>
          </div>
        )}

        {/* Contenido principal */}
        <div className="detalle-grid">
          {/* Información principal */}
          <div className="detalle-card">
            <div className="card-header-detalle">
              <h2>📝 Información de la Solicitud</h2>
              {solicitud.estado === EstadoSolicitud.PENDIENTE && (
                <button className="btn-edit" onClick={() => setShowEditModal(true)}>
                  ✏️ Editar
                </button>
              )}
            </div>
            <div className="card-body-detalle">
              <div className="info-row-detalle">
                <label>Número de Caso</label>
                <p className="value-highlight">{solicitud.numero_caso}</p>
              </div>
              <div className="info-row-detalle">
                <label>Tipo de Diligencia</label>
                <p>{solicitud.tipo_diligencia}</p>
              </div>
              <div className="info-row-detalle">
                <label>Persona Evaluada</label>
                <p className="value-highlight">{solicitud.nombre_evaluado}</p>
              </div>
              {solicitud.edad_evaluado && (
                <div className="info-row-detalle">
                  <label>Edad del Evaluado</label>
                  <p>{solicitud.edad_evaluado} años</p>
                </div>
              )}
              <div className="info-row-detalle">
                <label>Fecha de Solicitud</label>
                <p>
                  {format(new Date(solicitud.fecha_solicitud), "dd 'de' MMMM 'de' yyyy, HH:mm", { locale: es })}
                </p>
              </div>
              {solicitud.observaciones && (
                <div className="info-row-detalle">
                  <label>Observaciones</label>
                  <p className="observaciones-text">{solicitud.observaciones}</p>
                </div>
              )}
            </div>
          </div>

          {/* Despacho Fiscal */}
          <div className="detalle-card">
            <div className="card-header-detalle">
              <h2>⚖️ Despacho Fiscal</h2>
            </div>
            <div className="card-body-detalle">
              <InfoChip
                icon="⚖️"
                label="Despacho"
                value={solicitud.despacho_fiscal.nombre}
                variant="primary"
                size="medium"
              />
              {solicitud.despacho_fiscal.distrito && (
                <InfoChip
                  icon="📍"
                  label="Distrito"
                  value={solicitud.despacho_fiscal.distrito}
                  variant="info"
                  size="medium"
                />
              )}
              {solicitud.despacho_fiscal.fiscal_titular && (
                <div className="info-row-detalle">
                  <label>Fiscal Titular</label>
                  <p>{solicitud.despacho_fiscal.fiscal_titular}</p>
                </div>
              )}
            </div>
          </div>

          {/* Solicitante */}
          <div className="detalle-card">
            <div className="card-header-detalle">
              <h2>👤 Solicitante</h2>
            </div>
            <div className="card-body-detalle">
              <div className="info-row-detalle">
                <label>Nombre</label>
                <p className="value-highlight">{solicitud.solicitante.full_name || solicitud.solicitante.username}</p>
              </div>
              <div className="info-row-detalle">
                <label>Email</label>
                <p>{solicitud.solicitante.email}</p>
              </div>
              <div className="info-row-detalle">
                <label>Rol</label>
                <p className="role-badge">{solicitud.solicitante.role}</p>
              </div>
            </div>
          </div>

          {/* Programación */}
          {solicitud.tiene_programacion && (
            <div className="detalle-card programacion-card">
              <div className="card-header-detalle">
                <h2>📅 Programación</h2>
              </div>
              <div className="card-body-detalle">
                <div className="programacion-info">
                  <span className="programacion-icon">✅</span>
                  <div>
                    <p className="programacion-text">Esta solicitud tiene una cita programada</p>
                    <button
                      className="btn-ver-programacion"
                      onClick={() => navigate(`/programacion/${solicitud.programacion_id}`)}
                    >
                      Ver Programación →
                    </button>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Acciones */}
        {solicitud.estado === EstadoSolicitud.PENDIENTE && (
          <div className="detalle-acciones">
            <h3>Acciones Disponibles</h3>
            <div className="acciones-buttons">
              <button className="btn-accion btn-cancel" onClick={() => setShowCancelModal(true)}>
                🚫 Cancelar Solicitud
              </button>
              <button className="btn-accion btn-reject" onClick={handleReject}>
                ❌ Rechazar Solicitud
              </button>
            </div>
          </div>
        )}

        {/* Timeline de historial */}
        <div className="detalle-timeline">
          <h3>📜 Historial de Cambios</h3>
          <div className="timeline">
            <div className="timeline-item">
              <div className="timeline-marker created"></div>
              <div className="timeline-content">
                <p className="timeline-title">Solicitud Creada</p>
                <p className="timeline-date">
                  {format(new Date(solicitud.created_at), "dd/MM/yyyy HH:mm", { locale: es })}
                </p>
              </div>
            </div>
            {solicitud.updated_at && solicitud.updated_at !== solicitud.created_at && (
              <div className="timeline-item">
                <div className="timeline-marker updated"></div>
                <div className="timeline-content">
                  <p className="timeline-title">Última Actualización</p>
                  <p className="timeline-date">
                    {format(new Date(solicitud.updated_at), "dd/MM/yyyy HH:mm", { locale: es })}
                  </p>
                </div>
              </div>
            )}
            {solicitud.estado === EstadoSolicitud.PROGRAMADA && (
              <div className="timeline-item">
                <div className="timeline-marker programada"></div>
                <div className="timeline-content">
                  <p className="timeline-title">Cita Programada</p>
                  <p className="timeline-desc">La solicitud fue programada exitosamente</p>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Modal de Edición */}
        {showEditModal && (
          <div className="modal-overlay" onClick={() => setShowEditModal(false)}>
            <div className="modal-edit" onClick={(e) => e.stopPropagation()}>
              <div className="modal-header-edit">
                <h2>✏️ Editar Solicitud</h2>
                <button className="btn-close" onClick={() => setShowEditModal(false)}>✕</button>
              </div>
              <div className="modal-body-edit">
                <div className="form-group">
                  <label>Número de Caso</label>
                  <input
                    type="text"
                    value={formData.numero_caso}
                    onChange={(e) => setFormData({ ...formData, numero_caso: e.target.value })}
                  />
                </div>
                <div className="form-group">
                  <label>Tipo de Diligencia</label>
                  <input
                    type="text"
                    value={formData.tipo_diligencia}
                    onChange={(e) => setFormData({ ...formData, tipo_diligencia: e.target.value })}
                  />
                </div>
                <div className="form-group">
                  <label>Nombre del Evaluado</label>
                  <input
                    type="text"
                    value={formData.nombre_evaluado}
                    onChange={(e) => setFormData({ ...formData, nombre_evaluado: e.target.value })}
                  />
                </div>
                <div className="form-group">
                  <label>Edad del Evaluado</label>
                  <input
                    type="number"
                    value={formData.edad_evaluado}
                    onChange={(e) => setFormData({ ...formData, edad_evaluado: parseInt(e.target.value) })}
                  />
                </div>
                <div className="form-group">
                  <label>Observaciones</label>
                  <textarea
                    value={formData.observaciones}
                    onChange={(e) => setFormData({ ...formData, observaciones: e.target.value })}
                    rows={4}
                  />
                </div>
              </div>
              <div className="modal-footer-edit">
                <button className="btn-cancel-modal" onClick={() => setShowEditModal(false)}>
                  Cancelar
                </button>
                <button className="btn-save" onClick={handleEdit}>
                  💾 Guardar Cambios
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Modal de Confirmación de Cancelación */}
        {showCancelModal && (
          <div className="modal-overlay" onClick={() => setShowCancelModal(false)}>
            <div className="modal-confirm" onClick={(e) => e.stopPropagation()}>
              <div className="modal-header-confirm">
                <h2>⚠️ Confirmar Cancelación</h2>
              </div>
              <div className="modal-body-confirm">
                <p>¿Estás seguro de que deseas cancelar esta solicitud?</p>
                <p className="warning-text">Esta acción no se puede deshacer.</p>
              </div>
              <div className="modal-footer-confirm">
                <button className="btn-no" onClick={() => setShowCancelModal(false)}>
                  No, volver
                </button>
                <button className="btn-yes" onClick={handleCancel}>
                  Sí, cancelar solicitud
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </Layout>
  );
};

export default SolicitudDetalle;
