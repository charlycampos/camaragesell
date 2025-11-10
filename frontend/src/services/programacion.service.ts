/**
 * Servicio de Programaciones
 */
import api from './api';
import { Programacion, ProgramacionCreate, ProgramacionEnriched, Documento, DocumentoCreate } from '../types';

export const programacionService = {
  /**
   * Obtiene todas las programaciones
   */
  async getAll(skip = 0, limit = 100): Promise<Programacion[]> {
    const response = await api.get<Programacion[]>('/api/v1/programaciones/', {
      params: { skip, limit },
    });
    return response.data;
  },

  /**
   * Obtiene todas las programaciones con datos enriquecidos
   */
  async getAllEnriched(skip = 0, limit = 100): Promise<ProgramacionEnriched[]> {
    const response = await api.get<ProgramacionEnriched[]>('/api/v1/programaciones/enriched', {
      params: { skip, limit },
    });
    return response.data;
  },

  /**
   * Obtiene las citas del perito actual
   */
  async getMisCitas(): Promise<Programacion[]> {
    const response = await api.get<Programacion[]>('/api/v1/programaciones/mis-citas');
    return response.data;
  },

  /**
   * Obtiene las citas del perito actual con datos enriquecidos
   */
  async getMisCitasEnriched(): Promise<ProgramacionEnriched[]> {
    const response = await api.get<ProgramacionEnriched[]>('/api/v1/programaciones/enriched/mis-citas/list');
    return response.data;
  },

  /**
   * Obtiene una programación por ID con datos enriquecidos
   */
  async getByIdEnriched(id: number): Promise<ProgramacionEnriched> {
    const response = await api.get<ProgramacionEnriched>(`/api/v1/programaciones/enriched/${id}`);
    return response.data;
  },

  /**
   * Crea una nueva programación
   */
  async create(data: ProgramacionCreate): Promise<Programacion> {
    const response = await api.post<Programacion>('/api/v1/programaciones/', data);
    return response.data;
  },

  /**
   * Actualiza una programación
   */
  async update(id: number, data: Partial<ProgramacionCreate>): Promise<Programacion> {
    const response = await api.put<Programacion>(`/api/v1/programaciones/${id}`, data);
    return response.data;
  },

  /**
   * Registra un documento (dictamen) para una programación
   */
  async registrarDocumento(programacionId: number, data: DocumentoCreate): Promise<Documento> {
    const response = await api.post<Documento>(
      `/api/v1/programaciones/${programacionId}/documentos`,
      data
    );
    return response.data;
  },
};

export default programacionService;
