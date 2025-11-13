/**
 * Bandeja de Solicitudes Pendientes (Asistente Administrativo) - CON BÚSQUEDA Y FILTROS
 */
import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Layout } from '../layout/Layout';
import { solicitudService } from '../../services/solicitud.service';
import { SolicitudEnriched, EstadoSolicitud } from '../../types';
import { format } from 'date-fns';
import SearchBar from '../common/SearchBar';
import FilterPanel, { Filter } from '../common/FilterPanel';
import './SolicitudesPendientes.css';

export const SolicitudesPendientes = () => {
  const navigate = useNavigate();
  const [solicitudes, setSolicitudes] = useState<SolicitudEnriched[]>([]);
  const [filteredSolicitudes, setFilteredSolicitudes] = useState<SolicitudEnriched[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');
  const [selectedSolicitud, setSelectedSolicitud] = useState<SolicitudEnriched | null>(null);

  // Estados de búsqueda y filtros
  const [searchTerm, setSearchTerm] = useState('');
  const [filters, setFilters] = useState<Record<string, any>>({});

  // Definir filtros disponibles
  const availableFilters: Filter[] = [
    {
      name: 'tipo_diligencia',
      label: 'Tipo de Diligencia',
      type: 'text',
      placeholder: 'Ej: Entrevista única'
    },
    {
      name: 'fecha_desde',
      label: 'Solicitado Desde',
      type: 'date'
    },
    {
      name: 'fecha_hasta',
      label: 'Solicitado Hasta',
      type: 'date'
    }
  ];

  useEffect(() => {
    loadSolicitudes();
  }, []);

  useEffect(() => {
    applyFiltersAndSearch();
  }, [searchTerm, filters, solicitudes]);

  const loadSolicitudes = async () => {
    try {
      // Usar endpoint de búsqueda avanzada con filtro por estado pendiente
      const result = await solicitudService.searchAdvanced({
        estado: EstadoSolicitud.PENDIENTE,
        page_size: 100, // Cargar todas las pendientes
        sort_by: 'fecha_solicitud',
        sort_order: 'asc' // Más antiguas primero (FIFO)
      });
      setSolicitudes(result.items);
    } catch (err: any) {
      setError(err.response?.data?.detail || 'Error al cargar solicitudes');
    } finally {
      setIsLoading(false);
    }
  };

  const applyFiltersAndSearch = () => {
    let filtered = [...solicitudes];

    // Aplicar búsqueda
    if (searchTerm) {
      const searchLower = searchTerm.toLowerCase();
      filtered = filtered.filter(
        (s) =>
          s.numero_caso.toLowerCase().includes(searchLower) ||
          s.nombre_evaluado.toLowerCase().includes(searchLower) ||
          s.despacho_fiscal.nombre.toLowerCase().includes(searchLower)
      );
    }

    // Aplicar filtros adicionales
    if (filters.tipo_diligencia) {
      filtered = filtered.filter((s) =>
        s.tipo_diligencia.toLowerCase().includes(filters.tipo_diligencia.toLowerCase())
      );
    }

    if (filters.fecha_desde) {
      const fechaDesde = new Date(filters.fecha_desde);
      filtered = filtered.filter((s) => new Date(s.fecha_solicitud) >= fechaDesde);
    }

    if (filters.fecha_hasta) {
      const fechaHasta = new Date(filters.fecha_hasta);
      fechaHasta.setHours(23, 59, 59, 999); // Incluir todo el día
      filtered = filtered.filter((s) => new Date(s.fecha_solicitud) <= fechaHasta);
    }

    setFilteredSolicitudes(filtered);
  };

  const handleProgramar = (solicitud: SolicitudEnriched) => {
    // Navegar al calendario con la solicitud seleccionada
    navigate('/programacion/calendario', { state: { solicitud } });
  };

  const handleSearch = (search: string) => {
    setSearchTerm(search);
  };

  const handleApplyFilters = (newFilters: Record<string, any>) => {
    setFilters(newFilters);
  };

  const handleClearFilters = () => {
    setFilters({});
  };

  if (isLoading) {
    return (
      <Layout>
        <div className="loading">
          <div className="spinner"></div>
          <p>Cargando solicitudes pendientes...</p>
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
            <p>Gestiona las solicitudes pendientes de programación con búsqueda y filtros</p>
          </div>
          <div className="stats">
            <div className="stat-card">
              <span className="stat-number">{filteredSolicitudes.length}</span>
              <span className="stat-label">
                {searchTerm || Object.keys(filters).length > 0 ? 'Filtradas' : 'Pendientes'}
              </span>
            </div>
          </div>
        </div>

        {error && <div className="error-message">{error}</div>}

        {/* Barra de búsqueda */}
        <SearchBar
          placeholder="Buscar por caso, evaluado o despacho fiscal..."
          onSearch={handleSearch}
          initialValue={searchTerm}
        />

        {/* Panel de filtros */}
        <FilterPanel
          filters={availableFilters}
          onApplyFilters={handleApplyFilters}
          onClearFilters={handleClearFilters}
        />

        {filteredSolicitudes.length === 0 ? (
          <div className="empty-state">
            <h3>
              {searchTerm || Object.keys(filters).length > 0
                ? 'No se encontraron solicitudes con los filtros aplicados'
                : 'No hay solicitudes pendientes'}
            </h3>
            <p>
              {searchTerm || Object.keys(filters).length > 0
                ? 'Intenta ajustar los filtros de búsqueda'
                : 'Todas las solicitudes han sido procesadas'}
            </p>
          </div>
        ) : (
          <>
            {/* Contador de resultados */}
            {(searchTerm || Object.keys(filters).length > 0) && (
              <div className="results-info">
                Mostrando {filteredSolicitudes.length} de {solicitudes.length} solicitudes
              </div>
            )}

            <div className="solicitudes-grid">
              {filteredSolicitudes.map((solicitud) => (
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
                    <div className="info-row">
                      <span className="label">Despacho:</span>
                      <span className="value text-small">{solicitud.despacho_fiscal.nombre}</span>
                    </div>
                    {solicitud.despacho_fiscal.distrito && (
                      <div className="info-row">
                        <span className="label">Distrito:</span>
                        <span className="value">{solicitud.despacho_fiscal.distrito}</span>
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
          </>
        )}
      </div>
    </Layout>
  );
};

export default SolicitudesPendientes;
