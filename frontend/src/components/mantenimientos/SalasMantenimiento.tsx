/**
 * CRUD de Salas - Diseño Moderno e Impactante 🎨
 */
import { useState, useEffect } from 'react';
import { Layout } from '../layout/Layout';
import { salaService, sedeService } from '../../services/mantenimiento.service';
import { Sala, Sede } from '../../types';
import './MantenimientoModerno.css';

export const SalasMantenimiento = () => {
  const [salas, setSalas] = useState<Sala[]>([]);
  const [sedes, setSedes] = useState<Sede[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editingSala, setEditingSala] = useState<Sala | null>(null);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

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

  const loadData = async () => {
    try {
      const [salasData, sedesData] = await Promise.all([
        salaService.getAll(),
        sedeService.getAll(),
      ]);
      setSalas(salasData);
      setSedes(sedesData.filter(s => s.is_active));
    } catch (err: any) {
      setError('Error al cargar datos');
    } finally {
      setIsLoading(false);
    }
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
      await loadData();
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
      await loadData();
      setTimeout(() => setSuccess(''), 3000);
    } catch (err: any) {
      setError(err.response?.data?.detail || 'Error al eliminar sala');
    }
  };

  const getSedeName = (sedeId: number) => {
    return sedes.find(s => s.id === sedeId)?.nombre || 'N/A';
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

        {/* Grid de Tarjetas */}
        {salas.length === 0 ? (
          <div className="empty-state-moderna">
            <div className="empty-icon">🏢</div>
            <h3>No hay salas registradas</h3>
            <p>Comienza agregando tu primera sala</p>
            <button className="btn-agregar" onClick={() => handleOpenModal()}>
              ➕ Crear Primera Sala
            </button>
          </div>
        ) : (
          <div className="cards-grid">
            {salas.map((sala) => (
              <div key={sala.id} className="card-moderna">
                <div className="card-avatar">🏢</div>

                <div className="card-header-moderna">
                  <h3 className="card-title">{sala.nombre}</h3>
                  <p className="card-subtitle">{getSedeName(sala.sede_id)}</p>
                </div>

                <div className="card-body-moderna">
                  <div className="info-item">
                    <span className="info-icon">👥</span>
                    <div className="info-content">
                      <span className="info-label">Capacidad</span>
                      <span className="info-value">
                        {sala.capacidad ? `${sala.capacidad} personas` : 'No especificada'}
                      </span>
                    </div>
                  </div>

                  {sala.equipamiento && (
                    <div className="info-item">
                      <span className="info-icon">🔧</span>
                      <div className="info-content">
                        <span className="info-label">Equipamiento</span>
                        <span className="info-value">{sala.equipamiento}</span>
                      </div>
                    </div>
                  )}

                  <div className="info-item">
                    <span className="info-icon">📍</span>
                    <div className="info-content">
                      <span className="info-label">Estado</span>
                      <span className={`badge-status ${sala.is_active ? 'activo' : 'inactivo'}`}>
                        {sala.is_active ? '✓ Activa' : '✕ Inactiva'}
                      </span>
                    </div>
                  </div>
                </div>

                <div className="card-actions">
                  <button
                    className="btn-icon edit"
                    onClick={() => handleOpenModal(sala)}
                  >
                    ✏️ Editar
                  </button>
                  <button
                    className="btn-icon delete"
                    onClick={() => handleDelete(sala.id)}
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
