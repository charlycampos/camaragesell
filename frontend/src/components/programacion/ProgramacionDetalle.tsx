/**
 * ProgramacionDetalle - Página de detalle completo de una programación
 * Incluye: Información completa, reprogramación, cambio de estado
 */
import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Layout } from '../layout/Layout';
import { programacionService } from '../../services/programacion.service';
import { salaService } from '../../services/sala.service';
import { peritoService } from '../../services/perito.service';
import { ProgramacionEnriched, EstadoProgramacion, Sala, Perito } from '../../types';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import StatusBadge from '../common/StatusBadge';
import InfoChip from '../common/InfoChip';
import ValidationAlert from '../common/ValidationAlert';
import './ProgramacionDetalle.css';

export const ProgramacionDetalle = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();

  const [programacion, setProgramacion] = useState<ProgramacionEnriched | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');
  const [showEditModal, setShowEditModal] = useState(false);
  const [showEstadoModal, setShowEstadoModal] = useState(false);
  const [validationErrors, setValidationErrors] = useState<string[]>([]);

  // Listas para selects
  const [salas, setSalas] = useState<Sala[]>([]);
  const [peritos, setPeritos] = useState<Perito[]>([]);

  // Form para reprogramación
  const [formData, setFormData] = useState({
    fecha_hora: '',
    duracion_minutos: 60,
    sala_id: 0,
    perito_id: 0,
    notas: ''
  });

  // Estado seleccionado
  const [nuevoEstado, setNuevoEstado] = useState<EstadoProgramacion>(EstadoProgramacion.PROGRAMADA);

  useEffect(() => {
    if (id) {
      loadProgramacion();
      loadSalas();
      loadPeritos();
    }
  }, [id]);

  const loadProgramacion = async () => {
    try {
      const data = await programacionService.getByIdEnriched(parseInt(id!));
      setProgramacion(data);
      setFormData({
        fecha_hora: data.fecha_hora,
        duracion_minutos: data.duracion_minutos,
        sala_id: data.sala_id,
        perito_id: data.perito_id,
        notas: data.notas || ''
      });
      setNuevoEstado(data.estado);
    } catch (err: any) {
      setError(err.response?.data?.detail || 'Error al cargar programación');
    } finally {
      setIsLoading(false);
    }
  };

  const loadSalas = async () => {
    try {
      const data = await salaService.getAll();
      setSalas(data.filter(s => s.is_active));
    } catch (err) {
      console.error('Error loading salas:', err);
    }
  };

  const loadPeritos = async () => {
    try {
      const data = await peritoService.getAll();
      setPeritos(data.filter(p => p.is_active));
    } catch (err) {
      console.error('Error loading peritos:', err);
    }
  };

  const handleReprogramar = async () => {
    setValidationErrors([]);

    // Validar primero
    try {
      const validation = await programacionService.validar({
        fecha_hora: formData.fecha_hora,
        duracion_minutos: formData.duracion_minutos,
        sala_id: formData.sala_id,
        perito_id: formData.perito_id,
        programacion_id: parseInt(id!)
      });

      if (!validation.is_valid) {
        setValidationErrors(validation.errors);
        return;
      }

      // Si es válido, actualizar
      await programacionService.update(parseInt(id!), formData);
      setShowEditModal(false);
      await loadProgramacion();
      alert('✅ Programación actualizada exitosamente');
    } catch (err: any) {
      const errors = err.response?.data?.detail?.errors || ['Error al actualizar programación'];
      setValidationErrors(errors);
    }
  };

  const handleCambiarEstado = async () => {
    try {
      await programacionService.update(parseInt(id!), {
        estado: nuevoEstado
      });
      setShowEstadoModal(false);
      await loadProgramacion();
      alert(`✅ Estado cambiado a: ${nuevoEstado}`);
    } catch (err: any) {
      alert('❌ Error al cambiar estado');
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

  if (!programacion) {
    return (
      <Layout>
        <div className="error-page">
          <h1>Programación no encontrada</h1>
          <button onClick={() => navigate(-1)}>Volver</button>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="programacion-detalle">
        {/* Header */}
        <div className="detalle-header">
          <button className="btn-back" onClick={() => navigate(-1)}>
            ← Volver al Calendario
          </button>
          <div className="header-content">
            <h1>📅 Programación - {programacion.solicitud.numero_caso}</h1>
            <StatusBadge status={programacion.estado} type="programacion" size="large" />
          </div>
        </div>

        {error && (
          <div className="error-message-modern">
            <span className="error-icon">⚠️</span>
            <span>{error}</span>
          </div>
        )}

        {/* Contenido principal */}
        <div className="detalle-grid-prog">
          {/* Fecha y Hora */}
          <div className="detalle-card-prog fecha-card">
            <div className="card-header-prog">
              <h2>🕒 Fecha y Hora</h2>
              {programacion.estado === EstadoProgramacion.PROGRAMADA && (
                <button className="btn-edit-prog" onClick={() => setShowEditModal(true)}>
                  🔄 Reprogramar
                </button>
              )}
            </div>
            <div className="card-body-prog">
              <div className="fecha-display">
                <div className="fecha-principal">
                  {format(new Date(programacion.fecha_hora), "dd 'de' MMMM 'de' yyyy", { locale: es })}
                </div>
                <div className="hora-display">
                  <div className="hora-item">
                    <span className="hora-label">Inicio</span>
                    <span className="hora-valor">{programacion.hora_inicio}</span>
                  </div>
                  <span className="hora-separador">→</span>
                  <div className="hora-item">
                    <span className="hora-label">Fin</span>
                    <span className="hora-valor">{programacion.hora_fin}</span>
                  </div>
                </div>
                <div className="duracion-display">
                  ⏱️ Duración: <strong>{programacion.duracion_minutos} minutos</strong> ({programacion.duracion_horas.toFixed(1)} horas)
                </div>
              </div>
            </div>
          </div>

          {/* Solicitud Asociada */}
          <div className="detalle-card-prog">
            <div className="card-header-prog">
              <h2>📋 Solicitud Asociada</h2>
            </div>
            <div className="card-body-prog">
              <InfoChip
                icon="📑"
                label="Número de Caso"
                value={programacion.solicitud.numero_caso}
                variant="primary"
                size="medium"
              />
              <div className="info-row-prog">
                <label>Tipo de Diligencia</label>
                <p>{programacion.solicitud.tipo_diligencia}</p>
              </div>
              <div className="info-row-prog">
                <label>Persona Evaluada</label>
                <p className="value-highlight">{programacion.solicitud.nombre_evaluado}</p>
              </div>
              {programacion.solicitud.edad_evaluado && (
                <div className="info-row-prog">
                  <label>Edad</label>
                  <p>{programacion.solicitud.edad_evaluado} años</p>
                </div>
              )}
              <InfoChip
                icon="⚖️"
                label="Despacho Fiscal"
                value={programacion.solicitud.despacho_fiscal_nombre}
                variant="info"
                size="medium"
              />
            </div>
          </div>

          {/* Sala */}
          <div className="detalle-card-prog">
            <div className="card-header-prog">
              <h2>🏢 Sala Asignada</h2>
            </div>
            <div className="card-body-prog">
              <InfoChip
                icon="🏢"
                label="Sala"
                value={programacion.sala.nombre}
                variant="success"
                size="medium"
              />
              <InfoChip
                icon="🏛️"
                label="Sede"
                value={programacion.sala.sede_nombre}
                variant="teal"
                size="medium"
              />
              {programacion.sala.capacidad && (
                <div className="info-row-prog">
                  <label>Capacidad</label>
                  <p>{programacion.sala.capacidad} personas</p>
                </div>
              )}
              {programacion.sala.equipamiento && (
                <div className="info-row-prog">
                  <label>Equipamiento</label>
                  <p>{programacion.sala.equipamiento}</p>
                </div>
              )}
            </div>
          </div>

          {/* Perito */}
          <div className="detalle-card-prog">
            <div className="card-header-prog">
              <h2>👨‍⚕️ Perito Asignado</h2>
            </div>
            <div className="card-body-prog">
              <div className="perito-avatar-large">
                <span className="avatar-initials">
                  {programacion.perito.nombres.charAt(0)}{programacion.perito.apellidos.charAt(0)}
                </span>
              </div>
              <div className="info-row-prog">
                <label>Nombre Completo</label>
                <p className="value-highlight">{programacion.perito.nombre_completo}</p>
              </div>
              {programacion.perito.especialidad && (
                <div className="info-row-prog">
                  <label>Especialidad</label>
                  <p>{programacion.perito.especialidad}</p>
                </div>
              )}
              {programacion.perito.numero_colegiatura && (
                <div className="info-row-prog">
                  <label>N° Colegiatura</label>
                  <p>{programacion.perito.numero_colegiatura}</p>
                </div>
              )}
              {programacion.perito.telefono && (
                <div className="info-row-prog">
                  <label>Teléfono</label>
                  <p>{programacion.perito.telefono}</p>
                </div>
              )}
              {programacion.perito.email && (
                <div className="info-row-prog">
                  <label>Email</label>
                  <p>{programacion.perito.email}</p>
                </div>
              )}
            </div>
          </div>

          {/* Notas */}
          {programacion.notas && (
            <div className="detalle-card-prog notas-card">
              <div className="card-header-prog">
                <h2>📝 Notas</h2>
              </div>
              <div className="card-body-prog">
                <p className="notas-text">{programacion.notas}</p>
              </div>
            </div>
          )}
        </div>

        {/* Acciones */}
        <div className="detalle-acciones-prog">
          <h3>Acciones Disponibles</h3>
          <div className="acciones-buttons-prog">
            <button className="btn-accion-prog btn-estado" onClick={() => setShowEstadoModal(true)}>
              🔄 Cambiar Estado
            </button>
            <button className="btn-accion-prog btn-solicitud" onClick={() => navigate(`/solicitudes/${programacion.solicitud_id}`)}>
              📋 Ver Solicitud Completa
            </button>
          </div>
        </div>

        {/* Modal de Reprogramación */}
        {showEditModal && (
          <div className="modal-overlay" onClick={() => setShowEditModal(false)}>
            <div className="modal-edit-prog" onClick={(e) => e.stopPropagation()}>
              <div className="modal-header-prog">
                <h2>🔄 Reprogramar Cita</h2>
                <button className="btn-close" onClick={() => setShowEditModal(false)}>✕</button>
              </div>
              <div className="modal-body-prog">
                {validationErrors.length > 0 && (
                  <ValidationAlert errors={validationErrors} onClose={() => setValidationErrors([])} />
                )}
                <div className="form-group">
                  <label>Fecha y Hora</label>
                  <input
                    type="datetime-local"
                    value={formData.fecha_hora.slice(0, 16)}
                    onChange={(e) => setFormData({ ...formData, fecha_hora: e.target.value + ':00' })}
                  />
                </div>
                <div className="form-group">
                  <label>Duración (minutos)</label>
                  <input
                    type="number"
                    value={formData.duracion_minutos}
                    onChange={(e) => setFormData({ ...formData, duracion_minutos: parseInt(e.target.value) })}
                    min="30"
                    max="240"
                    step="30"
                  />
                </div>
                <div className="form-group">
                  <label>Sala</label>
                  <select
                    value={formData.sala_id}
                    onChange={(e) => setFormData({ ...formData, sala_id: parseInt(e.target.value) })}
                  >
                    {salas.map(sala => (
                      <option key={sala.id} value={sala.id}>{sala.nombre}</option>
                    ))}
                  </select>
                </div>
                <div className="form-group">
                  <label>Perito</label>
                  <select
                    value={formData.perito_id}
                    onChange={(e) => setFormData({ ...formData, perito_id: parseInt(e.target.value) })}
                  >
                    {peritos.map(perito => (
                      <option key={perito.id} value={perito.id}>
                        {perito.nombres} {perito.apellidos}
                      </option>
                    ))}
                  </select>
                </div>
                <div className="form-group">
                  <label>Notas</label>
                  <textarea
                    value={formData.notas}
                    onChange={(e) => setFormData({ ...formData, notas: e.target.value })}
                    rows={4}
                  />
                </div>
              </div>
              <div className="modal-footer-prog">
                <button className="btn-cancel-modal" onClick={() => setShowEditModal(false)}>
                  Cancelar
                </button>
                <button className="btn-save" onClick={handleReprogramar}>
                  💾 Guardar Cambios
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Modal de Cambio de Estado */}
        {showEstadoModal && (
          <div className="modal-overlay" onClick={() => setShowEstadoModal(false)}>
            <div className="modal-estado" onClick={(e) => e.stopPropagation()}>
              <div className="modal-header-prog">
                <h2>🔄 Cambiar Estado</h2>
                <button className="btn-close" onClick={() => setShowEstadoModal(false)}>✕</button>
              </div>
              <div className="modal-body-prog">
                <p>Selecciona el nuevo estado para esta programación:</p>
                <div className="estados-grid">
                  <div
                    className={`estado-option ${nuevoEstado === EstadoProgramacion.PROGRAMADA ? 'selected' : ''}`}
                    onClick={() => setNuevoEstado(EstadoProgramacion.PROGRAMADA)}
                  >
                    <span className="estado-icon">📅</span>
                    <span className="estado-label">Programada</span>
                  </div>
                  <div
                    className={`estado-option ${nuevoEstado === EstadoProgramacion.REALIZADA ? 'selected' : ''}`}
                    onClick={() => setNuevoEstado(EstadoProgramacion.REALIZADA)}
                  >
                    <span className="estado-icon">✔️</span>
                    <span className="estado-label">Realizada</span>
                  </div>
                  <div
                    className={`estado-option ${nuevoEstado === EstadoProgramacion.REPROGRAMADA ? 'selected' : ''}`}
                    onClick={() => setNuevoEstado(EstadoProgramacion.REPROGRAMADA)}
                  >
                    <span className="estado-icon">🔄</span>
                    <span className="estado-label">Reprogramada</span>
                  </div>
                  <div
                    className={`estado-option ${nuevoEstado === EstadoProgramacion.CANCELADA ? 'selected' : ''}`}
                    onClick={() => setNuevoEstado(EstadoProgramacion.CANCELADA)}
                  >
                    <span className="estado-icon">🚫</span>
                    <span className="estado-label">Cancelada</span>
                  </div>
                  <div
                    className={`estado-option ${nuevoEstado === EstadoProgramacion.NO_ASISTIO ? 'selected' : ''}`}
                    onClick={() => setNuevoEstado(EstadoProgramacion.NO_ASISTIO)}
                  >
                    <span className="estado-icon">⚠️</span>
                    <span className="estado-label">No Asistió</span>
                  </div>
                </div>
              </div>
              <div className="modal-footer-prog">
                <button className="btn-cancel-modal" onClick={() => setShowEstadoModal(false)}>
                  Cancelar
                </button>
                <button className="btn-save" onClick={handleCambiarEstado}>
                  ✅ Cambiar Estado
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </Layout>
  );
};

export default ProgramacionDetalle;
