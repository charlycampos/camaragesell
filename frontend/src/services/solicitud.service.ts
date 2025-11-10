/**
 * Servicio de Solicitudes
 */
import api from './api';
import { Solicitud, SolicitudCreate, SolicitudEnriched } from '../types';

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
   * Obtiene todas las solicitudes con datos enriquecidos (nombres en lugar de IDs)
   */
  async getAllEnriched(skip = 0, limit = 100): Promise<SolicitudEnriched[]> {
    const response = await api.get<SolicitudEnriched[]>('/api/v1/solicitudes/enriched', {
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
   * Obtiene las solicitudes pendientes con datos enriquecidos
   */
  async getPendientesEnriched(): Promise<SolicitudEnriched[]> {
    const response = await api.get<SolicitudEnriched[]>('/api/v1/solicitudes/enriched/pendientes/list');
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
   * Obtiene una solicitud por ID con datos enriquecidos
   */
  async getByIdEnriched(id: number): Promise<SolicitudEnriched> {
    const response = await api.get<SolicitudEnriched>(`/api/v1/solicitudes/enriched/${id}`);
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

  /**
   * Búsqueda avanzada con filtros y paginación
   */
  async searchAdvanced(params: {
    page?: number;
    page_size?: number;
    search?: string;
    estado?: string;
    despacho_fiscal_id?: number;
    tipo_diligencia?: string;
    fecha_desde?: string;
    fecha_hasta?: string;
    sort_by?: string;
    sort_order?: string;
  }): Promise<{
    items: SolicitudEnriched[];
    total: number;
    page: number;
    page_size: number;
    total_pages: number;
  }> {
    const response = await api.get('/api/v1/solicitudes/search/advanced', { params });
    return response.data;
  },
};

export default solicitudService;
