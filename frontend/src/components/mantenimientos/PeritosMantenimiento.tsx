/**
 * CRUD de Peritos - Tabla con Búsqueda y Paginación 👨‍⚕️
 */
import { useState, useEffect } from 'react';
import { Layout } from '../layout/Layout';
import { peritoService, distritoFiscalService } from '../../services/mantenimiento.service';
import { Perito, DistritoFiscal } from '../../types';
import { SearchBar } from '../common/SearchBar';
import { Pagination } from '../common/Pagination';
import './MantenimientoModerno.css';

export const PeritosMantenimiento = () => {
  const [peritos, setPeritos] = useState<Perito[]>([]);
  const [distritos, setDistritos] = useState<DistritoFiscal[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editingPerito, setEditingPerito] = useState<Perito | null>(null);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  // Estados de búsqueda y paginación
  const [searchTerm, setSearchTerm] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [totalItems, setTotalItems] = useState(0);
  const [totalPages, setTotalPages] = useState(1);

  const [formData, setFormData] = useState({
    nombres: '',
    apellidos: '',
    especialidad: '',
    colegiatura: '',
    telefono: '',
    email: '',
    distrito_fiscal_id: undefined as number | undefined,
    is_active: true,
    user_id: undefined as number | undefined,
  });

  useEffect(() => {
    loadPeritos();
    loadDistritos();
  }, [searchTerm, currentPage, pageSize]);

  const loadDistritos = async () => {
    try {
      const result = await distritoFiscalService.getAll();
      setDistritos(result);
    } catch (err) {
      console.error('Error al cargar distritos fiscales:', err);
    }
  };

  const loadPeritos = async () => {
    setIsLoading(true);
    try {
      const result = await peritoService.searchAdvanced({
        page: currentPage,
        page_size: pageSize,
        search: searchTerm || undefined,
        sort_by: 'apellidos',
        sort_order: 'asc'
      });

      setPeritos(result.items);
      setTotalItems(result.total);
      setTotalPages(result.total_pages);
    } catch (err: any) {
      setError('Error al cargar peritos');
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

  const handleOpenModal = (perito?: Perito) => {
    if (perito) {
      setEditingPerito(perito);
      setFormData({
        nombres: perito.nombres,
        apellidos: perito.apellidos,
        especialidad: perito.especialidad || '',
        colegiatura: perito.colegiatura || '',
        telefono: perito.telefono || '',
        email: perito.email || '',
        distrito_fiscal_id: perito.distrito_fiscal_id,
        is_active: perito.is_active,
        user_id: perito.user_id,
      });
    } else {
      setEditingPerito(null);
      setFormData({
        nombres: '',
        apellidos: '',
        especialidad: '',
        colegiatura: '',
        telefono: '',
        email: '',
        distrito_fiscal_id: undefined,
        is_active: true,
        user_id: undefined,
      });
    }
    setShowModal(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    try {
      if (editingPerito) {
        await peritoService.update(editingPerito.id, formData);
        setSuccess('✅ Perito actualizado exitosamente');
      } else {
        await peritoService.create(formData);
        setSuccess('✅ Perito creado exitosamente');
      }
      setShowModal(false);
      await loadPeritos();
      setTimeout(() => setSuccess(''), 3000);
    } catch (err: any) {
      setError(err.response?.data?.detail || 'Error al guardar perito');
    }
  };

  const handleDelete = async (id: number) => {
    if (!confirm('⚠️ ¿Estás seguro de eliminar este perito?')) return;

    try {
      await peritoService.delete(id);
      setSuccess('✅ Perito eliminado exitosamente');
      await loadPeritos();
      setTimeout(() => setSuccess(''), 3000);
    } catch (err: any) {
      setError(err.response?.data?.detail || 'Error al eliminar perito');
    }
  };

  if (isLoading && peritos.length === 0) {
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
            <h1>👨‍⚕️ Gestión de Peritos</h1>
            <p>Administra el equipo de psicólogos y peritos forenses</p>
          </div>
          <button className="btn-agregar" onClick={() => handleOpenModal()}>
            ➕ Nuevo Perito
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
            placeholder="Buscar por nombres, apellidos, especialidad, colegiatura..."
            onSearch={handleSearch}
            initialValue={searchTerm}
          />
        </div>

        {/* Contador de resultados */}
        {!isLoading && (
          <div className="results-counter">
            Mostrando {peritos.length} de {totalItems} peritos
          </div>
        )}

        {/* Tabla */}
        {peritos.length === 0 ? (
          <div className="empty-state-moderna">
            <div className="empty-icon">👨‍⚕️</div>
            <h3>No se encontraron peritos</h3>
            <p>{searchTerm ? 'Intenta con otros criterios de búsqueda' : 'Comienza agregando tu primer perito'}</p>
            <button className="btn-agregar" onClick={() => handleOpenModal()}>
              ➕ Crear Perito
            </button>
          </div>
        ) : (
          <>
            <div className="table-container">
              <table className="data-table">
                <thead>
                  <tr>
                    <th>Nombre Completo</th>
                    <th>Distrito Fiscal</th>
                    <th>Especialidad</th>
                    <th>Colegiatura</th>
                    <th>Contacto</th>
                    <th>Estado</th>
                    <th>Acciones</th>
                  </tr>
                </thead>
                <tbody>
                  {peritos.map((perito) => {
                    const distrito = distritos.find(d => d.id === perito.distrito_fiscal_id);
                    return (
                    <tr key={perito.id}>
                      <td>
                        <strong>{perito.nombres} {perito.apellidos}</strong>
                      </td>
                      <td>
                        {distrito ? (
                          <span className="codigo-badge">{distrito.nombre}</span>
                        ) : (
                          <span style={{ color: '#9ca3af' }}>Sin asignar</span>
                        )}
                      </td>
                      <td>{perito.especialidad || 'Psicólogo Forense'}</td>
                      <td>
                        {perito.colegiatura ? (
                          <code>{perito.colegiatura}</code>
                        ) : (
                          <span style={{ color: '#9ca3af' }}>-</span>
                        )}
                      </td>
                      <td>
                        <div style={{ fontSize: '0.875rem', color: '#6b7280' }}>
                          {perito.telefono && <div>📱 {perito.telefono}</div>}
                          {perito.email && <div>✉️ {perito.email}</div>}
                          {!perito.telefono && !perito.email && <span style={{ color: '#9ca3af' }}>-</span>}
                        </div>
                      </td>
                      <td>
                        <span className={`badge-status ${perito.is_active ? 'activo' : 'inactivo'}`}>
                          {perito.is_active ? '✓ Activo' : '✕ Inactivo'}
                        </span>
                      </td>
                      <td>
                        <div style={{ display: 'flex', gap: '0.5rem' }}>
                          <button
                            className="btn-icon edit"
                            onClick={() => handleOpenModal(perito)}
                            title="Editar"
                          >
                            ✏️
                          </button>
                          <button
                            className="btn-icon delete"
                            onClick={() => handleDelete(perito.id)}
                            title="Eliminar"
                          >
                            🗑️
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                  })}
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
        {isLoading && peritos.length > 0 && (
          <div className="loading-overlay">
            <div className="spinner-small"></div>
          </div>
        )}

        {/* Modal */}
        {showModal && (
          <div className="modal-overlay-moderna" onClick={() => setShowModal(false)}>
            <div className="modal-content-moderna" onClick={(e) => e.stopPropagation()}>
              <div className="modal-header-moderna">
                <h3>{editingPerito ? '✏️ Editar Perito' : '➕ Nuevo Perito'}</h3>
                <button onClick={() => setShowModal(false)} className="close-btn-moderna">
                  ✕
                </button>
              </div>

              <form onSubmit={handleSubmit}>
                <div className="form-group-moderna">
                  <label>Nombres *</label>
                  <input
                    type="text"
                    value={formData.nombres}
                    onChange={(e) => setFormData({ ...formData, nombres: e.target.value })}
                    required
                    placeholder="Nombres del perito"
                  />
                </div>

                <div className="form-group-moderna">
                  <label>Apellidos *</label>
                  <input
                    type="text"
                    value={formData.apellidos}
                    onChange={(e) => setFormData({ ...formData, apellidos: e.target.value })}
                    required
                    placeholder="Apellidos del perito"
                  />
                </div>

                <div className="form-group-moderna">
                  <label>Distrito Fiscal *</label>
                  <select
                    value={formData.distrito_fiscal_id || ''}
                    onChange={(e) => setFormData({ ...formData, distrito_fiscal_id: e.target.value ? parseInt(e.target.value) : undefined })}
                    required
                  >
                    <option value="">Seleccione un distrito fiscal</option>
                    {distritos.map((distrito) => (
                      <option key={distrito.id} value={distrito.id}>
                        {distrito.nombre} ({distrito.codigo})
                      </option>
                    ))}
                  </select>
                </div>

                <div className="form-group-moderna">
                  <label>Especialidad</label>
                  <input
                    type="text"
                    value={formData.especialidad}
                    onChange={(e) => setFormData({ ...formData, especialidad: e.target.value })}
                    placeholder="Ej: Psicología Forense"
                  />
                </div>

                <div className="form-group-moderna">
                  <label>Número de Colegiatura</label>
                  <input
                    type="text"
                    value={formData.colegiatura}
                    onChange={(e) => setFormData({ ...formData, colegiatura: e.target.value })}
                    placeholder="Ej: CPsP-12345"
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
                  <label>Email</label>
                  <input
                    type="email"
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    placeholder="correo@ejemplo.com"
                  />
                </div>

                <div className="form-group-moderna">
                  <label className="checkbox-label">
                    <input
                      type="checkbox"
                      checked={formData.is_active}
                      onChange={(e) => setFormData({ ...formData, is_active: e.target.checked })}
                    />
                    Perito Activo
                  </label>
                </div>

                {error && <div className="error-message">{error}</div>}

                <div className="modal-actions-moderna">
                  <button type="button" className="btn-cancelar" onClick={() => setShowModal(false)}>
                    Cancelar
                  </button>
                  <button type="submit" className="btn-guardar">
                    {editingPerito ? '💾 Actualizar' : '➕ Crear'}
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

export default PeritosMantenimiento;
