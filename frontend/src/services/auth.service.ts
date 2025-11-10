/**
 * Servicio de Autenticación
 */
import api from './api';
import { LoginRequest, Token, User } from '../types';

export const authService = {
  /**
   * Login con usuario y contraseña
   */
  async login(credentials: LoginRequest): Promise<Token> {
    const formData = new FormData();
    formData.append('username', credentials.username);
    formData.append('password', credentials.password);

    const response = await api.post<Token>('/api/v1/auth/login', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });

    // Guardar token en localStorage
    if (response.data.access_token) {
      localStorage.setItem('access_token', response.data.access_token);
    }

    return response.data;
  },

  /**
   * Obtiene información del usuario actual
   */
  async getCurrentUser(): Promise<User> {
    const response = await api.get<User>('/api/v1/auth/me');

    // Guardar usuario en localStorage
    localStorage.setItem('user', JSON.stringify(response.data));

    return response.data;
  },

  /**
   * Logout - limpia localStorage y redirige
   */
  logout(): void {
    localStorage.removeItem('access_token');
    localStorage.removeItem('user');
    window.location.href = '/login';
  },

  /**
   * Verifica si el usuario está autenticado
   */
  isAuthenticated(): boolean {
    return !!localStorage.getItem('access_token');
  },

  /**
   * Obtiene el usuario guardado en localStorage
   */
  getStoredUser(): User | null {
    const userStr = localStorage.getItem('user');
    if (!userStr) return null;
    try {
      return JSON.parse(userStr) as User;
    } catch {
      return null;
    }
  },
};

export default authService;
