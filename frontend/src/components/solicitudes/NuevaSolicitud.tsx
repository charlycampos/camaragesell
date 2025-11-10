/**
 * Formulario para crear nueva solicitud (Fiscal)
 */
import { useState, useEffect, FormEvent } from 'react';
import { useNavigate } from 'react-router-dom';
import { Layout } from '../layout/Layout';
import { solicitudService } from '../../services/solicitud.service';
import { despachoService } from '../../services/mantenimiento.service';
import { SolicitudCreate, DespachoFiscal } from '../../types';
import './NuevaSolicitud.css';

export const NuevaSolicitud = () => {
  const navigate = useNavigate();
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);
  const [despachos, setDespachos] = useState<DespachoFiscal[]>([]);

  const [formData, setFormData] = useState<SolicitudCreate>({
    numero_caso: '',
    tipo_diligencia: '',
    nombre_evaluado: '',
    edad_evaluado: undefined,
    observaciones: '',
    despacho_fiscal_id: 0,
  });

  useEffect(() => {
    loadDespachos();
  }, []);

  const loadDespachos = async () => {
    try {
      const data = await despachoService.getAll();
      setDespachos(data.filter(d => d.is_active));
    } catch (err) {
      console.error('Error cargando despachos:', err);
    }
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);

    try {
      await solicitudService.create(formData);
      setSuccess(true);
      setTimeout(() => {
        navigate('/solicitudes/mis-solicitudes');
      }, 2000);
    } catch (err: any) {
      setError(err.response?.data?.detail || 'Error al crear la solicitud');
    } finally {
      setIsLoading(false);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: name === 'edad_evaluado' || name === 'despacho_fiscal_id'
        ? (value ? parseInt(value) : undefined)
        : value,
    }));
  };

  if (success) {
    return (
      <Layout>
        <div className="success-container">
          <div className="success-card">
            <h2>✓ Solicitud Creada Exitosamente</h2>
            <p>Su solicitud ha sido registrada y está en estado pendiente.</p>
            <p>Será redirigido a sus solicitudes...</p>
          </div>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="nueva-solicitud">
        <h1>Nueva Solicitud de Cita</h1>
        <p>Complete el formulario para solicitar una cita en Cámara Gesell</p>

        <form onSubmit={handleSubmit} className="form-container">
          <div className="form-row">
            <div className="form-group">
              <label htmlFor="numero_caso">Número de Caso *</label>
              <input
                type="text"
                id="numero_caso"
                name="numero_caso"
                value={formData.numero_caso}
                onChange={handleChange}
                required
                placeholder="Ej: 2025-001-LIMA"
              />
            </div>

            <div className="form-group">
              <label htmlFor="despacho_fiscal_id">Despacho Fiscal *</label>
              <select
                id="despacho_fiscal_id"
                name="despacho_fiscal_id"
                value={formData.despacho_fiscal_id}
                onChange={handleChange}
                required
              >
                <option value="">Seleccione un despacho</option>
                {despachos.map(despacho => (
                  <option key={despacho.id} value={despacho.id}>
                    {despacho.nombre}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="form-row">
            <div className="form-group">
              <label htmlFor="tipo_diligencia">Tipo de Diligencia *</label>
              <select
                id="tipo_diligencia"
                name="tipo_diligencia"
                value={formData.tipo_diligencia}
                onChange={handleChange}
                required
              >
                <option value="">Seleccione tipo</option>
                <option value="Entrevista Única">Entrevista Única</option>
                <option value="Evaluación Psicológica">Evaluación Psicológica</option>
                <option value="Cámara Gesell">Cámara Gesell</option>
                <option value="Pericia Psicológica">Pericia Psicológica</option>
                <option value="Otro">Otro</option>
              </select>
            </div>

            <div className="form-group">
              <label htmlFor="nombre_evaluado">Nombre del Evaluado *</label>
              <input
                type="text"
                id="nombre_evaluado"
                name="nombre_evaluado"
                value={formData.nombre_evaluado}
                onChange={handleChange}
                required
                placeholder="Nombre completo"
              />
            </div>
          </div>

          <div className="form-row">
            <div className="form-group">
              <label htmlFor="edad_evaluado">Edad del Evaluado</label>
              <input
                type="number"
                id="edad_evaluado"
                name="edad_evaluado"
                value={formData.edad_evaluado || ''}
                onChange={handleChange}
                min="0"
                max="120"
                placeholder="Edad en años"
              />
            </div>
          </div>

          <div className="form-group">
            <label htmlFor="observaciones">Observaciones</label>
            <textarea
              id="observaciones"
              name="observaciones"
              value={formData.observaciones}
              onChange={handleChange}
              rows={4}
              placeholder="Información adicional relevante para la diligencia..."
            />
          </div>

          {error && <div className="error-message">{error}</div>}

          <div className="form-actions">
            <button
              type="button"
              className="btn-secondary"
              onClick={() => navigate('/dashboard/fiscal')}
              disabled={isLoading}
            >
              Cancelar
            </button>
            <button type="submit" className="btn-primary" disabled={isLoading}>
              {isLoading ? 'Creando...' : 'Crear Solicitud'}
            </button>
          </div>
        </form>
      </div>
    </Layout>
  );
};

export default NuevaSolicitud;
