/**
 * CRUD de Sedes (Administrador)
 */
import { useState, useEffect } from 'react';
import { Layout } from '../layout/Layout';
import { sedeService } from '../../services/mantenimiento.service';
import { Sede } from '../../types';
import './Mantenimiento.css';

export const SedesMantenimiento = () => {
  const [sedes, setSedes] = useState<Sede[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editingSede, setEditingSede] = useState<Sede | null>(null);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const [formData, setFormData] = useState({
    nombre: '',
    direccion: '',
    telefono: '',
    is_active: true,
  });

  useEffect(() => {
    loadSedes();
  }, []);

  const loadSedes = async () => {
    try {
      const data = await sedeService.getAll();
      setSedes(data);
    } catch (err: any) {
      setError('Error al cargar sedes');
    } finally {
      setIsLoading(false);
    }
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
        setSuccess('Sede actualizada exitosamente');
      } else {
        await sedeService.create(formData);
        setSuccess('Sede creada exitosamente');
      }
      setShowModal(false);
      await loadSedes();
      setTimeout(() => setSuccess(''), 3000);
    } catch (err: any) {
      setError(err.response?.data?.detail || 'Error al guardar sede');
    }
  };

  const handleDelete = async (id: number) => {
    if (!confirm('¿Estás seguro de eliminar esta sede?')) return;

    try {
      await sedeService.delete(id);
      setSuccess('Sede eliminada exitosamente');
      await loadSedes();
      setTimeout(() => setSuccess(''), 3000);
    } catch (err: any) {
      setError(err.response?.data?.detail || 'Error al eliminar sede');
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
      <div className="mantenimiento">
        <div className="header-section">
          <div>
            <h1>Gestión de Sedes</h1>
            <p>Administra las sedes del Instituto de Medicina Legal</p>
          </div>
          <button className="btn-primary" onClick={() => handleOpenModal()}>
            + Nueva Sede
          </button>
        </div>

        {success && <div className="success-message">{success}</div>}
        {error && <div className="error-message">{error}</div>}

        <div className="table-container">
          <table>
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
                  <td>{sede.direccion || '-'}</td>
                  <td>{sede.telefono || '-'}</td>
                  <td>
                    <span className={`estado-badge ${sede.is_active ? 'activo' : 'inactivo'}`}>
                      {sede.is_active ? 'Activo' : 'Inactivo'}
                    </span>
                  </td>
                  <td>
                    <div className="action-buttons">
                      <button
                        className="btn-edit"
                        onClick={() => handleOpenModal(sede)}
                      >
                        Editar
                      </button>
                      <button
                        className="btn-delete"
                        onClick={() => handleDelete(sede.id)}
                      >
                        Eliminar
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {showModal && (
          <div className="modal-overlay" onClick={() => setShowModal(false)}>
            <div className="modal-content" onClick={(e) => e.stopPropagation()}>
              <div className="modal-header">
                <h3>{editingSede ? 'Editar Sede' : 'Nueva Sede'}</h3>
                <button onClick={() => setShowModal(false)} className="close-btn">×</button>
              </div>

              <form onSubmit={handleSubmit}>
                <div className="form-group">
                  <label>Nombre *</label>
                  <input
                    type="text"
                    value={formData.nombre}
                    onChange={(e) => setFormData({ ...formData, nombre: e.target.value })}
                    required
                    placeholder="Nombre de la sede"
                  />
                </div>

                <div className="form-group">
                  <label>Dirección</label>
                  <input
                    type="text"
                    value={formData.direccion}
                    onChange={(e) => setFormData({ ...formData, direccion: e.target.value })}
                    placeholder="Dirección completa"
                  />
                </div>

                <div className="form-group">
                  <label>Teléfono</label>
                  <input
                    type="text"
                    value={formData.telefono}
                    onChange={(e) => setFormData({ ...formData, telefono: e.target.value })}
                    placeholder="Teléfono de contacto"
                  />
                </div>

                <div className="form-group">
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

                <div className="modal-actions">
                  <button type="button" className="btn-secondary" onClick={() => setShowModal(false)}>
                    Cancelar
                  </button>
                  <button type="submit" className="btn-primary">
                    {editingSede ? 'Actualizar' : 'Crear'}
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
