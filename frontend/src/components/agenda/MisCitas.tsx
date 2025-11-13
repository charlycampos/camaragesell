/**
 * Vista de Mis Citas (Perito) - Mejorada con filtros y búsqueda
 */
import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Layout } from '../layout/Layout';
import { programacionService } from '../../services/programacion.service';
import { Programacion, EstadoProgramacion, DocumentoCreate } from '../../types';
import { format, isPast, isFuture, isToday } from 'date-fns';
import { SearchBar } from '../common/SearchBar';
import './MisCitas.css';

export const MisCitas = () => {
  const navigate = useNavigate();
  const [citas, setCitas] = useState<Programacion[]>([]);
  const [filteredCitas, setFilteredCitas] = useState<Programacion[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [selectedCita, setSelectedCita] = useState<Programacion | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [filtroEstado, setFiltroEstado] = useState<'todas' | 'hoy' | 'proximas' | 'realizadas'>('todas');
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

  useEffect(() => {
    applyFilters();
  }, [searchTerm, filtroEstado, citas]);

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

  const applyFilters = () => {
    let filtered = [...citas];

    // Búsqueda
    if (searchTerm) {
      const searchLower = searchTerm.toLowerCase();
      filtered = filtered.filter(
        (c) =>
          c.solicitud?.numero_caso?.toLowerCase().includes(searchLower) ||
          c.solicitud?.nombre_evaluado?.toLowerCase().includes(searchLower) ||
          c.solicitud?.tipo_diligencia?.toLowerCase().includes(searchLower) ||
          c.sala?.nombre?.toLowerCase().includes(searchLower)
      );
    }

    // Filtro por estado temporal
    if (filtroEstado === 'hoy') {
      filtered = filtered.filter((c) => isToday(new Date(c.fecha_hora)));
    } else if (filtroEstado === 'proximas') {
      filtered = filtered.filter((c) => isFuture(new Date(c.fecha_hora)) && !isToday(new Date(c.fecha_hora)));
    } else if (filtroEstado === 'realizadas') {
      filtered = filtered.filter((c) => isPast(new Date(c.fecha_hora)) && !isToday(new Date(c.fecha_hora)));
    }

    setFilteredCitas(filtered);
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

  if (isLoading) {
    return (
      <Layout>
        <div className="loading">
          <div className="spinner"></div>
          <p>Cargando citas...</p>
        </div>
      </Layout>
    );
  }

  // Estadísticas
  const citasHoy = citas.filter((c) => isToday(new Date(c.fecha_hora))).length;
  const citasProximas = citas.filter((c) => isFuture(new Date(c.fecha_hora)) && !isToday(new Date(c.fecha_hora))).length;
  const citasRealizadas = citas.filter((c) => c.estado === EstadoProgramacion.REALIZADA).length;

  return (
    <Layout>
      <div className="mis-citas">
        {/* Header */}
        <div className="header-section">
          <div className="header-content">
            <h1>Mis Citas Programadas</h1>
            <p>Gestiona y realiza seguimiento de tus citas asignadas</p>
          </div>
        </div>

        {success && <div className="success-message">{success}</div>}
        {error && <div className="error-message">{error}</div>}

        {/* Estadísticas */}
        <div className="stats-grid">
          <div className="stat-card stat-today">
            <div className="stat-icon">📅</div>
            <div className="stat-content">
              <h3>{citasHoy}</h3>
              <p>Citas Hoy</p>
            </div>
          </div>
          <div className="stat-card stat-upcoming">
            <div className="stat-icon">⏰</div>
            <div className="stat-content">
              <h3>{citasProximas}</h3>
              <p>Próximas Citas</p>
            </div>
          </div>
          <div className="stat-card stat-completed">
            <div className="stat-icon">✅</div>
            <div className="stat-content">
              <h3>{citasRealizadas}</h3>
              <p>Realizadas</p>
            </div>
          </div>
          <div className="stat-card stat-total">
            <div className="stat-icon">📊</div>
            <div className="stat-content">
              <h3>{citas.length}</h3>
              <p>Total Asignadas</p>
            </div>
          </div>
        </div>

        {/* Filtros y búsqueda */}
        <div className="filtros-section">
          <div style={{ flex: 1 }}>
            <SearchBar
              placeholder="Buscar por número de caso, evaluado, diligencia o sala..."
              onSearch={setSearchTerm}
              initialValue={searchTerm}
            />
          </div>
          <div className="filtro-botones">
            <button
              className={`btn-filtro ${filtroEstado === 'todas' ? 'active' : ''}`}
              onClick={() => setFiltroEstado('todas')}
            >
              Todas
            </button>
            <button
              className={`btn-filtro ${filtroEstado === 'hoy' ? 'active' : ''}`}
              onClick={() => setFiltroEstado('hoy')}
            >
              Hoy
            </button>
            <button
              className={`btn-filtro ${filtroEstado === 'proximas' ? 'active' : ''}`}
              onClick={() => setFiltroEstado('proximas')}
            >
              Próximas
            </button>
            <button
              className={`btn-filtro ${filtroEstado === 'realizadas' ? 'active' : ''}`}
              onClick={() => setFiltroEstado('realizadas')}
            >
              Realizadas
            </button>
          </div>
        </div>

        {/* Lista de citas */}
        {filteredCitas.length === 0 ? (
          <div className="empty-state">
            <div className="empty-icon">📅</div>
            <h3>No se encontraron citas</h3>
            <p>
              {searchTerm || filtroEstado !== 'todas'
                ? 'Intenta con otros criterios de búsqueda'
                : 'Aún no tienes citas asignadas'}
            </p>
          </div>
        ) : (
          <div className="citas-grid">
            {filteredCitas.map((cita) => {
              const citaDate = new Date(cita.fecha_hora);
              const isHoy = isToday(citaDate);

              return (
                <div key={cita.id} className={`cita-card ${isHoy ? 'cita-hoy' : ''}`}>
                  <div className="card-header">
                    <div>
                      <h3>{cita.solicitud?.numero_caso || 'Sin caso'}</h3>
                      <p className="tipo-diligencia">{cita.solicitud?.tipo_diligencia || 'N/A'}</p>
                    </div>
                    <span className={`badge ${getEstadoClass(cita.estado)}`}>
                      {cita.estado}
                    </span>
                  </div>

                  <div className="card-body">
                    <div className="info-row">
                      <span className="label">Evaluado:</span>
                      <span className="value">{cita.solicitud?.nombre_evaluado || 'N/A'}</span>
                    </div>
                    <div className="info-row">
                      <span className="label">Edad:</span>
                      <span className="value">{cita.solicitud?.edad_evaluado || 'N/A'} años</span>
                    </div>
                    <div className="info-row">
                      <span className="label">Sala:</span>
                      <span className="value">{cita.sala?.nombre || 'N/A'}</span>
                    </div>

                    {/* Información de la cita */}
                    <div className={`cita-info ${isHoy ? 'cita-hoy-info' : ''}`}>
                      <div className="cita-info-header">
                        <span className="cita-info-icon">
                          {isHoy ? '📅' : '⏰'}
                        </span>
                        <span className="cita-info-label">
                          {isHoy ? 'CITA HOY' : 'FECHA Y HORA'}
                        </span>
                      </div>
                      <div className="cita-info-detalles">
                        <div className="cita-fecha-hora">
                          <strong>{format(citaDate, 'dd/MM/yyyy')}</strong>
                          <span>{format(citaDate, 'HH:mm')} h</span>
                        </div>
                        <div className="cita-duracion">
                          {cita.duracion_minutos} min
                        </div>
                      </div>
                      {cita.notas && (
                        <div className="cita-notas">
                          <span className="nota-icon">📝</span>
                          <span>{cita.notas}</span>
                        </div>
                      )}
                    </div>
                  </div>

                  <div className="card-footer">
                    <button
                      className="btn-secondary btn-small"
                      onClick={() => navigate(`/programacion/${cita.id}`)}
                    >
                      Ver Detalle
                    </button>
                    {cita.estado === EstadoProgramacion.PROGRAMADA && isPast(citaDate) && (
                      <button
                        className="btn-primary btn-small"
                        onClick={() => handleRegistrarDictamen(cita)}
                      >
                        Registrar Dictamen
                      </button>
                    )}
                    {cita.estado === EstadoProgramacion.PROGRAMADA && isFuture(citaDate) && (
                      <button
                        className="btn-warning btn-small"
                        onClick={() => handleCambiarEstado(cita.id, EstadoProgramacion.REPROGRAMADA)}
                      >
                        Reprogramar
                      </button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}

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
