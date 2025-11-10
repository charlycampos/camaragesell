/**
 * CRUD de Salas - Tabla con Búsqueda y Paginación 🏢
 */
import { useState, useEffect } from 'react';
import { Layout } from '../layout/Layout';
import { salaService, sedeService } from '../../services/mantenimiento.service';
import { Sala, Sede } from '../../types';
import { SearchBar } from '../common/SearchBar';
import { Pagination } from '../common/Pagination';
import './MantenimientoModerno.css';

export const SalasMantenimiento = () => {
  const [salas, setSalas] = useState<Sala[]>([]);
  const [sedes, setSedes] = useState<Sede[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editingSala, setEditingSala] = useState<Sala | null>(null);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  // Estados de búsqueda y paginación
  const [searchTerm, setSearchTerm] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [totalItems, setTotalItems] = useState(0);
  const [totalPages, setTotalPages] = useState(1);
  const [selectedSedeId, setSelectedSedeId] = useState<string>('');

  const [formData, setFormData] = useState({
    nombre: '',
    capacidad: undefined as number | undefined,
    equipamiento: '',
    is_active: true,
    sede_id: 0,
  });

  useEffect(() => {
    loadData();
  }, []);

  useEffect(() => {
    loadSalas();
  }, [searchTerm, currentPage, pageSize, selectedSedeId]);

  const loadData = async () => {
    try {
      const sedesData = await sedeService.getAll();
      setSedes(sedesData.filter(s => s.is_active));
    } catch (err: any) {
      setError('Error al cargar datos');
    }
  };

  const loadSalas = async () => {
    setIsLoading(true);
    try {
      const result = await salaService.searchAdvanced({
        page: currentPage,
        page_size: pageSize,
        search: searchTerm || undefined,
        sede_id: selectedSedeId ? parseInt(selectedSedeId) : undefined,
        sort_by: 'nombre',
        sort_order: 'asc'
      });

      setSalas(result.items);
      setTotalItems(result.total);
      setTotalPages(result.total_pages);
    } catch (err: any) {
      setError('Error al cargar salas');
    } finally {
      setIsLoading(false);
    }
  };

  const handleSearch = (search: string) => {
    setSearchTerm(search);
    setCurrentPage(1);
  };

  const handleSedeFilter = (sedeId: string) => {
    setSelectedSedeId(sedeId);
    setCurrentPage(1);
  };

  const handlePageChange = (page: number) => {
    setCurrentPage(page);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleOpenModal = (sala?: Sala) => {
    if (sala) {
      setEditingSala(sala);
      setFormData({
        nombre: sala.nombre,
        capacidad: sala.capacidad,
        equipamiento: sala.equipamiento || '',
        is_active: sala.is_active,
        sede_id: sala.sede_id,
      });
    } else {
      setEditingSala(null);
      setFormData({
        nombre: '',
        capacidad: undefined,
        equipamiento: '',
        is_active: true,
        sede_id: sedes[0]?.id || 0,
      });
    }
    setShowModal(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    try {
      if (editingSala) {
        await salaService.update(editingSala.id, formData);
        setSuccess('✅ Sala actualizada exitosamente');
      } else {
        await salaService.create(formData);
        setSuccess('✅ Sala creada exitosamente');
      }
      setShowModal(false);
      await loadSalas();
      setTimeout(() => setSuccess(''), 3000);
    } catch (err: any) {
      setError(err.response?.data?.detail || 'Error al guardar sala');
    }
  };

  const handleDelete = async (id: number) => {
    if (!confirm('⚠️ ¿Estás seguro de eliminar esta sala?')) return;

    try {
      await salaService.delete(id);
      setSuccess('✅ Sala eliminada exitosamente');
      await loadSalas();
      setTimeout(() => setSuccess(''), 3000);
    } catch (err: any) {
      setError(err.response?.data?.detail || 'Error al eliminar sala');
    }
  };

  const getSedeName = (sedeId: number) => {
    return sedes.find(s => s.id === sedeId)?.nombre || 'N/A';
  };

  if (isLoading && salas.length === 0) {
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
      <div className="mantenimiento-moderno">
        {/* Header */}
        <div className="header-moderno">
          <div className="header-content">
            <h1>🏢 Gestión de Salas</h1>
            <p>Administra las Cámaras Gesell y salas de evaluación</p>
          </div>
          <button className="btn-agregar" onClick={() => handleOpenModal()}>
            ➕ Nueva Sala
          </button>
        </div>

        {success && (
          <div className="success-message" style={{marginBottom: '2rem'}}>
            {success}
          </div>
        )}
        {error && !showModal && (
          <div className="error-message" style={{marginBottom: '2rem'}}>
            {error}
          </div>
        )}

        {/* Búsqueda y Filtros */}
        <div style={{ marginBottom: '1.5rem', display: 'flex', gap: '1rem', flexWrap: 'wrap', alignItems: 'center' }}>
          <div style={{ flex: '1 1 300px' }}>
            <SearchBar
              placeholder="Buscar por nombre o equipamiento..."
              onSearch={handleSearch}
              initialValue={searchTerm}
            />
          </div>
          <select
            value={selectedSedeId}
            onChange={(e) => handleSedeFilter(e.target.value)}
            style={{
              padding: '0.75rem 1rem',
              border: '2px solid #e5e7eb',
              borderRadius: '12px',
              fontSize: '0.9375rem',
              backgroundColor: 'white',
              cursor: 'pointer',
              minWidth: '200px'
            }}
          >
            <option value="">Todas las sedes</option>
            {sedes.map(sede => (
              <option key={sede.id} value={sede.id}>
                {sede.nombre}
              </option>
            ))}
          </select>
        </div>

        {/* Contador de resultados */}
        {!isLoading && (
          <div className="results-counter">
            Mostrando {salas.length} de {totalItems} salas
          </div>
        )}

        {/* Tabla */}
        {salas.length === 0 ? (
          <div className="empty-state-moderna">
            <div className="empty-icon">🏢</div>
            <h3>No se encontraron salas</h3>
            <p>{searchTerm || selectedSedeId ? 'Intenta con otros criterios de búsqueda' : 'Comienza agregando tu primera sala'}</p>
            <button className="btn-agregar" onClick={() => handleOpenModal()}>
              ➕ Crear Sala
            </button>
          </div>
        ) : (
          <>
            <div className="table-container">
              <table className="data-table">
                <thead>
                  <tr>
                    <th>Nombre</th>
                    <th>Sede</th>
                    <th>Capacidad</th>
                    <th>Equipamiento</th>
                    <th>Estado</th>
                    <th>Acciones</th>
                  </tr>
                </thead>
                <tbody>
                  {salas.map((sala) => (
                    <tr key={sala.id}>
                      <td><strong>{sala.nombre}</strong></td>
                      <td>{getSedeName(sala.sede_id)}</td>
                      <td>
                        {sala.capacidad ? (
                          `${sala.capacidad} personas`
                        ) : (
                          <span style={{ color: '#9ca3af' }}>No especificada</span>
                        )}
                      </td>
                      <td style={{ fontSize: '0.875rem', color: '#6b7280', maxWidth: '200px' }}>
                        {sala.equipamiento ? (
                          <span title={sala.equipamiento}>
                            {sala.equipamiento.length > 50
                              ? `${sala.equipamiento.substring(0, 50)}...`
                              : sala.equipamiento}
                          </span>
                        ) : (
                          <span style={{ color: '#9ca3af' }}>-</span>
                        )}
                      </td>
                      <td>
                        <span className={`badge-status ${sala.is_active ? 'activo' : 'inactivo'}`}>
                          {sala.is_active ? '✓ Activa' : '✕ Inactiva'}
                        </span>
                      </td>
                      <td>
                        <div style={{ display: 'flex', gap: '0.5rem' }}>
                          <button
                            className="btn-icon edit"
                            onClick={() => handleOpenModal(sala)}
                            title="Editar"
                          >
                            ✏️
                          </button>
                          <button
                            className="btn-icon delete"
                            onClick={() => handleDelete(sala.id)}
                            title="Eliminar"
                          >
                            🗑️
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Paginación */}
            <Pagination
              currentPage={currentPage}
              totalPages={totalPages}
              pageSize={pageSize}
              onPageChange={handlePageChange}
              onPageSizeChange={(size) => {
                setPageSize(size);
                setCurrentPage(1);
              }}
            />
          </>
        )}

        {/* Loading overlay */}
        {isLoading && salas.length > 0 && (
          <div className="loading-overlay">
            <div className="spinner-small"></div>
          </div>
        )}

        {/* Modal */}
        {showModal && (
          <div className="modal-overlay-moderna" onClick={() => setShowModal(false)}>
            <div className="modal-content-moderna" onClick={(e) => e.stopPropagation()}>
              <div className="modal-header-moderna">
                <h3>{editingSala ? '✏️ Editar Sala' : '➕ Nueva Sala'}</h3>
                <button onClick={() => setShowModal(false)} className="close-btn-moderna">
                  ✕
                </button>
              </div>

              <form onSubmit={handleSubmit}>
                <div className="form-group-moderna">
                  <label>Nombre de la Sala *</label>
                  <input
                    type="text"
                    value={formData.nombre}
                    onChange={(e) => setFormData({ ...formData, nombre: e.target.value })}
                    required
                    placeholder="Ej: Cámara Gesell 01"
                  />
                </div>

                <div className="form-group-moderna">
                  <label>Sede *</label>
                  <select
                    value={formData.sede_id}
                    onChange={(e) => setFormData({ ...formData, sede_id: parseInt(e.target.value) })}
                    required
                  >
                    <option value="">Seleccione sede</option>
                    {sedes.map(sede => (
                      <option key={sede.id} value={sede.id}>
                        {sede.nombre}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="form-group-moderna">
                  <label>Capacidad (personas)</label>
                  <input
                    type="number"
                    value={formData.capacidad || ''}
                    onChange={(e) => setFormData({
                      ...formData,
                      capacidad: e.target.value ? parseInt(e.target.value) : undefined
                    })}
                    min="1"
                    max="50"
                    placeholder="Número de personas"
                  />
                </div>

                <div className="form-group-moderna">
                  <label>Equipamiento</label>
                  <textarea
                    value={formData.equipamiento}
                    onChange={(e) => setFormData({ ...formData, equipamiento: e.target.value })}
                    rows={3}
                    placeholder="Describe el equipamiento disponible..."
                  />
                </div>

                <div className="form-group-moderna">
                  <label className="checkbox-label">
                    <input
                      type="checkbox"
                      checked={formData.is_active}
                      onChange={(e) => setFormData({ ...formData, is_active: e.target.checked })}
                    />
                    Sala Activa
                  </label>
                </div>

                {error && <div className="error-message">{error}</div>}

                <div className="modal-actions-moderna">
                  <button type="button" className="btn-cancelar" onClick={() => setShowModal(false)}>
                    Cancelar
                  </button>
                  <button type="submit" className="btn-guardar">
                    {editingSala ? '💾 Actualizar' : '➕ Crear'}
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

export default SalasMantenimiento;
