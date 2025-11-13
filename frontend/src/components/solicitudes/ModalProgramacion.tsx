/**
 * Modal de Programación - Muestra toda la información en una vista
 */
import { useState, useEffect, FormEvent } from 'react';
import { programacionService } from '../../services/programacion.service';
import { salaService, peritoService } from '../../services/mantenimiento.service';
import { SolicitudEnriched, Sala, Perito, ProgramacionCreate, Programacion } from '../../types';
import { format } from 'date-fns';
import './ModalProgramacion.css';

interface ModalProgramacionProps {
  solicitud: SolicitudEnriched;
  onClose: () => void;
  onSuccess: () => void;
}

export const ModalProgramacion = ({ solicitud, onClose, onSuccess }: ModalProgramacionProps) => {
  const [salas, setSalas] = useState<Sala[]>([]);
  const [peritos, setPeritos] = useState<Perito[]>([]);
  const [programacionesDelDia, setProgramacionesDelDia] = useState<Programacion[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState('');

  const [formData, setFormData] = useState<ProgramacionCreate>({
    fecha_hora: '',
    duracion_minutos: 60,
    solicitud_id: solicitud.id,
    sala_id: 0,
    perito_id: 0,
  });

  useEffect(() => {
    loadData();
  }, []);

  useEffect(() => {
    if (formData.fecha_hora) {
      loadProgramacionesDelDia();
    }
  }, [formData.fecha_hora]);

  const loadData = async () => {
    try {
      const [salasData, peritosData] = await Promise.all([
        salaService.getAll(),
        peritoService.getAll(),
      ]);
      setSalas(salasData.filter(s => s.is_active));
      setPeritos(peritosData.filter(p => p.is_active));
    } catch (err: any) {
      setError('Error al cargar datos');
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  };

  const loadProgramacionesDelDia = async () => {
    if (!formData.fecha_hora) return;

    try {
      const fecha = new Date(formData.fecha_hora);
      const todasProgramaciones = await programacionService.getAll();

      // Filtrar programaciones del mismo día
      const progDelDia = todasProgramaciones.filter(p => {
        const fechaProg = new Date(p.fecha_hora);
        return fechaProg.getFullYear() === fecha.getFullYear() &&
               fechaProg.getMonth() === fecha.getMonth() &&
               fechaProg.getDate() === fecha.getDate();
      });

      setProgramacionesDelDia(progDelDia);
    } catch (err) {
      console.error('Error loading programaciones:', err);
    }
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError('');

    // Validación
    if (!formData.sala_id || formData.sala_id === 0) {
      setError('Debe seleccionar una sala');
      return;
    }
    if (!formData.perito_id || formData.perito_id === 0) {
      setError('Debe seleccionar un perito');
      return;
    }
    if (!formData.fecha_hora) {
      setError('Debe seleccionar fecha y hora');
      return;
    }

    setIsSaving(true);
    try {
      await programacionService.create(formData);
      onSuccess();
    } catch (err: any) {
      const errorDetail = err.response?.data?.detail;
      if (typeof errorDetail === 'object' && errorDetail.errors) {
        setError(errorDetail.errors.join(', '));
      } else {
        setError(errorDetail || 'Error al crear programación');
      }
    } finally {
      setIsSaving(false);
    }
  };

  if (isLoading) {
    return (
      <div className="modal-overlay" onClick={onClose}>
        <div className="modal-programacion-large" onClick={(e) => e.stopPropagation()}>
          <div className="loading">
            <div className="spinner"></div>
            <p>Cargando...</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-programacion-large" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h2>Nueva Programación</h2>
          <button onClick={onClose} className="close-btn">×</button>
        </div>

        <div className="modal-body-split">
          {/* Panel Izquierdo - Datos de la Solicitud */}
          <div className="solicitud-info-panel">
            <h3>Datos de la Solicitud</h3>

            <div className="info-card">
              <div className="info-row">
                <span className="label">Caso:</span>
                <span className="value"><strong>{solicitud.numero_caso}</strong></span>
              </div>
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
              <div className="info-row">
                <span className="label">Despacho:</span>
                <span className="value">{solicitud.despacho_fiscal.nombre}</span>
              </div>
              {solicitud.despacho_fiscal.fiscal_titular && (
                <div className="info-row">
                  <span className="label">Fiscal:</span>
                  <span className="value">{solicitud.despacho_fiscal.fiscal_titular}</span>
                </div>
              )}
              {solicitud.observaciones && (
                <div className="info-row">
                  <span className="label">Observaciones:</span>
                  <span className="value">{solicitud.observaciones}</span>
                </div>
              )}
              <div className="info-row">
                <span className="label">Solicitado:</span>
                <span className="value">{format(new Date(solicitud.fecha_solicitud), 'dd/MM/yyyy HH:mm')}</span>
              </div>
            </div>

            {/* Programaciones existentes del día seleccionado */}
            {formData.fecha_hora && programacionesDelDia.length > 0 && (
              <div className="programaciones-dia">
                <h4>⏰ Ocupaciones del día</h4>
                <div className="programaciones-list">
                  {programacionesDelDia.map(prog => {
                    const horaInicio = new Date(prog.fecha_hora);
                    const horaFin = new Date(horaInicio.getTime() + prog.duracion_minutos * 60000);
                    return (
                      <div key={prog.id} className="programacion-item">
                        <span className="tiempo">
                          {format(horaInicio, 'HH:mm')} - {format(horaFin, 'HH:mm')}
                        </span>
                        <span className="duracion">({prog.duracion_minutos} min)</span>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}
          </div>

          {/* Panel Derecho - Formulario de Programación */}
          <div className="form-panel">
            <h3>Programar Cita</h3>

            <form onSubmit={handleSubmit}>
              <div className="form-group">
                <label htmlFor="fecha_hora">Fecha y Hora *</label>
                <input
                  type="datetime-local"
                  id="fecha_hora"
                  value={formData.fecha_hora}
                  onChange={(e) => setFormData({ ...formData, fecha_hora: e.target.value })}
                  required
                />
                <small>Seleccione la fecha y hora para ver las ocupaciones del día</small>
              </div>

              <div className="form-group">
                <label htmlFor="duracion">Duración (minutos) *</label>
                <select
                  id="duracion"
                  value={formData.duracion_minutos}
                  onChange={(e) => setFormData({ ...formData, duracion_minutos: parseInt(e.target.value) })}
                  required
                >
                  <option value="30">30 minutos</option>
                  <option value="45">45 minutos</option>
                  <option value="60">1 hora</option>
                  <option value="90">1 hora 30 min</option>
                  <option value="120">2 horas</option>
                  <option value="180">3 horas</option>
                </select>
              </div>

              <div className="form-group">
                <label htmlFor="sala">Sala *</label>
                <select
                  id="sala"
                  value={formData.sala_id}
                  onChange={(e) => setFormData({ ...formData, sala_id: parseInt(e.target.value) })}
                  required
                >
                  <option value="0">Seleccione una sala</option>
                  {salas.map(sala => (
                    <option key={sala.id} value={sala.id}>
                      {sala.nombre} {sala.capacidad && `(Cap: ${sala.capacidad})`}
                    </option>
                  ))}
                </select>
                {salas.length === 0 && (
                  <small className="text-warning">No hay salas disponibles</small>
                )}
              </div>

              <div className="form-group">
                <label htmlFor="perito">Perito *</label>
                <select
                  id="perito"
                  value={formData.perito_id}
                  onChange={(e) => setFormData({ ...formData, perito_id: parseInt(e.target.value) })}
                  required
                >
                  <option value="0">Seleccione un perito</option>
                  {peritos.map(perito => (
                    <option key={perito.id} value={perito.id}>
                      {perito.nombres} {perito.apellidos} {perito.especialidad && `- ${perito.especialidad}`}
                    </option>
                  ))}
                </select>
                {peritos.length === 0 && (
                  <small className="text-warning">No hay peritos disponibles</small>
                )}
              </div>

              {error && (
                <div className="error-message">
                  {error}
                </div>
              )}

              <div className="form-actions">
                <button type="button" className="btn-secondary" onClick={onClose} disabled={isSaving}>
                  Cancelar
                </button>
                <button type="submit" className="btn-primary" disabled={isSaving}>
                  {isSaving ? 'Programando...' : 'Programar Cita'}
                </button>
              </div>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ModalProgramacion;
