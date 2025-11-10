/**
 * CRUD de Despachos Fiscales - Diseño Gubernamental ⚖️
 */
import { useState, useEffect } from 'react';
import { Layout } from '../layout/Layout';
import { despachoService } from '../../services/mantenimiento.service';
import { DespachoFiscal } from '../../types';
import './MantenimientoModerno.css';

export const DespachosMantenimiento = () => {
  const [despachos, setDespachos] = useState<DespachoFiscal[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editingDespacho, setEditingDespacho] = useState<DespachoFiscal | null>(null);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

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
  }, []);

  const loadDespachos = async () => {
    try {
      const data = await despachoService.getAll();
      setDespachos(data);
    } catch (err: any) {
      setError('Error al cargar despachos');
    } finally {
      setIsLoading(false);
    }
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

        {/* Grid de Tarjetas */}
        {despachos.length === 0 ? (
          <div className="empty-state-moderna">
            <div className="empty-icon">⚖️</div>
            <h3>No hay despachos registrados</h3>
            <p>Comienza agregando el primer despacho fiscal</p>
            <button className="btn-agregar" onClick={() => handleOpenModal()}>
              ➕ Crear Primer Despacho
            </button>
          </div>
        ) : (
          <div className="cards-grid">
            {despachos.map((despacho) => (
              <div key={despacho.id} className="card-moderna">
                {/* Icono gubernamental */}
                <div className="card-avatar">⚖️</div>

                <div className="card-header-moderna">
                  <h3 className="card-title" style={{fontSize: '1.25rem'}}>
                    {despacho.nombre}
                  </h3>
                  {despacho.distrito && (
                    <p className="card-subtitle">📍 {despacho.distrito}</p>
                  )}
                </div>

                <div className="card-body-moderna">
                  {despacho.fiscal_titular && (
                    <div className="info-item">
                      <span className="info-icon">👤</span>
                      <div className="info-content">
                        <span className="info-label">Fiscal Titular</span>
                        <span className="info-value">{despacho.fiscal_titular}</span>
                      </div>
                    </div>
                  )}

                  {despacho.direccion && (
                    <div className="info-item">
                      <span className="info-icon">📮</span>
                      <div className="info-content">
                        <span className="info-label">Dirección</span>
                        <span className="info-value" style={{fontSize: '0.9rem'}}>
                          {despacho.direccion}
                        </span>
                      </div>
                    </div>
                  )}

                  {despacho.telefono && (
                    <div className="info-item">
                      <span className="info-icon">📞</span>
                      <div className="info-content">
                        <span className="info-label">Teléfono</span>
                        <span className="info-value">{despacho.telefono}</span>
                      </div>
                    </div>
                  )}

                  <div className="info-item">
                    <span className="info-icon">📍</span>
                    <div className="info-content">
                      <span className="info-label">Estado</span>
                      <span className={`badge-status ${despacho.is_active ? 'activo' : 'inactivo'}`}>
                        {despacho.is_active ? '✓ Activo' : '✕ Inactivo'}
                      </span>
                    </div>
                  </div>
                </div>

                <div className="card-actions">
                  <button
                    className="btn-icon edit"
                    onClick={() => handleOpenModal(despacho)}
                  >
                    ✏️ Editar
                  </button>
                  <button
                    className="btn-icon delete"
                    onClick={() => handleDelete(despacho.id)}
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
