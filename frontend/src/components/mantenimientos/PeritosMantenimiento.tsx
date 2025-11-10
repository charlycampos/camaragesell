/**
 * CRUD de Peritos - Tarjetas de Perfil Profesional 👨‍⚕️
 */
import { useState, useEffect } from 'react';
import { Layout } from '../layout/Layout';
import { peritoService } from '../../services/mantenimiento.service';
import { Perito } from '../../types';
import './MantenimientoModerno.css';

export const PeritosMantenimiento = () => {
  const [peritos, setPeritos] = useState<Perito[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editingPerito, setEditingPerito] = useState<Perito | null>(null);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const [formData, setFormData] = useState({
    nombres: '',
    apellidos: '',
    especialidad: '',
    colegiatura: '',
    telefono: '',
    email: '',
    is_active: true,
    user_id: undefined as number | undefined,
  });

  useEffect(() => {
    loadPeritos();
  }, []);

  const loadPeritos = async () => {
    try {
      const data = await peritoService.getAll();
      setPeritos(data);
    } catch (err: any) {
      setError('Error al cargar peritos');
    } finally {
      setIsLoading(false);
    }
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

  const getInitials = (nombres: string, apellidos: string) => {
    return `${nombres.charAt(0)}${apellidos.charAt(0)}`.toUpperCase();
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

        {/* Grid de Tarjetas de Perfil */}
        {peritos.length === 0 ? (
          <div className="empty-state-moderna">
            <div className="empty-icon">👨‍⚕️</div>
            <h3>No hay peritos registrados</h3>
            <p>Comienza agregando tu primer perito</p>
            <button className="btn-agregar" onClick={() => handleOpenModal()}>
              ➕ Crear Primer Perito
            </button>
          </div>
        ) : (
          <div className="cards-grid">
            {peritos.map((perito) => (
              <div key={perito.id} className="card-moderna">
                {/* Avatar con iniciales */}
                <div className="card-avatar" style={{
                  fontSize: '2rem',
                  fontWeight: 'bold',
                  color: 'white'
                }}>
                  {getInitials(perito.nombres, perito.apellidos)}
                </div>

                <div className="card-header-moderna" style={{textAlign: 'center'}}>
                  <h3 className="card-title">
                    {perito.nombres} {perito.apellidos}
                  </h3>
                  <p className="card-subtitle">
                    {perito.especialidad || 'Psicólogo Forense'}
                  </p>
                </div>

                <div className="card-body-moderna">
                  {perito.colegiatura && (
                    <div className="info-item">
                      <span className="info-icon">🎓</span>
                      <div className="info-content">
                        <span className="info-label">Colegiatura</span>
                        <span className="info-value">{perito.colegiatura}</span>
                      </div>
                    </div>
                  )}

                  {perito.telefono && (
                    <div className="info-item">
                      <span className="info-icon">📱</span>
                      <div className="info-content">
                        <span className="info-label">Teléfono</span>
                        <span className="info-value">{perito.telefono}</span>
                      </div>
                    </div>
                  )}

                  {perito.email && (
                    <div className="info-item">
                      <span className="info-icon">✉️</span>
                      <div className="info-content">
                        <span className="info-label">Email</span>
                        <span className="info-value" style={{
                          fontSize: '0.85rem',
                          wordBreak: 'break-word'
                        }}>
                          {perito.email}
                        </span>
                      </div>
                    </div>
                  )}

                  <div className="info-item">
                    <span className="info-icon">📍</span>
                    <div className="info-content">
                      <span className="info-label">Estado</span>
                      <span className={`badge-status ${perito.is_active ? 'activo' : 'inactivo'}`}>
                        {perito.is_active ? '✓ Activo' : '✕ Inactivo'}
                      </span>
                    </div>
                  </div>
                </div>

                <div className="card-actions">
                  <button
                    className="btn-icon edit"
                    onClick={() => handleOpenModal(perito)}
                  >
                    ✏️ Editar
                  </button>
                  <button
                    className="btn-icon delete"
                    onClick={() => handleDelete(perito.id)}
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
