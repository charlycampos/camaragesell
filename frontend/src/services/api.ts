/**
 * Servicio de API para comunicación con el backend
 * Actualizado para usar cookies httpOnly en lugar de localStorage
 * Con manejo robusto de errores y timeouts
 */
import axios, { AxiosError } from 'axios';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000';

export const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
  withCredentials: true, // IMPORTANTE: Permite enviar y recibir cookies
  timeout: 30000, // Timeout de 30 segundos para evitar colgadas
});

// Interceptor para agregar indicador de carga
let requestsInProgress = 0;

api.interceptors.request.use(
  (config) => {
    requestsInProgress++;
    return config;
  },
  (error) => {
    requestsInProgress--;
    return Promise.reject(error);
  }
);

// Interceptor para manejar errores de forma profesional
api.interceptors.response.use(
  (response) => {
    requestsInProgress--;
    return response;
  },
  (error: AxiosError) => {
    requestsInProgress--;

    // Construir mensaje de error amigable
    let errorMessage = 'Error inesperado. Por favor intente nuevamente.';

    if (error.code === 'ECONNABORTED' || error.code === 'ERR_NETWORK') {
      errorMessage = 'No se pudo conectar con el servidor. Verifique su conexión a internet.';
    } else if (error.code === 'ERR_CANCELED') {
      errorMessage = 'La operación fue cancelada debido a timeout. El servidor tardó demasiado en responder.';
    } else if (error.response) {
      // El servidor respondió con un código de error
      const status = error.response.status;
      const data: any = error.response.data;

      switch (status) {
        case 400:
          errorMessage = data?.detail || 'Datos inválidos. Por favor revise la información ingresada.';
          break;
        case 401:
          errorMessage = 'Sesión expirada. Por favor inicie sesión nuevamente.';
          localStorage.removeItem('user');
          window.location.href = '/login';
          break;
        case 403:
          errorMessage = data?.detail || 'No tiene permisos para realizar esta acción.';
          break;
        case 404:
          errorMessage = data?.detail || 'El recurso solicitado no fue encontrado.';
          break;
        case 409:
          errorMessage = data?.detail || 'Conflicto con el estado actual del recurso.';
          break;
        case 422:
          errorMessage = data?.detail || 'Error de validación. Verifique los datos ingresados.';
          break;
        case 500:
          errorMessage = 'Error interno del servidor. Por favor contacte al administrador.';
          console.error('Error 500:', data);
          break;
        case 502:
        case 503:
        case 504:
          errorMessage = 'El servidor no está disponible temporalmente. Por favor intente más tarde.';
          break;
        default:
          errorMessage = data?.detail || `Error del servidor (${status}). Por favor intente nuevamente.`;
      }
    } else if (error.request) {
      // La petición fue hecha pero no hubo respuesta
      errorMessage = 'No se recibió respuesta del servidor. Verifique su conexión.';
    }

    // Agregar el mensaje amigable al error
    error.message = errorMessage;

    return Promise.reject(error);
  }
);

export const isLoading = () => requestsInProgress > 0;

export default api;
