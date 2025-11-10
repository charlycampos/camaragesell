/**
 * CRUD de Despachos Fiscales - Tabla con Búsqueda y Paginación ⚖️
 */
import { useState, useEffect } from 'react';
import { Layout } from '../layout/Layout';
import { despachoService } from '../../services/mantenimiento.service';
import { DespachoFiscal } from '../../types';
import { SearchBar } from '../common/SearchBar';
import { Pagination } from '../common/Pagination';
import './MantenimientoModerno.css';

export const DespachosMantenimiento = () => {
  const [despachos, setDespachos] = useState<DespachoFiscal[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editingDespacho, setEditingDespacho] = useState<DespachoFiscal | null>(null);
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
    distrito: '',
    direccion: '',
    telefono: '',
    fiscal_titular: '',
    is_active: true,
  });

  useEffect(() => {
    loadDespachos();
  }, [searchTerm, currentPage, pageSize]);

  const loadDespachos = async () => {
    setIsLoading(true);
    try {
      const result = await despachoService.searchAdvanced({
        page: currentPage,
        page_size: pageSize,
        search: searchTerm || undefined,
        sort_by: 'nombre',
        sort_order: 'asc'
      });

      setDespachos(result.items);
      setTotalItems(result.total);
      setTotalPages(result.total_pages);
    } catch (err: any) {
      setError('Error al cargar despachos');
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

  const handleOpenModal = (despacho?: DespachoFiscal) => {
    if (despacho) {
      setEditingDespacho(despacho);
      setFormData({
        nombre: despacho.nombre,
        distrito: despacho.distrito || '',
        direccion: despacho.direccion || '',
        telefono: despacho.telefono || '',
        fiscal_titular: despacho.fiscal_titular || '',
        is_active: despacho.is_active,
      });
    } else {
      setEditingDespacho(null);
      setFormData({
        nombre: '',
        distrito: '',
        direccion: '',
        telefono: '',
        fiscal_titular: '',
        is_active: true,
      });
    }
    setShowModal(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    try {
      if (editingDespacho) {
        await despachoService.update(editingDespacho.id, formData);
        setSuccess('✅ Despacho actualizado exitosamente');
      } else {
        await despachoService.create(formData);
        setSuccess('✅ Despacho creado exitosamente');
      }
      setShowModal(false);
      await loadDespachos();
      setTimeout(() => setSuccess(''), 3000);
    } catch (err: any) {
      setError(err.response?.data?.detail || 'Error al guardar despacho');
    }
  };

  const handleDelete = async (id: number) => {
    if (!confirm('⚠️ ¿Estás seguro de eliminar este despacho fiscal?')) return;

    try {
      await despachoService.delete(id);
      setSuccess('✅ Despacho eliminado exitosamente');
      await loadDespachos();
      setTimeout(() => setSuccess(''), 3000);
    } catch (err: any) {
      setError(err.response?.data?.detail || 'Error al eliminar despacho');
    }
  };

  if (isLoading && despachos.length === 0) {
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
            <h1>⚖️ Gestión de Despachos Fiscales</h1>
            <p>Administra las fiscalías y ministerios públicos</p>
          </div>
          <button className="btn-agregar" onClick={() => handleOpenModal()}>
            ➕ Nuevo Despacho
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
            placeholder="Buscar por nombre, distrito, fiscal o dirección..."
            onSearch={handleSearch}
            initialValue={searchTerm}
          />
        </div>

        {/* Contador de resultados */}
        {!isLoading && (
          <div className="results-counter">
            Mostrando {despachos.length} de {totalItems} despachos
          </div>
        )}

        {/* Tabla */}
        {despachos.length === 0 ? (
          <div className="empty-state-moderna">
            <div className="empty-icon">⚖️</div>
            <h3>No se encontraron despachos</h3>
            <p>{searchTerm ? 'Intenta con otros criterios de búsqueda' : 'Comienza agregando el primer despacho fiscal'}</p>
            <button className="btn-agregar" onClick={() => handleOpenModal()}>
              ➕ Crear Despacho
            </button>
          </div>
        ) : (
          <>
            <div className="table-container">
              <table className="data-table">
                <thead>
                  <tr>
                    <th>Nombre del Despacho</th>
                    <th>Distrito</th>
                    <th>Fiscal Titular</th>
                    <th>Contacto</th>
                    <th>Estado</th>
                    <th>Acciones</th>
                  </tr>
                </thead>
                <tbody>
                  {despachos.map((despacho) => (
                    <tr key={despacho.id}>
                      <td><strong>{despacho.nombre}</strong></td>
                      <td>
                        {despacho.distrito ? (
                          <span style={{ fontSize: '0.875rem' }}>📍 {despacho.distrito}</span>
                        ) : (
                          <span style={{ color: '#9ca3af' }}>-</span>
                        )}
                      </td>
                      <td>
                        {despacho.fiscal_titular ? (
                          <span>👤 {despacho.fiscal_titular}</span>
                        ) : (
                          <span style={{ color: '#9ca3af' }}>-</span>
                        )}
                      </td>
                      <td>
                        <div style={{ fontSize: '0.875rem', color: '#6b7280' }}>
                          {despacho.telefono && <div>📞 {despacho.telefono}</div>}
                          {despacho.direccion && (
                            <div title={despacho.direccion}>
                              📮 {despacho.direccion.length > 30
                                ? `${despacho.direccion.substring(0, 30)}...`
                                : despacho.direccion}
                            </div>
                          )}
                          {!despacho.telefono && !despacho.direccion && (
                            <span style={{ color: '#9ca3af' }}>-</span>
                          )}
                        </div>
                      </td>
                      <td>
                        <span className={`badge-status ${despacho.is_active ? 'activo' : 'inactivo'}`}>
                          {despacho.is_active ? '✓ Activo' : '✕ Inactivo'}
                        </span>
                      </td>
                      <td>
                        <div style={{ display: 'flex', gap: '0.5rem' }}>
                          <button
                            className="btn-icon edit"
                            onClick={() => handleOpenModal(despacho)}
                            title="Editar"
                          >
                            ✏️
                          </button>
                          <button
                            className="btn-icon delete"
                            onClick={() => handleDelete(despacho.id)}
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
        {isLoading && despachos.length > 0 && (
          <div className="loading-overlay">
            <div className="spinner-small"></div>
          </div>
        )}

        {/* Modal */}
        {showModal && (
          <div className="modal-overlay-moderna" onClick={() => setShowModal(false)}>
            <div className="modal-content-moderna" onClick={(e) => e.stopPropagation()}>
              <div className="modal-header-moderna">
                <h3>{editingDespacho ? '✏️ Editar Despacho' : '➕ Nuevo Despacho'}</h3>
                <button onClick={() => setShowModal(false)} className="close-btn-moderna">
                  ✕
                </button>
              </div>

              <form onSubmit={handleSubmit}>
                <div className="form-group-moderna">
                  <label>Nombre del Despacho *</label>
                  <input
                    type="text"
                    value={formData.nombre}
                    onChange={(e) => setFormData({ ...formData, nombre: e.target.value })}
                    required
                    placeholder="Ej: Primera Fiscalía Provincial Penal de Lima"
                  />
                </div>

                <div className="form-group-moderna">
                  <label>Distrito</label>
                  <input
                    type="text"
                    value={formData.distrito}
                    onChange={(e) => setFormData({ ...formData, distrito: e.target.value })}
                    placeholder="Ej: Lima - Cercado"
                  />
                </div>

                <div className="form-group-moderna">
                  <label>Fiscal Titular</label>
                  <input
                    type="text"
                    value={formData.fiscal_titular}
                    onChange={(e) => setFormData({ ...formData, fiscal_titular: e.target.value })}
                    placeholder="Nombre del fiscal a cargo"
                  />
                </div>

                <div className="form-group-moderna">
                  <label>Dirección</label>
                  <textarea
                    value={formData.direccion}
                    onChange={(e) => setFormData({ ...formData, direccion: e.target.value })}
                    rows={2}
                    placeholder="Dirección completa del despacho"
                  />
                </div>

                <div className="form-group-moderna">
                  <label>Teléfono</label>
                  <input
                    type="tel"
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
                    Despacho Activo
                  </label>
                </div>

                {error && <div className="error-message">{error}</div>}

                <div className="modal-actions-moderna">
                  <button type="button" className="btn-cancelar" onClick={() => setShowModal(false)}>
                    Cancelar
                  </button>
                  <button type="submit" className="btn-guardar">
                    {editingDespacho ? '💾 Actualizar' : '➕ Crear'}
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

export default DespachosMantenimiento;
