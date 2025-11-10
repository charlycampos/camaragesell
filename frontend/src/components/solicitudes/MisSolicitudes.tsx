/**
 * Vista de Mis Solicitudes (Fiscal) - CON BÚSQUEDA Y FILTROS AVANZADOS
 * Muestra datos completos con búsqueda, filtros múltiples y paginación
 */
import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Layout } from '../layout/Layout';
import { solicitudService } from '../../services/solicitud.service';
import { SolicitudEnriched, EstadoSolicitud } from '../../types';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import StatusBadge from '../common/StatusBadge';
import InfoChip from '../common/InfoChip';
import SearchBar from '../common/SearchBar';
import FilterPanel, { Filter } from '../common/FilterPanel';
import Pagination from '../common/Pagination';
import './MisSolicitudes.css';

export const MisSolicitudes = () => {
  const navigate = useNavigate();
  const [solicitudes, setSolicitudes] = useState<SolicitudEnriched[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');

  // Estados de búsqueda y filtros
  const [searchTerm, setSearchTerm] = useState('');
  const [filters, setFilters] = useState<Record<string, any>>({});
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [totalItems, setTotalItems] = useState(0);
  const [totalPages, setTotalPages] = useState(1);

  // Definir filtros disponibles
  const availableFilters: Filter[] = [
    {
      name: 'estado',
      label: 'Estado',
      type: 'select',
      options: [
        { label: 'Pendiente', value: EstadoSolicitud.PENDIENTE },
        { label: 'Aprobada', value: EstadoSolicitud.APROBADA },
        { label: 'Rechazada', value: EstadoSolicitud.RECHAZADA },
        { label: 'Cancelada', value: EstadoSolicitud.CANCELADA }
      ]
    },
    {
      name: 'tipo_diligencia',
      label: 'Tipo de Diligencia',
      type: 'text',
      placeholder: 'Ej: Entrevista única'
    },
    {
      name: 'fecha_desde',
      label: 'Fecha Desde',
      type: 'date'
    },
    {
      name: 'fecha_hasta',
      label: 'Fecha Hasta',
      type: 'date'
    }
  ];

  useEffect(() => {
    loadSolicitudes();
  }, [searchTerm, filters, currentPage, pageSize]);

  const loadSolicitudes = async () => {
    setIsLoading(true);
    try {
      const result = await solicitudService.searchAdvanced({
        page: currentPage,
        page_size: pageSize,
        search: searchTerm || undefined,
        ...filters,
        sort_by: 'fecha_solicitud',
        sort_order: 'desc'
      });

      setSolicitudes(result.items);
      setTotalItems(result.total);
      setTotalPages(result.total_pages);
    } catch (err: any) {
      setError(err.response?.data?.detail || 'Error al cargar solicitudes');
    } finally {
      setIsLoading(false);
    }
  };

  const handleSearch = (search: string) => {
    setSearchTerm(search);
    setCurrentPage(1); // Reset a página 1 al buscar
  };

  const handleApplyFilters = (newFilters: Record<string, any>) => {
    setFilters(newFilters);
    setCurrentPage(1); // Reset a página 1 al filtrar
  };

  const handleClearFilters = () => {
    setFilters({});
    setCurrentPage(1);
  };

  const handlePageChange = (page: number) => {
    setCurrentPage(page);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handlePageSizeChange = (newPageSize: number) => {
    setPageSize(newPageSize);
    setCurrentPage(1);
  };

  if (isLoading && solicitudes.length === 0) {
    return (
      <Layout>
        <div className="loading">
          <div className="spinner"></div>
          <p>Cargando solicitudes...</p>
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
            <p>Busca y filtra todas tus solicitudes con información detallada</p>
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

        {/* Barra de búsqueda */}
        <SearchBar
          placeholder="Buscar por número de caso o nombre del evaluado..."
          onSearch={handleSearch}
          initialValue={searchTerm}
        />

        {/* Panel de filtros */}
        <FilterPanel
          filters={availableFilters}
          onApplyFilters={handleApplyFilters}
          onClearFilters={handleClearFilters}
        />

        {/* Indicador de loading durante filtrado */}
        {isLoading && solicitudes.length > 0 && (
          <div className="loading-overlay">
            <div className="spinner-small"></div>
          </div>
        )}

        {solicitudes.length === 0 && !isLoading ? (
          <div className="empty-state-modern">
            <div className="empty-icon">📄</div>
            <h3>No se encontraron solicitudes</h3>
            <p>
              {searchTerm || Object.keys(filters).length > 0
                ? 'Intenta ajustar tus filtros de búsqueda'
                : 'Crea tu primera solicitud de cita para Cámara Gesell'}
            </p>
            {!searchTerm && Object.keys(filters).length === 0 && (
              <button
                className="btn-crear-primera"
                onClick={() => navigate('/solicitudes/nueva')}
              >
                ✨ Crear Primera Solicitud
              </button>
            )}
          </div>
        ) : (
          <>
            {/* Contador de resultados */}
            <div className="results-counter">
              {totalItems} solicitud{totalItems !== 1 ? 'es' : ''} encontrada{totalItems !== 1 ? 's' : ''}
            </div>

            {/* Grid de solicitudes */}
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

            {/* Paginación */}
            <Pagination
              currentPage={currentPage}
              totalPages={totalPages}
              totalItems={totalItems}
              pageSize={pageSize}
              onPageChange={handlePageChange}
              onPageSizeChange={handlePageSizeChange}
            />
          </>
        )}
      </div>
    </Layout>
  );
};

export default MisSolicitudes;
