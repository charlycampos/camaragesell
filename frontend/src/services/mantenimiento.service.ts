/**
 * Servicio de Mantenimientos (Sedes, Salas, Peritos, Despachos)
 */
import api from './api';
import { Sede, Sala, Perito, DespachoFiscal } from '../types';

// Servicio de Sedes
export const sedeService = {
  async getAll(): Promise<Sede[]> {
    const response = await api.get<Sede[]>('/api/v1/sedes/');
    return response.data;
  },

  async getById(id: number): Promise<Sede> {
    const response = await api.get<Sede>(`/api/v1/sedes/${id}`);
    return response.data;
  },

  async create(data: Omit<Sede, 'id' | 'created_at' | 'updated_at'>): Promise<Sede> {
    const response = await api.post<Sede>('/api/v1/sedes/', data);
    return response.data;
  },

  async update(id: number, data: Partial<Sede>): Promise<Sede> {
    const response = await api.put<Sede>(`/api/v1/sedes/${id}`, data);
    return response.data;
  },

  async delete(id: number): Promise<void> {
    await api.delete(`/api/v1/sedes/${id}`);
  },

  async searchAdvanced(params: {
    page?: number;
    page_size?: number;
    search?: string;
    is_active?: boolean;
    sort_by?: string;
    sort_order?: string;
  }): Promise<{
    items: Sede[];
    total: number;
    page: number;
    page_size: number;
    total_pages: number;
  }> {
    const response = await api.get('/api/v1/sedes/search/advanced', { params });
    return response.data;
  }
};

// Servicio de Salas
export const salaService = {
  async getAll(): Promise<Sala[]> {
    const response = await api.get<Sala[]>('/api/v1/salas/');
    return response.data;
  },

  async getById(id: number): Promise<Sala> {
    const response = await api.get<Sala>(`/api/v1/salas/${id}`);
    return response.data;
  },

  async create(data: Omit<Sala, 'id' | 'created_at' | 'updated_at'>): Promise<Sala> {
    const response = await api.post<Sala>('/api/v1/salas/', data);
    return response.data;
  },

  async update(id: number, data: Partial<Sala>): Promise<Sala> {
    const response = await api.put<Sala>(`/api/v1/salas/${id}`, data);
    return response.data;
  },

  async delete(id: number): Promise<void> {
    await api.delete(`/api/v1/salas/${id}`);
  },

  async searchAdvanced(params: {
    page?: number;
    page_size?: number;
    search?: string;
    sede_id?: number;
    is_active?: boolean;
    sort_by?: string;
    sort_order?: string;
  }): Promise<{
    items: Sala[];
    total: number;
    page: number;
    page_size: number;
    total_pages: number;
  }> {
    const response = await api.get('/api/v1/salas/search/advanced', { params });
    return response.data;
  }
};

// Servicio de Peritos
export const peritoService = {
  async getAll(): Promise<Perito[]> {
    const response = await api.get<Perito[]>('/api/v1/peritos/');
    return response.data;
  },

  async getById(id: number): Promise<Perito> {
    const response = await api.get<Perito>(`/api/v1/peritos/${id}`);
    return response.data;
  },

  async create(data: Omit<Perito, 'id' | 'created_at' | 'updated_at'>): Promise<Perito> {
    const response = await api.post<Perito>('/api/v1/peritos/', data);
    return response.data;
  },

  async update(id: number, data: Partial<Perito>): Promise<Perito> {
    const response = await api.put<Perito>(`/api/v1/peritos/${id}`, data);
    return response.data;
  },

  async delete(id: number): Promise<void> {
    await api.delete(`/api/v1/peritos/${id}`);
  },

  async searchAdvanced(params: {
    page?: number;
    page_size?: number;
    search?: string;
    especialidad?: string;
    is_active?: boolean;
    sort_by?: string;
    sort_order?: string;
  }): Promise<{
    items: Perito[];
    total: number;
    page: number;
    page_size: number;
    total_pages: number;
  }> {
    const response = await api.get('/api/v1/peritos/search/advanced', { params });
    return response.data;
  }
};

// Servicio de Despachos Fiscales
export const despachoService = {
  async getAll(): Promise<DespachoFiscal[]> {
    const response = await api.get<DespachoFiscal[]>('/api/v1/despachos/');
    return response.data;
  },

  async getById(id: number): Promise<DespachoFiscal> {
    const response = await api.get<DespachoFiscal>(`/api/v1/despachos/${id}`);
    return response.data;
  },

  async create(data: Omit<DespachoFiscal, 'id' | 'created_at' | 'updated_at'>): Promise<DespachoFiscal> {
    const response = await api.post<DespachoFiscal>('/api/v1/despachos/', data);
    return response.data;
  },

  async update(id: number, data: Partial<DespachoFiscal>): Promise<DespachoFiscal> {
    const response = await api.put<DespachoFiscal>(`/api/v1/despachos/${id}`, data);
    return response.data;
  },

  async delete(id: number): Promise<void> {
    await api.delete(`/api/v1/despachos/${id}`);
  },

  async searchAdvanced(params: {
    page?: number;
    page_size?: number;
    search?: string;
    distrito?: string;
    is_active?: boolean;
    sort_by?: string;
    sort_order?: string;
  }): Promise<{
    items: DespachoFiscal[];
    total: number;
    page: number;
    page_size: number;
    total_pages: number;
  }> {
    const response = await api.get('/api/v1/despachos/search/advanced', { params });
    return response.data;
  }
};
