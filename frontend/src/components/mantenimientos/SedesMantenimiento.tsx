/**
 * CRUD de Sedes - Tabla con Búsqueda y Paginación 🏛️
 */
import { useState, useEffect } from 'react';
import { Layout } from '../layout/Layout';
import { sedeService } from '../../services/mantenimiento.service';
import { Sede } from '../../types';
import { SearchBar } from '../common/SearchBar';
import { Pagination } from '../common/Pagination';
import './MantenimientoModerno.css';

export const SedesMantenimiento = () => {
  const [sedes, setSedes] = useState<Sede[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editingSede, setEditingSede] = useState<Sede | null>(null);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  // Estados de búsqueda y paginación
  const [searchTerm, setSearchTerm] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [totalItems, setTotalItems] = useState(0);
  const [totalPages, setTotalPages] = useState(1);

  const [formData, setFormData] = useState({
    nombre: '',
    direccion: '',
    telefono: '',
    is_active: true,
  });

  useEffect(() => {
    loadSedes();
  }, [searchTerm, currentPage, pageSize]);

  const loadSedes = async () => {
    setIsLoading(true);
    try {
      const result = await sedeService.searchAdvanced({
        page: currentPage,
        page_size: pageSize,
        search: searchTerm || undefined,
        sort_by: 'nombre',
        sort_order: 'asc'
      });

      setSedes(result.items);
      setTotalItems(result.total);
      setTotalPages(result.total_pages);
    } catch (err: any) {
      setError('Error al cargar sedes');
    } finally {
      setIsLoading(false);
    }
  };

  const handleSearch = (search: string) => {
    setSearchTerm(search);
    setCurrentPage(1);
  };

  const handlePageChange = (page: number) => {
    setCurrentPage(page);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleOpenModal = (sede?: Sede) => {
    if (sede) {
      setEditingSede(sede);
      setFormData({
        nombre: sede.nombre,
        direccion: sede.direccion || '',
        telefono: sede.telefono || '',
        is_active: sede.is_active,
      });
    } else {
      setEditingSede(null);
      setFormData({
        nombre: '',
        direccion: '',
        telefono: '',
        is_active: true,
      });
    }
    setShowModal(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    try {
      if (editingSede) {
        await sedeService.update(editingSede.id, formData);
        setSuccess('✅ Sede actualizada exitosamente');
      } else {
        await sedeService.create(formData);
        setSuccess('✅ Sede creada exitosamente');
      }
      setShowModal(false);
      await loadSedes();
      setTimeout(() => setSuccess(''), 3000);
    } catch (err: any) {
      setError(err.response?.data?.detail || 'Error al guardar sede');
    }
  };

  const handleDelete = async (id: number) => {
    if (!confirm('⚠️ ¿Estás seguro de eliminar esta sede?')) return;

    try {
      await sedeService.delete(id);
      setSuccess('✅ Sede eliminada exitosamente');
      await loadSedes();
      setTimeout(() => setSuccess(''), 3000);
    } catch (err: any) {
      setError(err.response?.data?.detail || 'Error al eliminar sede');
    }
  };

  if (isLoading && sedes.length === 0) {
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
            <h1>🏛️ Gestión de Sedes</h1>
            <p>Administra las sedes del Instituto de Medicina Legal</p>
          </div>
          <button className="btn-agregar" onClick={() => handleOpenModal()}>
            ➕ Nueva Sede
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

        {/* Búsqueda */}
        <div style={{ marginBottom: '1.5rem' }}>
          <SearchBar
            placeholder="Buscar por nombre, dirección o teléfono..."
            onSearch={handleSearch}
            initialValue={searchTerm}
          />
        </div>

        {/* Contador de resultados */}
        {!isLoading && (
          <div className="results-counter">
            Mostrando {sedes.length} de {totalItems} sedes
          </div>
        )}

        {/* Tabla */}
        {sedes.length === 0 ? (
          <div className="empty-state-moderna">
            <div className="empty-icon">🏛️</div>
            <h3>No se encontraron sedes</h3>
            <p>{searchTerm ? 'Intenta con otros criterios de búsqueda' : 'Comienza agregando tu primera sede'}</p>
            <button className="btn-agregar" onClick={() => handleOpenModal()}>
              ➕ Crear Sede
            </button>
          </div>
        ) : (
          <>
            <div className="table-container">
              <table className="data-table">
                <thead>
                  <tr>
                    <th>Nombre</th>
                    <th>Dirección</th>
                    <th>Teléfono</th>
                    <th>Estado</th>
                    <th>Acciones</th>
                  </tr>
                </thead>
                <tbody>
                  {sedes.map((sede) => (
                    <tr key={sede.id}>
                      <td><strong>{sede.nombre}</strong></td>
                      <td style={{ fontSize: '0.875rem', color: '#6b7280' }}>
                        {sede.direccion || <span style={{ color: '#9ca3af' }}>-</span>}
                      </td>
                      <td>
                        {sede.telefono ? (
                          <code>{sede.telefono}</code>
                        ) : (
                          <span style={{ color: '#9ca3af' }}>-</span>
                        )}
                      </td>
                      <td>
                        <span className={`badge-status ${sede.is_active ? 'activo' : 'inactivo'}`}>
                          {sede.is_active ? '✓ Activa' : '✕ Inactiva'}
                        </span>
                      </td>
                      <td>
                        <div style={{ display: 'flex', gap: '0.5rem' }}>
                          <button
                            className="btn-icon edit"
                            onClick={() => handleOpenModal(sede)}
                            title="Editar"
                          >
                            ✏️
                          </button>
                          <button
                            className="btn-icon delete"
                            onClick={() => handleDelete(sede.id)}
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
        {isLoading && sedes.length > 0 && (
          <div className="loading-overlay">
            <div className="spinner-small"></div>
          </div>
        )}

        {/* Modal */}
        {showModal && (
          <div className="modal-overlay-moderna" onClick={() => setShowModal(false)}>
            <div className="modal-content-moderna" onClick={(e) => e.stopPropagation()}>
              <div className="modal-header-moderna">
                <h3>{editingSede ? '✏️ Editar Sede' : '➕ Nueva Sede'}</h3>
                <button onClick={() => setShowModal(false)} className="close-btn-moderna">
                  ✕
                </button>
              </div>

              <form onSubmit={handleSubmit}>
                <div className="form-group-moderna">
                  <label>Nombre *</label>
                  <input
                    type="text"
                    value={formData.nombre}
                    onChange={(e) => setFormData({ ...formData, nombre: e.target.value })}
                    required
                    placeholder="Nombre de la sede"
                  />
                </div>

                <div className="form-group-moderna">
                  <label>Dirección</label>
                  <input
                    type="text"
                    value={formData.direccion}
                    onChange={(e) => setFormData({ ...formData, direccion: e.target.value })}
                    placeholder="Dirección completa"
                  />
                </div>

                <div className="form-group-moderna">
                  <label>Teléfono</label>
                  <input
                    type="text"
                    value={formData.telefono}
                    onChange={(e) => setFormData({ ...formData, telefono: e.target.value })}
                    placeholder="Teléfono de contacto"
                  />
                </div>

                <div className="form-group-moderna">
                  <label className="checkbox-label">
                    <input
                      type="checkbox"
                      checked={formData.is_active}
                      onChange={(e) => setFormData({ ...formData, is_active: e.target.checked })}
                    />
                    Activo
                  </label>
                </div>

                {error && <div className="error-message">{error}</div>}

                <div className="modal-actions-moderna">
                  <button type="button" className="btn-cancelar" onClick={() => setShowModal(false)}>
                    Cancelar
                  </button>
                  <button type="submit" className="btn-guardar">
                    {editingSede ? '💾 Actualizar' : '➕ Crear'}
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

export default SedesMantenimiento;
