/**
 * Servicio de Autenticación
 * Actualizado para usar cookies httpOnly en lugar de localStorage
 */
import api from './api';
import { LoginRequest, Token, User } from '../types';

export const authService = {
  /**
   * Login con usuario y contraseña
   * El token se establece automáticamente como cookie httpOnly desde el servidor
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

    // El token se maneja automáticamente como cookie
    // No lo guardamos en localStorage por seguridad
    return response.data;
  },

  /**
   * Obtiene información del usuario actual
   */
  async getCurrentUser(): Promise<User> {
    const response = await api.get<User>('/api/v1/auth/me');

    // Guardar solo datos del usuario (no token) en localStorage para acceso rápido
    localStorage.setItem('user', JSON.stringify(response.data));

    return response.data;
  },

  /**
   * Logout - llama al endpoint de logout y limpia datos locales
   */
  async logout(): Promise<void> {
    try {
      // Llamar al endpoint de logout para limpiar la cookie
      await api.post('/api/v1/auth/logout');
    } catch (error) {
      console.error('Error durante logout:', error);
    } finally {
      // Limpiar datos locales
      localStorage.removeItem('user');
      window.location.href = '/login';
    }
  },

  /**
   * Verifica si el usuario está autenticado
   * Intentamos obtener el usuario actual para verificar si hay cookie válida
   */
  async isAuthenticated(): Promise<boolean> {
    try {
      await this.getCurrentUser();
      return true;
    } catch {
      return false;
    }
  },

  /**
   * Obtiene el usuario guardado en localStorage (solo para lectura rápida)
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
