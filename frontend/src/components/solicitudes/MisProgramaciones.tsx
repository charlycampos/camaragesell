/**
 * Mis Programaciones (FISCAL) - Ver el estado de mis solicitudes programadas
 */
import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Layout } from '../layout/Layout';
import { solicitudService } from '../../services/solicitud.service';
import { SolicitudEnriched, EstadoSolicitud } from '../../types';
import { format, isPast, isFuture, isToday } from 'date-fns';
import { SearchBar } from '../common/SearchBar';
import './MisProgramaciones.css';

export const MisProgramaciones = () => {
  const navigate = useNavigate();
  const [solicitudes, setSolicitudes] = useState<SolicitudEnriched[]>([]);
  const [filteredSolicitudes, setFilteredSolicitudes] = useState<SolicitudEnriched[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [filtroEstado, setFiltroEstado] = useState<'todas' | 'proximas' | 'realizadas' | 'hoy'>('todas');

  useEffect(() => {
    loadSolicitudesProgramadas();
  }, []);

  useEffect(() => {
    applyFilters();
  }, [searchTerm, filtroEstado, solicitudes]);

  const loadSolicitudesProgramadas = async () => {
    try {
      // Obtener mis solicitudes que están programadas
      const result = await solicitudService.searchAdvanced({
        estado: EstadoSolicitud.PROGRAMADA,
        page_size: 100,
        sort_by: 'created_at',
        sort_order: 'desc'
      });
      setSolicitudes(result.items);
    } catch (err: any) {
      setError(err.response?.data?.detail || 'Error al cargar programaciones');
    } finally {
      setIsLoading(false);
    }
  };

  const applyFilters = () => {
    let filtered = [...solicitudes];

    // Búsqueda
    if (searchTerm) {
      const searchLower = searchTerm.toLowerCase();
      filtered = filtered.filter(
        (s) =>
          s.numero_caso.toLowerCase().includes(searchLower) ||
          s.nombre_evaluado.toLowerCase().includes(searchLower) ||
          s.tipo_diligencia.toLowerCase().includes(searchLower)
      );
    }

    // Filtro por estado temporal
    if (filtroEstado === 'proximas') {
      filtered = filtered.filter((s) =>
        s.programaciones?.some((p) => isFuture(new Date(p.fecha_hora)))
      );
    } else if (filtroEstado === 'realizadas') {
      filtered = filtered.filter((s) =>
        s.programaciones?.some((p) => isPast(new Date(p.fecha_hora)))
      );
    } else if (filtroEstado === 'hoy') {
      filtered = filtered.filter((s) =>
        s.programaciones?.some((p) => isToday(new Date(p.fecha_hora)))
      );
    }

    setFilteredSolicitudes(filtered);
  };

  const getProximaProgramacion = (solicitud: SolicitudEnriched) => {
    if (!solicitud.programaciones || solicitud.programaciones.length === 0) return null;

    const futuras = solicitud.programaciones
      .filter((p) => isFuture(new Date(p.fecha_hora)))
      .sort((a, b) => new Date(a.fecha_hora).getTime() - new Date(b.fecha_hora).getTime());

    return futuras.length > 0 ? futuras[0] : solicitud.programaciones[0];
  };

  const getProgramacionClass = (fechaHora: string) => {
    const fecha = new Date(fechaHora);
    if (isToday(fecha)) return 'prog-hoy';
    if (isFuture(fecha)) return 'prog-proxima';
    return 'prog-pasada';
  };

  if (isLoading) {
    return (
      <Layout>
        <div className="loading">
          <div className="spinner"></div>
          <p>Cargando programaciones...</p>
        </div>
      </Layout>
    );
  }

  // Estadísticas rápidas
  const citasHoy = filteredSolicitudes.filter((s) =>
    s.programaciones?.some((p) => isToday(new Date(p.fecha_hora)))
  ).length;

  const citasProximas = filteredSolicitudes.filter((s) =>
    s.programaciones?.some((p) => isFuture(new Date(p.fecha_hora)))
  ).length;

  const citasRealizadas = filteredSolicitudes.filter((s) =>
    s.programaciones?.every((p) => isPast(new Date(p.fecha_hora)))
  ).length;

  return (
    <Layout>
      <div className="mis-programaciones">
        {/* Header */}
        <div className="header-section">
          <div className="header-content">
            <h1>Mis Solicitudes Programadas</h1>
            <p>Seguimiento de las citas programadas para mis solicitudes</p>
          </div>
          <button className="btn-primary" onClick={() => navigate('/solicitudes/nueva')}>
            + Nueva Solicitud
          </button>
        </div>

        {error && (
          <div className="error-message" style={{ marginBottom: '2rem' }}>
            {error}
          </div>
        )}

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
              <h3>{filteredSolicitudes.length}</h3>
              <p>Total Programadas</p>
            </div>
          </div>
        </div>

        {/* Filtros y búsqueda */}
        <div className="filtros-section">
          <div style={{ flex: 1 }}>
            <SearchBar
              placeholder="Buscar por número de caso, evaluado o tipo de diligencia..."
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

        {/* Lista de solicitudes programadas */}
        {filteredSolicitudes.length === 0 ? (
          <div className="empty-state">
            <div className="empty-icon">📅</div>
            <h3>No se encontraron programaciones</h3>
            <p>
              {searchTerm || filtroEstado !== 'todas'
                ? 'Intenta con otros criterios de búsqueda'
                : 'Aún no tienes solicitudes programadas'}
            </p>
            <button className="btn-primary" onClick={() => navigate('/solicitudes/nueva')}>
              + Nueva Solicitud
            </button>
          </div>
        ) : (
          <div className="solicitudes-grid">
            {filteredSolicitudes.map((solicitud) => {
              const programacion = getProximaProgramacion(solicitud);

              return (
                <div key={solicitud.id} className="solicitud-card">
                  <div className="card-header">
                    <div>
                      <h3>{solicitud.numero_caso}</h3>
                      <p className="tipo-diligencia">{solicitud.tipo_diligencia}</p>
                    </div>
                    <span className="badge badge-programada">Programada</span>
                  </div>

                  <div className="card-body">
                    <div className="info-row">
                      <span className="label">Evaluado:</span>
                      <span className="value">{solicitud.nombre_evaluado}</span>
                    </div>
                    <div className="info-row">
                      <span className="label">Edad:</span>
                      <span className="value">{solicitud.edad_evaluado} años</span>
                    </div>
                    <div className="info-row">
                      <span className="label">Despacho:</span>
                      <span className="value">{solicitud.despacho_fiscal.nombre}</span>
                    </div>

                    {programacion && (
                      <div className={`programacion-info ${getProgramacionClass(programacion.fecha_hora)}`}>
                        <div className="prog-header">
                          <span className="prog-icon">
                            {isToday(new Date(programacion.fecha_hora)) ? '📅' : '⏰'}
                          </span>
                          <span className="prog-label">
                            {isToday(new Date(programacion.fecha_hora))
                              ? 'Cita HOY'
                              : isFuture(new Date(programacion.fecha_hora))
                              ? 'Próxima Cita'
                              : 'Última Cita'}
                          </span>
                        </div>
                        <div className="prog-detalles">
                          <div className="prog-fecha">
                            <strong>{format(new Date(programacion.fecha_hora), 'dd/MM/yyyy')}</strong>
                            <span>{format(new Date(programacion.fecha_hora), 'HH:mm')} h</span>
                          </div>
                          <div className="prog-duracion">
                            {programacion.duracion_minutos} min
                          </div>
                        </div>
                        {programacion.notas && (
                          <div className="prog-notas">
                            <span className="nota-icon">📝</span>
                            <span>{programacion.notas}</span>
                          </div>
                        )}
                      </div>
                    )}
                  </div>

                  <div className="card-footer">
                    <button
                      className="btn-secondary btn-small"
                      onClick={() => navigate(`/solicitudes/${solicitud.id}`)}
                    >
                      Ver Detalle
                    </button>
                    {programacion && (
                      <button
                        className="btn-primary btn-small"
                        onClick={() => navigate(`/programacion/${programacion.id}`)}
                      >
                        Ver Programación
                      </button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </Layout>
  );
};

export default MisProgramaciones;
