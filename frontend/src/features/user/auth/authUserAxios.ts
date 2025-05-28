import axios, { AxiosInstance, InternalAxiosRequestConfig } from 'axios';
import { API_PATHS } from '@/config/paths';

// Extendemos la interfaz para añadir propiedad _retry
declare module 'axios' {
  interface InternalAxiosRequestConfig {
    _retry?: boolean;
  }
}

const userApi: AxiosInstance = axios.create({
  baseURL: API_PATHS.base,
  headers: {
    'Content-Type': 'application/json',
  },
  // withCredentials: true, // Para manejar cookies HttpOnly en producción
});

/**
 * Intenta refrescar el token de acceso usando el refresh token
 */
async function refreshUserToken(): Promise<string | null> {
  const refreshToken = localStorage.getItem('userRefreshToken');
  if (!refreshToken){
    console.error('No se ha encontrado el token de refresco.');
    return null;
  }
  try {
    const response = await userApi.post(`${API_PATHS.users}/token/refresh/`, {
      refresh: refreshToken
    });
    
    const newAccessToken = response.data.access;
    localStorage.setItem('userToken', newAccessToken);
    return newAccessToken;
  } catch (error) {
    console.error('Error refreshing token:', error);
    localStorage.removeItem('userToken');
    localStorage.removeItem('userRefreshToken');
    window.location.reload();
    return null;
  }
}

// Interceptor para añadir token a las peticiones
userApi.interceptors.request.use(
  (config: InternalAxiosRequestConfig) => {
    const token = localStorage.getItem('userToken');
    if (token && !config.headers?.Authorization) {
      config.headers = config.headers || {};
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Interceptor para manejar errores de autenticación
userApi.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;
    
    // Si es error 401 y no es una petición de refresh
    if (error.response?.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true;
      
      try {
        const newToken = await refreshUserToken();
        if (newToken) {
          originalRequest.headers.Authorization = `Bearer ${newToken}`;
          return userApi(originalRequest);
        }
      } catch (refreshError) {
        console.error('Refresh token failed:', refreshError);
      }
      
      // Si llegamos aquí, el refresh falló - redirigir a login
      // if (typeof window !== 'undefined') {
      //   window.location.href = '/login';
      // }
    }   

    return Promise.reject(error);
  }
);

export const authUserAxios = userApi;
