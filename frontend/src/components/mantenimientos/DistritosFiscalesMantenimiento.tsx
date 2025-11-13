/**
 * CRUD de Distritos Fiscales - Gestión de los 34 Distritos Fiscales de Perú
 */
import { useState, useEffect } from 'react';
import { Layout } from '../layout/Layout';
import { distritoFiscalService } from '../../services/mantenimiento.service';
import { DistritoFiscal } from '../../types';
import { SearchBar } from '../common/SearchBar';
import { Pagination } from '../common/Pagination';
import './MantenimientoModerno.css';

export const DistritosFiscalesMantenimiento = () => {
  const [distritos, setDistritos] = useState<DistritoFiscal[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editingDistrito, setEditingDistrito] = useState<DistritoFiscal | null>(null);
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
    codigo: '',
    region: '',
    provincia: '',
    direccion: '',
    telefono: '',
    email: '',
    is_active: true,
  });

  useEffect(() => {
    loadDistritos();
  }, [searchTerm, currentPage, pageSize]);

  const loadDistritos = async () => {
    setIsLoading(true);
    try {
      const result = await distritoFiscalService.searchAdvanced({
        page: currentPage,
        page_size: pageSize,
        search: searchTerm || undefined,
        sort_by: 'nombre',
        sort_order: 'asc'
      });

      setDistritos(result.items);
      setTotalItems(result.total);
      setTotalPages(result.total_pages);
    } catch (err: any) {
      setError('Error al cargar distritos fiscales');
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

  const handleOpenModal = (distrito?: DistritoFiscal) => {
    if (distrito) {
      setEditingDistrito(distrito);
      setFormData({
        nombre: distrito.nombre,
        codigo: distrito.codigo,
        region: distrito.region || '',
        provincia: distrito.provincia || '',
        direccion: distrito.direccion || '',
        telefono: distrito.telefono || '',
        email: distrito.email || '',
        is_active: distrito.is_active,
      });
    } else {
      setEditingDistrito(null);
      setFormData({
        nombre: '',
        codigo: '',
        region: '',
        provincia: '',
        direccion: '',
        telefono: '',
        email: '',
        is_active: true,
      });
    }
    setShowModal(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    try {
      if (editingDistrito) {
        await distritoFiscalService.update(editingDistrito.id, formData);
        setSuccess('Distrito Fiscal actualizado exitosamente');
      } else {
        await distritoFiscalService.create(formData);
        setSuccess('Distrito Fiscal creado exitosamente');
      }
      setShowModal(false);
      await loadDistritos();
      setTimeout(() => setSuccess(''), 3000);
    } catch (err: any) {
      const errorData = err.response?.data;
      if (errorData) {
        if (Array.isArray(errorData.detail)) {
          const errorMessages = errorData.detail.map((e: any) => {
            const field = e.loc?.join('.') || 'campo';
            return `${field}: ${e.msg}`;
          }).join(', ');
          setError(errorMessages);
        } else if (typeof errorData.detail === 'string') {
          setError(errorData.detail);
        } else {
          setError('Error al guardar distrito fiscal');
        }
      } else {
        setError('Error al guardar distrito fiscal');
      }
    }
  };

  const handleDelete = async (id: number) => {
    if (!confirm('¿Está seguro de eliminar este Distrito Fiscal?')) return;

    try {
      await distritoFiscalService.delete(id);
      setSuccess('Distrito Fiscal eliminado exitosamente');
      await loadDistritos();
      setTimeout(() => setSuccess(''), 3000);
    } catch (err: any) {
      setError(err.response?.data?.detail || 'Error al eliminar distrito fiscal');
    }
  };

  if (isLoading && distritos.length === 0) {
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
            <h1>Distritos Fiscales de Perú</h1>
            <p>Gestión de los 34 Distritos Fiscales del Ministerio Público</p>
          </div>
          <button className="btn-agregar" onClick={() => handleOpenModal()}>
            + Nuevo Distrito Fiscal
          </button>
        </div>

        {success && (
          <div className="success-message" style={{marginBottom: '2rem'}}>
            {success}
          </div>
        )}

        {error && (
          <div className="error-message" style={{marginBottom: '2rem'}}>
            {error}
          </div>
        )}

        {/* Búsqueda */}
        <SearchBar
          onSearch={handleSearch}
          placeholder="Buscar por nombre, código o región..."
        />

        {/* Estadísticas */}
        <div className="stats-row">
          <div className="stat-card">
            <div className="stat-value">{totalItems}</div>
            <div className="stat-label">Total Distritos Fiscales</div>
          </div>
          <div className="stat-card">
            <div className="stat-value">{distritos.filter(d => d.is_active).length}</div>
            <div className="stat-label">Activos</div>
          </div>
          <div className="stat-card">
            <div className="stat-value">{new Set(distritos.map(d => d.region)).size}</div>
            <div className="stat-label">Regiones</div>
          </div>
        </div>

        {/* Tabla */}
        <div className="card-tabla">
          <div className="table-container">
            <table className="tabla-moderna">
              <thead>
                <tr>
                  <th>Código</th>
                  <th>Distrito Fiscal</th>
                  <th>Región</th>
                  <th>Provincia</th>
                  <th>Teléfono</th>
                  <th>Email</th>
                  <th>Estado</th>
                  <th>Acciones</th>
                </tr>
              </thead>
              <tbody>
                {distritos.length === 0 ? (
                  <tr>
                    <td colSpan={8} style={{textAlign: 'center', padding: '2rem'}}>
                      No se encontraron distritos fiscales
                    </td>
                  </tr>
                ) : (
                  distritos.map((distrito) => (
                    <tr key={distrito.id}>
                      <td>
                        <span className="codigo-badge">{distrito.codigo}</span>
                      </td>
                      <td>
                        <strong>{distrito.nombre}</strong>
                      </td>
                      <td>{distrito.region || '-'}</td>
                      <td>{distrito.provincia || '-'}</td>
                      <td>{distrito.telefono || '-'}</td>
                      <td>{distrito.email || '-'}</td>
                      <td>
                        <span className={`badge ${distrito.is_active ? 'badge-success' : 'badge-error'}`}>
                          {distrito.is_active ? 'Activo' : 'Inactivo'}
                        </span>
                      </td>
                      <td>
                        <div className="acciones">
                          <button
                            className="btn-icon btn-editar"
                            onClick={() => handleOpenModal(distrito)}
                            title="Editar"
                          >
                            ✏️
                          </button>
                          <button
                            className="btn-icon btn-eliminar"
                            onClick={() => handleDelete(distrito.id)}
                            title="Eliminar"
                          >
                            🗑️
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>

          {/* Paginación */}
          <Pagination
            currentPage={currentPage}
            totalPages={totalPages}
            onPageChange={handlePageChange}
            totalItems={totalItems}
          />
        </div>

        {/* Modal */}
        {showModal && (
          <div className="modal-overlay" onClick={() => setShowModal(false)}>
            <div className="modal-content" onClick={(e) => e.stopPropagation()}>
              <div className="modal-header">
                <h2>{editingDistrito ? 'Editar Distrito Fiscal' : 'Nuevo Distrito Fiscal'}</h2>
                <button
                  className="modal-close"
                  onClick={() => setShowModal(false)}
                >
                  ✖
                </button>
              </div>

              <form onSubmit={handleSubmit}>
                <div className="form-grid">
                  <div className="form-group">
                    <label>Nombre *</label>
                    <input
                      type="text"
                      value={formData.nombre}
                      onChange={(e) => setFormData({...formData, nombre: e.target.value})}
                      required
                      placeholder="Ej: Lima, Arequipa, Cusco"
                    />
                  </div>

                  <div className="form-group">
                    <label>Código *</label>
                    <input
                      type="text"
                      value={formData.codigo}
                      onChange={(e) => setFormData({...formData, codigo: e.target.value})}
                      required
                      placeholder="Ej: DF-LIMA"
                    />
                  </div>

                  <div className="form-group">
                    <label>Región</label>
                    <input
                      type="text"
                      value={formData.region}
                      onChange={(e) => setFormData({...formData, region: e.target.value})}
                      placeholder="Ej: Lima"
                    />
                  </div>

                  <div className="form-group">
                    <label>Provincia</label>
                    <input
                      type="text"
                      value={formData.provincia}
                      onChange={(e) => setFormData({...formData, provincia: e.target.value})}
                      placeholder="Ej: Lima"
                    />
                  </div>

                  <div className="form-group full-width">
                    <label>Dirección</label>
                    <input
                      type="text"
                      value={formData.direccion}
                      onChange={(e) => setFormData({...formData, direccion: e.target.value})}
                      placeholder="Dirección de la sede principal"
                    />
                  </div>

                  <div className="form-group">
                    <label>Teléfono</label>
                    <input
                      type="text"
                      value={formData.telefono}
                      onChange={(e) => setFormData({...formData, telefono: e.target.value})}
                      placeholder="Ej: 01-XXXXXXX"
                    />
                  </div>

                  <div className="form-group">
                    <label>Email</label>
                    <input
                      type="email"
                      value={formData.email}
                      onChange={(e) => setFormData({...formData, email: e.target.value})}
                      placeholder="ejemplo@mpfn.gob.pe"
                    />
                  </div>

                  <div className="form-group full-width">
                    <label className="checkbox-label">
                      <input
                        type="checkbox"
                        checked={formData.is_active}
                        onChange={(e) => setFormData({...formData, is_active: e.target.checked})}
                      />
                      <span>Activo</span>
                    </label>
                  </div>
                </div>

                {error && (
                  <div className="error-message" style={{marginTop: '1rem'}}>
                    {error}
                  </div>
                )}

                <div className="modal-footer">
                  <button
                    type="button"
                    className="btn-cancelar"
                    onClick={() => setShowModal(false)}
                  >
                    Cancelar
                  </button>
                  <button type="submit" className="btn-guardar">
                    {editingDistrito ? 'Actualizar' : 'Crear'}
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
