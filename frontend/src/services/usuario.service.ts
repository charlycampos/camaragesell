/**
 * Servicio de Usuarios
 */
import api from './api';
import { User } from '../types';

interface UserCreate {
  username: string;
  email: string;
  full_name: string;
  role: string;
  password: string;
  is_active?: boolean;
}

interface UserUpdate {
  email?: string;
  full_name?: string;
  role?: string;
  password?: string;
  is_active?: boolean;
}

export const usuarioService = {
  async getAll(): Promise<User[]> {
    const response = await api.get<User[]>('/api/v1/usuarios/');
    return response.data;
  },

  async getById(id: number): Promise<User> {
    const response = await api.get<User>(`/api/v1/usuarios/${id}`);
    return response.data;
  },

  async create(data: UserCreate): Promise<User> {
    const response = await api.post<User>('/api/v1/usuarios/', data);
    return response.data;
  },

  async update(id: number, data: UserUpdate): Promise<User> {
    const response = await api.put<User>(`/api/v1/usuarios/${id}`, data);
    return response.data;
  },

  async delete(id: number): Promise<void> {
    await api.delete(`/api/v1/usuarios/${id}`);
  },

  async searchAdvanced(params: {
    page?: number;
    page_size?: number;
    search?: string;
    role?: string;
    is_active?: boolean;
    sort_by?: string;
    sort_order?: string;
  }): Promise<{
    items: User[];
    total: number;
    page: number;
    page_size: number;
    total_pages: number;
  }> {
    const response = await api.get('/api/v1/usuarios/search/advanced', { params });
    return response.data;
  }
};

export default usuarioService;
