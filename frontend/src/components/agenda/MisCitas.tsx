/**
 * Vista de Mis Citas (Perito)
 */
import { useState, useEffect } from 'react';
import { Layout } from '../layout/Layout';
import { programacionService } from '../../services/programacion.service';
import { Programacion, EstadoProgramacion, DocumentoCreate } from '../../types';
import { format, isPast, isFuture } from 'date-fns';
import './MisCitas.css';

export const MisCitas = () => {
  const [citas, setCitas] = useState<Programacion[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [selectedCita, setSelectedCita] = useState<Programacion | null>(null);
  const [formData, setFormData] = useState<DocumentoCreate>({
    numero_dictamen: '',
    tipo_documento: 'Dictamen',
    observaciones: '',
    programacion_id: 0,
  });
  const [success, setSuccess] = useState('');

  useEffect(() => {
    loadCitas();
  }, []);

  const loadCitas = async () => {
    try {
      const data = await programacionService.getMisCitas();
      setCitas(data.sort((a, b) =>
        new Date(a.fecha_hora).getTime() - new Date(b.fecha_hora).getTime()
      ));
    } catch (err: any) {
      setError(err.response?.data?.detail || 'Error al cargar citas');
    } finally {
      setIsLoading(false);
    }
  };

  const handleCambiarEstado = async (citaId: number, nuevoEstado: EstadoProgramacion) => {
    try {
      await programacionService.update(citaId, { estado: nuevoEstado });
      await loadCitas();
      setSuccess(`Estado actualizado a ${nuevoEstado}`);
      setTimeout(() => setSuccess(''), 3000);
    } catch (err: any) {
      setError(err.response?.data?.detail || 'Error al actualizar estado');
    }
  };

  const handleRegistrarDictamen = (cita: Programacion) => {
    setSelectedCita(cita);
    setFormData({
      ...formData,
      programacion_id: cita.id,
    });
    setShowModal(true);
  };

  const handleSubmitDictamen = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedCita) return;

    try {
      await programacionService.registrarDocumento(selectedCita.id, formData);
      await programacionService.update(selectedCita.id, { estado: EstadoProgramacion.REALIZADA });
      setShowModal(false);
      await loadCitas();
      setSuccess('Dictamen registrado exitosamente');
      setTimeout(() => setSuccess(''), 3000);
    } catch (err: any) {
      setError(err.response?.data?.detail || 'Error al registrar dictamen');
    }
  };

  const getEstadoClass = (estado: EstadoProgramacion) => {
    switch (estado) {
      case EstadoProgramacion.PROGRAMADA:
        return 'estado-programada';
      case EstadoProgramacion.REALIZADA:
        return 'estado-realizada';
      case EstadoProgramacion.REPROGRAMADA:
        return 'estado-reprogramada';
      case EstadoProgramacion.CANCELADA:
        return 'estado-cancelada';
      case EstadoProgramacion.NO_ASISTIO:
        return 'estado-no-asistio';
      default:
        return '';
    }
  };

  const getCitasFuturas = () => citas.filter(c => isFuture(new Date(c.fecha_hora)));
  const getCitasPasadas = () => citas.filter(c => isPast(new Date(c.fecha_hora)));

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
      <div className="mis-citas">
        <div className="header-section">
          <div>
            <h1>Mis Citas</h1>
            <p>Gestiona tus citas programadas</p>
          </div>
          <div className="stats">
            <div className="stat-card">
              <span className="stat-number">{getCitasFuturas().length}</span>
              <span className="stat-label">Próximas</span>
            </div>
          </div>
        </div>

        {success && <div className="success-message">{success}</div>}
        {error && <div className="error-message">{error}</div>}

        {/* Citas Próximas */}
        <div className="citas-section">
          <h2>Próximas Citas</h2>
          {getCitasFuturas().length === 0 ? (
            <div className="empty-state">
              <p>No tienes citas próximas</p>
            </div>
          ) : (
            <div className="citas-grid">
              {getCitasFuturas().map((cita) => (
                <div key={cita.id} className="cita-card">
                  <div className="cita-header">
                    <div className="cita-fecha">
                      <span className="dia">{format(new Date(cita.fecha_hora), 'dd')}</span>
                      <span className="mes">{format(new Date(cita.fecha_hora), 'MMM')}</span>
                    </div>
                    <div className="cita-hora">
                      {format(new Date(cita.fecha_hora), 'HH:mm')}
                    </div>
                  </div>

                  <div className="cita-body">
                    <div className="info-row">
                      <span className="label">Duración:</span>
                      <span className="value">{cita.duracion_minutos} min</span>
                    </div>
                    <div className="info-row">
                      <span className="label">Estado:</span>
                      <span className={`estado-badge ${getEstadoClass(cita.estado)}`}>
                        {cita.estado}
                      </span>
                    </div>
                    {cita.notas && (
                      <div className="info-row">
                        <span className="label">Notas:</span>
                        <span className="value">{cita.notas}</span>
                      </div>
                    )}
                  </div>

                  <div className="cita-actions">
                    <select
                      value={cita.estado}
                      onChange={(e) => handleCambiarEstado(cita.id, e.target.value as EstadoProgramacion)}
                      className="estado-select"
                    >
                      <option value={EstadoProgramacion.PROGRAMADA}>Programada</option>
                      <option value={EstadoProgramacion.REALIZADA}>Realizada</option>
                      <option value={EstadoProgramacion.REPROGRAMADA}>Reprogramada</option>
                      <option value={EstadoProgramacion.NO_ASISTIO}>No Asistió</option>
                    </select>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Citas Pasadas */}
        <div className="citas-section">
          <h2>Citas Realizadas</h2>
          {getCitasPasadas().length === 0 ? (
            <div className="empty-state">
              <p>No tienes citas pasadas</p>
            </div>
          ) : (
            <div className="table-container">
              <table>
                <thead>
                  <tr>
                    <th>Fecha</th>
                    <th>Hora</th>
                    <th>Duración</th>
                    <th>Estado</th>
                    <th>Acciones</th>
                  </tr>
                </thead>
                <tbody>
                  {getCitasPasadas().map((cita) => (
                    <tr key={cita.id}>
                      <td>{format(new Date(cita.fecha_hora), 'dd/MM/yyyy')}</td>
                      <td>{format(new Date(cita.fecha_hora), 'HH:mm')}</td>
                      <td>{cita.duracion_minutos} min</td>
                      <td>
                        <span className={`estado-badge ${getEstadoClass(cita.estado)}`}>
                          {cita.estado}
                        </span>
                      </td>
                      <td>
                        {cita.estado === EstadoProgramacion.PROGRAMADA && (
                          <button
                            className="btn-primary btn-small"
                            onClick={() => handleRegistrarDictamen(cita)}
                          >
                            Registrar Dictamen
                          </button>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* Modal para registrar dictamen */}
        {showModal && (
          <div className="modal-overlay" onClick={() => setShowModal(false)}>
            <div className="modal-content" onClick={(e) => e.stopPropagation()}>
              <div className="modal-header">
                <h3>Registrar Dictamen</h3>
                <button onClick={() => setShowModal(false)} className="close-btn">×</button>
              </div>

              <form onSubmit={handleSubmitDictamen}>
                <div className="form-group">
                  <label>Número de Dictamen *</label>
                  <input
                    type="text"
                    value={formData.numero_dictamen}
                    onChange={(e) => setFormData({ ...formData, numero_dictamen: e.target.value })}
                    required
                    placeholder="Ej: DICT-2025-001"
                  />
                </div>

                <div className="form-group">
                  <label>Tipo de Documento *</label>
                  <select
                    value={formData.tipo_documento}
                    onChange={(e) => setFormData({ ...formData, tipo_documento: e.target.value })}
                    required
                  >
                    <option value="Dictamen">Dictamen</option>
                    <option value="Acta">Acta</option>
                    <option value="Informe">Informe</option>
                  </select>
                </div>

                <div className="form-group">
                  <label>Observaciones</label>
                  <textarea
                    value={formData.observaciones}
                    onChange={(e) => setFormData({ ...formData, observaciones: e.target.value })}
                    rows={4}
                    placeholder="Observaciones adicionales..."
                  />
                </div>

                <div className="modal-actions">
                  <button type="button" className="btn-secondary" onClick={() => setShowModal(false)}>
                    Cancelar
                  </button>
                  <button type="submit" className="btn-primary">
                    Registrar
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}
      </div>
    </Layout>
  );
};

export default MisCitas;
