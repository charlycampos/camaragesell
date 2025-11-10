/**
 * CALENDARIO AVANZADO - Sistema visual de programación de citas
 * Con FullCalendar, drag & drop, vistas múltiples y datos enriquecidos
 */
import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import FullCalendar from '@fullcalendar/react';
import dayGridPlugin from '@fullcalendar/daygrid';
import timeGridPlugin from '@fullcalendar/timegrid';
import interactionPlugin from '@fullcalendar/interaction';
import listPlugin from '@fullcalendar/list';
import esLocale from '@fullcalendar/core/locales/es';
import { EventClickArg, EventDropArg, DateSelectArg } from '@fullcalendar/core';

import { Layout } from '../layout/Layout';
import { programacionService } from '../../services/programacion.service';
import { ProgramacionEnriched, EstadoProgramacion } from '../../types';
import StatusBadge from '../common/StatusBadge';
import './CalendarioAvanzado.css';

export const CalendarioAvanzado = () => {
  const navigate = useNavigate();
  const calendarRef = useRef<any>(null);

  const [programaciones, setProgramaciones] = useState<ProgramacionEnriched[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');
  const [selectedProgramacion, setSelectedProgramacion] = useState<ProgramacionEnriched | null>(null);
  const [showModal, setShowModal] = useState(false);
  const [currentView, setCurrentView] = useState('dayGridMonth');

  useEffect(() => {
    loadProgramaciones();
  }, []);

  const loadProgramaciones = async () => {
    try {
      const data = await programacionService.getAllEnriched();
      setProgramaciones(data);
    } catch (err: any) {
      setError(err.response?.data?.detail || 'Error al cargar programaciones');
    } finally {
      setIsLoading(false);
    }
  };

  // Convertir programaciones a eventos de FullCalendar
  const eventos = programaciones.map((prog) => {
    const startDate = new Date(prog.fecha_hora);
    const endDate = new Date(startDate.getTime() + prog.duracion_minutos * 60000);

    return {
      id: prog.id.toString(),
      title: `${prog.solicitud.numero_caso} - ${prog.solicitud.nombre_evaluado}`,
      start: startDate,
      end: endDate,
      backgroundColor: getColorByEstado(prog.estado),
      borderColor: getBorderColorByEstado(prog.estado),
      extendedProps: {
        programacion: prog
      }
    };
  });

  // Colores según estado
  function getColorByEstado(estado: EstadoProgramacion): string {
    switch (estado) {
      case EstadoProgramacion.PROGRAMADA:
        return '#3498db';
      case EstadoProgramacion.REALIZADA:
        return '#27ae60';
      case EstadoProgramacion.REPROGRAMADA:
        return '#f39c12';
      case EstadoProgramacion.CANCELADA:
        return '#e74c3c';
      case EstadoProgramacion.NO_ASISTIO:
        return '#95a5a6';
      default:
        return '#95a5a6';
    }
  }

  function getBorderColorByEstado(estado: EstadoProgramacion): string {
    switch (estado) {
      case EstadoProgramacion.PROGRAMADA:
        return '#2980b9';
      case EstadoProgramacion.REALIZADA:
        return '#229954';
      case EstadoProgramacion.REPROGRAMADA:
        return '#d68910';
      case EstadoProgramacion.CANCELADA:
        return '#c0392b';
      case EstadoProgramacion.NO_ASISTIO:
        return '#7f8c8d';
      default:
        return '#7f8c8d';
    }
  }

  // Manejar click en evento
  const handleEventClick = (clickInfo: EventClickArg) => {
    const prog = clickInfo.event.extendedProps.programacion as ProgramacionEnriched;
    setSelectedProgramacion(prog);
    setShowModal(true);
  };

  // Manejar drag & drop (reprogramación)
  const handleEventDrop = async (dropInfo: EventDropArg) => {
    const programacionId = parseInt(dropInfo.event.id);
    const newDate = dropInfo.event.start;

    if (!newDate) return;

    try {
      await programacionService.update(programacionId, {
        fecha_hora: newDate.toISOString()
      });

      // Recargar programaciones
      await loadProgramaciones();

      // Mostrar mensaje de éxito
      alert('✅ Cita reprogramada exitosamente');
    } catch (err: any) {
      console.error('Error al reprogramar:', err);
      alert('❌ Error al reprogramar la cita');
      // Revertir el cambio visual
      dropInfo.revert();
    }
  };

  // Manejar selección de rango (crear nueva programación)
  const handleDateSelect = (selectInfo: DateSelectArg) => {
    const calendarApi = selectInfo.view.calendar;
    calendarApi.unselect(); // Limpiar selección

    // Navegar a crear programación con la fecha seleccionada
    navigate('/programacion/nueva', {
      state: {
        fechaInicial: selectInfo.start
      }
    });
  };

  // Cambiar vista
  const changeView = (viewName: string) => {
    if (calendarRef.current) {
      const calendarApi = calendarRef.current.getApi();
      calendarApi.changeView(viewName);
      setCurrentView(viewName);
    }
  };

  // Navegación
  const goToday = () => {
    if (calendarRef.current) {
      const calendarApi = calendarRef.current.getApi();
      calendarApi.today();
    }
  };

  const goNext = () => {
    if (calendarRef.current) {
      const calendarApi = calendarRef.current.getApi();
      calendarApi.next();
    }
  };

  const goPrev = () => {
    if (calendarRef.current) {
      const calendarApi = calendarRef.current.getApi();
      calendarApi.prev();
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
      <div className="calendario-avanzado">
        {/* Header con controles */}
        <div className="calendario-header">
          <div className="header-title">
            <h1>📅 Calendario de Programaciones</h1>
            <p>Sistema avanzado de visualización y gestión de citas</p>
          </div>

          {/* Controles de navegación */}
          <div className="calendario-controles">
            <button className="btn-control" onClick={goPrev}>
              ⬅️ Anterior
            </button>
            <button className="btn-control btn-today" onClick={goToday}>
              📍 Hoy
            </button>
            <button className="btn-control" onClick={goNext}>
              Siguiente ➡️
            </button>
          </div>

          {/* Selector de vistas */}
          <div className="vista-selector">
            <button
              className={`btn-vista ${currentView === 'dayGridMonth' ? 'active' : ''}`}
              onClick={() => changeView('dayGridMonth')}
            >
              📆 Mes
            </button>
            <button
              className={`btn-vista ${currentView === 'timeGridWeek' ? 'active' : ''}`}
              onClick={() => changeView('timeGridWeek')}
            >
              📊 Semana
            </button>
            <button
              className={`btn-vista ${currentView === 'timeGridDay' ? 'active' : ''}`}
              onClick={() => changeView('timeGridDay')}
            >
              📋 Día
            </button>
            <button
              className={`btn-vista ${currentView === 'listWeek' ? 'active' : ''}`}
              onClick={() => changeView('listWeek')}
            >
              📝 Agenda
            </button>
          </div>
        </div>

        {error && (
          <div className="error-message-modern">
            <span className="error-icon">⚠️</span>
            <span>{error}</span>
          </div>
        )}

        {/* Leyenda de colores */}
        <div className="calendario-leyenda">
          <h3>Estado de Citas:</h3>
          <div className="leyenda-items">
            <div className="leyenda-item">
              <div className="leyenda-color" style={{ backgroundColor: '#3498db' }}></div>
              <span>📅 Programada</span>
            </div>
            <div className="leyenda-item">
              <div className="leyenda-color" style={{ backgroundColor: '#27ae60' }}></div>
              <span>✔️ Realizada</span>
            </div>
            <div className="leyenda-item">
              <div className="leyenda-color" style={{ backgroundColor: '#f39c12' }}></div>
              <span>🔄 Reprogramada</span>
            </div>
            <div className="leyenda-item">
              <div className="leyenda-color" style={{ backgroundColor: '#e74c3c' }}></div>
              <span>🚫 Cancelada</span>
            </div>
            <div className="leyenda-item">
              <div className="leyenda-color" style={{ backgroundColor: '#95a5a6' }}></div>
              <span>⚠️ No Asistió</span>
            </div>
          </div>
        </div>

        {/* Calendario FullCalendar */}
        <div className="calendario-container">
          <FullCalendar
            ref={calendarRef}
            plugins={[dayGridPlugin, timeGridPlugin, interactionPlugin, listPlugin]}
            initialView="dayGridMonth"
            locale={esLocale}
            headerToolbar={false} // Usamos nuestro propio header
            events={eventos}
            eventClick={handleEventClick}
            eventDrop={handleEventDrop}
            select={handleDateSelect}
            selectable={true}
            editable={true}
            droppable={true}
            dayMaxEvents={true}
            height="auto"
            slotMinTime="07:00:00"
            slotMaxTime="19:00:00"
            allDaySlot={false}
            nowIndicator={true}
            eventTimeFormat={{
              hour: '2-digit',
              minute: '2-digit',
              hour12: false
            }}
          />
        </div>

        {/* Modal de detalle */}
        {showModal && selectedProgramacion && (
          <div className="modal-overlay" onClick={() => setShowModal(false)}>
            <div className="modal-content-calendario" onClick={(e) => e.stopPropagation()}>
              <div className="modal-header-calendario">
                <h2>📋 Detalle de Programación</h2>
                <button className="btn-close-modal" onClick={() => setShowModal(false)}>
                  ✕
                </button>
              </div>

              <div className="modal-body-calendario">
                {/* Estado */}
                <div className="detalle-section">
                  <StatusBadge
                    status={selectedProgramacion.estado}
                    type="programacion"
                    size="large"
                  />
                </div>

                {/* Información de la solicitud */}
                <div className="detalle-section">
                  <h3>📑 Solicitud</h3>
                  <div className="detalle-grid">
                    <div className="detalle-item">
                      <label>Número de Caso</label>
                      <p className="value-highlight">{selectedProgramacion.solicitud.numero_caso}</p>
                    </div>
                    <div className="detalle-item">
                      <label>Tipo de Diligencia</label>
                      <p>{selectedProgramacion.solicitud.tipo_diligencia}</p>
                    </div>
                    <div className="detalle-item">
                      <label>Evaluado</label>
                      <p className="value-highlight">{selectedProgramacion.solicitud.nombre_evaluado}</p>
                    </div>
                    {selectedProgramacion.solicitud.edad_evaluado && (
                      <div className="detalle-item">
                        <label>Edad</label>
                        <p>{selectedProgramacion.solicitud.edad_evaluado} años</p>
                      </div>
                    )}
                    <div className="detalle-item">
                      <label>Despacho Fiscal</label>
                      <p>{selectedProgramacion.solicitud.despacho_fiscal_nombre}</p>
                    </div>
                  </div>
                </div>

                {/* Fecha y hora */}
                <div className="detalle-section">
                  <h3>🕒 Fecha y Hora</h3>
                  <div className="detalle-grid">
                    <div className="detalle-item">
                      <label>Fecha</label>
                      <p className="value-highlight">
                        {new Date(selectedProgramacion.fecha_hora).toLocaleDateString('es-ES', {
                          weekday: 'long',
                          year: 'numeric',
                          month: 'long',
                          day: 'numeric'
                        })}
                      </p>
                    </div>
                    <div className="detalle-item">
                      <label>Hora de Inicio</label>
                      <p>{selectedProgramacion.hora_inicio}</p>
                    </div>
                    <div className="detalle-item">
                      <label>Hora de Fin</label>
                      <p>{selectedProgramacion.hora_fin}</p>
                    </div>
                    <div className="detalle-item">
                      <label>Duración</label>
                      <p>{selectedProgramacion.duracion_minutos} minutos</p>
                    </div>
                  </div>
                </div>

                {/* Sala y Perito */}
                <div className="detalle-section">
                  <h3>🏢 Ubicación y Personal</h3>
                  <div className="detalle-grid">
                    <div className="detalle-item">
                      <label>Sala</label>
                      <p className="value-highlight">{selectedProgramacion.sala.nombre}</p>
                    </div>
                    <div className="detalle-item">
                      <label>Sede</label>
                      <p>{selectedProgramacion.sala.sede_nombre}</p>
                    </div>
                    <div className="detalle-item">
                      <label>Perito Asignado</label>
                      <p className="value-highlight">{selectedProgramacion.perito.nombre_completo}</p>
                    </div>
                    <div className="detalle-item">
                      <label>Especialidad</label>
                      <p>{selectedProgramacion.perito.especialidad || 'N/A'}</p>
                    </div>
                  </div>
                </div>

                {/* Notas */}
                {selectedProgramacion.notas && (
                  <div className="detalle-section">
                    <h3>📝 Notas</h3>
                    <p className="notas-text">{selectedProgramacion.notas}</p>
                  </div>
                )}
              </div>

              <div className="modal-footer-calendario">
                <button
                  className="btn-ver-solicitud"
                  onClick={() => navigate(`/solicitudes/${selectedProgramacion.solicitud.id}`)}
                >
                  📄 Ver Solicitud
                </button>
                <button
                  className="btn-editar"
                  onClick={() => navigate(`/programacion/${selectedProgramacion.id}`)}
                >
                  👁️ Ver Detalle Completo
                </button>
                <button className="btn-cerrar" onClick={() => setShowModal(false)}>
                  Cerrar
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </Layout>
  );
};

export default CalendarioAvanzado;
