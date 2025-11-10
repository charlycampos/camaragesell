/**
 * CRUD de Usuarios - Panel de Administración 👥
 */
import { useState, useEffect } from 'react';
import { Layout } from '../layout/Layout';
import { usuarioService } from '../../services/usuario.service';
import { User, UserRole } from '../../types';
import './MantenimientoModerno.css';

export const UsuariosMantenimiento = () => {
  const [usuarios, setUsuarios] = useState<User[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editingUsuario, setEditingUsuario] = useState<User | null>(null);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const [formData, setFormData] = useState({
    username: '',
    email: '',
    full_name: '',
    role: UserRole.FISCAL,
    password: '',
    is_active: true,
  });

  useEffect(() => {
    loadUsuarios();
  }, []);

  const loadUsuarios = async () => {
    try {
      const data = await usuarioService.getAll();
      setUsuarios(data);
    } catch (err: any) {
      setError('Error al cargar usuarios');
    } finally {
      setIsLoading(false);
    }
  };

  const handleOpenModal = (usuario?: User) => {
    if (usuario) {
      setEditingUsuario(usuario);
      setFormData({
        username: usuario.username,
        email: usuario.email,
        full_name: usuario.full_name,
        role: usuario.role,
        password: '', // No mostramos la contraseña
        is_active: usuario.is_active,
      });
    } else {
      setEditingUsuario(null);
      setFormData({
        username: '',
        email: '',
        full_name: '',
        role: UserRole.FISCAL,
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
        // Al editar, solo enviar contraseña si se proporcionó una nueva
        const updateData: any = {
          email: formData.email,
          full_name: formData.full_name,
          role: formData.role,
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
      setError(err.response?.data?.detail || 'Error al guardar usuario');
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
      setError(err.response?.data?.detail || 'Error al eliminar usuario');
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

  const getRoleColor = (role: UserRole) => {
    switch (role) {
      case UserRole.ADMIN:
        return 'linear-gradient(135deg, #e74c3c 0%, #c0392b 100%)';
      case UserRole.ASISTENTE_ADMINISTRATIVO:
        return 'linear-gradient(135deg, #3498db 0%, #2980b9 100%)';
      case UserRole.PERITO:
        return 'linear-gradient(135deg, #27ae60 0%, #229954 100%)';
      case UserRole.FISCAL:
        return 'linear-gradient(135deg, #f39c12 0%, #e67e22 100%)';
      default:
        return 'linear-gradient(135deg, #95a5a6 0%, #7f8c8d 100%)';
    }
  };

  if (isLoading) {
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
        {/* Header Impactante */}
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

        {/* Grid de Tarjetas */}
        {usuarios.length === 0 ? (
          <div className="empty-state-moderna">
            <div className="empty-icon">👥</div>
            <h3>No hay usuarios registrados</h3>
            <p>Comienza agregando el primer usuario</p>
            <button className="btn-agregar" onClick={() => handleOpenModal()}>
              ➕ Crear Primer Usuario
            </button>
          </div>
        ) : (
          <div className="cards-grid">
            {usuarios.map((usuario) => (
              <div key={usuario.id} className="card-moderna">
                {/* Avatar con gradiente según rol */}
                <div className="card-avatar" style={{
                  background: getRoleColor(usuario.role),
                  fontSize: '2.5rem'
                }}>
                  {getRoleIcon(usuario.role)}
                </div>

                <div className="card-header-moderna" style={{textAlign: 'center'}}>
                  <h3 className="card-title">{usuario.full_name}</h3>
                  <p className="card-subtitle">@{usuario.username}</p>
                </div>

                <div className="card-body-moderna">
                  <div className="info-item">
                    <span className="info-icon">🎭</span>
                    <div className="info-content">
                      <span className="info-label">Rol</span>
                      <span className="info-value">{getRoleLabel(usuario.role)}</span>
                    </div>
                  </div>

                  <div className="info-item">
                    <span className="info-icon">✉️</span>
                    <div className="info-content">
                      <span className="info-label">Email</span>
                      <span className="info-value" style={{
                        fontSize: '0.85rem',
                        wordBreak: 'break-word'
                      }}>
                        {usuario.email}
                      </span>
                    </div>
                  </div>

                  <div className="info-item">
                    <span className="info-icon">📍</span>
                    <div className="info-content">
                      <span className="info-label">Estado</span>
                      <span className={`badge-status ${usuario.is_active ? 'activo' : 'inactivo'}`}>
                        {usuario.is_active ? '✓ Activo' : '✕ Inactivo'}
                      </span>
                    </div>
                  </div>
                </div>

                <div className="card-actions">
                  <button
                    className="btn-icon edit"
                    onClick={() => handleOpenModal(usuario)}
                  >
                    ✏️ Editar
                  </button>
                  <button
                    className="btn-icon delete"
                    onClick={() => handleDelete(usuario.id)}
                  >
                    🗑️ Eliminar
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Modal Moderno */}
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
