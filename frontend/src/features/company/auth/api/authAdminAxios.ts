import axios, { AxiosInstance, AxiosError, InternalAxiosRequestConfig, AxiosResponse } from "axios";
import { API_PATHS } from "@/config/paths";

// Extendemos la interfaz para añadir _retry
declare module 'axios' {
  interface InternalAxiosRequestConfig {
    _retry?: boolean;
  }
}

const api: AxiosInstance = axios.create({
  baseURL: API_PATHS.base,
  headers: {
    "Content-Type": "application/json",
  },
});

async function refreshAccessToken(): Promise<string> {
  const refresh = localStorage.getItem("adminRefreshToken");

  try {
    const { data } = await api.post("/api/token/refresh/", { refresh });
    localStorage.setItem("adminToken", data.access);
    return data.access;
  } catch (error) {
    throw new Error("No se pudo refrescar el token. "+error);
  }
}

// Interceptor para añadir token - ahora usando InternalAxiosRequestConfig
api.interceptors.request.use(
  (config: InternalAxiosRequestConfig): InternalAxiosRequestConfig => {
    const token = localStorage.getItem("adminToken");
    if (token) {
      config.headers = config.headers || {};
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Interceptor para manejar errores 401
api.interceptors.response.use(
  (response: AxiosResponse) => response,
  async (error: AxiosError) => {
    const originalRequest = error.config as InternalAxiosRequestConfig & { _retry?: boolean };
    
    if (error.response?.status === 401 && originalRequest && !originalRequest._retry) {
      originalRequest._retry = true;
      
      try {
        const newToken = await refreshAccessToken();
        originalRequest.headers = originalRequest.headers || {};
        originalRequest.headers.Authorization = `Bearer ${newToken}`;
        return api(originalRequest);
      } catch (refreshError) {
        console.error("Refresh fallido o sesión caducada, cerrando sesión", refreshError);
        localStorage.removeItem("adminToken");
        localStorage.removeItem("adminRefreshToken");
        localStorage.removeItem("adminUsername");
        window.location.href = "./admin-login";
        return Promise.reject(refreshError);
      }
    }
    
    return Promise.reject(error);
  }
);

export const authAxios = api;