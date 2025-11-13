/**
 * CRUD de Usuarios - Tabla con Búsqueda y Paginación 👥
 */
import { useState, useEffect } from 'react';
import { Layout } from '../layout/Layout';
import { usuarioService } from '../../services/usuario.service';
import { distritoFiscalService } from '../../services/mantenimiento.service';
import { User, UserRole, DistritoFiscal } from '../../types';
import { SearchBar } from '../common/SearchBar';
import { Pagination } from '../common/Pagination';
import './MantenimientoModerno.css';

export const UsuariosMantenimiento = () => {
  const [usuarios, setUsuarios] = useState<User[]>([]);
  const [distritos, setDistritos] = useState<DistritoFiscal[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editingUsuario, setEditingUsuario] = useState<User | null>(null);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  // Estados de búsqueda y paginación
  const [searchTerm, setSearchTerm] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [totalItems, setTotalItems] = useState(0);
  const [totalPages, setTotalPages] = useState(1);
  const [selectedRole, setSelectedRole] = useState<string>('');

  const [formData, setFormData] = useState({
    username: '',
    email: '',
    full_name: '',
    role: UserRole.FISCAL,
    distrito_fiscal_id: undefined as number | undefined,
    password: '',
    is_active: true,
  });

  useEffect(() => {
    loadUsuarios();
    loadDistritos();
  }, [searchTerm, currentPage, pageSize, selectedRole]);

  const loadDistritos = async () => {
    try {
      const result = await distritoFiscalService.getAll();
      setDistritos(result);
    } catch (err) {
      console.error('Error al cargar distritos fiscales:', err);
    }
  };

  const loadUsuarios = async () => {
    setIsLoading(true);
    try {
      const result = await usuarioService.searchAdvanced({
        page: currentPage,
        page_size: pageSize,
        search: searchTerm || undefined,
        role: selectedRole || undefined,
        sort_by: 'created_at',
        sort_order: 'desc'
      });

      setUsuarios(result.items);
      setTotalItems(result.total);
      setTotalPages(result.total_pages);
    } catch (err: any) {
      setError('Error al cargar usuarios');
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

  const handleRoleFilter = (role: string) => {
    setSelectedRole(role);
    setCurrentPage(1);
  };

  const handleOpenModal = (usuario?: User) => {
    if (usuario) {
      setEditingUsuario(usuario);
      setFormData({
        username: usuario.username,
        email: usuario.email,
        full_name: usuario.full_name,
        role: usuario.role,
        distrito_fiscal_id: usuario.distrito_fiscal_id,
        password: '',
        is_active: usuario.is_active,
      });
    } else {
      setEditingUsuario(null);
      setFormData({
        username: '',
        email: '',
        full_name: '',
        role: UserRole.FISCAL,
        distrito_fiscal_id: undefined,
        password: '',
        is_active: true,
      });
    }
    setShowModal(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    try {
      if (editingUsuario) {
        const updateData: any = {
          email: formData.email,
          full_name: formData.full_name,
          role: formData.role,
          distrito_fiscal_id: formData.distrito_fiscal_id,
          is_active: formData.is_active,
        };
        if (formData.password) {
          updateData.password = formData.password;
        }
        await usuarioService.update(editingUsuario.id, updateData);
        setSuccess('✅ Usuario actualizado exitosamente');
      } else {
        await usuarioService.create(formData);
        setSuccess('✅ Usuario creado exitosamente');
      }
      setShowModal(false);
      await loadUsuarios();
      setTimeout(() => setSuccess(''), 3000);
    } catch (err: any) {
      // Manejar errores de validación de Pydantic/FastAPI
      const errorData = err.response?.data;
      if (errorData) {
        if (Array.isArray(errorData.detail)) {
          // Array de errores de validación de Pydantic
          const errorMessages = errorData.detail.map((e: any) => {
            const field = e.loc?.join('.') || 'campo';
            return `${field}: ${e.msg}`;
          }).join(', ');
          setError(errorMessages);
        } else if (typeof errorData.detail === 'string') {
          // Error simple como string
          setError(errorData.detail);
        } else {
          setError('Error al guardar usuario');
        }
      } else {
        setError('Error al guardar usuario');
      }
    }
  };

  const handleDelete = async (id: number) => {
    if (!confirm('⚠️ ¿Estás seguro de eliminar este usuario?')) return;

    try {
      await usuarioService.delete(id);
      setSuccess('✅ Usuario eliminado exitosamente');
      await loadUsuarios();
      setTimeout(() => setSuccess(''), 3000);
    } catch (err: any) {
      const errorData = err.response?.data;
      if (errorData && typeof errorData.detail === 'string') {
        setError(errorData.detail);
      } else {
        setError('Error al eliminar usuario');
      }
    }
  };

  const getRoleIcon = (role: UserRole) => {
    switch (role) {
      case UserRole.ADMIN:
        return '👑';
      case UserRole.ASISTENTE_ADMINISTRATIVO:
        return '📋';
      case UserRole.PERITO:
        return '👨‍⚕️';
      case UserRole.FISCAL:
        return '⚖️';
      default:
        return '👤';
    }
  };

  const getRoleLabel = (role: UserRole) => {
    switch (role) {
      case UserRole.ADMIN:
        return 'Administrador';
      case UserRole.ASISTENTE_ADMINISTRATIVO:
        return 'Asistente Administrativo';
      case UserRole.PERITO:
        return 'Perito';
      case UserRole.FISCAL:
        return 'Fiscal';
      default:
        return role;
    }
  };

  if (isLoading && usuarios.length === 0) {
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
            <h1>👥 Gestión de Usuarios</h1>
            <p>Administra los usuarios y permisos del sistema</p>
          </div>
          <button className="btn-agregar" onClick={() => handleOpenModal()}>
            ➕ Nuevo Usuario
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
              placeholder="Buscar por nombre, usuario o email..."
              onSearch={handleSearch}
              initialValue={searchTerm}
            />
          </div>
          <select
            value={selectedRole}
            onChange={(e) => handleRoleFilter(e.target.value)}
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
            <option value="">Todos los roles</option>
            <option value={UserRole.ADMIN}>👑 Administrador</option>
            <option value={UserRole.ASISTENTE_ADMINISTRATIVO}>📋 Asistente</option>
            <option value={UserRole.PERITO}>👨‍⚕️ Perito</option>
            <option value={UserRole.FISCAL}>⚖️ Fiscal</option>
          </select>
        </div>

        {/* Contador de resultados */}
        {!isLoading && (
          <div className="results-counter">
            Mostrando {usuarios.length} de {totalItems} usuarios
          </div>
        )}

        {/* Tabla */}
        {usuarios.length === 0 ? (
          <div className="empty-state-moderna">
            <div className="empty-icon">👥</div>
            <h3>No se encontraron usuarios</h3>
            <p>{searchTerm || selectedRole ? 'Intenta con otros criterios de búsqueda' : 'Comienza agregando el primer usuario'}</p>
            <button className="btn-agregar" onClick={() => handleOpenModal()}>
              ➕ Crear Usuario
            </button>
          </div>
        ) : (
          <>
            <div className="table-container">
              <table className="data-table">
                <thead>
                  <tr>
                    <th>Rol</th>
                    <th>Nombre Completo</th>
                    <th>Distrito Fiscal</th>
                    <th>Usuario</th>
                    <th>Email</th>
                    <th>Estado</th>
                    <th>Acciones</th>
                  </tr>
                </thead>
                <tbody>
                  {usuarios.map((usuario) => {
                    const distrito = distritos.find(d => d.id === usuario.distrito_fiscal_id);
                    return (
                    <tr key={usuario.id}>
                      <td>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                          <span style={{ fontSize: '1.5rem' }}>{getRoleIcon(usuario.role)}</span>
                          <span>{getRoleLabel(usuario.role)}</span>
                        </div>
                      </td>
                      <td><strong>{usuario.full_name}</strong></td>
                      <td>
                        {distrito ? (
                          <span className="codigo-badge">{distrito.nombre}</span>
                        ) : (
                          <span style={{ color: '#9ca3af' }}>Sin asignar</span>
                        )}
                      </td>
                      <td><code>@{usuario.username}</code></td>
                      <td style={{ fontSize: '0.875rem', color: '#6b7280' }}>{usuario.email}</td>
                      <td>
                        <span className={`badge-status ${usuario.is_active ? 'activo' : 'inactivo'}`}>
                          {usuario.is_active ? '✓ Activo' : '✕ Inactivo'}
                        </span>
                      </td>
                      <td>
                        <div style={{ display: 'flex', gap: '0.5rem' }}>
                          <button
                            className="btn-icon edit"
                            onClick={() => handleOpenModal(usuario)}
                            title="Editar"
                          >
                            ✏️
                          </button>
                          <button
                            className="btn-icon delete"
                            onClick={() => handleDelete(usuario.id)}
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
        {isLoading && usuarios.length > 0 && (
          <div className="loading-overlay">
            <div className="spinner-small"></div>
          </div>
        )}

        {/* Modal */}
        {showModal && (
          <div className="modal-overlay-moderna" onClick={() => setShowModal(false)}>
            <div className="modal-content-moderna" onClick={(e) => e.stopPropagation()}>
              <div className="modal-header-moderna">
                <h3>{editingUsuario ? '✏️ Editar Usuario' : '➕ Nuevo Usuario'}</h3>
                <button onClick={() => setShowModal(false)} className="close-btn-moderna">
                  ✕
                </button>
              </div>

              <form onSubmit={handleSubmit}>
                {!editingUsuario && (
                  <div className="form-group-moderna">
                    <label>Nombre de Usuario *</label>
                    <input
                      type="text"
                      value={formData.username}
                      onChange={(e) => setFormData({ ...formData, username: e.target.value })}
                      required
                      placeholder="usuario123"
                      disabled={!!editingUsuario}
                    />
                    <small style={{color: '#7f8c8d', fontSize: '0.85rem'}}>
                      El nombre de usuario no puede cambiarse después
                    </small>
                  </div>
                )}

                <div className="form-group-moderna">
                  <label>Nombre Completo *</label>
                  <input
                    type="text"
                    value={formData.full_name}
                    onChange={(e) => setFormData({ ...formData, full_name: e.target.value })}
                    required
                    placeholder="Juan Pérez García"
                  />
                </div>

                <div className="form-group-moderna">
                  <label>Email *</label>
                  <input
                    type="email"
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    required
                    placeholder="correo@ejemplo.com"
                  />
                </div>

                <div className="form-group-moderna">
                  <label>Rol *</label>
                  <select
                    value={formData.role}
                    onChange={(e) => setFormData({ ...formData, role: e.target.value as UserRole })}
                    required
                  >
                    <option value={UserRole.FISCAL}>⚖️ Fiscal</option>
                    <option value={UserRole.PERITO}>👨‍⚕️ Perito</option>
                    <option value={UserRole.ASISTENTE_ADMINISTRATIVO}>📋 Asistente Administrativo</option>
                    <option value={UserRole.ADMIN}>👑 Administrador</option>
                  </select>
                </div>

                <div className="form-group-moderna">
                  <label>Distrito Fiscal</label>
                  <select
                    value={formData.distrito_fiscal_id || ''}
                    onChange={(e) => setFormData({ ...formData, distrito_fiscal_id: e.target.value ? parseInt(e.target.value) : undefined })}
                  >
                    <option value="">Sin asignar</option>
                    {distritos.map((distrito) => (
                      <option key={distrito.id} value={distrito.id}>
                        {distrito.nombre} ({distrito.codigo})
                      </option>
                    ))}
                  </select>
                  <small style={{color: '#7f8c8d', fontSize: '0.85rem'}}>
                    Los usuarios solo verán datos de su distrito fiscal asignado
                  </small>
                </div>

                <div className="form-group-moderna">
                  <label>
                    Contraseña {editingUsuario ? '(dejar vacío para no cambiar)' : '*'}
                  </label>
                  <input
                    type="password"
                    value={formData.password}
                    onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                    required={!editingUsuario}
                    placeholder="••••••••"
                    minLength={6}
                  />
                  <small style={{color: '#7f8c8d', fontSize: '0.85rem'}}>
                    Mínimo 6 caracteres
                  </small>
                </div>

                <div className="form-group-moderna">
                  <label className="checkbox-label">
                    <input
                      type="checkbox"
                      checked={formData.is_active}
                      onChange={(e) => setFormData({ ...formData, is_active: e.target.checked })}
                    />
                    Usuario Activo
                  </label>
                </div>

                {error && <div className="error-message">{error}</div>}

                <div className="modal-actions-moderna">
                  <button type="button" className="btn-cancelar" onClick={() => setShowModal(false)}>
                    Cancelar
                  </button>
                  <button type="submit" className="btn-guardar">
                    {editingUsuario ? '💾 Actualizar' : '➕ Crear'}
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

export default UsuariosMantenimiento;
