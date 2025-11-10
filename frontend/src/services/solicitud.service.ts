/**
 * Servicio de Solicitudes
 */
import api from './api';
import { Solicitud, SolicitudCreate } from '../types';

export const solicitudService = {
  /**
   * Obtiene todas las solicitudes del usuario actual
   */
  async getAll(skip = 0, limit = 100): Promise<Solicitud[]> {
    const response = await api.get<Solicitud[]>('/api/v1/solicitudes/', {
      params: { skip, limit },
    });
    return response.data;
  },

  /**
   * Obtiene las solicitudes pendientes (asistente)
   */
  async getPendientes(): Promise<Solicitud[]> {
    const response = await api.get<Solicitud[]>('/api/v1/solicitudes/pendientes');
    return response.data;
  },

  /**
   * Obtiene una solicitud por ID
   */
  async getById(id: number): Promise<Solicitud> {
    const response = await api.get<Solicitud>(`/api/v1/solicitudes/${id}`);
    return response.data;
  },

  /**
   * Crea una nueva solicitud
   */
  async create(data: SolicitudCreate): Promise<Solicitud> {
    const response = await api.post<Solicitud>('/api/v1/solicitudes/', data);
    return response.data;
  },

  /**
   * Actualiza una solicitud
   */
  async update(id: number, data: Partial<SolicitudCreate>): Promise<Solicitud> {
    const response = await api.put<Solicitud>(`/api/v1/solicitudes/${id}`, data);
    return response.data;
  },
};

export default solicitudService;
