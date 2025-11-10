/**
 * Servicio para consumir endpoints de estadísticas
 */
import api from './api';

export interface ResumenGeneral {
  total_solicitudes: number;
  solicitudes_pendientes: number;
  solicitudes_aprobadas: number;
  solicitudes_rechazadas: number;
  total_programaciones: number;
  programaciones_mes: number;
  programaciones_programadas: number;
  programaciones_realizadas: number;
  tasa_realizacion: number;
  total_salas: number;
  total_peritos: number;
}

export interface SolicitudesPorMes {
  mes: string;
  total: number;
  pendientes: number;
  aprobadas: number;
  rechazadas: number;
}

export interface ProgramacionesPorPerito {
  perito: string;
  total: number;
  realizadas: number;
}

export interface OcupacionSala {
  sala: string;
  total_programaciones: number;
  realizadas: number;
  tasa_ocupacion: number;
}

export interface SolicitudesPorDespacho {
  despacho: string;
  total: number;
  pendientes: number;
  aprobadas: number;
}

export interface EstadisticasPerito {
  total_citas: number;
  citas_realizadas: number;
  citas_proximas: number;
  citas_mes: number;
  tasa_realizacion: number;
}

export interface EstadisticasFiscal {
  total_solicitudes: number;
  pendientes: number;
  aprobadas: number;
  rechazadas: number;
  solicitudes_mes: number;
  tasa_aprobacion: number;
}

class EstadisticasService {
  private baseURL = '/api/v1/estadisticas';

  async getResumenGeneral(): Promise<ResumenGeneral> {
    const response = await api.get<ResumenGeneral>(`${this.baseURL}/resumen-general`);
    return response.data;
  }

  async getSolicitudesPorMes(meses: number = 6): Promise<SolicitudesPorMes[]> {
    const response = await api.get<SolicitudesPorMes[]>(`${this.baseURL}/solicitudes-por-mes`, {
      params: { meses }
    });
    return response.data;
  }

  async getProgramacionesPorPerito(): Promise<ProgramacionesPorPerito[]> {
    const response = await api.get<ProgramacionesPorPerito[]>(`${this.baseURL}/programaciones-por-perito`);
    return response.data;
  }

  async getOcupacionSalas(): Promise<OcupacionSala[]> {
    const response = await api.get<OcupacionSala[]>(`${this.baseURL}/ocupacion-salas`);
    return response.data;
  }

  async getSolicitudesPorDespacho(): Promise<SolicitudesPorDespacho[]> {
    const response = await api.get<SolicitudesPorDespacho[]>(`${this.baseURL}/solicitudes-por-despacho`);
    return response.data;
  }

  async getEstadisticasPerito(): Promise<EstadisticasPerito> {
    const response = await api.get<EstadisticasPerito>(`${this.baseURL}/estadisticas-perito`);
    return response.data;
  }

  async getEstadisticasFiscal(): Promise<EstadisticasFiscal> {
    const response = await api.get<EstadisticasFiscal>(`${this.baseURL}/estadisticas-fiscal`);
    return response.data;
  }
}

export const estadisticasService = new EstadisticasService();
