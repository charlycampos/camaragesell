/**
 * Calendario de Programación (Asistente Administrativo)
 */
import { useState, useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import { Layout } from '../layout/Layout';
import { programacionService } from '../../services/programacion.service';
import { salaService, peritoService } from '../../services/mantenimiento.service';
import { Programacion, Sala, Perito, Solicitud, ProgramacionCreate } from '../../types';
import { format, startOfMonth, endOfMonth, eachDayOfInterval, isSameDay, addMonths, subMonths } from 'date-fns';
import './CalendarioProgramacion.css';

export const CalendarioProgramacion = () => {
  const location = useLocation();
  const solicitudPreseleccionada = location.state?.solicitud as Solicitud | undefined;

  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [programaciones, setProgramaciones] = useState<Programacion[]>([]);
  const [salas, setSalas] = useState<Sala[]>([]);
  const [peritos, setPeritos] = useState<Perito[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [showModal, setShowModal] = useState(!!solicitudPreseleccionada);
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const [formData, setFormData] = useState<ProgramacionCreate>({
    fecha_hora: '',
    duracion_minutos: 60,
    solicitud_id: solicitudPreseleccionada?.id || 0,
    sala_id: 0,
    perito_id: 0,
  });

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      const [progData, salasData, peritosData] = await Promise.all([
        programacionService.getAll(),
        salaService.getAll(),
        peritoService.getAll(),
      ]);
      setProgramaciones(progData);
      setSalas(salasData.filter(s => s.is_active));
      setPeritos(peritosData.filter(p => p.is_active));
    } catch (err: any) {
      setError('Error al cargar datos');
    } finally {
      setIsLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    try {
      await programacionService.create(formData);
      setSuccess('Programación creada exitosamente');
      setShowModal(false);
      await loadData();
      setTimeout(() => setSuccess(''), 3000);
    } catch (err: any) {
      setError(err.response?.data?.detail || 'Error al crear programación');
    }
  };

  const handleDateClick = (date: Date) => {
    setSelectedDate(date);
    setFormData(prev => ({
      ...prev,
      fecha_hora: format(date, "yyyy-MM-dd'T'09:00"),
    }));
    setShowModal(true);
  };

  const daysInMonth = eachDayOfInterval({
    start: startOfMonth(currentMonth),
    end: endOfMonth(currentMonth),
  });

  const getProgramacionesForDay = (date: Date) => {
    return programaciones.filter(p =>
      isSameDay(new Date(p.fecha_hora), date)
    );
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
      <div className="calendario-programacion">
        <div className="header-section">
          <h1>Calendario de Programación</h1>
          <p>Programa las citas en el calendario</p>
        </div>

        {success && <div className="success-message">{success}</div>}
        {error && !showModal && <div className="error-message">{error}</div>}

        <div className="calendar-controls">
          <button onClick={() => setCurrentMonth(subMonths(currentMonth, 1))}>
            ← Anterior
          </button>
          <h2>{format(currentMonth, 'MMMM yyyy')}</h2>
          <button onClick={() => setCurrentMonth(addMonths(currentMonth, 1))}>
            Siguiente →
          </button>
        </div>

        <div className="calendar-grid">
          <div className="calendar-header">
            <div>Lun</div>
            <div>Mar</div>
            <div>Mié</div>
            <div>Jue</div>
            <div>Vie</div>
            <div>Sáb</div>
            <div>Dom</div>
          </div>
          <div className="calendar-days">
            {daysInMonth.map((day) => {
              const programacionesDay = getProgramacionesForDay(day);
              return (
                <div
                  key={day.toISOString()}
                  className={`calendar-day ${programacionesDay.length > 0 ? 'has-events' : ''}`}
                  onClick={() => handleDateClick(day)}
                >
                  <div className="day-number">{format(day, 'd')}</div>
                  <div className="day-events">
                    {programacionesDay.slice(0, 3).map((prog) => (
                      <div key={prog.id} className="event-dot" title={`Programación #${prog.id}`}>
                        •
                      </div>
                    ))}
                    {programacionesDay.length > 3 && <div className="more-events">+{programacionesDay.length - 3}</div>}
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {showModal && (
          <div className="modal-overlay" onClick={() => setShowModal(false)}>
            <div className="modal-content" onClick={(e) => e.stopPropagation()}>
              <div className="modal-header">
                <h3>Nueva Programación</h3>
                <button onClick={() => setShowModal(false)} className="close-btn">×</button>
              </div>

              <form onSubmit={handleSubmit}>
                <div className="form-group">
                  <label>Fecha y Hora *</label>
                  <input
                    type="datetime-local"
                    value={formData.fecha_hora}
                    onChange={(e) => setFormData({ ...formData, fecha_hora: e.target.value })}
                    required
                  />
                </div>

                <div className="form-group">
                  <label>Sala *</label>
                  <select
                    value={formData.sala_id}
                    onChange={(e) => setFormData({ ...formData, sala_id: parseInt(e.target.value) })}
                    required
                  >
                    <option value="">Seleccione sala</option>
                    {salas.map(sala => (
                      <option key={sala.id} value={sala.id}>
                        {sala.nombre}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="form-group">
                  <label>Perito *</label>
                  <select
                    value={formData.perito_id}
                    onChange={(e) => setFormData({ ...formData, perito_id: parseInt(e.target.value) })}
                    required
                  >
                    <option value="">Seleccione perito</option>
                    {peritos.map(perito => (
                      <option key={perito.id} value={perito.id}>
                        {perito.nombres} {perito.apellidos}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="form-group">
                  <label>Duración (minutos) *</label>
                  <input
                    type="number"
                    value={formData.duracion_minutos}
                    onChange={(e) => setFormData({ ...formData, duracion_minutos: parseInt(e.target.value) })}
                    min="15"
                    max="240"
                    step="15"
                    required
                  />
                </div>

                {error && <div className="error-message">{error}</div>}

                <div className="modal-actions">
                  <button type="button" className="btn-secondary" onClick={() => setShowModal(false)}>
                    Cancelar
                  </button>
                  <button type="submit" className="btn-primary">
                    Programar
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

export default CalendarioProgramacion;
